# Design

## Context
Both organizations act on the same order document; the store and distributor must each see only their own orders.

## Goals / Non-Goals
**Goals:** one explicit state machine enforced on the server; idempotent receive and rate.
**Non-Goals:** concurrency beyond the last-writer guard; partial shipments.

## Decisions
- **State machine as data:** `TRANSITIONS = { pending: { accepted: [distributor_owner], rejected: [distributor_owner], cancelled: [store_owner, store_inventory] }, accepted: { shipped: [distributor_owner, distributor_staff] }, shipped: { delivered: [distributor_owner, distributor_staff] } }`. `PATCH /orders/{id}/status` looks up `(current, next, role)`; anything else → 409 `INVALID_TRANSITION` (403 if the role belongs to the wrong side).
- **Guarded update** `findOneAndUpdate({ _id, status: current }, { $set: { status: next }, $push: { statusHistory } })` so two concurrent transitions cannot both succeed.
- **Scoping:** store users filter by `storeId`, distributor users by `distributorId`; other orders → 404.
- **Order code:** counter document incremented atomically → `PO-000123`.
- **Receive once:** `findOneAndUpdate({ status: 'delivered', receivedAt: null }, { receivedAt: now })` first, then stock increments; a second call finds nothing → 409. Matching: same name (case-insensitive) in the store's products; otherwise create the product with cost = order unit price, sale price = cost × 1.3 (editable later), minStock 0.
- **Rating once:** unique index on `ratings.orderId`; update the distributor average with `$inc` on sum and count.

## Risks / Trade-offs
- [Receive succeeds on the flag but fails mid-way on stock] → wrap in a transaction (same approach as sales).
- [Auto-created products have a guessed sale price] → flagged in the UI so the clerk reviews them.
