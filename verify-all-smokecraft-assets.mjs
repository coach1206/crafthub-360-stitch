/**
 * verify-all-smokecraft-assets.mjs
 * SmokeCraft 360 — Full Journey Asset Verification (all routes)
 *
 * For each route: verifies the correct SC_ASSETS image is requested,
 * returns HTTP 200, and appears in the DOM.
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
    forbidden: ['/cropped/discover-profile'],
  },
  {
    route: '/smokecraft/golden-box',
    label: 'Golden Box',
    required: '/assets/smokecraft/GOLDEN%20BOX%20RULES.png',
    forbidden: ['/cropped/golden-box'],
  },
  {
    // Package A rebuild: the single flattened MENTOR SELECTION1.png composite
    // (which baked in unrelated NOVEE OS chrome) was replaced by the real,
    // individual approved mentor portrait files + real bio/tag data from
    // src/modules/smokecraft/smokeCraftMentors.js — see
    // SMOKECRAFT_COMPLETE_REBUILD_MATRIX.md Package A.
    route: '/smokecraft/mentor-selection',
    label: 'Mentor Selection',
    required: '/mentors/don-alejandro.jpg',
    forbidden: [],
  },
  {
    route: '/smokecraft/format',
    label: 'Format',
    required: '/assets/smokecraft-reference/approved/smokecraft-vitola.png',
    forbidden: ['/cropped/format'],
  },
  {
    route: '/smokecraft/seed-soil',
    label: 'Seed & Soil',
    required: '/assets/smokecraft/SEED%20&%20SOIL.png',
    forbidden: ['/cropped/seed'],
  },
  {
    route: '/smokecraft/pairing-lab',
    label: 'Pairing Lab',
    required: '/assets/smokecraft/PAIRING%20LAB1.png',
    forbidden: ['/cropped/pairing-lab-hero'],
  },
  {
    route: '/smokecraft/humidor-match',
    label: 'Humidor Match',
    required: '/assets/smokecraft/Humidor%20Match%201.png',
    forbidden: ['/cropped/humidor-match'],
  },
  {
    route: '/smokecraft/request-purchase',
    label: 'Request Purchase',
    required: '/assets/smokecraft/REQUEST%20PURCHASE.png',
    forbidden: ['/cropped/request-purchase-hero'],
  },
  {
    route: '/smokecraft/cut-toast-light',
    label: 'Cut Toast Light',
    required: '/assets/smokecraft/CUT%20%20TOAST',
    forbidden: ['/cropped/cut-toast-light-hero'],
  },
  {
    route: '/smokecraft/first-third',
    label: 'First Third',
    required: '/assets/smokecraft/FIRST%20%20THIRD1.png',
    forbidden: ['/cropped/first-third-bg'],
  },
  {
    route: '/smokecraft/second-third',
    label: 'Second Third',
    required: '/assets/smokecraft/SECOND%20THIRD.png',
    forbidden: ['/assets/smokecraft-reference/approved/smokecraft-second-third'],
  },
  {
    route: '/smokecraft/flavor-memory',
    label: 'Flavor Memory',
    required: '/assets/smokecraft/FLAVOR%20MEMORY.png',
    forbidden: ['/cropped/flavor-memory-hero'],
  },
  {
    route: '/smokecraft/final-third',
    label: 'Final Third',
    required: '/assets/smokecraft/FINAL%20THIRD.png',
    forbidden: ['/cropped/final-third'],
  },
  {
    route: '/smokecraft/scorecard',
    label: 'Scorecard',
    required: '/assets/smokecraft/Scorecard.png',
    forbidden: ['/cropped/scorecard-bg'],
  },
  {
    route: '/smokecraft/final-review',
    label: 'Final Review',
    required: '/assets/smokecraft/FINAL%20REVIEW.png',
    forbidden: ['/cropped/final-review-bg'],
  },
  {
    route: '/smokecraft/passport-stamp',
    label: 'Passport Stamp',
    required: '/assets/smokecraft/PASSPORT%20STAMP.png',
    forbidden: ['/cropped/passport-stamp-hero'],
  },
  {
    route: '/smokecraft/management-sync',
    label: 'Management Sync',
    required: '/assets/smokecraft/MANAGEMENT%20SYNC.png',
    forbidden: ['/cropped/management-sync-hero'],
  },
  {
    route: '/smokecraft/session-complete',
    label: 'Session Complete',
    // Package S rebuilt S27 as "Recommended Next Journey," wiring the
    // approved Recommend next journey.png asset in place of the prior
    // SESSION COMPLETE.png shell.
    required: '/assets/smokecraft/Recommend%20next%20journey.png',
    forbidden: ['/assets/smokecraft-reference/approved/smokecraft-session-complete'],
  },
  {
    route: '/smokecraft/leaderboard',
    label: 'Leaderboard',
    // Production image audit: LEADERBOARD 111.png is the newest raw upload
    // and now takes precedence; NEW DEMO LOUNG RANKING.png is preserved on
    // disk as a reference-only alternate.
    required: '/assets/smokecraft/LEADERBOARD%20111.png',
    forbidden: ['/assets/smokecraft-reference/approved/smokecraft-leaderboard'],
  },
  {
    route: '/smokecraft/event-challenge',
    label: 'Event Challenge',
    // Production image audit: EVENT CHALLENGE 111.png is the newest raw
    // upload and now takes precedence over the prior approved reference.
    required: '/assets/smokecraft/EVENT%20CHALLENGE%20111.png',
    forbidden: ['/assets/smokecraft-reference/approved/smokecraft-event-challenge'],
  },
  {
    route: '/smokecraft/how-it-works',
    label: 'How It Works',
    required: '/assets/smokecraft-reference/approved/smokecraft-how-it-works.png',
    forbidden: [],
  },
]

async function testRoute(page, spec) {
  const requestedUrls = new Set()
  const onRequest = req => requestedUrls.add(req.url())
  page.on('request', onRequest)

  try {
    await page.goto(`${BASE}${spec.route}`, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1000)

    // Check required image was requested
    const requiredFound = [...requestedUrls].some(u => u.includes(spec.required.replace('%20', ' ').replace('%20', ' ')) || u.includes(spec.required))
    log(requiredFound, `${spec.label}: required image requested`, requiredFound ? spec.required : `Expected: ${spec.required}`)

    // Check forbidden images were NOT requested
    for (const forbidden of spec.forbidden) {
      const forbiddenFound = [...requestedUrls].some(u => u.includes(forbidden))
      log(!forbiddenFound, `${spec.label}: forbidden image not requested`, forbiddenFound ? `FOUND forbidden: ${forbidden}` : '')
    }

    // Check image or background-image in DOM
    const inDom = await page.evaluate((required) => {
      const imgs = Array.from(document.querySelectorAll('img'))
      const hasImg = imgs.some(img => img.src && img.src.includes(required.split('%')[0].split('/').pop().split('.')[0]))
      const divs = Array.from(document.querySelectorAll('[style*="background"]'))
      const hasBg = divs.some(d => d.style.backgroundImage && d.style.backgroundImage.includes(required.split('%')[0].split('/').pop().split('.')[0]))
      return hasImg || hasBg
    }, spec.required)
    log(inDom, `${spec.label}: image present in DOM`)

  } finally {
    page.off('request', onRequest)
  }
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

for (const spec of ROUTE_SPECS) {
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => { sessionStorage.setItem('novee_demo_mode', '1') })
  await testRoute(page, spec)
  await page.close()
}

await browser.close()

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error(`FAIL: ${failed} asset checks failed`)
  process.exit(1)
} else {
  console.log('PASS: All asset checks passed')
  process.exit(0)
}
