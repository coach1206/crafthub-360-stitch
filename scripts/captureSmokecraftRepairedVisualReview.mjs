#!/usr/bin/env node
// SmokeCraft 360 — Complete Owner Visual Inspection (inspection only).
// Captures the REAL, currently-rendered app: every canonical screen AND
// every meaningful internal state a real player produces via real
// interaction (no force-clicks, no fake state, no fabricated content),
// in strict player-journey order, plus the supporting-module routes
// that the prior 30-screen pass did not visit (wrapper-strength,
// smokecraft-challenge, second-humidor-match, mini-tasting, connections,
// management-sync) and the Golden Box post-game competition hub.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = 'public/proof/smokecraft-owner-repaired-visual-review'
mkdirSync(OUT, { recursive: true })
const VIEWPORT = { width: 1440, height: 900 }

const results = []
let n = 0
function pad(x) { return String(x).padStart(3, '0') }
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50) }

async function capture(page, meta) {
  n += 1
  await page.waitForTimeout(500)
  const filename = `${pad(n)}-${slug(meta.name)}.png`
  await page.screenshot({ path: `${OUT}/${filename}` })
  const actualUrl = page.url().replace(BASE, '')
  const row = { n, ...meta, filename, actualUrl }
  results.push(row)
  console.log(`  [${pad(n)}] ${meta.name}${meta.state ? ' — ' + meta.state : ''} -> ${filename} (${actualUrl})`)
  return row
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()

  // ---- Entry layer ----
  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'networkidle', timeout: 25000 })
  await capture(page, { phase: null, session: null, substep: null, name: 'Launch', route: '/smokecraft' })

  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'networkidle', timeout: 25000 })
  await capture(page, { phase: null, session: null, substep: null, name: 'Enroll (Sign In / Guest Mode)', route: '/smokecraft/enroll' })
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 10000 })

  await capture(page, { phase: null, session: null, substep: null, name: 'Identity (Personal Dashboard)', route: '/smokecraft/identity' })
  await page.fill('input[aria-label="Full Name"]', 'Owner Complete Inspection')
  await page.selectOption('select[aria-label="Cigar Experience Level"]', { index: 1 })
  await page.click('[data-testid="identity-begin"]')
  await page.waitForURL('**/smokecraft/venue-select', { timeout: 10000 })
  await page.waitForLoadState('networkidle')

  await capture(page, { phase: null, session: null, substep: null, name: 'Venue Select', route: '/smokecraft/venue-select' })
  await page.click('text=Alpha Lounge (Seed)')
  await page.click('text=Continue to Welcome')
  await page.waitForURL('**/smokecraft/welcome', { timeout: 10000 })

  await page.goto(`${BASE}/smokecraft/resume`, { waitUntil: 'networkidle', timeout: 25000 })
  await capture(page, { phase: null, session: null, substep: null, name: 'Resume (returning-guest entry-layer screen)', route: '/smokecraft/resume', note: 'Direct navigation — redirects to Launch/CraftHub for this guest state; see reconciliation doc.' })

  await page.goto(`${BASE}/smokecraft/welcome`, { waitUntil: 'networkidle', timeout: 25000 })
  await page.waitForTimeout(500)
  await capture(page, { phase: 1, session: 1, substep: null, name: "Welcome to Today's Experience", route: '/smokecraft/welcome' })
  await page.click('text=Begin Experience')
  await page.waitForURL('**/smokecraft/golden-box', { timeout: 10000 })

  // ---- Golden Box Rules — 2 states ----
  await page.waitForTimeout(500)
  await capture(page, { phase: null, session: null, substep: null, name: 'Golden Box Rules', route: '/smokecraft/golden-box', state: 'unchecked' })
  const gbCheckbox = page.locator('input[type="checkbox"]').first()
  await gbCheckbox.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(300)
  await capture(page, { phase: null, session: null, substep: null, name: 'Golden Box Rules', route: '/smokecraft/golden-box', state: 'acknowledged / unlocked' })
  const gbContinue = page.locator('button[aria-label="Continue to Mentor Selection"]')
  if (await gbContinue.count()) await gbContinue.click({ timeout: 3000 }).catch(() => {})
  await page.waitForURL('**/smokecraft/mentor-selection', { timeout: 10000 }).catch(() => {})

  await capture(page, { phase: null, session: null, substep: null, name: 'Mentor Selection', route: '/smokecraft/mentor-selection' })
  await genericAdvance(page, { screenshotName: 'adv-mentor', label: 'Mentor Selection' })

  await capture(page, { phase: null, session: null, substep: null, name: 'Seed & Soil', route: '/smokecraft/seed-soil' })
  await genericAdvance(page, { screenshotName: 'adv-seed-soil', label: 'Seed & Soil' })

  // ---- Humidor Match — 3 states ----
  await page.waitForURL('**/smokecraft/humidor-match', { timeout: 10000 }).catch(() => {})
  await capture(page, { phase: 1, session: 2, substep: null, name: 'Humidor Match', route: '/smokecraft/humidor-match', state: 'initial' })
  const envRadio = page.locator('text=Virtual Humidor').first()
  if (await envRadio.count()) await envRadio.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(300)
  await capture(page, { phase: 1, session: 2, substep: null, name: 'Humidor Match', route: '/smokecraft/humidor-match', state: 'environment selected' })
  const applyBtn = page.locator('button:has-text("Apply Settings")').first()
  if (await applyBtn.count()) await applyBtn.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(300)
  await capture(page, { phase: 1, session: 2, substep: null, name: 'Humidor Match', route: '/smokecraft/humidor-match', state: 'settings applied' })
  await genericAdvance(page, { screenshotName: 'adv-humidor', label: 'Humidor Match' })

  // ---- Meet Your Cigar — 2 states ----
  await page.waitForURL('**/smokecraft/meet-your-cigar', { timeout: 10000 }).catch(() => {})
  await capture(page, { phase: 1, session: 3, substep: null, name: 'Meet Your Cigar', route: '/smokecraft/meet-your-cigar', state: 'initial' })
  const tab = page.locator('text=Brand').first()
  if (await tab.count()) await tab.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(300)
  await capture(page, { phase: 1, session: 3, substep: null, name: 'Meet Your Cigar', route: '/smokecraft/meet-your-cigar', state: 'section selected (Brand)' })
  await genericAdvance(page, { screenshotName: 'adv-meet-cigar', label: 'Meet Your Cigar' })

  await capture(page, { phase: 1, session: 4, substep: null, name: 'Terroir', route: '/smokecraft/terroir' })
  await genericAdvance(page, { screenshotName: 'adv-terroir', label: 'Terroir' })

  await capture(page, { phase: 1, session: 5, substep: null, name: 'Construction Inspection (Format)', route: '/smokecraft/format' })

  // ---- Wrapper / Strength Education (supporting, requires format) ----
  await page.goto(`${BASE}/smokecraft/wrapper-strength`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
  await capture(page, { phase: null, session: null, substep: null, name: 'Wrapper / Strength Education (supporting)', route: '/smokecraft/wrapper-strength', note: 'Reached via direct navigation after Format — real gated route (requires: format).' })
  await page.goto(`${BASE}/smokecraft/format`, { waitUntil: 'networkidle', timeout: 25000 })
  await genericAdvance(page, { screenshotName: 'adv-format', label: 'Format' })

  await capture(page, { phase: null, session: null, substep: null, name: 'Request / Purchase (supporting)', route: '/smokecraft/request-purchase' })
  await genericAdvance(page, { screenshotName: 'adv-request-purchase', label: 'Request/Purchase' })

  await capture(page, { phase: 1, session: 6, substep: null, name: 'Choose Your Cut', route: '/smokecraft/cut-toast-light' })
  await genericAdvance(page, { screenshotName: 'adv-cut-toast', label: 'Cut Toast Light' })

  await capture(page, { phase: 1, session: 7, substep: null, name: 'Lighting Tutorial', route: '/smokecraft/lighting-tutorial' })
  await genericAdvance(page, { screenshotName: 'adv-lighting', label: 'Lighting Tutorial' })

  await capture(page, { phase: 2, session: '8/9', substep: null, name: 'First Draw / Flavor Discovery (merged)', route: '/smokecraft/first-third' })
  await genericAdvance(page, { screenshotName: 'adv-first-third', label: 'First Third' })

  await capture(page, { phase: 2, session: 10, substep: null, name: 'Flavor Memory Exercise', route: '/smokecraft/flavor-memory' })
  await genericAdvance(page, { screenshotName: 'adv-flavor-memory', label: 'Flavor Memory' })

  // ---- Pairing Lab — 2 states ----
  await page.waitForURL('**/smokecraft/pairing-lab', { timeout: 10000 }).catch(() => {})
  await capture(page, { phase: 2, session: 11, substep: null, name: 'Suggested Pairings (Pairing Lab)', route: '/smokecraft/pairing-lab', state: 'before selection' })
  const pairingType = page.locator('button, [role="button"]').filter({ hasText: /^Whiskey$/ }).first()
  if (await pairingType.count()) await pairingType.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(400)
  await capture(page, { phase: 2, session: 11, substep: null, name: 'Suggested Pairings (Pairing Lab)', route: '/smokecraft/pairing-lab', state: 'recommendation result' })
  await genericAdvance(page, { screenshotName: 'adv-pairing-lab', label: 'Pairing Lab' })

  await capture(page, { phase: 3, session: '12/13', substep: null, name: 'Flavor Evolution / Construction Check (merged)', route: '/smokecraft/second-third' })
  // Targeted real interaction to actually reach Mentor Commentary (generic
  // advance alone was proven insufficient for this transition in the prior
  // pass): fill the observation textarea, let autosave settle, then advance.
  const secondThirdTextarea = page.locator('textarea').first()
  if (await secondThirdTextarea.count()) {
    await secondThirdTextarea.fill('Body deepened, burn stayed even, aromas grew richer through the second third.')
    await page.waitForTimeout(1200)
  }
  await genericAdvance(page, { screenshotName: 'adv-second-third', label: 'Second Third' })

  const reachedMentorCommentary = page.url().includes('mentor-commentary')
  await capture(page, { phase: 3, session: 14, substep: null, name: 'Mentor Commentary', route: '/smokecraft/mentor-commentary', note: reachedMentorCommentary ? undefined : `Not reached via real interaction — still on ${page.url().replace(BASE, '')}; see reconciliation doc.` })
  if (!reachedMentorCommentary) {
    await page.goto(`${BASE}/smokecraft/mentor-commentary`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
  }
  await genericAdvance(page, { screenshotName: 'adv-mentor-commentary', label: 'Mentor Commentary' })

  await capture(page, { phase: 3, session: 15, substep: null, name: 'Knowledge Drop', route: '/smokecraft/knowledge-drop' })
  await genericAdvance(page, { screenshotName: 'adv-knowledge-drop', label: 'Knowledge Drop' })

  await capture(page, { phase: 4, session: '16/17/18', substep: null, name: 'Flavor Finish / Strength Progression / Overall Notes (merged)', route: '/smokecraft/final-third' })
  await genericAdvance(page, { screenshotName: 'adv-final-third', label: 'Final Third' })

  // ---- Scorecard — 2 states ----
  await page.waitForURL('**/smokecraft/scorecard', { timeout: 10000 }).catch(() => {})
  await capture(page, { phase: 5, session: '19/20', substep: null, name: 'Rate Every Category / Personal Notes (Scorecard)', route: '/smokecraft/scorecard', state: 'initial' })
  // Real interaction: click every visible circular rating control once
  // (best-effort — selectors are generic, not a guaranteed "completed" state).
  const ratingButtons = page.locator('button')
  const count = await ratingButtons.count().catch(() => 0)
  for (let i = 0; i < Math.min(count, 40); i++) {
    const b = ratingButtons.nth(i)
    const box = await b.boundingBox().catch(() => null)
    if (box && box.width < 40 && box.width > 10 && box.height < 40) {
      await b.click({ timeout: 1000 }).catch(() => {})
    }
  }
  await page.waitForTimeout(200)
  await capture(page, { phase: 5, session: '19/20', substep: null, name: 'Rate Every Category / Personal Notes (Scorecard)', route: '/smokecraft/scorecard', state: 'after real interaction attempt', note: 'Rating-control automation was not reliable via generic selectors; state reflects best-effort real interaction, not a fabricated "completed" state.' })
  await genericAdvance(page, { screenshotName: 'adv-scorecard', label: 'Scorecard' })

  // ---- Scorecard-gated supporting modules ----
  for (const [route, label] of [
    ['smokecraft-challenge', 'SmokeCraft Challenge (supporting)'],
    ['second-humidor-match', 'Second Humidor Match (supporting)'],
    ['mini-tasting', 'Mini Tasting Round (supporting)'],
  ]) {
    await page.goto(`${BASE}/smokecraft/${route}`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
    await capture(page, { phase: null, session: null, substep: null, name: label, route: `/smokecraft/${route}`, note: 'Reached via direct navigation after Scorecard — real gated route (requires: scorecard).' })
  }

  await page.goto(`${BASE}/smokecraft/ai-summary`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
  await capture(page, { phase: 6, session: 21, substep: null, name: 'AI Summary', route: '/smokecraft/ai-summary' })
  await genericAdvance(page, { screenshotName: 'adv-ai-summary', label: 'AI Summary' })

  await capture(page, { phase: 6, session: 22, substep: null, name: 'Personalized Pairing Recommendations', route: '/smokecraft/pairing-recommendations' })
  await genericAdvance(page, { screenshotName: 'adv-pairing-recs', label: 'Pairing Recommendations' })

  await capture(page, { phase: 6, session: 23, substep: null, name: 'Passport Stamp Animation', route: '/smokecraft/passport-stamp' })
  await genericAdvance(page, { screenshotName: 'adv-passport-stamp', label: 'Passport Stamp' })

  await capture(page, { phase: 6, session: 24, substep: null, name: 'Completed Scorecard (Final Review)', route: '/smokecraft/final-review' })
  await genericAdvance(page, { screenshotName: 'adv-final-review', label: 'Final Review' })

  await capture(page, { phase: 6, session: '25/26', substep: null, name: 'Rewards and XP / Achievements (merged)', route: '/smokecraft/rewards' })

  // ---- Passport-stamp-gated supporting modules ----
  for (const [route, label] of [
    ['connections', '360 Passport Connections (supporting)'],
    ['management-sync', 'Venue / Management Sync (supporting)'],
  ]) {
    await page.goto(`${BASE}/smokecraft/${route}`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
    await capture(page, { phase: null, session: null, substep: null, name: label, route: `/smokecraft/${route}`, note: 'Reached via direct navigation after Passport Stamp — real gated route (requires: passport-stamp).' })
  }

  await page.goto(`${BASE}/smokecraft/rewards`, { waitUntil: 'networkidle', timeout: 25000 })
  await genericAdvance(page, { screenshotName: 'adv-rewards', label: 'Rewards' })
  await capture(page, { phase: 6, session: 27, substep: null, name: 'Recommended Next Journey (Session Complete)', route: '/smokecraft/session-complete' })

  // ---- Golden Box post-game competition hub ----
  await page.goto(`${BASE}/smokecraft/golden-box/competitions`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
  await capture(page, { phase: null, session: null, substep: null, name: 'Golden Box Competitions Hub (post-game)', route: '/smokecraft/golden-box/competitions', note: 'Post-game competition entry point only; the deeper multi-actor Build Studio/Presentation/Defense/Judging flow requires creating a real competition entry and was not captured in this pass — see reconciliation doc.' })

  await browser.close()
  writeFileSync(`${OUT}/sequence-manifest.json`, JSON.stringify(results, null, 2))
  console.log(`\n${results.length} screens/states captured, numbered 001–${pad(results.length)}.`)
}

main().catch(e => { console.error(e); process.exit(1) })
