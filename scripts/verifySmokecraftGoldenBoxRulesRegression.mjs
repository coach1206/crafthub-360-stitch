#!/usr/bin/env node
// Focused regression for the Golden Box Rules blank-panel/static-shell
// defect. Proves, via a real Playwright browser against a live server,
// that a normal player can: see all intended content, understand the
// instruction, check the real acknowledgement checkbox (plain click, no
// force/dispatch), see the Continue button visibly unlock, and advance
// to Mentor Selection — at every supported viewport.
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = 'public/proof/smokecraft-golden-box-rules-regression'
mkdirSync(OUT, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, hasTouch: false },
  { name: 'tablet-landscape', width: 1024, height: 768, hasTouch: true },
  { name: 'tablet-portrait', width: 768, height: 1024, hasTouch: true },
  { name: 'kiosk', width: 1920, height: 1080, hasTouch: false },
]

let pass = 0, fail = 0
function assert(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

async function reachGoldenBox(page) {
  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'networkidle', timeout: 25000 })
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 10000 })
  await page.fill('input[aria-label="Full Name"]', 'Golden Box Regression')
  await page.selectOption('select[aria-label="Cigar Experience Level"]', { index: 1 })
  await page.click('[data-testid="identity-begin"]')
  await page.waitForURL('**/smokecraft/venue-select', { timeout: 10000 })
  await page.waitForLoadState('networkidle')
  await page.click('text=Alpha Lounge (Seed)')
  await page.click('text=Continue to Welcome')
  await page.waitForURL('**/smokecraft/welcome', { timeout: 10000 })
  await page.waitForTimeout(500)
  await page.click('text=Begin Experience')
  await page.waitForURL('**/smokecraft/golden-box', { timeout: 10000 })
  await page.waitForTimeout(500)
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

  for (const vp of VIEWPORTS) {
    console.log(`── ${vp.name} (${vp.width}x${vp.height}) ──`)
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.hasTouch })
    const page = await context.newPage()
    await reachGoldenBox(page)

    // 1. All required real content blocks are present and visible.
    for (const text of ['Golden Box Rules', 'The Golden Principles', 'Quick Rule Reminders',
      'Rule Acknowledgement', 'Consequences of Misconduct', 'The Right Way to Enjoy', 'Golden Tip']) {
      const found = await page.locator(`text=${text}`).count().catch(() => 0)
      assert(`[${vp.name}] required content block "${text}" is present`, found > 0)
    }

    // 2. No leftover blank/void panels (the exact defect) — every
    // formerly-blank region's real replacement content renders.
    for (const text of ['Respect the Cigar', 'Handle With Care', 'Removal from the lounge', 'Clean cut for an even draw']) {
      const found = await page.locator(`text=${text}`).count().catch(() => 0)
      assert(`[${vp.name}] real content "${text}" renders (not a blank void)`, found > 0)
    }

    await page.screenshot({ path: `${OUT}/golden-box-rules-unchecked--${vp.name}.png`, fullPage: true })

    // 3. Continue is genuinely locked before acknowledgement.
    const continueBtn = page.locator('button[aria-label="Continue to Mentor Selection"]')
    const disabledBefore = await continueBtn.isDisabled().catch(() => null)
    assert(`[${vp.name}] Continue is disabled before the real checkbox is checked`, disabledBefore === true)

    // 4. A real, plain, unforced click on the real checkbox — no force,
    // no evaluate() dispatch, no workaround.
    const checkbox = page.locator('input[type="checkbox"]').first()
    await checkbox.click({ timeout: 3000 })
    await page.waitForTimeout(200)
    assert(`[${vp.name}] checkbox reflects checked state after a real click`, await checkbox.isChecked().catch(() => false))

    // 5. Visible confirmation appears.
    const confirmationVisible = await page.locator('text=✓').count().catch(() => 0)
    assert(`[${vp.name}] a visible checked confirmation appears`, confirmationVisible > 0)

    await page.screenshot({ path: `${OUT}/golden-box-rules-checked--${vp.name}.png`, fullPage: true })

    // 6. Continue is now genuinely unlocked.
    const disabledAfter = await continueBtn.isDisabled().catch(() => null)
    assert(`[${vp.name}] Continue unlocks after a real, unforced click on the checkbox`, disabledAfter === false)

    // 7. A real, plain click on Continue advances to the correct next route.
    await continueBtn.click({ timeout: 3000 })
    try {
      await page.waitForURL('**/smokecraft/mentor-selection', { timeout: 8000 })
      assert(`[${vp.name}] Continue (real click) advances to Mentor Selection, the correct next route`, true)
    } catch {
      assert(`[${vp.name}] Continue (real click) advances to Mentor Selection, the correct next route`, false, `landed on ${page.url()}`)
    }

    // 8. No horizontal overflow introduced by the rebuild.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
    assert(`[${vp.name}] no horizontal overflow`, !overflow)

    await context.close()
  }

  await browser.close()
  console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
  if (fail > 0) process.exit(1)
}

main().catch(e => { console.error(e); process.exit(1) })
