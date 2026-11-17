# Tasks

## 1. API
- [x] 1.1 Add `POST /sales/{id}/void` with reason validation, guarded update and stock restore in a transaction; verify 200, 409 twice and 403 cashier with Supertest
- [x] 1.2 Exclude voided sales from the daily summary and insights aggregations; verify totals drop after a void
- [x] 1.3 Add the endpoint to `openapi.yaml` and verify Swagger UI

## 2. Client
- [x] 2.1 Add the "Void sale" action (owner only, confirmation + reason) in the S09 drawer and a voided badge in the list; verify the flow

## 3. Verification
- [x] 3.1 Void a sale in production on both platforms and verify stock and totals; record the evidence on Trello
