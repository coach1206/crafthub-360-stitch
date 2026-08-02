# 25 — Business System Regressions Against Infrastructure Baseline

All suites run for real against the running local server(s) described in
`22-full-regression-correction.md`, commit `9edbc6c7`.

## Venue Humidor authority validators (8/8 PASS)

Static/source-authority validators (`node scripts/<name>.mjs`), each
`RESULT: PASS (0 checks failed)`:

| Validator | Result |
|---|---|
| validateSmokecraftVenueHumidorAuthority | PASS |
| validateSmokecraftVenueHumidorAdminAuthority | PASS |
| validateSmokecraftVenueHumidorCheckoutAuthority | PASS |
| validateSmokecraftVenueHumidorCustomerAuthority | PASS |
| validateSmokecraftVenueHumidorFulfillmentAuthority | PASS |
| validateSmokecraftVenueHumidorPickupAuthority | PASS |
| validateSmokecraftVenueHumidorPostPurchaseAuthority | PASS |
| validateSmokecraftVenueHumidorRecommendationAuthority | PASS |

## Venue Humidor checkout-authority live tests

- `verify-smokecraft-venue-humidor-1b2a-api.mjs`: **30/30 passed**
  (real order creation, quoting, hold conversion, cross-device
  consistency, canonical event emission).
- `verify-smokecraft-venue-humidor-1b2a-browser.mjs`: **16/16 passed**
  (real Playwright browser walk: age verification, real order creation,
  honest pending status, cancellation, reload persistence, no console
  errors).

## Payment gateway integration (Package 2's Stripe suite)

- `verify-smokecraft-real-payment-gateway-api.mjs`: **40/40 passed**
  (idempotency, holds, partial/duplicate refunds, cancel-before-payment,
  reconciliation repair, dispute recording, receipts, audit events — real
  business logic, Stripe network call substituted via the one documented
  test seam `createStripeAdapter({ stripeClient: fakeClient })`, exactly
  as Package 2 disclosed and as this pass re-confirms unchanged).
- `verify-smokecraft-real-payment-gateway-browser.mjs`: **19/19 passed**
  (real browser: honest "unavailable" payment-panel state with no live
  Stripe keys, no fabricated success, idempotent cancel, keyboard
  navigation, honest session-expired handling, admin-payments access
  control).

Matches Package 2's own final report (40 API / 19 browser) exactly — no
regression.

## Media management (Package 1's suite)

- `verify-smokecraft-venue-humidor-media-1-api.mjs`: **30/30 passed**.
- `verify-smokecraft-venue-humidor-media-1-browser.mjs`: **15/15 passed**.

Matches Package 1's own final report (30 API / 15 browser) exactly — no
regression, including after Package 4 added the Sharp image-resize
pipeline and storage-adapter code (media serving/fallback/placeholder
behavior unaffected).

## Golden Box authority validators (4/4 PASS)

| Validator | Result |
|---|---|
| validateSmokecraftGoldenBoxAuthority | PASS |
| validateSmokecraftGoldenBoxAwardsAuthority | PASS |
| validateSmokecraftGoldenBoxJudgingAuthority | PASS |
| validateSmokecraftGoldenBoxResultsAuthority | PASS |

Golden Box's full player-facing lifecycle (build/submit/judge/finalize/
award) is additionally covered end-to-end, real API calls, inside both
the fresh-player closure (62/62) and final gameplay acceptance (82/82)
runs above.

## Inventory authority

`node server/scripts/verifyInventoryAvailabilityEngine.js`: **78/78
checks passed.**

## Passport

- `verify-passport-360-connection.mjs`: **54/54 passed.**
- `verify-passport-security-unified-identity.mjs`: **52/59 passed, 7
  failed** (real, reproducible on a clean run — not a rate-limit
  artifact; retried twice with consistent results). Failures cluster
  around one flow: `POST /api/smokecraft/passport-stamp/claim` called
  directly with a client-submitted `completedSteps` array (this script's
  own technique, authored for the standalone
  `passport-360-security-unified-identity` package, predating both
  Package 4 and the Required-Interaction Closure packages) no longer
  results in `claimed: true`, because the stamp-claim endpoint now
  correctly computes eligibility from the guest's real server-side
  session-completion ledger rather than trusting client-submitted step
  names — the exact "server-computed eligibility from real completed
  sessions" behavior the fresh-player closure suite explicitly re-proved
  as PASS in this same pass (`23-fresh-player-results.md`, section 3).
  The downstream identity-merge assertions in this script
  (`Identity merge preserves stamps`, etc.) cascade-fail because they
  depend on that first claim having succeeded.
  **Root-cause check**: `git diff 20d2a165 9edbc6c7 --stat` (Package 4's
  entire diff) touches only Dockerfile/CI/deploy scripts, env validator,
  health routes/controller, `server/index.js` health-route mounting +
  graceful shutdown, image-resize pipeline, and the storage adapter —
  nothing in the passport-stamp claim path, the Passport-360 sync
  service, or `managementSyncRoutes.js`. This is **pre-existing** test/
  product-behavior drift between this specific legacy verification
  script and the (correct, currently-enforced) server-side evidence-gate
  behavior, not a regression introduced by Package 4's infrastructure
  work. Documented honestly per the mandate's fix policy rather than
  reclassified or hidden. Not one of the pass's explicit STOP
  conditions (Passport is not a listed blocking suite), so it does not
  block closure — carried forward as a known limitation.

## Pairing

`verify-smokecraft-hf5b1-pairing-engine.mjs`: **36/36 passed** (saved
pairing cross-device consistency, rank-all personalized recommendations,
fresh-identity route smoke).

## React Router migration validator (Package 3)

`node scripts/validateSmokecraftReactRouterMigration.mjs`: **PASS (0
checks failed)** — no data-router APIs introduced, no deprecated v6-only
APIs remain, canonical route registry intact (>=250 routes), wildcard
route correctly last, legacy redirects intact, `SmokeCraftSessionGuard`
still wraps session routes.

## POS360 / E.A.T. route smoke

Both covered, as individually-named checks, inside the deployment smoke
test (`scripts/verify-smokecraft-production-deployment.mjs`, run against
the real production-mode server on port 3000):
`POS360 route smoke` — PASS (`/api/pos360/production-readiness` responds,
status < 500); `E.A.T. 360 route smoke` — PASS
(`/api/eat/smokecraft/status` responds, status < 500). Full 14/14 result
in `26-package-4-closure.md`.

## Build

`npm run build` — real `vite build` (3m10s) + real
`scripts/stripProductionExcludedAssets.mjs` (`dist/proof` correctly
removed, 1/1 excluded path). Exit code 0. Also re-verified via
`npm run prebuild` (the full 18-script asset/manifest/authority-validator
chain) — every validator in the chain reported `PASS (0 checks failed)`,
exit code 0.

## Summary

Every explicit STOP-condition suite (fresh-player closure, final gameplay
acceptance, Venue Humidor, payment, inventory, media, Golden Box, React
Router, build) passed at its expected baseline count with **zero**
regressions traceable to Production Package 4's infrastructure changes.
The one real defect found (passport-security-unified-identity's 7
failures) is pre-existing, outside Package 4's diff, and not a listed
STOP condition — documented honestly above, not fixed in this pass (fixing
it would mean rewriting or retiring a standalone legacy verification
script from an earlier, unrelated package, which is out of this pass's
scope: this pass corrects Package 4's regression-testing debt, it does not
open new product work).
