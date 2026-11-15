# 02 · User Stories and Tickets

These are the Trello tickets. Each story has: **Summary**, **Acceptance Criteria (AC)** and the shared **Definition of Done (DoD)**. Every story has a matching **verification ticket** (QA-xx) that proves it works in production.

Priority: **P0** = core (must ship), **P1** = should ship, **P2** = stretch.

## Definition of Done (applies to every story)
1. Code merged to `main` through a reviewed PR; CI passes (lint + tests).
2. Backend endpoints match `docs/spec/openapi.yaml` and appear in Swagger UI.
3. Permissions enforced in the backend; unauthorized calls return 401/403.
4. Inputs validated (zod) and sanitized; errors return the documented shape.
5. Works in production (Vercel and Render) — not only locally.
6. Entry added to `docs/ai-log.md`.

## Initiative: one platform to run a small store
### Epic E0 — Accounts and access

**US-01 · Register a store (P0)** — *As a store owner, I want to register my store so that my team and I can use the platform.*
- AC1 Form asks for owner name, email, password (≥8 chars, letters + numbers), store name, address, phone.
- AC2 Creates the store and the owner user with role `store_owner`; returns a JWT and logs in.
- AC3 Duplicate email → 409 with message "Email already registered".
- AC4 Password is stored hashed with bcrypt (never plain text).

**US-02 · Register a distributor (P0)** — *As a distributor owner, I want to register my company so that stores can find and order from me.*
- AC1 Form asks for owner data plus company name, NIT, phone, coverage area, delivery time in days, minimum order (COP).
- AC2 Creates the distributor and user with role `distributor_owner`; logs in.

**US-03 · Log in and log out (P0)** — *As any user, I want to log in so that I see only what my role allows.*
- AC1 Valid credentials → JWT (15 min) + user profile with role and organization.
- AC2 Invalid credentials → 401 "Invalid credentials" (same message for unknown email and wrong password).
- AC3 After 5 failed attempts in 15 min from the same IP → 429.
- AC4 Logout clears the session in the client; protected pages redirect to `/login`.

**US-04 · Manage employees (P0)** — *As an owner, I want to create accounts for my employees with a specific role so that each one only does their job.*
- AC1 Store owner can create users with role `store_inventory` or `store_cashier`; distributor owner can create `distributor_staff`.
- AC2 Owner can list and deactivate employees; deactivated users cannot log in.
- AC3 An employee calling these endpoints → 403.

### Epic E1 — Inventory

**US-10 · Manage products (P0)** — *As an inventory clerk, I want to create, edit and delete products so that the inventory reflects what the store sells.*
- AC1 Fields: name, SKU (unique per store), category, unit, sale price, cost, stock, minimum stock.
- AC2 List with search by name/SKU, filter by category and "low stock only", pagination.
- AC3 Cashier can view and search but not modify (403 on write).

**US-11 · Adjust stock (P1)** — *As an inventory clerk, I want to adjust stock with a reason so that losses or counts are recorded.*
- AC1 Adjustment = +/- quantity and reason (count, damage, other); cannot leave stock negative.
- AC2 Each adjustment is stored with user and date.

**US-12 · Low-stock alerts (P0)** — *As a store owner, I want to be alerted when a product is running out so that I can reorder in time.*
- AC1 When `stock <= minStock` after a sale or adjustment, a notification is created for owner and inventory roles (once until restocked).
- AC2 Dashboard shows the count of low-stock products and links to the filtered list.

**US-13 · Best sellers and trends (P0)** — *As a store owner, I want to see my best-selling products so that I know what drives my sales.*
- AC1 Top 10 products by units and by revenue for a selectable range (7 / 30 / 90 days).
- AC2 Daily sales chart for the selected range.

**US-14 · Restock suggestions (P0)** — *As an inventory clerk, I want the system to suggest what and how much to buy so that I don't run out.*
- AC1 For each product: average daily sales (30 days), days of stock left, suggested quantity (formula BR4).
- AC2 List sorted by urgency (fewest days left first), with a "create order" shortcut to a distributor that carries the product.

### Epic E2 — Payments and sales

**US-20 · Register a sale (P0)** — *As a cashier, I want to register a sale and how it was paid so that every payment is recorded.*
- AC1 Add products by search, set quantities; total is computed by the server (client totals are never trusted).
- AC2 Payment method required: card, Nequi or cash; for cash, amount received ≥ total and change is shown.
- AC3 Quantity greater than stock → 409 and the sale is not saved.
- AC4 Stock decreases for every item; low-stock rule (US-12) is evaluated.

**US-21 · Sales history (P0)** — *As a store owner, I want to see all sales with filters so that I can review the business.*
- AC1 Filters: date range, payment method, cashier. Pagination.
- AC2 Sale detail shows items, total, method, cashier and time.
- AC3 Cashiers see only their own sales.

**US-22 · Daily totals by payment method (P0)** — *As a store owner, I want daily totals per payment method so that I can close the cash register.*
- AC1 For a given day: total and count for card, Nequi, cash, and grand total.
- AC2 Dashboard shows today's totals.

### Epic E3 — Distribution

**US-30 · Distributor catalog (P0)** — *As a distributor owner, I want to publish my product catalog so that stores can order from me.*
- AC1 Items: name, category, unit, price, available (yes/no).
- AC2 Only the distributor owner can create/edit/delete their items.

**US-31 · Browse and compare distributors (P0)** — *As a store owner, I want to compare distributors so that I choose the best option.*
- AC1 Directory with search by name and category.
- AC2 Comparison for a product name or category: one row per distributor with price, delivery days, minimum order, rating, coverage.
- AC3 Sort by price, delivery time or rating.

