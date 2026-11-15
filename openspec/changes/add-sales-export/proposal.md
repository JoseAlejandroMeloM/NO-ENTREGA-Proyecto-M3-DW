# Proposal: Export sales to CSV

**Priority:** P2 (additional) · **Screens:** "Export CSV" button on S09 · **Depends on:** `add-sales-register`

## Why
Owners share their sales with an accountant or analyze them in a spreadsheet. Copying rows by hand is error-prone; an export of the filtered history solves it.

## What Changes
- `store_owner` downloads the sales matching the current history filters as CSV (one row per sale item).
- Cells starting with `=`, `+`, `-` or `@` are escaped to prevent spreadsheet formula injection.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sales`: adds CSV export of the sales history.

## Impact
- API: new `GET /sales/export` (`text/csv`, same filters as `GET /sales`, max 92 days), added to `openapi.yaml`.
- Out of scope: Excel/PDF formats, scheduled emails.
