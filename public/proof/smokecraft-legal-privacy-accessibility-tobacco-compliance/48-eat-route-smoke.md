# 48 — E.A.T. Route Smoke: honest 111/130 baseline confirmed, no new failures

## Locating the canonical script

Found in
`public/proof/smokecraft-monitoring-backup-recovery-support/31-eat-route-classification.md`
(Package 5's proof) — the authoritative reconciliation of the E.A.T. check
count:

> Corrected total per doc 30: `server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js`
> has 130 real checks, not 149. All 130 are classified below into exactly
> one of the mandate's categories. 111 PASS, 19 FAIL — all 19 failures fall
> under a single real, pre-existing product defect.

This matches `package.json`'s `verify:phase-f7-eat-smokecraft-live-sync`
entry. The script itself prints `111 passed / 130 total` directly —
matching doc 31's reconciled total exactly, confirming the script has not
drifted since Package 5.

## Run

```
$ node server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js
...
=== RESULT: 111 passed / 130 total ===

Failed checks:
  ✗ ManagementSync imports smokecraftManagementSyncService
  ✗ ManagementSync calls getManagementSyncStatus
  ✗ ManagementSync shows E.A.T. Backend Connected when connected
  ✗ ManagementSync shows E.A.T. Local Fallback when not connected
  ✗ ManagementSync E.A.T. sync is fire-and-forget (async IIFE)
  ✗ ManagementSync calls syncManagement
  ✗ ManagementSync calls recordGuestActivity
  ✗ ManagementSync calls createManagerAlertSync
  ✗ SessionComplete imports smokecraftManagementSyncService
  ✗ SessionComplete calls syncManagement (E.A.T.)
  ✗ SessionComplete calls recordGuestActivity
  ✗ SessionComplete calls createManagerAlertSync
  ✗ SessionComplete calls createInventorySignalSync
  ✗ SessionComplete calls writeEATSyncAuditEvent
  ✗ E.A.T. sync sends xp summary
  ✗ E.A.T. sync sends stamp summary
  ✗ E.A.T. sync sends taste profile
  ✗ E.A.T. sync does not block guest screen (async IIFE)
  ✗ SessionComplete sends manager visibility record
```

- Total: 130
- Passed: 111
- Failed: 19
- New failures: **0** — all 19 failure labels above are an exact,
  byte-for-byte match to doc 31's classified failure list (the known
  `ManagementSync.jsx` / `SessionComplete.jsx` static-source-inspection
  gap: these components never call the still-functional E.A.T. live-sync
  service — `smokecraftManagementSyncService.js` itself is fully
  implemented and exports every required function; the two consuming
  components simply don't call it yet)
- Duplicate-label check: no duplicate failure labels present — 19 unique
  names, 19 failures, count reconciles exactly

Package 6's compliance-admin routes and checkout-enforcement changes do
not touch `ManagementSync.jsx`, `SessionComplete.jsx`, or
`smokecraftManagementSyncService.js` — this is confirmed by the failure
set being identical to the pre-Package-6 baseline, not merely similarly
sized.

Per mandate section 5: **111/130 with the same 19 known causes is the
expected PASS condition for this item**, not a failure. The underlying
live-sync defect is explicitly out of scope for this pass and remains
Package 7 scope, per the mandate's own instruction not to fix it here.

**E.A.T.: confirmed no regression, known baseline preserved exactly.**
