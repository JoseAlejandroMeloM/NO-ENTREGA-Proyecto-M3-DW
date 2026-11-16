# Security audit (TS-02)

Audit of the production deployment on **2026-11-16**, against `https://conecta-negocio.vercel.app`. Every row has evidence: an HTTP result from production, an automated test in `server/test/`, or both. The Render mirror runs the same Express app, so the API results apply to it too; its own run is recorded with QA-24.

## Summary
| Area | Result |
|---|---|
| OWASP-style checks run in production | 14 / 14 passed |
| Dependencies shipped to production (`npm audit --omit=dev`) | **0 vulnerabilities** |
| Dev-only tooling (`npm audit`) | 7 moderate (`minimatch` inside ESLint's TypeScript parser) — not deployed; fix needs a breaking ESLint upgrade, accepted for this delivery |
| Secrets in the repo | none (`.env` ignored; only `server/.env.example` with empty values) |
| Fixed during this audit | Static pages on Vercel had no CSP / `nosniff` / frame headers (helmet only runs on `/api`); added in `vercel.json` with the same policy as helmet |

## Checklist with evidence

### Authentication and sessions
| Control | How | Evidence |
|---|---|---|
| Passwords hashed | bcrypt (`bcryptjs`), cost 12; `passwordHash` is `select: false`, so it is never loaded or returned unless asked for; a dummy hash is compared for unknown emails so response time doesn't reveal which emails exist | `auth.test.ts` |
| Same error for wrong email and wrong password | `401 Invalid credentials` in both cases (no user enumeration) | Production: wrong password → `401` |
| Brute-force protection | `express-rate-limit`: 5 failed logins / 15 min per IP (successful logins don't count); 20 registrations / hour | Production: 6 failed logins → `401,401,401,401,401,429` (QA-03) |
| JWT pinned to HS256 with issuer + audience, 15 min expiry | `utils/jwt.ts` `verifyAccessToken` | Test `rejects an unsigned token (alg none)`; production: malformed token → `401 UNAUTHORIZED`; an `alg:none` token is already blocked by Vercel's edge firewall (`403`) before reaching the app |
| No token → rejected | `authenticate` middleware on every private router | Production: `GET /api/products` without token → `401` |
| Deactivated users locked out immediately | user reloaded on each request, `active` checked | `team.test.ts` |
| Signing secret | 256-bit random value in platform env vars; app refuses to start in production without it (`config/env.ts`) | `JWT_SECRET` set on Vercel; Render generates its own |

### Authorization (enforced on the backend, never only hidden in the UI)
| Control | Evidence in production |
|---|---|
| Role checks (`authorize(...)`) | Cashier creating an employee → `403` (QA-04); cashier creating a product → `403` (QA-05); store user creating a catalog item → `403` (QA-13); cashier reading the daily summary → `403` |
| Organization isolation (`orgFilter` on every query) | Another store reading this store's product → `404` (not `403`, so ids don't leak); a third-party store reading an order's messages → `403` (QA-20) |
| Business rules can't be skipped | Order below the distributor minimum → `400` (QA-15); delivering a pending order → `409`; cancelling a shipped order → `409`; receiving twice → `409`; rating twice → `409` (QA-16–19) |
| Client can't set prices or totals | `POST /sales` with `"total": 1` → saved with the real total `4500` (server prices every line) |

### Input handling
| Control | How | Evidence |
|---|---|---|
| Validation | zod schema on every body, query and params (`validate` middleware); unknown keys stripped or rejected | `400 VALIDATION_ERROR` with field details in all tests |
| NoSQL injection | `express-mongo-sanitize` removes `$`/`.` keys; Mongoose `sanitizeFilter` + `strictQuery`; server-built operators wrapped in `mongoose.trusted()` | Production: `POST /api/auth/login` with `{"email":{"$gt":""},"password":{"$gt":""}}` → `400` (QA-23) |
| Body size | `express.json({ limit: '100kb' })` | `app.ts` |
| Regex search | user text escaped (`escapeRegex`) before building a regex | `escapeRegex` in `modules/catalog/service.ts`, used by products, catalog and compare |
| Stock can't go negative | adjustment of `-999` → `400`, stock unchanged (QA-06) | Production |

### Output and XSS
| Control | Evidence |
|---|---|
| User text rendered as text | React escapes all output; no `dangerouslySetInnerHTML` in `client/src`. A product named `<script>alert(1)</script>` and a chat message containing `<script>` are stored verbatim and shown as plain text |
| Content-Security-Policy | `script-src 'self' https://cdnjs.cloudflare.com; object-src 'none'; frame-ancestors 'self'` … on the API (helmet) and on every page (`vercel.json`) |
| Errors | One contract `{ error: { code, message, details } }`; stack traces hidden in production (`500` → `Something went wrong`) |

### Transport and headers (production)
| Header | API (`/api/*`, helmet) | Pages (Vercel) |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | ✅ | ✅ (added in this audit) |
| `X-Content-Type-Options: nosniff` | ✅ | ✅ (added) |
| `X-Frame-Options: SAMEORIGIN` | ✅ | ✅ (added) |
| `X-Powered-By` | removed | not sent |

### Infrastructure decisions
- **MongoDB Atlas network access is `0.0.0.0/0`.** Vercel functions and Render's free plan have no fixed outbound IPs, so an IP allow-list is not possible on free tiers. Mitigation: a dedicated database user with a long random password (only in platform env vars) and TLS-only connections (`mongodb+srv`). Recommended hardening: restrict that user's role to read/write on the `conecta-negocio` database only. Upgrade path: Atlas private endpoints or fixed egress IPs on paid plans.
- **Client address behind proxies (found 2026-11-16 on Render, fixed).** Rate limits key on `req.ip`. Vercel has one proxy in front of the app; Render has two (Cloudflare, then Render's proxy). With `trust proxy 1` everywhere, Render saw a shared Cloudflare edge address, so a few failed logins from one visitor could block valid logins for others (QA-03 on Render, #29). Now `trustProxyHops()` trusts 1 hop on Vercel and 2 on Render (`TRUST_PROXY_HOPS` in `render.yaml`, with Render's `RENDER` variable as fallback); a header faked by the visitor lands further left and is ignored (`trust-proxy.test.ts`).
- **Rate limiting uses in-memory stores.** On Vercel each serverless instance keeps its own counters, so the limit is per instance rather than global. It still stops simple brute force (verified above); a shared store (e.g. Redis) would make it exact — not needed for this delivery.
- **Token storage:** access token in memory + `sessionStorage` (documented trade-off in `docs/spec/05-architecture.md`): mitigated by React escaping, CSP and the 15-minute expiry.

## How to re-run
- API checks: the QA run recorded on each QA issue (#27–#51) lists the exact requests and status codes.
- Headers: `curl -sI https://conecta-negocio.vercel.app/ | grep -iE "content-security|nosniff|frame|strict"`
- Dependencies: `npm audit --omit=dev`
- Tests: `npm test` (109+ API tests, including auth, roles, org isolation and injection cases).
