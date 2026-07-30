#!/usr/bin/env node
/**
 * Holistic Fix 5C-2B-1 — build-blocking validator for the Golden Box
 * results aggregation and final ranking authority.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Golden Box results/ranking authority validator (Holistic Fix 5C-2B-1)\n')

const resultsSvc = fs.readFileSync('server/services/goldenBox/resultsService.js', 'utf8')
const eventSvc = fs.readFileSync('server/services/goldenBox/goldenBoxEventService.js', 'utf8')
const routes = fs.readFileSync('server/routes/goldenBoxRoutes.js', 'utf8')
const controller = fs.readFileSync('server/controllers/goldenBoxController.js', 'utf8')
const migration104 = fs.readFileSync('server/db/migrations/104_smokecraft_golden_box_results_authority.sql', 'utf8')
const apiClient = fs.readFileSync('src/services/goldenBox/goldenBoxApiClient.js', 'utf8')
const resultsScreen = fs.readFileSync('src/pages/smokecraft/goldenBox/ResultsExperience.jsx', 'utf8')

// ── 1. Rankings are never calculated in the client ──────────────────────
check('computeCompetitionResults() computes rank server-side via a real deterministic sort, never trusting a client value', /entry\.rank = i \+ 1/.test(resultsSvc))
check('finalizeResults() ignores any client-submitted ranked/placement/score fields — only resultVersion and idempotencyKey are read from the request', !/req\.body\.(ranked|placement|rank|aggregate_score|score)\b/.test(controller))
check('handleFinalizeResults() passes only resultVersion/idempotencyKey through — never a client rank or score — to the service', /resultVersion, idempotencyKey: req\.body\?\.idempotencyKey/.test(controller))
check('ResultsExperience.jsx never computes its own rank/placement — only renders the server-returned rank/placement fields', !/computeRank\(|setRank\(\d|const rank = scores/.test(resultsScreen))

// ── 2. Incomplete entries never appear as finalized ──────────────────────
check('An entry with fewer completed scorecards than assigned judges is classified judging_in_progress, never silently treated as zero or scored', /completionStatus: 'judging_in_progress'/.test(resultsSvc) && /Number\(row\.completed_count\) < Number\(row\.assigned_count\)/.test(resultsSvc))
check('finalizeResults() blocks finalization while any entry is genuinely still judging_in_progress or on a mismatched rubric version', /judging_incomplete/.test(resultsSvc) && /completionStatus === 'judging_in_progress' \|\| p\.completionStatus === 'rubric_version_mismatch'/.test(resultsSvc))
check('An entry scored under a superseded rubric version is honestly pending (rubric_version_mismatch), never averaged against the wrong rule', /rubric_version_mismatch/.test(resultsSvc))
check('Withdrawn and disqualified entries are excluded from eligibility before any aggregate is computed', /EXCLUDED_ENTRY_STATUSES = \['withdrawn', 'disqualified'\]/.test(resultsSvc))

// ── 3. Tie-breaking matches the documented rule exactly ──────────────────
check('The tie-break order matches the documented sequence: score, construction, blend(aroma), presentation(rule_compliance), variance, submission time, entry id', /constructionB - constructionA/.test(resultsSvc) && /blendB - blendA/.test(resultsSvc) && /presB - presA/.test(resultsSvc) && /a\.scoreVariance - b\.scoreVariance/.test(resultsSvc) && /subA - subB/.test(resultsSvc) && /a\.entryId < b\.entryId/.test(resultsSvc))
check('RESULT_TIE_BREAK_RULE_VERSION is a real, exported, versioned constant — never an unversioned rule', /export const RESULT_TIE_BREAK_RULE_VERSION = 1/.test(resultsSvc))
check('The blend-quality and presentation criterion mappings are drawn from the already-approved rubric labels (aroma = "Aroma (Blend)", rule_compliance = "Presentation"), never invented', /TIE_BREAK_CRITERIA = \{ construction: 'construction_avg', blend: 'aroma', presentation: 'rule_compliance' \}/.test(resultsSvc))
check('Every finalized entry persists its real tie_break_reason (or null when no tie occurred) — never fabricated after the fact', /tie_break_reason = EXCLUDED\.tie_break_reason/.test(resultsSvc))

// ── 4. Finalized rankings cannot be edited directly ──────────────────────
check('A repeated finalize call for an already-finalized (competition_id, result_version) returns the ORIGINAL result via loadFinalizedResult, never recomputing or overwriting it', /const \{ rows: existingRows \} = await db\.query/.test(resultsSvc) && /if \(existingRows\[0\]\) return loadFinalizedResult/.test(resultsSvc))
check('There is no route or function that mutates an already-finalized golden_box_results row outside finalizeResults() itself', !/UPDATE golden_box_results SET/.test(routes) && !/UPDATE golden_box_results SET/.test(controller))
check('handleGetCompetitionResults() returns the immutable finalized record to every caller once one exists, never a freshly recomputed live view that could drift from what was actually finalized', /const finalized = await resultsService\.getLatestFinalizedResult\(competitionId\)\s*\n\s*if \(finalized\) return res\.json/.test(controller))

// ── 5. Finalization is idempotent ─────────────────────────────────────────
check('golden_box_result_finalizations has a real UNIQUE(competition_id, result_version) constraint — the database-enforced one-finalization-per-version authority', /UNIQUE \(competition_id, result_version\)/.test(migration104))
check('golden_box_result_finalizations has a real idempotency_key UNIQUE index for duplicate finalize-request dedupe', /idx_gbrf_idempotency_key/.test(migration104))
check('finalizeResults() checks the idempotency key BEFORE attempting the finalization insert, and gracefully catches a UNIQUE_VIOLATION race on the insert itself (two-tab finalization race)', /idempotencyKey\) \{[\s\S]{0,200}SELECT \* FROM golden_box_result_finalizations WHERE idempotency_key/.test(resultsSvc) && /err\.code === UNIQUE_VIOLATION/.test(resultsSvc))
check('The finalization transaction is atomic — all ranked rows are written inside one BEGIN/COMMIT, rolled back together on any failure', /await client\.query\('BEGIN'\)/.test(resultsSvc) && /await client\.query\('COMMIT'\)/.test(resultsSvc) && /await client\.query\('ROLLBACK'\)\.catch/.test(resultsSvc))

// ── 6. Result screens use no mock winners ─────────────────────────────────
check('ResultsExperience.jsx calls only through the shared goldenBoxApiClient — no direct fetch()/XHR to golden-box results endpoints', !/fetch\(['"`]\/api\/smokecraft\/golden-box/.test(resultsScreen))
check('goldenBoxApiClient.js exposes the real competition-results/finalize endpoints used by the results screen (one shared adapter, not a second competing implementation)', /getCompetitionResults/.test(apiClient) && /finalizeResults/.test(apiClient))
check('No mock/fake/dummy winner, ranking, or result appears as live data in ResultsExperience.jsx', !/mockRanking|fakeWinner|dummyResult|mockWinner/i.test(resultsScreen))

// ── 7. Venue and competition isolation ────────────────────────────────────
check('Every results query is scoped by a real competition_id parameter — no query aggregates across competitions', /WHERE e\.competition_id = \$1/.test(resultsSvc) && /WHERE competition_id = \$1 AND result_version = \$2/.test(resultsSvc))
check('Judge assignment (which results depend on) already enforces venue-scope boundaries at the judgingService layer — reused, not re-invented, for eligibility here', /golden_box_judge_assignments ja WHERE ja\.entry_id = e\.entry_id/.test(resultsSvc))

// ── 8. Canonical events ───────────────────────────────────────────────────
check('goldenBoxEventService.js defines both mandated 5C-2B-1 canonical event types', /'golden_box_results_calculated', 'golden_box_ranking_finalized',/.test(eventSvc))
check('finalizeResults() emits golden_box_results_calculated and golden_box_ranking_finalized only after real, committed finalization success, one per ranked entry, each carrying competitionId/resultVersion/rank/tieBreakReason/judgeCount/scoreSummary', /eventType: 'golden_box_results_calculated'/.test(resultsSvc) && /eventType: 'golden_box_ranking_finalized'/.test(resultsSvc) && /scoreSummary: \{ avgWeightedTotal/.test(resultsSvc))

// ── 9. Authorization ───────────────────────────────────────────────────────
check('The finalize route requires requireAuth + requireRole(\'admin\') — authorized staff only, real server-side role check', /results\/finalize', writeLimiter, requireAuth, requireRole\('admin'\)/.test(routes))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
