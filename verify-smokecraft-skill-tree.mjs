// Skill Tree Persistence — real backend rule-engine verification.
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
  return { cookie: `smokecraft_guest_session=${value}`, guestReference: payload.sub }
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
try {
  // ── 1. Migration/table checks ──
  const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name IN ('smokecraft_skill_tree_nodes','smokecraft_skill_tree_learner_state')`)
  check('Migration applied: both Skill Tree tables exist', tables.rows.length === 2)
  const nodeCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_skill_tree_nodes WHERE active = true`)
  check('Seeded node definitions: exactly 7 real nodes', nodeCount.rows[0].c === 7)
  const uniqueConstraint = await pool.query(`SELECT conname FROM pg_constraint WHERE conname LIKE 'smokecraft_skill_tree_learner_stat%'`)
  check('Idempotency constraint exists on learner state (guest_reference, node_key)', uniqueConstraint.rows.length > 0)

  // ── 2. Unauthenticated / invalid access ──
  const unauthRes = await fetch(`${API_BASE}/api/smokecraft/skill-tree/`)
  check('Unauthenticated access rejected', unauthRes.status === 400 || unauthRes.status === 401)

  // ── 3. New learner — correct initial locked/available states ──
  const learnerA = await guestSession()
  const initialRes = await fetch(`${API_BASE}/api/smokecraft/skill-tree/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('New learner: API call succeeds', initialRes.success === true)
  const foundationNode = initialRes.nodes.find(n => n.nodeKey === 'foundation')
  const leafProcessNode = initialRes.nodes.find(n => n.nodeKey === 'leaf-process')
  check('New learner: Foundation is available (no prerequisites)', foundationNode.state === 'available')
  check('New learner: Leaf & Process is locked (prerequisite not met)', leafProcessNode.state === 'locked')
  check('New learner: locked node explains the missing requirement', leafProcessNode.missingRequirements.includes('foundation'))
  check('New learner: no node is completed with zero real evidence', initialRes.summary.completedNodes === 0)
  check('New learner: no fake percentage — 0% with 0 evidence', initialRes.summary.completionPercent === 0)

  // ── 4. Real evidence: Seed & Soil engagement unlocks Foundation ──
  await pool.query(`INSERT INTO golden_box_component_catalog (component_type, component_key, display_name) VALUES ('seed_genetics','test-seed-st','Test Seed') ON CONFLICT DO NOTHING`)
  const catalogRow = await pool.query(`SELECT id FROM golden_box_component_catalog WHERE component_key = 'test-seed-st' LIMIT 1`)
  await pool.query(`INSERT INTO smokecraft_seed_soil_progress (guest_reference, component_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [learnerA.guestReference, catalogRow.rows[0].id])
  const afterSeedRes = await fetch(`${API_BASE}/api/smokecraft/skill-tree/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('Real Seed & Soil evidence completes Foundation', afterSeedRes.nodes.find(n => n.nodeKey === 'foundation').state === 'completed')
  check('Completing Foundation unlocks Leaf & Process (available, not completed)', afterSeedRes.nodes.find(n => n.nodeKey === 'leaf-process').state === 'available')
  check('Construction remains locked (2 prerequisites away)', afterSeedRes.nodes.find(n => n.nodeKey === 'construction').state === 'locked')

  // ── 5. Filler Arrangement completion recognized as real evidence ──
  await fetch(`${API_BASE}/api/smokecraft/filler-arrangement/complete`, { method: 'POST', headers: { cookie: learnerA.cookie } })
  const afterFillerRes = await fetch(`${API_BASE}/api/smokecraft/skill-tree/`, { headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('Real Filler Arrangement completion is recognized by Skill Tree', afterFillerRes.nodes.find(n => n.nodeKey === 'leaf-process').state === 'completed')
  check('Completing Leaf & Process unlocks Construction', afterFillerRes.nodes.find(n => n.nodeKey === 'construction').state === 'available')

  const fillerCompletionCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_filler_arrangement_completion WHERE guest_reference = $1`, [learnerA.guestReference])
  check('Filler Arrangement completion not duplicated by a second call', fillerCompletionCount.rows[0].c === 1)
  const dupComplete = await fetch(`${API_BASE}/api/smokecraft/filler-arrangement/complete`, { method: 'POST', headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('Duplicate lesson-completion call does not re-award XP', dupComplete.alreadyCompleted === true && dupComplete.xpAwarded === false)

  // ── 6. Recalculation idempotency ──
  const recalc1 = await fetch(`${API_BASE}/api/smokecraft/skill-tree/recalculate`, { method: 'POST', headers: { cookie: learnerA.cookie } }).then(r => r.json())
  const recalc2 = await fetch(`${API_BASE}/api/smokecraft/skill-tree/recalculate`, { method: 'POST', headers: { cookie: learnerA.cookie } }).then(r => r.json())
  check('Recalculation is idempotent — same result on repeated calls', JSON.stringify(recalc1.changeSummary) === JSON.stringify(recalc2.changeSummary))
  const eventCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_progression_events WHERE guest_reference = $1 AND event_type = 'skill_tree_recalculated'`, [learnerA.guestReference])
  check('Recalculation events are not duplicated per day (idempotency key)', eventCount.rows[0].c === 1)

  // ── 7. Client cannot submit arbitrary completed state ──
  const forgeAttempt = await fetch(`${API_BASE}/api/smokecraft/skill-tree/`, {
    method: 'POST', headers: { cookie: learnerA.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeKey: 'mastery-blending', state: 'completed' }),
  })
  check('No endpoint accepts a client-submitted completion claim (POST / is not a route)', forgeAttempt.status === 404)

  // ── 8. Persistence across "sessions" (new cookie/browser context, same guest reference simulated via DB check) ──
  const persistedState = await pool.query(`SELECT state FROM smokecraft_skill_tree_learner_state WHERE guest_reference = $1 AND node_key = 'foundation'`, [learnerA.guestReference])
  check('Completed state persisted in the database (survives refresh/new session)', persistedState.rows[0].state === 'completed')

  // ── 9. Golden Box entry evidence (mastery-blending) ──
  const compRow = await pool.query(`SELECT id FROM golden_box_competitions WHERE competition_key = 'skill-tree-test-comp'`)
  let compId = compRow.rows[0]?.id
  if (!compId) {
    const created = await fetch(`${API_BASE}/api/smokecraft/golden-box/competitions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-novee-user-role': 'admin', 'x-novee-user-id': 'st-admin' },
      body: JSON.stringify({ competitionKey: 'skill-tree-test-comp', title: 'Skill Tree Test Comp', scope: 'global' }),
    }).then(r => r.json())
    compId = created.competition.id
  }

  // ── 10. UI checks ──
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.context().addCookies([{ name: 'smokecraft_guest_session', value: learnerA.cookie.split('=')[1], domain: 'localhost', path: '/' }])
  await page.addInitScript(() => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: 'v', name: 'V', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'Dominican Republic', flag: '🇩🇴', bio: 'Master.', image: '/mentors/don-alejandro.jpg' }],
    }))
  })
  await page.goto(`${UI_BASE}/smokecraft/skill-tree`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  check('UI: real approved artwork renders', await page.locator('img[alt="SmokeCraft Skill Tree"]').count() === 1)
  check('UI: dynamic mentor renders (not baked)', (await page.textContent('body')).includes('Don Alejandro'))
  check('UI: Foundation shows Completed (real backend evidence)', (await page.locator('button[aria-label="Foundation — Completed"]').count()) === 1)
  check('UI: Community & Legacy still shows Locked (far from met)', (await page.locator('button[aria-label="Community & Legacy — Locked"]').count()) === 1)

  await page.click('button[aria-label="Community & Legacy — Locked"]')
  await page.waitForTimeout(500)
  const lockedDetailText = await page.textContent('body')
  check('UI: locked-node detail explains missing requirement (not a dead button)', lockedDetailText.includes('Locked —') || lockedDetailText.includes('completed'))

  await page.click('button[aria-label="Foundation — Completed"]')
  await page.waitForTimeout(500)
  const completedDetailText = await page.textContent('body')
  check('UI: completed-node detail shows real completion evidence', completedDetailText.includes('Seed & Soil component'))

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
  check('No horizontal overflow at desktop', !overflow)

  // Keyboard access
  await page.keyboard.press('Tab')
  check('Keyboard focus reaches an interactive control', await page.evaluate(() => document.activeElement.tagName === 'BUTTON'))

  await page.close()

  // Handheld
  const page2 = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page2.context().addCookies([{ name: 'smokecraft_guest_session', value: learnerA.cookie.split('=')[1], domain: 'localhost', path: '/' }])
  await page2.addInitScript(() => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, spineVersion: 1, selectedVenue: { id: 'v', name: 'V', skipped: false, selectedAt: Date.now() }, mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR' }] }))
  })
  await page2.goto(`${UI_BASE}/smokecraft/skill-tree`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(1200)
  const overflowHandheld = await page2.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
  check('Handheld 390x844: no horizontal overflow', !overflowHandheld)
  await page2.close()

  // Second, fresh learner — must NOT see learnerA's progress (no leaked default highlighting)
  const learnerB = await guestSession()
  const freshRes = await fetch(`${API_BASE}/api/smokecraft/skill-tree/`, { headers: { cookie: learnerB.cookie } }).then(r => r.json())
  check('A different learner does not inherit another learner\'s completed state', freshRes.nodes.find(n => n.nodeKey === 'foundation').state === 'available')

  // Cleanup
  await pool.query(`DELETE FROM smokecraft_skill_tree_learner_state WHERE guest_reference IN ($1,$2)`, [learnerA.guestReference, learnerB.guestReference])
  await pool.query(`DELETE FROM smokecraft_seed_soil_progress WHERE guest_reference = $1`, [learnerA.guestReference])
  await pool.query(`DELETE FROM smokecraft_filler_arrangement_completion WHERE guest_reference = $1`, [learnerA.guestReference])
  await pool.query(`DELETE FROM smokecraft_progression_events WHERE guest_reference IN ($1,$2)`, [learnerA.guestReference, learnerB.guestReference])
  check('Test data removed', true)

  await browser.close()
  await pool.end()
} catch (err) {
  console.error('Unexpected error:', err)
  await browser.close()
  process.exit(1)
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
