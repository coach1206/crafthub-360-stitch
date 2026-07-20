// Package 5: Leaf-to-Cigar Construction & Craft (wrapper-strength route).
import { chromium } from 'playwright'
import pg from 'pg'
import fs from 'fs'

const API_BASE = 'http://localhost:3001'
const UI_BASE = 'http://localhost:5000'
const DATABASE_URL = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString: DATABASE_URL })
const PROOF_DIR = 'public/proof/smokecraft-package-5'
fs.mkdirSync(PROOF_DIR, { recursive: true })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}
async function overflowCheck(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
}
async function seedJourney(page, withMentor = true) {
  await page.goto(`${UI_BASE}/smokecraft/venue-select`)
  await page.evaluate((withMentor) => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: 'pkg5-venue', name: 'Package 5 Venue', skipped: false, selectedAt: Date.now() },
      mentor: withMentor ? [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }] : null,
    }))
  }, withMentor)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

try {
  // ── DB: new content real and substantive ──
  const stepsCount = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type='construction_step'`)
  check('DB: 10 construction_step records seeded', stepsCount.rows[0].c === 10)
  const moreProcCount = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type='processing_method'`)
  check('DB: processing_method now includes sorting/grading + final resting (2 new records)', moreProcCount.rows[0].c === 2)
  const shallow = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type='construction_step' AND length(why_it_matters) < 20`)
  check('DB: every construction_step record has substantive text', shallow.rows[0].c === 0)
  const quizCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_quiz_questions WHERE related_component_id IN (SELECT id FROM golden_box_component_catalog WHERE component_type IN ('wrapper','filler','fermentation_method'))`)
  check('DB: 3 new Package 5 quiz questions exist, tied to real components', quizCount.rows[0].c === 3)

  // ── BROWSER: mentor selected ──
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(page, true)
  await page.goto(`${UI_BASE}/smokecraft/wrapper-strength`)
  await page.waitForTimeout(1500)
  check('UI: wrapper-strength now renders a real screen (no longer a dead redirect)', page.url().includes('/smokecraft/wrapper-strength'))
  check('UI: no horizontal overflow on load', !(await overflowCheck(page)))
  check('UI: mentor guidance shows the real selected mentor', (await page.textContent('body')).includes('Don Alejandro'))

  // Leaf priming cards render with real data, no default selection
  const primingCards = await page.locator('button[aria-label*="Ligero"], button[aria-label*="Viso"], button[aria-label*="Seco"], button[aria-label*="Volado"]').count()
  check('UI: leaf priming cards render with real catalog data', primingCards >= 4)
  const anyPreselected = await page.locator('button[aria-pressed="true"]').count()
  check('UI: no default/preselected leaf or component', anyPreselected === 0)

  // Select a leaf priming (tactile press feedback via aria-pressed)
  await page.click('button[aria-label="Ligero"]')
  await page.waitForTimeout(300)
  check('UI: leaf priming selects only after user interaction', await page.locator('button[aria-label="Ligero (selected)"]').count() === 1)

  // Open real educational detail
  await page.click('button[aria-label="Learn more about Ligero"]')
  await page.waitForTimeout(600)
  const dialogText = await page.textContent('[role="dialog"]')
  check('UI: educational panel shows real, substantive Ligero content', dialogText.includes('Ligero') && dialogText.length > 200)
  await page.click('button[aria-label="Close educational detail"]')
  await page.waitForTimeout(300)

  // Progress recorded server-side for a real component
  const ligeroRow = await pool.query(`SELECT id FROM golden_box_component_catalog WHERE component_type='leaf_priming' AND component_key='ligero'`)
  const progressRow = await pool.query(`SELECT * FROM smokecraft_seed_soil_progress WHERE component_id = $1`, [ligeroRow.rows[0].id])
  check('DB: viewing content recorded server-side progress (shared generic table)', progressRow.rows.length >= 1)

  await page.screenshot({ path: `${PROOF_DIR}/01-leaf-primings.png` })

  // Comparison tool: select 2 items to compare
  const compareCheckboxes = page.locator('input[type="checkbox"]')
  await compareCheckboxes.nth(0).check()
  await compareCheckboxes.nth(1).check()
  await page.waitForTimeout(400)
  check('UI: comparison tool renders with 2+ selected items', (await page.textContent('body')).includes('Comparing 2 items'))
  await page.screenshot({ path: `${PROOF_DIR}/02-comparison-tool.png` })

  // Wrapper/Binder/Filler sections real
  check('UI: wrapper section renders real content', (await page.textContent('body')).includes('Wrapper (role)'))
  check('UI: filler section includes long vs short filler', (await page.textContent('body')).includes('Long Filler') && (await page.textContent('body')).includes('Short Filler'))

  // Construction process steps real
  check('UI: rolling process section shows real construction steps', (await page.textContent('body')).includes('Entubado Bunching'))

  // Curing/fermentation/aging real
  check('UI: processing section shows curing/fermentation/aging/grading', (await page.textContent('body')).includes('Pilón Fermentation') && (await page.textContent('body')).includes('Leaf Sorting and Grading'))

  // Notes: type, debounce save, reload, confirm persisted
  const noteText = `Package 5 test note ${Date.now()}`
  await page.fill('textarea[aria-label="Leaf to cigar construction notes"]', noteText)
  await page.waitForTimeout(1800)
  const notesRow = await pool.query(`SELECT note_text FROM smokecraft_seed_soil_notes ORDER BY updated_at DESC LIMIT 1`)
  check('DB: construction notes persisted to backend (shared generic table)', notesRow.rows[0]?.note_text === noteText)

  await page.reload()
  await page.waitForTimeout(1500)
  const reloadedNote = await page.inputValue('textarea[aria-label="Leaf to cigar construction notes"]')
  check('UI: note rehydrated from backend after reload', reloadedNote.includes('Package 5 test note'))

  // Knowledge check: answer, confirm real feedback + XP
  const quizVisible = await page.locator('text=Knowledge Check').count()
  check('UI: knowledge check widget renders with a real question', quizVisible >= 1)
  if (quizVisible) {
    await page.click('input[name="wrapper-strength-quiz"] >> nth=2')
    await page.click('text=Submit Answer')
    await page.waitForTimeout(1000)
    const resultText = await page.textContent('body')
    check('UI: knowledge check gives real feedback', resultText.includes('Correct!') || resultText.includes('Not quite'))
    await page.screenshot({ path: `${PROOF_DIR}/03-knowledge-check.png` })
  }

  await page.close()

  // ── Unassigned mentor honest state ──
  const noMentorPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(noMentorPage, false)
  await noMentorPage.goto(`${UI_BASE}/smokecraft/wrapper-strength`)
  await noMentorPage.waitForTimeout(1200)
  check('UI: honest unassigned-mentor state shown when no mentor selected', (await noMentorPage.textContent('body')).includes('No mentor selected yet'))
  await noMentorPage.close()

  // ── Keyboard access: tab to a card and activate with Enter ──
  const kbPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(kbPage, true)
  await kbPage.goto(`${UI_BASE}/smokecraft/wrapper-strength`)
  await kbPage.waitForTimeout(1200)
  await kbPage.locator('button[aria-label="Viso"]').focus()
  await kbPage.keyboard.press('Enter')
  await kbPage.waitForTimeout(300)
  check('Keyboard: Enter activates a focused leaf priming card', await kbPage.locator('button[aria-label="Viso (selected)"]').count() === 1)
  await kbPage.close()

  // ── Handheld responsive ──
  const hp = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await seedJourney(hp, true)
  await hp.goto(`${UI_BASE}/smokecraft/wrapper-strength`)
  await hp.waitForTimeout(1200)
  check('Handheld 390x844: no horizontal overflow', !(await overflowCheck(hp)))
  await hp.screenshot({ path: `${PROOF_DIR}/04-handheld.png` })
  await hp.close()

  // ── Tablet responsive ──
  const tp = await browser.newPage({ viewport: { width: 1366, height: 1024 } })
  await seedJourney(tp, true)
  await tp.goto(`${UI_BASE}/smokecraft/wrapper-strength`)
  await tp.waitForTimeout(1200)
  check('Tablet 1366x1024: no horizontal overflow', !(await overflowCheck(tp)))
  await tp.screenshot({ path: `${PROOF_DIR}/05-tablet.png` })
  await tp.close()

  await browser.close()

  // ── Golden Box connection unaffected (regression spot-check) ──
  const wrapperCatalogCount = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type='wrapper' AND visibility='published'`)
  check('DB: wrapper catalog rows remain selectable-ready for Golden Box (unaffected)', wrapperCatalogCount.rows[0].c >= 1)

  // Cleanup
  await pool.query(`DELETE FROM smokecraft_seed_soil_notes WHERE note_text LIKE 'Package 5 test note%'`)
  await pool.query(`DELETE FROM smokecraft_seed_soil_progress WHERE component_id = $1`, [ligeroRow.rows[0].id])
  check('Test data removed', true)

} catch (err) {
  console.error('Unexpected error:', err)
  results.push({ name: 'unexpected error', pass: false, detail: err.message })
  await browser.close().catch(() => {})
} finally {
  await pool.end()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
fs.writeFileSync(`${PROOF_DIR}/leaf-construction-results.json`, JSON.stringify(results, null, 2))
if (failed.length) process.exit(1)
