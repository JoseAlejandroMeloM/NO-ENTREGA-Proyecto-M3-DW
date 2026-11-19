/** Days the restock suggestion covers, and the lead time used when no distributor carries the product (BR4). */
export const COVER_DAYS = 14;
export const SAFETY_DAYS = 3;
export const DEFAULT_LEAD_TIME_DAYS = 3;
export const WINDOW_DAYS = 30;

export interface RestockInput {
  stock: number;
  minStock: number;
  unitsLast30: number;
  leadTimeDays: number;
}

/**
 * Rule BR4 (docs/spec/01-scope-and-roles.md), kept pure so the numbers are easy to test and to explain:
 *   avgDaily     = units sold in the last 30 days / 30
 *   daysLeft     = stock / avgDaily            (null when nothing sold)
 *   urgent       = daysLeft <= leadTime + 3    or stock <= minStock
 *   suggestedQty = max(0, ceil(avgDaily * 14) + minStock - stock)
 */
export function restockPlan({ stock, minStock, unitsLast30, leadTimeDays }: RestockInput) {
  const avgDaily = unitsLast30 / WINDOW_DAYS;
  const daysLeft = avgDaily > 0 ? stock / avgDaily : null;
  const urgent = stock <= minStock || (daysLeft !== null && daysLeft <= leadTimeDays + SAFETY_DAYS);
  // units * 14 / 30 instead of avgDaily * 14 avoids float noise (e.g. 2.0000000001 → ceil 3).
  const cover = Math.ceil((unitsLast30 * COVER_DAYS) / WINDOW_DAYS);
  const suggestedQty = Math.max(0, cover + minStock - stock);
  return {
    avgDaily: Math.round(avgDaily * 100) / 100,
    daysLeft: daysLeft === null ? null : Math.round(daysLeft * 10) / 10,
    urgent,
    suggestedQty,
  };
}

/**
 * Restock window used for proactive alerts (add-restock-alerts): there is a sales-based prediction and
 * it says the product runs out before a new order could arrive, i.e. daysLeft <= leadTime + 3.
 * Compared as stock * 30 <= (leadTime + 3) * units so no float division is involved.
 * Unlike `urgent`, low stock alone does not count: that case already has the low-stock alert (BR3).
 */
export function inRestockWindow({ stock, unitsLast30, leadTimeDays }: Omit<RestockInput, 'minStock'>) {
  if (unitsLast30 <= 0) return false;
  return stock * WINDOW_DAYS <= (leadTimeDays + SAFETY_DAYS) * unitsLast30;
}
