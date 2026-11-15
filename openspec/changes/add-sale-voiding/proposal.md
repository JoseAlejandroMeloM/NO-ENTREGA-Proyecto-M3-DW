# Proposal: Void a sale

**Priority:** P2 (additional) · **Rule:** BR2 stretch · **Screens:** "Void" action in the S09 sale drawer · **Depends on:** `add-sales-register`

## Why
Cashiers make mistakes (wrong product, wrong method). Today a sale can never be changed, so the only fix is a manual stock adjustment that leaves wrong totals. The owner needs a controlled way to void a sale that restores stock and keeps an audit trail.

## What Changes
- `store_owner` voids a sale with a mandatory reason; stock is restored for every item through the stock service (movement type `void`).
- Voided sales stay in the history, marked as voided, and are excluded from daily totals and insights.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sales`: adds sale voiding and changes totals/history to exclude voided sales.

## Impact
- API: new `POST /sales/{id}/void` (add to `openapi.yaml`).
- Data: `sales.voidedAt`, `voidedBy`, `voidReason`.
- Insights aggregations add `voidedAt: null` to their match.
- Out of scope: partial voids, refunds to card/Nequi, editing a sale.
