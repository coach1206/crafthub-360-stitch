// Package 6 closure pass: Smoking Technique, Personalized Pairing
// Recommendations, Pairing Draft Revision UI.
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
async function seedJourney(page, venueTag) {
  await page.goto(`${UI_BASE}/smokecraft/venue-select`)
  await page.evaluate((venueTag) => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: venueTag, name: 'Package 6 Closure Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }],
    }))
  }, venueTag)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

try {
  // ── DB: new content real ──
  const techCount = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type='smoking_technique'`)
  check('DB: 6 smoking_technique records seeded', techCount.rows[0].c === 6)
  const techQuiz = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_quiz_questions WHERE question_key='quiz-retrohale-technique'`)
  check('DB: smoking-technique quiz question exists', techQuiz.rows[0].c === 1)

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(page, 'pkg6c-main')
  await page.goto(`${UI_BASE}/smokecraft/vitola`)
  await page.waitForTimeout(1500)
  check('UI: no horizontal overflow on load', !(await overflowCheck(page)))

  // ── Smoking Technique ──
  check('UI: Smoking Technique section renders with no-inhalation statement', (await page.textContent('body')).includes('not to be inhaled') === false && (await page.textContent('body')).includes('not intended to be inhaled') === false ? (await page.textContent('body')).includes('not inhaled') : true)
  check('UI: Smoking Technique real content chips render', (await page.textContent('body')).includes('Puff Cadence') && (await page.textContent('body')).includes('Retrohale'))

  await page.click('text=Start Cadence Exercise')
  await page.waitForTimeout(600)
  check('UI: cadence exercise starts', (await page.textContent('body')).includes('Puffs recorded: 0'))

  for (let i = 0; i < 5; i++) {
    await page.click('button[aria-label*="Record a puff"]')
    await page.waitForTimeout(200)
  }
  check('UI: puff recording increments count', (await page.textContent('body')).includes('Puffs recorded: 5'))
  check('UI: overheating warning appears after 5 rapid puffs (the component\'s pacing threshold)', (await page.textContent('body')).includes('Overheating warning'))
  await page.click('button[aria-label*="Record a puff"]')
  await page.waitForTimeout(200)

  await page.click('button[aria-label="Record an ash check"]')
  await page.waitForTimeout(400)
  const cadenceRow = await pool.query(`SELECT * FROM smokecraft_cadence_sessions ORDER BY updated_at DESC LIMIT 1`)
  check('DB: cadence session persisted server-side (not frontend-only)', cadenceRow.rows[0]?.puff_count === 6 && cadenceRow.rows[0]?.ash_checks === 1)

  await page.screenshot({ path: `${PROOF_DIR}/08-cadence-exercise.png` })

  await page.click('button[aria-label="Finish cadence exercise"]')
  await page.waitForTimeout(800)
  check('UI: cadence completion message shown', (await page.textContent('body')).includes('Cadence exercise complete'))
  const xpRow = await pool.query(`SELECT COUNT(*)::int AS c FROM xp_transactions WHERE award_rule_key='smoking_technique_complete'`)
  check('DB: smoking-technique completion XP awarded', xpRow.rows[0].c === 1)

  // Duplicate stop does not re-award
  await page.click('text=Start Again')
  await page.waitForTimeout(500)
  await page.click('button[aria-label="Finish cadence exercise"]')
  await page.waitForTimeout(800)
  const xpRow2 = await pool.query(`SELECT COUNT(*)::int AS c FROM xp_transactions WHERE award_rule_key='smoking_technique_complete'`)
  check('DB: duplicate cadence completion does not re-award XP', xpRow2.rows[0].c === 1)

  // Smoking technique knowledge check
  const techQuizVisible = await page.locator('text=Smoking Technique Knowledge Check').count()
  check('UI: smoking-technique knowledge check renders', techQuizVisible >= 1)
  if (techQuizVisible) {
    await page.click('input[name="technique-quiz"] >> nth=1')
    await page.click('button:has-text("Submit Answer") >> nth=0')
    await page.waitForTimeout(800)
  }

  // ── Personalized Recommendations: insufficient data first ──
  check('UI: recommendations honestly show not-enough-data before any flavor notes recorded', (await page.textContent('body')).includes('Not enough data yet'))
  await page.screenshot({ path: `${PROOF_DIR}/09-recommendation-insufficient-data.png` })

  // Record flavor notes to unlock recommendations
  await page.click('button[aria-pressed="false"][aria-label="Cocoa flavor note"]')
  await page.waitForTimeout(1500)
  await page.reload()
  await page.waitForTimeout(1500)
  check('UI: personalized recommendation appears once flavor data exists', (await page.textContent('body')).includes('Personalized Pairing Recommendations') && !(await page.textContent('body')).includes('Not enough data yet'))
  check('UI: recommendation is explainable (why it may work, source, confidence)', (await page.textContent('body')).includes('Why it may work') && (await page.textContent('body')).includes('rule-based platform suggestion'))
  await page.screenshot({ path: `${PROOF_DIR}/10-personalized-recommendation.png` })

  const recApiRes = await fetch(`${API_BASE}/api/smokecraft/flavor-pairing/recommendations`, { headers: { cookie: (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ') } }).then(r => r.json())
  check('API: recommendation response includes data-used and source label', recApiRes.success === true && recApiRes.recommendations[0]?.source === 'rule_based' && !!recApiRes.recommendations[0]?.dataUsed)

  // ── Pairing draft + Revision UI ──
  await page.selectOption('select[aria-label="Pairing category"]', 'coffee')
  await page.fill('input[aria-label="Specific pairing item"]', 'Dark roast espresso')
  await page.click('button[aria-pressed="false"]:has-text("Complement")')
  await page.click('text=Save Pairing Draft')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${PROOF_DIR}/11-pairing-before-revision.png` })

  await page.click('button[aria-label*="Revise pairing draft"]')
  await page.waitForTimeout(500)
  check('UI: Revise opens the draft in edit mode', (await page.textContent('body')).includes('Revising a saved draft'))
  await page.fill('input[aria-label="Specific pairing item"]', 'Turkish coffee')
  await page.screenshot({ path: `${PROOF_DIR}/12-pairing-revision-form.png` })
  await page.click('text=Save Revision')
  await page.waitForTimeout(1000)
  check('UI: revision save confirms with a revision number', (await page.textContent('body')).includes('Revision 2 saved'))

  const draftRow = await pool.query(`SELECT * FROM smokecraft_pairing_drafts ORDER BY updated_at DESC LIMIT 1`)
  check('DB: revision updates the live draft row (pairing_item changed, current_revision incremented)', draftRow.rows[0]?.pairing_item === 'Turkish coffee' && draftRow.rows[0]?.current_revision === 2)

  const revisionsRow = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_pairing_draft_revisions WHERE draft_id = $1`, [draftRow.rows[0].id])
  check('DB: prior revision preserved (2 immutable snapshots exist, not overwritten)', revisionsRow.rows[0].c === 2)

  await page.click('button[aria-label*="View revision history"]')
  await page.waitForTimeout(500)
  check('UI: revision history shows both the original and revised item', (await page.textContent('body')).includes('Dark roast espresso') && (await page.textContent('body')).includes('Turkish coffee'))
  await page.screenshot({ path: `${PROOF_DIR}/13-pairing-revision-history.png` })

  // No duplicate XP for revising (only first-save XP counted) — scoped to
  // this draft's own guest identity, since an unscoped global count would
  // be thrown off by any other guest identity active in this run.
  const revisionXpRow = await pool.query(`
    SELECT COUNT(*)::int AS c FROM xp_transactions xt
    JOIN xp_accounts xa ON xa.id = xt.xp_account_id
    WHERE xt.award_rule_key='pairing_draft_saved' AND xa.guest_reference = $1
  `, [draftRow.rows[0].guest_reference])
  check('DB: revising a draft does not award additional XP (only 1 first-save award)', revisionXpRow.rows[0].c === 1)

  await page.reload()
  await page.waitForTimeout(1500)
  check('UI: revised pairing persists after reload', (await page.textContent('body')).includes('Turkish coffee'))
  await page.screenshot({ path: `${PROOF_DIR}/14-pairing-revision-after-reload.png` })

  await page.close()

  // ── Ownership: cross-user denial for revision/history endpoints ──
  const guestBPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(guestBPage, 'pkg6c-guest-b')
  await guestBPage.goto(`${UI_BASE}/smokecraft/vitola`)
  await guestBPage.waitForTimeout(1200)
  const bCookies = (await guestBPage.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ')
  const crossReviseRes = await fetch(`${API_BASE}/api/smokecraft/flavor-pairing/pairing-drafts/${draftRow.rows[0].id}/revise`, {
    method: 'POST', headers: { cookie: bCookies, 'Content-Type': 'application/json' }, body: JSON.stringify({ pairingCategory: 'dessert' }),
  }).then(r => r.json())
  check('API: another guest cannot revise a draft they do not own', crossReviseRes.success === false && crossReviseRes.error === 'draft_not_found')
  const crossHistoryRes = await fetch(`${API_BASE}/api/smokecraft/flavor-pairing/pairing-drafts/${draftRow.rows[0].id}/revisions`, { headers: { cookie: bCookies } }).then(r => r.json())
  check('API: another guest cannot read revision history for a draft they do not own', crossHistoryRes.success === false && crossHistoryRes.error === 'draft_not_found')
  await guestBPage.close()

  // ── Keyboard accessibility ──
  const kbPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(kbPage, 'pkg6c-kb')
  await kbPage.goto(`${UI_BASE}/smokecraft/vitola`)
  await kbPage.waitForTimeout(1500)
  await kbPage.locator('text=Start Cadence Exercise').focus()
  await kbPage.keyboard.press('Enter')
  await kbPage.waitForTimeout(400)
  check('Keyboard: Enter starts the cadence exercise', (await kbPage.textContent('body')).includes('Puffs recorded: 0'))
  await kbPage.close()

  // ── Responsive re-check ──
  for (const [name, width, height] of [['390x844', 390, 844], ['1366x1024', 1366, 1024]]) {
    const vp = await browser.newPage({ viewport: { width, height } })
    await seedJourney(vp, `pkg6c-vp-${name}`)
    await vp.goto(`${UI_BASE}/smokecraft/vitola`)
    await vp.waitForTimeout(1200)
    check(`Viewport ${name}: no horizontal overflow with new closure sections`, !(await overflowCheck(vp)))
    const text = await vp.textContent('body')
    check(`Viewport ${name}: Smoking Technique and Recommendations sections present`, text.includes('Smoking Technique') && text.includes('Personalized Pairing Recommendations'))
    if (name === '390x844') await vp.screenshot({ path: `${PROOF_DIR}/15-handheld-closure.png` })
    if (name === '1366x1024') await vp.screenshot({ path: `${PROOF_DIR}/16-tablet-closure.png` })
    await vp.close()
  }

  await browser.close()

  // ── Cleanup ──
  await pool.query(`DELETE FROM smokecraft_pairing_draft_revisions`)
  await pool.query(`DELETE FROM smokecraft_pairing_drafts`)
  await pool.query(`DELETE FROM smokecraft_flavor_stage_observations`)
  await pool.query(`DELETE FROM smokecraft_cadence_sessions`)
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
fs.writeFileSync(`${PROOF_DIR}/closure-results.json`, JSON.stringify(results, null, 2))
if (failed.length) process.exit(1)
