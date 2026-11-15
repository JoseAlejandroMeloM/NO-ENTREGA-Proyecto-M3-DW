# Design

## Context
Stock changes go through `stockService.apply()` from `add-product-inventory`. Vercel runs the API serverless, so a sale must be consistent in one request.

## Goals / Non-Goals
**Goals:** never save a sale that oversells; never trust client prices or totals.
**Non-Goals:** offline POS, partial payments, mixed payment methods.

## Decisions
- **Price snapshot:** the server loads each product and copies name and current sale price into the sale; later price changes do not alter past sales.
- **Atomicity: MongoDB transaction** (Atlas replica set) wrapping all stock decrements, movements and the sale insert. If any item fails the stock guard, the transaction aborts → 409 `INSUFFICIENT_STOCK` with the offending product in `details`. Fallback if transactions are unavailable locally: compensate already-applied decrements. Alternative (validate first, then write) rejected: races between two cashiers.
- **Duplicate product lines are merged** before validation so the stock check sees the real quantity.
- **Cash:** `amountReceived` required for `cash` and must be ≥ total; `change = amountReceived - total` is stored. Not allowed for card/Nequi.
- **Daily totals** use a `$match` + `$group` aggregation by `paymentMethod`, with the day boundaries computed in `America/Bogota`.
- **Cashier scoping:** for `store_cashier`, the list query is forced to `cashierId = req.user.id` regardless of filters.

## Risks / Trade-offs
- [Transactions need a replica set] → Atlas provides one; tests use `MongoMemoryReplSet`.
- [Day boundaries across time zones] → all grouping done server-side in America/Bogota, documented in the contract.
