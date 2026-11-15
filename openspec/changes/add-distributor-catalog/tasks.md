# Tasks

## 1. Catalog API
- [ ] 1.1 Add the `CatalogItem` model and `/catalog` CRUD for `distributor_owner` with org scoping; verify 201, 403 store user, 403 staff write, 404 other distributor
- [ ] 1.2 Exclude unavailable items from every store-facing query; verify with tests

## 2. Directory and comparison API
- [ ] 2.1 Implement `GET /distributors` (search, category) and `GET /distributors/{id}` + `/catalog`; verify category filter and 403 cashier
- [ ] 2.2 Implement `GET /distributors/compare` (lowest matching price per distributor, sort options); verify "arroz" ordering and 400 without query
- [ ] 2.4 Replace the `findBestDistributors()` stub in `server/src/modules/insights/service.ts` (cheapest available item matching category + name contains; its distributor's delivery days become the lead time); verify a restock suggestion names the cheapest distributor
- [ ] 2.3 Check the endpoints against `openapi.yaml` and verify Swagger UI

## 3. Client
- [ ] 3.1 Build S20 Catalog management (table, create/edit modal, availability toggle) and verify against Figma
- [ ] 3.2 Build S12 Directory cards and S13 Profile + catalog with "add to order"; verify navigation via `/app/distributors/:id`
- [ ] 3.3 Build S14 Compare with search and sort; verify sorting

## 4. Verification
- [ ] 4.1 Run QA-13 and QA-14 in production on both platforms and record the evidence on Trello
