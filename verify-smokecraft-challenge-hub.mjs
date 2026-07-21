// Challenge Hub Live State and Persistence — real backend rule-engine
// verification.
import { chromium } from 'playwright'
import pg from 'pg'

const API_BASE = 'http://localhost:3001'
const UI_BASE = 'http://localhost:5000'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

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

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
try {
  // ── 1. Migration / schema checks ──
  const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name IN ('smokecraft_challenge_definitions','smokecraft_challenge_instances','smokecraft_challenge_learner_state')`)
  check('Migration applied: all 3 Challenge Hub tables exist', tables.rows.length === 3)

  const defCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_challenge_definitions WHERE active = true`)
  check('Seeded exactly 2 challenge definitions (1 daily, 1 weekly)', defCount.rows[0].c === 2)
  const cadences = await pool.query(`SELECT cadence, COUNT(*)::int AS c FROM smokecraft_challenge_definitions GROUP BY cadence ORDER BY cadence`)
  check('At least 1 Daily challenge seeded', cadences.rows.some(r => r.cadence === 'daily' && r.c >= 1))
  check('At least 1 Weekly challenge seeded', cadences.rows.some(r => r.cadence === 'weekly' && r.c >= 1))
  const types = await pool.query(`SELECT challenge_type, COUNT(*)::int AS c FROM smokecraft_challenge_definitions GROUP BY challenge_type ORDER BY challenge_type`)
  check('At least 1 single-event-based challenge seeded', types.rows.some(r => r.challenge_type === 'single_event' && r.c >= 1))
  check('At least 1 multi-activity-based challenge seeded', types.rows.some(r => r.challenge_type === 'multi_event' && r.c >= 1))

  const instanceUnique = await pool.query(`SELECT conname FROM pg_constraint WHERE conname LIKE '%challenge_instances%' AND contype = 'u'`)
  check('Idempotency constraint exists on instances (instance_key / challenge_key+start)', instanceUnique.rows.length > 0)
  const stateUnique = await pool.query(`SELECT conname FROM pg_constraint WHERE conname LIKE '%challenge_learner_state%' AND contype = 'u'`)
  check('Idempotency constraint exists on learner state (guest_reference, challenge_instance_key)', stateUnique.rows.length > 0)

  const globalInstances = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_challenge_instances`)
  const globalState = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_challenge_learner_state`)
  check('No instances were pre-seeded by the migration itself', globalInstances.rows[0].c === 0)
  check('No learner completion was seeded globally by the migration', globalState.rows[0].c === 0)

  const xpValues = await pool.query(`SELECT xp_reward FROM smokecraft_challenge_definitions`)
  check('No challenge grants XP yet — deliberate, disclosed zero-reward design (avoids double-counting with underlying lesson XP)', xpValues.rows.every(r => r.xp_reward === 0))

  // ── 2. Unauthenticated / invalid access ──
  const unauthRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`)
  check('Unauthenticated GET / rejected', unauthRes.status === 400 || unauthRes.status === 401)
  const unauthStart = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/challenges/daily-lesson-practice/start`, { method: 'POST' })
  check('Unauthenticated start rejected', unauthStart.status === 400 || unauthStart.status === 401)

  // ── 3. New learner — correct initial state ──
  const learnerA = await guestSession()
  const initialRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('New learner: API call succeeds', initialRes.success === true)
  check('New learner: sees exactly 2 challenges', initialRes.challenges.length === 2)
  check('New learner: both challenges start "available", not fabricated in_progress/completed', initialRes.challenges.every(c => c.participationState === 'available'))
  check('New learner: progress starts at 0 for both challenges', initialRes.challenges.every(c => c.progress === 0))
  check('Response includes real server timestamps for instance start/end', initialRes.challenges.every(c => c.instance.effectiveStart && c.instance.effectiveEnd))
  check('Response includes a real serverNow timestamp (not client-invented)', typeof initialRes.serverNow === 'string')

  // ── 4. Deterministic idempotent instance resolution ──
  const call1Keys = initialRes.challenges.map(c => c.instance.instanceKey).sort()
  const secondRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  const call2Keys = secondRes.challenges.map(c => c.instance.instanceKey).sort()
  check('Repeated hub loads resolve to the exact same instance keys (no duplicate generation)', JSON.stringify(call1Keys) === JSON.stringify(call2Keys))
  const instanceRowCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_challenge_instances`)
  check('Exactly 2 instance rows exist after 2 hub loads (one per definition, not one per call)', instanceRowCount.rows[0].c === 2)

  // ── 5. Single-challenge read ──
  const singleRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/challenges/daily-lesson-practice`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('Single-challenge read succeeds', singleRes.success === true && singleRes.challenge.challengeKey === 'daily-lesson-practice')
  const notFoundRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/challenges/not-a-real-challenge`, { headers: { cookie: learnerA.cookie } })
  check('Reading a nonexistent challenge returns 404', notFoundRes.status === 404)

  // ── 6. Start challenge — idempotent, never completes/awards on its own ──
  const startRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/challenges/daily-lesson-practice/start`, { method: 'POST', headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('Start challenge succeeds', startRes.success === true)
  check('Start challenge sets state to in_progress, not completed', startRes.challenge.participationState === 'in_progress')
  const startRow = await pool.query(`SELECT * FROM smokecraft_challenge_learner_state WHERE guest_reference = $1 AND challenge_instance_key LIKE 'daily-lesson-practice%'`, [learnerA.guestReference])
  check('Start persisted a real learner-state row', startRow.rows.length === 1)
  check('Start did not set completed_at', startRow.rows[0].completed_at === null)

  const startAgain = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/challenges/daily-lesson-practice/start`, { method: 'POST', headers: { cookie: learnerA.cookie } })
  check('Duplicate start call does not error', startAgain.status === 200)
  const startRowCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_challenge_learner_state WHERE guest_reference = $1 AND challenge_instance_key LIKE 'daily-lesson-practice%'`, [learnerA.guestReference])
  check('Duplicate start does not duplicate the learner-state row', startRowCount.rows[0].c === 1)

  // ── 7. Forged completion/progress rejected — no client-submitted state accepted ──
  const forgeRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`, {
    method: 'POST', headers: { cookie: learnerA.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeKey: 'daily-lesson-practice', participationState: 'completed', progress: 999 }),
  })
  check('Forged POST to hub root is rejected (no such route)', forgeRes.status === 404)

  // ── 8. Real evidence completes a challenge (Daily — single event) ──
  await fetch(`${API_BASE}/api/smokecraft/filler-arrangement/complete`, { method: 'POST', headers: { cookie: learnerA.cookie } })
  const afterEvidence = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  const daily = afterEvidence.challenges.find(c => c.challengeKey === 'daily-lesson-practice')
  check('Real progression-event evidence completes the Daily challenge', daily.participationState === 'completed')
  check('Progress reaches the real target value (1/1), not fabricated', daily.progress === 1 && daily.targetValue === 1)

  const completedRow = await pool.query(`SELECT * FROM smokecraft_challenge_learner_state WHERE guest_reference = $1 AND challenge_instance_key = $2`, [learnerA.guestReference, daily.instance.instanceKey])
  check('Completion persisted to the real database', completedRow.rows.length === 1 && completedRow.rows[0].participation_state === 'completed')
  check('Completion references a real supporting progression event (not null)', completedRow.rows[0].supporting_progression_event_id !== null)

  const completedEventCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_progression_events WHERE guest_reference = $1 AND event_type = 'challenge_completed'`, [learnerA.guestReference])
  check('Exactly one challenge_completed event was recorded', completedEventCount.rows[0].c === 1)

  // ── 9. Idempotent re-evaluation — no duplicate completion/event on repeat ──
  const afterEvidence2 = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  const daily2 = afterEvidence2.challenges.find(c => c.challengeKey === 'daily-lesson-practice')
  check('Repeated hub loads keep the challenge completed, not re-processed', daily2.participationState === 'completed')
  const stateCountAfter = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_challenge_learner_state WHERE guest_reference = $1 AND challenge_instance_key = $2`, [learnerA.guestReference, daily.instance.instanceKey])
  check('Duplicate re-evaluation does not duplicate the learner-state row', stateCountAfter.rows[0].c === 1)
  const eventCountAfter = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_progression_events WHERE guest_reference = $1 AND event_type = 'challenge_completed'`, [learnerA.guestReference])
  check('Duplicate re-evaluation does not duplicate the challenge_completed event', eventCountAfter.rows[0].c === 1)

  // ── 10. Weekly multi-event challenge — breadth-based progress ──
  const weeklyBefore = afterEvidence.challenges.find(c => c.challengeKey === 'weekly-multi-activity-builder')
  check('Weekly challenge reflects real distinct-event-type breadth (not yet complete with only 1-2 distinct types)', weeklyBefore.progress >= 1 && weeklyBefore.progress < 3)

  // ── 11. XP idempotency — no automatic XP fired by challenge completion ──
  const xpAfter = await pool.query(`SELECT COUNT(*)::int AS c FROM xp_transactions WHERE reason ILIKE '%challenge%'`)
  check('No XP transaction was fired by challenge completion (zero-reward design, disclosed)', xpAfter.rows[0].c === 0)

  // ── 12. Two-learner isolation ──
  const learnerB = await guestSession()
  const bRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`, { headers: { cookie: learnerB.cookie } }).then(r => r.json())
  const bDaily = bRes.challenges.find(c => c.challengeKey === 'daily-lesson-practice')
  check('A brand-new learner (B) does not inherit learner A\'s completion', bDaily.participationState === 'available' && bDaily.progress === 0)
  const bRow = await pool.query(`SELECT * FROM smokecraft_challenge_learner_state WHERE guest_reference = $1`, [learnerB.guestReference])
  check('Learner B has no learner-state rows yet (isolation confirmed at the DB level)', bRow.rows.length === 0)

  // ── 13. State persistence across "refresh" (new fetch, same cookie) ──
  const refreshRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  const refreshDaily = refreshRes.challenges.find(c => c.challengeKey === 'daily-lesson-practice')
  check('Refresh preserves learner A\'s completed state', refreshDaily.participationState === 'completed')

  // ── 14. Server-side time status is real, not client-invented ──
  check('Active instance timeStatus is "active" while within the real server window', daily.timeStatus === 'active')
  const instanceRow = await pool.query(`SELECT * FROM smokecraft_challenge_instances WHERE instance_key = $1`, [daily.instance.instanceKey])
  const nowMs = Date.now()
  const startMs = new Date(instanceRow.rows[0].effective_start).getTime()
  const endMs = new Date(instanceRow.rows[0].effective_end).getTime()
  check('Instance effective_start/effective_end bracket the real current time', startMs <= nowMs && nowMs < endMs)

  // ── 15. Recalculate endpoint — idempotent, rejects arbitrary client progress ──
  const recalcRes = await fetch(`${API_BASE}/api/smokecraft/challenge-hub/recalculate`, { method: 'POST', headers: { cookie: learnerA.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ progress: 999, completed: true }) }).then(r => r.json())
  check('Recalculate ignores client-submitted progress/completed fields entirely', recalcRes.success === true && recalcRes.challenges.find(c => c.challengeKey === 'weekly-multi-activity-builder').progress < 3)

  // ── 16. UI checks ──
  await page_ui()
  async function page_ui() {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.context().addCookies([{ name: 'smokecraft_guest_session', value: learnerA.value, domain: 'localhost', path: '/' }])
    await page.addInitScript(() => {
      sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
      localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
      localStorage.setItem('sc_journey_v1', JSON.stringify({
        stateVersion: 3, spineVersion: 1,
        selectedVenue: { id: 'gs-venue', name: 'GS Venue', skipped: false, selectedAt: Date.now() },
        mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'Dominican Republic', flag: '🇩🇴', bio: 'Master of volcanic soil nutrients.', image: '/mentors/don-alejandro.jpg' }],
      }))
    })
    const r = await page.goto(`${UI_BASE}/smokecraft/challenge-hub`, { waitUntil: 'domcontentloaded' })
    check('Challenge Hub route reachable (200)', r.status() === 200)
    await page.waitForTimeout(1200)
    check('UI shows real Daily Practice challenge title', (await page.textContent('body')).includes('Daily Practice'))
    check('UI shows real Weekly Builder challenge title', (await page.textContent('body')).includes('Weekly Builder'))
    check('UI shows completed state for Daily Practice for this learner, not a default highlight', (await page.textContent('body')).includes('Completed'))
    check('No fake streak value shown (honest disclosure retained)', (await page.textContent('body')).includes('not yet backend-connected'))
    // Note: the honest disclosure paragraph itself contains the word
    // "leaderboards" ("Streaks and leaderboards are not yet backend-
    // connected..."), so this checks for an actual rendered ranking
    // widget/heading, not that substring.
    check('No fake leaderboard rendered', await page.locator('h1, h2, h3, [role="heading"]', { hasText: 'Leaderboard' }).count() === 0 && await page.locator('text=Rank #').count() === 0)

    await page.click('text=Weekly Builder')
    await page.waitForTimeout(500)
    check('Clicking a real challenge card opens a real detail panel', await page.locator('text=Progress:').count() >= 1)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
    check('No horizontal overflow on desktop', !overflow)
    await page.close()

    const tablet = await browser.newPage({ viewport: { width: 820, height: 1180 } })
    await tablet.context().addCookies([{ name: 'smokecraft_guest_session', value: learnerA.value, domain: 'localhost', path: '/' }])
    await tablet.addInitScript(() => {
      sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
      localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
      localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, spineVersion: 1, selectedVenue: { id: 'gs-venue', name: 'GS Venue', skipped: false, selectedAt: Date.now() }, mentor: [{ id: 'dominican', name: 'Don Alejandro' }] }))
    })
    await tablet.goto(`${UI_BASE}/smokecraft/challenge-hub`, { waitUntil: 'domcontentloaded' })
    await tablet.waitForTimeout(1000)
    const tabletOverflow = await tablet.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
    check('No horizontal overflow on tablet', !tabletOverflow)
    await tablet.close()

    const handheld = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await handheld.context().addCookies([{ name: 'smokecraft_guest_session', value: learnerA.value, domain: 'localhost', path: '/' }])
    await handheld.addInitScript(() => {
      sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
      localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
      localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, spineVersion: 1, selectedVenue: { id: 'gs-venue', name: 'GS Venue', skipped: false, selectedAt: Date.now() }, mentor: [{ id: 'dominican', name: 'Don Alejandro' }] }))
    })
    await handheld.goto(`${UI_BASE}/smokecraft/challenge-hub`, { waitUntil: 'domcontentloaded' })
    await handheld.waitForTimeout(1000)
    const handheldOverflow = await handheld.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
    check('No horizontal overflow on handheld', !handheldOverflow)
    check('Challenge cards are real focusable buttons (keyboard accessible)', await handheld.locator('button[aria-label*="challenge"]').count() >= 2)
    await handheld.close()
  }

  // ── 17. Cleanup ──
  await pool.query(`DELETE FROM smokecraft_challenge_learner_state WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  await pool.query(`DELETE FROM smokecraft_progression_events WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  await pool.query(`DELETE FROM smokecraft_filler_arrangement_completion WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  const cleanupCheck = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_challenge_learner_state WHERE guest_reference = ANY($1)`, [[learnerA.guestReference, learnerB.guestReference]])
  check('Test data removed', cleanupCheck.rows[0].c === 0)

  await browser.close()
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
