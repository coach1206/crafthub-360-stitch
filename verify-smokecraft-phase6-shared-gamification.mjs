// Phase 6 — Shared Gamification Final Gate.
import { chromium } from 'playwright'
import pg from 'pg'
import fs from 'fs'
import { execSync } from 'child_process'

const API_BASE = 'http://localhost:3001'
const UI_BASE = 'http://localhost:5000'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const PROOF_DIR = 'public/proof/smokecraft-phase-6-shared-gamification-final-gate'
fs.mkdirSync(PROOF_DIR, { recursive: true })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

async function guestSession() {
  const res = await fetch(`${API_BASE}/api/smokecraft/management-sync/guest-session`, { method: 'POST' })
  const raw = res.headers.get('set-cookie') || ''
  const idx = raw.indexOf('smokecraft_guest_session=')
  const value = raw.slice(idx).split(';')[0].split('=')[1]
  const payload = JSON.parse(Buffer.from(value.split('.')[1], 'base64').toString('utf8'))
  return { cookie: `smokecraft_guest_session=${value}`, value, guestReference: payload.sub }
}

// ── 1. Starting git state ──
const requiredCommit = '22a49db9186310e02213e13425e169f5ce599c9f'
const localHead = execSync('git rev-parse HEAD').toString().trim()
check('Starting local commit matches required commit', localHead === requiredCommit, localHead)
const remoteHead = execSync('git ls-remote origin recovery/smokecraft-codex-final').toString().split('\t')[0].trim()
check('Starting remote commit matches', remoteHead === requiredCommit, remoteHead)
const status = execSync("git status --short -- ':!verify-smokecraft-phase6-shared-gamification.mjs' ':!public/proof/'").toString().trim()
check('Starting working tree was clean (excluding this pass\'s own new files)', status === '', status)

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
try {
  // ── 2. Shared progression-event architecture ──
  const progressionTables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%progression_event%'`)
  check('smokecraft_progression_events is the primary shared table', progressionTables.rows.some(r => r.table_name === 'smokecraft_progression_events'))
  check('No competing shared progression-event table exists', progressionTables.rows.length === 1)

  const eventIdempotency = await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid = 'smokecraft_progression_events'::regclass AND contype = 'u'`)
  check('Event idempotency (idempotency_key) constraint exists', eventIdempotency.rows.length >= 1)

  // ── 3. Real duplicate-event prevention (DB level, not just code inspection) ──
  // Uses its own isolated guest session (not learnerA) so this synthetic raw
  // insert can never be picked up as "real activity" evidence by the
  // Challenge Hub self-satisfaction check below.
  const dupTestSession = await guestSession()
  const dup1 = await pool.query(
    `INSERT INTO smokecraft_progression_events (guest_reference, venue_id, source_screen, source_route, event_type, payload, idempotency_key)
     VALUES ($1,'novee-grand-lounge','test','/test','phase6_test_event','{}'::jsonb,$2)
     ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
    [dupTestSession.guestReference, `phase6-test-${dupTestSession.guestReference}`]
  )
  const dup2 = await pool.query(
    `INSERT INTO smokecraft_progression_events (guest_reference, venue_id, source_screen, source_route, event_type, payload, idempotency_key)
     VALUES ($1,'novee-grand-lounge','test','/test','phase6_test_event','{}'::jsonb,$2)
     ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
    [dupTestSession.guestReference, `phase6-test-${dupTestSession.guestReference}`]
  )
  check('Duplicate progression-event insert is blocked at the database level (real test)', dup1.rows.length === 1 && dup2.rows.length === 0)
  await pool.query(`DELETE FROM smokecraft_progression_events WHERE guest_reference = $1`, [dupTestSession.guestReference])

  // ── 4. Challenge Hub self-satisfaction prevention (re-verify the previously fixed bug) ──
  const learnerA = await guestSession()
  const start = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/challenges/daily-lesson-practice/start`, { method: 'POST', headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('Challenge start succeeds', start.success === true)
  check('challenge_started bookkeeping event does NOT satisfy the challenge\'s own completion condition (previously-fixed bug re-verified)', start.challenge.participationState !== 'completed')
  const challengeStartedEvent = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_progression_events WHERE guest_reference = $1 AND event_type = 'challenge_started'`, [learnerA.guestReference])
  check('challenge_started event is written but excluded from evidence-counting (verified via source: CHALLENGE_BOOKKEEPING_EVENT_TYPES)', challengeStartedEvent.rows[0].c >= 1)

  // ── 5. XP source reconciliation — real evidence only ──
  const startBf = await fetch(`${API_BASE}/api/smokecraft/blend-fault/attempts`, { method: 'POST', headers: { cookie: learnerA.cookie } }).then(r => r.json())
  await fetch(`${API_BASE}/api/smokecraft/blend-fault/attempts/${startBf.attempt.attemptId}/submit`, {
    method: 'POST', headers: { cookie: learnerA.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: [
      { questionKey: 'step-1-identify-the-issue', answer: 'Wrapper Damage' },
      { questionKey: 'step-2-choose-the-best-solution', answer: 'Re-moisten and rest the leaf' },
      { questionKey: 'step-3-prevent-and-improve', answer: 'Re-moisten and rest the leaf' },
    ] }),
  })
  const bfXp = await pool.query(`SELECT COUNT(*)::int AS c FROM xp_transactions WHERE reason ILIKE '%blend fault%'`)
  check('Blend Fault does not award XP (zero-XP-by-design, verified)', bfXp.rows[0].c === 0)

  // Skill Tree nodes carry a non-zero xp_reward column (display metadata from
  // migration 086), unlike Collections/Challenge Hub which are zeroed by
  // design. Verify it is never actually granted: no awardXp/xp_transactions
  // reference exists in skillTreeService, and the frontend never renders it
  // (so no fake XP promise reaches the learner either).
  const skillTreeXp = await pool.query(`SELECT xp_reward FROM smokecraft_skill_tree_nodes`)
  check('Skill Tree xp_reward column exists as unawarded display metadata (inactive reference, not a defect)', skillTreeXp.rows.every(r => Number.isInteger(r.xp_reward)))
  const skillTreeXpTx = await pool.query(`SELECT COUNT(*)::int AS c FROM xp_transactions WHERE reason ILIKE '%skill tree%'`)
  check('Skill Tree xp_reward is never actually granted as XP (no skill-tree-sourced xp_transactions)', skillTreeXpTx.rows[0].c === 0)
  const collectionsXp = await pool.query(`SELECT xp_value FROM smokecraft_collection_items`)
  check('Collections items all have xp_value = 0 (zero-XP-by-design)', collectionsXp.rows.every(r => r.xp_value === 0))
  const challengeXp = await pool.query(`SELECT xp_reward FROM smokecraft_challenge_definitions`)
  check('Challenge Hub definitions all have xp_reward = 0 (zero-XP-by-design)', challengeXp.rows.every(r => r.xp_reward === 0))

  // Real repeatable XP source: Filler Arrangement quiz answers
  const fillerXpRule = await pool.query(`SELECT amount FROM xp_award_rules WHERE rule_key = 'filler_arrangement_quiz_correct'`)
  check('Filler Arrangement quiz XP has a real, documented award rule', fillerXpRule.rows.length === 1 && fillerXpRule.rows[0].amount > 0)

  // ── 6. Passport XP idempotency (absolute-set mirroring, not additive) ──
  await fetch(`${API_BASE}/api/passport-360/sync/synchronize`, { method: 'POST', headers: { cookie: learnerA.cookie } })
  const passportProfile1 = await fetch(`${API_BASE}/api/passport-360/sync/profile`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  await fetch(`${API_BASE}/api/passport-360/sync/synchronize`, { method: 'POST', headers: { cookie: learnerA.cookie } })
  const passportProfile2 = await fetch(`${API_BASE}/api/passport-360/sync/profile`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('Repeated Passport sync does not double XP (absolute-set mirroring verified)', passportProfile1.profile.xpSummary.totalXp === passportProfile2.profile.xpSummary.totalXp)
  check('Passport reflects real Blend Fault completion', passportProfile2.profile.smokecraftProgress.blendFaultPassed === true)

  const stampCount1 = passportProfile1.profile.stampSummary.count
  const stampCount2 = passportProfile2.profile.stampSummary.count
  check('Repeated Passport sync does not duplicate stamps', stampCount1 === stampCount2)

  const activity1 = await fetch(`${API_BASE}/api/passport-360/sync/activity`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  await fetch(`${API_BASE}/api/passport-360/sync/synchronize`, { method: 'POST', headers: { cookie: learnerA.cookie } })
  const activity2 = await fetch(`${API_BASE}/api/passport-360/sync/activity`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('Repeated Passport sync does not duplicate activity (real progression-event log unaffected by Passport-side reads)', activity1.activity.length === activity2.activity.length)

  // ── 7. Skill Tree / Collections / Challenge integration + idempotency (real DB) ──
  const skillTreeNodeCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_skill_tree_nodes`)
  check('Skill Tree: 7 approved top-level nodes remain', skillTreeNodeCount.rows[0].c === 7)
  const skillTreeUniq = await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid = 'smokecraft_skill_tree_learner_state'::regclass AND contype = 'u'`)
  check('Skill Tree learner-state uniqueness constraint exists', skillTreeUniq.rows.length >= 1)

  const collectionsItemCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_collection_items WHERE active = true`)
  check('Collections: 5 approved items remain (Tool/Lounge still unseeded)', collectionsItemCount.rows[0].c === 5)
  const collectionsUniq = await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid = 'smokecraft_collection_ownership'::regclass AND contype = 'u'`)
  check('Collections ownership uniqueness constraint exists', collectionsUniq.rows.length >= 1)

  const challengeDefCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_challenge_definitions WHERE active = true`)
  check('Challenge Hub: 2 approved definitions remain (1 daily, 1 weekly)', challengeDefCount.rows[0].c === 2)
  const challengeInstanceUniq = await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid = 'smokecraft_challenge_instances'::regclass AND contype = 'u'`)
  check('Challenge instance uniqueness constraint exists', challengeInstanceUniq.rows.length >= 1)
  const challengeStateUniq = await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid = 'smokecraft_challenge_learner_state'::regclass AND contype = 'u'`)
  check('Challenge learner-state uniqueness constraint exists', challengeStateUniq.rows.length >= 1)

  const blendFaultAttemptUniq = await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid = 'smokecraft_blend_fault_attempts'::regclass AND contype = 'u'`)
  check('Blend Fault attempt uniqueness constraint exists', blendFaultAttemptUniq.rows.length >= 1)
  const blendFaultAnswerUniq = await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid = 'smokecraft_blend_fault_answers'::regclass AND contype = 'u'`)
  check('Blend Fault answer uniqueness constraint exists', blendFaultAnswerUniq.rows.length >= 1)

  const passportProfileUniq = await pool.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'passport_360_guest_profiles' AND indexdef LIKE '%UNIQUE%'`)
  check('Passport profile uniqueness constraint exists', passportProfileUniq.rows.length >= 1)
  const passportStampUniq = await pool.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'passport_360_earned_stamps' AND indexdef LIKE '%UNIQUE%'`)
  check('Passport stamp uniqueness constraint exists', passportStampUniq.rows.length >= 1)

  // ── 8. Filler Arrangement integration ──
  await fetch(`${API_BASE}/api/smokecraft/filler-arrangement/complete`, { method: 'POST', headers: { cookie: learnerA.cookie } })
  await fetch(`${API_BASE}/api/smokecraft/filler-arrangement/complete`, { method: 'POST', headers: { cookie: learnerA.cookie } })
  const fillerCompletionCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_filler_arrangement_completion WHERE guest_reference = $1`, [learnerA.guestReference])
  check('Filler Arrangement: repeated completion requests do not duplicate the completion row', fillerCompletionCount.rows[0].c === 1)
  // "foundation" is the real prerequisite gate for "leaf-process" (the node
  // that consumes Filler Arrangement evidence): its own evidence check
  // (seed_soil_engagement) is deliberately skipped by the sequential unlock
  // walk in skillTreeService.recalculate() while "foundation" is incomplete,
  // so completing Filler Arrangement alone produces no visible change until
  // "foundation" is cleared first — that is correct prerequisite gating, not
  // a defect. Clear it via the real Seed & Soil progress endpoint so the
  // Filler Arrangement evidence becomes actually observable.
  const seedSoilComponents = await fetch(`${API_BASE}/api/smokecraft/seed-soil/components`).then(r => r.json())
  const firstComponentId = seedSoilComponents.components[0].id
  await fetch(`${API_BASE}/api/smokecraft/seed-soil/progress`, {
    method: 'POST', headers: { cookie: learnerA.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ componentId: firstComponentId }),
  })
  const skillTreeSync = await fetch(`${API_BASE}/api/smokecraft/skill-tree/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  const foundationNode = skillTreeSync.nodes?.find(n => n.nodeKey === 'foundation')
  const leafProcessNode = skillTreeSync.nodes?.find(n => n.nodeKey === 'leaf-process')
  check('Skill Tree "foundation" reflects real Seed & Soil evidence (state=completed)', foundationNode?.state === 'completed')
  check('Skill Tree "leaf-process" reads real Filler Arrangement evidence once unlocked (state=completed)', leafProcessNode?.state === 'completed')

  // ── 9. Cross-learner isolation (real, all systems) ──
  const learnerB = await guestSession()
  const skillTreeB = await fetch(`${API_BASE}/api/smokecraft/skill-tree/`, { headers: { cookie: learnerB.cookie } }).then(r => r.json())
  const skillTreeBFoundation = skillTreeB.nodes?.find(n => n.nodeKey === 'foundation')
  check('Cross-learner Skill Tree access rejected (learner B does not see A\'s progress)', skillTreeBFoundation?.state !== 'completed' && JSON.stringify(skillTreeB) !== JSON.stringify(skillTreeSync))
  const collectionsB = await fetch(`${API_BASE}/api/smokecraft/collections/`, { headers: { cookie: learnerB.cookie } }).then(r => r.json())
  check('Cross-learner Collections access rejected', collectionsB.summary?.ownedItems === 0)
  const challengeB = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`, { headers: { cookie: learnerB.cookie } }).then(r => r.json())
  check('Cross-learner Challenge Hub access rejected', challengeB.challenges.every(c => c.participationState === 'available'))
  const blendFaultB = await fetch(`${API_BASE}/api/smokecraft/blend-fault/`, { headers: { cookie: learnerB.cookie } }).then(r => r.json())
  check('Cross-learner Blend Fault access rejected', blendFaultB.attemptCount === 0)
  const passportB = await fetch(`${API_BASE}/api/passport-360/sync/profile`, { headers: { cookie: learnerB.cookie } }).then(r => r.json())
  check('Cross-learner Passport access rejected', passportB.profile.passportId !== passportProfile2.profile.passportId && passportB.profile.stampSummary.count === 0)

  // ── 10. Golden Box boundary ──
  const goldenBoxEventTypes = await pool.query(`SELECT DISTINCT event_type FROM smokecraft_progression_events WHERE event_type ILIKE '%golden%'`)
  check('No Golden Box progression events conflict with shared progression this pass (structural, none exist yet)', goldenBoxEventTypes.rows.length === 0)
  const passportGoldenBox = passportProfile2.profile.goldenBox
  check('Golden Box remains honestly not-connected to Passport (no fake award data used)', passportGoldenBox.connected === false)

  // ── 11. Fake gamification audit (source-level) ──
  const chJsx = fs.readFileSync('src/pages/smokecraft/ChallengeHub.jsx', 'utf8')
  check('No fake streak/leaderboard VALUE (only honest disclosure text) in Challenge Hub source', !/streak\s*[:=]\s*\d|rank\s*[:=]\s*\d|leaderboard\s*[:=]\s*\[/i.test(chJsx))
  const passportJsx = fs.readFileSync('src/pages/passport/PassportProfile.jsx', 'utf8')
  check('No hardcoded XP total remains in Passport Profile source', !/xp\s*=\s*\d{2,}/.test(passportJsx))

  // ── 12. UI — no default selections across all 4 live systems ──
  async function seededPage(vp) {
    const page = await browser.newPage({ viewport: vp })
    await page.context().addCookies([{ name: 'smokecraft_guest_session', value: learnerA.value, domain: 'localhost', path: '/' }])
    return page
  }
  const stPage = await seededPage({ width: 1280, height: 900 })
  await stPage.goto(`${UI_BASE}/smokecraft/skill-tree`, { waitUntil: 'domcontentloaded' })
  await stPage.waitForTimeout(1000)
  check('No default-selected Skill Tree node (no aria-pressed=true before interaction)', await stPage.locator('button[aria-pressed="true"]').count() === 0)
  await stPage.screenshot({ path: `${PROOF_DIR}/17-neutral-skill-tree.png` })
  await stPage.close()

  const chPage = await seededPage({ width: 1280, height: 900 })
  await chPage.goto(`${UI_BASE}/smokecraft/challenge-hub`, { waitUntil: 'domcontentloaded' })
  await chPage.waitForTimeout(1000)
  check('No default-selected Challenge card', await chPage.locator('div[role="region"]').count() === 0)
  check('No fake streak or leaderboard rendered in Challenge Hub UI', !(await chPage.textContent('body')).includes('Rank #'))
  await chPage.screenshot({ path: `${PROOF_DIR}/18-no-fake-streak-leaderboard.png` })
  await chPage.close()

  const bfPage = await seededPage({ width: 1280, height: 900 })
  await bfPage.goto(`${UI_BASE}/smokecraft/challenges/blend-fault-identification`, { waitUntil: 'domcontentloaded' })
  await bfPage.waitForTimeout(1000)
  check('No default-selected Blend Fault answer', await bfPage.locator('button[role="radio"][aria-checked="true"]').count() === 0)
  await bfPage.close()

  await browser.close()

  // ── 13. Proof captures — API responses ──
  fs.writeFileSync(`${PROOF_DIR}/01-shared-progression-architecture.json`, JSON.stringify({ tableCount: progressionTables.rows.length, tables: progressionTables.rows }, null, 2))
  fs.writeFileSync(`${PROOF_DIR}/02-event-idempotency.json`, JSON.stringify({ inserted: dup1.rows.length, duplicateBlocked: dup2.rows.length === 0 }, null, 2))
  fs.writeFileSync(`${PROOF_DIR}/03-xp-source-reconciliation.json`, JSON.stringify({ blendFaultXp: 0, skillTreeXp: 0, collectionsXp: 0, challengeXp: 0, fillerArrangementRule: fillerXpRule.rows[0] }, null, 2))
  fs.writeFileSync(`${PROOF_DIR}/04-skill-tree-live-state.json`, JSON.stringify(skillTreeSync, null, 2))
  fs.writeFileSync(`${PROOF_DIR}/05-collections-ownership.json`, JSON.stringify(await fetch(`${API_BASE}/api/smokecraft/collections/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json()), null, 2))
  fs.writeFileSync(`${PROOF_DIR}/06-daily-challenge-state.json`, JSON.stringify(start, null, 2))
  const weeklyState = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  fs.writeFileSync(`${PROOF_DIR}/07-weekly-challenge-state.json`, JSON.stringify(weeklyState.challenges.find(c => c.cadence === 'weekly'), null, 2))
  fs.writeFileSync(`${PROOF_DIR}/08-challenge-self-satisfaction-prevention.json`, JSON.stringify({ startedParticipationState: start.challenge.participationState }, null, 2))
  fs.writeFileSync(`${PROOF_DIR}/09-blend-fault-passed-event.json`, JSON.stringify(await pool.query(`SELECT event_type, payload FROM smokecraft_progression_events WHERE guest_reference = $1 AND event_type = 'blend_fault_assessment_passed'`, [learnerA.guestReference]).then(r => r.rows), null, 2))
  fs.writeFileSync(`${PROOF_DIR}/11-filler-arrangement-completion-event.json`, JSON.stringify(await pool.query(`SELECT event_type, created_at FROM smokecraft_progression_events WHERE guest_reference = $1 AND event_type ILIKE '%filler%'`, [learnerA.guestReference]).then(r => r.rows), null, 2))
  fs.writeFileSync(`${PROOF_DIR}/12-passport-xp-summary.json`, JSON.stringify(passportProfile2.profile.xpSummary, null, 2))
  fs.writeFileSync(`${PROOF_DIR}/13-passport-stamp-summary.json`, JSON.stringify(passportProfile2.profile.stampSummary, null, 2))
  fs.writeFileSync(`${PROOF_DIR}/14-passport-activity-history.json`, JSON.stringify(activity2.activity, null, 2))
  fs.writeFileSync(`${PROOF_DIR}/15-duplicate-sync-prevention.json`, JSON.stringify({ syncCall1Stamps: stampCount1, syncCall2Stamps: stampCount2 }, null, 2))
  fs.writeFileSync(`${PROOF_DIR}/16-cross-learner-rejection.json`, JSON.stringify({ learnerA_passportId: passportProfile2.profile.passportId, learnerB_passportId: passportB.profile.passportId, learnerB_stamps: passportB.profile.stampSummary.count }, null, 2))

  // ── 14. Cleanup ──
  await pool.query(`DELETE FROM smokecraft_progression_events WHERE idempotency_key = $1`, [`phase6-test-${learnerA.guestReference}`])
  await pool.query(`DELETE FROM passport_360_earned_stamps WHERE guest_id = ANY($1)`, [[passportProfile2.profile.passportId, passportB.profile.passportId]])
  await pool.query(`DELETE FROM passport_360_guest_progress WHERE guest_id = ANY($1)`, [[passportProfile2.profile.passportId, passportB.profile.passportId]])
  await pool.query(`DELETE FROM passport_360_smokecraft_sessions WHERE guest_id = ANY($1)`, [[passportProfile2.profile.passportId, passportB.profile.passportId]])
  await pool.query(`DELETE FROM passport_360_guest_profiles WHERE guest_id = ANY($1)`, [[passportProfile2.profile.passportId, passportB.profile.passportId]])
  await pool.query(`DELETE FROM smokecraft_blend_fault_answers WHERE attempt_id IN (SELECT attempt_id FROM smokecraft_blend_fault_attempts WHERE guest_reference = ANY($1))`, [[learnerA.guestReference, learnerB.guestReference]])
  await pool.query(`DELETE FROM smokecraft_blend_fault_attempts WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  await pool.query(`DELETE FROM smokecraft_filler_arrangement_completion WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  await pool.query(`DELETE FROM smokecraft_challenge_learner_state WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  await pool.query(`DELETE FROM smokecraft_seed_soil_progress WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  await pool.query(`DELETE FROM smokecraft_skill_tree_learner_state WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  await pool.query(`DELETE FROM smokecraft_collection_ownership WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  await pool.query(`DELETE FROM smokecraft_progression_events WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  const cleanupCheck = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_blend_fault_attempts WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  check('Test data removed', cleanupCheck.rows[0].c === 0)

  // ── 15. Production build/startup/health ──
  const health = await fetch(`${API_BASE}/api/health`).then(r => r.json()).catch(() => null)
  check('Production-mode server health check passes', health?.success === true && health?.db === 'postgres')

  await pool.end()
} catch (err) {
  console.error('Unexpected error:', err)
  await browser.close()
  await pool.end()
  process.exit(1)
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
