# Conecta Negocio — DSAW final project (Unisabana 2026-II)

Store-management platform: payments, distribution (distributors, orders, shipment tracking, comparison, chat) and inventory (stock, trends, restock predictions/alerts).
**Deadline: 2026-11-19 23:59.** Full brief: `docs/project-brief.md`.

## How to load context (save tokens)
1. Read `docs/project-brief.md`. For feature work, read only the relevant part of `docs/spec/` (index in `docs/spec/README.md`; `openapi.yaml` is the contract). Then `docs/GUIA-RECURSOS.md` (course material index) only if the task involves course requirements.
2. Open a detail file only when needed (`docs/curso/*.md`). Never read PDFs in `docs/materiales/pdf/`; grep `docs/materiales/texto/` for the part you need.
3. Before big changes, write a short inventory (what exists / what's missing / how) instead of reading the whole codebase.

## Conventions
- English everywhere in the project: docs, code, comments, commit messages.
- Trunk-based Git: never commit to `main` directly; branch `feature/*`, `fix/*`, `docs/*`, `chore/*`; open a PR; small commits.
- Role permissions are enforced on the backend, never only hidden in the UI.
- Use current, maintained security libraries; secrets only in environment variables, never committed.

## Course rules that always apply
- Everything delivered must be deployed (graded in production).
- After each task, append an entry to `docs/ai-log.md`: date, task, prompt summary, what Claude produced, what was changed/reviewed and why.
- Jose must be able to explain all the code at the Demo Day Q&A.
