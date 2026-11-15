## Purpose
Lets the store owner close each business day by comparing the cash the system expects with the cash actually counted, keeping a history of differences.

## ADDED Requirements

### Requirement: Close a day
A `store_owner` SHALL close a day once, entering opening float and counted cash; the system SHALL store expected cash (opening float + cash sales of the day), card and Nequi totals and the difference (counted − expected).

#### Scenario: Close with a shortage
- **WHEN** expected cash is 150,000 and the owner counts 145,000
- **THEN** the closing is saved with difference −5,000

#### Scenario: Close the same day twice
- **WHEN** the owner closes a day that already has a closing
- **THEN** the response is 409

#### Scenario: Cashier tries to close
- **WHEN** a `store_cashier` calls `POST /closings`
- **THEN** the response is 403

### Requirement: Closings history
A `store_owner` SHALL list past closings of their store with date, expected, counted, difference and note, newest first.

#### Scenario: View history
- **WHEN** the owner opens the closings history
- **THEN** each closed day appears once with its difference highlighted when not zero
