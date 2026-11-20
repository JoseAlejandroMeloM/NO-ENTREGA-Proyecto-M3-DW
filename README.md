# Conecta Negocio

A web platform that centralizes the day-to-day management of a small store: **payments** (card, Nequi, cash), **distribution** (distributors, orders, shipment tracking, comparison, chat) and **inventory** (stock, best sellers, restock predictions and alerts).

Final project for *Desarrollo de Aplicaciones Web* — Universidad de La Sabana, 2026-II.

**Team:** Alejandro Caycedo · Carlos Gabriel Rodríguez · Sebastián Franco Umbracia · Jose Alejandro Melo Murcia

> **Live:** https://conecta-negocio.vercel.app · API docs (Swagger): https://conecta-negocio.vercel.app/api/docs · Render mirror: https://conecta-negocio.onrender.com
>
> **Status (2026-11-19):** all features built (including the four P2 extras merged on Nov 19), redesigned and deployed on Vercel and Render; production QA complete (QA-01 to QA-25 pass on both URLs, evidence on the GitHub issues). Details in [docs/status.md](docs/status.md).
>
> **Figma:** https://www.figma.com/design/szQV2p4RZ3kvWKrq0siSz9 — wireframes (S01–S26), design system, final designs (S08 annotated).
>
> **New here (person or AI)?** Read [AGENTS.md](AGENTS.md) first, then [docs/status.md](docs/status.md).

## What it does
| Who | Can |
|---|---|
| Store owner | Everything in the store: team, sales and totals, products, insights, distributors and orders |
| Inventory clerk | Products and stock, restock suggestions, orders to distributors |
| Cashier | Register sales (cash, card, Nequi) and see their own sales |
| Distributor owner | Catalog, team, accept/reject orders, chat with stores |
| Distributor staff | Read the catalog, ship and deliver orders, chat |

Main flows: point-of-sale sale → stock goes down → low-stock alert → restock suggestion → compare distributors → purchase order → distributor accepts, ships, delivers → store receives (stock goes up) and rates. Full permission matrix: [docs/spec/01-scope-and-roles.md](docs/spec/01-scope-and-roles.md).

Every screen is available in **English and Spanish** and in **light and dark mode** (switches in the top bar, remembered per browser). Spanish texts live in [`client/src/i18n/es.ts`](client/src/i18n/es.ts); dark mode swaps the color tokens in [`client/src/index.css`](client/src/index.css).

## Run locally
Requirements: Node 20+ and a MongoDB Atlas connection string (any replica set works — sales use transactions; tests start their own in-memory replica set).

```bash
npm install
cp server/.env.example server/.env   # then fill MONGODB_URI and JWT_SECRET
npm run dev                          # API on :4000, React on :5173 (proxied /api)
```

| Command | What it does |
|---|---|
| `npm run dev` | API (tsx watch) + client (Vite) together |
| `npm run demo` | Same, with an in-memory database and seeded demo data (accounts below) |
| `npm run seed -- --confirm` | Loads the same demo data into the database in `server/.env` (e.g. Atlas). Safe to re-run: stops if the demo store exists. The connection string must name the database the deployments use (`...mongodb.net/conecta-negocio?...`); without a name Atlas uses `test` |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript checks for every package |
| `npm test` | All server tests: unit + API integration (Vitest + Supertest, in-memory MongoDB) |
| `npm run test:unit` | Unit tests only (no database, under a second) |
| `npm run test:e2e` | Browser E2E tests (Playwright + installed Google Chrome); starts `npm run demo` if it is not running |
| `npm run build` then `npm start` | Production build; the API also serves the React build (Render mode) |

### Testing (the test pyramid)
| Level | What | Where |
|---|---|---|
| Unit (many, fast) | Business rules and middleware in isolation, AAA pattern, mocks for `next()`, the database lookup and the clock | `server/test/unit/` |
| Integration | Every API route against an in-memory MongoDB: permissions, validation, transactions, rate limits | `server/test/*.test.ts` |
| E2E (few, critical flows) | Log in; register a sale and see stock drop; store sends an order and the distributor sees it | `e2e/` |
| Smoke (production) | `/api/health` and the production QA script on both URLs | `scripts/qa-production.mjs` |

CI runs lint, typecheck, unit + integration, E2E, spec validation, build and `npm audit` on every PR.

### Test report (last run 2026-11-17)
Every PR and every push to `main` runs these in CI ([latest run on main](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/actions/runs/44124053860): ✅).

