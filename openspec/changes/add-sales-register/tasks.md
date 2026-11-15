# Tasks

## 1. Sales API
- [ ] 1.1 Add the `Sale` model (item snapshots, method, amountReceived, change, cashierId, indexes on `{storeId, createdAt}`); verify with model tests
- [ ] 1.2 Implement `POST /sales` with server-side pricing, merged lines, cash rules and a transaction over stock decrements; verify 201, 400 cash/method, 403 inventory and 409 with unchanged stock using `MongoMemoryReplSet`
- [ ] 1.3 Implement `GET /sales` (filters, pagination, cashier scoping) and `GET /sales/{id}`; verify Nequi filter and cashier scoping
- [ ] 1.4 Implement `GET /sales/summary/daily` aggregation in America/Bogota; verify totals equal the sum of seeded sales and 403 for inventory
- [ ] 1.5 Check the endpoints against `openapi.yaml` and verify Swagger UI

## 2. Client
- [ ] 2.1 Build S08 New sale (product search, cart, method selector, cash received + change, 409 stock error message) following the annotated Figma screen; verify the full flow
- [ ] 2.2 Build S09 Sales history with filters and detail drawer; verify cashier sees only own sales
- [ ] 2.3 Add today's totals by method to S05 dashboard (owner only); verify they match S09

## 3. Verification
- [ ] 3.1 Run QA-10, QA-11 and QA-12 in production on both platforms and record the evidence on Trello
