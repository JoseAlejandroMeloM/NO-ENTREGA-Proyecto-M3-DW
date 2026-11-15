# Design

## Context
All data comes from `sales` (embedded items) and `products`. Seed data provides 60 days of history so the demo shows meaningful results.

## Goals / Non-Goals
**Goals:** explainable numbers the team can defend at Demo Day; responses under 1 s for the seed volume.
**Non-Goals:** caching layer, background jobs.

## Decisions
- **Aggregations in MongoDB** (`$unwind` items → `$group` by product) rather than in JavaScript, so only results travel over the network.
- **Daily series filled server-side** with zero days, grouped with `$dateToString` in `America/Bogota`.
- **BR4 formula, unchanged from `01-scope-and-roles.md`:** `avgDaily = units sold in last 30 days / 30`; `daysLeft = stock / avgDaily` (null when avgDaily is 0); suggest when `daysLeft <= leadTimeDays + 3` or low stock; `suggestedQty = max(0, ceil(avgDaily * 14) + minStock - stock)`.
- **Lead time and best distributor:** among available catalog items matching the product's category and name (case-insensitive contains), pick the lowest price; `leadTimeDays` = that distributor's delivery days; default 3 when none matches.
- **Urgency sort:** `daysLeft` ascending, nulls (no sales) last.

## Risks / Trade-offs
- [Name matching between store products and catalog items is fuzzy] → match on category + name contains; the user can still choose another distributor on S15.
- [A 30-day average hides trends] → accepted and stated in the UI ("based on last 30 days").
