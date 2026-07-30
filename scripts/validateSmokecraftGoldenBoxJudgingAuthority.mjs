#!/usr/bin/env node
/**
 * Holistic Fix 5C-2A — build-blocking validator for the Golden Box
 * judge-assignment and scorecard-scoring authority.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Golden Box judging-authority validator (Holistic Fix 5C-2A)\n')

const judgingSvc = fs.readFileSync('server/services/goldenBox/judgingService.js', 'utf8')
const eventSvc = fs.readFileSync('server/services/goldenBox/goldenBoxEventService.js', 'utf8')
const routes = fs.readFileSync('server/routes/goldenBoxRoutes.js', 'utf8')
const controller = fs.readFileSync('server/controllers/goldenBoxController.js', 'utf8')
const migration103 = fs.readFileSync('server/db/migrations/103_smokecraft_golden_box_judging_authority.sql', 'utf8')
const apiClient = fs.readFileSync('src/services/goldenBox/goldenBoxApiClient.js', 'utf8')
const dashboard = fs.readFileSync('src/pages/smokecraft/goldenBox/JudgeDashboard.jsx', 'utf8')
const review = fs.readFileSync('src/pages/smokecraft/goldenBox/JudgeEntryReview.jsx', 'utf8')

// ── 1. The client never calculates the authoritative total ─────────────
check('submitScorecard() computes the weighted total server-side from validated scores, never from a client-submitted field', /weightedTotal = scores\.reduce/.test(judgingSvc) && /normalizedTotal/.test(judgingSvc))
check('submitScorecard() never reads a client-submitted total/weightedTotal field as authoritative (req.body totals are ignored, not persisted)', !/weighted_total:\s*(scores\.)?(req\.body\.|body\.)?(weightedTotal|totalScore)\b/.test(judgingSvc))
check('handleSubmitScorecard() passes only scores/actor/idempotency through — never a client total — to the service', !/req\.body\.(weightedTotal|totalScore)/.test(controller))
check('JudgeEntryReview.jsx never computes its own authoritative total — only renders the server-returned weighted_total', !/setWeightedTotal\(|computeTotal\(|const total = scores/.test(review))

// ── 2. Every criterion carries a versioned rule ─────────────────────────
check('golden_box_rubric_criteria has a real rule_version column with a NOT NULL default, and every seeded criterion carries rule_version 1', /rule_version\s+INT NOT NULL DEFAULT 1/.test(migration103) && (migration103.match(/, 1, '[^']+', '[^']+',/g) || []).length === 12)
check('getRubric() reads only active, versioned criteria from the real table, never a hardcoded/duplicated list', /FROM golden_box_rubric_criteria WHERE active = true/.test(judgingSvc))
check('validateScorePayload() rejects any category not present in the real rubric (no invented/unversioned category can be scored)', /invalid_category/.test(judgingSvc) && /rubricByKey\.get\(s\.category\)/.test(judgingSvc))
check('The scorecard persists the rule_version it was scored under (rule-version retention across future rubric changes)', /rule_version = \$3|rule_version: rubric\[0\]\?\.rule_version|ruleVersion: rubric\[0\]/.test(judgingSvc))

// ── 3. Judge assignment requires real authorization ─────────────────────
check('Judge assignment routes require requireAuth + requireRole (authorized staff only, real server-side role check)', /judges['"`],\s*(readLimiter|writeLimiter),?\s*requireAuth,\s*requireRole/.test(routes) || (/\/judges/.test(routes) && /requireAuth/.test(routes) && /requireRole/.test(routes)))
check('assignJudge() rejects entries not in the eligible submitted/locked/under_review set (never a still-editable draft)', /ELIGIBLE_ENTRY_STATUSES_FOR_ASSIGNMENT/.test(judgingSvc) && /entry_not_eligible_for_judging/.test(judgingSvc))
check('assignJudge() rejects judge self-assignment (entry.user_id === judgeUserId), a real server-resolved identity check', /entry\.user_id === judgeUserId/.test(judgingSvc) && /judge_self_assignment_prohibited/.test(judgingSvc))
check('assignJudge() enforces venue scope via a real active venue_memberships row, never a client-asserted membership', /venue_memberships WHERE user_id = \$1 AND venue_id = \$2 AND status = 'active'/.test(judgingSvc) && /judge_outside_venue_scope/.test(judgingSvc))
check('Every assignment records who assigned it (assigned_by), a real append-only audit fact, not just a timestamp', /assigned_by TEXT/.test(migration103) && /INSERT INTO golden_box_judge_assignments \(competition_id, judge_id, entry_id, assigned_by\)/.test(judgingSvc))

// ── 4. Final submission is idempotent ────────────────────────────────────
check('golden_box_scorecards has a real idempotency_key UNIQUE index for final submission dedupe', /idx_gbsc_idempotency_key/.test(migration103))
check('saveScorecardDraft() and submitScorecard() both check the idempotency key before AND after acquiring the row lock (pre-lock fast path + in-lock authoritative recheck)', (judgingSvc.match(/idempotencyKey\) \{/g) || []).length >= 4)
check('A retried final submission with the same idempotency key returns the same real scorecard, never a fabricated duplicate', /idempotency_key = \$1/.test(judgingSvc))

// ── 5. Finalized scorecards cannot remain editable ──────────────────────
check('saveScorecardDraft() rejects any draft-save attempt once the scorecard has already left draft status', /scorecard\.status !== 'draft'/.test(judgingSvc) && /scorecard_already_submitted/.test(judgingSvc))
check('submitScorecard() never rescoring an already-submitted scorecard — returns the immutable prior result instead of overwriting it', /already.*submit|status === 'submitted'/i.test(judgingSvc))
check('JudgeEntryReview.jsx disables score inputs once the scorecard is locked (submitted/locked), matching the server-enforced immutability', /disabled=\{locked/.test(review) && /const locked = scorecard && \['submitted', 'locked'\]\.includes/.test(review))
check('The one-original-scorecard-per-judge-per-entry partial unique index closes the NULL-uniqueness race (two-tab first-save race, found and fixed this pass)', /idx_gbsc_one_original_per_judge_entry/.test(migration103) && /WHERE amended_from IS NULL/.test(migration103))

// ── 6. Judge screens use the shared server adapter, no bypass ───────────
check('JudgeDashboard.jsx and JudgeEntryReview.jsx call only through the shared goldenBoxApiClient — no direct fetch()/XHR to golden-box endpoints', !/fetch\(['"`]\/api\/smokecraft\/golden-box/.test(dashboard) && !/fetch\(['"`]\/api\/smokecraft\/golden-box/.test(review))
check('goldenBoxApiClient.js exposes the real rubric/draft/submit endpoints used by the judge screens (one shared adapter, not a second competing implementation)', /getJudgingRubric/.test(apiClient) && /saveScorecardDraft/.test(apiClient) && /submitScorecard/.test(apiClient))
check('No mock/fake/dummy scorecard or rubric data appears as live data in the judge screens', !/mockScorecard|fakeRubric|dummyScorecard/i.test(review) && !/mockAssignments|fakeJudge/i.test(dashboard))

// ── 7. Canonical events ───────────────────────────────────────────────────
check('goldenBoxEventService.js defines all four mandated 5C-2A canonical event types', /'golden_box_judge_assigned', 'golden_box_scorecard_draft_saved',\s*'golden_box_scorecard_submitted', 'golden_box_entry_scored',/.test(eventSvc))
check('assignJudge() emits golden_box_judge_assigned', /eventType: 'golden_box_judge_assigned'/.test(judgingSvc))
check('saveScorecardDraft() emits golden_box_scorecard_draft_saved', /eventType: 'golden_box_scorecard_draft_saved'/.test(judgingSvc))
check('submitScorecard() emits golden_box_scorecard_submitted and golden_box_entry_scored only after real server success', /eventType: 'golden_box_scorecard_submitted'/.test(judgingSvc) && /eventType: 'golden_box_entry_scored'/.test(judgingSvc))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
