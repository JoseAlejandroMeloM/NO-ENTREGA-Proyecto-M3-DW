# Proposal: Distributor catalogs, directory and comparison

**Priority:** P0 · **Stories:** US-30, US-31 · **QA:** QA-13, QA-14 · **Screens:** S20 (catalog management), S12 (directory), S13 (profile + catalog), S14 (compare) · **Depends on:** `add-team-management` (distributor profile)

## Why
Stores order from distributors by phone with no way to know who offers the best price or delivery time. Distributors need a place to publish what they sell, and stores need to compare them side by side.

## What Changes
- Distributor owners manage their catalog items: name, category, unit, price, available.
- Store users browse a distributor directory (search by name and category) and open a profile with its catalog.
- Comparison for a product name or category: one row per distributor with price, delivery days, minimum order, rating and coverage; sortable by price, delivery time or rating.

## Capabilities

### New Capabilities
- `distributor-catalog`: catalog items owned by each distributor.
- `distributor-comparison`: directory, distributor profile and side-by-side comparison.

### Modified Capabilities
None.

## Impact
- API: `/catalog`, `/catalog/{id}`, `/distributors`, `/distributors/{id}`, `/distributors/{id}/catalog`, `/distributors/compare`.
- Data: `catalogitems` (index `{distributorId, category, name}`); rating fields on `distributors` are filled by `add-purchase-orders`.
- Out of scope: price history, bulk CSV catalog import, volume discounts.
