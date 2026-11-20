# purchase-orders Specification

## Purpose
Connects a store and a distributor through tracked purchase orders: creation, acceptance, shipment, delivery and receiving into stock, with a visible history for both sides.

## Requirements

### Requirement: Create a purchase order
`store_owner` and `store_inventory` SHALL create an order to one distributor with available catalog items and quantities; the server SHALL compute prices and total from the catalog and create the order with status `pending` and a readable code.

#### Scenario: Valid order
- **WHEN** an inventory clerk orders available items whose total is above the distributor's minimum
- **THEN** the response is 201 with status `pending`, a code like `PO-000123` and the server-computed total

#### Scenario: Below minimum order
- **WHEN** the order total is below the distributor's minimum order
- **THEN** the response is 400 with `error.code` `BELOW_MINIMUM_ORDER` and no order is created

#### Scenario: Unavailable or foreign item
- **WHEN** the order includes an unavailable item or an item of another distributor
- **THEN** the response is 400

#### Scenario: Cashier tries to order
- **WHEN** a `store_cashier` calls `POST /orders`
- **THEN** the response is 403

### Requirement: Order visibility
A store SHALL see only its own orders and a distributor only orders addressed to it, each listable by status with pagination.

#### Scenario: Distributor lists incoming orders
- **WHEN** a `distributor_staff` lists orders with status `pending`
- **THEN** only pending orders addressed to their distributor are returned

#### Scenario: Third party opens an order
- **WHEN** a user of another store requests the order
- **THEN** the response is 404

### Requirement: Status workflow
Order status SHALL change only through the allowed transitions: the distributor owner accepts or rejects (reason required) a pending order; distributor owner or staff mark accepted orders shipped and shipped orders delivered; the store cancels while pending.

#### Scenario: Happy path
- **WHEN** the distributor accepts, then ships, then delivers an order
- **THEN** each call returns 200 and the status ends as `delivered`

#### Scenario: Invalid transition
- **WHEN** a distributor marks a `pending` order as `delivered`
- **THEN** the response is 409 with `error.code` `INVALID_TRANSITION`

#### Scenario: Staff tries to accept
- **WHEN** a `distributor_staff` accepts a pending order
- **THEN** the response is 403

#### Scenario: Reject without reason
- **WHEN** the distributor owner rejects an order without a reason
- **THEN** the response is 400

#### Scenario: Store cancels a shipped order
- **WHEN** a store owner cancels an order that is `shipped`
- **THEN** the response is 409

### Requirement: Status history and tracking
Every status change SHALL be appended to the order's history with status, user, timestamp and optional note, and both sides SHALL see it as a timeline.

#### Scenario: Timeline
- **WHEN** a store user opens a delivered order
- **THEN** the timeline shows pending, accepted, shipped and delivered with who and when

### Requirement: Status change notifications
Creating an order SHALL notify the distributor's users, and every status change SHALL notify the users of the other organization.

#### Scenario: Distributor ships
- **WHEN** the distributor marks an order shipped
- **THEN** the store's owner and inventory users get an `order_status` notification

### Requirement: Receive into stock
`store_owner` and `store_inventory` SHALL receive a `delivered` order exactly once, adding each item quantity to the matching store product or creating the product when none matches.

#### Scenario: Receive once
- **WHEN** a clerk receives a delivered order of 12 units of an existing product
- **THEN** that product's stock increases by 12 and a `purchase` movement is recorded

#### Scenario: Receive twice
- **WHEN** the same order is received again
- **THEN** the response is 409 and stock does not change

#### Scenario: Receive before delivery
- **WHEN** a clerk receives a `shipped` order
- **THEN** the response is 409

### Requirement: Estimated delivery date
When a distributor accepts an order, the order SHALL get an estimated delivery date, either provided (not in the past) or defaulting to the acceptance date plus the distributor's delivery days.

#### Scenario: Default estimate
- **WHEN** a distributor with 2 delivery days accepts an order without a date
- **THEN** the estimated delivery is the acceptance date plus 2 days

#### Scenario: Date in the past
- **WHEN** the distributor accepts with an estimated date before today
- **THEN** the response is 400

### Requirement: Tracking notes
Distributor owner and staff SHALL add tracking notes of up to 200 characters to orders that are `accepted` or `shipped`, shown to both sides on the timeline.

#### Scenario: Add a note
- **WHEN** a distributor staff adds "Left the warehouse" to a shipped order
- **THEN** the store sees the note on the timeline with author and time

#### Scenario: Note on a delivered order
- **WHEN** a note is added to a `delivered` order
- **THEN** the response is 409

#### Scenario: Store user adds a note
- **WHEN** a store owner calls the tracking endpoint
- **THEN** the response is 403

### Requirement: Delayed orders
An order that is `accepted` or `shipped` after the end of its estimated delivery date SHALL be reported as delayed in lists and detail for both sides.

#### Scenario: Late order
- **WHEN** an order estimated for yesterday is still `shipped`
- **THEN** it appears with a delayed flag in the store's and the distributor's order lists
