#!/usr/bin/env node
// SmokeCraft 360 — Full Game Visual Audit (inspection only, no fixes).
// Captures the REAL, currently-rendered app in exact canonical player
// sequence, one full-viewport (1440x900) screenshot per distinct screen,
// numbered. No force-clicks, no fake state injection, no fabricated
// content — every screen is reached via real navigation/real clicks
// (reusing the same proven advance logic as
// scripts/proveSmokecraftFullRealBrowserJourney.mjs), or, for the one
// informational entry-layer screen (Resume) that a fresh first-time
// player never naturally lands on, via a direct real navigation after
// establishing a real guest identity (no fake data).
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = 'public/proof/smokecraft-owner-visual-audit'
mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 1440, height: 900 }

// Canonical sequence — global #, session, phase, screen name, route.
// Merged sessions (S8/9, S12/13, S16/17/18, S19/20, S25/26) are captured
// once each — they are literally the same route/component/visible state.
const SEQUENCE = [
  { n: 1,  session: null, phase: null, name: 'Launch',                     route: '/smokecraft' },
  { n: 2,  session: null, phase: null, name: 'Enroll (Sign In / Guest Mode)', route: '/smokecraft/enroll' },
  { n: 3,  session: null, phase: null, name: 'Identity (Personal Dashboard)', route: '/smokecraft/identity' },
  { n: 4,  session: null, phase: null, name: 'Venue Select',               route: '/smokecraft/venue-select' },
  { n: 5,  session: null, phase: null, name: 'Resume (returning-guest entry-layer screen)', route: '/smokecraft/resume' },
  { n: 6,  session: 1,  phase: 1, name: 'Welcome to Today\'s Experience', route: '/smokecraft/welcome' },
  { n: 7,  session: null, phase: null, name: 'Golden Box Rules (opening chain)', route: '/smokecraft/golden-box' },
  { n: 8,  session: null, phase: null, name: 'Mentor Selection (opening chain)', route: '/smokecraft/mentor-selection' },
  { n: 9,  session: null, phase: null, name: 'Seed & Soil (opening chain)', route: '/smokecraft/seed-soil' },
  { n: 10, session: 2,  phase: 1, name: 'Choose Your Cigar (Humidor Match)', route: '/smokecraft/humidor-match' },
  { n: 11, session: 3,  phase: 1, name: 'Meet Your Cigar',                route: '/smokecraft/meet-your-cigar' },
  { n: 12, session: 4,  phase: 1, name: 'Terroir',                        route: '/smokecraft/terroir' },
  { n: 13, session: 5,  phase: 1, name: 'Construction Inspection (Format)', route: '/smokecraft/format' },
  { n: 14, session: null, phase: null, name: 'Request / Purchase (supporting)', route: '/smokecraft/request-purchase' },
  { n: 15, session: 6,  phase: 1, name: 'Choose Your Cut',                route: '/smokecraft/cut-toast-light' },
  { n: 16, session: 7,  phase: 1, name: 'Lighting Tutorial',              route: '/smokecraft/lighting-tutorial' },
  { n: 17, session: '8/9', phase: 2, name: 'First Draw / Flavor Discovery (merged)', route: '/smokecraft/first-third' },
  { n: 18, session: 10, phase: 2, name: 'Flavor Memory Exercise',         route: '/smokecraft/flavor-memory' },
  { n: 19, session: 11, phase: 2, name: 'Suggested Pairings (Pairing Lab)', route: '/smokecraft/pairing-lab' },
  { n: 20, session: '12/13', phase: 3, name: 'Flavor Evolution / Construction Check (merged)', route: '/smokecraft/second-third' },
  { n: 21, session: 14, phase: 3, name: 'Mentor Commentary',              route: '/smokecraft/mentor-commentary' },
  { n: 22, session: 15, phase: 3, name: 'Knowledge Drop',                 route: '/smokecraft/knowledge-drop' },
  { n: 23, session: '16/17/18', phase: 4, name: 'Flavor Finish / Strength Progression / Overall Notes (merged)', route: '/smokecraft/final-third' },
  { n: 24, session: '19/20', phase: 5, name: 'Rate Every Category / Personal Notes (Scorecard, merged)', route: '/smokecraft/scorecard' },
  { n: 25, session: 21, phase: 6, name: 'AI Summary',                     route: '/smokecraft/ai-summary' },
  { n: 26, session: 22, phase: 6, name: 'Personalized Pairing Recommendations', route: '/smokecraft/pairing-recommendations' },
  { n: 27, session: 23, phase: 6, name: 'Passport Stamp Animation',       route: '/smokecraft/passport-stamp' },
  { n: 28, session: 24, phase: 6, name: 'Completed Scorecard (Final Review)', route: '/smokecraft/final-review' },
  { n: 29, session: '25/26', phase: 6, name: 'Rewards and XP / Achievements (merged)', route: '/smokecraft/rewards' },
  { n: 30, session: 27, phase: 6, name: 'Recommended Next Journey (Session Complete)', route: '/smokecraft/session-complete' },
]