| Suite | Command | Files | Tests | Result | Time (local) |
|---|---|---|---|---|---|
| Unit | `npm run test:unit` | 2 | 16 | ✅ 16 passed | 0.2 s |
| Unit + integration | `npm test` | 20 | 138 | ✅ 138 passed | 27 s |
| E2E (browser) | `npm run test:e2e` | 1 | 3 | ✅ 3 passed | 6 s (CI job 1 m 16 s) |
| Lint, typecheck, build, spec validation, `npm audit` | CI | — | — | ✅ | — |

<details><summary>Tests per file</summary>

- **Unit:** `unit/auth-middleware` 9 (authorize, orgFilter, authenticate with a mocked user lookup), `unit/business-rules` 7 (Bogota day with fake timers, restock edge cases).
- **Integration:** `app` 4, `auth` 13, `authorization` 5, `catalog` 8, `client-ip` 3, `csv` 3, `env` 2, `insights` 9, `messages` 4, `notifications` 8, `orders-receive` 3, `orders` 7, `products` 15, `rate-limit` 1, `sales-export` 3, `sales-void` 4, `sales` 15, `team` 15.
- **E2E:** log in; cashier registers a sale and stock drops by 1; store sends an order and the distributor sees it.
</details>

#### Production QA (manual + scripted, 2026-11-16)
Run against both deployments with `scripts/qa-production.mjs` and generated `qa-*` accounts; evidence (responses, screenshots) is a comment on each issue.

| Ticket | Story | Test | Expected | Vercel | Render |
|---|---|---|---|---|---|
| [QA-01](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/27) | US-01 | Register a new store | Logged in as store_owner; store created | ✅ | ✅ |
| [QA-02](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/28) | US-02 | Register a new distributor | Logged in as distributor_owner | ✅ | ✅ |
| [QA-03](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/29) | US-03 | Login OK / wrong password / 6 failed tries | Token / 401 / 429 | ✅ | ✅ |
| [QA-04](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/30) | US-04 | Owner creates cashier; cashier calls employee endpoint | Created / 403 | ✅ | ✅ |
| [QA-05](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/31) | US-10 | Create, edit, delete product as inventory; try as cashier | OK / 403 | ✅ | ✅ |
| [QA-06](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/32) | US-11 | Adjust stock -999 | 400, stock unchanged | ✅ | ✅ |
| [QA-07](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/33) | US-12 | Sell until stock ≤ min | Notification appears | ✅ | ✅ |
| [QA-08](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/34) | US-13 | Open insights for 30 days | Top 10 + chart with seed data | ✅ | ✅ |
| [QA-09](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/35) | US-14 | Open restock suggestions | Sorted by days left; quantities match formula | ✅ | ✅ |
| [QA-10](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/36) | US-20 | Sale paid in cash with change; sale exceeding stock | Saved, change shown / 409 | ✅ | ✅ |
| [QA-11](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/37) | US-21 | Filter by Nequi; cashier views history | Only Nequi / only own sales | ✅ | ✅ |
| [QA-12](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/38) | US-22 | Today's totals vs sum of sales | Equal | ✅ | ✅ |
| [QA-13](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/39) | US-30 | Distributor creates item; store user tries | OK / 403 | ✅ | ✅ |
| [QA-14](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/40) | US-31 | Compare "arroz" across distributors, sort by price | Correct order | ✅ | ✅ |
| [QA-15](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/41) | US-32 | Order below minimum; valid order | 400 / pending + notification | ✅ | ✅ |
| [QA-16](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/42) | US-33 | Accept → ship → deliver; deliver a pending order | Timeline updated / 409 | ✅ | ✅ |
| [QA-17](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/43) | US-34 | Store cancels pending order; cancels shipped order | OK / 409 | ✅ | ✅ |
| [QA-18](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/44) | US-35 | Receive delivered order twice | Stock +qty once / 409 second time | ✅ | ✅ |
| [QA-19](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/45) | US-36 | Rate delivered order twice | Rating saved / 409 | ✅ | ✅ |
| [QA-20](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/46) | US-40 | Message from store, read by distributor; third party reads | Visible ≤5 s / 403 | ✅ | ✅ |
| [QA-21](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/47) | US-41 | Mark all notifications read | Unread count 0 | ✅ | ✅ |
| [QA-22](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/48) | TS-01 | Open `/api/docs` in production | All endpoints listed | ✅ | ✅ |
| [QA-23](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/49) | TS-02 | Send `{"email":{"$gt":""}}` to login; `<script>` in product name; check headers | 400 / rendered as text / helmet headers present | ✅ | ✅ |
| [QA-24](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/50) | TS-03 | Open both production URLs, log in on each | Both work | ✅ | ✅ |
| [QA-25](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/51) | Smoke | `/api/health` on both platforms | `{status:"ok", db:"connected"}` | ✅ | ✅ |

