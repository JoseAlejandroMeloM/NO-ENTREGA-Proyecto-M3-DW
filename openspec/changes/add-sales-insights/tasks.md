# Tasks

## 1. Insights API
- [x] 1.1 Implement `GET /insights/best-sellers?days=` with the aggregation; verify ordering, 400 range and 403 cashier with Supertest
- [x] 1.2 Implement `GET /insights/daily-sales?days=` with zero-filled days in America/Bogota; verify a gap day returns 0

## 2. Restock API
- [x] 2.1 Implement the BR4 calculation as a pure function; verify the scenario numbers (avgDaily 2 → 5 days, qty 23) with unit tests
- [x] 2.2 Implement `GET /insights/restock` with urgency sort and the default lead time; verify sorting, default lead time and 403 cashier (best-distributor matching needs catalogs: `findBestDistributors()` is a stub replaced by `add-distributor-catalog` task 2.4)
- [x] 2.3 Check the endpoints against `openapi.yaml` and verify Swagger UI

## 3. Client
- [x] 3.1 Build S10 Insights (range selector, Recharts daily chart, top 10 by units and revenue); verify with seed data
- [x] 3.2 Build S11 Restock table (urgency, days left, suggested quantity, best distributor column); verify against the BR4 numbers
- [ ] 3.3 "Order" button that opens S15 prefilled with distributor and quantity — done in `add-purchase-orders` task 3.1, since S15 does not exist yet

## 4. Verification
- [ ] 4.1 Run QA-08 and QA-09 in production on both platforms and record the evidence on Trello
