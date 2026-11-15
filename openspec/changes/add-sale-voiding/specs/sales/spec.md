## ADDED Requirements

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
