import { chromium } from 'playwright'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = 'http://localhost:3001'
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, hasTouch: false },
  { name: 'tablet-landscape', width: 1024, height: 768, hasTouch: true },
  { name: 'tablet-portrait', width: 768, height: 1024, hasTouch: true },
  { name: 'kiosk', width: 1920, height: 1080, hasTouch: false },
]
const CATEGORIES = ['Appearance', 'Construction', 'Draw', 'Burn', 'Flavor', 'Pairing Match']

async function reachScorecard(page) {
  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'load', timeout: 40000 })
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 15000 })
  await page.fill('input[aria-label="Full Name"]', 'Scorecard Full Verify')
  await page.selectOption('select[aria-label="Cigar Experience Level"]', { index: 1 })
  await page.click('[data-testid="identity-begin"]')
  await page.waitForURL('**/smokecraft/venue-select', { timeout: 15000 })
  await page.waitForTimeout(1500)
  const alpha = page.locator('text=Alpha Lounge (Seed)')
  if (await alpha.count().catch(() => 0)) { await alpha.click(); await page.click('text=Continue to Welcome') }
  else { await page.click('text=Continue without venue') }
  await page.waitForURL('**/smokecraft/welcome', { timeout: 15000 })
  await page.waitForTimeout(500)
  await page.click('text=Begin Experience')
  await page.waitForURL('**/smokecraft/golden-box', { timeout: 15000 })

  const chain = ['mentor-selection', 'seed-soil', 'humidor-match', 'meet-your-cigar', 'terroir', 'format',
    'request-purchase', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab',
    'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third']
  for (const stop of chain) await genericAdvance(page, { screenshotName: `sv-${stop}`, label: stop }).catch(() => {})

  const flavorChip = page.locator('button[aria-label="Earth flavor"]').first()
  if (await flavorChip.count()) { await flavorChip.click().catch(() => {}); await page.waitForTimeout(300) }
  const continueBtn = page.locator('button:has-text("Continue to Scorecard")').first()
  if (await continueBtn.count()) { await continueBtn.scrollIntoViewIfNeeded(); await continueBtn.click({ timeout: 5000 }) }
  await page.waitForURL('**/smokecraft/scorecard', { timeout: 15000 })
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  let pass = 0, fail = 0
  const failures = []

  for (const vp of VIEWPORTS) {
    console.log(`\n== ${vp.name} ==`)
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.hasTouch })
    const page = await context.newPage()
    try {
      await reachScorecard(page)
    } catch (e) {
      console.log(`  FAILED TO REACH SCORECARD: ${e.message.split('\n')[0]}`)
      for (const cat of CATEGORIES) { fail++; failures.push(`${vp.name}/${cat}: could not reach scorecard`) }
      await context.close()
      continue
    }
    await page.waitForTimeout(800)

    for (const cat of CATEGORIES) {
      const btn = page.locator(`button[aria-label*="Rate ${cat} 4"]`).first()
      const count = await btn.count()
      if (!count) { fail++; failures.push(`${vp.name}/${cat}: control not found`); console.log(`  FAIL ${cat}: not found`); continue }
      const box = await btn.boundingBox()
      const inView = box && box.x >= 0 && box.y >= 0 && box.x + box.width <= vp.width && box.y + box.height <= vp.height
      if (!inView) { fail++; failures.push(`${vp.name}/${cat}: out of viewport`); console.log(`  FAIL ${cat}: out of viewport ${JSON.stringify(box)}`); continue }
      let hitOk = false
      if (box) {
        const cx = box.x + box.width / 2, cy = box.y + box.height / 2
        const hit = await page.evaluate(({ x, y }) => {
          const el = document.elementFromPoint(x, y)
          return el ? el.getAttribute('aria-label') : null
        }, { x: cx, y: cy })
        hitOk = hit && hit.includes(cat)
      }
      try {
        await btn.click({ timeout: 3000 })
        await page.waitForTimeout(150)
        const pressed = await btn.getAttribute('aria-pressed')
        if (pressed === 'true' && hitOk) { pass++; console.log(`  PASS ${cat}`) }
        else { fail++; failures.push(`${vp.name}/${cat}: click did not set state (hitOk=${hitOk}, pressed=${pressed})`); console.log(`  FAIL ${cat}: hitOk=${hitOk} pressed=${pressed}`) }
      } catch (e) {
        fail++; failures.push(`${vp.name}/${cat}: ${e.message.split('\n')[0]}`)
        console.log(`  FAIL ${cat}: ${e.message.split('\n')[0]}`)
      }
    }
    await context.close()
  }
  await browser.close()
  console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
  if (failures.length) { console.log('Failures:'); failures.forEach(f => console.log('  ' + f)) }
}

main().catch(e => { console.error(e); process.exit(1) })
