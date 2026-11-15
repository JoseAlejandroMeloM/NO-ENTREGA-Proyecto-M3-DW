# Proposal: Distributor insights

**Priority:** P2 (additional) · **Screens:** S19 Distributor dashboard (extended) · **Depends on:** `add-purchase-orders`

## Why
Stores get best sellers and trends, but distributors only see a list of orders. Knowing which items and which stores generate the most revenue, and how fast they deliver, helps distributors serve stores better and improve their rating.

## What Changes
- For a range of 7, 30 or 90 days: delivered revenue, number of orders by status, top 10 items by quantity, top 5 stores by revenue, average time from accepted to delivered, acceptance rate.
- Shown on the distributor dashboard for `distributor_owner`.

## Capabilities

### New Capabilities
- `distributor-insights`: sales and service metrics for distributors.

### Modified Capabilities
None.

## Impact
- API: new `GET /distributor-insights?range=` (add to `openapi.yaml`).
- Read-only aggregations over `purchaseorders`.
- Out of scope: per-staff performance, forecasting store demand.
