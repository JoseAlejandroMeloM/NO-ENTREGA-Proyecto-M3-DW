## ADDED Requirements

### Requirement: Restock notification type
The notification center SHALL support the `restock_suggested` type, whose message includes the product, days left and suggested quantity and whose link opens S11.

#### Scenario: Open a restock notification
- **WHEN** a user clicks a `restock_suggested` notification
- **THEN** the restock suggestions screen opens
