# Proposal: Cash register closing

**Priority:** P2 (additional) · **Screens:** new "Close day" panel on S05 + closings history · **Depends on:** `add-sales-register`

## Why
At the end of the day the owner counts the cash drawer and compares it with what the system says, but has nowhere to record the result. A daily closing captures expected vs counted cash and the difference, so shortages are visible over time.

## What Changes
- The owner closes a day: the system shows expected cash (opening float + the day's cash sales totals; change given is already netted out), card and Nequi totals; the owner enters the counted cash and an optional note.
- One closing per store per day; closings history with differences.

## Capabilities

### New Capabilities
- `cash-register-closing`: daily closing with expected vs counted cash.

### Modified Capabilities
None.

## Impact
- API: new `GET /closings`, `POST /closings` (add to `openapi.yaml`).
- Data: new `closings` collection (unique `{storeId, date}`).
- Reuses the daily summary aggregation from `sales`.
- Out of scope: multiple registers or shifts per day, reopening a closed day.
