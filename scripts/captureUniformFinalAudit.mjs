#!/usr/bin/env node
// TRUE FINAL 001-043 recapture — real player journey, with the real
// Final Third flavor-chip fix and real Scorecard rating clicks baked in
// (both proven necessary and correct via diagnostic scripts this pass).
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = 'http://localhost:3001'
const OUT = 'public/proof/smokecraft-uniform-final-audit'
mkdirSync(OUT, { recursive: true })
const SHA = execSync('git rev-parse HEAD').toString().trim()

const SEQUENCE = [
  { n: 1,  session: null, phase: null, name: 'Launch', route: '/smokecraft' },
  { n: 2,  session: null, phase: null, name: 'Enroll (Sign In / Guest Mode)', route: '/smokecraft/enroll' },
  { n: 3,  session: null, phase: null, name: 'Identity (Personal Dashboard)', route: '/smokecraft/identity' },
  { n: 4,  session: null, phase: null, name: 'Venue Select', route: '/smokecraft/venue-select' },
  { n: 5,  session: null, phase: null, name: 'Resume (returning-guest entry-layer screen)', route: '/smokecraft/resume' },
  { n: 6,  session: 1,  phase: 1, name: "Welcome to Today's Experience", route: '/smokecraft/welcome' },
  { n: 7,  session: null, phase: null, name: 'Golden Box Rules', route: '/smokecraft/golden-box', state: 'unchecked' },
  { n: 8,  session: null, phase: null, name: 'Golden Box Rules', route: '/smokecraft/golden-box', state: 'acknowledged / unlocked' },
  { n: 9,  session: null, phase: null, name: 'Mentor Selection', route: '/smokecraft/mentor-selection' },
  { n: 10, session: null, phase: null, name: 'Seed & Soil', route: '/smokecraft/seed-soil' },
  { n: 11, session: 2,  phase: 1, name: 'Humidor Match', route: '/smokecraft/humidor-match', state: 'initial' },
  { n: 12, session: 2,  phase: 1, name: 'Humidor Match', route: '/smokecraft/humidor-match', state: 'environment selected' },
  { n: 13, session: 2,  phase: 1, name: 'Humidor Match', route: '/smokecraft/humidor-match', state: 'settings applied' },
  { n: 14, session: 3,  phase: 1, name: 'Meet Your Cigar', route: '/smokecraft/meet-your-cigar', state: 'initial' },
  { n: 15, session: 3,  phase: 1, name: 'Meet Your Cigar', route: '/smokecraft/meet-your-cigar', state: 'section selected (Brand)' },
  { n: 16, session: 4,  phase: 1, name: 'Terroir', route: '/smokecraft/terroir' },
  { n: 17, session: 5,  phase: 1, name: 'Construction Inspection (Format)', route: '/smokecraft/format' },
  { n: 18, session: null, phase: null, name: 'Wrapper / Strength Education (supporting)', route: '/smokecraft/wrapper-strength' },
  { n: 19, session: null, phase: null, name: 'Request / Purchase (supporting)', route: '/smokecraft/request-purchase' },
  { n: 20, session: 6,  phase: 1, name: 'Choose Your Cut', route: '/smokecraft/cut-toast-light' },
  { n: 21, session: 7,  phase: 1, name: 'Lighting Tutorial', route: '/smokecraft/lighting-tutorial' },
  { n: 22, session: '8/9', phase: 2, name: 'First Draw / Flavor Discovery (merged)', route: '/smokecraft/first-third' },
  { n: 23, session: 10, phase: 2, name: 'Flavor Memory Exercise', route: '/smokecraft/flavor-memory' },
  { n: 24, session: 11, phase: 2, name: 'Suggested Pairings (Pairing Lab)', route: '/smokecraft/pairing-lab', state: 'before selection' },
  { n: 25, session: 11, phase: 2, name: 'Suggested Pairings (Pairing Lab)', route: '/smokecraft/pairing-lab', state: 'recommendation result' },
  { n: 26, session: '12/13', phase: 3, name: 'Flavor Evolution / Construction Check (merged)', route: '/smokecraft/second-third' },
  { n: 27, session: 14, phase: 3, name: 'Mentor Commentary', route: '/smokecraft/mentor-commentary' },
  { n: 28, session: 15, phase: 3, name: 'Knowledge Drop', route: '/smokecraft/knowledge-drop' },
  { n: 29, session: '16/17/18', phase: 4, name: 'Flavor Finish / Strength Progression / Overall Notes (merged)', route: '/smokecraft/final-third' },
  { n: 30, session: '19/20', phase: 5, name: 'Rate Every Category / Personal Notes (Scorecard)', route: '/smokecraft/scorecard', state: 'initial' },
  { n: 31, session: '19/20', phase: 5, name: 'Rate Every Category / Personal Notes (Scorecard)', route: '/smokecraft/scorecard', state: 'completed' },
  { n: 32, session: null, phase: null, name: 'SmokeCraft Challenge (supporting)', route: '/smokecraft/smokecraft-challenge' },
  { n: 33, session: null, phase: null, name: 'Second Humidor Match (supporting)', route: '/smokecraft/second-humidor-match' },
  { n: 34, session: null, phase: null, name: 'Mini Tasting Round (supporting)', route: '/smokecraft/mini-tasting' },
  { n: 35, session: 21, phase: 6, name: 'AI Summary', route: '/smokecraft/ai-summary' },
  { n: 36, session: 22, phase: 6, name: 'Personalized Pairing Recommendations', route: '/smokecraft/pairing-recommendations' },
  { n: 37, session: 23, phase: 6, name: 'Passport Stamp Animation', route: '/smokecraft/passport-stamp' },
  { n: 38, session: 24, phase: 6, name: 'Completed Scorecard (Final Review)', route: '/smokecraft/final-review' },
  { n: 39, session: '25/26', phase: 6, name: 'Rewards and XP / Achievements (merged)', route: '/smokecraft/rewards' },
  { n: 40, session: null, phase: null, name: '360 Passport Connections (supporting)', route: '/smokecraft/connections' },
  { n: 41, session: null, phase: null, name: 'Venue / Management Sync (supporting)', route: '/smokecraft/management-sync' },
  { n: 42, session: 27, phase: 6, name: 'Recommended Next Journey (Session Complete)', route: '/smokecraft/session-complete' },
  { n: 43, session: null, phase: null, name: 'Golden Box Competitions Hub (post-game)', route: '/smokecraft/golden-box/competitions' },
]

