#!/usr/bin/env node
/**
 * Holistic Fix 5C-2B-2 — build-blocking validator for the Golden Box
 * award-issuance authority.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Golden Box awards authority validator (Holistic Fix 5C-2B-2)\n')

const awardsSvc = fs.readFileSync('server/services/goldenBox/awardsService.js', 'utf8')
const eventSvc = fs.readFileSync('server/services/goldenBox/goldenBoxEventService.js', 'utf8')
const routes = fs.readFileSync('server/routes/goldenBoxRoutes.js', 'utf8')
const controller = fs.readFileSync('server/controllers/goldenBoxController.js', 'utf8')
const migration105 = fs.readFileSync('server/db/migrations/105_smokecraft_golden_box_awards_authority.sql', 'utf8')
const apiClient = fs.readFileSync('src/services/goldenBox/goldenBoxApiClient.js', 'utf8')
const resultsScreen = fs.readFileSync('src/pages/smokecraft/goldenBox/ResultsExperience.jsx', 'utf8')

// ── 1. Awards never derive from client placement ────────────────────────
check('issueAwards() reads placement/award type only from the immutable finalized result (getLatestFinalizedResult), never from the request body', /const finalized = await getLatestFinalizedResult\(competitionId\)/.test(awardsSvc) && !/req\.body\.(placement|awardType|rank)/.test(awardsSvc))
check('handleIssueAwards() passes only resultVersion/idempotencyKey through — never a client placement/award — to the service', !/req\.body\.(placement|awardType|rank|reward)/.test(controller))
check('ResultsExperience.jsx never computes its own award title/placement — only renders the server-returned award row', !/computeAward\(|setAwardTitle\(['"`]/.test(resultsScreen))

// ── 2. Every award requires a real finalized ranking source ─────────────
check('issueAwards() throws finalized_result_required when no finalized result exists for the requested result version', /finalized_result_required/.test(awardsSvc) && /if \(!finalized \|\|/.test(awardsSvc))
check('Only entries with a real top-3 placement from the finalized ranking receive an award record — no invented "unsupported placement" award', /PLACEMENT_AWARD_TYPES = \{ 1: 'first_place', 2: 'second_place', 3: 'third_place' \}/.test(awardsSvc) && /qualifying = finalized\.ranked\.filter\(r => PLACEMENT_AWARD_TYPES\[Number\(r\.placement\)\]\)/.test(awardsSvc))
check('golden_box_awards has a real FK-backed link (entry_id, competition_id) to the finalized ranking data, never a free-floating record', /entry_id\s+UUID NOT NULL REFERENCES golden_box_entries/.test(migration105) && /competition_id\s+BIGINT NOT NULL REFERENCES golden_box_competitions/.test(migration105))

// ── 3. XP, badge, and stamp issuance are idempotent ──────────────────────
check('golden_box_award_issuances has a real UNIQUE(competition_id, result_version) constraint — one issuance per finalized result version', /UNIQUE \(competition_id, result_version\)/.test(migration105))
check('golden_box_award_issuances has a real idempotency_key UNIQUE index', /idx_gbai_idempotency_key/.test(migration105))
check('XP grants use xpService.awardXp() with a real, deterministic per-entry idempotency key — never a raw, unprotected balance mutation', /awardXp\(\{/.test(awardsSvc) && /idempotencyKey: `golden-box-award-xp-\$\{competitionId\}-\$\{resultVersion\}-\$\{row\.entry_id\}`/.test(awardsSvc))
check('golden_box_awards has a real UNIQUE(competition_id, entry_id, result_version) constraint — no duplicate award record for the same entry+result version', /UNIQUE \(competition_id, entry_id, result_version\)/.test(migration105))
check('issueAwards() gracefully catches a UNIQUE_VIOLATION race on the issuance insert (two-tab race), returning the real winning issuance rather than crashing or duplicating', /err\.code === UNIQUE_VIOLATION/.test(awardsSvc) && /return loadIssuedAwards/.test(awardsSvc))

// ── 4. Reward rules carry real versions ───────────────────────────────────
check('AWARD_RULE_ID/AWARD_RULE_VERSION are real, exported, versioned constants stamped on every award record — never an unversioned rule', /export const AWARD_RULE_ID = 'golden_box_placement_award'/.test(awardsSvc) && /export const AWARD_RULE_VERSION = 1/.test(awardsSvc))
check('Every persisted award row carries rule_id and rule_version columns (NOT NULL)', /rule_id\s+TEXT NOT NULL/.test(migration105) && /rule_version\s+INT NOT NULL/.test(migration105))
check('XP rule lookup queries the real, existing xp_award_rules config table by source_type=golden_box — never an invented in-code amount', /FROM xp_award_rules WHERE source_type = 'golden_box'/.test(awardsSvc))

// ── 5. Duplicate awards are impossible ────────────────────────────────────
check('Award-record insertion uses ON CONFLICT DO NOTHING against the real UNIQUE constraint as defense-in-depth alongside the issuance-level idempotency gate', /INSERT INTO golden_box_awards \(/.test(awardsSvc) && /ON CONFLICT \(competition_id, entry_id, result_version\) DO NOTHING/.test(awardsSvc))
check('The entire award-record write is atomic — one BEGIN/COMMIT transaction, rolled back together on any failure', /await client\.query\('BEGIN'\)/.test(awardsSvc) && /await client\.query\('COMMIT'\)/.test(awardsSvc) && /await client\.query\('ROLLBACK'\)\.catch/.test(awardsSvc))

// ── 6. Result screens never display fabricated rewards ──────────────────
check('ResultsExperience.jsx renders the honest "unavailable" copy for XP/badge/stamp when the real status is not \'issued\' — never claims a reward was earned that was not', /Not yet available \(no approved/.test(resultsScreen))
check('ResultsExperience.jsx never renders a hardcoded/mock award title outside the real AWARD_TITLES map keyed off the server-returned award_type', /AWARD_TITLES\[award\.award\.award_type\]/.test(resultsScreen))
check('No mock/fake/dummy award, XP, badge, or stamp appears as live data in ResultsExperience.jsx', !/mockAward|fakeAward|dummyAward|mockXp|fakeBadge/i.test(resultsScreen))

// ── 7. Golden Box rewards never bypass canonical reward services ────────
check('XP is granted only through the canonical xpService.awardXp() — never a direct xp_accounts/xp_transactions mutation in awardsService.js', /import \{ awardXp \} from '\.\/xpService\.js'/.test(awardsSvc) && !/UPDATE xp_accounts SET balance/.test(awardsSvc) && !/INSERT INTO xp_transactions/.test(awardsSvc))
check('Badge issuance is only ever attempted through the canonical rewardsIntegrationService.grantBadge() — never a direct passport_360_badges insert in awardsService.js', /rewardsIntegrationService\.grantBadge/.test(awardsSvc) && !/INSERT INTO passport_360_badges/.test(awardsSvc))
check('goldenBoxApiClient.js exposes the real issue-awards/get-award endpoints used by the results screen (one shared adapter, not a second competing implementation)', /issueAwards/.test(apiClient) && /getEntryAward/.test(apiClient))
check('ResultsExperience.jsx calls only through the shared goldenBoxApiClient — no direct fetch()/XHR to golden-box award endpoints', !/fetch\(['"`]\/api\/smokecraft\/golden-box/.test(resultsScreen))

// ── 8. Canonical events ───────────────────────────────────────────────────
check('goldenBoxEventService.js defines all four mandated 5C-2B-2 canonical event types', /'golden_box_awards_issued', 'golden_box_xp_awarded',\s*'golden_box_badge_unlocked', 'golden_box_passport_stamp_awarded',/.test(eventSvc))
check('golden_box_xp_awarded is only emitted inside the real xpRule-present branch — never unconditionally, so it can never fire for an unavailable reward', /if \(xpRule\) \{[\s\S]{0,1200}eventType: 'golden_box_xp_awarded'/.test(awardsSvc))
check('golden_box_awards_issued is emitted for every qualifying entry after real, committed award-record success', /eventType: 'golden_box_awards_issued'/.test(awardsSvc))

// ── 9. Authorization ───────────────────────────────────────────────────────
check('The award-issuance route requires requireAuth + requireRole(\'admin\') — authorized staff only', /awards\/issue', writeLimiter, requireAuth, requireRole\('admin'\)/.test(routes))

// ── 10. SC-D062 closure (Stage 5 Closure Gate) — the legacy client-
// controlled rewards route must never return ─────────────────────────
check('The unsafe legacy POST /entries/:entryId/rewards route no longer exists in goldenBoxRoutes.js', !/entries\/:entryId\/rewards'/.test(routes))
check('handleIssueRewards() no longer exists in goldenBoxController.js — no dormant client-controlled-XP/badge handler remains reachable', !/export async function handleIssueRewards/.test(controller))
check('No route in goldenBoxRoutes.js reads a client-submitted xpAmount/badgeId/placement value for any reward grant', !/req\.body\.xpAmount|req\.body\.badgeId\b/.test(controller))
check('rewardsIntegrationService (grantXp/grantBadge/publishToLeaderboard) is reachable only through awardsService.js — no other controller/route imports it directly', (() => {
  const importers = fs.readdirSync('server', { recursive: true })
    .filter(f => f.endsWith('.js') && !f.includes('rewardsIntegrationService.js') && !f.includes('awardsService.js'))
    .map(f => `server/${f}`)
    .filter(f => { try { return fs.readFileSync(f, 'utf8').includes('rewardsIntegrationService') } catch { return false } })
  return importers.length === 0
})())

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