function pad(n) { return String(n).padStart(3, '0') }
function slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) }

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: false })
  const page = await context.newPage()

  const results = []
  async function capture(entry, note = '') {
    await page.waitForTimeout(500)
    const filename = `${pad(entry.n)}-${slug(entry.name)}.png`
    await page.screenshot({ path: `${OUT}/${filename}` })
    const actualUrl = page.url().replace(BASE, '')
    results.push({ ...entry, filename, actualUrl, note })
    console.log(`  [${pad(entry.n)}] ${entry.name} -> ${filename} (actual url: ${actualUrl})`)
  }

  // 1. Launch
  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'networkidle', timeout: 25000 })
  await capture(SEQUENCE[0])

  // 2. Enroll
  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'networkidle', timeout: 25000 })
  await capture(SEQUENCE[1])
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 10000 })

  // 3. Identity
  await capture(SEQUENCE[2])
  await page.fill('input[aria-label="Full Name"]', 'Owner Visual Audit')
  await page.selectOption('select[aria-label="Cigar Experience Level"]', { index: 1 })
  await page.click('[data-testid="identity-begin"]')
  await page.waitForURL('**/smokecraft/venue-select', { timeout: 10000 })
  await page.waitForLoadState('networkidle')

  // 4. Venue Select
  await capture(SEQUENCE[3])
  await page.click('text=Alpha Lounge (Seed)')
  await page.click('text=Continue to Welcome')
  await page.waitForURL('**/smokecraft/welcome', { timeout: 10000 })

  // 5. Resume — a real guest identity now exists; this screen is real
  // for a returning guest, reached via real direct navigation (not fake
  // state — the guest/venue/identity data it displays are all real).
  await page.goto(`${BASE}/smokecraft/resume`, { waitUntil: 'networkidle', timeout: 25000 })
  await capture(SEQUENCE[4], 'Reached via direct navigation — informational entry-layer screen for returning guests, not part of a fresh first-time player\'s forward click path.')

  // Back to the real forward path.
  await page.goto(`${BASE}/smokecraft/welcome`, { waitUntil: 'networkidle', timeout: 25000 })
  await page.waitForTimeout(500)

  // 6. Welcome
  await capture(SEQUENCE[5])
  await page.click('text=Begin Experience')
  await page.waitForURL('**/smokecraft/golden-box', { timeout: 10000 })

  // 7 onward: drive through the rest of the real canonical chain using
  // the same proven per-screen advance logic as the full journey proof.
  const remaining = SEQUENCE.slice(6) // Golden Box Rules onward
  for (const entry of remaining) {
    await capture(entry)
    if (entry.name === 'Recommended Next Journey (Session Complete)') break
    await genericAdvance(page, { screenshotName: `advance-${slug(entry.name)}`, label: entry.name })
  }

  await browser.close()

  writeFileSync(`${OUT}/sequence-manifest.json`, JSON.stringify(results, null, 2))
  console.log(`\n${results.length} screens captured, numbered 001–${pad(results.length)}.`)
  console.log(`Manifest: ${OUT}/sequence-manifest.json`)
}

main().catch(e => { console.error(e); process.exit(1) })