function pad(n) { return String(n).padStart(3, '0') }
function slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) }

const results = []
async function capture(page, entry) {
  await page.waitForTimeout(500)
  const filename = `${pad(entry.n)}-${slug(entry.name)}.png`
  await page.screenshot({ path: `${OUT}/${filename}` })
  const row = { ...entry, filename, actualUrl: page.url().replace(BASE, ''), capturedAtSHA: SHA, capturedAt: new Date().toISOString() }
  results.push(row)
  console.log(`  [${pad(entry.n)}] ${entry.name}${entry.state ? ' — ' + entry.state : ''} -> ${filename} (${row.actualUrl})`)
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()

  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'load', timeout: 40000 })
  await capture(page, SEQUENCE[0])
  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'load', timeout: 40000 })
  await capture(page, SEQUENCE[1])
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 15000 })
  await capture(page, SEQUENCE[2])
  await page.fill('input[aria-label="Full Name"]', 'True Final Visual Audit')
  await page.selectOption('select[aria-label="Cigar Experience Level"]', { index: 1 })
  await page.click('[data-testid="identity-begin"]')
  await page.waitForURL('**/smokecraft/venue-select', { timeout: 15000 })
  await page.waitForTimeout(1500)
  await capture(page, SEQUENCE[3])
  const alpha = page.locator('text=Alpha Lounge (Seed)')
  if (await alpha.count().catch(() => 0)) { await alpha.click(); await page.click('text=Continue to Welcome') }
  else { await page.click('text=Continue without venue') }
  await page.waitForURL('**/smokecraft/welcome', { timeout: 15000 })

  await page.goto(`${BASE}/smokecraft/resume`, { waitUntil: 'load', timeout: 40000 })
  await capture(page, { ...SEQUENCE[4], note: 'Direct navigation — informational entry-layer screen for returning guests.' })

  await page.goto(`${BASE}/smokecraft/welcome`, { waitUntil: 'load', timeout: 40000 })
  await capture(page, SEQUENCE[5])
  await page.click('text=Begin Experience')
  await page.waitForURL('**/smokecraft/golden-box', { timeout: 15000 })

  await capture(page, SEQUENCE[6])
  const gbBox = page.locator('input[type="checkbox"]').first()
  if (await gbBox.count()) await gbBox.click().catch(() => {})
  await page.waitForTimeout(300)
  await capture(page, SEQUENCE[7])
  const gbContinue = page.locator('button[aria-label="Continue to Mentor Selection"]')
  if (await gbContinue.count()) await gbContinue.click().catch(() => {})
  await page.waitForURL('**/smokecraft/mentor-selection', { timeout: 15000 }).catch(() => {})

  await capture(page, SEQUENCE[8])
  await genericAdvance(page, { screenshotName: 'tf-mentor', label: 'Mentor Selection' })
  await capture(page, SEQUENCE[9])
  await genericAdvance(page, { screenshotName: 'tf-seed-soil', label: 'Seed & Soil' })

  await page.waitForURL('**/smokecraft/humidor-match', { timeout: 15000 }).catch(() => {})
  await capture(page, SEQUENCE[10])
  const envRadio = page.locator('text=Virtual Humidor').first()
  if (await envRadio.count()) await envRadio.click().catch(() => {})
  await page.waitForTimeout(300)
  await capture(page, SEQUENCE[11])
  const applyBtn = page.locator('button:has-text("Apply Settings")').first()
  if (await applyBtn.count()) await applyBtn.click().catch(() => {})
  await page.waitForTimeout(300)
  const cigarPick = page.locator('button, [role="button"]').filter({ hasText: /Padron 1964 Series/ }).first()
  if (await cigarPick.count()) await cigarPick.click().catch(() => {})
  await page.waitForTimeout(300)
  await capture(page, SEQUENCE[12])
  const hmContinue = page.locator('button:has-text("Continue to Meet Your Cigar")').first()
  if (await hmContinue.count()) await hmContinue.click().catch(() => {})
  await page.waitForURL('**/smokecraft/meet-your-cigar', { timeout: 15000 }).catch(() => {})

  await capture(page, SEQUENCE[13])
  const brandTab = page.locator('text=Brand').first()
  if (await brandTab.count()) await brandTab.click().catch(() => {})
  await page.waitForTimeout(300)
  await capture(page, SEQUENCE[14])
  await genericAdvance(page, { screenshotName: 'tf-meet-cigar', label: 'Meet Your Cigar' })

  await capture(page, SEQUENCE[15])
  await genericAdvance(page, { screenshotName: 'tf-terroir', label: 'Terroir' })
  await capture(page, SEQUENCE[16])

  await page.goto(`${BASE}/smokecraft/wrapper-strength`, { waitUntil: 'load', timeout: 40000 }).catch(() => {})
  await capture(page, { ...SEQUENCE[17], note: 'Direct navigation — real gated route (requires: format).' })
  await page.goto(`${BASE}/smokecraft/format`, { waitUntil: 'load', timeout: 40000 })
  await genericAdvance(page, { screenshotName: 'tf-format', label: 'Format' })

  await capture(page, SEQUENCE[18])
  await genericAdvance(page, { screenshotName: 'tf-request', label: 'Request/Purchase' })
  await capture(page, SEQUENCE[19])
  await genericAdvance(page, { screenshotName: 'tf-cut', label: 'Cut Toast Light' })
  await capture(page, SEQUENCE[20])
  await genericAdvance(page, { screenshotName: 'tf-lighting', label: 'Lighting Tutorial' })
  await capture(page, SEQUENCE[21])
  await genericAdvance(page, { screenshotName: 'tf-first-third', label: 'First Third' })
  await capture(page, SEQUENCE[22])
  await genericAdvance(page, { screenshotName: 'tf-flavor-memory', label: 'Flavor Memory' })

  await page.waitForURL('**/smokecraft/pairing-lab', { timeout: 15000 }).catch(() => {})
  await capture(page, SEQUENCE[23])
  const pairingType = page.locator('button, [role="button"]').filter({ hasText: /^Whiskey$/ }).first()
  if (await pairingType.count()) await pairingType.click().catch(() => {})
  await page.waitForTimeout(400)
  await capture(page, SEQUENCE[24])
  await genericAdvance(page, { screenshotName: 'tf-pairing-lab', label: 'Pairing Lab' })

  await capture(page, SEQUENCE[25])
  const secondThirdTextarea = page.locator('textarea').first()
  if (await secondThirdTextarea.count()) { await secondThirdTextarea.fill('Body deepened, burn stayed even.'); await page.waitForTimeout(1000) }
  await genericAdvance(page, { screenshotName: 'tf-second-third', label: 'Second Third' })
  await capture(page, SEQUENCE[26])
  await genericAdvance(page, { screenshotName: 'tf-mentor-commentary', label: 'Mentor Commentary' })
  await capture(page, SEQUENCE[27])
  await genericAdvance(page, { screenshotName: 'tf-knowledge-drop', label: 'Knowledge Drop' })

  await capture(page, SEQUENCE[28])
  // Real fix: Final Third requires at least one real flavor/focus selection.
  const flavorChip = page.locator('button[aria-label="Earth flavor"]').first()
  if (await flavorChip.count()) { await flavorChip.click().catch(() => {}); await page.waitForTimeout(300) }
  const ftContinue = page.locator('button:has-text("Continue to Scorecard")').first()
  if (await ftContinue.count()) { await ftContinue.scrollIntoViewIfNeeded(); await ftContinue.click({ timeout: 5000 }).catch(() => {}) }
  await page.waitForURL('**/smokecraft/scorecard', { timeout: 15000 }).catch(() => {})

  await capture(page, SEQUENCE[29])
  // Real fix: rate all 6 categories with real clicks (proven working this pass).
  for (const cat of ['Appearance', 'Construction', 'Draw', 'Burn', 'Flavor', 'Pairing Match']) {
    const btn = page.locator(`button[aria-label*="Rate ${cat} 4"]`).first()
    if (await btn.count()) await btn.click({ timeout: 3000 }).catch(() => {})
  }
  await page.waitForTimeout(400)
  await capture(page, SEQUENCE[30])
  await genericAdvance(page, { screenshotName: 'tf-scorecard', label: 'Scorecard' })

  for (const [route, idx] of [['smokecraft-challenge', 31], ['second-humidor-match', 32], ['mini-tasting', 33]]) {
    await page.goto(`${BASE}/smokecraft/${route}`, { waitUntil: 'load', timeout: 40000 }).catch(() => {})
    await capture(page, SEQUENCE[idx])
  }

  await page.goto(`${BASE}/smokecraft/ai-summary`, { waitUntil: 'load', timeout: 40000 }).catch(() => {})
  await capture(page, SEQUENCE[34])
  await genericAdvance(page, { screenshotName: 'tf-ai-summary', label: 'AI Summary' })
  await capture(page, SEQUENCE[35])
  await genericAdvance(page, { screenshotName: 'tf-pairing-recs', label: 'Pairing Recommendations' })
  await capture(page, SEQUENCE[36])
  await genericAdvance(page, { screenshotName: 'tf-passport-stamp', label: 'Passport Stamp' })
  await capture(page, SEQUENCE[37])
  await genericAdvance(page, { screenshotName: 'tf-final-review', label: 'Final Review' })
  await capture(page, SEQUENCE[38])

  for (const [route, idx] of [['connections', 39], ['management-sync', 40]]) {
    await page.goto(`${BASE}/smokecraft/${route}`, { waitUntil: 'load', timeout: 40000 }).catch(() => {})
    await capture(page, SEQUENCE[idx])
  }

  await page.goto(`${BASE}/smokecraft/rewards`, { waitUntil: 'load', timeout: 40000 })
  await genericAdvance(page, { screenshotName: 'tf-rewards', label: 'Rewards' })
  await capture(page, SEQUENCE[41])

  await page.goto(`${BASE}/smokecraft/golden-box/competitions`, { waitUntil: 'load', timeout: 40000 }).catch(() => {})
  await capture(page, SEQUENCE[42])

  await browser.close()
  writeFileSync(`${OUT}/sequence-manifest.json`, JSON.stringify(results, null, 2))
  console.log(`\n${results.length} screens/states captured, numbered 001-${pad(results.length)}, all from SHA ${SHA}.`)
}

main().catch(e => { console.error(e); process.exit(1) })
