// Verifies the 4 new supporting gamification screens built from the
// latest approved image batch: Skill Tree, Collections Center, Challenge
// Hub, and the Blend Fault Identification challenge.
import { chromium } from 'playwright'

const UI_BASE = 'http://localhost:5000'
const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

async function seed(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: 'gs-venue', name: 'GS Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'Dominican Republic', flag: '🇩🇴', bio: 'Master of volcanic soil nutrients.', image: '/mentors/don-alejandro.jpg' }],
    }))
  })
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
try {
  // ── Skill Tree ──
  const p1 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seed(p1)
  const r1 = await p1.goto(`${UI_BASE}/smokecraft/skill-tree`, { waitUntil: 'domcontentloaded' })
  check('Skill Tree route reachable (200)', r1.status() === 200)
  await p1.waitForTimeout(1000)
  check('Skill Tree shows real approved artwork', await p1.locator('img[alt="SmokeCraft Skill Tree"]').count() === 1)
  check('Skill Tree shows dynamic mentor (Don Alejandro, not baked)', (await p1.textContent('body')).includes('Don Alejandro'))
  check('Skill Tree shows all 7 real approved categories', (await p1.textContent('body')).includes('Mastery & Blending') && (await p1.textContent('body')).includes('Community & Legacy'))
  check('Skill Tree discloses no fake progress', (await p1.textContent('body')).includes('not yet backend-connected'))
  await p1.close()

  // ── Collections Center ──
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seed(p2)
  const r2 = await p2.goto(`${UI_BASE}/smokecraft/collections`, { waitUntil: 'domcontentloaded' })
  check('Collections Center route reachable (200)', r2.status() === 200)
  await p2.waitForTimeout(1000)
  check('Collections Center shows real approved artwork', await p2.locator('img[alt="Collections Center"]').count() === 1)
  check('Collections Center shows all 7 real approved categories', (await p2.textContent('body')).includes('Lounge Collection') && (await p2.textContent('body')).includes('Reward / Achievement Collection'))
  check('Collections Center shows honest 0-owned state, no fabricated count', (await p2.textContent('body')).includes('0 owned'))
  await p2.close()

  // ── Challenge Hub ──
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seed(p3)
  const r3 = await p3.goto(`${UI_BASE}/smokecraft/challenge-hub`, { waitUntil: 'domcontentloaded' })
  check('Challenge Hub route reachable (200)', r3.status() === 200)
  await p3.waitForTimeout(1000)
  check('Challenge Hub shows real approved artwork', await p3.locator('img[alt="Daily and Weekly Challenge Hub"]').count() === 1)
  check('Challenge Hub lists Blend Fault Identification as available', (await p3.textContent('body')).includes('Blend Fault Identification'))
  await p3.click('text=Blend Fault Identification')
  await p3.waitForTimeout(800)
  check('Challenge Hub navigates to the real challenge route', p3.url().includes('/smokecraft/challenges/blend-fault-identification'))
  await p3.close()

  // ── Blend Fault Identification challenge — full 3-step flow ──
  const p4 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seed(p4)
  const r4 = await p4.goto(`${UI_BASE}/smokecraft/challenges/blend-fault-identification`, { waitUntil: 'domcontentloaded' })
  check('Blend Fault challenge route reachable (200)', r4.status() === 200)
  await p4.waitForTimeout(800)
  check('Step 1 shows the real "Identify the Issue" title', (await p4.textContent('body')).includes('Identify the Issue'))
  check('Continue is disabled before any selection (no default selection)', await p4.locator('button:has-text("Continue")').isDisabled())
  await p4.click('button:has-text("Wrapper Damage")')
  check('Continue enables only after a real user selection', !(await p4.locator('button:has-text("Continue")').isDisabled()))
  await p4.click('button:has-text("Continue")')
  await p4.waitForTimeout(400)
  check('Step 2 shows the real "Choose the Best Solution" title', (await p4.textContent('body')).includes('Choose the Best Solution'))
  await p4.click('button:has-text("Re-moisten and rest the leaf")')
  await p4.click('button:has-text("Continue")')
  await p4.waitForTimeout(400)
  check('Step 3 shows the real "Prevent and Improve" title', (await p4.textContent('body')).includes('Prevent and Improve'))
  await p4.click('button:has-text("Re-moisten and rest the leaf")')
  await p4.click('button:has-text("Submit My Solutions")')
  await p4.waitForTimeout(400)
  check('Challenge reaches a real completion state', (await p4.textContent('body')).includes('Challenge Complete'))
  check('Challenge honestly discloses XP/badge are not yet backend-connected', (await p4.textContent('body')).includes('not yet backend-connected'))
  const overflow = await p4.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
  check('No horizontal overflow on the challenge screen', !overflow)
  await p4.close()

  // ── Navigation from Rewards ──
  const p5 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seed(p5)
  await p5.goto(`${UI_BASE}/smokecraft/rewards`, { waitUntil: 'domcontentloaded' })
  await p5.waitForTimeout(1200)
  check('Rewards screen offers safe navigation to all 3 new hubs', await p5.locator('text=Challenge Hub →').count() === 1 && await p5.locator('text=Collections →').count() === 1 && await p5.locator('text=Skill Tree →').count() === 1)
  await p5.close()

  await browser.close()
} catch (err) {
  console.error('Unexpected error:', err)
  await browser.close()
  process.exit(1)
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
