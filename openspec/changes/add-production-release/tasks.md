# Tasks

## 1. Deployments
- [x] 1.1 Create the MongoDB Atlas cluster, database user and network access; verify the connection from a local `.env`
- [x] 1.2 Import the repo in Vercel with the production env vars; verify `/api/health` returns `db: connected` (QA-25)
- [x] 1.3 Create the Render service from `render.yaml` with `MONGODB_URI`; verify `/api/health` and the SPA deep links (QA-24)

## 2. Demo data
- [x] 2.1 Write the seed script (`npm run seed`, idempotent, refuses to run without `--confirm` in production) and verify insights show data after seeding

## 3. Audit and docs
- [x] 3.1 Write `docs/security-audit.md` with the TS-02 checklist and evidence; verify QA-23 in production
- [ ] 3.2 Complete the README (URLs, test accounts, architecture, Swagger and Figma links) and verify a fresh clone runs following it
- [x] 3.3 Finish the pending Figma wireframes and screens and verify every screen in `06-screens.md` has both

## 4. Verification
- [ ] 4.1 Run the full QA list (QA-01 to QA-25) on both production URLs and record the results on Trello