**US-32 · Create a purchase order (P0)** — *As an inventory clerk, I want to send a purchase order to a distributor so that the order is recorded.*
- AC1 Select distributor, add catalog items and quantities; total computed by the server.
- AC2 Order total below the distributor's minimum order → 400.
- AC3 Order is created with status `pending` and the distributor is notified.

**US-33 · Handle incoming orders (P0)** — *As a distributor, I want to accept or reject orders and update their shipment status so that the store knows where its order is.*
- AC1 Distributor owner accepts or rejects pending orders (reason required on reject).
- AC2 Owner or staff mark accepted orders as shipped, then delivered.
- AC3 Invalid transitions → 409. Each change saved in history and notified to the store.

**US-34 · Track orders (P0)** — *As a store owner, I want to see the status and history of my orders so that I can plan.*
- AC1 Order list with status filter; detail with a status timeline (who, when).
- AC2 Store can cancel while `pending`.

**US-35 · Receive an order into stock (P0)** — *As an inventory clerk, I want to receive a delivered order so that stock updates automatically.*
- AC1 Only for `delivered` orders, only once.
- AC2 Adds quantities to matching products or creates new products (cost = order price).

**US-36 · Rate a distributor (P1)** — *As a store owner, I want to rate a distributor after a delivery so that comparisons include service quality.*
- AC1 1–5 stars + optional comment, once per delivered order; updates the distributor's average.

### Epic E4 — Messaging and notifications

**US-40 · Order messages (P1)** — *As a store or distributor user, I want to send messages on an order so that we can coordinate without leaving the platform.*
- AC1 Messages belong to an order; only the two organizations involved can read/write.
- AC2 New messages appear within ~5 seconds (polling); message text max 1000 chars, sanitized.

**US-41 · Notification center (P0)** — *As any user, I want to see my notifications so that I don't miss alerts, order changes or messages.*
- AC1 Bell with unread count; list; mark one/all as read.

### Epic E5 — Platform quality (technical stories)

**TS-01 · Integration contract in Swagger (P0)** — OpenAPI 3 spec served at `/api/docs`; every endpoint documented with request/response schemas and errors.
**TS-02 · Security baseline (P0)** — helmet, CORS allow-list, rate limiting, zod validation, NoSQL-injection protection, JWT with fixed algorithm/issuer/audience, secrets in env vars.
**TS-03 · Deploy on two platforms (P0)** — full app on Vercel (frontend + API under the same domain) and a mirror on Render; both URLs in README.
**TS-04 · CI (P1)** — GitHub Actions: lint, type-check and tests on every PR.
**TS-05 · Seed data (P0)** — script that loads the demo store, employees, distributors, catalogs and 60 days of sales.
**TS-06 · README and API docs (P0)** — problem, solution, setup, env vars, URLs, test accounts, link to Swagger and Figma.
**TS-07 · Figma designs (P0)** — wireframes → final design for every screen in `06-screens.md`, one annotated screen.

## Verification tickets (QA)
Each QA ticket is executed **in production** and its result (✅ / ❌ + date + evidence screenshot) is recorded on the Trello card.

| Ticket | Verifies | Steps (summary) | Expected |
|---|---|---|---|
| QA-01 | US-01 | Register a new store | Logged in as store_owner; store created |
| QA-02 | US-02 | Register a new distributor | Logged in as distributor_owner |
| QA-03 | US-03 | Login OK / wrong password / 6 failed tries | Token / 401 / 429 |
| QA-04 | US-04 | Owner creates cashier; cashier calls employee endpoint | Created / 403 |
| QA-05 | US-10 | Create, edit, delete product as inventory; try as cashier | OK / 403 |
| QA-06 | US-11 | Adjust stock -999 | 400, stock unchanged |
| QA-07 | US-12 | Sell until stock ≤ min | Notification appears |
| QA-08 | US-13 | Open insights for 30 days | Top 10 + chart with seed data |
| QA-09 | US-14 | Open restock suggestions | Sorted by days left; quantities match formula |
| QA-10 | US-20 | Sale paid in cash with change; sale exceeding stock | Saved, change shown / 409 |
| QA-11 | US-21 | Filter by Nequi; cashier views history | Only Nequi / only own sales |
| QA-12 | US-22 | Today's totals vs sum of sales | Equal |
| QA-13 | US-30 | Distributor creates item; store user tries | OK / 403 |
| QA-14 | US-31 | Compare "arroz" across distributors, sort by price | Correct order |
| QA-15 | US-32 | Order below minimum; valid order | 400 / pending + notification |
| QA-16 | US-33 | Accept → ship → deliver; deliver a pending order | Timeline updated / 409 |
| QA-17 | US-34 | Store cancels pending order; cancels shipped order | OK / 409 |
| QA-18 | US-35 | Receive delivered order twice | Stock +qty once / 409 second time |
| QA-19 | US-36 | Rate delivered order twice | Rating saved / 409 |
| QA-20 | US-40 | Message from store, read by distributor; third party reads | Visible ≤5 s / 403 |
| QA-21 | US-41 | Mark all notifications read | Unread count 0 |
| QA-22 | TS-01 | Open `/api/docs` in production | All endpoints listed |
| QA-23 | TS-02 | Send `{"email":{"$gt":""}}` to login; `<script>` in product name; check headers | 400 / rendered as text / helmet headers present |
| QA-24 | TS-03 | Open both production URLs, log in on each | Both work |
| QA-25 | Smoke | `/api/health` on both platforms | `{status:"ok", db:"connected"}` |

## Trello board layout
Lists: **Backlog → To Do (sprint) → In Progress → Code Review → Verification (QA) → Done**.
Labels: `P0` `P1` `P2`, `frontend`, `backend`, `design`, `qa`, `docs`. Each card: summary, AC as checklist, DoD checklist, linked PR.
