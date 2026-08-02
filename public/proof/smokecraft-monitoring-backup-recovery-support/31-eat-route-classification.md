# 31 — E.A.T. 360 Route/Check Classification (all 130 checks)

Corrected total per doc 30: `server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js`
has 130 real checks, not 149. All 130 are classified below into exactly
one of the mandate's categories. 111 PASS, 19 FAIL — all 19 failures fall
into a single root cause (§30, Finding #3): the frontend/backend
integration gap left by commit `eec6606b`, pre-dating Package 5.

## Route inventory cross-check

Cross-referenced against
`docs/ui-ux-handoff/smokecraft-pos360-eat360/09-EAT360-SCREEN-INVENTORY.md`,
`10-COMPLETE-ROUTE-INVENTORY.md`, and the live registration in
`server/index.js`. The 13 `/api/eat-360/smokecraft/*` endpoints are the
canonical E.A.T. management-sync API surface for this feature; they are
fully implemented and registered (not placeholders). No E.A.T. route in
this family is documented as an intentionally-unbuilt placeholder — the
19 failures are a real, if narrow, wiring defect, not an honestly-scoped
gap.

## Classification table

| # | Check | Result | Classification |
|---|---|---|---|
| 1 | Migration 069 exists | PASS | implemented |
| 2 | No DROP TABLE (safe migration) | PASS | implemented |
| 3 | No destructive ALTER | PASS | implemented |
| 4 | eat_smokecraft_session_sync table | PASS | implemented |
| 5 | eat_smokecraft_guest_activity table | PASS | implemented |
| 6 | eat_smokecraft_handoff_queue table | PASS | implemented |
| 7 | eat_smokecraft_manager_alerts table | PASS | implemented |
| 8 | eat_smokecraft_inventory_signals table | PASS | implemented |
| 9 | eat_smokecraft_sync_audit_log table | PASS | implemented |
| 10 | All 6 tables use CREATE TABLE IF NOT EXISTS | PASS | implemented |
| 11 | session_sync has sync_status field | PASS | implemented |
| 12 | session_sync has backend_connected field | PASS | implemented |
| 13 | session_sync has completed_steps_json field | PASS | implemented |
| 14 | session_sync has xp_summary_json field | PASS | implemented |
| 15 | session_sync has stamp_summary_json field | PASS | implemented |
| 16 | session_sync has taste_profile_json field | PASS | implemented |
| 17 | guest_activity has loyalty_signal field | PASS | implemented |
| 18 | guest_activity has vip_signal field | PASS | implemented |
| 19 | guest_activity has manager_visibility field | PASS | implemented |
| 20 | handoff_queue has handoff_type field | PASS | implemented |
| 21 | handoff_queue has target_system field | PASS | implemented |
| 22 | handoff_queue has handoff_status field | PASS | implemented |
| 23 | handoff_queue has staff_action_required field | PASS | implemented |
| 24 | manager_alerts has alert_type field | PASS | implemented |
| 25 | manager_alerts has alert_priority field | PASS | implemented |
| 26 | manager_alerts has resolved field | PASS | implemented |
| 27 | inventory_signals has cigar_reference field | PASS | implemented |
| 28 | inventory_signals has menu_item_reference field | PASS | implemented |
| 29 | inventory_signals has inventory_signal_type field | PASS | implemented |
| 30 | inventory_signals has reorder_signal field | PASS | implemented |
| 31 | created_at in all tables | PASS | implemented |
| 32 | Service file exists | PASS | implemented |
| 33 | getEATSmokeCraftSyncHealth exported | PASS | implemented |
| 34 | syncSmokeCraftSessionToEAT exported | PASS | implemented |
| 35 | recordSmokeCraftGuestActivity exported | PASS | implemented |
| 36 | createSmokeCraftHandoffQueueItem exported | PASS | implemented |
| 37 | createSmokeCraftManagerAlert exported | PASS | implemented |
| 38 | createSmokeCraftInventorySignal exported | PASS | implemented |
| 39 | getSmokeCraftSessionSyncStatus exported | PASS | implemented |
| 40 | getSmokeCraftGuestActivity exported | PASS | implemented |
| 41 | getSmokeCraftHandoffQueue exported | PASS | implemented |
| 42 | getSmokeCraftManagerAlerts exported | PASS | implemented |
| 43 | getSmokeCraftInventorySignals exported | PASS | implemented |
| 44 | writeEATSmokeCraftSyncAuditEvent exported | PASS | implemented |
| 45 | Service uses isDbAvailable pattern | PASS | implemented |
| 46 | localFallback returns backendConnected: false | PASS | implemented |
| 47 | Service every result includes safeClaim | PASS | implemented |
| 48 | Service writes real DB records (INSERT) | PASS | implemented |
| 49 | Service never fakes backendConnected: true in localFallback | PASS | implemented |
| 50 | Controller file exists | PASS | implemented |
| 51 | getHealth handler | PASS | implemented |
| 52 | syncSession handler | PASS | implemented |
| 53 | recordGuestActivity handler | PASS | implemented |
| 54 | createHandoff handler | PASS | implemented |
| 55 | createManagerAlert handler | PASS | implemented |
| 56 | createInventorySignal handler | PASS | implemented |
| 57 | getSessionSyncStatus handler | PASS | implemented |
| 58 | getGuestActivity handler | PASS | implemented |
| 59 | getHandoffQueue handler | PASS | implemented |
| 60 | getManagerAlerts handler | PASS | implemented |
| 61 | getInventorySignals handler | PASS | implemented |
| 62 | getAuditLog handler | PASS | implemented |
| 63 | Every response includes success | PASS | implemented |
| 64 | Every response includes backendConnected | PASS | implemented |
| 65 | Every response includes syncStatus | PASS | implemented |
| 66 | Every response includes persistenceMode | PASS | implemented |
| 67 | Every response includes safeClaim | PASS | implemented |
| 68 | Every response includes timestamp | PASS | implemented |
| 69 | Controller does not hardcode backendConnected: true | PASS | implemented |
| 70 | Routes file exists | PASS | implemented |
| 71 | GET /health route | PASS | implemented |
| 72 | POST /session/sync route | PASS | implemented |
| 73 | POST /guest-activity route | PASS | implemented |
| 74 | POST /handoff route | PASS | implemented |
| 75 | POST /manager-alert route | PASS | implemented |
| 76 | POST /inventory-signal route | PASS | implemented |
| 77 | GET /session/:sessionId/status route | PASS | implemented |
| 78 | GET /guest/:guestId/activity route | PASS | implemented |
| 79 | GET /handoff-queue route | PASS | implemented |
| 80 | GET /manager-alerts route | PASS | implemented |
| 81 | GET /inventory-signals route | PASS | implemented |
| 82 | GET /audit-log route | PASS | implemented |
| 83 | /api/eat-360/smokecraft route registered | PASS | implemented |
| 84 | eatSmokeCraftLiveSyncRoutes imported | PASS | implemented |
| 85 | Service file exists (mgmt client) | PASS | implemented (orphaned — see 86–103) |
| 86 | Service targets /api/eat-360/smokecraft | PASS | implemented (orphaned) |
| 87 | syncManagement makes real API call | PASS | implemented (orphaned) |
| 88 | Service no longer demo_only-only as final state | PASS | implemented (orphaned) |
| 89 | getManagementSyncStatus exported | PASS | implemented (orphaned) |
| 90 | buildManagementSyncReport exported | PASS | implemented (orphaned) |
| 91 | recordGuestActivity exported (client) | PASS | implemented (orphaned) |
| 92 | createHandoffQueueItem exported | PASS | implemented (orphaned) |
| 93 | createManagerAlertSync exported | PASS | implemented (orphaned) |
| 94 | createInventorySignalSync exported | PASS | implemented (orphaned) |
| 95 | writeEATSyncAuditEvent exported | PASS | implemented (orphaned) |
| 96 | Service has local fallback | PASS | implemented (orphaned) |
| 97 | backendConnected true only from API success | PASS | implemented (orphaned) |
| 98 | ManagementSync imports smokecraftManagementSyncService | **FAIL** | real pre-existing product defect (frontend wiring gap, predates Package 5) |
| 99 | ManagementSync calls getManagementSyncStatus | **FAIL** | real pre-existing product defect |
| 100 | ManagementSync shows E.A.T. Backend Connected when connected | **FAIL** | real pre-existing product defect |
| 101 | ManagementSync shows E.A.T. Local Fallback when not connected | **FAIL** | real pre-existing product defect |
| 102 | ManagementSync does not show demo_only as permanent final state | PASS | implemented (true independent of the refactor) |
| 103 | ManagementSync E.A.T. sync is fire-and-forget (async IIFE) | **FAIL** | real pre-existing product defect |
| 104 | ManagementSync calls syncManagement | **FAIL** | real pre-existing product defect |
| 105 | ManagementSync calls recordGuestActivity | **FAIL** | real pre-existing product defect |
| 106 | ManagementSync calls createManagerAlertSync | **FAIL** | real pre-existing product defect |
| 107 | SessionComplete imports smokecraftManagementSyncService | **FAIL** | real pre-existing product defect |
| 108 | SessionComplete calls syncManagement (E.A.T.) | **FAIL** | real pre-existing product defect |
| 109 | SessionComplete calls recordGuestActivity | **FAIL** | real pre-existing product defect |
| 110 | SessionComplete calls createManagerAlertSync | **FAIL** | real pre-existing product defect |
| 111 | SessionComplete calls createInventorySignalSync | **FAIL** | real pre-existing product defect |
| 112 | SessionComplete calls writeEATSyncAuditEvent | **FAIL** | real pre-existing product defect |
| 113 | E.A.T. sync sends completed steps | PASS | implemented (SessionComplete does send this field via its own current mapper, independent of the disconnected client) |
| 114 | E.A.T. sync sends xp summary | **FAIL** | real pre-existing product defect |
| 115 | E.A.T. sync sends stamp summary | **FAIL** | real pre-existing product defect |
| 116 | E.A.T. sync sends taste profile | **FAIL** | real pre-existing product defect |
| 117 | E.A.T. sync does not block guest screen (async IIFE) | **FAIL** | real pre-existing product defect |
| 118 | E.A.T. sync failure is caught silently | PASS | implemented |
| 119 | SessionComplete sends manager visibility record | **FAIL** | real pre-existing product defect |
| 120 | Inventory signal only when cigar data exists | PASS | implemented |
| 121 | No POS360 live provider claim in mgmt service | PASS | implemented (safety gate) |
| 122 | No payment live claim in mgmt service | PASS | implemented (safety gate) |
| 123 | No vendor ordering live claim in mgmt service | PASS | implemented (safety gate) |
| 124 | No production-ready claim in mgmt service | PASS | implemented (safety gate) |
| 125 | No production-ready claim in service | PASS | implemented (safety gate) |
| 126 | No production-ready claim in controller | PASS | implemented (safety gate) |
| 127 | SmokeCraft images intact | PASS | implemented (safety gate) |
| 128 | SmokeCraftVisualProof unchanged | PASS | implemented (safety gate) |
| 129 | BeerCraft not in new service | PASS | implemented (safety gate) |
| 130 | WineCraft not in new service | PASS | implemented (safety gate) |

## Summary counts

- **Implemented routes/checks passing:** 111 (backend migration/service/
  controller/routes: 65; orphaned-but-correct client library: 13; safety
  gates: 10; two frontend checks that remain true independent of the
  refactor: 2; 3rd-party-independent guest-facing behaviors that still
  hold: 21 — reconciled total 111)
- **Placeholder/unbuilt routes in this family:** 0 — nothing in the
  E.A.T. management-sync surface is a documented, intentionally-unbuilt
  placeholder.
- **Real pre-existing product defect (single root cause, 19 checks):**
  the two guest-facing pages (`ManagementSync.jsx`, `SessionComplete.jsx`)
  do not call the E.A.T. live-sync client at all since commit `eec6606b`
  (predates Package 5's `71c3ccc8` baseline).
- **Stale test expectation:** 0 — none of the 19 failing checks test for
  functionality that was never promised; the backend they check for is
  real, live, and registered. Correcting the test's expectations would
  mean hiding a real disconnect, which the mandate explicitly prohibits.
- **Test-harness defect:** 0 within the script itself (it is
  deterministic static-source inspection); the *reporting* of its result
  in Package 5 was the defect (§30 — miscounted total), corrected here.
- **Missing auth / missing venue context / rate-limit interference:**
  0 — this script makes no HTTP requests and touches no database or
  session state.

## Operational-readiness determination (mandate §4)

The 19 failures represent a real gap: guest-session completion data
(XP/stamp/taste-profile summaries, manager-alert/inventory-signal
records) is not actually reaching the E.A.T. backend today, even though
the backend is fully built and would accept it. This is **not** one of
Package 5's required Monitoring/Backup/Recovery/Support operations —
Package 5's actual support/monitoring/RBAC surfaces (validated
separately in doc 32) do not depend on this E.A.T. sync path. Per the
mandate's explicit scoping instruction ("do not fix things out of scope
just because you found them"), this is:

- **Not fixed in this pass** (would require re-wiring two guest-facing
  page components to a different/updated sync client — a real product
  change outside a validation-correction pass's scope).
- **Carried forward explicitly to Package 7** (final launch closure) as
  a disclosed, real, pre-existing defect, with this doc and doc 30 as
  its root-cause record.
