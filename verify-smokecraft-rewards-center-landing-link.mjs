// SmokeCraft 360 — Rewards Center Landing Link verification.
//
// AUDIT FINDING (Phase 1 of this pass's own mandate): the approved Landing
// image, the asset registry, the route, and a real live RewardsCenter.jsx
// component already existed and were already correctly wired by earlier
// passes ("Approved Asset Control Plane", "Final Sequence and CraftHub Route
// Correction"). This suite re-verifies that end-to-end chain live rather
// than rebuilding anything, per this pass's own Phase 1 instruction to
// "reuse the existing architecture" and "not create duplicate Rewards
// routes, cards, or navigation controls."
import fs from 'fs'
import crypto from 'crypto'
import { chromium } from 'playwright'

const UI = process.env.SC_UI || 'http://localhost:5050'
const PROOF = 'public/proof/smokecraft-rewards-center-landing-link'
const SHOTS = `${PROOF}/screenshots`
fs.mkdirSync(SHOTS, { recursive: true })

let pass = 0, fail = 0
const failures = []
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; failures.push(label); console.log(`FAIL — ${label}`) }
}

function sha256File(path) { return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex') }

async function renderedImageHash(page, selector) {
  const src = await page.evaluate((sel) => document.querySelector(sel)?.getAttribute('src') || null, selector)
  if (!src) return null
  const res = await fetch(new URL(src, UI).href)
  return crypto.createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex')
}

const APPROVED_ASSET_PATH = 'public/assets/smokecraft/rewards/Reward Center.png'
const APPROVED_HASH = fs.existsSync(APPROVED_ASSET_PATH) ? sha256File(APPROVED_ASSET_PATH) : null
check('(asset) Approved Reward Center.png exists at the exact required path/case', !!APPROVED_HASH)

check('(registry) rewardCenter asset key maps to the approved path', (() => {
  const src = fs.readFileSync('src/constants/smokecraftAssets.js', 'utf8')
  return src.includes('rewardCenter:') && /rewards\/Reward%20Center\.png/.test(src)
})())

let browser
const consoleErrors = []
try {
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  // ── Landing page: approved Rewards entry present, not permanently highlighted ──
  await page.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${SHOTS}/01-landing.png` })
  const rewardsBtn = page.locator('[aria-label="Rewards"]')
  check('(landing) Rewards entry exists on Landing', await rewardsBtn.count() > 0)
  const ariaCurrent = await rewardsBtn.first().getAttribute('aria-current').catch(() => null)
  check('(landing) Rewards entry is not permanently marked as the current page', ariaCurrent !== 'page')

  // ── Click through to Rewards Center ──────────────────────────────────────
  await rewardsBtn.first().click()
  await page.waitForTimeout(300)
  check('(nav) Landing Rewards click opens /smokecraft/rewards-center', new URL(page.url()).pathname === '/smokecraft/rewards-center')
  await page.screenshot({ path: `${SHOTS}/02-rewards-center-from-landing.png` })

  const rcHash = await renderedImageHash(page, 'img')
  check('(asset) Rewards Center renders the approved image', !!rcHash)
  check('(asset) Rendered Rewards Center image hash matches the approved file on disk', !!rcHash && rcHash === APPROVED_HASH)

  const rcBody = (await page.textContent('body')) || ''
  check('(honesty) No fake venue names/reward totals/redemption codes rendered', !/redeem code|RDM-|SC-VIP/i.test(rcBody))
  check('(state) Blank live-data state shown honestly (no venue catalog message present, not fabricated offers)',
    /No venue reward catalog is connected/i.test(rcBody))
  await page.screenshot({ path: `${SHOTS}/03-rewards-center-blank-state.png` })

  // ── Keyboard / focus ──────────────────────────────────────────────────────
  await page.keyboard.press('Tab')
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
  check('(a11y) Keyboard focus lands on a real interactive element', ['BUTTON', 'A'].includes(focusedTag))
  await page.screenshot({ path: `${SHOTS}/06-keyboard-focus.png` })

  // ── Back to Journey ───────────────────────────────────────────────────────
  await page.locator('[data-testid="rc-back"]').click()
  await page.waitForTimeout(200)
  check('(nav) Back to Journey returns to /smokecraft', new URL(page.url()).pathname === '/smokecraft')

  // ── Refresh persistence on a deep link ──────────────────────────────────
  await page.goto(`${UI}/smokecraft/rewards-center`, { waitUntil: 'networkidle' })
  const deepLinkOk = new URL(page.url()).pathname === '/smokecraft/rewards-center'
  await page.reload({ waitUntil: 'networkidle' })
  const afterRefreshOk = new URL(page.url()).pathname === '/smokecraft/rewards-center'
  check('(nav) Deep link to Rewards Center loads directly', deepLinkOk)
  check('(nav) Refresh on Rewards Center preserves the route', afterRefreshOk)

  // ── No regression to sibling destinations ────────────────────────────────
  for (const [label, path] of [['Rankings', '/smokecraft/leaderboard'], ['View Passport (bottom bar)', '/smokecraft/passport'], ['CraftHub', '/smokecraft/crafthub']]) {
    await page.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })
    await page.locator(`[aria-label="${label}"]`).first().click()
    await page.waitForTimeout(250)
    check(`(regression) ${label} destination unaffected`, new URL(page.url()).pathname === path)
  }

  // ── Responsive sweep ──────────────────────────────────────────────────────
  const viewports = [[1024, 768], [1280, 800], [1366, 768], [1440, 900]]
  let overflowFails = 0
  for (const [w, h] of viewports) {
    const vctx = await browser.newContext({ viewport: { width: w, height: h } })
    const vpage = await vctx.newPage()
    await vpage.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })
    const landingOverflow = await vpage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    await vpage.locator('[aria-label="Rewards"]').first().click()
    await vpage.waitForTimeout(200)
    const rcOverflow = await vpage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (landingOverflow > 2 || rcOverflow > 2) overflowFails++
    if (w === 1280) await vpage.screenshot({ path: `${SHOTS}/04-tablet-1280x800.png` })
    if (w === 1440) await vpage.screenshot({ path: `${SHOTS}/05-desktop-1440x900.png` })
    await vctx.close()
  }
  check(`(responsive) No horizontal overflow at any of ${viewports.length} required viewports`, overflowFails === 0)

  await ctx.close()
} catch (e) {
  console.log('BLOCKED — live browser run —', e.stack || e.message)
  check('Live browser run completed without throwing', false)
} finally {
  if (browser) await browser.close()
}

const blockingConsole = consoleErrors.filter(t => !/404|Failed to load resource|favicon|navigator\.vibrate|user hasn't tapped/i.test(t))
check('No blocking console error', blockingConsole.length === 0)

fs.writeFileSync(`${PROOF}/results.json`, JSON.stringify({ pass, fail, total: pass + fail, failures, approvedAssetHash: APPROVED_HASH, capturedAt: new Date().toISOString() }, null, 2))
console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
process.exit(fail > 0 ? 1 : 0)
