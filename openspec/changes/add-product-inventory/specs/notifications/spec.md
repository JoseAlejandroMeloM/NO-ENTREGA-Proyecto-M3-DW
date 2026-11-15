## ADDED Requirements

### Requirement: Low-stock notification type
The notification center SHALL support the `low_stock` type, whose message names the product and current stock and whose link opens the product.

#### Scenario: Open a low-stock notification
- **WHEN** a user clicks a `low_stock` notification
- **THEN** the product form (S07) of that product opens
