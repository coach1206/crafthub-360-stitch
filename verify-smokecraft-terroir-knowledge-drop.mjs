/**
 * verify-smokecraft-terroir-knowledge-drop.mjs
 * Package G — Terroir + Knowledge Drop Live Experience
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
function ok(msg)  { pass++; console.log(`  ✓ ${msg}`) }
function bad(msg) { fail++; console.error(`  ✗ ${msg}`) }

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
}

async function seedGuest(page, journeyPatch) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ journeyPatch }) => {
    if (journeyPatch) {
      localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...journeyPatch }))
    } else {
      localStorage.removeItem('sc_journey_v1')
    }
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'tkd-test-' + Date.now(), guestId: 'tkd-test-guest',
      completedSteps: [], xp: 0, rank: 'Novice', badges: [],
      __version: 4,
    }))
  }, { journeyPatch })
}

async function checkNoHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  // ── 1. Terroir route resolves ──
  console.log('\n── Suite 1: Terroir route resolves ──')
  await seedGuest(page)
  await nav(page, '/smokecraft/terroir')
  let title = await page.textContent('h1')
  title.includes('Terroir') || title.includes('Explore') ? ok('/smokecraft/terroir resolves') : bad(`Title: ${title}`)

  // ── 2. Knowledge Drop route resolves ──
  console.log('\n── Suite 2: Knowledge Drop route resolves ──')
  await nav(page, '/smokecraft/knowledge-drop')
  title = await page.textContent('h1')
  title.includes('Topic') || title.includes('Tobacco') || title.includes('Fermentation') ? ok('/smokecraft/knowledge-drop resolves') : bad(`Title: ${title}`)

  // ── 3. Every Terroir topic can be selected ──
  console.log('\n── Suite 3: Terroir topics selectable ──')
  await nav(page, '/smokecraft/terroir')
  const terroirTabs = ['Country', 'Region', 'Soil', 'Climate', 'Growing Conditions', 'Why It Matters']
  let allSelectable = true
  for (const t of terroirTabs) {
    const btn = await page.$(`[role="tab"][aria-label^="${t}"]`)
    if (!btn) { allSelectable = false; break }
    await btn.click()
    await page.waitForTimeout(150)
    const sel = await btn.getAttribute('aria-selected')
    if (sel !== 'true') { allSelectable = false; break }
  }
  allSelectable ? ok('All 6 Terroir sections independently selectable') : bad('A Terroir section failed to select')

  // ── 4. Content changes correctly (Terroir) ──
  console.log('\n── Suite 4: Content changes correctly ──')
  await page.click('[role="tab"][aria-label^="Soil"]')
  await page.waitForTimeout(150)
  let bodyText = await page.evaluate(() => document.body.innerText)
  bodyText.includes('Soil composition') ? ok('Terroir content updates to Soil section') : bad('Content did not update for Soil')

  // ── Knowledge Drop topic selection ──
  console.log('\n── Suite 3b: Knowledge Drop topics selectable ──')
  await nav(page, '/smokecraft/knowledge-drop')
  const kdTopics = ['Tobacco', 'Fermentation', 'Aging', 'Factory Story']
  let allKdSelectable = true
  for (const t of kdTopics) {
    const btn = await page.$(`[role="tab"][aria-label^="${t}"]`)
    if (!btn) { allKdSelectable = false; break }
    await btn.click()
    await page.waitForTimeout(150)
    const sel = await btn.getAttribute('aria-selected')
    if (sel !== 'true') { allKdSelectable = false; break }
  }
  allKdSelectable ? ok('All 4 Knowledge Drop topics independently selectable') : bad('A Knowledge Drop topic failed to select')

  await page.click('[role="tab"][aria-label^="Fermentation"]')
  await page.waitForTimeout(150)
  bodyText = await page.evaluate(() => document.body.innerText)
  bodyText.includes('pilones') ? ok('Knowledge Drop content updates to Fermentation topic') : bad('Content did not update for Fermentation')

  // ── 5. Progress persists (canonical journey) ──
  console.log('\n── Suite 5: Progress persists ──')
  const journeyAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}'))
  journeyAfter.knowledgeDrop?.viewedTopics?.includes('fermentation')
    ? ok('Knowledge Drop viewed topic persisted to sc_journey_v1')
    : bad(`journey.knowledgeDrop: ${JSON.stringify(journeyAfter.knowledgeDrop)}`)

  // ── 6. Refresh restores state ──
  console.log('\n── Suite 6: Refresh restores state ──')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const viewedBadge = await page.textContent('header')
  viewedBadge.includes('4 of 4 topics viewed')
    ? ok('Refresh restores viewed-topics count')
    : bad(`Header after refresh: ${viewedBadge}`)

  // ── 7. Back works ──
  console.log('\n── Suite 7: Back works ──')
  const beforeUrl = page.url()
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  page.url() !== beforeUrl ? ok('Back navigates away from Knowledge Drop') : bad('Back did not navigate')

  // ── 8. Continue works ──
  console.log('\n── Suite 8: Continue works ──')
  await nav(page, '/smokecraft/knowledge-drop')
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/final-third'
    ? ok('Continue on Knowledge Drop navigates to /smokecraft/final-third')
    : bad(`Continue landed on ${page.url()}`)

  // Terroir Continue too
  await nav(page, '/smokecraft/terroir')
  await page.click('[role="tab"][aria-label^="Country"]')
  await page.waitForTimeout(150)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/format'
    ? ok('Continue on Terroir navigates to /smokecraft/format')
    : bad(`Terroir Continue landed on ${page.url()}`)

  // ── 9. Resume works — pre-seeded canonical selection restored ──
  console.log('\n── Suite 9: Resume restores prior progress ──')
  await seedGuest(page, { terroir: { viewedSections: ['country', 'soil'] } })
  await nav(page, '/smokecraft/terroir')
  const terroirHeader = await page.textContent('header')
  terroirHeader.includes('2 of 6 sections viewed')
    ? ok('Terroir resume restores previously viewed sections')
    : bad(`Terroir header: ${terroirHeader}`)

  await seedGuest(page, { knowledgeDrop: { viewedTopics: ['tobacco', 'aging', 'factory'], quizScore: 2 } })
  await nav(page, '/smokecraft/knowledge-drop')
  const kdHeader = await page.textContent('header')
  kdHeader.includes('3 of 4 topics viewed') && kdHeader.includes('Quiz score: 2')
    ? ok('Knowledge Drop resume restores viewed topics and quiz score')
    : bad(`Knowledge Drop header: ${kdHeader}`)

  // ── 10. No horizontal overflow ──
  console.log('\n── Suite 10: No horizontal overflow ──')
  await nav(page, '/smokecraft/terroir')
  const overflowTerroir = await checkNoHorizontalOverflow(page)
  overflowTerroir ? ok('Terroir has no horizontal overflow (desktop)') : bad('Terroir has horizontal overflow')
  await nav(page, '/smokecraft/knowledge-drop')
  const overflowKd = await checkNoHorizontalOverflow(page)
  overflowKd ? ok('Knowledge Drop has no horizontal overflow (desktop)') : bad('Knowledge Drop has horizontal overflow')

  // ── 11. Tablet and mobile layout work ──
  console.log('\n── Suite 11: Tablet and mobile layout ──')
  const tabletPage = await context.newPage()
  await tabletPage.setViewportSize({ width: 768, height: 1024 })
  await tabletPage.goto(`${BASE}/smokecraft/terroir`, { waitUntil: 'domcontentloaded' })
  await tabletPage.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await tabletPage.reload({ waitUntil: 'domcontentloaded' })
  await tabletPage.waitForTimeout(500)
  const tabletOverflow = await checkNoHorizontalOverflow(tabletPage)
  const tabletNavVisible = await tabletPage.$('div[role="navigation"]')
  ;(tabletOverflow && tabletNavVisible) ? ok('Terroir renders correctly at tablet viewport (768x1024)') : bad('Terroir tablet layout issue')

  const mobilePage = await context.newPage()
  await mobilePage.setViewportSize({ width: 390, height: 844 })
  await mobilePage.goto(`${BASE}/smokecraft/knowledge-drop`, { waitUntil: 'domcontentloaded' })
  await mobilePage.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await mobilePage.reload({ waitUntil: 'domcontentloaded' })
  await mobilePage.waitForTimeout(500)
  const mobileOverflow = await checkNoHorizontalOverflow(mobilePage)
  const mobileNavVisible = await mobilePage.$('div[role="navigation"]')
  ;(mobileOverflow && mobileNavVisible) ? ok('Knowledge Drop renders correctly at mobile viewport (390x844)') : bad('Knowledge Drop mobile layout issue')
  await tabletPage.close()
  await mobilePage.close()

  // ── 12. Accessibility labels exist ──
  console.log('\n── Suite 12: Accessibility labels ──')
  await nav(page, '/smokecraft/terroir')
  const terroirTablist = await page.$('[role="tablist"][aria-label="Terroir sections"]')
  terroirTablist ? ok('Terroir section selector has aria-label') : bad('Terroir tablist aria-label missing')
  await nav(page, '/smokecraft/knowledge-drop')
  const kdTablist = await page.$('[role="tablist"][aria-label="Knowledge Drop topics"]')
  kdTablist ? ok('Knowledge Drop topic selector has aria-label') : bad('Knowledge Drop tablist aria-label missing')

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
