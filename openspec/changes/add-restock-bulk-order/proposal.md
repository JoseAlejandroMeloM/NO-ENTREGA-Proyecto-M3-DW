# Proposal: Order all restock suggestions from one distributor

**Priority:** P2 (additional) · **Screens:** S11 Restock, S15 New purchase order · **Depends on:** `add-restock-alerts`, `add-purchase-orders` · **Issue:** #93

## Why
S11 already suggests what to buy and from whom, but the store must open one order per product. When several products share the same best distributor, the owner should send them in one order (it also reaches the distributor's minimum order sooner).

## What Changes
- S11 shows an "Order by distributor" panel: for each best distributor of the products to restock, the number of products, the estimated total, and an "Order all" link.
- S15 accepts several `item` + `qty` pairs in the URL and prefills all of them.
- No API or data-model change; the server still prices and validates the order.

## Impact
- Client only: `RestockPage.tsx`, `NewOrderPage.tsx`. E2E test in `e2e/`.
