# Tasks

## 1. Orders API
- [ ] 1.1 Add `PurchaseOrder` (items snapshot, statusHistory, receivedAt, rated), order counter and `Rating` models; verify with model tests
- [ ] 1.2 Implement `POST /orders` with catalog pricing, availability check and minimum order; verify 201, 400 `BELOW_MINIMUM_ORDER`, 400 foreign item, 403 cashier
- [ ] 1.3 Implement `GET /orders` and `GET /orders/{id}` with side scoping and status filter; verify 404 for third parties

## 2. Workflow
- [ ] 2.1 Implement the transition table and `PATCH /orders/{id}/status` with guarded update, history and notifications; verify happy path, 409 invalid, 403 staff accept, 400 reject without reason
- [ ] 2.2 Implement `POST /orders/{id}/receive` (once, transaction, product matching/creation); verify stock +12 once and 409 on repeat or before delivery
- [ ] 2.3 Implement `POST /orders/{id}/rating` and the distributor average; verify 201, 409 twice, 409 not delivered, 403 inventory
- [ ] 2.4 Check the endpoints against `openapi.yaml` and verify Swagger UI

## 3. Client
- [ ] 3.1 Build S15 New order (from S13 or the S11 "Order" button prefilled with distributor and suggested quantity, total vs minimum indicator); verify the minimum-order error and the S11 shortcut
- [ ] 3.2 Build S16 Orders list and S17 Order detail (timeline, cancel / receive / rate actions); verify each action per role
- [ ] 3.3 Build S21 Incoming orders, S22 Order detail (accept / reject / ship / deliver) and S19 Distributor dashboard; verify against Figma

## 4. Verification
- [ ] 4.1 Run QA-15 to QA-19 in production on both platforms and record the evidence on Trello
