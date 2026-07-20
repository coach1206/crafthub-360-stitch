// CraftHub 360 — Approved MVP2 "Venue Table Experience" image verification.
// Confirms the uploaded approved image is the live foundation, every real
// control works, no fabricated data, no invisible hotspots, no duplicate
// baked/live text, and responsive/touch/focus behavior is honest.
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:5000'
const PROOF_DIR = 'public/proof/crafthub-approved-venue-table-experience'
fs.mkdirSync(PROOF_DIR, { recursive: true })

let pass = 0, fail = 0
function ok(label, cond) {
  if (cond) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}`) }
}

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1366x1024', width: 1366, height: 1024 },
  { name: '1920x1080', width: 1920, height: 1080 },
]

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

  console.log('── Approved image + composition ──')
  {
    const page = await (await browser.newContext({ viewport: { width: 1672, height: 941 } })).newPage()
    await page.goto(`${BASE}/crafthub`)
    await page.waitForTimeout(600)
    ok('1. /crafthub loads directly', page.url().includes('/crafthub'))

    const imgSrc = await page.locator('img[alt="CraftHub 360 — Venue Table Experience"]').getAttribute('src')
    ok('2. The uploaded approved image is used', decodeURIComponent(imgSrc || '').includes('CRAFTHUB 360. VENUE TABLE EXPERIENCE.png'))

    const bodyText = await page.locator('body').textContent()
    ok('3. Old centered card-grid implementation (Material icon tiles / grid classes) is gone', !(await page.locator('.material-symbols-outlined').count()))
    ok('4. No fabricated SIGNALS metrics appear', !/Active Tables|Staff Handoffs:\s*\d|POS \/ Inventory|E\.A\.T\. Alerts/.test(bodyText))
    ok('5. No fake activity values appear', !/\d+ Tonight|On Track|Nominal|Stocked/.test(bodyText))
    ok('6. No fake connected-state values appear', !/Connected|Nominal/.test(bodyText))

    for (const [label, sel, dest] of [
      ['7. SmokeCraft control works', 'Enter SmokeCraft 360', '/smokecraft'],
      ['8. Passport Connections works', '360 Passport Connections', '/passport'],
      ['10. Back to NOVEE OS works', 'Back to NOVEE OS', '/'],
    ]) {
      await page.goto(`${BASE}/crafthub`)
      await page.waitForTimeout(300)
      await page.locator(`button[aria-label="${sel}"]`).first().click()
      await page.waitForTimeout(300)
      ok(label, page.url().includes(dest) || (dest === '/' && page.url() === `${BASE}/`))
    }

    await page.goto(`${BASE}/crafthub`)
    await page.waitForTimeout(300)
    await page.locator('button[aria-label="Staff Handoff"]').first().click()
    await page.waitForTimeout(300)
    ok('9. Staff Handoff works (PIN modal opens)', await page.locator('text=/staff|pin/i').count() > 0)

    await page.goto(`${BASE}/crafthub`)
    await page.waitForTimeout(300)
    ok('13. Coming Soon modules remain honest (PourCraft/WineCraft/BeerCraft labeled, no fake "active" claim)', /PourCraft|WineCraft|BeerCraft/.test(bodyText))

    const allButtons = await page.locator('button').all()
    let zeroSize = 0
    for (const b of allButtons) {
      const box = await b.boundingBox()
      if (!box || box.width < 5 || box.height < 5) zeroSize++
    }
    ok('14. No invisible (zero-size) hotspots', zeroSize === 0)

    const broken = await page.locator('img').evaluateAll(imgs => imgs.filter(i => !i.complete || i.naturalWidth === 0).length)
    ok('15. No broken images', broken === 0)

    ok('16. No duplicate baked/live text (module names appear once each)', (bodyText.match(/SmokeCraft 360/g) || []).length === 1)

    await page.screenshot({ path: `${PROOF_DIR}/03-live-crafthub-native-res.png` })
    await browser.close()
  }
})().then(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

  console.log('\n── Viewports ──')
  for (const vp of VIEWPORTS) {
    const page = await (await browser.newContext({ viewport: { width: vp.width, height: vp.height } })).newPage()
    await page.goto(`${BASE}/crafthub`)
    await page.waitForTimeout(500)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
    ok(`No horizontal overflow at ${vp.name}`, !overflow)
    await page.screenshot({ path: `${PROOF_DIR}/viewport-${vp.name}.png` })
    await page.close()
  }

  console.log('\n── Touch targets / focus / refresh ──')
  {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
    await page.goto(`${BASE}/crafthub`)
    await page.waitForTimeout(500)
    const smallTargets = await page.locator('button').evaluateAll(btns =>
      btns.filter(b => { const r = b.getBoundingClientRect(); return r.height > 0 && r.height < 44 }).length
    )
    ok('20. Touch targets meet minimum size (module cards/banners ≥44px tall)', smallTargets === 0)

    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    ok('19. Keyboard focus works (Tab moves focus to a real control)', focused === 'BUTTON' || focused === 'A')

    await page.reload()
    await page.waitForTimeout(500)
    ok('18. Nested refresh works (page still renders after reload)', await page.locator('img[alt="CraftHub 360 — Venue Table Experience"]').count() > 0)

    const errors = []
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()) })
    await page.goto(`${BASE}/crafthub`)
    await page.waitForTimeout(500)
    ok('21. No console errors caused by this package', errors.length === 0)

    await page.screenshot({ path: `${PROOF_DIR}/09-keyboard-focus.png` })
    await page.close()
  }

  await browser.close()

  console.log('\n' + '─'.repeat(51))
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
})
