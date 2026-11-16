import mongoose from 'mongoose';
import type { AuthUser } from '../../middleware/auth';
import { CatalogItem } from '../../models/CatalogItem';
import { Distributor } from '../../models/Distributor';
import { Product } from '../../models/Product';
import { Sale } from '../../models/Sale';
import { BUSINESS_TZ, dayRange, todayInBogota } from '../sales/time';
import { DEFAULT_LEAD_TIME_DAYS, restockPlan, WINDOW_DAYS } from './restock';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The last `days` Bogota calendar days, today included: first day's start and every date label. */
function lastDays(days: number) {
  const todayStart = dayRange(todayInBogota()).start.getTime();
  const start = new Date(todayStart - (days - 1) * DAY_MS);
  const dates = Array.from({ length: days }, (_, i) => todayInBogota(new Date(start.getTime() + i * DAY_MS + 12 * 3600_000)));
  return { start, dates };
}

// Aggregations skip Mongoose casting: the store id is cast by hand, every other value comes from the server.
const storeMatch = (user: AuthUser, start: Date) => ({
  $match: { storeId: new mongoose.Types.ObjectId(user.orgId), voidedAt: null, createdAt: { $gte: start } },
});

/** Units and revenue per product since `start`; the name is the latest snapshot. */
const perProduct = (user: AuthUser, start: Date) => [
  storeMatch(user, start),
  { $sort: { createdAt: -1 as const } },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.productId',
      name: { $first: '$items.name' },
      units: { $sum: '$items.quantity' },
      revenue: { $sum: '$items.subtotal' },
    },
  },
];

type Stat = { _id: mongoose.Types.ObjectId; name: string; units: number; revenue: number };
const toStat = (s: Stat) => ({ product: s._id.toString(), name: s.name, units: s.units, revenue: s.revenue });

/** Top 10 by units and by revenue (US-13 AC1). Ties are broken by the other measure, then by name. */
export async function bestSellers(user: AuthUser, days: number) {
  const [result] = await Sale.aggregate<{ byUnits: Stat[]; byRevenue: Stat[] }>([
    ...perProduct(user, lastDays(days).start),
    {
      $facet: {
        byUnits: [{ $sort: { units: -1, revenue: -1, name: 1 } }, { $limit: 10 }],
        byRevenue: [{ $sort: { revenue: -1, units: -1, name: 1 } }, { $limit: 10 }],
      },
    },
  ]);
  return { days, byUnits: result.byUnits.map(toStat), byRevenue: result.byRevenue.map(toStat) };
}

/** One point per Bogota day, zero-filled (US-13 AC2). */
export async function dailySales(user: AuthUser, days: number) {
  const { start, dates } = lastDays(days);
  const rows = await Sale.aggregate<{ _id: string; total: number; count: number }>([
    storeMatch(user, start),
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: BUSINESS_TZ } },
        total: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDate = new Map(rows.map((r) => [r._id, r]));
  return {
    days,
    data: dates.map((date) => ({ date, total: byDate.get(date)?.total ?? 0, count: byDate.get(date)?.count ?? 0 })),
  };
}

export interface BestDistributor {
  id: string;
  name: string;
  price: number;
  deliveryDays: number;
  catalogItem: string; // lets S11 open S15 with this item prefilled
}

/**
 * Cheapest available catalog item per product: same category and one name contains the other
 * (case-insensitive, e.g. "Arroz Diana 500 g" matches "arroz diana 500 g x 25"). Products nobody
 * carries are left out and use the default lead time, as BR4 specifies.
 */
export async function findBestDistributors(
  products: InstanceType<typeof Product>[],
): Promise<Map<string, BestDistributor>> {
  const best = new Map<string, BestDistributor>();
  if (products.length === 0) return best;
  const categories = [...new Set(products.map((p) => p.category))];
  const items = await CatalogItem.find({ available: true, category: mongoose.trusted({ $in: categories }) })
    .sort({ price: 1, _id: 1 })
    .populate<{ distributorId: InstanceType<typeof Distributor> }>('distributorId', 'name deliveryDays');

  for (const p of products) {
    const name = p.name.toLowerCase();
    const item = items.find((i) => {
      if (i.category !== p.category || !i.distributorId) return false;
      const other = i.name.toLowerCase();
      return other.includes(name) || name.includes(other);
    });
    if (item) {
      const d = item.distributorId;
      best.set(p.id as string, { id: d.id as string, name: d.name, price: item.price, deliveryDays: d.deliveryDays, catalogItem: item.id as string });
    }
  }
  return best;
}

/** Restock suggestions for every active product, most urgent first (US-14, BR4). */
export async function restock(user: AuthUser) {
  const start = new Date(Date.now() - WINDOW_DAYS * DAY_MS);
  const [products, sold] = await Promise.all([
    Product.find({ storeId: user.orgId, active: true }),
    Sale.aggregate<Stat>(perProduct(user, start)),
  ]);
  const unitsById = new Map(sold.map((s) => [s._id.toString(), s.units]));
  const best = await findBestDistributors(products);

  const data = products.map((p) => {
    const distributor = best.get(p.id as string) ?? null;
    const leadTimeDays = distributor?.deliveryDays ?? DEFAULT_LEAD_TIME_DAYS;
    const plan = restockPlan({ stock: p.stock, minStock: p.minStock, unitsLast30: unitsById.get(p.id as string) ?? 0, leadTimeDays });
    return {
      product: p.id as string,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      stock: p.stock,
      minStock: p.minStock,
      ...plan,
      leadTimeDays,
      bestDistributor: distributor && { id: distributor.id, name: distributor.name, price: distributor.price, catalogItem: distributor.catalogItem },
    };
  });

  // Fewest days left first; products without sales go last (low-stock ones first among them).
  data.sort((a, b) => {
    if (a.daysLeft === null || b.daysLeft === null) {
      if (a.daysLeft !== b.daysLeft) return a.daysLeft === null ? 1 : -1;
      return Number(b.urgent) - Number(a.urgent) || a.name.localeCompare(b.name);
    }
    return a.daysLeft - b.daysLeft || a.name.localeCompare(b.name);
  });
  return { windowDays: WINDOW_DAYS, data };
}
