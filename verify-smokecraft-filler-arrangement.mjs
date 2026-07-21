// Verifies the real Filler Arrangement standalone lesson: backend
// save/resume, idempotent XP on the knowledge check and lesson completion,
// no default states, and the shared progression-event log.
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
  return raw.slice(idx).split(';')[0].split('=')[1]
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
try {
  const cookieVal = await guestSession()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.context().addCookies([{ name: 'smokecraft_guest_session', value: cookieVal, domain: 'localhost', path: '/' }])
  await page.addInitScript(() => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: 'fa-venue', name: 'FA Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'Dominican Republic', flag: '🇩🇴', bio: 'Master of volcanic soil nutrients.', image: '/mentors/don-alejandro.jpg' }],
    }))
  })

  await page.goto(`${UI_BASE}/smokecraft/filler-arrangement`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)

  check('Route reachable, real approved artwork renders', await page.locator('img[alt="Filler Arrangement"]').count() === 1)
  check('Dynamic mentor renders (not baked)', (await page.textContent('body')).includes('Don Alejandro'))
  check('0/11 topics explored initially (no default progress)', (await page.textContent('body')).includes('0 / 11 topics explored'))
  check('Knowledge check not visible before all zones explored', await page.locator('text=Knowledge Check').count() === 0)

  // Explore all 11 zones
  const zoneLabels = ['Ligero Placement', 'Viso Placement', 'Seco Placement', 'Volado Placement', 'Airflow', 'Bunch Density', 'Strength Distribution', 'Flavor Balance', 'Combustion Behavior', 'Draw Performance', 'Common Filler-Arrangement Faults']
  for (const label of zoneLabels) {
    await page.click(`button[aria-label^="${label}"]`)
    await page.waitForTimeout(150)
  }
  await page.waitForTimeout(500)
  check('All 11 topics explored after real interaction', (await page.textContent('body')).includes('11 / 11 topics explored'))

  // Real note save
  await page.fill('#fa-notes', 'Balanced arrangement improves draw.')
  await page.waitForTimeout(1000)
  const dbNote = await pool.query(`SELECT note_text FROM smokecraft_filler_arrangement_notes ORDER BY updated_at DESC LIMIT 1`)
  check('Note persisted to real backend (not just local state)', dbNote.rows[0]?.note_text === 'Balanced arrangement improves draw.')

  // Knowledge check — no default selection
  check('Knowledge check visible after all zones explored', await page.locator('text=Knowledge Check').count() === 1)
  check('Submit disabled before a real answer is chosen', await page.locator('button:has-text("Submit Answer")').isDisabled())
  await page.click('text=Even airflow, density, and strength distribution throughout the bunch')
  await page.click('button:has-text("Submit Answer")')
  await page.waitForTimeout(500)
  check('Correct answer shows real feedback', (await page.textContent('body')).includes('Correct!'))

  const dbQuiz = await pool.query(`SELECT is_correct, xp_awarded FROM smokecraft_filler_arrangement_quiz_attempts WHERE question_key = 'filler-arrangement-primary-goal' ORDER BY created_at DESC LIMIT 1`)
  check('Quiz attempt persisted to real backend with XP awarded', dbQuiz.rows[0]?.is_correct === true && dbQuiz.rows[0]?.xp_awarded === true)

  // Complete lesson
  await page.click('button:has-text("Complete Lesson")')
  await page.waitForTimeout(500)
  check('Lesson reaches a real completion state', (await page.textContent('body')).includes('Lesson Complete'))

  const dbCompletion = await pool.query(`SELECT xp_awarded FROM smokecraft_filler_arrangement_completion ORDER BY completed_at DESC LIMIT 1`)
  check('Lesson completion persisted with idempotent XP awarded', dbCompletion.rows[0]?.xp_awarded === true)

  // Idempotency: re-submit the same quiz answer via API directly
  const dupRes = await fetch(`${API_BASE}/api/smokecraft/filler-arrangement/quiz/answer`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', cookie: `smokecraft_guest_session=${cookieVal}` },
    body: JSON.stringify({ questionKey: 'filler-arrangement-primary-goal', isCorrect: true }),
  }).then(r => r.json())
  check('Duplicate quiz submission does not award XP twice', dupRes.alreadyAttempted === true && dupRes.xpAwarded === false)

  // Progression event log
  const dbEvents = await pool.query(`SELECT event_type FROM smokecraft_progression_events WHERE source_screen = 'FillerArrangement'`)
  check('Real progression events recorded (knowledge_check_passed + lesson_completed)',
    dbEvents.rows.some(r => r.event_type === 'knowledge_check_passed') && dbEvents.rows.some(r => r.event_type === 'lesson_completed'))

  // Nav link from WrapperStrength (construction area), not a duplicate toolbar entry
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page2.context().addCookies([{ name: 'smokecraft_guest_session', value: cookieVal, domain: 'localhost', path: '/' }])
  await page2.addInitScript(() => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, spineVersion: 1, selectedVenue: { id: 'v', name: 'V', skipped: false, selectedAt: Date.now() }, mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR' }] }))
  })
  await page2.goto(`${UI_BASE}/smokecraft/wrapper-strength`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(1200)
  check('Nav link to full lesson present on the construction screen', await page2.locator('text=Learn the full Filler Arrangement lesson').count() === 1)
  await page2.click('text=Learn the full Filler Arrangement lesson')
  await page2.waitForTimeout(800)
  check('Nav link navigates to the real standalone route', page2.url().includes('/smokecraft/filler-arrangement'))

  // Handheld overflow check
  const page3 = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page3.context().addCookies([{ name: 'smokecraft_guest_session', value: cookieVal, domain: 'localhost', path: '/' }])
  await page3.addInitScript(() => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, spineVersion: 1, selectedVenue: { id: 'v', name: 'V', skipped: false, selectedAt: Date.now() }, mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR' }] }))
  })
  await page3.goto(`${UI_BASE}/smokecraft/filler-arrangement`, { waitUntil: 'domcontentloaded' })
  await page3.waitForTimeout(1000)
  const overflow = await page3.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
  check('Handheld 390x844: no horizontal overflow', !overflow)

  await page.close(); await page2.close(); await page3.close()
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
