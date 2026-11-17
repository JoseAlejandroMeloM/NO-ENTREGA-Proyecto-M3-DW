# product-inventory Specification

## Purpose
Keeps each store's product catalog with current stock and minimum stock, records every stock change with who and why, and flags products that are running low.

## Requirements

### Requirement: Manage products
`store_owner` and `store_inventory` SHALL create, edit and delete products of their store with name, SKU, category, unit, sale price, cost, stock and minimum stock; SKU SHALL be unique within the store.

#### Scenario: Create a product
- **WHEN** a `store_inventory` user creates a product with valid data
- **THEN** the response is 201 and the product belongs to their store

#### Scenario: Duplicate SKU in the same store
- **WHEN** a product is created with a SKU that already exists in that store
- **THEN** the response is 409 with `error.code` `CONFLICT`

#### Scenario: Cashier tries to modify
- **WHEN** a `store_cashier` calls `POST`, `PATCH` or `DELETE` on `/products`
- **THEN** the response is 403

#### Scenario: Deleted product keeps history
- **WHEN** a product with past sales is deleted
- **THEN** it disappears from the product list and past sales still show its name

### Requirement: Browse products
Store users (owner, inventory, cashier) SHALL list their store's products with search by name or SKU, filter by category and "low stock only", and pagination of at most 100 per page.

#### Scenario: Low stock filter
- **WHEN** a user lists products with `lowStock=true`
- **THEN** only products with `stock <= minStock` are returned

#### Scenario: Distributor user
- **WHEN** a `distributor_owner` calls `GET /products`
- **THEN** the response is 403

### Requirement: Manual stock adjustment
`store_owner` and `store_inventory` SHALL adjust a product's stock by a positive or negative quantity with a reason (`count`, `damage`, `other`); an adjustment that would leave stock negative SHALL be rejected without changing stock.

#### Scenario: Negative result rejected
- **WHEN** a user adjusts a product with stock 5 by -999
- **THEN** the response is 400 and the stock stays 5

#### Scenario: Valid adjustment recorded
- **WHEN** a user adjusts a product by +10 with reason `count`
- **THEN** stock increases by 10 and the movement history shows the quantity, reason, user and date

### Requirement: Stock movement history
Every stock change from any source SHALL be recorded as a movement with type, quantity, resulting stock, user and timestamp, viewable on the product.

#### Scenario: View history
- **WHEN** a user opens a product's movements
- **THEN** they see every change newest first with its type and author

### Requirement: Low-stock detection
When a stock change leaves a product at or below its minimum stock, the system SHALL notify the store's `store_owner` and `store_inventory` users once, and SHALL notify again only after stock has gone above the minimum and dropped again.

#### Scenario: Crossing the minimum
- **WHEN** a product with minimum 5 goes from 6 to 4
- **THEN** one `low_stock` notification is created for each owner and inventory user

#### Scenario: Already low
- **WHEN** the same product goes from 4 to 3
- **THEN** no new notification is created
