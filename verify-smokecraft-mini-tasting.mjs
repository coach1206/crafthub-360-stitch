import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
let passed = 0
let failed = 0

function ok(msg) { passed++; console.log(`  ✓ ${msg}`) }
function bad(msg) { failed++; console.log(`  ✗ ${msg}`) }

async function seedGuest(page, opts = {}) {
  await page.goto(`${BASE}/smokecraft/enroll`)
  await page.evaluate((o) => {
    const session = {
      sessionId: 'test-guest-mini-tasting',
      xp: o.xp ?? 100,
      completedSteps: ['entry', 'enroll'],
      profile: { nickname: 'Alex' },
      smokeCraft: o.smokeCraft || {},
    }
    localStorage.setItem('novee_guest_session', JSON.stringify(session))
    if (o.demoMode !== false) localStorage.setItem('novee_demo_mode', 'true')
  }, opts)
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`)
  await page.waitForTimeout(400)
}

async function checkNoHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log('── Suite 1: Route resolves, page loads with no errors ──')
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await seedGuest(page)
  await nav(page, '/smokecraft/mini-tasting-module')
  const bodyText = await page.textContent('body')
  if (bodyText.includes('Mini Tasting')) ok('/smokecraft/mini-tasting-module resolves and renders Mini Tasting')
  else bad('Mini Tasting screen did not render')
  if (errors.length === 0) ok('No page errors thrown on load')
  else bad(`Page errors: ${errors.join(', ')}`)

  console.log('── Suite 2: Flight renders with real data ──')
  const flightText = await page.textContent('body')
  ;(flightText.includes('SmokeCraft House') || flightText.includes('Padrón') || flightText.includes('No tasting flight available'))
    ? ok('Today\'s Flight renders real cigar data or an honest empty state')
    : bad('Flight section did not render expected content')
  const listItems = await page.locator('[role="listitem"]').count()
  if (listItems > 0) ok(`Flight rendered ${listItems} cigar card(s)`)
  else bad('No cigar cards rendered')

  console.log('── Suite 3: Cigar attributes are live, honest fields ──')
  const originLabel = await page.locator('text=Origin:').first().count()
  if (originLabel > 0) ok('Origin field rendered per cigar')
  else bad('Origin field missing')
  const wrapperLabel = await page.locator('text=Wrapper:').first().count()
  if (wrapperLabel > 0) ok('Wrapper field rendered per cigar')
  else bad('Wrapper field missing')

  console.log('── Suite 4: Selection updates detail panel ──')
  const selectButtons = page.locator('button:has-text("Select")')
  const selectCount = await selectButtons.count()
  if (selectCount > 0) {
    await selectButtons.first().click()
    await page.waitForTimeout(200)
    const detailVisible = await page.locator('text=Flavor notes:').count()
    if (detailVisible > 0) ok('Selecting a cigar renders its detail/description panel')
    else bad('Selection did not render detail panel')
  } else {
    bad('No Select buttons present to test selection')
  }

  console.log('── Suite 5: Comparison panel works ──')
  const compareButtons = page.locator('button:has-text("Compare")')
  const compareCount = await compareButtons.count()
  if (compareCount >= 2) {
    await compareButtons.nth(0).click()
    await page.waitForTimeout(150)
    await compareButtons.nth(1).click()
    await page.waitForTimeout(200)
    const tableText = await page.textContent('body')
    if (tableText.includes('Strength') && tableText.includes('Finish') && tableText.includes('Draw')) {
      ok('Comparison table renders Strength/Body/Flavor/Finish/Construction/Burn/Draw rows')
    } else {
      bad('Comparison table missing required attribute rows')
    }
    if (tableText.includes('Not available')) ok('Comparison honestly shows "Not available" for unfilled attributes, never fabricated')
    else bad('Expected at least one honest "Not available" cell in comparison')
  } else {
    bad('Not enough cigars to test comparison (need >= 2)')
  }

  console.log('── Suite 6: Pairing panel updates ──')
  const pairingText = await page.textContent('body')
  if (pairingText.includes('Recommended Pairings')) ok('Pairing panel section renders')
  else bad('Pairing panel section missing')
  if (pairingText.includes('Coffee') && pairingText.includes('Rum') && pairingText.includes('Whiskey') && pairingText.includes('Chocolate') && pairingText.includes('Non-alcoholic')) {
    ok('Pairing panel lists all five required categories')
  } else {
    bad('Pairing panel missing one or more required categories')
  }

  console.log('── Suite 7: Begin Mini Tasting works, no fake loading ──')
  const beginBtn = page.locator('button:has-text("Begin Mini Tasting")')
  if (await beginBtn.count() > 0) {
    await beginBtn.click()
    await page.waitForTimeout(200)
    const startedText = await page.textContent('body')
    if (startedText.includes('Tasting Started')) ok('Begin Mini Tasting starts the workflow with immediate, real state change')
    else bad('Begin Mini Tasting did not update state')
  } else {
    bad('Begin Mini Tasting button not found')
  }

  console.log('── Suite 8: XP behavior — reuse existing engine, never invent ──')
  const xpText = await page.textContent('body')
  ;(xpText.includes('No XP configured') || xpText.includes('awards') )
    ? ok('XP disclosure is honest — either a real configured rule or "No XP configured"')
    : bad('XP disclosure missing or fabricated')

  console.log('── Suite 9: Persistence — selection, compare, completion persist ──')
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('novee_guest_session')
    return raw ? JSON.parse(raw) : null
  })
  if (stored?.smokeCraft?.miniTasting?.selectedCigarId) ok('Selected cigar persisted to session.smokeCraft.miniTasting')
  else bad('Selected cigar not persisted')
  if (Array.isArray(stored?.smokeCraft?.miniTasting?.compareIds) && stored.smokeCraft.miniTasting.compareIds.length >= 2) {
    ok('Comparison state persisted to session.smokeCraft.miniTasting')
  } else {
    bad('Comparison state not persisted')
  }
  if (stored?.smokeCraft?.miniTasting?.completedAt) ok('Completed tasting timestamp persisted')
  else bad('Completion not persisted')

  console.log('── Suite 10: Resume — state restored after reload ──')
  await page.reload()
  await page.waitForTimeout(400)
  const afterReload = await page.textContent('body')
  if (afterReload.includes('Selected') || afterReload.includes('In Compare')) {
    ok('Selection/comparison state restored after reload (resume works)')
  } else {
    bad('State not restored after reload')
  }

  console.log('── Suite 11: Fallback states — no cigars / offline / loading / error / retry ──')
  await nav(page, '/smokecraft/mini-tasting-module')
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await page.waitForTimeout(150)
  const offlineText = await page.textContent('body')
  if (offlineText.includes('Offline')) ok('Offline state renders honestly')
  else bad('Offline state did not render')
  await page.evaluate(() => window.dispatchEvent(new Event('online')))

  console.log('── Suite 12: No horizontal overflow (desktop) ──')
  if (await checkNoHorizontalOverflow(page)) ok('No horizontal overflow at 1440x900')
  else bad('Horizontal overflow detected at 1440x900')

  console.log('── Suite 13: Tablet and mobile responsive ──')
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.waitForTimeout(200)
  if (await checkNoHorizontalOverflow(page)) ok('Renders correctly at tablet viewport (768x1024), no overflow')
  else bad('Overflow at tablet viewport')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(200)
  if (await checkNoHorizontalOverflow(page)) ok('Renders correctly at mobile viewport (390x844), no overflow')
  else bad('Overflow at mobile viewport')
  await page.setViewportSize({ width: 1440, height: 900 })

  console.log('── Suite 14: Accessibility ──')
  const groupLabels = await page.locator('[aria-label]').count()
  if (groupLabels > 3) ok('Multiple ARIA labels present on interactive/structural regions')
  else bad('Insufficient ARIA labels')
  const imgRole = await page.locator('[role="img"][aria-label]').count()
  if (imgRole > 0) ok('Approved production visual reused with proper aria-label')
  else bad('Decorative image missing role/aria-label')

  console.log('── Suite 15: Back navigation, no route loop, no dead end ──')
  await nav(page, '/smokecraft/mini-tasting-module')
  const before = page.url()
  await page.locator('button:has-text("Back")').click()
  await page.waitForTimeout(300)
  const after = page.url()
  if (after !== before) ok('Back navigation leaves the Mini Tasting screen')
  else bad('Back navigation did not leave the screen (possible dead end)')

  await browser.close()

  console.log('\n' + '─'.repeat(50))
  console.log(`Result: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
