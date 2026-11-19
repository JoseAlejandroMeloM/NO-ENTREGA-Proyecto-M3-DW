import mongoose from 'mongoose';
import type { AuthUser } from '../../middleware/auth';
import { CatalogItem } from '../../models/CatalogItem';
import { nextSeq } from '../../models/Counter';
import { Distributor } from '../../models/Distributor';
import { Product, type ProductDoc } from '../../models/Product';
import { PurchaseOrder, toOrderDto, type OrderStatus, type PurchaseOrderDoc } from '../../models/PurchaseOrder';
import { Rating } from '../../models/Rating';
import type { Role } from '../../models/roles';
import { Store } from '../../models/Store';
import { AppError, notFoundError } from '../../utils/errors';
import { escapeRegex } from '../catalog/service';
import { checkRestockAlerts } from '../insights/alerts';
import { notify } from '../notifications/service';
import { applyStock, checkLowStock } from '../products/stock';
import { dayRange, todayInBogota } from '../sales/time';
import type { CreateOrderInput, ListOrdersQuery, RatingInput, StatusInput, TrackingInput } from './schemas';

const DAY_MS = 24 * 60 * 60 * 1000;

const STORE_SIDE: Role[] = ['store_owner', 'store_inventory'];
const DISTRIBUTOR_SIDE: Role[] = ['distributor_owner', 'distributor_staff'];

/**
 * BR5 state machine as data: TRANSITIONS[current][next] = roles allowed.
 * Anything not listed is a 409 INVALID_TRANSITION (403 when the role is on the wrong side).
 */
export const TRANSITIONS: Partial<Record<OrderStatus, Partial<Record<OrderStatus, Role[]>>>> = {
  pending: { accepted: ['distributor_owner'], rejected: ['distributor_owner'], cancelled: STORE_SIDE },
  accepted: { shipped: DISTRIBUTOR_SIDE },
  shipped: { delivered: DISTRIBUTOR_SIDE },
};
const SIDE_OF: Record<OrderStatus, Role[]> = {
  pending: STORE_SIDE,
  accepted: DISTRIBUTOR_SIDE,
  rejected: DISTRIBUTOR_SIDE,
  shipped: DISTRIBUTOR_SIDE,
  delivered: DISTRIBUTOR_SIDE,
  cancelled: STORE_SIDE,
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'pending',
  accepted: 'accepted',
  rejected: 'rejected',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

/** Store users see their store's orders, distributor users the orders addressed to them. */
const scope = (user: AuthUser) =>
  user.orgType === 'store' ? { storeId: user.orgId } : { distributorId: user.orgId };

async function findOwn(user: AuthUser, id: string) {
  const order = await PurchaseOrder.findOne({ _id: id, ...scope(user) });
  if (!order) throw notFoundError('Order');
  return order;
}

const cop = (n: number) => `$ ${n.toLocaleString('es-CO')}`;
const conflict = (message: string) => new AppError(409, 'CONFLICT', message);

/** Tell the other organization; each side's link opens its own detail screen. */
function notifyOtherSide(order: PurchaseOrderDoc, actor: AuthUser, type: 'order_created' | 'order_status', title: string, body?: string) {
  const toStore = actor.orgType === 'distributor';
  return notify(
    toStore ? { orgId: order.storeId.toString(), roles: STORE_SIDE } : { orgId: order.distributorId.toString(), roles: DISTRIBUTOR_SIDE },
    { type, title, body, link: toStore ? `/app/orders/${order.id}` : `/dist/orders/${order.id}` },
  );
}

export async function create(user: AuthUser, input: CreateOrderInput) {
  const [distributor, store] = await Promise.all([Distributor.findById(input.distributor), Store.findById(user.orgId)]);
  if (!distributor) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid order', [{ path: 'distributor', message: 'Distributor not found' }]);
  }
  if (!store) throw notFoundError('Store');

  // Merge repeated lines so each catalog item appears once.
  const lines = new Map<string, { quantity: number; index: number }>();
  input.items.forEach((i, index) => {
    const line = lines.get(i.catalogItem);
    if (line) line.quantity += i.quantity;
    else lines.set(i.catalogItem, { quantity: i.quantity, index });
  });

  // Prices always come from the catalog; only available items of this distributor count.
  const catalog = await CatalogItem.find({
    _id: mongoose.trusted({ $in: [...lines.keys()] }),
    distributorId: distributor._id,
    available: true,
  });
  const byId = new Map(catalog.map((c) => [c.id as string, c]));
  const missing = [...lines].filter(([id]) => !byId.has(id));
  if (missing.length) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Some items are not available from this distributor',
      missing.map(([, l]) => ({ path: `items.${l.index}.catalogItem`, message: 'Item not available from this distributor' })),
    );
  }

  const items = [...lines].map(([id, l]) => {
    const c = byId.get(id)!;
    return {
      catalogItem: c._id,
      name: c.name,
      unit: c.unit,
      category: c.category,
      quantity: l.quantity,
      unitPrice: c.price,
      subtotal: c.price * l.quantity,
    };
  });
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  if (total < distributor.minimumOrder) {
    throw new AppError(
      400,
      'BELOW_MINIMUM_ORDER',
      `The total must be at least ${cop(distributor.minimumOrder)} for ${distributor.name}`,
      [{ path: 'items', message: `Total ${cop(total)} is below the minimum order of ${cop(distributor.minimumOrder)}` }],
    );
  }

  const order = await PurchaseOrder.create({
    code: `PO-${String(await nextSeq('purchaseOrder')).padStart(6, '0')}`,
    storeId: store._id,
    storeName: store.name,
    distributorId: distributor._id,
    distributorName: distributor.name,
    createdBy: user.id,
    items,
    total,
    note: input.note,
    statusHistory: [{ status: 'pending', at: new Date(), by: user.id, byName: user.name, note: input.note }],
  });
  await notifyOtherSide(order, user, 'order_created', `New order ${order.code} from ${store.name}`, `${items.length} item(s) · ${cop(total)}`);
  return toOrderDto(order);
}

