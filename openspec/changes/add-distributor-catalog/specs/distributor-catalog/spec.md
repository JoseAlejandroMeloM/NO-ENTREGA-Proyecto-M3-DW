## Purpose
Lets each distributor publish and maintain the list of products it sells, with price and availability, so stores can order from it.

## ADDED Requirements

### Requirement: Manage catalog items
A `distributor_owner` SHALL create, edit and delete catalog items of their own distributor with name, category, unit, price in COP and availability.

#### Scenario: Create an item
- **WHEN** a `distributor_owner` creates an item with valid data
- **THEN** the response is 201 and the item belongs to their distributor

#### Scenario: Store user tries to create an item
- **WHEN** a `store_owner` calls `POST /catalog`
- **THEN** the response is 403

#### Scenario: Staff tries to edit an item
- **WHEN** a `distributor_staff` calls `PATCH /catalog/{id}`
- **THEN** the response is 403

#### Scenario: Another distributor's item
- **WHEN** a distributor owner edits an item of another distributor
- **THEN** the response is 404

### Requirement: Availability
Unavailable items SHALL stay visible to their distributor but SHALL NOT be offered to stores in profiles, comparisons or new orders.

#### Scenario: Item marked unavailable
- **WHEN** a distributor marks an item unavailable
- **THEN** stores no longer see it in comparisons or when creating an order

### Requirement: Own catalog list
Distributor users (owner and staff) SHALL list their own catalog with search and pagination.

#### Scenario: Staff reads the catalog
- **WHEN** a `distributor_staff` calls `GET /catalog`
- **THEN** the response is 200 with their distributor's items only
