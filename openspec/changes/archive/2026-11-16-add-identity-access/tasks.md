# Tasks

## 1. Data and security primitives
- [x] 1.1 Add `Store`, `Distributor` and `User` Mongoose models per `03-data-model.md` (unique email index, `passwordHash` with `select: false`) and verify with a model unit test
- [x] 1.2 Add password hashing (bcrypt cost 12) and JWT sign/verify helpers pinned to HS256 + issuer/audience; verify with unit tests including a `none`-algorithm token
- [x] 1.3 Make `JWT_SECRET` required when `NODE_ENV=production` and verify startup fails without it

## 2. Registration and login API
- [x] 2.1 Implement `POST /auth/register-store` and `POST /auth/register-distributor` with zod schemas; verify 201, 400 weak password and 409 duplicate email with Supertest (mongodb-memory-server)
- [x] 2.2 Implement `POST /auth/login` with the generic error and the login rate limiter; verify 200, 401 (both cases), deactivated user 401 and 429 after 5 failures
- [x] 2.3 Implement `GET /auth/me`; verify 200 with token and 401 without

## 3. Authorization layer
- [x] 3.1 Add `authenticate`, `authorize(...roles)` and `scopeToOrg` middleware/helpers; verify 401/403/404 cases with a test-only route
- [x] 3.2 Update `openapi.yaml` if request/response shapes changed and verify Swagger UI shows the auth endpoints with the bearer scheme

## 4. Client
- [x] 4.1 Add `AuthContext` + `useAuth` hook (sessionStorage, logout, 401 → redirect) and verify login/logout manually
- [x] 4.2 Build S02 Login, S03 Register store and S04 Register distributor following Figma, with field errors from the API `details`; verify each form end to end locally
- [x] 4.3 Add `ProtectedRoute(roles)` and the 403 page (S26); verify a logged-out visit to `/app` redirects to `/login`

## 5. Verification
- [x] 5.1 Run QA-01, QA-02, QA-03 and the login part of QA-23 in production on Vercel and Render and record the evidence on the Trello cards
