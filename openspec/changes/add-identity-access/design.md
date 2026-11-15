# Design

## Context
The scaffold already validates env vars, has the error handler and the `validate(zod)` middleware. The API runs as a serverless function on Vercel, so the auth state must be stateless.

## Goals / Non-Goals
**Goals:** stateless auth that works identically on Vercel and Render; one reusable authorization layer for all modules.
**Non-Goals:** refresh tokens, session revocation lists, multi-organization users.

## Decisions
- **JWT access token only, 15 min, HS256 with fixed `iss`/`aud`.** Verification pins `algorithms: ['HS256']` to block algorithm-confusion attacks. Alternative (server sessions) rejected: needs a shared store across serverless instances.
- **Token payload:** `sub` (user id), `role`, `orgType`, `orgId`. `authenticate` reloads the user to reject deactivated accounts immediately (one indexed lookup per request; acceptable at this scale).
- **Token storage in the client: `sessionStorage`.** Same-origin deployment and React's escaping limit XSS risk; httpOnly cookies would need CSRF protection and a refresh flow we do not have time for. Documented as a known trade-off for the security audit.
- **bcrypt cost 12**, `passwordHash` with `select: false` so it is never returned by accident.
- **Generic login error** ("Invalid credentials") for unknown email and wrong password, to avoid account enumeration.
- **Rate limit** `/auth/login`: 5 failed attempts per IP per 15 min (`express-rate-limit`, `skipSuccessfulRequests`). In-memory store per instance is acceptable for the demo.
- **Registration is one transaction-like flow:** create organization, then owner; if the user insert fails (duplicate email) the organization is deleted.
- **Authorization helpers:** `authorize(...roles)` checks the role; `scopeToOrg(req)` returns the filter `{ storeId | distributorId: req.user.orgId }` used by every service query, so ownership is enforced in one place.

## Risks / Trade-offs
- [Token in sessionStorage can be read by injected scripts] → strict CSP from helmet, no `dangerouslySetInnerHTML`, all text rendered escaped.
- [In-memory rate limit resets per serverless instance] → acceptable for the course; note in the security audit.
- [15-minute expiry interrupts long demos] → client redirects to `/login` on 401 with a clear message.
