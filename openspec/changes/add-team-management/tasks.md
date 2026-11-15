# Tasks

## 1. API
- [ ] 1.1 Implement `POST /users` and `GET /users` with role rules per organization type; verify 201, 400 invalid role, 403 employee with Supertest
- [ ] 1.2 Implement `PATCH /users/{id}` (active flag, name) with self-deactivation guard and org scoping; verify 200, 409 self, 404 other org, and that a deactivated user's token gets 401
- [ ] 1.3 Implement `GET/PATCH /stores/me` and `GET/PATCH /distributors/me`; verify owner 200 and employee 403 on PATCH
- [ ] 1.4 Check the endpoints against `openapi.yaml` and verify they render in Swagger UI

## 2. Client
- [ ] 2.1 Build S18 Store team and S24 Distributor team (list, create modal, active toggle) and verify against Figma
- [ ] 2.2 Build S23 Company profile form for distributors and the store profile section; verify edits persist after reload

## 3. Verification
- [ ] 3.1 Run QA-04 in production on both platforms and record the evidence on Trello
