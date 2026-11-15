# Proposal: Sales register and payment methods

**Priority:** P0 · **Stories:** US-20, US-21, US-22 · **QA:** QA-10, QA-11, QA-12 · **Screens:** S08 (POS, annotated), S09, totals on S05 · **Depends on:** `add-product-inventory`

## Why
Owners don't know their real daily income per payment method. Recording each sale with its items and method (card, Nequi, cash) gives a reliable history, decreases stock automatically and lets the owner close the day with correct totals.

## What Changes
- POS-style sale registration: items + quantities, server-computed total, payment method, cash received and change.
- Stock decreases for every item through the inventory stock service (low-stock rule applies).
- Sales history with filters by date range, payment method and cashier; cashiers see only their own sales.
- Daily totals per payment method for a given day.
- Client: S08 New sale, S09 Sales history with detail drawer, today's totals on the dashboard.

## Capabilities

### New Capabilities
- `sales`: sale registration, payment recording, sales history and daily totals.

### Modified Capabilities
None.

## Impact
- API: `/sales`, `/sales/{id}`, `/sales/summary/daily`.
- Data: `sales` collection with embedded item snapshots (name, unit price, quantity, subtotal).
- Out of scope: real payment processing, receipts/invoices, taxes, discounts, returns (voiding is the additional change `add-sale-voiding`).
