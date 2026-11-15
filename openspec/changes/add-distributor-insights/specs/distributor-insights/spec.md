## Purpose
Gives distributor owners the sales and service metrics of their own orders: revenue, best-selling items, top stores and delivery performance.

## ADDED Requirements

### Requirement: Distributor sales metrics
A `distributor_owner` SHALL get, for a range of 7, 30 or 90 days, the revenue of delivered orders, order counts by status, top 10 items by quantity and top 5 stores by revenue, computed only from their own orders.

#### Scenario: Metrics for 30 days
- **WHEN** the distributor owner requests 30-day insights
- **THEN** the response includes delivered revenue, counts per status, top items and top stores from that distributor's orders only

#### Scenario: Staff requests insights
- **WHEN** a `distributor_staff` calls `/distributor-insights`
- **THEN** the response is 403

### Requirement: Service metrics
The insights SHALL include the acceptance rate (accepted ÷ decided orders) and the average hours from acceptance to delivery for orders delivered in the range.

#### Scenario: Average delivery time
- **WHEN** two orders were delivered 24 and 48 hours after acceptance
- **THEN** the average delivery time is 36 hours
