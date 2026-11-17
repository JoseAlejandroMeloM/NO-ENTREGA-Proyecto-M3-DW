# sales Specification

## Purpose
Records every sale of a store with its items and payment method (card, Nequi or cash), keeps stock in sync, and gives owners a filtered history and exact daily totals per payment method.

## Requirements

### Requirement: Register a sale
`store_owner` and `store_cashier` SHALL register a sale with one or more products and quantities; the server SHALL compute unit prices, subtotals and total from the stored products and ignore any price or total sent by the client.

#### Scenario: Valid sale
- **WHEN** a cashier registers 2 units of a product priced 3,000 paid by card
- **THEN** the response is 201 with total 6,000, method `card`, the cashier and the timestamp

#### Scenario: Client sends a fake total
- **WHEN** the request includes a total of 1
- **THEN** the stored total is still computed from product prices

#### Scenario: Inventory clerk tries to sell
- **WHEN** a `store_inventory` user calls `POST /sales`
- **THEN** the response is 403

### Requirement: Payment method
Every sale SHALL have exactly one payment method: `card`, `nequi` or `cash`. For `cash`, the amount received SHALL be at least the total and the system SHALL return the change.

#### Scenario: Cash with change
- **WHEN** a cash sale of 6,000 is registered with 10,000 received
- **THEN** the sale stores change 4,000

#### Scenario: Not enough cash
- **WHEN** a cash sale of 6,000 is registered with 5,000 received
- **THEN** the response is 400 with `error.code` `VALIDATION_ERROR`

#### Scenario: Missing method
- **WHEN** a sale is sent without a payment method
- **THEN** the response is 400

### Requirement: Stock is checked and decreased
A sale SHALL be rejected entirely if any item quantity exceeds current stock; otherwise stock SHALL decrease for every item in the same operation and the low-stock rule SHALL be evaluated.

#### Scenario: Quantity exceeds stock
- **WHEN** a sale requests 10 units of a product with stock 3
- **THEN** the response is 409 with `error.code` `INSUFFICIENT_STOCK`, no sale is saved and no stock changes

#### Scenario: Stock decreases
- **WHEN** a sale of 2 units succeeds for a product with stock 8
- **THEN** the product stock is 6 and a `sale` movement is recorded

### Requirement: Price snapshot
A sale SHALL keep the product name and unit price at the moment of sale, unaffected by later product edits or deletion.

#### Scenario: Price changes later
- **WHEN** a product's price changes after a sale
- **THEN** the sale detail still shows the original price and total

### Requirement: Sales history
Store users SHALL list sales with filters by date range, payment method and cashier, paginated and newest first; a `store_cashier` SHALL only see their own sales.

#### Scenario: Filter by Nequi
- **WHEN** the owner lists sales with `paymentMethod=nequi`
- **THEN** only Nequi sales are returned

#### Scenario: Cashier history
- **WHEN** a cashier lists sales filtered by another cashier's id
- **THEN** only the requesting cashier's own sales are returned

#### Scenario: Sale detail
- **WHEN** a user opens a sale
- **THEN** they see items, quantities, unit prices, total, method, cashier and time

### Requirement: Daily totals per payment method
`store_owner` SHALL get, for a given day in America/Bogota time, the total amount and count of sales for card, Nequi and cash and the grand total; other roles SHALL NOT access totals.

#### Scenario: Totals match the sales
- **WHEN** the owner requests today's summary
- **THEN** each method's total equals the sum of that day's sales with that method and the grand total is their sum

#### Scenario: Inventory clerk requests totals
- **WHEN** a `store_inventory` user calls `GET /sales/summary/daily`
- **THEN** the response is 403

### Requirement: Void a sale
A `store_owner` SHALL void a non-voided sale of their store with a reason of 3 to 200 characters, restoring the stock of every item and recording who voided it and when.

#### Scenario: Owner voids a sale
- **WHEN** the owner voids a sale of 2 units with reason "wrong product"
- **THEN** the sale is marked voided with the reason, author and time, and the product stock increases by 2 with a `void` movement

#### Scenario: Void twice
- **WHEN** an already voided sale is voided again
- **THEN** the response is 409 and stock does not change

#### Scenario: Cashier tries to void
- **WHEN** a `store_cashier` voids a sale
- **THEN** the response is 403

### Requirement: Voided sales in reports
Voided sales SHALL remain visible in the sales history with a voided mark and SHALL be excluded from daily totals, best sellers and restock calculations.

#### Scenario: Totals after a void
- **WHEN** a card sale of 6,000 is voided
- **THEN** today's card total decreases by 6,000 and the sale still appears in the history as voided

### Requirement: Export sales as CSV
A `store_owner` SHALL download the sales matching the history filters (range up to 92 days) as a UTF-8 CSV with one row per sale item: date, sale id, cashier, payment method, product, quantity, unit price, subtotal, sale total and voided flag.

#### Scenario: Export a month
- **WHEN** the owner exports the last 30 days filtered by `cash`
- **THEN** the file contains a header row and one row per item of every cash sale in that range

#### Scenario: Range too long
- **WHEN** the owner exports a range longer than 92 days
- **THEN** the response is 400

#### Scenario: Cashier exports
- **WHEN** a `store_cashier` calls `GET /sales/export`
- **THEN** the response is 403

### Requirement: Formula injection protection
Exported cells whose text starts with `=`, `+`, `-` or `@` SHALL be prefixed so spreadsheets treat them as text.

#### Scenario: Product named like a formula
- **WHEN** a product is named `=HYPERLINK("x")`
- **THEN** the exported cell is `'=HYPERLINK("x")`
