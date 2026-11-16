# Design brief — visual polish passes

Read this file first in every design session. It replaces reading the codebase: everything a design pass needs is here.
All features work today; the screens are functional but plain. The job now is **how it looks and feels, not what it does.**

## Product in one paragraph
Conecta Negocio is a management app for small Colombian neighborhood stores (*tiendas*) and the distributors that supply them. A store sells at the counter (cash, card, Nequi), tracks stock, sees what sells and what to restock, and orders from distributors; distributors publish a catalog and handle incoming orders. Users are shop owners, clerks and cashiers on a laptop or phone, often in a hurry, often not technical. The tone is **warm, trustworthy, local and efficient** — a tool a tendero is proud to use, not a generic SaaS template. UI text is English (course rule); data is Spanish (product names, messages).

## Hard rules (a pass that breaks one is rejected)
1. **Presentation only.** Change markup structure, Tailwind classes, CSS and new presentational components. Do **not** change API calls, hooks (`useApi`, `usePolling`, `useForm`, `useAuth`), routes, role checks, state logic, form field `name`s, or request bodies.
2. **Keep accessibility**: labels, `aria-*`, `role`, focus states, keyboard use, color contrast AA. Every animation respects `prefers-reduced-motion`.
3. **No new runtime dependencies** unless the pass explains why in the PR (prefer CSS transitions / Tailwind). A small icon set is fine if it is tree-shaken (e.g. `lucide-react`).
4. **No external images or fonts at runtime except Google Fonts.** The server's Content-Security-Policy blocks other hosts: put images in `client/public/` (license noted) or use inline SVG.
5. **Same behavior on mobile**: no horizontal page scroll at 375 px; tables may scroll inside their card or turn into cards.
6. Before each PR: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass, and the pass checks its screens in the browser with `npm run demo`.
7. Git: branch `feature/ui-<pass>` from `main`, small commits, PR to `main`, add an entry to `docs/ai-log.md`. English everywhere.

## Run it with data
```bash
npm install
npm run demo        # in-memory database + API + client with seeded demo data → http://localhost:5173
```
Password for every demo account: `demo12345` (local only, nothing is saved).

| Account | Role | Good for |
|---|---|---|
| `rosa@tienda.test` | Store owner | Everything on the store side, today's totals |
| `inventario@tienda.test` | Inventory clerk | Products, orders (no sales totals) |
| `caja@tienda.test` | Cashier | POS and own sales only |
| `ventas@distrinorte.test` | Distributor owner | Dashboard, catalog, accept/reject orders |
| `bodega@distrinorte.test` | Distributor staff | Read-only catalog, ship/deliver |

The demo has 60 days of sales, low-stock products, three distributors with catalogs and orders in every status (pending with a message, accepted, shipped with a conversation, delivered and rated, rejected).

## Current design system
Set in pass 1. The full reference (tokens, type roles, component rules, do's and don'ts) is [`/DESIGN.md`](../DESIGN.md); read it before changing any screen.
- **Tokens** (`client/src/index.css`, `@theme`): `primary #0f766e` (teal), `primary-dark`, `primary-deep #0b3f3b` (sidebar, auth panel), `primary-soft #d5efe9`, `accent #f59e0b` (amber: alerts, ratings, unread), `canvas #faf8f5`. Neutrals are still written `slate-*` but carry a warm ramp. Shadows `shadow-card` / `shadow-raised` / `shadow-overlay`; one easing (`ease-out`) and 160 ms as the default for every `transition-*`. Fonts (Google Fonts in `client/index.html`): Inter for everything, Bricolage Grotesque for the wordmark, `h1` and the organization name.
- **Utilities**: `card` (surface for panels and table wrappers), `field` (input / select / textarea), `appear` (entrance for something new on the page) and `pop` (a counter that changed). Use them instead of repeating border, radius and background classes.
- **Status colors** (keep the meaning): pending gray · accepted blue · shipped amber · delivered green · rejected/cancelled red. Stock: OK green, low amber, out red. Payment method badges in `components/sales/MethodBadge.tsx`.
- **Primitives** (`client/src/components/`): `Button` (primary / secondary / danger / ghost; `size` sm / md / lg; `loading`), `ButtonLink` (same look on a router link), `Badge`, `TextField`, `SelectField`, `FormAlert`, `FieldList`, `Logo`.
- **Patterns** (`client/src/components/`): `PageHeader` (title + subtitle + actions), `FilterBar`, `Tabs`, `Pagination`, `EmptyState`, `StatCard`, `BackLink`, `Modal` (native `<dialog>`: bottom sheet on phones, centered from 640 px). Icons: `lucide-react`.
- **Feature components**: `notifications/NotificationBell`, `NotificationItem` · `products/StockBadge`, `ProductForm`, `AdjustmentPanel`, `MovementHistory` · `sales/SaleDrawer`, `MethodBadge` · `catalog/CatalogItemModal`, `Rating` · `orders/OrderStatusBadge`, `OrderTimeline`, `MessagesPanel`, `UnreadMessagesCard` · `team/TeamTable`, `EmployeeForm`.
- **Shell**: `layouts/AppLayout.tsx` (teal sidebar with icons and groups from `layouts/nav.ts` filtered by role; top bar with org name, user, bell, log out; bottom bar + "More" sheet below 768 px) and `layouts/AuthLayout.tsx` (brand panel + form).
- Figma (reference, not a constraint): https://www.figma.com/design/szQV2p4RZ3kvWKrq0siSz9 — page "2 · Design system" and "3 · Final design".

