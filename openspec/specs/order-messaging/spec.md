# order-messaging Specification

## Purpose
Gives the store and the distributor of a purchase order a private message thread attached to that order, so coordination stays on the platform.

## Requirements

### Requirement: Send a message
Users of the store or distributor of an order (store owner, store inventory, distributor owner, distributor staff) SHALL post text messages of 1 to 1000 characters to that order, stored with author, organization and timestamp.

#### Scenario: Store sends a message
- **WHEN** a store owner posts "Can you deliver before 10am?" on their order
- **THEN** the response is 201 with the message, author and time

#### Scenario: Message too long
- **WHEN** a message longer than 1000 characters is posted
- **THEN** the response is 400

#### Scenario: Cashier posts a message
- **WHEN** a `store_cashier` posts on an order
- **THEN** the response is 403

### Requirement: Read the thread
Only the two organizations of the order SHALL read its messages, in chronological order, optionally only those after a given timestamp.

#### Scenario: Third party reads
- **WHEN** a user of a different store requests an order's messages
- **THEN** the response is 404

#### Scenario: Poll for new messages
- **WHEN** a client requests messages after the timestamp of the last one it has
- **THEN** only newer messages are returned

### Requirement: Safe rendering
Message text SHALL be stored as plain text and always rendered as text, never as HTML.

#### Scenario: Script in a message
- **WHEN** a message contains `<script>alert(1)</script>`
- **THEN** the other side sees the literal text and no script runs

### Requirement: Live updates in the client
The messages panel SHALL show new messages from the other side within about 5 seconds without reloading, and stop polling when the panel is closed.

#### Scenario: Message arrives
- **WHEN** the distributor posts a message while the store user has the order open
- **THEN** the message appears on the store side within 5 seconds
