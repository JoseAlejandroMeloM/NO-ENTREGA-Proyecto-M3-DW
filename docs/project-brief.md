# Conecta Negocio — Project Brief

Final project for Desarrollo de Aplicaciones Web (DSAW), Universidad de La Sabana, 2026-II.
**Hard deadline: 2026-11-19, 23:59** (everything: code, deployment, docs, tickets, Figma, demo prep).

## Problem
Small store owners manage payments, distributor relationships and inventory with scattered tools (notebooks, WhatsApp, spreadsheets). Conecta Negocio centralizes the store's day-to-day management in one web platform.

## Modules
1. **Payments** — record every sale/payment and its method: card, Nequi, or cash. History, filters, daily totals.
2. **Distribution** — directory of distributors; contact them; place and **track shipments/orders**; **compare distributors** by what they offer (products, prices, delivery time, characteristics); **chat** between store and distributor.
3. **Inventory** — products and stock levels; **trends / best-selling products**; **restock predictions** and **low-stock notifications**.

## User roles (final version and permission matrix: `docs/spec/01-scope-and-roles.md`)
| Role | Side | Main permissions |
|---|---|---|
| Shop owner | Store | Everything in their store: users, payments, inventory, distributors, reports |
| Shop employee — Inventory | Store | Manage products and stock, see restock alerts, create orders to distributors |
| Shop employee — Cashier | Store | Register payments/sales; read-only product lookup |
| Distributor owner | Distributor | Manage distributor profile, catalog, employees; answer orders; chat |
| Distributor employee | Distributor | Update order/shipment status; chat |

Permissions must be enforced **on the backend** (M3 rubric).

## Team
Alejandro Caycedo · Carlos Gabriel Rodríguez · Sebastián Franco Umbracia · Jose Alejandro Melo Murcia.
In practice Jose leads and builds the project with Claude Code; previous M1/M2 work is discarded and the project is rebuilt from scratch.

## Course requirements for this delivery
From the syllabus (`docs/curso/proyecto.md`) and the professor's instructions in class:
- Real problem, specific users, justified as a web app; **≥2 roles**; **≥3 core features** demonstrable end to end; not a clone of a major app.
- Stack: React (+ React Router, custom hook, protected route) · Express · MongoDB Atlas + Mongoose · JWT + bcrypt · TypeScript (at least partially) · helmet.
- **Figma designs** for all screens (wireframes → final design, at least one annotated screen).
- **Integration contract documented in Swagger** (OpenAPI) for the full-stack review.
- Graded **as it runs in production**.
- **Tickets** (user stories with acceptance criteria / DoD, plus verification tickets) managed in a board app — **Trello** recommended.
- **Current, actively maintained security libraries** (e.g. helmet, bcrypt, jsonwebtoken, express-rate-limit, input validation/sanitization).
- **Deployment on more than one platform** (Vercel + one other).
- Working **demo** that shows how it works (Demo Day: 5 min demo, 5 min architecture, 2 min Q&A without notes).
- Final checklist: production URL(s), GitHub repo with real commit history, README (problem, solution, setup, API docs), Figma link, **AI usage log** (`docs/ai-log.md`).
- Security audit: no obvious XSS / NoSQL injection, helmet enabled.

## Working agreements
- Language: **English** for all project documentation, code, comments and commit messages. (Course reference notes in `docs/curso/` stay in Spanish, as in the original material.)
- Git: **trunk-based** — `main` always deployable; short-lived `feature/*`, `fix/*`, `docs/*` branches; every change through a PR.
- Claude builds most of the project; Jose reviews. Claude keeps `docs/ai-log.md` updated after each task.
