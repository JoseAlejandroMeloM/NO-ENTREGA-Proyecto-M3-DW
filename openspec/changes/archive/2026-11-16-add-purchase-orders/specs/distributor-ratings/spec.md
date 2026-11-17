## Purpose
Lets stores rate distributors after each delivery so that comparisons reflect service quality, not just price.

## ADDED Requirements

### Requirement: Rate a delivered order
A `store_owner` SHALL rate a delivered order of their store once with 1 to 5 stars and an optional comment of up to 300 characters (as in the contract and data model).

#### Scenario: Rate once
- **WHEN** a store owner rates a delivered order with 4 stars
- **THEN** the response is 201 and the order is marked as rated

#### Scenario: Rate twice
- **WHEN** the same order is rated again
- **THEN** the response is 409

#### Scenario: Order not delivered
- **WHEN** a store owner rates a `shipped` order
- **THEN** the response is 409

#### Scenario: Inventory clerk rates
- **WHEN** a `store_inventory` user rates an order
- **THEN** the response is 403

### Requirement: Distributor average rating
A distributor's rating SHALL be the average of all its ratings, with the count, shown in the directory, profile and comparison.

#### Scenario: Average updates
- **WHEN** a distributor with ratings 5 and 3 receives a 4
- **THEN** its rating is 4.0 from 3 ratings
