import mongoose from 'mongoose';
import { Product, type ProductDoc } from '../../models/Product';
import { Sale } from '../../models/Sale';
import { notify } from '../notifications/service';
import { DEFAULT_LEAD_TIME_DAYS, inRestockWindow, restockPlan, WINDOW_DAYS } from './restock';
import { findBestDistributors } from './service';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Units sold of each product in the last 30 days (voided sales excluded), keyed by product id. */
async function unitsLast30(storeId: string, productIds: mongoose.Types.ObjectId[]) {
  const rows = await Sale.aggregate<{ _id: mongoose.Types.ObjectId; units: number }>([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
        voidedAt: null,
        createdAt: { $gte: new Date(Date.now() - WINDOW_DAYS * DAY_MS) },
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.productId': { $in: productIds } } },
    { $group: { _id: '$items.productId', units: { $sum: '$items.quantity' } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.units]));
}

/**
 * Restock alerts (add-restock-alerts). Runs after a sale or a received order, for the products whose
 * stock just changed. When a product enters the BR4 window (days left <= lead time + 3) the store's
 * owner and inventory users get one `restock_suggested` notification; the alert can fire again only
 * after the product left the window. Same atomic-flag pattern as the low-stock alert in stock.ts.
 */
export async function checkRestockAlerts(products: ProductDoc[]) {
  const active = products.filter((p) => p.active);
  if (active.length === 0) return;
  const storeId = active[0].storeId.toString();
  const [units, best] = await Promise.all([
    unitsLast30(storeId, active.map((p) => p._id)),
    findBestDistributors(active),
  ]);

  for (const p of active) {
    const input = {
      stock: p.stock,
      minStock: p.minStock,
      unitsLast30: units.get(p._id.toString()) ?? 0,
      leadTimeDays: best.get(p._id.toString())?.deliveryDays ?? DEFAULT_LEAD_TIME_DAYS,
    };
    if (!inRestockWindow(input)) {
      if (p.restockNotified) await Product.updateOne({ _id: p._id }, { restockNotified: false });
      continue;
    }
    // Only the request that flips the flag sends the alert, so concurrent sales notify once.
    // `$ne: true` also matches products created before this field existed (no value stored).
    const flipped = await Product.updateOne(
      { _id: p._id, restockNotified: mongoose.trusted({ $ne: true }) },
      { restockNotified: true },
    );
    if (flipped.modifiedCount !== 1) continue;
    const plan = restockPlan(input);
    await notify(
      { orgId: storeId, roles: ['store_owner', 'store_inventory'] },
      {
        type: 'restock_suggested',
        title: `Restock soon: ${p.name}`,
        body: `About ${plan.daysLeft} days of stock left (delivery takes ${input.leadTimeDays}). Suggested order: ${plan.suggestedQty} ${p.unit}`,
        link: '/app/restock',
      },
    );
  }
}
