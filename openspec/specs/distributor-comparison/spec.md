# distributor-comparison Specification

## Purpose
Helps stores find distributors and choose the best one for a product by comparing price, delivery time, minimum order, rating and coverage.

## Requirements

### Requirement: Distributor directory
`store_owner` and `store_inventory` SHALL list distributors with search by name and filter by category, seeing rating, delivery days, minimum order and categories; distributor users MAY read the directory.

#### Scenario: Search by category
- **WHEN** a store owner filters the directory by `beverages`
- **THEN** only distributors with available items in that category are listed

#### Scenario: Cashier opens the directory
- **WHEN** a `store_cashier` calls `GET /distributors`
- **THEN** the response is 403

### Requirement: Distributor profile and catalog
Store users with access SHALL open a distributor profile with its public data and its available catalog items.

#### Scenario: Open a profile
- **WHEN** a store owner opens a distributor
- **THEN** they see its delivery days, minimum order, coverage, rating and available items with prices

### Requirement: Compare distributors
Given a product name or category, the system SHALL return one row per distributor that offers a matching available item, with the lowest matching price, delivery days, minimum order, rating and coverage.

#### Scenario: Compare rice
- **WHEN** a store owner compares `arroz`
- **THEN** each distributor with a matching item appears once with its lowest matching price

#### Scenario: No query
- **WHEN** the comparison is requested without a product name or category
- **THEN** the response is 400

### Requirement: Comparison sorting
The comparison SHALL be sortable by price ascending, delivery days ascending or rating descending.

#### Scenario: Sort by price
- **WHEN** the comparison is sorted by price
- **THEN** the cheapest distributor is first
