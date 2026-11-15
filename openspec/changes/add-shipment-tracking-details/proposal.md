# Proposal: Shipment tracking details (ETA, tracking notes, delays)

**Priority:** P2 (additional) · **Screens:** S17 and S22 timeline, S16/S21 lists · **Depends on:** `add-purchase-orders`

## Why
"Shipped" alone does not tell the store when the order will arrive. Without real GPS (out of scope), the distributor can still give an estimated delivery date and short tracking notes, and the system can flag late orders.

## What Changes
- When accepting an order, the distributor sets an estimated delivery date (default: today + its delivery days).
- Distributor users can add tracking notes ("Left the warehouse", "Driver: Carlos") to accepted or shipped orders, shown on the timeline.
- Orders not delivered by their estimated date are flagged as delayed in both lists.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `purchase-orders`: adds estimated delivery date, tracking notes and the delayed flag.

## Impact
- API: `PATCH /orders/{id}/status` accepts `estimatedDelivery` on accept; new `POST /orders/{id}/tracking` (add to `openapi.yaml`); order responses include `estimatedDelivery` and `delayed`.
- Data: `purchaseorders.estimatedDelivery`, `trackingNotes[]`.
- Out of scope: GPS, maps, carrier integrations.
