# Specification (Spec-Driven Development)

Read in this order. Code must follow these documents; when the code needs to change the contract, update the spec first in the same PR.

| File | Contents |
|---|---|
| [01-scope-and-roles.md](01-scope-and-roles.md) | Problem statement, core features, out of scope, roles, permission matrix, business rules BR1–BR8 |
| [02-user-stories.md](02-user-stories.md) | Epics, user stories with acceptance criteria, Definition of Done, QA verification tickets, Trello layout |
| [03-data-model.md](03-data-model.md) | MongoDB collections, fields, validation, indexes, aggregations |
| [openapi.yaml](openapi.yaml) | Integration contract (OpenAPI 3 / Swagger) — served at `/api/docs` |
| [05-architecture.md](05-architecture.md) | Stack, deployment (Vercel + Render), folders, middleware, security checklist, env vars, delivery plan |
| [06-screens.md](06-screens.md) | All screens and routes for Figma and React Router |
