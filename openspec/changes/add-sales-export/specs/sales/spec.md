## ADDED Requirements

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
