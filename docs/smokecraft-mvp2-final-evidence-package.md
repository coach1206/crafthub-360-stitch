# SmokeCraft MVP2 — Final Evidence Package

Version: 1.0.0 | Build: investor-readiness | Date: 2026-07-12

This document is the single consolidated evidence record for SmokeCraft 360
MVP2 investor readiness. It references all test runs, audit outputs, and
system verifications.

---

## Summary Verdict

**SmokeCraft 360 is investor-ready as a prototype.**

All 24 journey steps are built, wired, and verified. The guest experience
is navigable end-to-end. All approved assets load. All interactive controls
meet accessibility touch targets. No visible hotspot pills exist in the
guest flow. No fake data is presented as live data.

The backend (Postgres persistence, payment capture, POS sync) is
deliberately in preview/memory mode, documented honestly in-product.

---

## E2E Test Results

### Total System Verification
- File: `e2e-smokecraft-total-system.mjs`
- Result: **137/137 PASS**
- Commit: `f31e93ca`
- Covers: route load, nav guards, overlap detection, touch targets, console errors

### Investor Readiness Suite
- File: `e2e-smokecraft-investor-readiness.mjs`
- Result: **300/300 PASS**
- Commit: `452397ed`
- Covers:
  - 24 routes × route-to-image mapping
  - 19-step journey sequence
  - 9 viewports (1920×1080 → 375×667)
  - Screen-specific functionality per route
  - Image-hidden test (no broken image fallback visible)
  - State persistence across navigation
  - API truthfulness (no fake score/XP values)
  - Investor demo mode (sessionStorage pre-seed bypasses session guards)
  - Accessibility (touch targets, aria-labels)
  - Console error audit (no unexpected errors)
  - Build + deployment verification (`npm run build` exit 0)

---

## Requirement Classification Summary

| # | Requirement | Status |
|---|---|---|
|1|Single source of truth registry|COMPLETE — `smokecraftMvp2MasterRegistry.js`|
|2|Entry checklist template|COMPLETE — `smokecraft-mvp2-entry-checklist.md`|
|3|Step gates|COMPLETE — `SmokeCraftSessionGuard` S1–S24|
|4|Definition of Done|COMPLETE — `smokecraft-mvp2-entry-checklist.md` §DoD|
|5|Demo/test/prod separation|COMPLETE — `DemoModeContext.jsx` + `SmokeCraftDemoReset.jsx`|
|6|Change-control lock|COMPLETE — `smokecraft-mvp2-change-control-lock.md`|
|7|Asset naming/versioning|PARTIAL — `mvp2-visual-image-registry.md` documents approved assets; secondary dir naming inconsistent|
|8|Asset folder separation|COMPLETE — `approved/` dir established, registry documents status per asset|
|9|Data contracts|COMPLETE — 30 contract files in `src/modules/smokecraft/data/`|
|10|Role/permission matrix|COMPLETE — `src/config/roleMap.js` + `server/middleware/roleMiddleware.js`|
|11|Security|PARTIAL — Auth Phase 10, security events dual-mode, rate limiting documented as open risk (no Express rate-limit middleware)|
|12|Failure-state design|COMPLETE — `ErrorBoundary.jsx` (React) + `SmokeBackendReadinessPanel.jsx` (backend status)|
|13|Offline/recovery|PARTIAL — memory fallback operational; formal offline recovery plan not documented|
|14|Performance limits|COMPLETE — `smokecraft-mvp2-performance-budget.md`|
|15|Browser/device matrix|COMPLETE — 9 viewports verified in e2e suite|
|16|Visual regression|PARTIAL — baseline screenshots exist in `docs/visual-proof/`; no automated diff tool integrated|
|17|DB migration/rollback|PARTIAL — 71 up-migrations present; no rollback scripts (no migration runner deployed)|
|18|Feature flags runtime UI|PARTIAL — 12 flags defined in contract; no admin toggle UI|
|19|Frontend error logging|PARTIAL — `ErrorBoundary` logs to console; no external error capture service|
|20|Investor demo reset|COMPLETE — `/smokecraft/demo-reset` route + `SmokeCraftDemoReset.jsx`|
|21|Documentation package|PARTIAL — 20+ technical docs; no guest-facing user manual|
|22|Final evidence package|COMPLETE — this document|
|23|No silent substitutions|COMPLETE — feature flag contract + backend readiness panel enforce honesty|
|24|Conflict detection|PARTIAL — `moduleSecurityGuard.js` exists; no formal conflict detection document|
|25|Final freeze/release tag|COMPLETE — git tag `v1.0.0-mvp2` created|

---

## Known Gaps (Acceptable for MVP2)

These gaps are known, documented, and acceptable for an investor prototype:

1. **Rate limiting** — API routes have no Express rate-limit middleware. Risk: medium. Mitigation: investor demo is behind demo mode (no public API exposure). Fix: add `express-rate-limit` before public beta.
2. **Postgres not deployed** — session data uses localStorage/memory fallback. Fix: provision DATABASE_URL and run migrations.
3. **No rollback scripts** — 71 forward migrations, no rollback. Fix: add down migrations before production deployment.
4. **Visual regression baselines** — screenshots exist but no automated diff. Fix: integrate `pixelmatch` or Percy before v1.1.
5. **Guest user manual** — no step-by-step guide for guests. Fix: create before venue staff training.

---

## Build Artifacts

```
npm run build  →  exit 0
dist/           →  production SPA bundle
vercel.json     →  SPA rewrites for all /smokecraft/* routes
```

## Commit History (key milestones)

```
452397ed  SmokeCraft 360 investor readiness — 300/300 PASS
f31e93ca  SmokeCraft 360 total system fix — 137/137 PASS
14ea98c4  chore(verify): SmokeCraft 360 final deployment verification — 67/67 PASS
8f7cd821  fix(a11y): fix all SmokeCraft touch targets and slider labels
```

## How to Reproduce

```bash
# Install
npm install

# Run investor readiness suite (requires Playwright)
node e2e-smokecraft-investor-readiness.mjs

# Run total system suite
node e2e-smokecraft-total-system.mjs

# Demo reset (for live investor walkthroughs)
# Navigate to /smokecraft/demo-reset in the running app
npm run preview  # then open http://localhost:4173/smokecraft/demo-reset
```
