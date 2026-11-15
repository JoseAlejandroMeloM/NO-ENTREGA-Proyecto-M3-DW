# Conecta Negocio — DSAW final project (Unisabana 2026-II)

Project rules, layout and gotchas for every AI agent are in `AGENTS.md` (imported below); current progress is in `docs/status.md`. This file only adds Claude Code specifics.

@AGENTS.md

## How to load context (save tokens)
1. Read `docs/status.md`, then only the part of `docs/spec/` the task needs (index in `docs/spec/README.md`; `openapi.yaml` is the contract) and the change's `openspec/changes/<change>/` folder.
2. Course requirements: `docs/project-brief.md`, then `docs/GUIA-RECURSOS.md`, then a single `docs/curso/*.md` if needed. Never read PDFs in `docs/materiales/pdf/`; grep `docs/materiales/texto/` for the part you need.
3. Visual/design work: read `docs/design-brief.md` first (rules, screens, passes, `npm run demo`).
4. Before big changes, write a short inventory (what exists / what's missing / how) instead of reading the whole codebase.

## Claude Code tools
- OpenSpec skills: `/openspec-propose`, `/openspec-explore`, `/openspec-apply-change`, `/openspec-archive-change`. Implement only merged changes.
- BMAD skills (`.claude/skills/bmad-*`) are for building and reviewing (`bmad-build`, `bmad-code-review`, `bmad-walkthrough`); do not create BMAD PRDs/epics — `docs/spec/` and OpenSpec are the single source of truth.
- Design skills (impeccable, design-taste-frontend, Emil Kowalski animation skills) are user-level; which one to use per pass is in `docs/design-brief.md`.
- Trello and Figma are reachable through connectors when the session has them.
