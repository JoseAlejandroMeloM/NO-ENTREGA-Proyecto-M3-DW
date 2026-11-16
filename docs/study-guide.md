# Demo Day study guide

For the presenter. Demo Day format: **5 min demo · 5 min architecture · 2 min Q&A without notes**. Read this once a day until the presentation; the questions section is what the professor is most likely to ask.

## 1. The pitch (30 seconds)
Neighborhood stores (*tiendas de barrio*) run on a notebook, WhatsApp and memory: they don't know daily income per payment method, products run out without warning, and orders to distributors leave no record. **Conecta Negocio** puts the store's day in one web app: sell at the counter (cash, card, Nequi), stock updates itself, the app warns about low stock and suggests what to reorder, and the store orders from distributors, tracks the order and chats about it. Distributors get the other side: a catalog, incoming orders and the chat.

Why a web app and not a spreadsheet: several people with **different permissions** work on the same live data, two businesses (store and distributor) interact in one place, and it runs on any device without installing anything.

## 2. Five-minute demo script
Use https://conecta-negocio.vercel.app (open it a minute before so it is warm). Password `demo12345`.

| Min | Who | What to show | What to say |
|---|---|---|---|
| 0:00 | — | Landing page | The problem in one sentence; two kinds of users |
| 0:30 | `rosa@tienda.test` (owner) | Dashboard: today's sales by method, low-stock count, open orders | "Numbers first: what the owner checks every morning" |
| 1:00 | `caja@tienda.test` (cashier) | New sale: 2 gaseosas, pay cash with 20.000 → change shown | "Prices come from the server, stock goes down in a transaction" |
| 1:45 | owner | Insights: chart + best sellers; Restock list → **Order** button | "Restock is a transparent formula, not AI: average daily sales over 30 days" |
| 2:30 | owner | Compare "arroz" across distributors → New order below the minimum (error) → valid order | "Business rules are enforced by the backend, not just the screen" |
| 3:15 | `ventas@distrinorte.test` (distributor) | Dashboard → the order → Accept → Ship; send a chat message | "Every status change is stored with who and when, and notifies the other side" |
| 4:00 | owner | Order timeline updates; reply in chat; mark delivered order as received → stock goes up; rate 5★ | "Receiving can happen only once — transaction + guard" |
| 4:40 | cashier | Try to open Team or Insights → 403 page | "Roles are checked on the server; the UI only hides what you can't use" |

Backup plan if production is slow: `npm run demo` locally gives the same data.

## 3. Architecture (five-minute talk)
```
Browser (React SPA) ──HTTPS──> Vercel CDN (static build + security headers)
        │  /api/*                      │
        └────────────> Vercel serverless function  = the same Express app
                                       │ Mongoose
                                       ▼
                               MongoDB Atlas (M0, replica set)
Render: one web service running the same Express app and serving the same React build (mirror).
```
- **Monorepo** with npm workspaces: `client/` (React 18 + Vite + Tailwind + React Router), `server/` (Express + TypeScript + Mongoose + zod). TypeScript in both.
- **Backend layers:** `router` (path, `authenticate`, `authorize(roles)`, `validate(zod)`) → `service` (business rules, testable without HTTP) → `model` (Mongoose schema). One error format for everything: `{ error: { code, message, details } }`.
- **Middleware order:** helmet → JSON body limit 100 kb → mongo-sanitize → logging → routes (rate limit on auth) → authenticate → authorize → validate → handler → 404 → error handler.
- **Frontend:** `AuthContext` + `useAuth` hook hold the session; `ProtectedRoute` checks login and role; `useApi` is the custom data hook on top of the API client (`api/client.ts` adds the token, maps errors and logs out on `401` when the session expires); `usePolling` refreshes the chat every 5 s; `useForm` handles field errors from the API.
- **Contract first:** `docs/spec/openapi.yaml` is the integration contract, served as Swagger UI at `/api/docs`.
- **Two deployments:** Vercel wraps the Express app as one serverless function (`api/index.ts`); Render runs it as a normal Node server. Same code, same database.
- **Process:** spec → OpenSpec change (proposal, requirement scenarios, tasks) → branch `feature/<change>` → PR with CI (lint, typecheck, 109+ tests, spec validation, build, audit) → merge → QA ticket in production → archive. GitHub issue ↔ Trello card ↔ branch ↔ PR ↔ OpenSpec change.

