# E.A.T. Live-Sync Known Defect (Carried Forward, Not Fixed)

**Confirmed pre-existing defect, unchanged in this pass**: E.A.T. route smoke is 111/130 pass — 19 failures because `ManagementSync.jsx` / `SessionComplete.jsx` no longer call the existing (still-functional) E.A.T. live-sync backend. This defect is explicitly carried forward per the mandate instruction, NOT fixed in this pass.

**Compliance-necessity check performed**: this package's Admin Compliance Center (`compliance-center.md`) does not depend on E.A.T. live-sync wiring to function — it is a standalone API surface under `/api/compliance/*` with its own RBAC and its own DB tables, independent of `ManagementSync.jsx`/`SessionComplete.jsx`. Therefore the "fix only if genuinely necessary for compliance administration" exception in the mandate does NOT apply here, and the defect is correctly left untouched for Package 7.

**Compliance implication documented** (not fixed): if E.A.T. was intended to surface compliance data (e.g. age-verification denials, tobacco-purchase-denial audit events) to management dashboards, that surfacing gap exists today because of this same defect — management-facing E.A.T. screens will not automatically show the new `compliance_audit_events` stream until the live-sync wiring is repaired in a future package. The compliance audit data itself is real and queryable via `/api/compliance/audit-events` regardless of this gap.

No claim of E.A.T. operational completion is made anywhere in this proof set.

---

**UPDATE — Production Package 7 (2026-08-02):** this defect was assigned
identifier **SC-D069** and repaired in Package 7. `ManagementSync.jsx`
and `SessionComplete.jsx` now call the existing
`smokecraftManagementSyncService` client, which targets the existing,
unmodified `eatSmokeCraftLiveSyncService.js` backend — no second sync
service was created. Canonical route smoke
(`server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js`) now reports
**130/130 PASS**. See
`public/proof/smokecraft-final-production-launch-closure/eat-live-sync-repair.md`
for the full repair record. This file is left otherwise unmodified as
the accurate historical record of the defect as it stood through
Package 6.
