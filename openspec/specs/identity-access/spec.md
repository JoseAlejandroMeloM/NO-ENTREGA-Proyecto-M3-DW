# identity-access Specification

## Purpose
Lets stores and distributors create their organization and owner account, sign in, and makes every API request carry a verified identity, role and organization that the backend uses to authorize access.

## Requirements

### Requirement: Store registration
The system SHALL let a visitor register a store with owner name, email, password, store name, address and phone, creating the store and its owner with role `store_owner` and returning an access token and the user profile.

#### Scenario: Successful store registration
- **WHEN** a visitor submits valid store registration data
- **THEN** the response is 201 with a token and a user whose role is `store_owner` and whose organization is the new store

#### Scenario: Duplicate email
- **WHEN** a visitor registers with an email that already exists
- **THEN** the response is 409 with `error.code` `CONFLICT` and message "Email already registered", and no store is created

### Requirement: Distributor registration
The system SHALL let a visitor register a distributor with owner data plus company name, NIT, phone, coverage area, delivery time in days and minimum order in COP, creating a user with role `distributor_owner`.

#### Scenario: Successful distributor registration
- **WHEN** a visitor submits valid distributor registration data
- **THEN** the response is 201 with a token and a user whose role is `distributor_owner`

### Requirement: Password policy and storage
Passwords SHALL have at least 8 characters including letters and numbers, and SHALL be stored only as a bcrypt hash that is never returned by any endpoint.

#### Scenario: Weak password
- **WHEN** a visitor registers with the password `abcdefgh`
- **THEN** the response is 400 with `error.code` `VALIDATION_ERROR` and a detail for the `password` field

#### Scenario: Hash never exposed
- **WHEN** any endpoint returns a user
- **THEN** the body contains no password or password hash field

### Requirement: Login
The system SHALL exchange a valid email and password of an active user for an access token valid for 15 minutes plus the user profile with role and organization.

#### Scenario: Valid credentials
- **WHEN** an active user logs in with the correct password
- **THEN** the response is 200 with a token and the user's role and organization

#### Scenario: Invalid credentials
- **WHEN** someone logs in with an unknown email or a wrong password
- **THEN** the response is 401 with the same message "Invalid credentials" in both cases

#### Scenario: Deactivated user
- **WHEN** a deactivated user logs in with the correct password
- **THEN** the response is 401 and no token is issued

### Requirement: Login rate limiting
The system SHALL reject further login attempts from an IP address after 5 failed attempts within 15 minutes.

#### Scenario: Too many failed attempts
- **WHEN** the same IP fails to log in 5 times within 15 minutes and tries again
- **THEN** the response is 429 with `error.code` `RATE_LIMITED`

### Requirement: Authenticated requests
Protected endpoints SHALL require a bearer token signed by the API with the expected issuer and audience, and SHALL reject missing, expired, tampered or wrongly signed tokens.

#### Scenario: Missing token
- **WHEN** a client calls a protected endpoint without a token
- **THEN** the response is 401 with `error.code` `UNAUTHORIZED`

#### Scenario: Token signed with another algorithm
- **WHEN** a client sends a token signed with `none` or an algorithm other than HS256
- **THEN** the response is 401

#### Scenario: Current user
- **WHEN** an authenticated user calls `GET /auth/me`
- **THEN** the response is 200 with their profile and organization

### Requirement: Role authorization
Each protected endpoint SHALL allow only the roles listed for it in the permission matrix (`docs/spec/01-scope-and-roles.md`).

#### Scenario: Role not allowed
- **WHEN** a `store_cashier` calls an endpoint reserved for `store_owner`
- **THEN** the response is 403 with `error.code` `FORBIDDEN`

### Requirement: Organization scoping
A user SHALL only read or change data that belongs to their own organization; resources of another organization SHALL be reported as not found.

#### Scenario: Another store's resource
- **WHEN** a user of store A requests a resource id that belongs to store B
- **THEN** the response is 404 and no data from store B is returned

### Requirement: Client session and protected routes
The web client SHALL keep the session until logout or token expiry and SHALL redirect unauthenticated users from protected pages to `/login`, and users without the required role to a 403 page.

#### Scenario: Logged out user opens a protected page
- **WHEN** a visitor without a session opens `/app`
- **THEN** they are redirected to `/login`

#### Scenario: Logout
- **WHEN** a user logs out
- **THEN** the session is cleared and protected pages redirect to `/login`
