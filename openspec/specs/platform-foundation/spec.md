# platform-foundation Specification

## Purpose
Baseline behavior every feature builds on: a health check, the published integration contract, a uniform error format, security headers and single-page-app hosting. Delivered by the project scaffold (PR #3).

## Requirements

### Requirement: Health check
The API SHALL expose `GET /api/health` without authentication, returning `status`, the database connection state (`connected`, `disconnected`, `connecting`, `not_configured`) and the server time.

#### Scenario: API is running
- **WHEN** a client calls `GET /api/health`
- **THEN** the response is 200 with `status` equal to `ok` and a `db` field with the connection state

#### Scenario: Database is unreachable
- **WHEN** the database cannot be reached and a client calls `GET /api/health`
- **THEN** the response is still 200 and `db` reports a state other than `connected`

### Requirement: Published integration contract
The API SHALL publish the OpenAPI contract as JSON at `/api/docs/openapi.json` and as an interactive Swagger UI at `/api/docs`.

#### Scenario: Contract is browsable
- **WHEN** a user opens `/api/docs`
- **THEN** Swagger UI lists every operation defined in `docs/spec/openapi.yaml`

### Requirement: Uniform error responses
Every API error SHALL use the body `{ "error": { "code", "message", "details" } }`, where `code` is one of the contract's error codes and `details` is a list of field messages.

#### Scenario: Unknown API route
- **WHEN** a client calls an `/api/*` path that does not exist
- **THEN** the response is 404 with `error.code` equal to `NOT_FOUND`

#### Scenario: Malformed JSON body
- **WHEN** a client sends a body that is not valid JSON
- **THEN** the response is 400 with `error.code` equal to `VALIDATION_ERROR`

#### Scenario: Unexpected server failure
- **WHEN** an unhandled error occurs while processing a request
- **THEN** the response is 500 with `error.code` equal to `INTERNAL_ERROR` and no stack trace or internal detail is exposed

### Requirement: Security headers
Every response SHALL include security headers (Content-Security-Policy, X-Content-Type-Options, frame protection) and SHALL NOT include `X-Powered-By`.

#### Scenario: Headers on an API response
- **WHEN** a client calls any endpoint
- **THEN** the response has a `Content-Security-Policy` header and no `X-Powered-By` header

### Requirement: Request size limit
The API SHALL reject JSON bodies larger than 100 kB.

#### Scenario: Oversized body
- **WHEN** a client sends a JSON body larger than 100 kB
- **THEN** the response is 413 with `error.code` equal to `VALIDATION_ERROR`

### Requirement: Query operator injection protection
The API SHALL strip MongoDB operator keys (starting with `$` or containing `.`) from request bodies, queries and params before they reach the database.

#### Scenario: Operator in a body field
- **WHEN** a client sends `{"email": {"$gt": ""}}`
- **THEN** the operator never reaches a database query

### Requirement: Single-page app hosting
Each deployment SHALL serve the React application for every non-API path so deep links and browser refreshes work.

#### Scenario: Deep link refresh
- **WHEN** a user opens `/app/products` directly in the browser
- **THEN** the server responds 200 with the application page and the client router renders the screen

### Requirement: Configuration validated at startup
The server SHALL validate its environment variables at startup and refuse to start when one is invalid, reporting only the variable names, never their values.

#### Scenario: Invalid secret
- **WHEN** `JWT_SECRET` is set to fewer than 32 characters
- **THEN** startup fails with an error naming `JWT_SECRET` without printing its value
