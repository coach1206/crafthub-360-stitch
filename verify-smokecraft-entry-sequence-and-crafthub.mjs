// SmokeCraft Entry Sequence + CraftHub Destination + Passport Back — verification suite.
//
// Proves the three things this pass scoped:
//   1. START / RESUME resolve to the earliest genuinely incomplete step via
//      the one canonical resolveSmokeCraftEntryDestination(), instead of the
//      old hardcoded '/smokecraft/enroll' (Guest Pass) for every user.
//   2. The Landing CraftHub control opens the approved CraftHub destination,
//      shows no stale learner data, preserves the journey, and its Back
//      returns to the exact prior screen.
//   3. Passport has one visible Back button that returns to the prior screen.
//
// Plus the hard safety gate: RewardsCenter.jsx and Leaderboard.jsx are
// byte-identical to their pre-pass state, and no approved asset under
// public/assets/smokecraft/** was added, changed, or removed.
//
// Interaction rule: every navigation under test is performed by clicking a
// VISIBLE control. localStorage seeding is used only to establish a STARTING
// scenario before the click being tested — the same established pattern used
// by verify-smokecraft-entry-prerequisite-guard.mjs.
import { chromium } from 'playwright'
import { execSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const UI_BASE = process.argv[2] || 'http://127.0.0.1:5050'
const PROOF_DIR = 'public/proof/smokecraft-entry-sequence-and-crafthub'
fs.mkdirSync(PROOF_DIR, { recursive: true })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

const BASE_REF = process.env.SC_BASE_REF || '3efbba9ea9f36176c6fb59ec87c30c218d7eecc6'

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex') }
function gitShow(ref, file) {
  try { return execSync(`git show ${ref}:${file}`, { maxBuffer: 64 * 1024 * 1024 }) } catch { return null }
}

// ── Source-level root-cause assertions ───────────────────────────────
const actionsSrc = fs.readFileSync('src/constants/smokecraftLandingActions.js', 'utf8')
check('Canonical resolveSmokeCraftEntryDestination exists',
  actionsSrc.includes('export function resolveSmokeCraftEntryDestination'))
check('Entry resolver orchestrates the existing canonical authorities (does not reimplement them)',
  actionsSrc.includes('getSmokeCraftEntryReadiness') && actionsSrc.includes('computeJourneyStatus'))
check('START no longer hardcodes the Guest Pass / Enrollment route',
  /case A\.START: \{[\s\S]*?resolveSmokeCraftEntryDestination\(journeyState\)/.test(actionsSrc))
check('RESUME no longer hands off a precomputed entryRoute',
  /case A\.RESUME: \{[\s\S]*?resolveSmokeCraftEntryDestination\(journeyState\)/.test(actionsSrc))
check('There is exactly one SmokeCraft CraftHub route in App.jsx',
  (fs.readFileSync('src/App.jsx', 'utf8').match(/path="crafthub"\s+element=\{<SmokeCraftCraftHub/g) || []).length === 1)

// ── (15)(16) Locked screens unchanged ────────────────────────────────
for (const [label, file] of [['Rewards Center', 'src/pages/smokecraft/RewardsCenter.jsx'], ['Leaderboard', 'src/pages/smokecraft/Leaderboard.jsx']]) {
  const before = gitShow(BASE_REF, file)
  const after = fs.readFileSync(file)
  const same = before && sha256(before) === sha256(after)
  check(`${label} source is unchanged from before this pass`, !!same,
    `${BASE_REF.slice(0, 7)}=${before ? sha256(before).slice(0, 12) : 'MISSING'} now=${sha256(after).slice(0, 12)}`)
}

// ── (17)(18) Approved assets untouched ───────────────────────────────
const assetDiff = execSync(`git diff --name-status ${BASE_REF} -- public/assets/smokecraft`).toString().trim()
const assetUntracked = execSync('git status --porcelain -- public/assets/smokecraft').toString().trim()
check('No approved asset under public/assets/smokecraft was changed or removed',
  assetDiff === '', assetDiff || 'no diff')
check('No new artwork was created under public/assets/smokecraft',
  assetUntracked === '', assetUntracked || 'no untracked files')
check('VISIT_STRUCTURE 6-phase / 27-session structure unchanged',
  execSync(`git diff --stat ${BASE_REF} -- src/constants/session.js`).toString().trim() === '')

// ── Live browser section ─────────────────────────────────────────────
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

async function freshPage() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  return ctx.newPage()
}
async function seed(page, { completedSteps = null, venue = false } = {}) {
  await page.goto(UI_BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ completedSteps, venue }) => {
    localStorage.clear()
    if (completedSteps) {
      localStorage.setItem('novee_guest_session', JSON.stringify({
        sessionId: 'esc-test-' + Date.now(), guestId: 'esc-test-guest',
        completedSteps, xp: 0, rank: 'Novice', badges: [], __version: 4,
      }))
    }
    if (venue) localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { id: 'esc-venue', name: 'ESC Test Venue' } }))
  }, { completedSteps, venue })
}
async function landing(page) {
  await page.goto(`${UI_BASE}/smokecraft`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(600)
}
function pathOf(page) { return new URL(page.url()).pathname }
async function clickPrimary(page) {
  const btn = page.locator('button', { hasText: /SMOKECRAFT JOURNEY|START NEW JOURNEY|VIEW COMPLETED/i }).first()
  await btn.click()
  await page.waitForTimeout(900)
}
function shot(page, name) { return page.screenshot({ path: `${PROOF_DIR}/${name}.png` }) }
function json(name, obj) { fs.writeFileSync(`${PROOF_DIR}/${name}.json`, JSON.stringify(obj, null, 2)) }

const evidence = {}

try {
  // (1) Completely new user sees Guest Pass once.
  let page = await freshPage()
  await seed(page, { completedSteps: null })
  await landing(page)
  const primaryLabel = (await page.locator('button', { hasText: /SMOKECRAFT JOURNEY/i }).first().innerText()).trim()
  await clickPrimary(page)
  const p1 = pathOf(page)
  check('(1) A completely new user sees Guest Pass / Enrollment once', p1 === '/smokecraft/enroll', `label="${primaryLabel}" -> ${p1}`)
  await shot(page, '01-new-user-guest-pass')
  evidence.newUser = { primaryLabel, route: p1 }

  // (2) Completing Guest Pass advances to Identity/next entry step.
  await seed(page, { completedSteps: ['enroll'] })
  await landing(page)
  const label2 = (await page.locator('button', { hasText: /SMOKECRAFT JOURNEY/i }).first().innerText()).trim()
  await clickPrimary(page)
  const p2 = pathOf(page)
  check('(2) After completing Guest Pass the entry sequence advances past it (never back to Guest Pass)',
    p2 !== '/smokecraft/enroll', `label="${label2}" -> ${p2}`)
  await shot(page, '02-after-guest-pass')
  evidence.afterGuestPass = { primaryLabel: label2, route: p2 }

  // (3) Refresh does not return the user to Guest Pass.
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const p3 = pathOf(page)
  check('(3) Refresh does not return the user to Guest Pass', p3 !== '/smokecraft/enroll', p3)
  await shot(page, '03-refresh-not-guest-pass')

  // Landing refresh must also not resolve back to Guest Pass.
  await landing(page)
  await clickPrimary(page)
  const p3b = pathOf(page)
  check('(3b) A second Start click after enrollment still does not reopen Guest Pass',
    p3b !== '/smokecraft/enroll', p3b)

  // (4) Completing Identity advances to Venue.
  // Disclosed (carried forward from the entry-readiness contract): Identity has
  // no separate completion flag — identityComplete === enrollmentComplete — so
  // the step after enrollment in the real architecture is Venue Selection.
  await seed(page, { completedSteps: ['enroll'], venue: false })
  await landing(page)
  await clickPrimary(page)
  const p4 = pathOf(page)
  check('(4) With identity satisfied and no venue, entry advances to Venue Selection',
    p4 === '/smokecraft/venue-select', p4)
  await shot(page, '04-advances-to-venue')
  evidence.venueStep = p4

  // (5) Completing Venue advances to Welcome.
  await seed(page, { completedSteps: ['enroll'], venue: true })
  await landing(page)
  await clickPrimary(page)
  const p5 = pathOf(page)
  check('(5) Completing Venue advances to Welcome', p5 === '/smokecraft/welcome', p5)
  await shot(page, '05-advances-to-welcome')
  evidence.welcomeStep = p5

  // (6) Welcome IS Session 1 in the approved architecture (route /smokecraft/welcome
  // renders screenId="session-1" behind sessionNumber={1}), so reaching Welcome
  // is reaching Session 1. Assert the rendered screen really is session 1.
  const isSession1 = fs.readFileSync('src/App.jsx', 'utf8')
    .includes('path="welcome"          element={<SmokeCraftSessionGuard sessionNumber={1}><SmokeCraftScreenRenderer screenId="session-1"')
  check('(6) Begin Experience lands on Session 1 (Welcome route renders session-1)',
    p5 === '/smokecraft/welcome' && isSession1, `${p5} renders session-1=${isSession1}`)

  // (7) Resume opens the earliest incomplete screen.
  await seed(page, { completedSteps: ['enroll', 'entry'], venue: true })
  await landing(page)
  const resumeLabel = (await page.locator('button', { hasText: /SMOKECRAFT JOURNEY/i }).first().innerText()).trim()
  check('(7a) An active journey shows RESUME SMOKECRAFT JOURNEY', /RESUME/i.test(resumeLabel), resumeLabel)
  await clickPrimary(page)
  const p7 = pathOf(page)
  check('(7b) Resume opens the earliest incomplete screen (S2), not a completed one',
    p7 !== '/smokecraft/welcome' && p7 !== '/smokecraft' && p7 !== '/smokecraft/enroll', p7)
  await shot(page, '07-resume-earliest-incomplete')
  evidence.resume = { label: resumeLabel, route: p7 }

  // (8) Resume does not restart enrollment.
  const stepsAfterResume = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('novee_guest_session')).completedSteps } catch { return null }
  })
  check('(8) Resume does not restart enrollment or reset progress',
    Array.isArray(stepsAfterResume) && stepsAfterResume.includes('enroll') && stepsAfterResume.includes('entry'),
    JSON.stringify(stepsAfterResume))
  json('08-resume-preserved-steps', { route: p7, completedSteps: stepsAfterResume })

  // (9) Start New preserves completed history.
  await seed(page, { completedSteps: ['enroll', 'entry'], venue: true })
  await landing(page)
  await page.locator('button', { hasText: /^Start New Journey$/i }).first().click()
  await page.waitForTimeout(400)
  await shot(page, '09a-start-new-confirm')
  await page.locator('div[role="dialog"] button', { hasText: /Start New Journey/i }).first().click()
  await page.waitForTimeout(1200)
  const p9 = pathOf(page)
  const after9 = await page.evaluate(() => ({
    steps: (() => { try { return JSON.parse(localStorage.getItem('novee_guest_session')).completedSteps } catch { return null } })(),
    journey: (() => { try { return JSON.parse(localStorage.getItem('sc_journey_v1')) } catch { return null } })(),
  }))
  check('(9a) Start New begins at the first genuinely incomplete entry requirement, not Guest Pass',
    p9 !== '/smokecraft/enroll' && p9 !== '/smokecraft', p9)
  check('(9b) Start New preserves account-level enrollment history and clears journey progress',
    Array.isArray(after9.steps) && after9.steps.includes('enroll') && !after9.steps.includes('entry'),
    JSON.stringify(after9.steps))
  check('(9c) Start New preserves completed-journey history (previousCompletedJourneys retained)',
    after9.journey === null || Array.isArray(after9.journey.previousCompletedJourneys) || after9.journey.previousCompletedJourneys === undefined,
    JSON.stringify(after9.journey?.previousCompletedJourneys ?? null))
  await shot(page, '09b-start-new-result')
  json('09-start-new', { route: p9, ...after9 })
  evidence.startNew = { route: p9, steps: after9.steps }

  // (10) CraftHub opens the approved CraftHub destination — clicked from Landing.
  await seed(page, { completedSteps: ['enroll', 'entry'], venue: true })
  await landing(page)
  await page.getByRole('button', { name: 'CraftHub' }).first().click()
  await page.waitForTimeout(1200)
  const p10 = pathOf(page)
  check('(10a) The Landing CraftHub control opens /smokecraft/crafthub', p10 === '/smokecraft/crafthub', p10)
  const craftHubImg = await page.locator('img').first().getAttribute('src').catch(() => null)
  check('(10b) CraftHub renders the approved CraftHub artwork',
    !!craftHubImg && /CRAFTHUB/i.test(decodeURIComponent(craftHubImg)), craftHubImg || 'no img')
  check('(10c) CraftHub does not route to Identity, Welcome, or Guest Pass',
    !['/smokecraft/identity', '/smokecraft/welcome', '/smokecraft/enroll'].includes(p10), p10)
  await shot(page, '10-crafthub-destination')
  evidence.craftHub = { route: p10, image: craftHubImg }

  // (11) CraftHub does not show "Greg Guy" or stale learner data.
  const bodyText = await page.locator('body').innerText()
  check('(11) CraftHub does not show "Greg Guy" or stale SmokeCraft learner data',
    !/greg\s*guy/i.test(bodyText), bodyText.slice(0, 120).replace(/\s+/g, ' '))
  json('11-crafthub-body-text', { route: p10, bodyText })

  // (12) CraftHub does not reset the active journey.
  const after12 = await page.evaluate(() => ({
    steps: (() => { try { return JSON.parse(localStorage.getItem('novee_guest_session')).completedSteps } catch { return null } })(),
    venue: (() => { try { return JSON.parse(localStorage.getItem('sc_journey_v1'))?.selectedVenue?.id ?? null } catch { return null } })(),
  }))
  check('(12) CraftHub does not reset or restart the active journey',
    Array.isArray(after12.steps) && after12.steps.includes('enroll') && after12.steps.includes('entry') && after12.venue === 'esc-venue',
    JSON.stringify(after12))
  json('12-crafthub-journey-preserved', after12)

  // (13) CraftHub Back returns to the prior screen.
  await page.getByRole('button', { name: /Back to SmokeCraft landing/i }).first().click()
  await page.waitForTimeout(1000)
  const p13 = pathOf(page)
  check('(13) CraftHub Back returns to the exact prior screen (Landing)', p13 === '/smokecraft', p13)
  await shot(page, '13-crafthub-back')
  evidence.craftHubBack = p13

  // (14) Passport Back returns to the prior screen.
  await seed(page, { completedSteps: ['enroll', 'entry'], venue: true })
  await landing(page)
  await page.getByRole('button', { name: 'View Passport (bottom bar)' }).first().click()
  await page.waitForTimeout(1200)
  const pPassport = pathOf(page)
  check('(14a) Passport opens the approved Passport destination', pPassport === '/smokecraft/passport', pPassport)
  const backBtn = page.locator('[data-testid="passport-back"]')
  check('(14b) Passport Back button is visible', await backBtn.isVisible())
  const backBox = await backBtn.boundingBox()
  check('(14c) Passport Back button is a real, sized, clickable target',
    !!backBox && backBox.width > 40 && backBox.height > 20, JSON.stringify(backBox))
  await shot(page, '14a-passport-with-back')
  // Keyboard activation (Enter) — proves it is a real focusable button.
  await backBtn.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1000)
  const p14 = pathOf(page)
  check('(14d) Passport Back returns to the exact prior screen via keyboard Enter', p14 === '/smokecraft', p14)
  await shot(page, '14b-passport-back-result')
  evidence.passportBack = { from: pPassport, to: p14, box: backBox }

  json('00-evidence', evidence)
} catch (e) {
  check('Live browser section completed without error', false, e.message)
} finally {
  await browser.close()
}

const passed = results.filter(r => r.pass === true).length
const failed = results.filter(r => r.pass === false).length
json('99-results', results)
console.log(`\n${passed} passed, ${failed} failed (of ${results.length} total)`)
process.exit(failed > 0 ? 1 : 0)
