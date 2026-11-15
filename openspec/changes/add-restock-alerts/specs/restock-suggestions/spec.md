## ADDED Requirements

### Requirement: Restock window alert
After a sale or stock change, when a product enters the restock window (days left ≤ lead time + 3) it SHALL trigger one alert to the store's `store_owner` and `store_inventory` users, and SHALL alert again only after leaving the window.

#### Scenario: Product enters the window
- **WHEN** a sale drops a product from 9 to 4 days left with lead time 2
- **THEN** one `restock_suggested` notification is created for each owner and inventory user

#### Scenario: Still in the window
- **WHEN** another sale drops the same product to 3 days left
- **THEN** no new notification is created

### Requirement: Restock count
The restock suggestions response SHALL include the number of products currently suggested, shown as a badge in the store sidebar for owner and inventory users.

#### Scenario: Badge count
- **WHEN** 4 products are in the restock window
- **THEN** the sidebar badge shows 4
