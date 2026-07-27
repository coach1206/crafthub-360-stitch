#!/usr/bin/env node
/**
 * Holistic Fix 5A-3B — SC-D027 regression: a role="alert" element
 * (BuildDiagnosticFooter's version-mismatch banner) must never block
 * pointer events on controls underneath or nearby, while its own
 * interactive action (Refresh) must remain clickable, and role="alert"
 * semantics must remain intact for screen readers.
 *
 * Deterministically forces the mismatch state via network interception
 * of /api/version (rather than depending on real build/backend drift)
 * so this test is reproducible regardless of environment state.
 */
import { chromium } from 'playwright'

const BASE = process.env.SC_UI || 'http://localhost:5050'
let pass = 0, fail = 0
const results = []

function assert(name, cond, detail) {
  if (cond) { pass++; results.push({ name, ok: true }); console.log(`  PASS  ${name}`) }
  else { fail++; results.push({ name, ok: false, detail }); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  // Force a version mismatch deterministically, independent of real build state.
  await page.route('**/api/version', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, backendCommit: 'forced-mismatch-test-commit', assetVersion: 'x', environment: 'test' }),
  }))

  const consoleErrors = []
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  await page.goto(`${BASE}/smokecraft/terroir`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(500)

  const alertEl = await page.$('[role="alert"]')
  assert('The version-mismatch banner renders with role="alert" (screen-reader semantics intact)', !!alertEl)

  if (alertEl) {
    const box = await alertEl.boundingBox()
    assert('The alert banner occupies the top strip of the viewport (position:fixed, top:0)', box && box.y <= 2 && box.width > 1000)

    // A point inside the banner's bounding box but OUTSIDE the button/text
    // (the empty flex-gutter area) must pass clicks through to whatever is
    // underneath, not be intercepted by the banner div itself.
    const emptyGutterPoint = { x: 20, y: (box.y + box.height / 2) }
    const topElAtGutter = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y)
      return el ? { tag: el.tagName, role: el.getAttribute('role') } : null
    }, emptyGutterPoint)
    assert('The banner\'s empty gutter area does not intercept pointer events (elementFromPoint resolves to something other than the alert div itself)',
      !topElAtGutter || topElAtGutter.role !== 'alert', JSON.stringify(topElAtGutter))
  }

  // A real header/back control on this screen (rendered near the top of
  // the viewport, in the zone the unfixed banner used to occlude) must be
  // genuinely clickable — a real mouse click, not just hit-test math.
  const backButton = await page.$('button, a[href]')
  let backClickOk = false
  if (backButton) {
    try {
      await backButton.click({ timeout: 5000 })
      backClickOk = true
    } catch { backClickOk = false }
  }
  assert('A real control near the top of the viewport is genuinely clickable (real mouse click, not blocked by the alert)', backClickOk)

  // The alert's own interactive action must remain clickable.
  await page.goto(`${BASE}/smokecraft/terroir`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(500)
  const refreshButton = await page.getByRole('button', { name: /refresh now/i }).first()
  let refreshClickable = false
  try {
    await refreshButton.waitFor({ state: 'visible', timeout: 3000 })
    const box = await refreshButton.boundingBox()
    const topAtCenter = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y)
      return el ? el.tagName : null
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
    refreshClickable = topAtCenter === 'BUTTON'
  } catch (e) { refreshClickable = false }
  assert('The alert\'s own interactive Refresh action remains clickable (not occluded by its own wrapper)', refreshClickable)

  // Keyboard: Tab should be able to reach the Refresh button.
  await page.keyboard.press('Tab')
  let reachedViaKeyboard = false
  for (let i = 0; i < 15; i++) {
    const focused = await page.evaluate(() => document.activeElement?.textContent || '')
    if (/refresh now/i.test(focused)) { reachedViaKeyboard = true; break }
    await page.keyboard.press('Tab')
  }
  assert('Keyboard Tab navigation can reach the Refresh action', reachedViaKeyboard)

  assert('No unexplained console error from this scenario', consoleErrors.length === 0, consoleErrors.join(' | '))

  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5a-3b', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5a-3b/02-alert-pointer-regression-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
