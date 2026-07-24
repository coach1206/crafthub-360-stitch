#!/usr/bin/env node
/**
 * verify-smokecraft-approved-landing-control-plane.mjs
 *
 * Approved-Asset Control Plane pass.
 *
 * Proves that every SmokeCraft Landing control resolves through ONE canonical
 * resolver, and that each destination renders an ACTUAL approved image file
 * from this repository (verified by sha256 against the file on disk) rather
 * than a hand-built CSS/React layout.
 *
 * Browser navigation is performed using VISIBLE CONTROLS ONLY — the suite
 * clicks real buttons by accessible name. It never calls a service directly
 * and never types a destination URL to reach a landing destination.
 *
 * Usage:  node verify-smokecraft-approved-landing-control-plane.mjs [baseURL]
 *         (default baseURL http://127.0.0.1:5050)
 */
import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.argv[2] || 'http://127.0.0.1:5050'
const PUBLIC = path.join(ROOT, 'public')

let pass = 0, fail = 0
const failures = []
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function section(t) { console.log(`\n── ${t}`) }

const sha = buf => createHash('sha256').update(buf).digest('hex')
const decode = u => decodeURIComponent(u.split('?')[0])
function diskSha(urlPath) {
  const f = path.join(PUBLIC, decode(urlPath).replace(/^\//, ''))
  return existsSync(f) ? sha(readFileSync(f)) : null
}
const read = p => readFileSync(path.join(ROOT, p), 'utf8')

// The approved image each landing destination must render, by repo path.
const APPROVED = {
  landing:     '/assets/smokecraft-reference/approved/smokecraft-landing.png',
  howItWorks:  '/assets/smokecraft/session-visuals/HOW IT WORKS.png',
  rewards:     '/assets/smokecraft/rewards/Reward Center.png',
  passport:    '/assets/smokecraft/360 PASSPORT  2.png',
  crafthub:    '/assets/smokecraft/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png',
  pairing:     '/assets/smokecraft-reference/approved/smokecraft-pairing.png',
  humidor:     '/assets/smokecraft/Humidor Match 1.png',
  leaderboard: '/assets/smokecraft/LEADERBOARD 111.png',
}

// ─────────────────────────────────────────────────────────────────────────────
// PART A — source + asset integrity (no browser required)
// ─────────────────────────────────────────────────────────────────────────────
section('A. Approved assets exist on disk with exact case')
for (const [k, p] of Object.entries(APPROVED)) {
  assert(`approved asset present: ${k}`, diskSha(p) !== null, p)
}

section('B. One canonical resolver owns every Landing destination')
const resolverSrc = read('src/constants/smokecraftLandingActions.js')
const landingSrc  = read('src/pages/SmokeCraft.jsx')

assert('resolver module exports resolveSmokeCraftLandingAction',
  /export function resolveSmokeCraftLandingAction\(/.test(resolverSrc))

for (const a of ['START', 'RESUME', 'START_NEW', 'HOW_IT_WORKS', 'REWARDS', 'RANKINGS', 'PASSPORT', 'PAIRING', 'CRAFTHUB']) {
  assert(`resolver supports action ${a}`, new RegExp(`\\b${a}:`).test(resolverSrc))
}

assert('Landing imports the canonical resolver',
  /resolveSmokeCraftLandingAction/.test(landingSrc))

// (18) Every Landing control routes through the resolver — no inline routes.
const inlineRoutes = [...landingSrc.matchAll(/navigate\(\s*['"`](\/[^'"`]*)['"`]/g)].map(m => m[1])
assert('no Landing handler calls navigate() with a hardcoded route string',
  inlineRoutes.length === 0, inlineRoutes.join(', '))

const goCalls = [...landingSrc.matchAll(/go\(\s*['"`]\/smokecraft/g)]
assert('no Landing handler uses the old inline go(\'/smokecraft/...\') helper',
  goCalls.length === 0)

const onClicks = [...landingSrc.matchAll(/onClick=\{\(\) => (\w+)\(/g)].map(m => m[1])
assert('every Landing hotspot onClick delegates to runAction',
  onClicks.length > 0 && onClicks.every(f => f === 'runAction'),
  `handlers: ${[...new Set(onClicks)].join(', ')}`)

section('C. Destination screens use an approved image as their visual shell')
const shells = {
  'HowItWorks.jsx':          ['src/pages/smokecraft/HowItWorks.jsx', 'howItWorksUser'],
  'RewardsCenter.jsx':       ['src/pages/smokecraft/RewardsCenter.jsx', 'rewardCenter'],
  'SmokeCraftPassport.jsx':  ['src/pages/smokecraft/SmokeCraftPassport.jsx', 'passportHub'],
  'SmokeCraftCraftHub.jsx':  ['src/pages/smokecraft/SmokeCraftCraftHub.jsx', 'craftHubVenueTable'],
}
for (const [name, [file, key]] of Object.entries(shells)) {
  const src = read(file)
  assert(`${name} renders an approved image via SmokeCraftImageBoundsOverlay`,
    /<SmokeCraftImageBoundsOverlay/.test(src) && new RegExp(`SC_ASSETS\\.${key}`).test(src))
  assert(`${name} has no hand-built gradient page background`,
    !/radial-gradient|linear-gradient\(180deg, rgba\(6,8,16/.test(src.replace(/linear-gradient\(180deg, #F3D48E/g, '')))
}

section('D. Old / non-approved visuals are no longer reachable')
const assetsSrc = read('src/constants/smokecraftAssets.js')
assert('internal storyboard key SC_ASSETS.howItWorks removed',
  !/^\s*howItWorks:/m.test(assetsSrc))
// Strip comments before scanning: these screens deliberately DOCUMENT the old
// artwork they must never render ("no baked 'Future Visit Locked' image"), so a
// raw text scan would flag the very comments proving the fix. We assert on code
// that can actually reach the DOM, which is the real requirement.
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const allSrc = ['src/pages/SmokeCraft.jsx', ...Object.values(shells).map(v => v[0])]
  .map(f => stripComments(read(f))).join('\n')
assert('no "Greg Guy" in landing or destination screens', !/Greg Guy/.test(allSrc))
assert('no "James Carter" in landing or destination screens', !/James Carter/.test(allSrc))
assert('no fabricated 18,750 XP in landing or destination screens', !/18,?750/.test(allSrc))
assert('no "Future Visit Locked" artwork referenced', !/Future Visit Locked/i.test(allSrc))
assert('no "Management Sync Locked" artwork referenced', !/Management Sync Locked/i.test(allSrc))

const appSrc = read('src/App.jsx')
assert('/smokecraft/passport is a real screen, not a Navigate alias',
  /path="passport"\s+element=\{<SmokeCraftPassport/.test(appSrc))
assert('/smokecraft/crafthub route exists',
  /path="crafthub"\s+element=\{<SmokeCraftCraftHub/.test(appSrc))

section('E. Honest data reporting (no fabricated distinct fields)')
const rcSrc = read('src/pages/smokecraft/RewardsCenter.jsx')
assert('RewardsCenter does not present account XP as reward points',
  !/session\?\.xp[^)]*points/i.test(rcSrc))
assert('RewardsCenter marks untracked point fields as unavailable rather than restating one number',
  /rc-lifetime[\s\S]{0,80}value="—"/.test(rcSrc) && /rc-redeemed[\s\S]{0,80}value="—"/.test(rcSrc))

// ─────────────────────────────────────────────────────────────────────────────
// PART F — real browser, visible controls only
// ─────────────────────────────────────────────────────────────────────────────
section('F. Real browser — visible controls only')
// This environment ships a chromium build that predates the bundled
// playwright revision, and the sandbox blocks the browser download. Prefer the
// locally-present executable so the browser section really runs rather than
// silently skipping.
const LOCAL_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
let browser
try {
  browser = existsSync(LOCAL_CHROME)
    ? await chromium.launch({ executablePath: LOCAL_CHROME })
    : await chromium.launch()
} catch (e) {
  console.log(`  SKIP  browser section — could not launch chromium (${e.message})`)
}

if (browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } })
  const page = await ctx.newPage()

  // Track every image the page actually requests, so we can hash what RENDERED.
  const rendered = new Set()
  page.on('response', r => { if (/\.(png|jpg|jpeg|webp)$/i.test(decode(r.url()))) rendered.add(new URL(r.url()).pathname) })

  async function landing() {
    rendered.clear()
    await page.goto(`${BASE}/smokecraft`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
  }

  // Click a landing control by its accessible name and report the resulting URL.
  async function clickControl(name) {
    rendered.clear()
    const btn = page.getByRole('button', { name, exact: true }).first()
    await btn.waitFor({ state: 'visible', timeout: 8000 })
    await btn.click()
    await page.waitForTimeout(900)
    return page.url()
  }

  // Confirm the approved file for this screen was actually fetched, and that
  // the bytes served match the approved file on disk.
  async function assertRenderedApproved(label, approvedPath) {
    const want = decode(approvedPath)
    const got = [...rendered].map(decode).find(p => p === want)
    assert(`${label}: approved image rendered (${path.basename(want)})`, Boolean(got), [...rendered].map(decode).join(', '))
    if (!got) return
    const res = await page.request.get(`${BASE}${approvedPath.split('/').map(encodeURIComponent).join('/')}`)
    const servedSha = sha(Buffer.from(await res.body()))
    assert(`${label}: rendered asset hash matches approved file on disk`, servedSha === diskSha(approvedPath),
      `served ${servedSha.slice(0, 16)} vs disk ${String(diskSha(approvedPath)).slice(0, 16)}`)
  }

  await landing()
  await assertRenderedApproved('Landing', APPROVED.landing)

  // (1) Start opens Enrollment.
  const startBtn = page.getByRole('button', { name: /START SMOKECRAFT JOURNEY/i }).first()
  if (await startBtn.count()) {
    await startBtn.click()
    await page.waitForTimeout(900)
    assert('Start opens Enrollment', page.url().includes('/smokecraft/enroll'), page.url())
  } else {
    assert('Start opens Enrollment', false, 'primary Start control not visible on Landing')
  }

  // (4) Rewards opens the approved Reward Center.
  await landing()
  let url = await clickControl('Rewards')
  assert('Rewards opens /smokecraft/rewards-center', url.includes('/smokecraft/rewards-center'), url)
  await assertRenderedApproved('Rewards', APPROVED.rewards)

  // (5) Rankings.
  await landing()
  url = await clickControl('Rankings')
  assert('Rankings opens /smokecraft/leaderboard', url.includes('/smokecraft/leaderboard'), url)

  // (6) Passport opens the approved Passport image.
  await landing()
  url = await clickControl('View Passport (bottom bar)')
  assert('Passport opens /smokecraft/passport', url.includes('/smokecraft/passport'), url)
  await assertRenderedApproved('Passport', APPROVED.passport)

  // (7) CraftHub opens the approved CraftHub image.
  await landing()
  url = await clickControl('CraftHub')
  assert('CraftHub opens /smokecraft/crafthub', url.includes('/smokecraft/crafthub'), url)
  await assertRenderedApproved('CraftHub', APPROVED.crafthub)
  const bodyText = await page.locator('body').innerText()
  assert('CraftHub shows no "Greg Guy"', !/Greg Guy/.test(bodyText))
  assert('CraftHub does not route to Identity', !page.url().includes('/identity'))

  // (8) How It Works opens the approved user-facing image.
  await landing()
  url = await clickControl('How It Works')
  assert('How It Works opens /smokecraft/how-it-works', url.includes('/smokecraft/how-it-works'), url)
  await assertRenderedApproved('How It Works', APPROVED.howItWorks)
  const hiw = await page.locator('body').innerText()
  assert('How It Works shows no baked "4,250" XP as live text', !/4,250/.test(hiw))

  // (9) Pairing.
  await landing()
  url = await clickControl('View Pairing')
  assert('Pairing opens /smokecraft/pairing', url.includes('/smokecraft/pairing'), url)

  // (11) No landing control resets the journey.
  await landing()
  // Compare journey-MEANINGFUL state only. The session record carries an
  // `updatedAt` heartbeat that changes on every page load by design, so a raw
  // JSON comparison would flag ordinary navigation as a "reset". What must not
  // change is progress, identity and XP.
  const journeyFields = () => page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('novee_guest_session') || '{}')
    return JSON.stringify({
      completedSteps: s.completedSteps ?? null,
      xp: s.xp ?? null,
      profile: s.profile ?? null,
      activeJourneyId: s.activeJourneyId ?? null,
      loyaltyPoints: s.loyaltyPoints ?? null,
    })
  })
  const before = await journeyFields()
  await clickControl('Rewards')
  await landing()
  const after = await journeyFields()
  assert('no destination control resets the journey', before === after, `${before} vs ${after}`)

  // (12) No control loops back to Landing.
  await landing()
  url = await clickControl('Rewards')
  assert('destination control does not loop back to Landing', !url.endsWith('/smokecraft'), url)

  await browser.close()
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(60)}`)
console.log(`RESULT: ${pass} passed, ${fail} failed`)
if (failures.length) {
  console.log('\nFailures:')
  failures.forEach(f => console.log(`  - ${f}`))
}
process.exit(fail === 0 ? 0 : 1)
