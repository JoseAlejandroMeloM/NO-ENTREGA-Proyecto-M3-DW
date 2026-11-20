# Proposal: Restock prediction alerts

**Priority:** P2 (additional) · **Screens:** notifications (S25), restock badge on the sidebar · **Depends on:** `add-sales-insights`, `add-notifications`

## Why
Restock suggestions only help if someone opens S11. The product vision includes "restock predictions and notifications": the system should warn the inventory team when a product is predicted to run out before a new order could arrive, even if stock is still above the minimum.

## What Changes
- After every sale, re-evaluate the sold products' predictions; when a product enters the restock window (`daysLeft <= leadTime + 3`), notify owner and inventory users once until it leaves the window.
- Sidebar badge with the number of products currently suggested for restock.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `restock-suggestions`: adds proactive alerts when a product enters the restock window.
- `notifications`: adds the `restock_suggested` type.

## Impact
- Reuses the BR4 pure function from `add-sales-insights`; adds `products.restockNotified`.
- No new endpoints; `/insights/restock` gains a `count` field for the badge.
- Out of scope: scheduled background jobs (evaluation runs on sales and receipts only), email/SMS.
