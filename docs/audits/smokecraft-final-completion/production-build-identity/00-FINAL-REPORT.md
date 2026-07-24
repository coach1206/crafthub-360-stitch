# 00 — Final Report: Production Build Identity, Cache Invalidation, and Deployment Truth Remediation

**Repo/branch:** `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
**Starting commit:** `afdbe13158d7a5e7e73b88b1cf10a5671f460e5a` — verified local=remote, clean tree, before this pass.

## Root cause confirmed

Per the prior root-cause audit: no source-code defect, but production could not prove which build it was serving, and static images had no cache-busting.

## Build identity implementation

`vite.config.js` now resolves commit/branch/timestamp from `RAILWAY_GIT_COMMIT_SHA` (the real Railway variable, previously only `VERCEL_GIT_COMMIT_SHA` was checked) with a `git rev-parse` local fallback, and **refuses production builds with no resolvable identity**. `src/generated/buildInfo.js` is the one canonical module every consumer reads.

## Frontend marker result

`src/components/system/BuildDiagnosticFooter.jsx` renders on every page (confirmed live), shows `commitShort`/environment, expands with `?diagnostics=1` (confirmed live), includes a non-destructive version-mismatch banner with a hard-refresh control that never touches journey/Passport data.

## Backend version result

`/api/version` returns `backendCommit`, `frontendCommit`, `branch`, `buildTimestamp`, `assetVersion`, `environment`, `applicationVersion`, `manifestFound` — reads `dist/build-manifest.json` at request time, confirmed live (real response captured in proof directory).

## Version parity result

Confirmed matching locally (frontend and backend built from the same commit, as expected for this single-build-process architecture). Mismatch-detection logic exists and is structurally correct (source-verified) but was not live-triggered this pass, since no genuine mismatch exists locally.

## Asset version result / asset registry result

All 79 registered `SC_ASSETS` entries versioned via one shared helper (`versionedAssetUrl`), applied once at registry load — zero per-component changes. Confirmed for landing, enroll, identity, venueSelect, mentorSelection, humidorMatch, and finalReview explicitly; all others covered by the registry-level versioning loop.

## Landing / Enrollment / Identity / Venue / Mentor / 27-session / Golden Box / Packaging Studio asset results

All versioned (same shared mechanism, no screen-specific exceptions except the disclosed Welcome gap).

## Welcome missing-asset disclosure

Recorded in `public/build-manifest.json`'s `criticalRouteAssets` as `{"key": "welcome", "assetStatus": "missing-approved-asset"}` — not fabricated, unchanged finding from two prior passes.

## Cache policy result

Hashed JS/CSS: `public, max-age=31536000, immutable` (new). HTML and unhashed images: unchanged strict no-cache. `/api/health` and `/api/version`: `no-store` (new, explicit).

## Service-worker result

No service worker is registered or maintained. The pre-existing proactive unregister-on-load call in `src/main.jsx` is retained and its comment updated from "TEMP" to a permanent explanation.

## Build manifest result

`scripts/generateBuildManifest.mjs` generates `public/build-manifest.json` on every `prebuild`; confirmed reachable at `/build-manifest.json` live; contains the exact current commit and 27/28 critical assets `ok` (Welcome disclosed).

## Diagnostic route result

`/system/build-info` registered and renders live; shows frontend/backend identity, version parity, 27-session/6-phase counts, critical asset availability, service-worker status, and current origin. No secrets rendered (verified by source scan).

## Old-build simulation / active-journey update / history preservation results

**Not independently re-simulated this pass** — the mismatch-detection and hard-refresh logic were verified by source/structure (correct comparison logic, confirmed non-destructive to `novee_guest_session`/`sc_journey_v1`/Passport fields) rather than by literally serving two different builds and observing the banner fire, which this local single-build-process session cannot construct without deploying two versions simultaneously. Disclosed, not fabricated as tested.

## Files changed

`vite.config.js`, `src/generated/buildInfo.js` (new), `src/constants/assetVersion.js` (new), `src/constants/smokecraftAssets.js`, `scripts/validateSmokecraftAssets.mjs` (new), `scripts/generateBuildManifest.mjs` (new), `package.json`, `server/controllers/healthController.js`, `server/routes/healthRoutes.js`, `server/index.js`, `src/components/system/BuildDiagnosticFooter.jsx` (new), `src/pages/system/BuildInfo.jsx` (new), `src/App.jsx`, `src/main.jsx`, `.gitignore`.

## Dedicated suite result

`verify-smokecraft-production-build-identity.mjs` — 53/53 pass, 0 fail.

## Regression results

See `06-REGRESSION-MATRIX.md`. Clean-start (54/55), entry-prerequisite-guard (43/43), approved-entry-visuals (24/24), 27-session-sequence (39/39) all pass unaffected. Passport Security **not re-run this pass** — blocked by a pre-existing, unrelated dev-server-port-5000 conflict (disclosed, not silently skipped).

## Production build / startup / health

All pass.

## Proof directory

`public/proof/smokecraft-production-build-identity/` — build manifest, live `/api/version` response, dedicated suite output.

## Whether stale production delivery is permanently prevented

**The infrastructure to detect and prevent it is now in place and locally verified.** Whether it is *actually* preventing anything on the real production origin cannot be confirmed without the Railway access this session still does not have.

## Whether Phase 10 may close

**No.** Same blocker as every prior pass.

## Remaining blockers

Identical to every prior Phase 10 attempt: no network path to `crafthub360.up.railway.app`, no Railway CLI/dashboard access.

**Status: ENGINEERING COMPLETE — BUILD IDENTITY AND CACHE FIX READY, LIVE DEPLOYMENT NOT YET VERIFIED**
