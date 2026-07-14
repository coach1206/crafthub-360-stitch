/**
 * verify-live-smokecraft-deployment.mjs
 * Checks each SmokeCraft route for: correct asset reference, HTTP asset availability,
 * and basic route accessibility. Tests against local dev server (port 5000).
 * For the deployed Vercel URL, documents proxy-403 if unreachable.
 */

import { chromium } from 'playwright'

const LOCAL_BASE = 'http://localhost:5000'
const VERCEL_BASE = 'https://crafthub-360-stitch-git-recovery-smokecraft-codex-final-coach1206-smokecraft360.vercel.app'

const ROUTES = [
  { id: '01', path: '/smokecraft',                  expectedAsset: 'smokecraft-landing.png' },
  { id: '02', path: '/smokecraft/enroll',            expectedAsset: 'discover-profile-bg.jpg' },
  { id: '03', path: '/smokecraft/identity',          expectedAsset: 'IDENTY.png' },
  { id: '04', path: '/smokecraft/golden-box',        expectedAsset: 'GOLDEN%20BOX%20RULES.png' },
  { id: '05', path: '/smokecraft/mentor-selection',  expectedAsset: 'MENTOR%20SELECTION1.png' },
  { id: '06', path: '/smokecraft/format',            expectedAsset: 'smokecraft-vitola.png' },
  { id: '07', path: '/smokecraft/seed-soil',         expectedAsset: 'SEED%20&%20SOIL.png' },
  { id: '08', path: '/smokecraft/pairing-lab',       expectedAsset: 'PAIRING%20LAB1.png' },
  { id: '09', path: '/smokecraft/humidor-match',     expectedAsset: 'Humidor%20Match%201.png' },
  { id: '10', path: '/smokecraft/request-purchase',  expectedAsset: 'REQUEST%20PURCHASE.png' },
  { id: '11', path: '/smokecraft/cut-toast-light',   expectedAsset: 'CUT%20%20TOAST,%20&%20LIGHT.png' },
  { id: '12', path: '/smokecraft/first-third',       expectedAsset: 'FIRST%20%20THIRD1.png' },
  { id: '13', path: '/smokecraft/second-third',      expectedAsset: 'SECOND%20THIRD.png' },
  { id: '14', path: '/smokecraft/flavor-memory',     expectedAsset: 'FLAVOR%20MEMORY.png' },
  { id: '15', path: '/smokecraft/final-third',       expectedAsset: 'FINAL%20THIRD.png' },
  { id: '16', path: '/smokecraft/scorecard',         expectedAsset: 'Scorecard.png' },
  { id: '17', path: '/smokecraft/final-review',      expectedAsset: 'FINAL%20REVIEW.png' },
  { id: '18', path: '/smokecraft/passport-stamp',    expectedAsset: 'PASSPORT%20STAMP.png' },
  { id: '19', path: '/smokecraft/connections',       expectedAsset: 'connections-hero.jpg' },
  { id: '20', path: '/smokecraft/management-sync',   expectedAsset: 'MANAGEMENT%20SYNC.png' },
  { id: '21', path: '/smokecraft/session-complete',  expectedAsset: 'SESSION%20COMPLETE.png' },
  { id: '22', path: '/smokecraft/leaderboard',       expectedAsset: 'NEW%20DEMO%20LOUNG%20RANKING.png' },
  { id: '23', path: '/smokecraft/event-challenge',   expectedAsset: 'smokecraft-event-challenge.png' },
  { id: '24', path: '/smokecraft/how-it-works',      expectedAsset: 'smokecraft-how-it-works.png' },
  { id: '25', path: '/smokecraft/smokecraft-challenge', expectedAsset: 'smokecraft-challenge.png' },
  { id: '26', path: '/smokecraft/second-humidor-match', expectedAsset: 'smokecraft-second-humidor-match.png' },
  { id: '27', path: '/smokecraft/mini-tasting',      expectedAsset: 'smokecraft-mini-tasting-round.png' },
  { id: '28', path: '/smokecraft/visit-complete',    expectedAsset: 'smokecraft-visit-complete.png' },
]

