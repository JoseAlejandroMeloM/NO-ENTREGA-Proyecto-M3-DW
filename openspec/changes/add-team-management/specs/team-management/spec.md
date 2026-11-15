## Purpose
Lets each organization owner manage the employee accounts of their own organization, with roles limited to the organization type, and keep the organization profile up to date.

## ADDED Requirements

### Requirement: Create employee accounts
An owner SHALL create employee accounts in their own organization; a `store_owner` MAY assign only `store_inventory` or `store_cashier`, and a `distributor_owner` only `distributor_staff`.

#### Scenario: Store owner creates a cashier
- **WHEN** a `store_owner` creates a user with role `store_cashier`
- **THEN** the response is 201 and the user belongs to the owner's store and is active

#### Scenario: Role not valid for the organization
- **WHEN** a `store_owner` creates a user with role `distributor_staff` or `store_owner`
- **THEN** the response is 400 with `error.code` `VALIDATION_ERROR`

#### Scenario: Employee tries to create users
- **WHEN** a `store_cashier` calls `POST /users`
- **THEN** the response is 403

### Requirement: List employees
An owner SHALL list the users of their own organization with name, email, role and active status, and never see users of other organizations.

#### Scenario: Owner lists the team
- **WHEN** a `distributor_owner` calls `GET /users`
- **THEN** only users of that distributor are returned and none has a password field

### Requirement: Deactivate and reactivate employees
An owner SHALL activate or deactivate an employee of their organization; a deactivated user SHALL be rejected on login and on every request with an existing token. An owner SHALL NOT deactivate themselves.

#### Scenario: Deactivated employee is locked out
- **WHEN** an owner deactivates a cashier and the cashier then calls any protected endpoint with a previously valid token
- **THEN** the response is 401

#### Scenario: Owner deactivates themselves
- **WHEN** an owner tries to deactivate their own account
- **THEN** the response is 409 with `error.code` `CONFLICT`

#### Scenario: Employee of another organization
- **WHEN** an owner tries to update a user id from another organization
- **THEN** the response is 404

### Requirement: Organization profile
An owner SHALL view and edit their organization profile: name, address and phone for a store; name, phone, coverage, delivery days and minimum order for a distributor. Employees SHALL only read it.

#### Scenario: Distributor owner updates delivery days
- **WHEN** a `distributor_owner` sets delivery days to 2 on `PATCH /distributors/me`
- **THEN** the response is 200 and comparisons use the new value

#### Scenario: Staff tries to edit the profile
- **WHEN** a `distributor_staff` calls `PATCH /distributors/me`
- **THEN** the response is 403
