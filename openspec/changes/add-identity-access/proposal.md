# Proposal: Accounts, login and role-based access

**Priority:** P0 · **Stories:** US-01, US-02, US-03, TS-02 (auth part) · **QA:** QA-01, QA-02, QA-03, QA-23 · **Screens:** S02, S03, S04

## Why
Every other feature depends on knowing who the user is, which organization they belong to and what their role allows. Without authentication there is no way to enforce the permission matrix, which the M3 rubric checks in the backend.

## What Changes
- Self-registration for a store (creates the store and a `store_owner`) and a distributor (creates the distributor and a `distributor_owner`).
- Email + password login that returns a short-lived JWT plus the user profile; `GET /auth/me`.
- `authenticate` and `authorize(...roles)` middleware and an organization-ownership helper reused by every later change.
- Login rate limiting and password hashing.
- Client: login and register screens, an auth context, a protected route that checks roles, and logout.

## Capabilities

### New Capabilities
- `identity-access`: registration of organizations with their owner, login, token validation, role authorization and organization scoping.

### Modified Capabilities
None.

## Impact
- API: `/auth/register-store`, `/auth/register-distributor`, `/auth/login`, `/auth/me` (already in `docs/spec/openapi.yaml`).
- Data: `users`, `stores`, `distributors` collections (`docs/spec/03-data-model.md`).
- Dependencies: `jsonwebtoken`, `bcrypt`. Env vars `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` become required in production.
- Out of scope: password reset, email verification, refresh tokens, social login.
