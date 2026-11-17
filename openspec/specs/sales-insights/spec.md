# sales-insights Specification

## Purpose
Shows store owners and inventory clerks which products sell the most and how daily sales evolve, computed from the store's own sales history.

## Requirements

### Requirement: Best sellers
`store_owner` and `store_inventory` SHALL get the top 10 products of their store by units sold and by revenue for a range of 7, 30 or 90 days.

#### Scenario: Top 10 by units for 30 days
- **WHEN** the owner requests best sellers for 30 days
- **THEN** the response lists at most 10 products ordered by units sold descending, each with units and revenue

#### Scenario: Invalid range
- **WHEN** a range other than 7, 30 or 90 is requested
- **THEN** the response is 400

#### Scenario: Cashier requests insights
- **WHEN** a `store_cashier` calls `/insights/best-sellers`
- **THEN** the response is 403

### Requirement: Daily sales trend
The system SHALL return one point per day of the selected range with total amount and number of sales, including days with zero sales, grouped in America/Bogota time.

#### Scenario: Day without sales
- **WHEN** the range includes a day with no sales
- **THEN** that day appears with total 0 and count 0