Left for later passes: `SaleDrawer` was restyled in pass 3 and keeps its own side-drawer markup; `CatalogItemModal` uses `Modal` since pass 4; "Loading…" texts are plain paragraphs (pass 6); a few small inputs inside tables and the POS keep their own classes.

## Screens (route → file), by priority
**Tier 1 — first impression and demo day**
| Screen | Route | File |
|---|---|---|
| S01 Landing | `/` | `pages/Landing.tsx` |
| S02–S04 Login / register store / register distributor | `/login`, `/register/*` | `pages/auth/*`, `layouts/AuthLayout.tsx` |
| S05 Store dashboard | `/app` | `pages/Home.tsx` |
| S08 New sale (POS) | `/app/sales/new` | `pages/sales/NewSalePage.tsx` |
| S10 Insights | `/app/insights` | `pages/insights/InsightsPage.tsx` (Recharts, lazy) |
| S17/S22 Order detail + messages | `/app/orders/:id`, `/dist/orders/:id` | `pages/orders/OrderDetailPage.tsx`, `components/orders/*` |
| S19 Distributor dashboard | `/dist` | `pages/dashboard/DistributorDashboard.tsx` |

**Tier 2 — daily work screens**
S06 Products `pages/products/ProductsPage.tsx` · S07 Product form `ProductFormPage.tsx` · S09 Sales history `pages/sales/SalesHistoryPage.tsx` · S11 Restock `pages/insights/RestockPage.tsx` · S12–S14 Distributors, profile, compare `pages/distributors/*` · S15 New order `pages/orders/NewOrderPage.tsx` · S16/S21 Orders lists `pages/orders/OrdersPage.tsx` · S20 Catalog `pages/catalog/CatalogPage.tsx`

**Tier 3 — the rest**
S18/S24 Team `pages/team/TeamPage.tsx` · S23 Profiles `pages/profile/OrgProfilePage.tsx` · S25 Notifications `pages/notifications/NotificationsPage.tsx` · S26 403/404 `pages/Forbidden.tsx`, `pages/NotFound.tsx`

## Passes (one Fable session per pass, in this order)
| # | Pass | Scope | Skills to use |
|---|---|---|---|
| 1 ✅ | **Design system & shell** (done, `feature/ui-design-system`) | Tokens (type scale, spacing, radii, shadows, motion durations/easings), primitives, the repeated patterns above as components, `AppLayout` (sidebar with icons, mobile bottom bar), `AuthLayout` | `impeccable` (write a `DESIGN.md`), `design-taste-frontend`, `emil-design-eng` |
| 2 ✅ | **First impression** (done, `feature/ui-first-impression`) | S01 Landing, S02–S04 auth | `design-taste-frontend`, `impeccable` |
| 3 ✅ | **Store core** (done, `feature/ui-store-core`) | S05 dashboard, S08 POS, S10 insights (chart styling), S09 | `impeccable`, `emil-design-eng` |
| 4 ✅ | **Orders & distributors** (done, `feature/ui-orders-distributors`) | S12–S17, S19–S22, messages panel | `impeccable`, `choreograph` (timeline, chat) |
| 5 ✅ | **Motion** (done, `feature/ui-motion`) | Page and list transitions, drawer/modal, toasts, bell badge, cart add/remove, chat bubbles | `find-animation-opportunities` → `animate` → `review-animations`, `animation-performance` |
| 6 | **Review & fix** | Tier 2–3 consistency, empty/loading/error states, mobile 375 px, contrast, worst-case data | `/impeccable critique`, `break-ui`, `remove-animations` where it is too much |

Each pass ends with: before/after screenshots of its screens in the PR, checks green, ai-log entry.

## Ideas worth exploring (not requirements)
- A recognizable identity: the teal + amber pair, a friendly wordmark, subtle local warmth (no clichés, no flags).
- POS optimized for speed: big tap targets, the cart always visible, payment method as large toggles, obvious change due.
- Numbers as heroes on dashboards (tabular figures, clear hierarchy), with small trend hints.
- Order timeline and chat that feel alive but calm.
- Empty states that tell the user what to do next.

## Starting a pass (prompt to paste in a new Fable session)
> Read `docs/design-brief.md` and follow it. Do pass **N — <name>** only. Load the skills listed for this pass first. Start `npm run demo`, screenshot the pass's screens as they are, then improve them within the hard rules. Finish with lint, typecheck, tests, build, before/after screenshots, an ai-log entry and a PR from `feature/ui-<pass>`.