export async function list(user: AuthUser, { page, limit, status }: ListOrdersQuery) {
  const filter: Record<string, unknown> = scope(user);
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    PurchaseOrder.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    PurchaseOrder.countDocuments(filter),
  ]);
  return { page, limit, total, data: items.map(toOrderDto) };
}

export const get = async (user: AuthUser, id: string) => toOrderDto(await findOwn(user, id));

/**
 * Estimated delivery set when accepting: the provided Bogota day (never in the past) or, by default,
 * today plus the distributor's delivery days. Stored as the start of that Bogota calendar day.
 */
async function estimateOnAccept(order: PurchaseOrderDoc, provided?: string) {
  const today = todayInBogota();
  if (provided) {
    if (provided < today) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid estimated delivery date', [
        { path: 'estimatedDelivery', message: 'The estimated delivery cannot be in the past' },
      ]);
    }
    return dayRange(provided).start;
  }
  const distributor = await Distributor.findById(order.distributorId);
  const days = distributor?.deliveryDays ?? 1;
  return new Date(dayRange(today).start.getTime() + days * DAY_MS);
}

export async function changeStatus(user: AuthUser, id: string, { status: next, note, estimatedDelivery }: StatusInput) {
  const order = await findOwn(user, id);
  const current = order.status as OrderStatus;
  const allowed = TRANSITIONS[current]?.[next];
  if (!allowed) {
    if (!SIDE_OF[next].includes(user.role)) throw new AppError(403, 'FORBIDDEN', 'Your role cannot set this status');
    throw new AppError(409, 'INVALID_TRANSITION', `An order that is ${current} cannot become ${next}`);
  }
  if (!allowed.includes(user.role)) throw new AppError(403, 'FORBIDDEN', 'Your role cannot set this status');

  const estimate = next === 'accepted' ? await estimateOnAccept(order, estimatedDelivery) : undefined;

  // Guarded update: matches only if nobody changed the status since we read it.
  const updated = await PurchaseOrder.findOneAndUpdate(
    { _id: order._id, status: current },
    {
      $set: {
        status: next,
        ...(next === 'rejected' ? { rejectReason: note } : {}),
        ...(estimate ? { estimatedDelivery: estimate } : {}),
      },
      $push: { statusHistory: { status: next, at: new Date(), by: user.id, byName: user.name, note } },
    },
    { new: true },
  );
  if (!updated) throw new AppError(409, 'INVALID_TRANSITION', 'The order changed meanwhile; reload and try again');

  await notifyOtherSide(updated, user, 'order_status', `Order ${updated.code} ${STATUS_LABEL[next]}`, note);
  return toOrderDto(updated);
}

