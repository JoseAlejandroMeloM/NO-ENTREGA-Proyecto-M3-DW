# Tasks

## 1. Products API
- [ ] 1.1 Add `Product` and `StockMovement` models with the indexes from `design.md`; verify with model tests
- [ ] 1.2 Implement `/products` CRUD + list filters (search, category, lowStock, pagination) with role and org rules; verify 201/409/403 and filters with Supertest
- [ ] 1.3 Implement soft delete and verify deleted products are excluded from lists

## 2. Stock service and alerts
- [ ] 2.1 Implement `stockService.apply()` with the conditional atomic update and movement log; verify negative-stock rejection and concurrent decrements in tests
- [ ] 2.2 Implement the low-stock flag + `low_stock` notification; verify "once until restocked" with tests
- [ ] 2.3 Implement `POST /products/{id}/adjustments` and `GET` movements; verify -999 → 400 with unchanged stock
- [ ] 2.4 Check the endpoints against `openapi.yaml` and verify Swagger UI

## 3. Client
- [ ] 3.1 Build S06 Products list (search, category, low-stock toggle, stock badge, pagination) and verify against Figma
- [ ] 3.2 Build S07 Product form with adjustment panel and movement history; verify create/edit/adjust flows
- [ ] 3.3 Hide write actions for cashiers and verify the API still returns 403 if called directly

## 4. Verification
- [ ] 4.1 Run QA-05, QA-06 and QA-07 in production on both platforms and record the evidence on Trello
