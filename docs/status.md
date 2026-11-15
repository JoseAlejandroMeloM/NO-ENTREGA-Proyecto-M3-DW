# Project status

Last updated: **2026-11-15**. Update this file whenever a milestone below changes. Feature-level status lives in the change board (`docs/workflow.md`); this page is the one-screen summary.

## Done
- **Specification**: scope, roles and permission matrix, 22 user stories + 7 technical stories, 25 QA tickets, data model, OpenAPI contract, architecture, screen list (`docs/spec/`).
- **Scaffold and CI**: monorepo, health check, Swagger UI at `/api/docs`, security headers, CI (lint, typecheck, tests, spec validation, build, audit) on every PR.
- **All P0/P1 features built and merged** (issues #11–#19 closed, PRs up to #61), backend + frontend + tests (109 passing):

| Change | Issue | What users get |
|---|---|---|
| `add-identity-access` | #11 | Register store / distributor, login, JWT session, protected routes |
| `add-team-management` | #12 | Owners add and deactivate employees by role |
| `add-notifications` | #13 | In-app bell and notifications page |
| `add-product-inventory` | #14 | Products, stock adjustments, movement history, low-stock alerts |
| `add-sales-register` | #15 | POS sale (cash / card / Nequi), sales history, today's totals |
| `add-sales-insights` | #16 | Daily sales chart, best sellers, restock suggestions |
| `add-distributor-catalog` | #17 | Distributor catalog, directory, compare distributors |
| `add-purchase-orders` | #18 | Orders store → distributor, status flow, receive into stock, rating |
| `add-order-messaging` | #19 | Chat per order (5 s polling) |

- **Local demo**: `npm run demo` seeds a realistic store, three distributors, 60 days of sales and orders in every status.
- **Design brief** for the visual passes: `docs/design-brief.md`.

## Not done yet (in order)
| When | Work | Tracked in | Who |
|---|---|---|---|
| Nov 15–16 | **Visual design passes 1–6** (presentation only) with the Fable model; at least passes 1–3 | `docs/design-brief.md` → Passes; branch `feature/ui-<pass>` per pass | Jose runs the sessions |
| Nov 17 | **Production deploy** on Vercel (primary) and Render (mirror) with MongoDB Atlas; seed script; security audit doc | `add-production-release`, issue #20, branch `chore/add-production-release` | Jose creates the free accounts; the AI configures |
| Nov 18 | **QA in production**: QA-01…QA-25 on both URLs, evidence on the GitHub issue (#27–#51) and Trello card | Last task in every change's `tasks.md` | Team |
| Nov 18 | **Figma**: missing final screens S01–S04, S19–S26 and all wireframes | `add-production-release` task 3.3 | AI via Figma connector |
| Nov 18 | **Archive** each change after its QA passes, in board order (moves deltas into `openspec/specs/`) | `docs/workflow.md` → step 6 | AI |
| Nov 19 | Final README (URLs, accounts, links), Swagger and ai-log review; Demo Day study guide | `add-production-release` task 3.2 | AI + Jose review |
| Optional | P2 features #21–#26 (sale voiding, cash closing, tracking details, restock alerts, CSV export, distributor insights) | Their OpenSpec changes, all "Proposed" | Only if time is left |

## Why `openspec/specs/` looks almost empty
Built changes stay in `openspec/changes/` until they pass QA in production; only then are they archived into `openspec/specs/`. Today only the baseline `platform-foundation` is archived. So "built but not archived" is expected, and the only unticked task in each built change is its production QA task.

## Links
- Repo: https://github.com/JoseAlejandroMeloM/NO-ENTREGA-Proyecto-M3-DW
- Trello: https://trello.com/b/eW3qMZpU/conecta-negocio-dsaw-final-project
- Figma: https://www.figma.com/design/szQV2p4RZ3kvWKrq0siSz9
- Production URLs: pending (Nov 17)
