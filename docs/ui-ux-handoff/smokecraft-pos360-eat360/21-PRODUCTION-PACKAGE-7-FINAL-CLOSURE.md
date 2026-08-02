# 21 — Production Package 7: Final Launch Closure (Additive)

This document finalizes the handoff package. It is additive — nothing in
documents 01-20 has been removed or contradicted.

## E.A.T. live-sync — final behavior (SC-D069, closed)
`ManagementSync.jsx` and `SessionComplete.jsx` now call the existing
`smokecraftManagementSyncService` client, targeting the existing
`eatSmokeCraftLiveSyncService.js` backend at `/api/eat-360/smokecraft`.
Sync is fire-and-forget, idempotent (gated by the same
`completedSteps.includes('session-complete')` check used for local
XP/stamp award), never blocks the guest screen, and degrades honestly
to a "local fallback" state with no false success shown. Canonical
route smoke: 130/130 (was 111/130 before this package). Full technical
detail: `public/proof/smokecraft-final-production-launch-closure/eat-live-sync-repair.md`.

## Final production-readiness matrix
See `public/proof/smokecraft-final-production-launch-closure/production-readiness-matrix.md`
for the authoritative per-subsystem classification
(COMPLETE_AND_VERIFIED / COMPLETE_BUT_EXTERNAL_ACTIVATION_REQUIRED /
COUNSEL_REVIEW_REQUIRED / BLOCKED / NOT_APPLICABLE).

## External activation checklist
See `public/proof/smokecraft-final-production-launch-closure/external-activation-checklist.md`
for the exact setup steps, owners, and proof required for every
external service not exercised in this sandbox (Railway, managed
Postgres, R2, CDN/domain, Stripe live keys/webhook, Sentry, uptime
monitor, PagerDuty, DNS/TLS, GitHub Environment approval, counsel
review, staff training).

## New compliance screens (carried forward from Package 6, unchanged)
Age-gate, policy/warning UI, consent-preference center, data-rights UI,
staff-verification UI, compliance-admin UI — all still DRAFT-labeled
pending counsel review, no change in this package.

## Status page (new)
`GET /api/status/public` (backend) + `/status` (frontend route) — the
practical-minimum public status summary the mandate called for.
Sensitive-field-stripped, honest incident/maintenance/component state,
explicit "external monitoring not activated" disclosure. Verified
locally only; publication to a public domain is pending (no domain
exists in this sandbox).

## Remaining optional enhancements (not blockers)
- Full 5-viewport accessibility sweep on every screen (currently scoped
  to 2-3 viewport groups per pass, per established convention).
- Live POS360 order/handoff bridge (deferred to a hypothetical future
  Phase F.8 — infrastructure exists, not wired to E.A.T. sync in this
  package, and not required by this package's scope).
- Bundle code-splitting for the >500kB main chunk (build warning only,
  not a functional defect).

## Built vs. verified vs. activated vs. pending — exact distinction
- **Built**: code exists and is committed.
- **Verified**: a real automated check (unit/integration/browser/route
  smoke) ran against real local infrastructure (local Postgres, local
  dev/preview server) and passed.
- **Activated**: a real external account/credential/live environment is
  connected and has been exercised (e.g., a real Stripe live charge, a
  real R2 bucket write, a real public URL).
- **Pending**: built and verified, but not activated, because no real
  external account exists in this sandbox.

Everything in this package is Built + Verified. Nothing is Activated.
This is the correct and expected state for a sandboxed environment with
no cloud accounts.
