// Holistic Fix 2E-5 — dedicated five-viewport curriculum sweep.
// Real browser, all 21 primary curriculum session routes, at 5 viewports:
// handheld portrait, 10" tablet, 12" tablet, 15" display, desktop.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { chromium } from 'playwright'
import { VISIT_STRUCTURE } from './src/constants/session.js'

const BASE = process.env.SC_UI || 'http://localhost:5050'
const PROOF = 'public/proof/smokecraft-holistic-fix-2e-5'
fs.mkdirSync(PROOF, { recursive: true })

let pass = 0, fail = 0
const failures = []
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

const VIEWPORTS = [
  { label: 'handheld-portrait', w: 390, h: 844 },
  { label: '10in-tablet', w: 810, h: 1080 },
  { label: '12in-tablet', w: 1024, h: 1366 },
  { label: '15in-display', w: 1440, h: 900 },
  { label: 'desktop', w: 1920, h: 1080 },
]

const spine = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) spine.push({ ...s, visit: v.visit })
const primarySlots = spine.filter(s => !s.mergedInto)
const priorSteps = i => [...new Set(['enroll', 'identity', ...spine.slice(0, i).map(x => x.id)])]

const JOURNEY = { selectedVenue: { id: 'v1', name: 'Test Lounge' },
  selectedCigar: { name: 'Test Reserve Robusto', origin: 'Nicaragua', wrapper: 'Habano', strength: 'Medium', body: 'Medium', format: 'Robusto' } }

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const results = []

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } })
  const page = await ctx.newPage()
  for (const s of primarySlots) {
    const i = spine.findIndex(x => x.session === s.session)
    await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(([v, j]) => {
      localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: v, profile: { firstName: 'Test Player' } }))
      localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, identity: { preferredName: 'Test Player' }, ...j }))
    }, [priorSteps(i), JOURNEY])
    try {
      await page.goto(`${BASE}${s.route}`, { waitUntil: 'networkidle', timeout: 30000 })
    } catch {
      await page.goto(`${BASE}${s.route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(1500)
    }
    await page.waitForTimeout(150)

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }))
    const hOverflow = metrics.scrollWidth > metrics.clientWidth + 2

    assert(`Session ${s.session} @ ${vp.label} (${vp.w}x${vp.h}): no horizontal overflow`, !hOverflow, `scrollWidth=${metrics.scrollWidth} clientWidth=${metrics.clientWidth}`)

    results.push({ session: s.session, route: s.route, viewport: vp.label, hOverflow, ...metrics })
  }
  await ctx.close()
}

// Keyboard focus + pointer sanity check on one representative screen per viewport
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(([v, j]) => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: v, profile: { firstName: 'Test Player' } }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, identity: { preferredName: 'Test Player' }, ...j }))
  }, [['enroll', 'identity'], JOURNEY])
  await page.goto(`${BASE}/smokecraft/welcome`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(300)
  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => document.activeElement?.tagName || null)
  assert(`Session 1 @ ${vp.label}: Tab key moves focus to a real focusable element`, focused && focused !== 'BODY', `activeElement=${focused}`)
  await ctx.close()
}

await browser.close()

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===`)
fs.writeFileSync(`${PROOF}/05-five-viewport-results.json`, JSON.stringify({
  commit: execSync('git rev-parse HEAD').toString().trim(),
  pass, fail, failures, results,
}, null, 2))
if (fail > 0) process.exit(1)
