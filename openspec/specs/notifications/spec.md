# notifications Specification

## Purpose
TBD - created by archiving change add-product-inventory. Update Purpose after archive.

## Requirements

### Requirement: Low-stock notification type
The notification center SHALL support the `low_stock` type, whose message names the product and current stock and whose link opens the product.

#### Scenario: Open a low-stock notification
- **WHEN** a user clicks a `low_stock` notification
- **THEN** the product form (S07) of that product opens

### Requirement: Notification delivery
When a module raises an event for users or for roles within an organization, the system SHALL create one notification per recipient with type, message, link to the related screen and unread state.

#### Scenario: Event for roles in a store
- **WHEN** an event targets `store_owner` and `store_inventory` of store A
- **THEN** every active user with those roles in store A gets one unread notification and nobody else does

### Requirement: List own notifications
A user SHALL list only their own notifications, newest first, paginated, with the total unread count.

#### Scenario: User opens notifications
- **WHEN** a user calls `GET /notifications`
- **THEN** only that user's notifications are returned, newest first, with `unreadCount`

### Requirement: Mark as read
A user SHALL mark one of their notifications as read, or all of them at once; marking a notification of another user SHALL fail as not found.

#### Scenario: Mark all as read
- **WHEN** a user with 3 unread notifications calls `POST /notifications/read-all`
- **THEN** the unread count becomes 0

#### Scenario: Another user's notification
- **WHEN** a user marks a notification id that belongs to someone else
- **THEN** the response is 404

### Requirement: Notification bell
The web client SHALL show the unread count in the top bar, refresh it at least every 30 seconds, and show the latest 5 notifications in a dropdown linking to their screens.

#### Scenario: New notification appears
- **WHEN** a new notification is created for the logged-in user
- **THEN** the bell count increases within 30 seconds without reloading the page

### Requirement: Order notification types
The notification center SHALL support `order_created` and `order_status` types, whose message includes the order code and new status and whose link opens the order detail for the recipient's side.

#### Scenario: Open an order notification
- **WHEN** a distributor user clicks an `order_created` notification
- **THEN** the order detail S22 for that order opens

### Requirement: Message notification type
The notification center SHALL support the `message` type, created for the users of the other organization when a message is posted, linking to the order detail.

#### Scenario: Distributor writes
- **WHEN** a distributor user posts a message on an order
- **THEN** the store's owner and inventory users get one `message` notification
