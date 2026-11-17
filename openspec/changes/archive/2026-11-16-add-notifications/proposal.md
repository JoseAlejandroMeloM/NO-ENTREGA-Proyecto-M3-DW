# Proposal: In-app notification center

**Priority:** P0 · **Stories:** US-41 · **QA:** QA-21 · **Screens:** S25 + bell in the top bar · **Depends on:** `add-identity-access`

## Why
Low-stock alerts, order status changes and new messages are only useful if the right people see them. Email/SMS are out of scope, so the product needs one in-app place where every user finds what changed.

## What Changes
- A notification store with a small internal API that other modules call (`notify(users | roles-in-org, type, message, link)`).
- Endpoints to list notifications, count unread, mark one or all as read.
- Client: bell with unread count (polled), dropdown with the latest 5, and a full notifications page.

## Capabilities

### New Capabilities
- `notifications`: per-user in-app notifications, unread count, read state.

### Modified Capabilities
None.

## Impact
- API: `/notifications`, `/notifications/{id}/read`, `/notifications/read-all`.
- Data: `notifications` collection with index on `{ userId, read, createdAt }`.
- Producers (added by their own changes): inventory low stock, purchase orders, order messages.
- Out of scope: email, SMS, push, real-time sockets (the bell polls every 30 s).
