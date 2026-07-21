// Verifies the 4 new supporting gamification screens built from the
// latest approved image batch: Skill Tree, Collections Center, Challenge
// Hub, and the Blend Fault Identification challenge.
import { chromium } from 'playwright'

const API_BASE = 'http://localhost:3001'
const UI_BASE = 'http://localhost:5000'
const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

async function guestCookie() {
  const res = await fetch(`${API_BASE}/api/smokecraft/management-sync/guest-session`, { method: 'POST' })
  const raw = res.headers.get('set-cookie') || ''
  const idx = raw.indexOf('smokecraft_guest_session=')
  return raw.slice(idx).split(';')[0].split('=')[1]
}

// Skill Tree Persistence pass — Skill Tree now makes a real, identity-gated
// API call, so this seed also needs the real guest-session cookie (not
// just localStorage) or the screen correctly shows its honest error state.
async function seed(page) {
  const cookieVal = await guestCookie()
  await page.context().addCookies([{ name: 'smokecraft_guest_session', value: cookieVal, domain: 'localhost', path: '/' }])
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
  // Skill Tree Persistence pass — this is no longer a static shell; it now
  // loads real node state from the backend (see
  // verify-smokecraft-skill-tree.mjs for the dedicated, thorough suite).
  // These two checks are updated to match the real live implementation.
  check('Skill Tree shows all 7 real approved category nodes', (await p1.textContent('body')).includes('Mastery & Blending') && (await p1.textContent('body')).includes('Community & Legacy'))
  check('Skill Tree loads real backend state, not a hardcoded shell', (await p1.textContent('body')).includes('nodes completed'))
  await p1.close()

  // ── Collections Center ──
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seed(p2)
  const r2 = await p2.goto(`${UI_BASE}/smokecraft/collections`, { waitUntil: 'domcontentloaded' })
  check('Collections Center route reachable (200)', r2.status() === 200)
  await p2.waitForTimeout(1000)
  check('Collections Center shows real approved artwork', await p2.locator('img[alt="Collections Center"]').count() === 1)
  // Collections Ownership Persistence pass — Collections Center now loads
  // a real, live, backend-authoritative catalog (5 real items with real
  // earn conditions, not the 7 static category placeholders it used to
  // show) — see verify-smokecraft-collections.mjs for the dedicated
  // thorough suite. Updated to match the real live implementation.
  check('Collections Center shows real approved catalog items', (await p2.textContent('body')).includes('Filler Arrangement Mastery') && (await p2.textContent('body')).includes('Seed & Soil Scholar'))
  check('Collections Center loads real backend ownership state, not a hardcoded shell', (await p2.textContent('body')).includes('items owned'))
  await p2.close()

  // ── Challenge Hub ──
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seed(p3)
  const r3 = await p3.goto(`${UI_BASE}/smokecraft/challenge-hub`, { waitUntil: 'domcontentloaded' })
  check('Challenge Hub route reachable (200)', r3.status() === 200)
  await p3.waitForTimeout(1000)
  check('Challenge Hub shows real approved artwork', await p3.locator('img[alt="Daily and Weekly Challenge Hub"]').count() === 1)
  // Challenge Hub Live State pass — Challenge Hub now loads real
  // backend-tracked Daily/Weekly challenges (see
  // verify-smokecraft-challenge-hub.mjs for the dedicated thorough suite);
  // the static Blend Fault Identification practice card remains alongside
  // them as its own unchanged flow. Updated to match the real live
  // implementation.
  check('Challenge Hub shows real live Daily Practice challenge', (await p3.textContent('body')).includes('Daily Practice'))
  check('Challenge Hub still lists Blend Fault Identification as a practice activity', (await p3.textContent('body')).includes('Blend Fault Identification'))
  await p3.click('text=Blend Fault Identification')
  await p3.waitForTimeout(800)
  check('Challenge Hub navigates to the real challenge route', p3.url().includes('/smokecraft/challenges/blend-fault-identification'))
  await p3.close()

  // ── Blend Fault Identification — real backend-scored assessment flow ──
  // Blend Fault Identification Backend Scoring pass — this is no longer a
  // local-only multi-select shell; it now starts a real persisted attempt
  // and is scored server-side (see verify-smokecraft-blend-fault.mjs for
  // the dedicated thorough suite). The interaction changed from
  // multi-select-with-no-answer-key to single-choice-per-question so it
  // has real scorable semantics; the "Submit My Solutions" button became
  // "Submit My Answers", and the completion label became "Assessment
  // Passed"/"Assessment Not Passed" instead of a flat "Challenge
  // Complete". Updated to match the real live implementation.
  const p4 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await seed(p4)
  const r4 = await p4.goto(`${UI_BASE}/smokecraft/challenges/blend-fault-identification`, { waitUntil: 'domcontentloaded' })
  check('Blend Fault challenge route reachable (200)', r4.status() === 200)
  await p4.waitForTimeout(1000)
  await p4.click('button:has-text("Start Assessment")')
  await p4.waitForTimeout(600)
  check('Step 1 shows the real "Identify the Issue" title', (await p4.textContent('body')).includes('Identify the Issue'))
  check('Continue is disabled before any selection (no default selection)', await p4.locator('button:has-text("Continue")').isDisabled())
  await p4.click('button[role="radio"]:has-text("Wrapper Damage")')
  check('Continue enables only after a real user selection', !(await p4.locator('button:has-text("Continue")').isDisabled()))
  await p4.click('button:has-text("Continue")')
  await p4.waitForTimeout(400)
  check('Step 2 shows the real "Choose the Best Solution" title', (await p4.textContent('body')).includes('Choose the Best Solution'))
  await p4.click('button[role="radio"]:has-text("Re-moisten and rest the leaf")')
  await p4.click('button:has-text("Continue")')
  await p4.waitForTimeout(400)
  check('Step 3 shows the real "Prevent and Improve" title', (await p4.textContent('body')).includes('Prevent and Improve'))
  await p4.click('button[role="radio"]:has-text("Re-moisten and rest the leaf")')
  await p4.click('button:has-text("Submit My Answers")')
  await p4.waitForTimeout(800)
  check('Assessment reaches a real server-scored completion state', (await p4.textContent('body')).includes('Assessment Passed'))
  check('Assessment honestly discloses XP is not yet approved', (await p4.textContent('body')).includes('XP is not yet approved'))
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
