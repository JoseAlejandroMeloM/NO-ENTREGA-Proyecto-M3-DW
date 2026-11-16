# Conecta Negocio

A web platform that centralizes the day-to-day management of a small store: **payments** (card, Nequi, cash), **distribution** (distributors, orders, shipment tracking, comparison, chat) and **inventory** (stock, best sellers, restock predictions and alerts).

Final project for *Desarrollo de Aplicaciones Web* — Universidad de La Sabana, 2026-II.

**Team:** Alejandro Caycedo · Carlos Gabriel Rodríguez · Sebastián Franco Umbracia · Jose Alejandro Melo Murcia

> **Live:** https://conecta-negocio.vercel.app · API docs (Swagger): https://conecta-negocio.vercel.app/api/docs · Render mirror: https://conecta-negocio.onrender.com
>
> **Status (2026-11-16):** all features built, redesigned and deployed on Vercel; production QA in progress. Details in [docs/status.md](docs/status.md).
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
| `npm test` | API tests (Vitest + Supertest) |
| `npm run build` then `npm start` | Production build; the API also serves the React build (Render mode) |

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
- [Figma designs](https://www.figma.com/design/szQV2p4RZ3kvWKrq0siSz9)
- [AI usage log](docs/ai-log.md)
- [Course requirements and resources](docs/GUIA-RECURSOS.md) (Spanish, course reference)
