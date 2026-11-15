## ADDED Requirements

### Requirement: Order notification types
The notification center SHALL support `order_created` and `order_status` types, whose message includes the order code and new status and whose link opens the order detail for the recipient's side.

#### Scenario: Open an order notification
- **WHEN** a distributor user clicks an `order_created` notification
- **THEN** the order detail S22 for that order opens
