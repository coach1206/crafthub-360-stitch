/**
 * verify-first-six-assets.mjs
 * SmokeCraft 360 — First Six Route Approved Asset Verification
 *
 * Asserts each of the six routes renders its verified founder-approved image.
 * Fails if any route bypasses SC_ASSETS or serves a forbidden crop/placeholder.
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const PASS = '✅'
const FAIL = '❌'

let passed = 0
let failed = 0

function log(ok, label, detail = '') {
  const sym = ok ? PASS : FAIL
  console.log(`${sym} ${label}${detail ? ` — ${detail}` : ''}`)
  ok ? passed++ : failed++
}

// Map each route to its required image path and explicitly forbidden paths
const ROUTE_SPECS = [
  {
    route: '/smokecraft',
    label: 'Landing',
    required: '/assets/smokecraft-reference/approved/smokecraft-landing.png',
    forbidden: [],
  },
  {
    route: '/smokecraft/identity',
    label: 'Identity',
    required: '/assets/smokecraft/IDENTY.png',
    forbidden: [
      '/assets/smokecraft/cropped/discover-profile-bg.jpg',
    ],
  },
  {
    route: '/smokecraft/golden-box',
    label: 'Golden Box',
    required: '/assets/smokecraft/GOLDEN%20BOX%20RULES.png',
    forbidden: [
      '/assets/smokecraft/cropped/golden-box-hero-v2.jpg',
      '/assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png',
    ],
  },
  {
    route: '/smokecraft/mentor-selection',
    label: 'Mentor Selection',
    required: '/assets/smokecraft/MENTOR%20SELECTION1.png',
    forbidden: [],
  },
  {
    route: '/smokecraft/format',
    label: 'Format',
    required: '/assets/smokecraft-reference/approved/smokecraft-vitola.png',
    forbidden: [
      '/assets/smokecraft/cropped/format-master-tip-v2.jpg',
    ],
  },
  {
    route: '/smokecraft/seed-soil',
    label: 'Seed & Soil',
    required: '/assets/smokecraft/SEED%20&%20SOIL.png',
    forbidden: [
      '/assets/smokecraft/cropped/seed-soil-bg.jpg',
    ],
  },
]

async function checkRoute(page, spec) {
  console.log(`\n── ${spec.label} (${spec.route}) ──`)

  // Collect all image requests during load
  const requestedImages = new Set()
  const responseStatuses = new Map()

  page.on('request', req => {
    if (req.resourceType() === 'image') {
      requestedImages.add(req.url())
    }
  })
  page.on('response', resp => {
    if (resp.request().resourceType() === 'image') {
      responseStatuses.set(resp.url(), resp.status())
    }
  })

  await page.goto(`${BASE}${spec.route}`, { waitUntil: 'domcontentloaded' })
  // Enable demo mode to bypass session guards
  await page.evaluate(() => { sessionStorage.setItem('novee_demo_mode', '1') })
  await page.waitForTimeout(800)

  // Re-collect after demo mode — navigate again so SC_ASSETS images load
  requestedImages.clear()
  responseStatuses.clear()

  const requests2 = []
  const handler = req => { if (req.resourceType() === 'image') requests2.push(req.url()) }
  page.on('request', handler)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  page.off('request', handler)
  requests2.forEach(u => requestedImages.add(u))

  // Check required image is present
  const requiredUrl = `${BASE}${spec.required}`
  const requiredFound = [...requestedImages].some(u => u === requiredUrl || decodeURIComponent(u) === decodeURIComponent(requiredUrl))
  log(requiredFound, `Required image requested`, spec.required)

  // Check required image returns 200
  if (requiredFound) {
    const matchedUrl = [...requestedImages].find(u => u === requiredUrl || decodeURIComponent(u) === decodeURIComponent(requiredUrl))
    // Fetch directly to check status
    const statusResp = await page.evaluate(async (url) => {
      try {
        const r = await fetch(url)
        return r.status
      } catch { return 0 }
    }, matchedUrl || requiredUrl)
    log(statusResp === 200, `Required image returns HTTP 200`, `got ${statusResp}`)
  } else {
    log(false, `Required image returns HTTP 200`, 'not requested — skipping status check')
  }

  // Check none of the forbidden images were requested
  for (const forbiddenPath of spec.forbidden) {
    const forbiddenUrl = `${BASE}${forbiddenPath}`
    const forbiddenFound = [...requestedImages].some(u =>
      u === forbiddenUrl || decodeURIComponent(u) === decodeURIComponent(forbiddenUrl)
    )
    log(!forbiddenFound, `Forbidden image NOT requested`, forbiddenPath)
  }

  // Check SC_ASSETS is used — SmokeCraftAssetScreen renders via inline backgroundImage CSS
  // Check both the encoded path and decoded path to handle browser URL normalization
  const domHasRequired = await page.evaluate((required) => {
    let reqDecoded = required
    try { reqDecoded = decodeURIComponent(required) } catch (_) {}
    // Check <img> tags
    const imgMatch = Array.from(document.querySelectorAll('img')).some(el => {
      const src = el.getAttribute('src') || ''
      return src === required || src === reqDecoded
    })
    if (imgMatch) return true
    // Check inline backgroundImage style — el.style.backgroundImage contains url(...) as set
    return Array.from(document.querySelectorAll('*')).some(el => {
      const inline = el.style.backgroundImage || ''
      return inline.includes(required) || inline.includes(reqDecoded)
    })
  }, spec.required)
  log(domHasRequired, `Required image present in DOM (img or background-image)`, spec.required)
}

;(async () => {
  console.log('SmokeCraft 360 — First Six Route Asset Verification')
  console.log('='.repeat(55))

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

  try {
    const resp = await (await browser.newPage()).goto(BASE, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null)
    if (!resp || resp.status() >= 500) {
      console.log('❌ Dev server not responding at', BASE)
      process.exit(1)
    }
    console.log('Dev server OK at', BASE)

    for (const spec of ROUTE_SPECS) {
      const page = await browser.newPage()
      try {
        await checkRoute(page, spec)
      } finally {
        await page.close()
      }
    }

  } finally {
    await browser.close()
  }

  console.log('\n' + '='.repeat(55))
  console.log(`Results: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
})()
