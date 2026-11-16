# Conecta Negocio — guide for AI agents and new teammates

Start here if you have zero context (any AI: Claude, Codex, Cursor, Gemini, Copilot; or a teammate). Read this file, then [`docs/status.md`](docs/status.md). That is enough to pick up work; open other docs only when the task needs them.

## What this is
A web app for small Colombian neighborhood stores (*tiendas*) and the distributors that supply them. Stores record sales (cash, card, Nequi), manage stock, see best sellers and restock suggestions, and order from distributors; distributors publish a catalog, handle orders and chat with stores. Final project for *Desarrollo de Aplicaciones Web* (Universidad de La Sabana, 2026-II). **Deadline: 2026-11-19 23:59.** It is graded as it runs in production.

## Stack and layout
npm-workspaces monorepo, TypeScript everywhere.
| Path | What |
|---|---|
| `server/` | Express 4 + Mongoose 8 + zod 4 API. `src/modules/<feature>/` = `router.ts` (paths, auth, roles) → `service.ts` (business rules) → `src/models/`. Tests in `server/test/` (Vitest + Supertest, in-memory MongoDB replica set). |
| `client/` | React 18 + Vite + Tailwind 4 + React Router 7. `src/pages/<feature>/`, shared UI in `src/components/`, hooks in `src/hooks/`, nav by role in `src/layouts/nav.ts`. |
| `api/index.ts` | Vercel serverless entry that wraps the same Express app. |
| `docs/spec/` | Product spec: scope + permission matrix, user stories + QA tickets, data model, **`openapi.yaml` (the API contract, served at `/api/docs`)**, architecture, screens. |
| `openspec/` | One folder per change in `changes/` (proposal, requirement deltas, `tasks.md` checklist); `specs/` = behavior already archived. |
| `docs/workflow.md` | Process, traceability rules and the **change board** (status of every feature). |
| `docs/design-brief.md` | Rules and plan for visual/design work. |
| `DESIGN.md` | The design system: tokens, type, components, do's and don'ts. Read before touching any screen. |
| `docs/ai-log.md` | Required log of every AI-assisted task. |
| `docs/curso/`, `docs/GUIA-RECURSOS.md` | Course material (Spanish). Only for course-requirement questions. Never read `docs/materiales/pdf/`. |

## Run it
```bash
npm install
npm run demo   # in-memory DB + API (:4000) + client (:5173) with seeded data; accounts in docs/design-brief.md
npm run lint && npm run typecheck && npm test && npm run build   # all must pass before a PR (CI runs them too)
```
Real database: copy `server/.env.example` to `server/.env`, fill `MONGODB_URI` and `JWT_SECRET`, then `npm run dev`.

## Rules (all contributors, human or AI)
1. **English everywhere**: code, comments, docs, commits. UI text English; sample data Spanish.
2. **Trunk-based Git**: never commit to `main`. Use the change's existing branch (`feature/<change>`, listed on the board), `git merge main` into it first; otherwise `fix/*`, `docs/*`, `chore/*`. Small commits, PR to `main`, CI green before merge. **Never delete branches.**
3. **Traceability**: PR body has `Closes #<issue>`; move the Trello card (To Do → In Progress → Code Review → Verification → Done). Details in `docs/workflow.md` → Traceability.
4. **Spec first**: behavior comes from the change's `openspec/changes/<change>/` folder and `docs/spec/`. If the code must change the API, update `docs/spec/openapi.yaml` in the same PR. Tick a `tasks.md` item only when its verification passed.
5. **Security**: role and organization checks on the backend for every route (never only hidden in the UI); zod validation; secrets only in env vars, never committed or pasted in chats. Mongoose `sanitizeFilter` is on, so server-built query operators must be wrapped in `mongoose.trusted()`.
6. **Errors** follow the contract shape `{ error: { code, message, details: [{ path, message }] } }`.
7. After each task, append a row to `docs/ai-log.md` (date, task, prompt summary, what the AI produced, what was reviewed/changed).
8. Jose must be able to explain all the code at Demo Day: prefer simple, readable solutions; no new dependencies without a reason in the PR.
9. Do not spend money: free tiers only.

## Gotchas
- `.gitignore` ignores every folder named `dist`; never name a source folder `dist`.
- Sales and order receiving use MongoDB transactions, which need a replica set (Atlas and the test/demo in-memory server are).
- Registration is rate-limited (20/hour per IP); tests keep each file under that limit.
- The server's CSP blocks external images and scripts (except cdnjs and Google Fonts); put assets in `client/public/`.
