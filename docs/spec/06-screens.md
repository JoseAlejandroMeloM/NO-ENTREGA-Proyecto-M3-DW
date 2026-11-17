# 06 · Screens (Figma + React routes)

**Figma file:** https://www.figma.com/design/szQV2p4RZ3kvWKrq0siSz9 — pages: *1 · Wireframes*, *2 · Design system* (tokens, text styles, Button / Badge / Input / NavItem / StatCard components), *3 · Final design*.
Status (2026-11-16): design system done; final designs S05–S18 done (S08 annotated). Wireframes S01–S26 (page 1) and final designs S01–S04, S19–S26 (page 3) imported on 2026-11-16 from `docs/figma-import/`; every screen now has both.

Every screen below needs a wireframe and a final design in Figma (rubric: all screens, consistent style, ≥1 annotated). The route column is the React Router path; 🔒 = protected route, roles listed.

## Visual direction
- Clean admin dashboard: left sidebar (items depend on role), top bar with organization name, notification bell and user menu.
- Palette: deep teal primary `#0F766E`, amber accent `#F59E0B` for alerts, neutral grays; status colors: pending gray, accepted blue, shipped amber, delivered green, rejected/cancelled red.
- Typography: Inter. Mobile: sidebar collapses to a bottom bar; tables become cards.

## Public
| # | Screen | Route | Content |
|---|---|---|---|
| S01 | Landing | `/` | Value proposition, 3 modules, "I'm a store" / "I'm a distributor" CTAs |
| S02 | Login | `/login` | Email, password, error message, links to register |
| S03 | Register store | `/register/store` | Owner + store fields (US-01) |
| S04 | Register distributor | `/register/distributor` | Owner + company fields (US-02) |

## Store side
| # | Screen | Route | Roles | Content |
|---|---|---|---|---|
| S05 | Store dashboard | `/app` 🔒 | all store | Today's totals by method (owner), low-stock count, pending orders, unread messages, quick actions |
| S06 | Products list | `/app/products` 🔒 | owner, inventory, cashier (read) | Search, category filter, low-stock toggle, table with stock badge |
| S07 | Product form | `/app/products/new`, `/app/products/:id` 🔒 | owner, inventory | Create/edit + stock adjustment panel with movement history |
| S08 | New sale (POS) | `/app/sales/new` 🔒 | owner, cashier | Product search, cart, payment method selector (card / Nequi / cash), amount received + change |
| S09 | Sales history | `/app/sales` 🔒 | owner, inventory, cashier (own) | Filters (date, method, cashier), table, sale detail drawer |
| S10 | Insights | `/app/insights` 🔒 | owner, inventory | Range selector, daily sales chart, top 10 by units / revenue |
| S11 | Restock suggestions | `/app/restock` 🔒 | owner, inventory | Urgency-sorted table: stock, avg/day, days left, suggested qty, best distributor, "Order" button |
| S12 | Distributors directory | `/app/distributors` 🔒 | owner, inventory | Cards with rating, delivery days, minimum order, categories |
| S13 | Distributor profile + catalog | `/app/distributors/:id` 🔒 | owner, inventory | Profile, catalog table, "add to order" |
| S14 | Compare distributors | `/app/compare` 🔒 | owner, inventory | Search product/category, comparison table, sort by price / delivery / rating |
| S15 | New purchase order | `/app/orders/new` 🔒 | owner, inventory | Selected distributor, items + quantities, total vs minimum order |
| S16 | Orders list (store) | `/app/orders` 🔒 | owner, inventory | Status tabs, table |
| S17 | Order detail (store) | `/app/orders/:id` 🔒 | owner, inventory | Status timeline, items, cancel / receive / rate buttons, **messages panel** |
| S18 | Team | `/app/team` 🔒 | store owner | Employees list, create employee modal, activate/deactivate |

## Distributor side
| # | Screen | Route | Roles | Content |
|---|---|---|---|---|
| S19 | Distributor dashboard | `/dist` 🔒 | distributor | New orders, in-transit orders, rating, unread messages |
| S20 | Catalog management | `/dist/catalog` 🔒 | distributor_owner | Table + create/edit modal, availability toggle |
| S21 | Incoming orders | `/dist/orders` 🔒 | distributor | Status tabs, table |
| S22 | Order detail (distributor) | `/dist/orders/:id` 🔒 | distributor | Timeline, accept / reject (owner), mark shipped / delivered, **messages panel** |
| S23 | Company profile | `/dist/profile` 🔒 | distributor_owner | Edit delivery days, minimum order, coverage |
| S24 | Team | `/dist/team` 🔒 | distributor_owner | Staff list and creation |

## Shared
| # | Screen | Route | Content |
|---|---|---|---|
| S25 | Notifications | `/notifications` 🔒 | List, mark all read (bell dropdown shows latest 5) |
| S26 | 403 / 404 | `*` | Friendly error pages; protected routes redirect to `/login` when logged out |

**Dynamic routes with `useParams`:** `/app/products/:id`, `/app/distributors/:id`, `/app/orders/:id`, `/dist/orders/:id`.
**Annotated screen (rubric):** S08 New sale — annotate the payment flow, validation states and stock error.
