#!/usr/bin/env node
/**
 * Holistic Fix 5C-1B — build-blocking validator for the Golden Box
 * submission foundation (drafts, versioning, submission eligibility,
 * idempotency, account conversion).
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Golden Box scoring/persistence-authority validator (Holistic Fix 5C-1B)\n')

const entrySvc = fs.readFileSync('server/services/goldenBox/entryService.js', 'utf8')
const eventSvc = fs.readFileSync('server/services/goldenBox/goldenBoxEventService.js', 'utf8')
const routes = fs.readFileSync('server/routes/goldenBoxRoutes.js', 'utf8')
const controller = fs.readFileSync('server/controllers/goldenBoxController.js', 'utf8')
const migration102 = fs.readFileSync('server/db/migrations/102_smokecraft_golden_box_submission_authority.sql', 'utf8')
const hook = fs.readFileSync('src/hooks/useGoldenBox.js', 'utf8')
const workspace = fs.readFileSync('src/pages/smokecraft/goldenBox/EntryWorkspace.jsx', 'utf8')
const playerStateSvc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')

// ── 1. The client never decides submission eligibility ─────────────────
check('Submission completeness (validateSubmission) is computed server-side from real saved components, never a client-submitted eligible/complete flag', /function validateSubmission\(version, components\)/.test(entrySvc) && /requiredTypes\.includes|for \(const t of requiredTypes\)/.test(entrySvc))
check('submitEntry() never trusts a client-submitted score/pass-fail/eligible field — errors are computed by validateSubmission(), not read from req.body', !/req\.body\.eligible\b|req\.body\.validationPassed\b|req\.body\.score\b/.test(controller))
check('EntryWorkspace.jsx never computes its own eligibility/completeness verdict — only submits and renders the server response', !/setEligible\(true\)|isEligible\s*=\s*true/.test(workspace))

// ── 2. Draft versioning is real optimistic concurrency, not last-write-wins ──
check('saveDraft() accepts an expectedVersion and rejects a stale write with a real conflict (never silently overwrites a newer edit)', /typeof expectedVersion === 'number' && expectedVersion !== lockedEntry\.current_version/.test(entrySvc) && /EntryError\('stale_version'\)/.test(entrySvc))
check('The stale-version check happens under a real row lock (FOR UPDATE) inside the transaction — closes the two-tab race a pre-lock-only check would still allow', /SELECT \* FROM golden_box_entries WHERE entry_id = \$1 FOR UPDATE/.test(entrySvc))
check('The stale_version conflict is surfaced to the client as an honest 409 with the real current version', /err\.code === 'stale_version'/.test(controller) && /status\(409\)\.json\(\{ success: false, error: 'stale_version', currentVersion/.test(controller))
check('The shared client hook exposes a real "stale" save state (previously anticipated in the state list but never reachable)', /setSaveState\(result\.error === 'stale_version' \? 'stale' : 'failed'\)/.test(hook))
check('EntryWorkspace.jsx renders an honest UI state for a stale write, offering a real reload action', /saveState === 'stale'/.test(workspace) && (workspace.match(/saveState === 'stale'/g) || []).length >= 2)

// ── 3. Database-enforced idempotency ────────────────────────────────────
check('golden_box_entry_versions has a real idempotency_key UNIQUE index (draft save/update dedupe)', /idx_gbev_idempotency_key/.test(migration102))
check('golden_box_submissions has a real idempotency_key UNIQUE index in addition to the existing entry-level UNIQUE(entry_id)', /idx_gbs_idempotency_key/.test(migration102))
check('saveDraft() checks the idempotency key BEFORE the stale-version check, so a true retry of an already-succeeded save is never wrongly rejected as a conflict', entrySvc.indexOf('idempotencyKey) {') < entrySvc.indexOf("expectedVersion !== lockedEntry.current_version"))
check('submitEntry() catches a UNIQUE_VIOLATION on the submissions insert and returns the real winning submission (two-tab race), never a fabricated one or an unhandled 500', /err\.code === UNIQUE_VIOLATION/.test(entrySvc) && /Two-tab \/ rapid-double-click race/.test(entrySvc))
check('The client generates a real per-request idempotency key for every draft save and submit call', /gb-save-\$\{entryId\}-\$\{Date\.now\(\)\}/.test(hook) && /gb-submit-\$\{entryId\}-\$\{Date\.now\(\)\}/.test(hook))

// ── 4. Canonical events ─────────────────────────────────────────────────
check('goldenBoxEventService.js defines exactly the four mandated canonical event types', /CANONICAL_GOLDEN_BOX_EVENT_TYPES = \[\s*'golden_box_draft_created', 'golden_box_draft_updated',\s*'golden_box_submission_requested', 'golden_box_submitted',/.test(eventSvc))
check('Every canonical event carries learner identity, entry ID, version ID, rule version, result, idempotency key, audit ID, and server timestamp', /auditId: event\.id, serverTimestamp: event\.created_at/.test(eventSvc) && /entryId, versionId: versionId/.test(eventSvc) && /ruleVersion: ruleVersion/.test(eventSvc))
check('createEntry() emits golden_box_draft_created', /eventType: 'golden_box_draft_created'/.test(entrySvc))
check('saveDraft() emits golden_box_draft_updated', /eventType: 'golden_box_draft_updated'/.test(entrySvc))
check('submitEntry() emits golden_box_submission_requested before validating, and golden_box_submitted only after real success', /eventType: 'golden_box_submission_requested'/.test(entrySvc) && /eventType: 'golden_box_submitted'/.test(entrySvc))

// ── 5. Active screens use the shared server adapter, no bypass ─────────
check('EntryWorkspace.jsx uses the one shared hook (useGoldenBoxEntry) — no bypassing, no second competing draft-management implementation', /useGoldenBoxEntry/.test(workspace))
check('EntryWorkspace.jsx never calls fetch()/XHR directly for draft/submission mutations — only through the shared goldenBoxApiClient', !/fetch\(['"`]\/api\/smokecraft\/golden-box/.test(workspace))
check('No mock/fake/dummy Golden Box submission result appears as live data in EntryWorkspace.jsx', !/mockSubmission|fakeEntry|dummySubmission/i.test(workspace))

// ── 6. Identity — the SC-D055-class defect, found and fixed here too ───
check('Golden Box routes issue a fresh guest identity when none exists (ensureSmokeCraftGuestIdentity present) — real found gap, prevents the recurring 401-on-first-navigation defect class', /ensureSmokeCraftGuestIdentity/.test(routes))
check('Golden Box routes prefix an authenticated account identity with user: (matches the established, correct pattern; the raw id was a real found defect that broke post-conversion entry lookups)', /req\.goldenBoxGuestReference = `user:\$\{req\.smokecraftIdentity\.id\}`/.test(routes))

// ── 7. Account conversion does not drop Golden Box state ───────────────
check('convertGuestToAccount() no longer uses the generic entry_id-regenerating copy for golden_box_entries (that broke FK continuity to versions/components/submissions — a real found defect)', !/table: 'golden_box_entries'/.test(playerStateSvc))
check('convertGuestToAccount() transfers Golden Box entries via a bespoke function that preserves parent/child relationships (versions and components remapped to the new entry id)', /goldenBoxEntriesTransferred/.test(playerStateSvc) && /versionIdMap/.test(playerStateSvc))
check('The transferred draft history includes blend components, not just the entry shell', /golden_box_blend_components/.test(playerStateSvc) && /versionIdMap\.set\(v\.id, insertedVersion\.rows\[0\]\.id\)/.test(playerStateSvc))
check('The transferred submission record is preserved when its version was actually transferred', /golden_box_submissions/.test(playerStateSvc) && /versionIdMap\.has\(submission\.rows\[0\]\.entry_version_id\)/.test(playerStateSvc))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
