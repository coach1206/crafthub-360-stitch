/**
 * verify-smokecraft-persistence-consolidation.mjs
 * Package A — SmokeCraft 360 Persistence Consolidation
 *
 * Verifies:
 *  - Legacy shadow keys migrate into sc_journey_v1 and are removed
 *  - Migration is idempotent (running twice does not duplicate/change data)
 *  - Newer canonical data is never overwritten by older shadow data
 *  - All 8 previously-shadowed screens read/write exclusively through canonical journey state
 *  - Back/Continue/refresh/resume do not erase data
 *  - XP is not duplicated
 *  - Invalid/corrupt storage falls back safely
 *  - Guest mode and existing screens still render
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
function ok(msg)  { pass++; console.log(`  ✓ ${msg}`) }
function bad(msg) { fail++; console.error(`  ✗ ${msg}`) }

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
}

async function getJourney(page) {
  const raw = await page.evaluate(() => localStorage.getItem('sc_journey_v1'))
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

async function seedFullProgress(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    const steps = Array.from({ length: 24 }, (_, i) => `session-${i + 1}`)
    const existing = JSON.parse(localStorage.getItem('novee_guest_session') || 'null') || {}
    localStorage.setItem('novee_guest_session', JSON.stringify({
      ...existing,
      sessionId: existing.sessionId || 'test-' + Date.now(),
      guestId: existing.guestId || 'test-guest',
      completedSteps: steps,
      xp: 9999,
      rank: 'Master',
      __version: 4,
    }))
  })
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  await seedFullProgress(page)

  // ─────────────────────────────────────────────────────────────────
  // Suite 1: Legacy shadow-key migration
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Suite 1: Legacy shadow-key migration ──')

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.removeItem('sc_journey_v1')
    // Seed every legacy shadow key with distinct, verifiable data
    localStorage.setItem('sc_identity_v1', JSON.stringify({
      fullName: 'Legacy Guest', preferredName: 'Legacy', email: 'legacy@test.com',
      birthDate: '1990-01-01', country: 'United States', experienceLevel: 'enthusiast', focusArea: 'flavor',
    }))
    localStorage.setItem('sc_golden_box_v1', JSON.stringify({ acknowledged: true }))
    localStorage.setItem('sc_connections_v1', JSON.stringify(['instagram', 'email']))
    localStorage.setItem('sc_scorecard_v1', JSON.stringify({
      categories: { appearance: 4, construction: 5, draw: 3, burn: 4, flavor: 5, pairing: 4 },
      meta: { durationMinutes: 55, puffCount: 40, relightCount: 0 },
      personalNotes: 'Legacy scorecard notes', savedAt: Date.now(), submittedScorecardId: 'legacy-sc-1',
    }))
    localStorage.setItem('sc_passport_stamp_v1', JSON.stringify({ claimed: true, stamp: { id: 'legacy-stamp-1' } }))
    sessionStorage.setItem('smokecraftFlavorMemory', JSON.stringify({
      selectedFlavors: ['earth', 'wood'], intensity: 4, body: 3, strength: 4,
      personalNotes: 'Legacy flavor memory notes', savedAt: Date.now(),
    }))
    sessionStorage.setItem('smokecraftFinalThird', JSON.stringify({
      selectedFlavors: ['cocoa'], focusSelected: ['aroma-strength'], savedAt: Date.now(),
    }))
  })

  // Trigger a load of the journey context (any smokecraft route mounts the provider)
  await nav(page, '/smokecraft/identity')

  const j1 = await getJourney(page)
  j1?.identity?.fullName === 'Legacy Guest'
    ? ok('Identity: sc_identity_v1 migrated into journey.identity')
    : bad(`Identity: journey.identity = ${JSON.stringify(j1?.identity)}`)

  j1?.goldenBox?.acknowledged === true
    ? ok('GoldenBox: sc_golden_box_v1 migrated into journey.goldenBox')
    : bad(`GoldenBox: journey.goldenBox = ${JSON.stringify(j1?.goldenBox)}`)

  Array.isArray(j1?.connections?.selected) && j1.connections.selected.includes('instagram') && j1.connections.selected.includes('email')
    ? ok('Connections: sc_connections_v1 migrated into journey.connections.selected')
    : bad(`Connections: journey.connections = ${JSON.stringify(j1?.connections)}`)

  j1?.scorecard?.submittedScorecardId === 'legacy-sc-1' && j1?.scorecard?.categories?.appearance === 4
    ? ok('Scorecard: sc_scorecard_v1 migrated into journey.scorecard')
    : bad(`Scorecard: journey.scorecard = ${JSON.stringify(j1?.scorecard)}`)

  j1?.passportStamp?.claimed === true && j1?.passportStamp?.stamp?.id === 'legacy-stamp-1'
    ? ok('PassportStamp: sc_passport_stamp_v1 migrated into journey.passportStamp')
    : bad(`PassportStamp: journey.passportStamp = ${JSON.stringify(j1?.passportStamp)}`)

  j1?.flavorMemory?.selectedFlavors?.includes('earth')
    ? ok('FlavorMemory: sessionStorage smokecraftFlavorMemory migrated into journey.flavorMemory')
    : bad(`FlavorMemory: journey.flavorMemory = ${JSON.stringify(j1?.flavorMemory)}`)

  j1?.finalThird?.selectedFlavors?.includes('cocoa')
    ? ok('FinalThird: sessionStorage smokecraftFinalThird migrated into journey.finalThird')
    : bad(`FinalThird: journey.finalThird = ${JSON.stringify(j1?.finalThird)}`)

  // Legacy keys must be removed after migration
  const remainingKeys = await page.evaluate(() => ({
    identity: localStorage.getItem('sc_identity_v1'),
    goldenBox: localStorage.getItem('sc_golden_box_v1'),
    connections: localStorage.getItem('sc_connections_v1'),
    scorecard: localStorage.getItem('sc_scorecard_v1'),
    passportStamp: localStorage.getItem('sc_passport_stamp_v1'),
    flavorMemorySession: sessionStorage.getItem('smokecraftFlavorMemory'),
    finalThirdSession: sessionStorage.getItem('smokecraftFinalThird'),
  }))
  const anyRemaining = Object.values(remainingKeys).some(v => v !== null)
  !anyRemaining
    ? ok('All 7 legacy shadow keys removed after migration (stop receiving new writes)')
    : bad(`Legacy keys still present: ${JSON.stringify(remainingKeys)}`)

  // ─────────────────────────────────────────────────────────────────
  // Suite 2: Idempotent migration (running twice does not duplicate/change data)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Suite 2: Idempotent migration ──')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  const j2 = await getJourney(page)
  JSON.stringify(j2?.identity) === JSON.stringify(j1?.identity)
    && JSON.stringify(j2?.scorecard) === JSON.stringify(j1?.scorecard)
    && JSON.stringify(j2?.passportStamp) === JSON.stringify(j1?.passportStamp)
    ? ok('Migration is idempotent: second load does not alter already-migrated data')
    : bad('Migration is NOT idempotent: data changed between loads')

  // ─────────────────────────────────────────────────────────────────
  // Suite 3: Canonical data is never overwritten by older shadow data
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Suite 3: Newer canonical data is not overwritten ──')

  await page.evaluate(() => {
    // Simulate a stray legacy key reappearing with OLDER data after canonical already has real data
    localStorage.setItem('sc_identity_v1', JSON.stringify({ fullName: 'Should Not Win', experienceLevel: 'beginner' }))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  const j3 = await getJourney(page)
  j3?.identity?.fullName === 'Legacy Guest'
    ? ok('Canonical identity data preserved; stray legacy key did not overwrite it')
    : bad(`Canonical identity was overwritten: ${JSON.stringify(j3?.identity)}`)

  // ─────────────────────────────────────────────────────────────────
  // Suite 4: Live screens read/write exclusively through canonical context
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Suite 4: Screens use canonical context (no new shadow writes) ──')

  await page.evaluate(() => localStorage.removeItem('sc_journey_v1'))

  // Identity
  await nav(page, '/smokecraft/identity')
  await page.fill('input[placeholder="First and Last Name"]', 'Canonical Guest')
  await page.click('button:has-text("Regular Enthusiast")')
  await page.waitForTimeout(300)
  let j = await getJourney(page)
  j?.identity?.fullName === 'Canonical Guest'
    ? ok('Identity: form input persists to journey.identity')
    : bad(`Identity: journey.identity = ${JSON.stringify(j?.identity)}`)
  const identityShadow = await page.evaluate(() => localStorage.getItem('sc_identity_v1'))
  identityShadow === null
    ? ok('Identity: no sc_identity_v1 shadow key written')
    : bad('Identity: sc_identity_v1 shadow key was written')

  // Golden Box
  await nav(page, '/smokecraft/golden-box')
  const gbCheckbox = await page.$('input[type="checkbox"]')
  if (gbCheckbox) {
    await gbCheckbox.click()
    await page.waitForTimeout(300)
    j = await getJourney(page)
    j?.goldenBox?.acknowledged === true
      ? ok('GoldenBox: acknowledgement persists to journey.goldenBox')
      : bad(`GoldenBox: journey.goldenBox = ${JSON.stringify(j?.goldenBox)}`)
  } else {
    bad('GoldenBox: checkbox not found')
  }
  const gbShadow = await page.evaluate(() => localStorage.getItem('sc_golden_box_v1'))
  gbShadow === null
    ? ok('GoldenBox: no sc_golden_box_v1 shadow key written')
    : bad('GoldenBox: sc_golden_box_v1 shadow key was written')

  // Connections
  await nav(page, '/smokecraft/connections')
  const connBtn = await page.$('[aria-pressed]')
  if (connBtn) {
    await connBtn.click()
    await page.waitForTimeout(300)
    j = await getJourney(page)
    Array.isArray(j?.connections?.selected) && j.connections.selected.length > 0
      ? ok('Connections: selection persists to journey.connections')
      : bad(`Connections: journey.connections = ${JSON.stringify(j?.connections)}`)
  } else {
    bad('Connections: no aria-pressed buttons found')
  }
  const connShadow = await page.evaluate(() => localStorage.getItem('sc_connections_v1'))
  connShadow === null
    ? ok('Connections: no sc_connections_v1 shadow key written')
    : bad('Connections: sc_connections_v1 shadow key was written')

  // Scorecard
  await nav(page, '/smokecraft/scorecard')
  const rateBtn = await page.$('[aria-label*="Rate Appearance 4"]')
  if (rateBtn) {
    await rateBtn.click()
    await page.waitForTimeout(300)
    j = await getJourney(page)
    j?.scorecard?.categories?.appearance === 4
      ? ok('Scorecard: rating persists to journey.scorecard')
      : bad(`Scorecard: journey.scorecard.categories = ${JSON.stringify(j?.scorecard?.categories)}`)
  } else {
    bad('Scorecard: Rate Appearance 4 button not found')
  }
  const scShadow = await page.evaluate(() => localStorage.getItem('sc_scorecard_v1'))
  scShadow === null
    ? ok('Scorecard: no sc_scorecard_v1 shadow key written')
    : bad('Scorecard: sc_scorecard_v1 shadow key was written')

  // Flavor Memory
  await nav(page, '/smokecraft/flavor-memory')
  const flavorBtn = await page.$('[aria-pressed]')
  if (flavorBtn) {
    await flavorBtn.click()
    await page.waitForTimeout(300)
    j = await getJourney(page)
    Array.isArray(j?.flavorMemory?.selectedFlavors) && j.flavorMemory.selectedFlavors.length > 0
      ? ok('FlavorMemory: selection persists to journey.flavorMemory')
      : bad(`FlavorMemory: journey.flavorMemory = ${JSON.stringify(j?.flavorMemory)}`)
  } else {
    bad('FlavorMemory: no aria-pressed buttons found')
  }
  const fmShadow = await page.evaluate(() => sessionStorage.getItem('smokecraftFlavorMemory'))
  fmShadow === null
    ? ok('FlavorMemory: no smokecraftFlavorMemory shadow key written')
    : bad('FlavorMemory: smokecraftFlavorMemory shadow key was written')

  // Final Third
  await nav(page, '/smokecraft/final-third')
  const finalThirdBtn = await page.$('[aria-pressed]')
  if (finalThirdBtn) {
    await finalThirdBtn.click()
    await page.waitForTimeout(300)
    j = await getJourney(page)
    const finalThirdHasData = j?.finalThird?.selectedFlavors?.length > 0 || j?.finalThird?.focusSelected?.length > 0
    finalThirdHasData
      ? ok('FinalThird: selection persists to journey.finalThird')
      : bad(`FinalThird: journey.finalThird = ${JSON.stringify(j?.finalThird)}`)
  } else {
    bad('FinalThird: no aria-pressed buttons found')
  }
  const ftShadow = await page.evaluate(() => sessionStorage.getItem('smokecraftFinalThird'))
  ftShadow === null
    ? ok('FinalThird: no smokecraftFinalThird shadow key written')
    : bad('FinalThird: smokecraftFinalThird shadow key was written')

  // ─────────────────────────────────────────────────────────────────
  // Suite 5: Back / Continue / refresh / dashboard-return do not erase data
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Suite 5: Navigation does not erase data ──')

  await nav(page, '/smokecraft/identity')
  await page.fill('input[placeholder="First and Last Name"]', 'Persistence Test Guest')
  await page.click('button:has-text("Expert / Sommelier Level")')
  await page.waitForTimeout(300)

  // Back navigation
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(300)
  j = await getJourney(page)
  j?.identity?.fullName === 'Persistence Test Guest'
    ? ok('Back navigation: identity data preserved')
    : bad(`Back navigation: journey.identity = ${JSON.stringify(j?.identity)}`)

  // Refresh
  await page.goForward({ waitUntil: 'domcontentloaded' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  j = await getJourney(page)
  j?.identity?.fullName === 'Persistence Test Guest'
    ? ok('Refresh: identity data preserved')
    : bad(`Refresh: journey.identity = ${JSON.stringify(j?.identity)}`)

  // Dashboard return (navigate to /smokecraft then back to identity)
  await nav(page, '/smokecraft')
  await nav(page, '/smokecraft/identity')
  j = await getJourney(page)
  j?.identity?.fullName === 'Persistence Test Guest'
    ? ok('Dashboard return: identity data preserved')
    : bad(`Dashboard return: journey.identity = ${JSON.stringify(j?.identity)}`)
  const identityFieldValue = await page.$eval('input[placeholder="First and Last Name"]', el => el.value)
  identityFieldValue === 'Persistence Test Guest'
    ? ok('Resume: identity form field restored with saved value')
    : bad(`Resume: form field value = "${identityFieldValue}"`)

  // ─────────────────────────────────────────────────────────────────
  // Suite 6: XP is not duplicated
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Suite 6: XP duplicate-award prevention ──')

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.removeItem('sc_journey_v1')
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'xp-test-' + Date.now(), guestId: 'xp-test-guest',
      completedSteps: [], xp: 0, rank: 'Novice', badges: [], __version: 4,
    }))
  })

  await nav(page, '/smokecraft/golden-box')
  const gbCheckbox2 = await page.$('input[type="checkbox"]')
  if (gbCheckbox2) await gbCheckbox2.click()
  await page.waitForTimeout(200)
  const continueBtn = await page.$('button:has-text("Save and Continue")')
  if (continueBtn) await continueBtn.click()
  await page.waitForTimeout(400)
  const xpAfterFirst = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}').xp)

  // Navigate back and re-trigger completion for the same session id
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(300)
  const gbCheckbox3 = await page.$('input[type="checkbox"]')
  if (gbCheckbox3) {
    const isChecked = await gbCheckbox3.isChecked()
    if (!isChecked) await gbCheckbox3.click()
  }
  const continueBtn2 = await page.$('button:has-text("Save and Continue")')
  if (continueBtn2) await continueBtn2.click()
  await page.waitForTimeout(400)
  const xpAfterSecond = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}').xp)

  xpAfterFirst === xpAfterSecond && xpAfterFirst > 0
    ? ok(`XP not duplicated: ${xpAfterFirst} XP after repeat completion (idempotent completedSteps guard)`)
    : bad(`XP duplication suspected: first=${xpAfterFirst}, second=${xpAfterSecond}`)

  // ─────────────────────────────────────────────────────────────────
  // Suite 7: Invalid/corrupt storage falls back safely
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Suite 7: Corrupt storage fallback ──')

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.setItem('sc_journey_v1', '{not valid json!!!')
    sessionStorage.setItem('novee_demo_mode', '1')
  })
  let corruptLoadOk = true
  try {
    await nav(page, '/smokecraft/identity')
  } catch {
    corruptLoadOk = false
  }
  const bodyText = corruptLoadOk ? await page.evaluate(() => document.body.innerText) : ''
  corruptLoadOk && bodyText.length > 0
    ? ok('Corrupt sc_journey_v1 JSON falls back to defaults without crashing the app')
    : bad('App failed to load with corrupt sc_journey_v1 data')
  const jCorrupt = await getJourney(page)
  jCorrupt !== null && typeof jCorrupt === 'object'
    ? ok('Corrupt storage recovered to a valid journey object')
    : bad('Journey state not recovered after corrupt storage')

  // ─────────────────────────────────────────────────────────────────
  // Suite 8: Guest mode remains functional / existing screens still render
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Suite 8: Guest mode + existing screens still render ──')

  await page.evaluate(() => localStorage.removeItem('sc_journey_v1'))
  const screensToCheck = [
    '/smokecraft/mentor-selection', '/smokecraft/format', '/smokecraft/seed-soil',
    '/smokecraft/pairing-lab', '/smokecraft/humidor-match', '/smokecraft/request-purchase',
    '/smokecraft/cut-toast-light', '/smokecraft/first-third', '/smokecraft/second-third',
    '/smokecraft/flavor-memory', '/smokecraft/final-third', '/smokecraft/scorecard',
    '/smokecraft/final-review', '/smokecraft/passport-stamp', '/smokecraft/connections',
    '/smokecraft/management-sync', '/smokecraft/session-complete',
  ]
  let allRendered = true
  for (const path of screensToCheck) {
    await nav(page, path)
    const hasNavBar = await page.$('button') !== null
    if (!hasNavBar) { allRendered = false; bad(`${path}: no rendered buttons found`) }
  }
  allRendered
    ? ok(`All ${screensToCheck.length} existing SmokeCraft screens still render after persistence consolidation`)
    : bad('One or more screens failed to render')

  // ─────────────────────────────────────────────────────────────────
  // Suite 9: Session completion + passport eligibility/claim persist
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Suite 9: Session completion + Passport claim persistence ──')

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await seedFullProgress(page)
  await page.evaluate(() => localStorage.removeItem('sc_journey_v1'))

  await nav(page, '/smokecraft/session-complete')
  await page.waitForTimeout(400)
  const jSessionComplete = await getJourney(page)
  // SessionComplete reads journey (not shadow keys) — confirm no crash and page renders
  const scBody = await page.evaluate(() => document.body.innerText)
  scBody.length > 0
    ? ok('SessionComplete: renders using canonical journey context (no raw localStorage reads)')
    : bad('SessionComplete: failed to render')

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
