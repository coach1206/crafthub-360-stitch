/**
 * verify-smokecraft-functional-recovery.mjs
 * Canonical persistence + live interaction gate for SmokeCraft journey
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

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  // Seed demo mode, full completed steps, and clear journey state
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.removeItem('sc_journey_v1')
    sessionStorage.setItem('novee_demo_mode', '1')
    // Pre-complete all sessions so SmokeCraftSessionGuard unlocks every screen
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

  // ── 1. Mentor
  await nav(page, '/smokecraft/mentor-selection')
  const mentorBtns = await page.$$('button[aria-pressed]')
  if (mentorBtns.length > 0) {
    await mentorBtns[0].click()
    await page.waitForTimeout(200)

    const pressed = await mentorBtns[0].getAttribute('aria-pressed')
    pressed === 'true' ? ok('Mentor: aria-pressed=true after click') : bad(`Mentor: aria-pressed=${pressed}`)

    const bg = await mentorBtns[0].evaluate(el => el.style.background)
    bg === 'transparent' ? ok('Mentor: no gold fill') : bad(`Mentor: background=${bg}`)

    await mentorBtns[0].click()
    const pressedOff = await mentorBtns[0].getAttribute('aria-pressed')
    pressedOff === 'false' ? ok('Mentor: deselect works') : bad(`Mentor: deselect=${pressedOff}`)

    await mentorBtns[0].click()
    await page.waitForTimeout(200)
    const j = await getJourney(page)
    Array.isArray(j?.mentor) && j.mentor.length > 0
      ? ok('Mentor: persists to sc_journey_v1')
      : bad('Mentor: not in journey')
  } else {
    bad('Mentor: no aria-pressed buttons found on mentor-selection')
  }

  // ── 2. Format
  await nav(page, '/smokecraft/format')
  const fmtBtns = await page.$$('button[aria-pressed]')
  if (fmtBtns.length > 0) {
    await fmtBtns[0].click()
    await page.waitForTimeout(200)
    const pressed = await fmtBtns[0].getAttribute('aria-pressed')
    pressed === 'true' ? ok('Format: aria-pressed=true') : bad(`Format: aria-pressed=${pressed}`)

    const saveBtn = await page.$('[aria-label="Save format selection"]')
    if (saveBtn) {
      await saveBtn.click()
      await page.waitForTimeout(50)
      const txt = await saveBtn.textContent()
      txt.includes('Saved') ? ok('Format: honest save (immediate Saved)') : bad(`Format: save text="${txt}"`)
    }

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const btnsAfter = await page.$$('button[aria-pressed]')
    let anyActive = false
    for (const btn of btnsAfter) {
      if ((await btn.getAttribute('aria-pressed')) === 'true') { anyActive = true; break }
    }
    anyActive ? ok('Format: restored after reload') : bad('Format: selection lost after reload')

    const j = await getJourney(page)
    j?.format?.id ? ok(`Format: journey.format.id="${j.format.id}"`) : bad('Format: no format.id')
  } else {
    bad('Format: no aria-pressed buttons found')
  }

  // No duplicate Back buttons
  await nav(page, '/smokecraft/format')
  const backCount = await page.$$eval('button', btns =>
    btns.filter(b => /^←?\s*Back/.test(b.textContent.trim())).length
  )
  backCount === 1 ? ok('Format: 1 Back button (no duplicate nav)') : bad(`Format: ${backCount} Back buttons`)

  // ── 3. CutToastLight gate
  await nav(page, '/smokecraft/cut-toast-light')
  const cutBtns = await page.$$('button[aria-pressed]')
  if (cutBtns.length >= 3) {
    const primaryBtns = await page.$$('button')
    let gateOk = false
    for (const btn of primaryBtns) {
      const txt = await btn.textContent()
      if (txt && txt.includes('Continue')) {
        gateOk = await btn.evaluate(el => el.disabled)
        break
      }
    }
    gateOk ? ok('CutToastLight: Continue disabled before all 3') : bad('CutToastLight: gate not working')

    await page.click('[aria-label="Straight Cut"]')
    await page.click('[aria-label="Gentle Toast"]')
    await page.click('[aria-label="Cedar Spill"]')
    await page.waitForTimeout(200)

    const c = await page.$eval('[aria-label="Straight Cut"]',  el => el.getAttribute('aria-pressed'))
    const t = await page.$eval('[aria-label="Gentle Toast"]',   el => el.getAttribute('aria-pressed'))
    const l = await page.$eval('[aria-label="Cedar Spill"]',    el => el.getAttribute('aria-pressed'))
    c === 'true' && t === 'true' && l === 'true'
      ? ok('CutToastLight: all 3 selections aria-pressed=true')
      : bad(`CutToastLight: cut=${c} toast=${t} light=${l}`)

    const j = await getJourney(page)
    j?.cutToastLight?.cut ? ok('CutToastLight: cut persists') : bad('CutToastLight: cut not in journey')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const cutAfter = await page.$eval('[aria-label="Straight Cut"]', el => el.getAttribute('aria-pressed'))
    cutAfter === 'true' ? ok('CutToastLight: restored after reload') : bad('CutToastLight: lost after reload')
  } else {
    bad(`CutToastLight: only ${cutBtns.length} aria-pressed buttons`)
  }

  // ── 4. First Third notes persist
  await nav(page, '/smokecraft/first-third')
  const ftArea = await page.$('textarea')
  if (ftArea) {
    await ftArea.fill('First third test note')
    await page.waitForTimeout(300)
    const j = await getJourney(page)
    j?.firstThird?.personalNotes === 'First third test note'
      ? ok('FirstThird: notes in sc_journey_v1')
      : bad(`FirstThird: notes=${j?.firstThird?.personalNotes}`)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const notesAfter = await page.$eval('textarea', el => el.value)
    notesAfter === 'First third test note'
      ? ok('FirstThird: notes restored after reload')
      : bad(`FirstThird: notes="${notesAfter}"`)
  } else {
    bad('FirstThird: no textarea')
  }

  // ── 5. Second Third notes persist
  await nav(page, '/smokecraft/second-third')
  const stArea = await page.$('textarea')
  if (stArea) {
    await stArea.fill('Second third test note')
    await page.waitForTimeout(300)
    const j = await getJourney(page)
    j?.secondThird?.personalNotes === 'Second third test note'
      ? ok('SecondThird: notes in sc_journey_v1')
      : bad(`SecondThird: notes=${j?.secondThird?.personalNotes}`)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const notesAfter = await page.$eval('textarea', el => el.value)
    notesAfter === 'Second third test note'
      ? ok('SecondThird: notes restored after reload')
      : bad(`SecondThird: notes="${notesAfter}"`)
  } else {
    bad('SecondThird: no textarea')
  }

  // ── 6. Flavor Memory slider persists
  await nav(page, '/smokecraft/flavor-memory')
  const slider = await page.$('input[type="range"]')
  if (slider) {
    await slider.fill('4')
    await page.waitForTimeout(300)
    const j = await getJourney(page)
    const vals = [j?.flavorMemory?.intensity, j?.flavorMemory?.body, j?.flavorMemory?.strength]
    vals.some(v => v !== undefined && v !== null)
      ? ok('FlavorMemory: slider in sc_journey_v1')
      : bad('FlavorMemory: no slider value in journey')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const after = await page.$eval('input[type="range"]', el => el.value)
    parseInt(after) > 1 ? ok('FlavorMemory: slider restored') : bad(`FlavorMemory: slider=${after}`)
  } else {
    bad('FlavorMemory: no range slider')
  }

  // ── 7. Scorecard persists
  await nav(page, '/smokecraft/scorecard')
  const rateBtn = await page.$('[aria-label*="Rate Appearance 4"]')
  if (rateBtn) {
    await rateBtn.click()
    await page.waitForTimeout(200)
    const j = await getJourney(page)
    j?.scorecard?.categories?.appearance === 4
      ? ok('Scorecard: rating in sc_journey_v1')
      : bad(`Scorecard: appearance=${j?.scorecard?.categories?.appearance}`)

    const saveDraftBtn = await page.$('button:has-text("Save Draft")')
    if (saveDraftBtn) {
      await saveDraftBtn.click()
      await page.waitForTimeout(100)
      const body = await page.evaluate(() => document.body.innerText)
      body.includes('✓ Saved') ? ok('Scorecard: Save Draft shows ✓ Saved') : bad('Scorecard: no ✓ Saved after save')
    }
  } else {
    bad('Scorecard: no Appearance rating button')
  }

  // ── 8. Final Review persists
  await nav(page, '/smokecraft/final-review')
  const reviewBtns = await page.$$('button[aria-pressed]')
  if (reviewBtns.length > 0) {
    await reviewBtns[0].click()
    await page.waitForTimeout(300)
    const j = await getJourney(page)
    j?.finalReview?.checked?.length > 0
      ? ok('FinalReview: checked in sc_journey_v1')
      : bad('FinalReview: checked not in journey')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const firstAfter = await page.$eval('button[aria-pressed]', el => el.getAttribute('aria-pressed'))
    firstAfter === 'true' ? ok('FinalReview: restored after reload') : bad('FinalReview: lost after reload')
  } else {
    bad('FinalReview: no aria-pressed buttons')
  }

  // ── 9. No private localStorage keys
  const privateKeys = await page.evaluate(() =>
    ['sc_first_third_draft','sc_second_third_draft','sc_humidor_settings',
     'sc_request_purchase_draft','sc_format_selection']
    .filter(k => localStorage.getItem(k) !== null)
  )
  privateKeys.length === 0
    ? ok('No private screen-specific localStorage keys present')
    : bad(`Private keys present: ${privateKeys.join(', ')}`)

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
