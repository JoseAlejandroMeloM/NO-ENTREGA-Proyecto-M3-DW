# Tasks

## 1. API
- [ ] 1.1 Add `estimatedDelivery` on accept (default from delivery days, reject past dates); verify both scenarios with Supertest
- [ ] 1.2 Add `POST /orders/{id}/tracking` with status and role rules; verify 201, 409 delivered and 403 store user
- [ ] 1.3 Compute `delayed` in order responses (America/Bogota day end); verify with a fixed clock in tests
- [ ] 1.4 Update `openapi.yaml` and verify Swagger UI

## 2. Client
- [ ] 2.1 Show the ETA, tracking notes and delayed badge on S16, S17, S21 and S22; add the note form on S22; verify both sides

## 3. Verification
- [ ] 3.1 Accept with ETA, add a note and check the delayed flag in production on both platforms; record the evidence on Trello
