// Package 4 Step 2: draft rehydration fix verification.
// Create draft / choose components / save / reload / resume / verify all
// selections / edit one selection / save again / reload again / verify
// updated selection / confirm recipe privacy remains enforced / confirm
// another user cannot load the draft.
import { chromium } from 'playwright'
import pg from 'pg'
import fs from 'fs'

const API_BASE = 'http://localhost:3001'
const UI_BASE = 'http://localhost:5000'
const DATABASE_URL = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString: DATABASE_URL })
const PROOF_DIR = 'public/proof/smokecraft-package-4'
fs.mkdirSync(PROOF_DIR, { recursive: true })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

async function seedJourney(page, venueTag) {
  await page.goto(`${UI_BASE}/smokecraft/venue-select`)
  await page.evaluate((tag) => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: 'pkg4-venue', name: 'Package 4 Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }],
    }))
  }, venueTag)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

try {
  const compRow = await pool.query(`SELECT id FROM golden_box_competitions WHERE competition_key = 'pkg4-rehydration-comp'`)
  const competitionId = compRow.rows[0].id

  // ── Guest A: create draft, select components, save ──
  const p1 = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(p1, 'guestA')
  await p1.goto(`${UI_BASE}/smokecraft/golden-box/competitions/${competitionId}`)
  await p1.waitForTimeout(1200)
  await p1.click('text=Check My Eligibility')
  await p1.waitForTimeout(1200)
  await p1.click('text=Create My Entry')
  await p1.waitForTimeout(1500)
  const entryUrl = p1.url()
  const entryId = entryUrl.match(/entries\/([0-9a-f-]{36})\/blend/)?.[1]
  check('Setup: entry created', !!entryId)

  await p1.selectOption('#gb-picker-seed_genetics', { index: 1 })
  await p1.selectOption('#gb-picker-soil', { index: 1 })
  await p1.selectOption('#gb-picker-terroir', { index: 1 })
  await p1.waitForTimeout(200)
  for (const type of ['wrapper', 'binder', 'filler', 'vitola']) {
    await p1.selectOption(`#gb-picker-${type}`, { index: 1 })
    await p1.waitForTimeout(150)
  }
  const seedGeneticsBeforeVal = await p1.locator('#gb-picker-seed_genetics').inputValue()
  const soilBeforeVal = await p1.locator('#gb-picker-soil').inputValue()
  await p1.fill('#gb-cigar-name', 'Rehydration Test Blend')
  await p1.click('text=Save Draft')
  await p1.waitForTimeout(1500)

  const savedVersion = await pool.query(`SELECT current_version FROM golden_box_entries WHERE entry_id = $1`, [entryId])
  check('DB: draft saved (version 2)', savedVersion.rows[0].current_version === 2)

  await p1.screenshot({ path: `${PROOF_DIR}/01-before-reload-selections.png` })

  // ── Reload: verify all selections resumed ──
  await p1.reload()
  await p1.waitForTimeout(1500)
  const resumedCigarName = await p1.inputValue('#gb-cigar-name').catch(() => '')
  check('UI: cigar name rehydrated after reload', resumedCigarName === 'Rehydration Test Blend', `got "${resumedCigarName}"`)

  const resumedSeedVal = await p1.locator('#gb-picker-seed_genetics').inputValue()
  check('UI: seed genetics selection rehydrated after reload', resumedSeedVal === seedGeneticsBeforeVal && resumedSeedVal !== '', `expected ${seedGeneticsBeforeVal}, got ${resumedSeedVal}`)

  const resumedSoilVal = await p1.locator('#gb-picker-soil').inputValue()
  check('UI: soil selection rehydrated after reload', resumedSoilVal === soilBeforeVal && resumedSoilVal !== '', `expected ${soilBeforeVal}, got ${resumedSoilVal}`)

  let allRehydrated = true
  for (const type of ['terroir', 'wrapper', 'binder', 'filler', 'vitola']) {
    const v = await p1.locator(`#gb-picker-${type}`).inputValue()
    if (!v) allRehydrated = false
  }
  check('UI: all remaining saved component selections rehydrated', allRehydrated)

  await p1.screenshot({ path: `${PROOF_DIR}/02-after-reload-resumed.png` })

  // ── Edit one selection, save again, reload again, verify updated ──
  await p1.selectOption('#gb-picker-seed_genetics', { index: 2 })
  await p1.waitForTimeout(200)
  const editedSeedVal = await p1.locator('#gb-picker-seed_genetics').inputValue()
  await p1.click('text=Save Draft')
  await p1.waitForTimeout(1500)

  const savedVersion2 = await pool.query(`SELECT current_version FROM golden_box_entries WHERE entry_id = $1`, [entryId])
  check('DB: second draft save persisted (version 3)', savedVersion2.rows[0].current_version === 3)

  await p1.reload()
  await p1.waitForTimeout(1500)
  const reResumedSeedVal = await p1.locator('#gb-picker-seed_genetics').inputValue()
  check('UI: edited selection rehydrated correctly after second reload', reResumedSeedVal === editedSeedVal && reResumedSeedVal !== seedGeneticsBeforeVal, `expected ${editedSeedVal}, got ${reResumedSeedVal}`)

  const reResumedCigarName = await p1.inputValue('#gb-cigar-name').catch(() => '')
  check('UI: cigar name still correct after second reload', reResumedCigarName === 'Rehydration Test Blend')

  await p1.screenshot({ path: `${PROOF_DIR}/03-after-edit-and-reload.png` })

  // ── Confirm recipe privacy still enforced via the API directly (owner can see) ──
  const cookies1 = await p1.context().cookies()
  const cookieHeader1 = cookies1.map(c => `${c.name}=${c.value}`).join('; ')
  const ownerApiRes = await fetch(`${API_BASE}/api/smokecraft/golden-box/entries/${entryId}`, { headers: { cookie: cookieHeader1 } }).then(r => r.json())
  check('API: owner (guest A) can view own recipe via API', ownerApiRes.success === true && ownerApiRes.visibility?.canViewRecipe === true)
  check('API: owner response includes rehydration fields (currentVersion + components)', !!ownerApiRes.currentVersion && Array.isArray(ownerApiRes.components) && ownerApiRes.components.length > 0)

  await p1.close()

  // ── Guest B: confirm cross-user denial still holds ──
  const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(p2, 'guestB')
  await p2.goto(`${UI_BASE}/smokecraft/golden-box/entries/${entryId}/blend`)
  await p2.waitForTimeout(1200)
  const cookies2 = await p2.context().cookies()
  const cookieHeader2 = cookies2.map(c => `${c.name}=${c.value}`).join('; ')
  const otherApiRes = await fetch(`${API_BASE}/api/smokecraft/golden-box/entries/${entryId}`, { headers: { cookie: cookieHeader2 } }).then(r => r.json())
  check('API: another guest (guest B) cannot view recipe details', otherApiRes.success === true && otherApiRes.visibility?.canViewRecipe === false)
  check('API: another guest response withholds components/currentVersion', otherApiRes.components === undefined && otherApiRes.currentVersion === undefined)

  await p2.screenshot({ path: `${PROOF_DIR}/04-cross-user-denied.png` })
  await p2.close()

  await browser.close()

  // Cleanup
  if (entryId) {
    await pool.query(`DELETE FROM golden_box_submissions WHERE entry_id = $1`, [entryId]).catch(() => {})
    await pool.query(`DELETE FROM golden_box_blend_components WHERE entry_version_id IN (SELECT id FROM golden_box_entry_versions WHERE entry_id = $1)`, [entryId]).catch(() => {})
    await pool.query(`DELETE FROM golden_box_entry_versions WHERE entry_id = $1`, [entryId]).catch(() => {})
    await pool.query(`DELETE FROM golden_box_entries WHERE entry_id = $1`, [entryId]).catch(() => {})
  }
  await pool.query(`DELETE FROM golden_box_competitions WHERE competition_key = 'pkg4-rehydration-comp'`)
  const remaining = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_competitions WHERE competition_key = 'pkg4-rehydration-comp'`)
  check('Test data removed', remaining.rows[0].c === 0)

} catch (err) {
  console.error('Unexpected error:', err)
  results.push({ name: 'unexpected error', pass: false, detail: err.message })
  await browser.close().catch(() => {})
} finally {
  await pool.end()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
fs.writeFileSync(`${PROOF_DIR}/rehydration-results.json`, JSON.stringify(results, null, 2))
if (failed.length) process.exit(1)