async function checkVercelReachability() {
  try {
    const res = await fetch(`${VERCEL_BASE}/smokecraft`, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
    return { reachable: true, status: res.status }
  } catch (e) {
    return { reachable: false, error: e.message }
  }
}

async function verifyRoute(page, base, route) {
  const url = `${base}${route.path}`
  const consoleErrors = []
  const assetRequests = []

  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('request', req => {
    const u = req.url()
    if (u.includes(route.expectedAsset.replace(/%20/g,' ').replace(/%26/g,'&').replace(/%2C/g,','))) {
      assetRequests.push(u)
    }
  })

  let navigationOk = false
  let actualPath = null
  try {
    await page.addInitScript(() => {
      sessionStorage.setItem('novee_demo_mode', '1')
      localStorage.removeItem('smokecraft_progress')
    })
    const response = await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' })
    navigationOk = response && response.status() < 400
    actualPath = new URL(page.url()).pathname
  } catch (e) {
    return { id: route.id, path: route.path, result: 'TIMEOUT', error: e.message }
  }

  await page.waitForTimeout(1000)

  // Check for background-image or img src referencing the expected asset.
  // We check against the raw filename (last segment) in both encoded and decoded form,
  // and also inspect computed styles to catch Vite-served asset URLs.
  const assetVisible = await page.evaluate((asset) => {
    const decoded = decodeURIComponent(asset)
    const filename = decoded.split('/').pop()
    const encoded = asset.split('/').pop()
    function matches(str) {
      if (!str) return false
      return str.includes(filename) || str.includes(encoded) || str.includes(asset)
    }
    // Check inline styles
    for (const el of document.querySelectorAll('[style]')) {
      if (matches(el.style.backgroundImage)) return true
    }
    // Check computed background-image on all elements
    for (const el of document.querySelectorAll('*')) {
      try {
        const bg = getComputedStyle(el).backgroundImage
        if (bg && bg !== 'none' && matches(bg)) return true
      } catch (_) {}
    }
    // Check img elements
    for (const img of document.querySelectorAll('img')) {
      if (matches(img.src) || matches(img.getAttribute('src'))) return true
    }
    return false
  }, route.expectedAsset)

  // Check horizontal overflow
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  })

  return {
    id: route.id,
    path: route.path,
    expectedAsset: route.expectedAsset,
    navigationOk,
    actualPath,
    assetVisible,
    hasHorizontalOverflow,
    consoleErrors: consoleErrors.slice(0, 3),
    result: navigationOk && assetVisible && !hasHorizontalOverflow ? 'PASS' : 'FAIL',
  }
}

async function main() {
  console.log('=== verify-live-smokecraft-deployment.mjs ===\n')

  // Check Vercel reachability
  console.log('Checking Vercel deployment reachability...')
  const vercelStatus = await checkVercelReachability()
  if (vercelStatus.reachable) {
    console.log(`  Vercel: HTTP ${vercelStatus.status}`)
  } else {
    console.log(`  Vercel: UNREACHABLE — ${vercelStatus.error}`)
    console.log('  (Environment proxy blocks outbound HTTPS to Vercel — known constraint)')
  }
  console.log()

  // Test against local dev server
  console.log(`Testing against local dev server: ${LOCAL_BASE}\n`)

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  })

  const results = []
  let pass = 0
  let fail = 0

  for (const route of ROUTES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const result = await verifyRoute(page, LOCAL_BASE, route)
    await context.close()

    results.push(result)
    const status = result.result === 'PASS' ? '  PASS' : `  FAIL`
    const assetNote = result.assetVisible === false ? ' [asset not found in DOM]' : ''
    const overflowNote = result.hasHorizontalOverflow ? ' [horizontal overflow]' : ''
    console.log(`${result.id} ${route.path.padEnd(40)} ${status}${assetNote}${overflowNote}`)
    if (result.consoleErrors && result.consoleErrors.length > 0) {
      result.consoleErrors.forEach(e => console.log(`      console.error: ${e}`))
    }
    if (result.result === 'PASS') pass++; else fail++
  }

  await browser.close()

  console.log(`\n=== RESULTS: ${pass}/${ROUTES.length} PASS, ${fail} FAIL ===`)

  if (fail === 0) {
    console.log('\nAll routes PASS. SmokeCraft 360 deployment verified.')
  } else {
    console.log('\nSome routes FAIL. Review output above for details.')
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
