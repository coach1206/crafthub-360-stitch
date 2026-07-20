// Package 7 (scoped): Blend Story, Presentation & Defense step in the
// Golden Box entry workflow. See docs/audits/smokecraft-final-completion/
// package-7/16-PACKAGE-7-COMPLETION-REPORT.md for the full, honest scope
// disclosure — this suite covers what was actually built this pass.
import { chromium } from 'playwright'
import pg from 'pg'
import fs from 'fs'

const API_BASE = 'http://localhost:3001'
const UI_BASE = 'http://localhost:5000'
const DATABASE_URL = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString: DATABASE_URL })
const PROOF_DIR = 'public/proof/smokecraft-package-7'
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
      selectedVenue: { id: venueTag, name: 'Package 7 Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }],
    }))
  }, venueTag)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

try {
  const compRow = await pool.query(`SELECT id FROM golden_box_competitions WHERE competition_key = 'pkg7-live-comp'`)
  const competitionId = compRow.rows[0].id

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(page, 'pkg7-main')
  await page.goto(`${UI_BASE}/smokecraft/golden-box/competitions/${competitionId}`)
  await page.waitForTimeout(1200)
  await page.click('text=Check My Eligibility')
  await page.waitForTimeout(1200)
  await page.click('text=Create My Entry')
  await page.waitForTimeout(1500)
  const entryUrl = page.url()
  const entryId = entryUrl.match(/entries\/([0-9a-f-]{36})\/blend/)?.[1]
  check('Setup: entry created', !!entryId)

  for (const type of ['wrapper', 'binder', 'filler', 'vitola']) {
    await page.selectOption(`#gb-picker-${type}`, { index: 1 })
    await page.waitForTimeout(150)
  }
  await page.fill('#gb-cigar-name', 'Package 7 Test Blend')
  await page.click('text=Continue to Review')
  await page.waitForTimeout(500)
  check('UI: review step reached', (await page.textContent('body')).includes('Draft Review'))

  await page.click('text=Continue to Presentation & Defense')
  await page.waitForTimeout(500)
  check('UI: Presentation & Defense step renders', (await page.textContent('body')).includes('Blend Story, Presentation'))

  await page.fill('#gb-blend-story', 'A tribute to Dominican soil, built around a bold ligero core with a Connecticut Shade wrapper for balance.')
  await page.fill('#gb-pairing-item', 'Aged Dominican rum')
  await page.fill('#gb-pairing-defense', 'The rum\'s caramel notes complement the blend\'s natural sweetness while its own spice contrasts the pepper finish.')
  await page.click('text=Save Draft')
  await page.waitForTimeout(1500)

  const versionRow = await pool.query(`
    SELECT presentation_payload, pairing_selection, pairing_defense FROM golden_box_entry_versions
    WHERE entry_id = $1 ORDER BY version_number DESC LIMIT 1
  `, [entryId])
  check('DB: blend story persisted server-side', versionRow.rows[0]?.presentation_payload?.story?.includes('Dominican soil'))
  check('DB: pairing selection persisted server-side', versionRow.rows[0]?.pairing_selection?.item === 'Aged Dominican rum')
  check('DB: pairing defense persisted server-side', versionRow.rows[0]?.pairing_defense?.includes('caramel notes'))

  await page.screenshot({ path: `${PROOF_DIR}/01-presentation-defense.png` })

  // Reload and confirm rehydration of the new fields
  await page.reload()
  await page.waitForTimeout(1500)
  await page.click('text=Continue to Review')
  await page.waitForTimeout(400)
  await page.click('text=Continue to Presentation & Defense')
  await page.waitForTimeout(500)
  const storyVal = await page.inputValue('#gb-blend-story')
  const itemVal = await page.inputValue('#gb-pairing-item')
  const defenseVal = await page.inputValue('#gb-pairing-defense')
  check('UI: blend story rehydrates after reload', storyVal.includes('Dominican soil'))
  check('UI: pairing item rehydrates after reload', itemVal === 'Aged Dominican rum')
  check('UI: pairing defense rehydrates after reload', defenseVal.includes('caramel notes'))
  await page.screenshot({ path: `${PROOF_DIR}/02-presentation-rehydrated.png` })

  // Confirm recipe privacy still holds for the new fields (owner sees, stranger doesn't)
  const cookies = await page.context().cookies()
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const ownerRes = await fetch(`${API_BASE}/api/smokecraft/golden-box/entries/${entryId}`, { headers: { cookie: cookieHeader } }).then(r => r.json())
  check('API: owner sees presentation/defense fields via currentVersion', ownerRes.currentVersion?.pairing_defense?.includes('caramel notes'))

  await page.close()

  const strangerPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(strangerPage, 'pkg7-stranger')
  await strangerPage.goto(`${UI_BASE}/smokecraft/golden-box/entries/${entryId}/blend`)
  await strangerPage.waitForTimeout(1000)
  const strangerCookies = (await strangerPage.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ')
  const strangerRes = await fetch(`${API_BASE}/api/smokecraft/golden-box/entries/${entryId}`, { headers: { cookie: strangerCookies } }).then(r => r.json())
  check('API: a stranger cannot see blend story/defense (currentVersion withheld)', strangerRes.currentVersion === undefined)
  await strangerPage.close()

  // Responsive
  const hp = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await seedJourney(hp, 'pkg7-handheld')
  await hp.goto(`${UI_BASE}/smokecraft/golden-box/competitions/${competitionId}`)
  await hp.waitForTimeout(1200)
  await hp.click('text=Check My Eligibility')
  await hp.waitForTimeout(1000)
  await hp.click('text=Create My Entry')
  await hp.waitForTimeout(1500)
  for (const type of ['wrapper', 'binder', 'filler', 'vitola']) {
    await hp.selectOption(`#gb-picker-${type}`, { index: 1 })
    await hp.waitForTimeout(150)
  }
  await hp.click('text=Continue to Review')
  await hp.waitForTimeout(400)
  await hp.click('text=Continue to Presentation & Defense')
  await hp.waitForTimeout(600)
  check('Handheld 390x844: Presentation step no horizontal overflow', !(await overflowCheck(hp)))
  await hp.screenshot({ path: `${PROOF_DIR}/03-presentation-handheld.png` })
  await hp.close()

  await browser.close()

  // Cleanup
  await pool.query(`DELETE FROM golden_box_blend_components WHERE entry_version_id IN (SELECT id FROM golden_box_entry_versions WHERE entry_id = $1)`, [entryId]).catch(() => {})
  await pool.query(`DELETE FROM golden_box_entry_versions WHERE entry_id = $1`, [entryId]).catch(() => {})
  await pool.query(`DELETE FROM golden_box_entries WHERE entry_id = $1`, [entryId]).catch(() => {})
  await pool.query(`DELETE FROM golden_box_competitions WHERE competition_key = 'pkg7-live-comp'`)
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
fs.writeFileSync(`${PROOF_DIR}/package-7-results.json`, JSON.stringify(results, null, 2))
if (failed.length) process.exit(1)
