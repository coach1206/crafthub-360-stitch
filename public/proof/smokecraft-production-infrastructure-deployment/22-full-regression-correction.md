# 22 — Full Regression Correction: Setup and Method

## Why this pass exists

Production Package 4 (Infrastructure and Deployment, commit `9edbc6c7`) honestly
disclosed that it had only run route-smoke-level checks against the new
infrastructure (Dockerfile, CI/CD, env contract, startup validation, health
endpoints, Sharp image-resize pipeline, R2/S3 storage adapter code,
background jobs, production-asset build exclusion, security/config
hardening) — it did **not** re-run the full core gameplay/business
regression suites (fresh-player closure, final gameplay acceptance, Venue
Humidor, payment, media, Golden Box, etc.) against those changes. This pass
closes that gap: every required suite below was actually executed, for
real, against a real local server and real Postgres — not asserted, not
mocked, not skipped.

## Baseline

- `git status` — clean at start.
- `git rev-parse HEAD` — `9edbc6c783f5f980dfacb78c774e5dcdc33084c4`
- `git rev-parse origin/recovery/smokecraft-codex-final` — same.
- Confirmed identical before any work began.

## Environment setup (real, local, no cloud credentials)

1. **Postgres**: `service postgresql start` (PostgreSQL 16, already
   installed in this sandbox). Verified with `pg_isready`. Database
   `crafthub_smokecraft_final` already existed from prior packages;
   `npm run db:migrate` confirmed all 114 migrations already applied
   (`Applied: 0, Skipped: 114`), i.e. the exact schema Package 4 committed.
2. **`.env`**: populated from `.env.example` with local dev secrets
   (`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crafthub_smokecraft_final`,
   `JWT_SECRET`, `FOUNDER_CHALLENGE_SECRET`, `SESSION_SECRET` — all
   locally-generated 64-hex-char dev values, never committed, never real
   secrets). `.env` is gitignored and is not part of this pass's commit.
3. **Build**: `npm run build` — real `vite build` + real
   `scripts/stripProductionExcludedAssets.mjs` (Package 4's build-exclusion
   step). Completed in 3m10s, exit code 0, `dist/proof` correctly stripped.
4. **Servers actually run for this pass**:
   - Dev-mode backend on port 3001 (`NODE_ENV=development`, real Postgres)
     — used for fresh-player closure, final gameplay acceptance API setup,
     Venue Humidor, payment, media, inventory, passport, pairing, Golden
     Box authority validators.
   - `vite preview` on port 5050 and `vite dev` on port 5000 — used by the
     browser-driven suites that need a real rendered frontend
     (final-gameplay-acceptance's Playwright walk, checkout/media/payment
     browser suites).
   - A separate **production-mode** backend on port 3000
     (`NODE_ENV=production`, `AUTH_COOKIE_SECURE=true`, real Postgres,
     `STORAGE_PROVIDER=r2` with locally-generated placeholder
     credentials, `APP_PUBLIC_URL=https://...`) — used only for the
     deployment smoke test and health-endpoint/startup-validation
     re-verification, matching exactly the topology Package 4's own proof
     used.
5. **Test data**: every suite creates its own fresh guest/admin/judge
   identities through the real API, exactly as documented in each script
   and in the prior packages' own proof — no manual DB seeding of
   player-progression tables anywhere in this pass.

## One real environment-only issue hit and resolved

`server/routes/managementSyncRoutes.js`'s `guestSessionLimiter`
(`rateLimit({ windowMs: 15*60*1000, max: 20 })`) has no
`skip: () => !IS_PROD` guard (unlike the sibling limiters in
`server/index.js` and `smokecraftAccountRoutes.js`). Running many
guest-session-heavy suites back-to-back against the same long-lived dev
server exhausted this limiter mid-run, producing a transient 429 and a
downstream `TypeError` in one script. This is **not** a Package 4
regression — confirmed by `git diff 20d2a165 9edbc6c7 --stat`, which shows
Package 4's entire diff touches only Dockerfile/deploy scripts, env
validator, health routes/controller, `server/index.js` (health-route
mounting + graceful shutdown), image-resize pipeline, and the storage
adapter — nothing in `managementSyncRoutes.js`, which was last touched at
`eec6606b`, long before Package 4. Resolved for this pass by restarting the
backend process between suite batches (the limiter's store is in-memory
and resets on process restart) rather than modifying any application code.
This is a known, pre-existing, low-severity limitation, documented in
`25-business-system-regressions.md` and NOT reclassified as an
infrastructure regression.

## Suites executed

See `23-fresh-player-results.md`, `24-final-gameplay-acceptance-results.md`,
and `25-business-system-regressions.md` for full itemized results. Every
suite was run to completion with real pass/fail counts captured verbatim
below and in this session's transcript.
