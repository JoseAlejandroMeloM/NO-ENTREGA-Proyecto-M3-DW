# Proposal: Production release — deploys, seed data, security audit and docs

**Priority:** P0 · **Stories:** TS-02, TS-03, TS-05, TS-06, TS-07 · **QA:** QA-22, QA-23, QA-24, QA-25 · **Depends on:** every core change

## Why
The course grades only what runs in production. The product must be live on two platforms with demo data, pass a security audit, and be documented so the professor and the team can run and explain it at Demo Day.

## What Changes
- Connect Vercel (primary) and Render (mirror) to `main` with production environment variables; both URLs in the README.
- Seed script with the demo store, 3 employees, 3 distributors with catalogs, ~40 products and 60 days of sales.
- Security audit document checking the TS-02 baseline (headers, CORS, rate limiting, validation, injection, JWT settings, secrets, dependency audit).
- README: problem, solution, architecture, setup, env vars, URLs, test accounts, Swagger and Figma links.
- Finish the Figma wireframes and screens still pending (S01–S04, S19–S26).

## Capabilities

### New Capabilities
None — this change ships and documents behavior defined by the other changes (`skip_specs: true`).

### Modified Capabilities
None.

## Impact
- New files: `server/src/seed/`, `docs/security-audit.md`, README sections.
- Platform settings on Vercel and Render (not in the repo): `MONGODB_URI`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `NODE_ENV`.
- MongoDB Atlas: network access for both platforms.
