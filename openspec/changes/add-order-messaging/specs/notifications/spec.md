## ADDED Requirements

### Requirement: Message notification type
The notification center SHALL support the `order_message` type, created for the users of the other organization when a message is posted, linking to the order detail.

#### Scenario: Distributor writes
- **WHEN** a distributor user posts a message on an order
- **THEN** the store's owner and inventory users get one `order_message` notification
