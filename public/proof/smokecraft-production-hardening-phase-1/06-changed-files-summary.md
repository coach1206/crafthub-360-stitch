# Changed-File Summary

## New files

- `server/config/securityHeaders.js` — canonical security-headers
  configuration (CSP, Permissions-Policy, Cache-Control for `/api`).
- `verify-smokecraft-production-hardening-phase1-security.mjs` —
  29-check security test suite.
- `public/proof/smokecraft-production-hardening-phase-1/` — this
  proof directory.

## Modified files

- `server/index.js` — wired `buildSecurityHeaders()`,
  `permissionsPolicyHeader`, and `noStoreForApi` into the middleware
  chain, before CORS/body-parsing/routes. No route, business-logic, or
  RBAC code touched.
- `server/config/envValidator.js` — strengthened: added unsafe-
  known-default-value detection, minimum secret length (32 chars),
  malformed-CORS-origin detection, and coverage for `SESSION_SECRET`/
  `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` when set. Existing
  required-in-production checks (`DATABASE_URL`, `JWT_SECRET`,
  `FOUNDER_CHALLENGE_SECRET`, `CORS_ORIGIN`) preserved and extended,
  never weakened.
- `package.json` — added `helmet@^8.3.0` dependency; added an
  `"overrides"` entry forcing `body-parser@^1.20.6` (patches the known
  advisory without an Express major-version migration).
- `package-lock.json` — regenerated honestly via `npm install`
  (reflects the `helmet` addition and the `body-parser` override).
- `node_modules/body-parser/*` — the actual patched dependency files
  (this repository tracks `node_modules` from an earlier commit
  predating its current `.gitignore` entry; the diff here is the real,
  honest result of the version bump, not manually edited).
- `.env.example` — added the Production Hardening Phase 1 explanation
  banner and a production startup checklist at the end. No real values
  added or changed.
- `docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json` — metadata-field
  refresh only (commit hash), from the routine route-inventory
  regeneration step; route count unchanged at 130.

## NOT changed

No Venue Humidor, Golden Box, mentor, pairing, rewards/Passport, or
curriculum business-logic file was modified. No route was added,
removed, or renamed. No RBAC, venue-isolation, or customer-isolation
logic was touched.
