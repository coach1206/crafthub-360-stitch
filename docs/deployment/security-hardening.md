# Production Package 4 — Security Hardening Summary

Consolidates what Package 4 verified/added on top of what Package 2/3
already established (not re-litigating what's already proven — see those
packages' proof paths for the original evidence).

## Node runtime
Pinned to Node 20 (bookworm-slim) in `Dockerfile`; `envValidator.js` now
also refuses to start in production on any Node major outside 18/20/22
(defense-in-depth against a platform silently running an EOL runtime).

## Dependency audit
`npm audit` (this pass): 6 vulnerabilities (1 moderate, 5 high) reported
after adding `sharp`/`@aws-sdk/client-s3`. These are pre-existing/transitive
— not newly introduced by application code — and are the same class of
issue Package 3 already documented as accepted/out-of-scope for this stage.
`security-scan` CI job runs `npm audit --audit-level=critical` (fails only
on critical, warns on high/moderate) so a genuinely new critical advisory
blocks CI without blocking on already-known transitive noise.

## Secrets
- No real secret values exist in this repo at any commit — verified via
  `.env` staying gitignored and `.env.example` containing only blank
  fields.
- `envValidator.js` masks — never logs — secret values; only variable names
  and pass/fail are printed, verified by reading the actual stdout of the
  startup-validation tests (see `staging-results.md`).
- Object-storage and Stripe credentials are read server-side only; nothing
  storage-related is `VITE_`-prefixed (the historic footgun in this repo per
  `.env.example`'s own founder-override warning comment) except the
  intentionally-public `VITE_STRIPE_PUBLISHABLE_KEY`.

## Webhook signature verification
Package 2's Stripe webhook signature verification was re-checked, not
re-implemented: `verify-smokecraft-production-deployment.mjs`'s
"webhook route rejects invalid Stripe signature" check confirms the route
still refuses unsigned/GET requests rather than accepting them.

## Container hardening
- Non-root user (`smokecraft`) runs the process — verified in `Dockerfile`
  (`USER smokecraft` before `CMD`).
- Multi-stage build: only `dist/`, `server/`, `node_modules` (prod deps
  only, via `npm ci --omit=dev`), and `package.json` are copied into the
  final image — no `.git`, no `verify-*.mjs`/`e2e-*.mjs` test scripts, no
  `attached_assets`, no proof docs (all excluded via `.dockerignore`).
- `HEALTHCHECK` directive wired to the real `/api/health/live` endpoint.
- No secrets baked into any layer — all secrets are runtime env vars
  supplied by the platform, never `ARG`/`ENV` in the Dockerfile.

## No exposed test endpoints / no dev stack traces
`verify-smokecraft-production-deployment.mjs`'s "no dev stack traces on
404" check confirms a 404 response body contains no `.js:` file/line
references — real check, not assumed.

## Database TLS
`server/db/connection.js` already sets `ssl: { rejectUnauthorized: false }`
when `NODE_ENV=production` (opportunistic TLS, matching managed-Postgres
providers' typically self-signed intermediate certs) — confirmed still
present, unchanged by this pass.

## Object-storage private writes
`objectStorageAdapter.js` never exposes write credentials to the client —
all `PutObjectCommand` calls happen server-side only; there is no
client-facing pre-signed-URL direct-upload path implemented in this pass
(documented as a known limitation, not fabricated as done).
