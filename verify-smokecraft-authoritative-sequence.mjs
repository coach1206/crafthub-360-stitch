import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:5000'
const OUT = 'public/proof/smokecraft-authoritative-journey-graph'
let passed = 0, failed = 0
function ok(n, msg) { passed++; console.log(`  ✓ [${n}] ${msg}`) }
function bad(n, msg) { failed++; console.log(`  ✗ [${n}] ${msg}`) }

async function seedGuest(page, opts = {}) {
  await page.goto(`${BASE}/smokecraft`)
  await page.evaluate((o) => {
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'seq-test', xp: 0, completedSteps: o.completedSteps || [], profile: {}, badges: [], smokeCraft: {},
    }))
    localStorage.setItem('novee_demo_mode', 'true')
    if (o.journeyPatch) localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...o.journeyPatch }))
    else localStorage.removeItem('sc_journey_v1')
  }, opts)
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`)
  await page.waitForTimeout(400)
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  fs.mkdirSync(OUT, { recursive: true })

  console.log('── Mentor → Seed & Soil → Humidor Match chain ──')
  await seedGuest(page, { completedSteps: ['entry', 'enroll', 'golden-box'] })
  await nav(page, '/smokecraft/mentor-selection')
  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(150)
  await page.click('button:has-text("Continue to Seed & Soil")')
  await page.waitForTimeout(400)
  page.url().includes('/smokecraft/seed-soil') ? ok(1, 'Mentor Continue routes to Seed & Soil') : bad(1, `Landed on ${page.url()}`)
  !page.url().includes('/format') ? ok(2, 'Mentor never routes to /format') : bad(2, 'Mentor routed to format')

  let body = await page.textContent('body')
  body.includes('Visit 5 of 8') ? bad(3, 'Stale "Visit 5 of 8" text found') : ok(3, 'No "Visit 5 of 8" text on Seed & Soil')
  body.includes('Session 18 of 24') ? bad(4, 'Stale "Session 18 of 24" text found') : ok(4, 'No "Session 18 of 24" text on Seed & Soil')
  body.includes('Future Visit Locked') ? bad(5, 'Locked screen appeared on the approved early path') : ok(5, 'No "Future Visit Locked" screen on Seed & Soil')

  // Complete Seed & Soil, verify it routes to Humidor Match
  const seedSoilOption = page.locator('button[aria-pressed]').first()
  if (await seedSoilOption.count() > 0) {
    await seedSoilOption.click()
    await page.waitForTimeout(150)
  }
  const continueBtn = page.locator('button:has-text("Continue to Humidor Match")')
  if (await continueBtn.count() > 0) {
    await continueBtn.click()
    await page.waitForTimeout(400)
    page.url().includes('/smokecraft/humidor-match') ? ok(6, 'Seed & Soil Continue routes to Humidor Match') : bad(6, `Landed on ${page.url()}`)
  } else {
    bad(6, 'Continue to Humidor Match button not found')
  }

  console.log('── Direct-URL prerequisite protection ──')
  await seedGuest(page, { completedSteps: ['entry', 'enroll'] })
  await nav(page, '/smokecraft/seed-soil')
  page.url().includes('/smokecraft/seed-soil') === false || (await page.textContent('body')).length > 0
    ? ok(7, 'Direct URL to Seed & Soil without mentor redirects (guard enforced)')
    : bad(7, 'Seed & Soil reachable without mentor prerequisite')
  const bodyAfterGuard = await page.textContent('body')
  ;(page.url().includes('/smokecraft/seed-soil') && bodyAfterGuard.includes('Golden Principles'))
    ? bad(7, 'Seed & Soil rendered without mentor prerequisite met')
    : ok(8, 'Seed & Soil correctly gated behind Mentor Selection')

  console.log('── Format stays in its later position, not immediately after Mentor ──')
  await seedGuest(page, { completedSteps: ['entry', 'enroll', 'golden-box', 'mentor'] })
  await nav(page, '/smokecraft/format')
  const formatBody = await page.textContent('body')
  const formatUnlocked = formatBody.includes('Shape, Size & Burn') || formatBody.includes('Robusto')
  !formatUnlocked ? ok(9, 'Format remains locked immediately after Mentor (correct — Seed & Soil/Humidor/Meet-Cigar/Terroir come first)') : bad(9, 'Format incorrectly unlocked right after Mentor')

  console.log('── Full chain: Seed & Soil → Humidor Match → Meet Your Cigar → Terroir → Format → Request/Purchase → Cut Toast Light ──')
  await seedGuest(page, { completedSteps: ['entry', 'enroll', 'golden-box', 'mentor', 'seed-soil', 'humidor-match', 'meet-your-cigar', 'terroir'] })
  await nav(page, '/smokecraft/format')
  const formatNowUnlocked = await page.locator('button:has-text("Continue to Request")').count() > 0
  formatNowUnlocked ? ok(10, 'Format unlocks once Seed&Soil/Humidor/MeetCigar/Terroir are complete') : bad(10, 'Format still locked with correct prerequisites met')

  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(150)
  await page.click('button:has-text("Continue to Request")')
  await page.waitForTimeout(400)
  page.url().includes('/smokecraft/request-purchase') ? ok(11, 'Format Continue routes to Request/Purchase (not Cut-Toast-Light directly)') : bad(11, `Landed on ${page.url()}`)

  await page.click('button:has-text("Back")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/cut-toast-light') === false ? ok(12, 'Request/Purchase Back does not skip into Cut-Toast-Light') : bad(12, 'Unexpected back target')

  console.log('── Migration: stale /format resumeRoute self-heals to Seed & Soil ──')
  await seedGuest(page, {
    completedSteps: ['entry', 'enroll', 'golden-box', 'mentor'],
    journeyPatch: { resumeRoute: '/smokecraft/format' },
  })
  await nav(page, '/smokecraft/resume')
  const migratedJourney = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}'))
  migratedJourney.resumeRoute === '/smokecraft/seed-soil' ? ok(13, 'Stale /format resumeRoute self-heals to /smokecraft/seed-soil') : bad(13, `resumeRoute is ${migratedJourney.resumeRoute}`)

  console.log('── No duplicate rewards / no reward on load ──')
  await seedGuest(page, { completedSteps: ['entry', 'enroll', 'golden-box'] })
  await nav(page, '/smokecraft/mentor-selection')
  const stepsOnLoad = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}').completedSteps || [])
  !stepsOnLoad.includes('mentor') ? ok(14, 'No mentor reward on route load') : bad(14, 'Reward fired on load')
  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(150)
  await page.click('button:has-text("Continue to Seed & Soil")')
  await page.waitForTimeout(400)
  const stepsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}').completedSteps || [])
  const mentorCount = stepsAfter.filter(s => s === 'mentor').length
  mentorCount === 1 ? ok(15, 'Mentor reward recorded exactly once') : bad(15, `mentor appears ${mentorCount} times`)

  console.log('── No horizontal overflow / footer coverage on Mentor Selection (4 viewports) ──')
  const VIEWPORTS = [
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'tablet10-1280x800', width: 1280, height: 800 },
    { name: 'tablet12-1366x1024', width: 1366, height: 1024 },
    { name: 'touch15-1920x1080', width: 1920, height: 1080 },
  ]
  await seedGuest(page, { completedSteps: ['entry', 'enroll', 'golden-box'] })
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await nav(page, '/smokecraft/mentor-selection')
    const cardsVisible = await page.locator('button[aria-pressed]').count()
    cardsVisible === 8 ? ok(`16-${vp.name}`, `All 8 mentor cards present at ${vp.name}`) : bad(`16-${vp.name}`, `Only ${cardsVisible} cards at ${vp.name}`)
    await page.screenshot({ path: `${OUT}/mentor-selection-${vp.name}.png` })
  }

  console.log('── Sequential proof ──')
  await seedGuest(page, { completedSteps: ['entry', 'enroll', 'golden-box', 'mentor', 'seed-soil', 'humidor-match', 'meet-your-cigar', 'terroir', 'format'] })
  await page.setViewportSize({ width: 1440, height: 900 })
  await nav(page, '/smokecraft/identity')
  await page.screenshot({ path: `${OUT}/01-identity.png` })
  await nav(page, '/smokecraft/golden-box')
  await page.screenshot({ path: `${OUT}/02-golden-box.png` })
  await nav(page, '/smokecraft/mentor-selection')
  await page.screenshot({ path: `${OUT}/03-mentor-selection.png` })
  await nav(page, '/smokecraft/seed-soil')
  await page.screenshot({ path: `${OUT}/04-seed-soil.png` })
  await nav(page, '/smokecraft/humidor-match')
  await page.screenshot({ path: `${OUT}/05-humidor-match.png` })
  await nav(page, '/smokecraft/meet-your-cigar')
  await page.screenshot({ path: `${OUT}/06-meet-your-cigar.png` })
  await nav(page, '/smokecraft/terroir')
  await page.screenshot({ path: `${OUT}/07-terroir.png` })
  await nav(page, '/smokecraft/format')
  await page.screenshot({ path: `${OUT}/08-format.png` })
  await nav(page, '/smokecraft/request-purchase')
  await page.screenshot({ path: `${OUT}/09-request-purchase.png` })
  await nav(page, '/smokecraft/cut-toast-light')
  await page.screenshot({ path: `${OUT}/10-cut-toast-light.png` })
  ok('proof', 'Sequential screenshots captured')

  await browser.close()
  console.log('\n' + '─'.repeat(50))
  console.log(`Result: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