/** Tracking notes (US tracking): distributor users annotate an accepted or shipped order; both sides see them. */
export async function addTracking(user: AuthUser, id: string, { text }: TrackingInput) {
  const order = await findOwn(user, id);
  const open = order.status === 'accepted' || order.status === 'shipped';
  if (!open) throw conflict('Tracking notes can be added only to accepted or shipped orders');

  // Guarded like a transition: a note cannot land on an order that has meanwhile left accepted/shipped.
  const updated = await PurchaseOrder.findOneAndUpdate(
    { _id: order._id, status: mongoose.trusted({ $in: ['accepted', 'shipped'] }) },
    { $push: { trackingNotes: { text, at: new Date(), by: user.id, byName: user.name } } },
    { new: true },
  );
  if (!updated) throw conflict('Tracking notes can be added only to accepted or shipped orders');

  await notifyOtherSide(updated, user, 'order_status', `Tracking update on ${updated.code}`, text);
  return toOrderDto(updated);
}

/** Matching product in the store (same name, case-insensitive) or a new one priced from the order (design.md). */
async function productFor(storeId: string, item: PurchaseOrderDoc['items'][number], code: string, n: number, session: mongoose.ClientSession) {
  const existing = await Product.findOne({
    storeId,
    active: true,
    name: mongoose.trusted({ $regex: `^${escapeRegex(item.name)}$`, $options: 'i' }),
  }).session(session);
  if (existing) return existing;
  const [created] = await Product.create(
    [
      {
        storeId,
        name: item.name,
        sku: `${code}-${n}`,
        category: item.category,
        unit: item.unit,
        price: Math.round(item.unitPrice * 1.3),
        cost: item.unitPrice,
        stock: 0,
        minStock: 0,
        lowStockNotified: true,
      },
    ],
    { session },
  );
  return created;
}

/** BR6: add the delivered quantities to stock exactly once, all or nothing. */
export async function receive(user: AuthUser, id: string) {
  const order = await findOwn(user, id);
  if (order.status !== 'delivered') throw conflict('Only delivered orders can be received');
  if (order.receivedAt) throw conflict('This order was already received');

  const session = await mongoose.startSession();
  let received!: PurchaseOrderDoc;
  let touched: ProductDoc[] = [];
  try {
    await session.withTransaction(async () => {
      touched = [];
      // The flag is set first and only once: a second call (or a concurrent one) matches nothing.
      const flagged = await PurchaseOrder.findOneAndUpdate(
        { _id: order._id, status: 'delivered', receivedAt: null },
        { $set: { receivedAt: new Date() } },
        { new: true, session },
      );
      if (!flagged) throw conflict('This order was already received');
      for (const [n, item] of flagged.items.entries()) {
        const product = await productFor(user.orgId, item, flagged.code, n + 1, session);
        touched.push(
          await applyStock(
            {
              storeId: user.orgId,
              productId: product.id as string,
              delta: item.quantity,
              type: 'order_received',
              userId: user.id,
              note: `Order ${flagged.code}`,
              reference: flagged.id as string,
            },
            { session },
          ),
        );
      }
      received = flagged;
    });
  } finally {
    await session.endSession();
  }
  // After commit: clears low-stock and restock-window flags of restocked products.
  await Promise.all(touched.map((p) => checkLowStock(p)));
  await checkRestockAlerts(touched).catch((err) => console.error('Restock alert check failed', (err as Error).message));
  return toOrderDto(received);
}

export async function rate(user: AuthUser, id: string, { stars, comment }: RatingInput) {
  const order = await findOwn(user, id);
  if (order.status !== 'delivered') throw conflict('Only delivered orders can be rated');
  const flagged = await PurchaseOrder.findOneAndUpdate({ _id: order._id, rated: false }, { $set: { rated: true } }, { new: true });
  if (!flagged) throw conflict('This order was already rated');

  await Rating.create({ orderId: order._id, storeId: order.storeId, distributorId: order.distributorId, stars, comment, userId: user.id });
  // Running average in one atomic update: avg' = (avg·count + stars) / (count + 1).
  await Distributor.updateOne({ _id: order.distributorId }, [
    {
      $set: {
        ratingAverage: {
          $divide: [{ $add: [{ $multiply: ['$ratingAverage', '$ratingCount'] }, stars] }, { $add: ['$ratingCount', 1] }],
        },
        ratingCount: { $add: ['$ratingCount', 1] },
      },
    },
  ]);
  await notify(
    { orgId: order.distributorId.toString(), roles: ['distributor_owner'] },
    { type: 'rating', title: `${order.storeName} rated order ${order.code} ${stars}★`, body: comment, link: `/dist/orders/${order.id}` },
  );
  return { stars, comment: comment ?? null };
}
