# 01 · Scope and Roles

Spec-Driven Development: this document defines **what** the system does before any code. Status: v1.0 (2026-11-14).

## 1. Problem statement
Neighborhood stores and small shops in Colombia ("tiendas de barrio", minimarkets) run their business across a paper notebook, WhatsApp chats with distributors, and memory. As a result:
- Owners don't know their real daily income by payment method (card, Nequi, cash).
- Products run out because nobody notices low stock until a customer asks for them.
- Ordering from distributors is done by phone/WhatsApp, with no record of what was ordered, its status, or which distributor offers the best price or delivery time.

**Target users:** owners and employees of small stores, and the distributors who supply them.

**Why a web app (not a spreadsheet or existing tool):**
- Several people with **different permissions** (owner, cashier, inventory clerk, distributor staff) work on the same live data at the same time — spreadsheets have no roles or concurrency control.
- Two sides of the market (stores and distributors) interact in one place: orders, status updates and messages — no existing single tool links a store's POS-style sales record with its supplier orders.
- Works from any device with a browser (store counter PC, owner's phone, distributor's laptop) without installing anything; a mobile-only app would exclude the counter PC.
- Inventory alerts and restock suggestions are computed from the store's own sales history — something a notebook or WhatsApp cannot do.

## 2. Core features (must work end to end in the demo)
| # | Feature | Summary |
|---|---|---|
| F1 | **Payments / Sales** | Cashier registers a sale (products + quantities) and its payment method: card, Nequi or cash. Stock decreases automatically. History with filters and daily totals per method. |
| F2 | **Inventory** | Products with stock and minimum stock; low-stock alerts; best sellers; restock suggestion (days of stock left + suggested quantity) based on average daily sales. |
| F3 | **Distribution** | Distributor directory with catalogs; comparison of distributors by price, delivery time, minimum order and rating; purchase orders from store to distributor with status tracking (pending → accepted → shipped → delivered); receiving an order adds stock. |
| F4 | **Messaging** | Store ↔ distributor conversation attached to each order (simple polling, not real-time sockets). |

F1–F3 are the 3 mandatory core features. F4 is included at a simple level because it is part of the product vision; real-time chat is out of scope.

## 3. Out of scope (for the Nov 19 delivery)
Real payment processing (we only **record** payments), real GPS shipment tracking, real-time websockets, email/SMS/push notifications (alerts are in-app only), machine-learning forecasting (we use a transparent moving-average formula), multiple stores per owner, invoices/taxes.

## 4. Roles
Every user belongs to exactly one **organization**: either a **store** or a **distributor**.

| Role key | Organization | Who | Created by |
|---|---|---|---|
| `store_owner` | Store | Owns the store | Self-registration (creates the store) |
| `store_inventory` | Store | Inventory clerk | Store owner |
| `store_cashier` | Store | Cashier | Store owner |
| `distributor_owner` | Distributor | Owns the distribution company | Self-registration (creates the distributor) |
| `distributor_staff` | Distributor | Distributor employee (dispatcher/driver) | Distributor owner |

## 5. Permission matrix
✅ allowed · 👁 read only · — not allowed. All checks are enforced in the **backend** (middleware `authorize(...)` + ownership checks on the organization id). The frontend only hides what the user cannot do.

| Resource / action | store_owner | store_inventory | store_cashier | distributor_owner | distributor_staff |
|---|---|---|---|---|---|
| Manage own org's employees | ✅ | — | — | ✅ | — |
| Edit own org profile | ✅ | — | — | ✅ | — |
| Products (store inventory): create/edit/delete | ✅ | ✅ | — | — | — |
| Products: view / search | ✅ | ✅ | 👁 | — | — |
| Adjust stock manually | ✅ | ✅ | — | — | — |
| Register a sale + payment | ✅ | — | ✅ | — | — |
| Sales history and daily totals | ✅ | 👁 (no totals) | 👁 own sales | — | — |
| Insights: best sellers, restock suggestions | ✅ | ✅ | — | — | — |
| Browse distributors and catalogs, compare | ✅ | ✅ | — | 👁 | 👁 |
| Create purchase order to a distributor | ✅ | ✅ | — | — | — |
| Cancel order (while pending) | ✅ | ✅ | — | — | — |
| Receive delivered order into stock | ✅ | ✅ | — | — | — |
| Rate distributor after delivery | ✅ | — | — | — | — |
| Distributor catalog: create/edit/delete items | — | — | — | ✅ | — |
| See incoming orders | — | — | — | ✅ | ✅ |
| Accept / reject order | — | — | — | ✅ | — |
| Update shipment status (shipped / delivered) | — | — | — | ✅ | ✅ |
| Messages on an order | ✅ | ✅ | — | ✅ | ✅ |
| Notifications (own) | ✅ | ✅ | ✅ | ✅ | ✅ |

Ownership rule: a user can only read or change data of **their own organization**; a distributor sees only orders addressed to it; a store sees only its own orders.

## 6. Key business rules
- **BR1** A sale cannot be registered if any item quantity exceeds current stock (HTTP 409).
- **BR2** Registering a sale decreases stock atomically; deleting/voiding a sale is not allowed (only the owner can void, which restores stock — stretch).
- **BR3** Low stock = `stock <= minStock`. Creating the condition generates an in-app notification for store_owner and store_inventory (once per product until restocked).
- **BR4** Restock suggestion: `avgDaily = units sold in last 30 days / 30`; `daysLeft = stock / avgDaily`; suggest restock when `daysLeft <= leadTimeDays + 3` or low stock; `suggestedQty = ceil(avgDaily * 14) + minStock - stock` (min 0). `leadTimeDays` = best delivery time among distributors that carry a matching product, default 3.
- **BR5** Order status flow: `pending → accepted → shipped → delivered`; `pending → rejected` (distributor); `pending → cancelled` (store). Each change is stored in the order's status history with user and timestamp, and notifies the other side.
- **BR6** Receiving a delivered order adds quantities to the store's products (matched by product; a new product is created if it does not exist) — once per order.
- **BR7** A store can rate a distributor 1–5 once per delivered order; the distributor rating is the average.
- **BR8** Payment methods: `card`, `nequi`, `cash`. For `cash`, the cashier may enter the amount received and the system computes change.

## 7. Assumptions (confirm or correct)
- One store per store owner; one distributor company per distributor owner.
- Currency: Colombian pesos (COP), integers.
- Seed/demo data: 1 store with 3 employees, 3 distributors with catalogs, ~40 products, 60 days of sales history so insights have data.
