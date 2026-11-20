## ADDED Requirements

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
