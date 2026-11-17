# Proposal: Product inventory and low-stock alerts

**Priority:** P0 (US-10, US-12) · P1 (US-11) · **QA:** QA-05, QA-06, QA-07 · **Screens:** S06, S07, low-stock card on S05 · **Depends on:** `add-identity-access`, `add-notifications`

## Why
Stores run out of products because nobody notices low stock. A shared product list with stock and minimum stock, a record of every manual adjustment, and an automatic alert are the base for sales, insights and restocking.

## What Changes
- Product CRUD per store with search, category filter, "low stock only" filter and pagination.
- Manual stock adjustments with reason, stored as stock movements with user and date.
- Low-stock rule: when stock reaches the minimum, notify owner and inventory roles once until restocked.
- Client: products list (S06) and product form with adjustment panel and movement history (S07).

## Capabilities

### New Capabilities
- `product-inventory`: store products, stock levels, stock movements, low-stock state.

### Modified Capabilities
- `notifications`: adds the `low_stock` notification type produced by inventory.

## Impact
- API: `/products`, `/products/{id}`, `/products/{id}/adjustments`.
- Data: `products` (unique `{storeId, sku}`), `stockmovements`.
- Later changes (sales, purchase orders) write stock through the same movement service.
- Out of scope: barcode scanning, product images, multiple warehouses, variants.
