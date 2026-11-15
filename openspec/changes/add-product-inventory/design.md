# Design

## Context
Stock is changed by four sources: manual adjustment (this change), sales, receiving orders and voids (later changes). They must all keep stock consistent and evaluate the low-stock rule the same way.

## Goals / Non-Goals
**Goals:** a single `stockService.apply(storeId, productId, delta, reason, userId)` used by every module; no negative stock under concurrency.
**Non-Goals:** full ledger reconciliation; stock reservations.

## Decisions
- **Conditional atomic update** `updateOne({ _id, storeId, stock: { $gte: -delta } }, { $inc: { stock: delta } })`. If no document matches, the change would make stock negative → 409/400. Mongoose `sanitizeFilter` is on, so the server-side operator must be wrapped: `stock: mongoose.trusted({ $gte: -delta })`. Avoids read-then-write races without multi-document transactions (Atlas free tier supports them, but the single-document guard is enough).
- **Movement log** inserted after a successful update, with `type` (`adjustment`, `sale`, `order_received`, `void`), signed quantity, resulting stock (`stockAfter`), reason, note, reference and user. Implemented as `applyStock()` in `server/src/modules/products/stock.ts`; it throws `InsufficientStockError` (409 `INSUFFICIENT_STOCK`), which manual adjustments turn into a 400 on `quantity`.
- **SKU uniqueness** is a partial unique index over active products, so a soft-deleted product's SKU can be reused.
- **Products created already low** start with `lowStockNotified: true` (no alert for what the user just typed); changing `minStock` re-evaluates the rule.
- **Low-stock flag on the product** (`lowStockNotified`): set when the update crosses `stock <= minStock` and a notification is sent; cleared when stock goes back above `minStock`. This gives "once until restocked" without scanning history.
- **Delete = soft delete** (`active: false`) so past sales keep their product references.

## Risks / Trade-offs
- [Movement insert fails after the stock update] → logged and retried once; the stock value stays the source of truth.
- [Large catalogs slow the regex search] → index on `{storeId, name}` and `{storeId, sku}`; limit 100 per page.
