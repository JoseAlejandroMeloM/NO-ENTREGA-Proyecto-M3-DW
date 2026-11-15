# Proposal: Messages on purchase orders

**Priority:** P1 · **Stories:** US-40 · **QA:** QA-20 · **Screens:** messages panel on S17 and S22 · **Depends on:** `add-purchase-orders`, `add-notifications`

## Why
Store and distributor still need to talk about an order (substitutions, delivery time). Keeping that conversation on the order avoids WhatsApp and leaves a record next to the status history.

## What Changes
- A message thread per purchase order, readable and writable only by the two organizations involved.
- Near-real-time updates by polling every 5 seconds (no websockets).
- A notification for the other side when a new message arrives.

## Capabilities

### New Capabilities
- `order-messaging`: per-order conversation between the store and the distributor.

### Modified Capabilities
- `notifications`: adds the `message` type.

## Impact
- API: `GET/POST /orders/{id}/messages` (supports `?after=<timestamp>` for polling).
- Data: `messages` with index `{orderId, createdAt}`.
- Out of scope: attachments, read receipts, typing indicators, websockets, conversations not tied to an order.
