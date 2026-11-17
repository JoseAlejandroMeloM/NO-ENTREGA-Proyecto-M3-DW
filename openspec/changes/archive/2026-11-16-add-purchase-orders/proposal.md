# Proposal: Purchase orders, shipment tracking and ratings

**Priority:** P0 (US-32–35) · P1 (US-36) · **QA:** QA-15 – QA-19 · **Screens:** S15, S16, S17 (store); S19, S21, S22 (distributor) · **Depends on:** `add-distributor-catalog`, `add-product-inventory`, `add-notifications`

## Why
Orders to distributors happen over WhatsApp with no record of what was ordered or where it is. A tracked purchase order connects both sides: the store sends it, the distributor accepts and ships it, and receiving it updates stock automatically.

## What Changes
- Stores create purchase orders from a distributor's available catalog; the server computes the total and enforces the distributor's minimum order.
- Status flow `pending → accepted → shipped → delivered`, `pending → rejected` (distributor, with reason), `pending → cancelled` (store); every change kept in a status history and notified to the other side.
- Receiving a delivered order adds quantities to the store's products (or creates them) exactly once.
- Store owners rate a delivered order 1–5 once; the distributor's rating is the average.
- Client: new order, order lists and detail with timeline for both sides, and the distributor dashboard.

## Capabilities

### New Capabilities
- `purchase-orders`: order creation, status workflow, history, tracking and receiving into stock.
- `distributor-ratings`: post-delivery ratings and distributor average.

### Modified Capabilities
- `notifications`: adds order notification types (`order_created`, `order_status`).

## Impact
- API: `/orders`, `/orders/{id}`, `/orders/{id}/status`, `/orders/{id}/receive`, `/orders/{id}/rating`.
- Data: `purchaseorders` (code `PO-000123`, items snapshot, statusHistory, receivedAt, rated), `ratings`; `distributors.ratingAvg/ratingCount`.
- Uses `stockService.apply()` with type `purchase`.
- Out of scope: GPS tracking, partial deliveries, editing an order after creation, payments to distributors.
