// Holistic Fix 2E-5 — real browser content-capture pass for the manual
// educational audit. Navigates to every one of the 27 curriculum sessions
// (seeding only the completedSteps/journey a real player would already
// hold on arrival, never faking the render itself), then captures the
// actual rendered text content of the screen. This is the evidence base
// for grading each session's educational completeness — not a source-code
// keyword scan, and not a fabricated grade.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { chromium } from 'playwright'
import { VISIT_STRUCTURE } from '../src/constants/session.js'

const BASE = process.env.SC_UI || 'http://localhost:5050'
const OUT = 'public/proof/smokecraft-holistic-fix-2e-5/03-session-content-capture.json'

const spine = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) spine.push({ ...s, visit: v.visit, visitTitle: v.title })
const priorSteps = i => [...new Set(['enroll', 'identity', ...spine.slice(0, i).map(x => x.id)])]

const JOURNEY = { selectedVenue: { id: 'v1', name: 'Test Lounge' },
  selectedCigar: { name: 'Test Reserve Robusto', origin: 'Nicaragua', wrapper: 'Habano', strength: 'Medium', body: 'Medium', format: 'Robusto' } }

const results = []
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

async function seed(ids) {
  await page.evaluate(([v, j]) => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: v, profile: { firstName: 'Test Player' } }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, identity: { preferredName: 'Test Player' }, ...j }))
  }, [ids, JOURNEY])
}

for (let i = 0; i < spine.length; i++) {
  const s = spine[i]
  if (s.mergedInto) continue // merged sessions share their primary session's route/content
  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
  await seed(priorSteps(i))
  try {
    await page.goto(`${BASE}${s.route}`, { waitUntil: 'networkidle', timeout: 45000 })
  } catch {
    await page.goto(`${BASE}${s.route}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(2000)
  }
  await page.waitForTimeout(300)
  const text = await page.evaluate(() => document.body.innerText).catch(() => '(capture failed)')
  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll('button, a, [role="button"]')].map(b => (b.innerText || b.getAttribute('aria-label') || '').trim()).filter(Boolean)
  ).catch(() => [])
  const images = await page.evaluate(() => [...document.querySelectorAll('img')].map(i => i.src)).catch(() => [])
  results.push({ session: s.session, route: s.route, mergedFrom: spine.filter(x => x.mergedInto === s.session).map(x => x.session), text, buttons, images })
  console.log(`captured session ${s.session} (${s.route}) — ${text.length} chars, ${buttons.length} controls`)
}

await browser.close()
fs.mkdirSync('public/proof/smokecraft-holistic-fix-2e-5', { recursive: true })
fs.writeFileSync(OUT, JSON.stringify({ capturedAt: new Date().toISOString(), commit: execSync('git rev-parse HEAD').toString().trim(), results }, null, 2))
console.log(`\nWrote ${OUT}`)