Extra production checks: the four P2 features (2026-11-19) — cash register closing ([#22](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/22)), shipment tracking ([#23](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/23)), restock alerts ([#24](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/24)) and distributor insights ([#26](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/26)), 25 checks on both URLs ✅; sale voiding ([#21](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/21)) and CSV export ([#25](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/25)), 14 checks on both URLs ✅; login rate limit (6th failed try → 429, a spoofed `X-Forwarded-For` header does not bypass it) ✅; fresh clone of `main`: install, lint, typecheck, tests and build ✅.

API documentation (integration contract): `/api/docs` — source in [`docs/spec/openapi.yaml`](docs/spec/openapi.yaml).

## Demo accounts
Password for all: `demo12345` (demo data only; available after `npm run demo` locally, or in production: the seed ran on 2026-11-16, so they work on both URLs).

| Email | Role |
|---|---|
| `rosa@tienda.test` | Store owner (Tienda Doña Rosa) |
| `inventario@tienda.test` | Store inventory clerk |
| `caja@tienda.test` | Store cashier |
| `ventas@distrinorte.test` | Distributor owner (Distri Norte) |
| `bodega@distrinorte.test` | Distributor staff |
| `pedidos@sabana.test`, `campo@fresco.test` | Two more distributor owners (for comparing) |

## Deployment
| Platform | URL | How |
|---|---|---|
| **Vercel** (primary) | https://conecta-negocio.vercel.app | Static React build + serverless function `api/index.ts` for `/api/*` ([vercel.json](vercel.json), which also sets the security headers for the pages) |
| **Render** (mirror) | https://conecta-negocio.onrender.com (free plan: sleeps after 15 min idle, first visit takes ~50 s) | One web service running the same Express app and serving the React build ([render.yaml](render.yaml)) |
| **MongoDB Atlas** | M0 free cluster | Database for both |

Environment variables (set in each platform's settings, never committed):
- Vercel: `MONGODB_URI`, `JWT_SECRET`. Don't set `NODE_ENV` there: Vercel sets it at runtime, and setting it at build time skips the dev dependencies the build needs.
- Render: `render.yaml` defines everything; it only asks for `MONGODB_URI` and generates its own `JWT_SECRET`.
- `JWT_ISSUER` / `JWT_AUDIENCE` have safe defaults.

Security review with production evidence: [docs/security-audit.md](docs/security-audit.md).

## Documentation
- [Guide for AI agents and new teammates](AGENTS.md) and [project status](docs/status.md)
- [Project brief](docs/project-brief.md)
- [Design brief](docs/design-brief.md) (visual passes, demo accounts)
- [Team workflow (OpenSpec + BMAD) and change board](docs/workflow.md)
- [OpenSpec changes](openspec/changes/) and [current specs](openspec/specs/)
- [Specification](docs/spec/README.md) (scope, user stories, data model, API contract, architecture, screens)
- [Security audit](docs/security-audit.md)
- [Figma designs](https://www.figma.com/design/szQV2p4RZ3kvWKrq0siSz9): wireframes, design system and final designs ([import pack](docs/figma-import/README.md))
- [AI usage log](docs/ai-log.md)
- [Course requirements and resources](docs/GUIA-RECURSOS.md) (Spanish, course reference)

## Contributions

| Contributor | GitHub | Work |
|---|---|---|
| Jose Alejandro Melo Murcia | [JoseAlejandroMeloM](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/commits?author=JoseAlejandroMeloM) | Spec, OpenSpec changes and Trello/GitHub tickets; all P0/P1 features (identity, team, inventory, notifications, sales, insights, catalog, orders, messaging) and P2 sale voiding + CSV export; the six design passes; Vercel + Render deploys; security audit; production QA (QA-01 to QA-25); test pyramid; Figma; docs; reviews and merges |
| Catalina Vega | [CataVega201](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/commits?author=CataVega201) | Cash register closing ([#22](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/22), [PR #90](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/pull/90)) |
| Carlos Gabriel Rodríguez | [Gabo9702](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/commits?author=Gabo9702) | Shipment tracking details: ETA, tracking notes, delayed flag ([#23](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/23), [PR #87](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/pull/87)) |
| Alejandro Caycedo | [acaycedo24](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/commits?author=acaycedo24) | Restock prediction alerts ([#24](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/24), [PR #89](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/pull/89)) |
| Sebastián Franco Umbracia | [francoumb11-spec](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/commits?author=francoumb11-spec) | Distributor insights ([#26](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/issues/26), [PR #88](https://github.com/JoseAlejandroMeloM/Proyecto-M3-DW/pull/88)) |

AI-assisted with Claude Code (co-author on commits); every AI task is logged in [`docs/ai-log.md`](docs/ai-log.md).
