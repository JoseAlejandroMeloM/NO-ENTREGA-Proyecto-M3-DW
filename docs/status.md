# Project status

Last updated: **2026-11-16**. Update this file whenever a milestone below changes. Feature-level status lives in the change board (`docs/workflow.md`); this page is the one-screen summary.

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
- **Visual design passes 1–6** merged (PRs #64–#69, issue #70).
- **Production on Vercel**: https://conecta-negocio.vercel.app (MongoDB Atlas M0). Security audit with production evidence: `docs/security-audit.md`. Demo data seeded on 2026-11-16 (`npm run seed -- --confirm`).
- **Render mirror**: https://conecta-negocio.onrender.com, same app and database, deployed 2026-11-16 from `render.yaml`.
- **Design pass 1 — design system & shell**: tokens, primitives, shared page patterns, new app shell (sidebar, mobile bottom bar) and auth layout; reference in `DESIGN.md`.
- **Design pass 2 — first impression**: landing page that shows the product with small copies of its own screens, auth brand panel with facts, store / distributor switch and two-column register forms.
- **Design pass 3 — store core**: dashboard with today's sales as the hero and the split by payment method, POS with product tiles, quantity steppers, large payment toggles and a clear change panel, insights with a KPI row and a chart in the system colors, restyled sale drawer.
- **Design pass 4 — orders & distributors**: connected order timeline, chat panel with arriving bubbles, order banners with icons, star rating with real icons, distributor cards, shared back link, catalog item dialog on the shared `Modal`.
- **Design pass 5 — motion**: two utilities (`appear`, `pop`) on alerts, inline forms, cart lines, counters and the sale confirmation; rules for what never animates in `DESIGN.md`.
- **Design pass 6 — review & fix**: shared loading state, 403 / 404 page, readable tables on phones, contrast fixes, calmer hovers. **All six design passes are done.**

## Not done yet (in order)
| When | Work | Tracked in | Who |
|---|---|---|---|
| Nov 16 ✅ | **QA in production**: QA-01 to QA-25 pass on Vercel and Render (issues closed with evidence, cards in Done), including the QA-03 Render fix (#29), QA-08/09 screenshots in `docs/qa/`, and production checks of #21 (void) and #25 (CSV export) | Last task in every change's `tasks.md` | AI + Jose (screenshots) |
| Nov 16 ✅ | **Figma** done: 26 wireframes (page 1) and final screens S01–S04, S19–S26 (page 3) imported from `docs/figma-import/` (the Starter plan's MCP limit blocked direct edits); every screen has a wireframe and a final design, S08 annotated | `add-production-release` task 3.3 | AI files, Jose imported, AI checked the shared link |
| Nov 16 ✅ | **Archived** the 11 built changes in board order; their requirements are now in `openspec/specs/` (13 capabilities). The 4 P2 backlog changes that were never built stay in `openspec/changes/` | `docs/workflow.md` → step 6 | AI |
| Nov 19 | Final README, Swagger and ai-log review; study the Demo Day guide (`docs/study-guide.md`) | `add-production-release` task 3.2 | AI + Jose review |
| Optional | P2 features: **#21 sale voiding and #25 CSV export built** (QA in production pending); #22 cash closing, #23 tracking details, #24 restock alerts, #26 distributor insights still "Proposed" | Their OpenSpec changes | Only if time is left |

## Team assignments (pending work)
| Teammate | QA in production (both URLs) | Reviews | P2 changes (optional) |
|---|---|---|---|
| **Alejandro Caycedo** | Store side: QA-01–QA-12 (#27–#38) | Design passes 1–2 PRs | `add-sale-voiding` #21, `add-cash-register-closing` #22 |
| **Carlos Gabriel Rodríguez** | Distribution side: QA-13–QA-21 (#39–#47) | Design passes 3–4 PRs | `add-shipment-tracking-details` #23, `add-restock-alerts` #24 |
| **Sebastián Franco Umbracia** | Platform and security: QA-22–QA-25 (#48–#51) | Design passes 5–6 PRs; Figma screens vs. app | `add-sales-export` #25, `add-distributor-insights` #26 |
| **Jose Alejandro Melo Murcia** | Final QA sign-off | Every PR | `add-production-release` #20, design passes, Demo Day |

How to start: read `AGENTS.md`, then follow `docs/workflow.md` (branch already exists for every change; QA evidence goes as a comment on the GitHub issue and on the Trello card).

## Why `openspec/specs/` looks almost empty
Built changes stayed in `openspec/changes/` until they passed QA in production; on 2026-11-16 all 11 were archived into `openspec/specs/` (history in `openspec/changes/archive/`). `add-production-release` was archived last, after a fresh clone passed install, lint, typecheck, 122 tests and build. The four P2 changes still in `openspec/changes/` (`add-cash-register-closing`, `add-shipment-tracking-details`, `add-restock-alerts`, `add-distributor-insights`) are proposals that were never built.

## Links
- Repo: https://github.com/JoseAlejandroMeloM/NO-ENTREGA-Proyecto-M3-DW
- Trello: https://trello.com/b/eW3qMZpU/conecta-negocio-dsaw-final-project
- Figma: https://www.figma.com/design/szQV2p4RZ3kvWKrq0siSz9
- Production: https://conecta-negocio.vercel.app · Render mirror: https://conecta-negocio.onrender.com
