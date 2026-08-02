# 30 — E.A.T. 360 Route Smoke — Investigation

## The script

The canonical E.A.T. route smoke script is
`server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js` (confirmed by
name/content match against `regression-results.md`'s citation). It is a
**pure static-source-inspection script** — it reads specific files
(migration SQL, service/controller/route files, two React page
components) with `readFileSync` and asserts on string patterns. It does
**not** require a running server or database at all.

## Finding #1 — the "149" total does not exist and never did

```
$ grep -c "^check(" server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js
130

$ git diff 71c3ccc8 HEAD -- server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js
(empty — the file is byte-identical between the pre-Package-5 baseline
and the current HEAD)

$ git show 71c3ccc8:server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js | grep -c "^check("
130
```

The script has **always** had exactly 130 `check()` calls — both at the
pre-Package-5 baseline and now. It was never 149 checks. Package 5's
reported "112/149 PASS, 37 FAIL" does not correspond to any real
execution of this script at any commit.

## Finding #2 — the likely source of the miscount

The script's own output format double-prints failing check labels: each
`check()` call prints its own pass/fail line during the run, **and**, if
any failures occurred, the script reprints every failing label a second
time under a `Failed checks:` header at the very end:

```js
console.log(`\n=== RESULT: ${passed} passed / ${passed + failed} total ===`)
if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  ✗ ${f}`))   // ← second print of each failure
  ...
}
```

A naive count of every `✓`/`✗`-marked line in the raw console output
(rather than reading the script's own printed `RESULT:` line) yields
`130 (real checks) + N (duplicated failure reprints)`. Re-running the
identical script against the current, unmodified codebase today:

```
$ node server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js
...
=== RESULT: 111 passed / 130 total ===

Failed checks:
  ✗ ManagementSync imports smokecraftManagementSyncService
  ... (19 lines)

$ grep -c "^  ✓\|^  ✗" <output>
149        ← 130 real lines + 19 duplicated failure-reprint lines
```

130 + 19 = **149**, exactly the bogus total Package 5 reported. This is
almost certainly how "149" was arrived at — an artifact of counting raw
output lines instead of the script's own authoritative `RESULT:` line —
not a different script, not a different run, not a hidden 19 extra
checks that quietly disappeared.

**This pass's correction:** the real, current, reproducible result is:

```
111 passed / 130 total   (19 failed)
```

## Finding #3 — the underlying 19 failures are real, and are pre-existing (not Package 5)

Re-verified via `git log`/`git merge-base --is-ancestor`:

```
$ git log --oneline --diff-filter=A -- src/services/smokecraft/managementSyncSnapshotMapper.js
eec6606b SmokeCraft visual sequence and production staging verification

$ git merge-base --is-ancestor eec6606b 71c3ccc8 && echo "predates Package 5 baseline"
predates Package 5 baseline
```

Root cause: `ManagementSync.jsx` and `SessionComplete.jsx` were
refactored in commit `eec6606b` — **before** Package 5's own baseline
commit `71c3ccc8` — to source their data from a different mechanism
(`mapJourneyToSnapshotPayload()` / `useSmokeCraftServerJourney()`)
instead of the Phase F.7 `smokecraftManagementSyncService.js` client
that the F.7 verification script still checks for. That client file
still exists, unmodified, and still correctly calls the real
`/api/eat-360/smokecraft` backend — but nothing in the current guest-facing
UI imports or calls it anymore:

```
$ grep -rn "eat-360" src/pages/smokecraft/ src/hooks/useSmokeCraftServerJourney.js src/services/smokecraft/
(no matches)

$ grep -n "eat-360\|eatSmokeCraftLiveSyncRoutes" server/index.js
25:import eatSmokeCraftLiveSyncRoutes from './routes/eatSmokeCraftLiveSyncRoutes.js'
275:app.use('/api/eat-360/smokecraft',     eatSmokeCraftLiveSyncRoutes)
```

So: the backend (migration, service, controller, routes) is fully
present, correct, and live — 111 of the 130 checks confirm exactly that.
The 19 failures are 100% concentrated in the two frontend page
components no longer wiring up to that backend. This is a genuine,
pre-existing (predates Package 5) **frontend/backend integration gap**:
real functionality that was built and later silently disconnected by an
unrelated refactor, not a stale/wrong test expectation and not
something Package 5 introduced or hid.

Confirmed **not** a rate-limit, auth, or venue-context artifact: this
script never makes an HTTP request or touches the database at all — its
result is 100% deterministic source-code inspection, unaffected by
server state, so no fresh-server re-run could ever change this result.
(Re-run twice during this pass to confirm: identical 111/130 both
times.)

See `31-eat-route-classification.md` for the full per-check
classification of all 130 checks against the route inventory in
`docs/ui-ux-handoff/smokecraft-pos360-eat360/09-EAT360-SCREEN-INVENTORY.md`
and `10-COMPLETE-ROUTE-INVENTORY.md`, and the operational-readiness
determination for the 19 failures.
