# 47 — POS360 Route Smoke: 339/339

## Locating the canonical script

The prior two Package 6 passes could not name the exact script behind
"POS360: 339/339". Search performed for this pass:

```
$ git log --all --oneline -- '*route*smoke*' '*pos360*' '*eat*'
$ grep -rl "339" public/proof/smokecraft-monitoring-backup-recovery-support/ \
              public/proof/smokecraft-production-infrastructure-deployment/
```

Found in `public/proof/smokecraft-monitoring-backup-recovery-support/regression-results.md`
(Package 5's proof, line 17):

> `server/scripts/verifyPos360ProductionReadiness.js` (POS360 route smoke)
> | **339/339 PASS** | POS360 fully unaffected

This matches `package.json`'s `verify:pos360-production-readiness` script
entry (`node server/scripts/verifyPos360ProductionReadiness.js`) — the
canonical script existed in the repository the whole time; it was not
found by name in the prior two passes' searches because they searched
for filenames literally containing "route" + "smoke" rather than the
readiness-verification naming convention this operation actually used for
POS360's route-level checks.

## Run

```
$ node server/scripts/verifyPos360ProductionReadiness.js

=== POS360 Production Readiness Verification ===
PASSED: 339
FAILED: 0
TOTAL:  339

✅ ALL 339 CHECKS PASSED
```

Run against the same fresh server (port 3001, commit `80e7b19b`, real
PostgreSQL) started for item 46. No routes were renamed or added since
the script was last run; no stale-expectation repair was needed. No
POS360 route (staff PIN mode switching, customer-to-staff handoff,
payment/fulfillment resolution, venue-isolation, RBAC) was blocked or
altered by Package 6's checkout-enforcement or compliance-UI changes —
all 339 checks pass unchanged.

**POS360: confirmed no regression.**
