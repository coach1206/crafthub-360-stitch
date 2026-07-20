// Package 6: Cigar Anatomy, Vitola/Ring Gauge, Strength vs. Body,
// Burn/Draw Troubleshooting, Flavor Wheel, Pairing Builder (vitola route).
import { chromium } from 'playwright'
import pg from 'pg'
import fs from 'fs'

const API_BASE = 'http://localhost:3001'
const UI_BASE = 'http://localhost:5000'
const DATABASE_URL = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString: DATABASE_URL })
const PROOF_DIR = 'public/proof/smokecraft-package-6'
fs.mkdirSync(PROOF_DIR, { recursive: true })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}
async function overflowCheck(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
}
async function seedJourney(page, venueTag, withMentor = true) {
  await page.goto(`${UI_BASE}/smokecraft/venue-select`)
  await page.evaluate(({ venueTag, withMentor }) => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: venueTag, name: 'Package 6 Venue', skipped: false, selectedAt: Date.now() },
      mentor: withMentor ? [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }] : null,
    }))
  }, { venueTag, withMentor })
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

try {
  // ── DB: new content real and substantive ──
  const anatomyCount = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type='cigar_anatomy'`)
  check('DB: 5 cigar_anatomy records seeded', anatomyCount.rows[0].c === 5)
  const troubleCount = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type='burn_troubleshooting'`)
  check('DB: 5 burn_troubleshooting records seeded', troubleCount.rows[0].c === 5)
  const shallow = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type IN ('cigar_anatomy','burn_troubleshooting') AND length(why_it_matters) < 20`)
  check('DB: every new record has substantive text', shallow.rows[0].c === 0)
  const pkg6QuizCount = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_quiz_questions WHERE question_key IN ('quiz-cap-purpose','quiz-ring-gauge-measurement','quiz-tunneling-cause')`)
  check('DB: 3 new Package 6 quiz questions exist, tied to real components', pkg6QuizCount.rows[0].c === 3)

  // ── BROWSER: main journey ──
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(page, 'pkg6-main', true)
  await page.goto(`${UI_BASE}/smokecraft/vitola`)
  await page.waitForTimeout(1500)
  check('UI: vitola route now renders a real screen (no longer ComingSoon)', !(await page.textContent('body')).includes('Coming Soon'))
  check('UI: no horizontal overflow on load', !(await overflowCheck(page)))
  check('UI: mentor guidance shows the real selected mentor', (await page.textContent('body')).includes('Don Alejandro'))

  // Cigar anatomy — no default selection, real content
  const anatomyChips = await page.locator('button[aria-label*="Head"], button[aria-label*="Cap"], button[aria-label*="Shoulder"], button[aria-label*="Body (Barrel)"], button[aria-label*="Foot"]').count()
  check('UI: cigar anatomy chips render with real catalog data', anatomyChips >= 5)
  // Scoped to actual content chips (anatomy/vitola/ring-gauge/sensory/
  // troubleshooting/flavor-note selections) — excludes the Flavor Wheel's
  // stage tab (an intentional default view, "Cold Aroma", not a content
  // selection) and the pairing-strategy toggle (unset until the learner
  // picks one, correctly not aria-pressed=true for either option yet).
  const preselected = await page.locator('button[aria-label$=" (selected)"], button[aria-pressed="true"][aria-label*="flavor note"]').count()
  check('UI: no default/preselected content chip or flavor note anywhere on load', preselected === 0)

  await page.click('button[aria-label="Cap"]')
  await page.waitForTimeout(300)
  check('UI: anatomy chip selects only after interaction', await page.locator('button[aria-label="Cap (selected)"]').count() === 1)

  await page.click('button[aria-label="Learn more about Cap"]')
  await page.waitForTimeout(600)
  const dialogText = await page.textContent('[role="dialog"]')
  check('UI: educational panel shows real, substantive Cap content', dialogText.includes('Cap') && dialogText.length > 150)
  await page.click('button[aria-label="Close educational detail"]')
  await page.waitForTimeout(300)

  const capRow = await pool.query(`SELECT id FROM golden_box_component_catalog WHERE component_type='cigar_anatomy' AND component_key='cap'`)
  const progressRow = await pool.query(`SELECT * FROM smokecraft_seed_soil_progress WHERE component_id = $1`, [capRow.rows[0].id])
  check('DB: viewing anatomy content recorded server-side progress (shared generic table)', progressRow.rows.length >= 1)

  await page.screenshot({ path: `${PROOF_DIR}/01-cigar-anatomy.png` })

  // Vitola / ring gauge / strength-body / burn troubleshooting sections real
  check('UI: vitola section shows real shapes', (await page.textContent('body')).includes('Robusto') || (await page.textContent('body')).includes('Corona'))
  check('UI: ring gauge section shows real explainer content', (await page.textContent('body')).includes('Ring Gauge'))
  check('UI: strength vs body section shows real sensory categories', (await page.textContent('body')).includes('Strength') && (await page.textContent('body')).includes('Body'))
  check('UI: burn troubleshooting shows real issues', (await page.textContent('body')).includes('Canoeing') && (await page.textContent('body')).includes('Tunneling'))

  // Flavor Wheel — no default note, tactile select, stage switch, persistence
  check('UI: Flavor Wheel renders with real taxonomy', (await page.textContent('body')).includes('Complete Flavor Wheel'))
  const noteButtons = page.locator('button[aria-label*="flavor note"]')
  const preselectedNotes = await page.locator('button[aria-pressed="true"][aria-label*="flavor note"]').count()
  check('UI: no default flavor note selected', preselectedNotes === 0)

  await page.click('button[aria-pressed="false"][aria-label="Earth flavor note"]')
  await page.waitForTimeout(1200)
  const stageRow = await pool.query(`SELECT flavor_notes FROM smokecraft_flavor_stage_observations WHERE stage='cold_aroma' ORDER BY updated_at DESC LIMIT 1`)
  check('DB: flavor note selection persisted server-side for the correct stage', (stageRow.rows[0]?.flavor_notes || []).includes('earth'))

  await page.click('button[aria-pressed="false"]:has-text("First Third")')
  await page.waitForTimeout(500)
  const firstThirdNotes = await page.locator('button[aria-pressed="true"][aria-label*="flavor note"]').count()
  check('UI: switching stage shows a fresh (empty) note set, not carried over from another stage', firstThirdNotes === 0)

  await page.click('button[aria-pressed="false"]:has-text("Cold Aroma")')
  await page.waitForTimeout(600)
  const backToColdAromaNotes = await page.locator('button[aria-pressed="true"][aria-label*="flavor note"]').count()
  check('UI: returning to a stage rehydrates its own saved notes', backToColdAromaNotes >= 1)
  await page.screenshot({ path: `${PROOF_DIR}/02-flavor-wheel.png` })

  // Pairing Builder — save, resume, XP
  await page.selectOption('select[aria-label="Pairing category"]', 'coffee')
  await page.fill('input[aria-label="Specific pairing item"]', 'Dark roast espresso')
  await page.click('button[aria-pressed="false"]:has-text("Complement")')
  await page.fill('textarea[aria-label="Pairing reasoning"]', 'Both have roasted, bittersweet notes that reinforce each other.')
  await page.click('text=Save Pairing Draft')
  await page.waitForTimeout(1000)
  check('UI: pairing draft save gives XP feedback', (await page.textContent('body')).includes('Saved (+15 XP)'))

  const draftRow = await pool.query(`SELECT * FROM smokecraft_pairing_drafts ORDER BY updated_at DESC LIMIT 1`)
  check('DB: pairing draft persisted server-side', draftRow.rows[0]?.pairing_category === 'coffee' && draftRow.rows[0]?.pairing_item === 'Dark roast espresso')
  await page.screenshot({ path: `${PROOF_DIR}/03-pairing-builder.png` })

  // Duplicate-save idempotency, same identity, no reload in between (the
  // correct methodology — a reload can rotate the test's guest cookie in
  // this sandbox, which would make a real idempotency pass look like a
  // failure for an unrelated reason. See 01-PREEXISTING-TEST-GATE-REVIEW.md
  // for the established isolation-artifact class this session has hit
  // repeatedly with rate limiting; this is the same category of test
  // environment nuance, not a server code path.)
  await page.selectOption('select[aria-label="Pairing category"]', 'dessert')
  await page.click('text=Save Pairing Draft')
  await page.waitForTimeout(1000)
  check('UI: second distinct draft save (same identity, no reload) does not re-claim first-save XP message', (await page.locator('text=Saved (+15 XP)').count()) === 0)
  // Scoped to this test run's own guest identity (via its 2 saved
  // drafts) — a global, unscoped count would double-count XP rows from
  // any earlier run of this same suite against a reused database.
  const xpRows = await pool.query(`
    SELECT COUNT(*)::int AS c FROM xp_transactions xt
    JOIN xp_accounts xa ON xa.id = xt.xp_account_id
    WHERE xt.award_rule_key='pairing_draft_saved'
      AND xa.guest_reference = (SELECT guest_reference FROM smokecraft_pairing_drafts ORDER BY updated_at DESC LIMIT 1)
  `)
  check('DB: pairing-draft XP awarded exactly once (idempotent across multiple drafts, same identity)', xpRows.rows[0].c === 1)

  await page.reload()
  await page.waitForTimeout(1500)
  check('UI: pairing drafts resume/list after reload', (await page.textContent('body')).includes('Saved Drafts (2)'))

  // Knowledge check
  const quizVisible = await page.locator('text=Knowledge Check').count()
  check('UI: knowledge check widget renders with a real question', quizVisible >= 1)
  if (quizVisible) {
    await page.click('input[name="vitola-quiz"] >> nth=1')
    // Package 6 closure added a second "Submit Answer" button (Smoking
    // Technique's own quiz) — scope to the one enabled by this radio group.
    await page.click('button:has-text("Submit Answer"):not([disabled])')
    await page.waitForTimeout(1000)
    const resultText = await page.textContent('body')
    check('UI: knowledge check gives real feedback', resultText.includes('Correct!') || resultText.includes('Not quite'))
    await page.screenshot({ path: `${PROOF_DIR}/04-knowledge-check.png` })
  }

  await page.close()

  // ── Unassigned mentor honest state ──
  const noMentorPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(noMentorPage, 'pkg6-no-mentor', false)
  await noMentorPage.goto(`${UI_BASE}/smokecraft/vitola`)
  await noMentorPage.waitForTimeout(1200)
  check('UI: honest unassigned-mentor state shown when no mentor selected', (await noMentorPage.textContent('body')).includes('No mentor selected yet'))
  await noMentorPage.close()

  // ── Ownership: a different guest cannot see guest A's pairing drafts or flavor stages ──
  const guestBPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(guestBPage, 'pkg6-guest-b', true)
  await guestBPage.goto(`${UI_BASE}/smokecraft/vitola`)
  await guestBPage.waitForTimeout(1500)
  check('Ownership: a different guest sees no saved pairing drafts', !(await guestBPage.textContent('body')).includes('Saved Drafts'))
  const bNotes = await guestBPage.locator('button[aria-pressed="true"][aria-label*="flavor note"]').count()
  check('Ownership: a different guest sees no carried-over flavor notes', bNotes === 0)
  await guestBPage.close()

  // ── Keyboard accessibility ──
  const kbPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(kbPage, 'pkg6-kb', true)
  await kbPage.goto(`${UI_BASE}/smokecraft/vitola`)
  await kbPage.waitForTimeout(1500)
  await kbPage.locator('button[aria-label="Head"]').focus()
  await kbPage.keyboard.press('Enter')
  await kbPage.waitForTimeout(300)
  check('Keyboard: Enter selects a focused cigar-anatomy chip', await kbPage.locator('button[aria-label="Head (selected)"]').count() === 1)
  await kbPage.close()

  // ── Golden Box connection unaffected (regression spot-check) ──
  const vitolaCatalogCount = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type='vitola' AND visibility='published'`)
  check('DB: vitola catalog rows remain selectable-ready for Golden Box (unaffected)', vitolaCatalogCount.rows[0].c >= 1)

  await browser.close()

  // ── Cleanup ──
  await pool.query(`DELETE FROM smokecraft_pairing_drafts`)
  await pool.query(`DELETE FROM smokecraft_flavor_stage_observations`)
  await pool.query(`DELETE FROM smokecraft_seed_soil_progress WHERE component_id = $1`, [capRow.rows[0].id])
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
fs.writeFileSync(`${PROOF_DIR}/package-6-results.json`, JSON.stringify(results, null, 2))
if (failed.length) process.exit(1)
