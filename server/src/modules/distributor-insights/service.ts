import mongoose from 'mongoose';
import type { AuthUser } from '../../middleware/auth';
import { ORDER_STATUSES, PurchaseOrder, type OrderStatus } from '../../models/PurchaseOrder';
import { lastDays } from '../insights/service';

const HOUR_MS = 60 * 60 * 1000;

/** When an order first reached `status`, read from its history (null if it never did). */
const reachedAt = (status: OrderStatus) => ({
  $first: {
    $map: {
      input: { $filter: { input: '$statusHistory', cond: { $eq: ['$$this.status', status] } } },
      in: '$$this.at',
    },
  },
});

// Aggregations skip Mongoose casting: the distributor id is cast by hand, every other value comes from the server.
const ownOrders = (user: AuthUser) => ({ distributorId: new mongoose.Types.ObjectId(user.orgId) });

interface CreatedRow {
  counts: { _id: OrderStatus; count: number }[];
  decided: { accepted: number; rejected: number }[];
}

interface DeliveredRow {
  totals: { revenue: number; orders: number; avgHours: number | null }[];
  topItems: { _id: mongoose.Types.ObjectId; name: string; unit: string; quantity: number; revenue: number }[];
  topStores: { _id: mongoose.Types.ObjectId; name: string; revenue: number; orders: number }[];
}

/** Orders created in the range: how many per status, and how many the distributor accepted vs rejected. */
async function createdInRange(user: AuthUser, start: Date) {
  const [row] = await PurchaseOrder.aggregate<CreatedRow>([
    { $match: { ...ownOrders(user), createdAt: { $gte: start } } },
    {
      $facet: {
        counts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        decided: [
          {
            $group: {
              _id: null,
              // An order counts as accepted once it has an "accepted" entry, even if it moved on to shipped or delivered.
              accepted: { $sum: { $cond: [{ $in: ['accepted', '$statusHistory.status'] }, 1, 0] } },
              rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            },
          },
        ],
      },
    },
  ]);
  return row;
}

/** Orders delivered in the range: revenue, average hours from accepted to delivered, top items and top stores. */
async function deliveredInRange(user: AuthUser, start: Date) {
  const [row] = await PurchaseOrder.aggregate<DeliveredRow>([
    {
      $match: {
        ...ownOrders(user),
        status: 'delivered',
        statusHistory: { $elemMatch: { status: 'delivered', at: { $gte: start } } },
      },
    },
    { $addFields: { acceptedAt: reachedAt('accepted'), deliveredAt: reachedAt('delivered') } },
    { $match: { deliveredAt: { $gte: start } } },
    { $sort: { deliveredAt: -1 } }, // so $first below is the latest name snapshot
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              revenue: { $sum: '$total' },
              orders: { $sum: 1 },
              // $avg ignores null, so an order without an "accepted" entry is skipped.
              avgHours: {
                $avg: {
                  $cond: [{ $ne: ['$acceptedAt', null] }, { $divide: [{ $subtract: ['$deliveredAt', '$acceptedAt'] }, HOUR_MS] }, null],
                },
              },
            },
          },
        ],
        topItems: [
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.catalogItem',
              name: { $first: '$items.name' },
              unit: { $first: '$items.unit' },
              quantity: { $sum: '$items.quantity' },
              revenue: { $sum: '$items.subtotal' },
            },
          },
          { $sort: { quantity: -1, revenue: -1, name: 1 } },
          { $limit: 10 },
        ],
        topStores: [
          { $group: { _id: '$storeId', name: { $first: '$storeName' }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
          { $sort: { revenue: -1, orders: -1, name: 1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);
  return row;
}

/** Sales and service metrics of the distributor's own orders for the last `range` days (distributor-insights spec). */
export async function insights(user: AuthUser, range: number) {
  const { start } = lastDays(range);
  const [created, delivered] = await Promise.all([createdInRange(user, start), deliveredInRange(user, start)]);

  const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const c of created.counts) ordersByStatus[c._id] = c.count;

  const { accepted = 0, rejected = 0 } = created.decided[0] ?? {};
  const decided = accepted + rejected;
  const totals = delivered.totals[0];

  return {
    range,
    deliveredRevenue: totals?.revenue ?? 0,
    deliveredOrders: totals?.orders ?? 0,
    ordersByStatus,
    topItems: delivered.topItems.map((i) => ({ catalogItem: i._id.toString(), name: i.name, unit: i.unit, quantity: i.quantity, revenue: i.revenue })),
    topStores: delivered.topStores.map((s) => ({ store: s._id.toString(), name: s.name, revenue: s.revenue, orders: s.orders })),
    acceptanceRate: decided ? Math.round((accepted / decided) * 1000) / 1000 : null,
    avgDeliveryHours: totals?.avgHours == null ? null : Math.round(totals.avgHours * 10) / 10,
  };
}
