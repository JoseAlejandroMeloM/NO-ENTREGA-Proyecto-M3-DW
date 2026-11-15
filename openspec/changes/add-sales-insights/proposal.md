# Proposal: Sales insights and restock suggestions

**Priority:** P0 · **Stories:** US-13, US-14 · **QA:** QA-08, QA-09 · **Screens:** S10 Insights, S11 Restock · **Depends on:** `add-sales-register`; the restock "order" shortcut uses `add-distributor-catalog`

## Why
Owners want to know what drives their sales and what to buy before it runs out. The sales history already holds the data; this change turns it into best sellers, a daily trend and a transparent restock prediction.

## What Changes
- Best sellers: top 10 by units and by revenue for 7, 30 or 90 days.
- Daily sales series for the selected range (days without sales count as 0).
- Restock suggestions per product using the moving-average formula BR4: average daily sales, days of stock left, suggested quantity, best distributor.
- Client: S10 with range selector, chart (Recharts) and top-10 tables; S11 urgency-sorted table with an "Order" shortcut.

## Capabilities

### New Capabilities
- `sales-insights`: best sellers and daily sales trend.
- `restock-suggestions`: stock-out prediction and suggested order quantities.

### Modified Capabilities
None.

## Impact
- API: `/insights/best-sellers`, `/insights/daily-sales`, `/insights/restock`.
- Read-only aggregations over `sales`, `products` and distributor catalogs; no new collections.
- Out of scope: ML forecasting, seasonality, profit margins (possible future change).