## 4. Key decisions — the "why" behind them
| Decision | Why |
|---|---|
| **MongoDB transactions** for sales and order receiving | A sale changes several products' stock and creates the sale; if anything fails (e.g. one item out of stock) nothing is saved. Needs a replica set — Atlas is one, and tests use an in-memory replica set. |
| **Stock decrement with a guard** (`stock >= quantity` in the update filter) | Two cashiers selling the last unit at the same time: only one update matches, the other gets `409`. No overselling. |
| **Server prices every sale** | The client sends only product ids and quantities; the server reads prices from the database, so a modified request can't change totals. |
| **Order status machine as data** (`TRANSITIONS` table) | Who can move an order from which state to which is one table, easy to read and test; the update uses the current status as a filter so two clicks can't both succeed. |
| **Receive once** | Inside a transaction, the order is first marked received with a filter `receivedAt: null`; the second attempt matches nothing → `409`. Items that don't exist in the store are created as new products. |
| **Rating average updated atomically** | One update with an aggregation pipeline recomputes the distributor's average, so concurrent ratings don't overwrite each other. |
| **Chat with polling every 5 s** instead of WebSockets | Serverless functions (Vercel) can't keep sockets open; polling with `?after=<last message time>` only downloads new messages. Real-time is out of scope. |
| **Restock formula (BR4)** | `avgDaily = units sold in 30 days / 30`, `daysLeft = stock / avgDaily`, suggest when `daysLeft ≤ lead time + 3` or low stock, quantity `ceil(avgDaily × 14) + minStock − stock`. Explainable to a shop owner; no ML. |
| **JWT 15 min, stored in memory + sessionStorage** | Short-lived token limits damage if stolen; sessionStorage survives a page reload but not closing the tab. Risk of XSS mitigated by React escaping and CSP. |
| **Role checks on the backend** | Hiding a button is not security: every route has `authorize(...)`, and every query is filtered by the user's organization (`orgFilter`). |

## 5. Security in one breath
helmet (CSP, HSTS, nosniff, frame) on the API **and** on the pages · bcrypt cost 12 · JWT HS256 pinned with issuer + audience · rate limit 5 failed logins / 15 min and 20 registrations / hour · zod validation on every input · NoSQL injection blocked twice (mongo-sanitize + Mongoose `sanitizeFilter`) · org isolation on every query · secrets only in env vars · `npm audit` clean for production dependencies. Evidence: `docs/security-audit.md`.

## 6. Likely questions (short answers)
1. **What happens if two cashiers sell the last unit at once?** The stock update has `stock >= quantity` in its filter inside a transaction; only one succeeds, the other gets `409 Insufficient stock`.
2. **Why MongoDB and not SQL?** Course stack (MongoDB Atlas + Mongoose). Documents fit well: a sale stores a snapshot of its items, an order stores its items and status history. Where we need consistency across documents we use transactions.
3. **What is a transaction and where do you use it?** All-or-nothing group of writes. Sales (stock + sale) and receiving an order (stock + new products + order flag).
4. **How do you stop a cashier from seeing totals or managing employees?** `authorize('store_owner')` on those routes returns `403`; the UI also hides them, but the server is what enforces it.
5. **How does a store not see another store's data?** Every query adds the user's organization id (`orgFilter`); asking for another store's product returns `404`.
6. **How do you validate input?** zod schemas per route (body, query, params) in a `validate` middleware; errors come back as `400` with the field and message.
7. **What is NoSQL injection and how do you prevent it?** Sending `{"$gt": ""}` instead of a string to match any document. Blocked by `express-mongo-sanitize` and Mongoose `sanitizeFilter`; zod also requires strings.
8. **Where is the JWT stored and why?** In memory and sessionStorage, never in the URL; 15-minute expiry. Trade-off documented: XSS is the risk, mitigated by React escaping and CSP.
9. **What does helmet do?** Sets security headers: CSP (which scripts may run), HSTS (HTTPS only), nosniff, frame protection; removes `X-Powered-By`.
10. **Why two deployments?** Course requirement; Vercel is serverless (the Express app becomes one function), Render runs a normal Node server. Same code proves it is portable.
11. **Why is the Atlas network open to 0.0.0.0/0?** Vercel and Render free plans don't have fixed IPs; protection is the database user's password and TLS. Upgrade path: private endpoints.
12. **How is the restock suggestion calculated?** Average daily sales over 30 days → days of stock left → suggest when it runs out before the distributor can deliver (+3 days margin); quantity covers 14 days plus the minimum.
13. **What is your custom hook?** `useApi` (loads data with loading/error state through the API client, which adds the token and handles session expiry) — plus `useAuth`, `usePolling`, `useForm`.
14. **How does the protected route work?** `ProtectedRoute` reads the session from `AuthContext`; no session → redirect to `/login` (remembering where you were); wrong role → 403 page.
15. **How did you use AI?** Claude Code built most of the code from our spec; every task is logged in `docs/ai-log.md` with the prompt, the result and what was reviewed or changed. We reviewed every PR and the tests and CI had to pass.
16. **How do you know it works?** 109+ automated API tests (Vitest + Supertest on an in-memory replica set) run in CI on every PR, plus 25 QA tickets executed in production with evidence on Trello and GitHub.
17. **What would you do next?** Void a sale and cash closing, CSV export, WebSockets for chat, a shared rate-limit store, and tighter database permissions.
18. **What was the hardest part?** The order flow: keeping status changes, receiving and ratings correct when two people act at once (guarded updates + transactions).
19. **Why polling and not WebSockets?** Serverless functions can't hold open connections; 5 s is enough for order chat and is simple.
20. **How do errors look to the user?** The API always returns `{ error: { code, message, details } }`; the forms show `details` next to each field and the rest as a banner.

## 7. Words to use correctly
**Endpoint** (a URL + method of the API) · **middleware** (a function every request passes through) · **schema** (the shape of a document or of valid input) · **transaction** (all-or-nothing writes) · **JWT** (signed token that proves who you are) · **CSP** (header listing what the browser may load) · **serverless** (code that runs per request, no server to manage) · **replica set** (MongoDB with copies; needed for transactions) · **SPA** (single-page app: React handles the routes in the browser).
