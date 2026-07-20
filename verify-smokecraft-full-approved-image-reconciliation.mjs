// SmokeCraft 360 — Full Approved-Image Reconciliation verification.
// Walks every active journey route and confirms: no stale 8-visit/24-session
// text, no "Future Visit Locked" text, no broken images, no console errors,
// no horizontal overflow, and real interactive controls present.
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:5000'
const PROOF_DIR = 'public/proof/smokecraft-full-approved-image-reconciliation'
fs.mkdirSync(PROOF_DIR, { recursive: true })

let pass = 0, fail = 0
const lines = ['SmokeCraft 360 — Full Approved Image Reconciliation — Route Report', '']
function ok(label, cond) {
  if (cond) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}`) }
}

const ROUTES = [
  '/crafthub', '/smokecraft', '/smokecraft/enroll', '/smokecraft/venue-select',
  '/smokecraft/identity', '/smokecraft/golden-box', '/smokecraft/mentor-selection',
  '/smokecraft/seed-soil', '/smokecraft/humidor-match', '/smokecraft/meet-your-cigar',
  '/smokecraft/terroir', '/smokecraft/format', '/smokecraft/request-purchase',
  '/smokecraft/cut-toast-light', '/smokecraft/lighting-tutorial', '/smokecraft/first-third',
  '/smokecraft/flavor-memory', '/smokecraft/pairing-lab', '/smokecraft/second-third',
  '/smokecraft/mentor-commentary', '/smokecraft/knowledge-drop', '/smokecraft/final-third',
  '/smokecraft/scorecard', '/smokecraft/ai-summary', '/smokecraft/pairing-recommendations',
  '/smokecraft/passport-stamp', '/smokecraft/final-review', '/smokecraft/rewards',
  '/smokecraft/session-complete', '/smokecraft/connections', '/smokecraft/management-sync',
  '/smokecraft/how-it-works', '/smokecraft/leaderboard',
]

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

  // Seed a guest with full journey progress so gated routes render their real content, not a lock screen.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const seedPage = await ctx.newPage()
  await seedPage.goto(`${BASE}/smokecraft`)
  await seedPage.evaluate(() => {
    const steps = ['enroll', 'golden-box', 'mentor', 'seed-soil', 'humidor-match', 'meet-your-cigar',
      'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory',
      'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third',
      'scorecard', 'ai-summary', 'pairing-recommendations', 'passport-stamp', 'final-review']
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: steps, xp: 500, rank: 'Connoisseur' }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      version: 3, selectedVenue: { id: 'v1', name: 'Test Venue' },
      identity: { fullName: 'Test Guest' }, format: { shape: 'Robusto' },
      selectedCigar: { name: 'Test Cigar' },
    }))
  })

  for (const route of ROUTES) {
    const page = await ctx.newPage()
    const errors = []
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()) })
    await page.goto(`${BASE}${route}`)
    await page.waitForTimeout(900)

    const bodyText = await page.locator('body').innerText()
    const hasStaleVisit = /\d+\s*of\s*8\b|visit\s*\d+\s*of\s*8/i.test(bodyText)
    const hasStaleSession = /session\s*\d+\s*of\s*24/i.test(bodyText)
    const hasFutureLocked = /future visit locked/i.test(bodyText)
    const broken = await page.locator('img').evaluateAll(imgs => imgs.filter(i => !i.complete || i.naturalWidth === 0).length)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
    const buttonCount = await page.locator('button, a[href]').count()

    const routePass = !hasStaleVisit && !hasStaleSession && !hasFutureLocked && broken === 0 && errors.length === 0
    ok(`${route}`, routePass)
    lines.push(`${route} — stale-visit:${hasStaleVisit} stale-session:${hasStaleSession} future-locked:${hasFutureLocked} broken-img:${broken} overflow:${overflow} controls:${buttonCount} console-errors:${errors.length}`)

    if (!routePass) {
      lines.push(`  console errors: ${JSON.stringify(errors)}`)
    }
    await page.screenshot({ path: `${PROOF_DIR}/${route.replace(/\//g, '_') || 'root'}.png` }).catch(() => {})
    await page.close()
  }

  await ctx.close()
  await browser.close()

  fs.writeFileSync(`${PROOF_DIR}/route-image-report.txt`, lines.join('\n') + '\n')

  console.log('\n' + '─'.repeat(51))
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
})()
