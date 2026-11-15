import mongoose from 'mongoose';
import type { AuthUser } from '../../middleware/auth';
import { Product, type ProductDoc } from '../../models/Product';
import { PAYMENT_METHODS, Sale, type SaleDoc } from '../../models/Sale';
import { AppError, notFoundError, type ErrorDetail } from '../../utils/errors';
import { applyStock, checkLowStock, InsufficientStockError } from '../products/stock';
import type { CreateSaleInput, ListSalesQuery } from './schemas';
import { dayRange, todayInBogota } from './time';

type Cashier = { _id: mongoose.Types.ObjectId; name: string } | null;

/** Public shape (the `Sale` schema in openapi.yaml). */
function toSaleDto(s: SaleDoc, cashier: { id: string; name: string } | null) {
  return {
    id: s._id.toString(),
    items: s.items.map((i) => ({
      product: i.productId.toString(),
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    total: s.total,
    paymentMethod: s.paymentMethod,
    amountReceived: s.amountReceived ?? null,
    change: s.change ?? null,
    cashier,
    createdAt: s.createdAt,
  };
}
const fromPopulated = (s: SaleDoc) => {
  const c = s.cashierId as unknown as Cashier;
  return toSaleDto(s, c ? { id: c._id.toString(), name: c.name } : null);
};

const validation = (details: ErrorDetail[]) => new AppError(400, 'VALIDATION_ERROR', 'Invalid request data', details);

/** Register a sale (US-20). The server prices everything; stock and the sale commit together or not at all. */
export async function create(user: AuthUser, input: CreateSaleInput) {
  // Merge repeated products so the stock check sees the real quantity; remember the first line for errors.
  const lines = new Map<string, { quantity: number; index: number }>();
  input.items.forEach((item, index) => {
    const line = lines.get(item.product);
    if (line) line.quantity += item.quantity;
    else lines.set(item.product, { quantity: item.quantity, index });
  });

  const ids = [...lines.keys()];
  const products = await Product.find({ _id: mongoose.trusted({ $in: ids }), storeId: user.orgId, active: true });
  const byId = new Map(products.map((p) => [p.id as string, p]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    throw validation(missing.map((id) => ({ path: `items.${lines.get(id)!.index}.product`, message: 'Product not found' })));
  }

  const items = ids.map((id) => {
    const p = byId.get(id)!;
    const { quantity } = lines.get(id)!;
    return { productId: p._id, name: p.name, sku: p.sku, quantity, unitPrice: p.price, subtotal: p.price * quantity };
  });
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  // Payment rules (US-20 AC2-3).
  let cash: { amountReceived: number; change: number } | null = null;
  if (input.paymentMethod === 'cash') {
    if (input.amountReceived === undefined) throw validation([{ path: 'amountReceived', message: 'Enter the amount received' }]);
    if (input.amountReceived < total) {
      throw validation([{ path: 'amountReceived', message: `Amount received must be at least the total (${total})` }]);
    }
    cash = { amountReceived: input.amountReceived, change: input.amountReceived - total };
  } else if (input.amountReceived !== undefined) {
    throw validation([{ path: 'amountReceived', message: 'Only cash sales take an amount received' }]);
  }

  // Friendly early check that lists every short item; the atomic guard inside the transaction handles races.
  const short = ids.filter((id) => byId.get(id)!.stock < lines.get(id)!.quantity);
  if (short.length) {
    throw new AppError(
      409,
      'INSUFFICIENT_STOCK',
      'Not enough stock for some items',
      short.map((id) => ({
        path: `items.${lines.get(id)!.index}.quantity`,
        message: `${byId.get(id)!.name}: only ${byId.get(id)!.stock} left`,
      })),
    );
  }

  const session = await mongoose.startSession();
  let sale!: SaleDoc;
  let touched: ProductDoc[] = [];
  try {
    // withTransaction retries the callback on transient errors, so it must start clean every time.
    await session.withTransaction(async () => {
      touched = [];
      const saleId = new mongoose.Types.ObjectId();
      for (const item of items) {
        try {
          touched.push(
            await applyStock(
              {
                storeId: user.orgId,
                productId: item.productId.toString(),
                delta: -item.quantity,
                type: 'sale',
                userId: user.id,
                reference: saleId.toString(),
              },
              { session },
            ),
          );
        } catch (err) {
          if (err instanceof InsufficientStockError) {
            const index = lines.get(item.productId.toString())!.index;
            throw new AppError(409, 'INSUFFICIENT_STOCK', 'Not enough stock for some items', [
              { path: `items.${index}.quantity`, message: `${item.name}: only ${err.available} left` },
            ]);
          }
          throw err;
        }
      }
      [sale] = await Sale.create(
        [{ _id: saleId, storeId: user.orgId, cashierId: user.id, items, total, paymentMethod: input.paymentMethod, ...cash }],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  // Low-stock alerts only after commit (US-20 AC4 → US-12). A failed alert must not fail a saved sale.
  for (const product of touched) {
    await checkLowStock(product).catch((err) => console.error('Low-stock check failed', (err as Error).message));
  }
  return toSaleDto(sale, { id: user.id, name: user.name });
}

/** Sales history (US-21). Cashiers only ever see their own sales, whatever filter they send. */
export async function list(user: AuthUser, q: ListSalesQuery) {
  const filter: Record<string, unknown> = { storeId: user.orgId };
  if (user.role === 'store_cashier') filter.cashierId = user.id;
  else if (q.cashier) filter.cashierId = q.cashier;
  if (q.paymentMethod) filter.paymentMethod = q.paymentMethod;
  if (q.from || q.to) {
    filter.createdAt = mongoose.trusted({
      ...(q.from ? { $gte: dayRange(q.from).start } : {}),
      ...(q.to ? { $lt: dayRange(q.to).end } : {}),
    });
  }
  const [sales, total] = await Promise.all([
    Sale.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('cashierId', 'name'),
    Sale.countDocuments(filter),
  ]);
  return { page: q.page, limit: q.limit, total, data: sales.map(fromPopulated) };
}

export async function get(user: AuthUser, id: string) {
  const filter: Record<string, unknown> = { _id: id, storeId: user.orgId };
  if (user.role === 'store_cashier') filter.cashierId = user.id;
  const sale = await Sale.findOne(filter).populate('cashierId', 'name');
  if (!sale) throw notFoundError('Sale');
  return fromPopulated(sale);
}

/** Totals per payment method for one Bogota day (US-22). Every method is listed, even with 0. */
export async function dailySummary(user: AuthUser, date = todayInBogota()) {
  const { start, end } = dayRange(date);
  // Aggregations skip Mongoose casting and sanitizing: ids are cast by hand, values come from the server.
  const rows = await Sale.aggregate<{ _id: string; total: number; count: number }>([
    { $match: { storeId: new mongoose.Types.ObjectId(user.orgId), createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: '$paymentMethod', total: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);
  const byMethod = PAYMENT_METHODS.map((method) => {
    const row = rows.find((r) => r._id === method);
    return { method, total: row?.total ?? 0, count: row?.count ?? 0 };
  });
  return {
    date,
    byMethod,
    grandTotal: byMethod.reduce((s, m) => s + m.total, 0),
    salesCount: byMethod.reduce((s, m) => s + m.count, 0),
  };
}
