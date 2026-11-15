# Tasks

## 1. Insights API
- [ ] 1.1 Implement `GET /insights/best-sellers?range=` with the aggregation; verify ordering, 400 range and 403 cashier with Supertest
- [ ] 1.2 Implement `GET /insights/daily-sales?range=` with zero-filled days in America/Bogota; verify a gap day returns 0

## 2. Restock API
- [ ] 2.1 Implement the BR4 calculation as a pure function; verify the scenario numbers (avgDaily 2 → 5 days, qty 23) with unit tests
- [ ] 2.2 Implement `GET /insights/restock` with best-distributor matching and urgency sort; verify sorting, default lead time and 403 cashier
- [ ] 2.3 Check the endpoints against `openapi.yaml` and verify Swagger UI

## 3. Client
- [ ] 3.1 Build S10 Insights (range selector, Recharts daily chart, top 10 by units and revenue); verify with seed data
- [ ] 3.2 Build S11 Restock table with "Order" button that opens S15 prefilled with distributor and quantity; verify the shortcut

## 4. Verification
- [ ] 4.1 Run QA-08 and QA-09 in production on both platforms and record the evidence on Trello
