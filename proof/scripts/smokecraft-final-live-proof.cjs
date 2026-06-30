/**
 * SmokeCraft Final Live Browser Proof
 * Sets demo mode via sessionStorage, visits all 22+ wired SmokeCraft pages,
 * takes screenshots, and checks approved image load status.
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:4173'
const OUT_DIR = path.join(__dirname, '../../public/proof/smokecraft-final-live-proof')

const ROUTES = [
  // Batch 3 platform
  { name: 'landing',              route: '/smokecraft',                          file: 'smokecraft-proof-landing.png' },
  { name: 'art',                  route: '/smokecraft/art',                      file: 'smokecraft-proof-art.png' },
  { name: 'origins',              route: '/smokecraft/origins',                  file: 'smokecraft-proof-origins.png' },
  { name: 'how-it-works',         route: '/smokecraft/how-it-works',             file: 'smokecraft-proof-how-it-works.png' },
  { name: 'scan',                 route: '/smokecraft/scan',                     file: 'smokecraft-proof-scan.png' },
  { name: 'guest-pass',           route: '/smokecraft/guest-pass',               file: 'smokecraft-proof-guest-pass.png' },
  // Entry
  { name: 'enroll',               route: '/smokecraft/enroll',                   file: 'smokecraft-proof-enroll.png' },
  { name: 'identity',             route: '/smokecraft/identity',                 file: 'smokecraft-proof-identity.png' },
  { name: 'mentor',               route: '/smokecraft/mentor-selection',         file: 'smokecraft-proof-mentor.png' },
  // Batch 1 critical
  { name: 'first-third',          route: '/smokecraft/first-third',              file: 'smokecraft-proof-first-third.png' },
  { name: 'second-third',         route: '/smokecraft/second-third',             file: 'smokecraft-proof-second-third.png' },
  { name: 'final-third',          route: '/smokecraft/final-third',              file: 'smokecraft-proof-final-third.png' },
  { name: 'final-review',         route: '/smokecraft/final-review',             file: 'smokecraft-proof-final-review.png' },
  { name: 'session-complete',     route: '/smokecraft/session-complete',         file: 'smokecraft-proof-session-complete.png' },
  { name: 'flavor-memory',        route: '/smokecraft/flavor-memory',            file: 'smokecraft-proof-flavor-memory.png' },
  { name: 'challenge',            route: '/smokecraft/challenges',               file: 'smokecraft-proof-challenge.png' },
  { name: 'second-humidor-match', route: '/smokecraft/second-humidor-match',     file: 'smokecraft-proof-second-humidor-match.png' },
  { name: 'mini-tasting-round',   route: '/smokecraft/mini-tasting',            file: 'smokecraft-proof-mini-tasting-round.png' },
  // Batch 2 support
  { name: 'pairing',              route: '/smokecraft/pairing',                  file: 'smokecraft-proof-pairing.png' },
  { name: 'pairing-lab',          route: '/smokecraft/pairing-lab',              file: 'smokecraft-proof-pairing-lab.png' },
  { name: 'pairing-mastery',      route: '/smokecraft/pairing-mastery',          file: 'smokecraft-proof-pairing-mastery.png' },
  { name: 'terroir',              route: '/smokecraft/terroir',                  file: 'smokecraft-proof-terroir.png' },
  { name: 'vitola',               route: '/smokecraft/vitola',                   file: 'smokecraft-proof-vitola.png' },
  { name: 'leaderboard',          route: '/smokecraft/leaderboard',              file: 'smokecraft-proof-leaderboard.png' },
  { name: 'event-challenge',      route: '/smokecraft/event-challenge',          file: 'smokecraft-proof-event-challenge.png' },
  { name: 'golden-box-status',    route: '/smokecraft/golden-box-status',        file: 'smokecraft-proof-golden-box-status.png' },
]

const APPROVED_KEYWORD = '/assets/smokecraft-reference/approved/'

async function run() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })

  // Set demo mode + guest session before any page loads
  await context.addInitScript(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    sessionStorage.setItem('demoMode', 'true')
    sessionStorage.setItem('novee_booted', '1')
    // Seed a minimal valid session so context providers don't reset
    const session = {
      schemaVersion: 4,
      __version: 4,
      guestId: 'proof_guest_001',
      sessionId: 'proof_session_001',
      completedSteps: [],
      xp: 0,
      profile: { name: 'Proof Guest', email: 'proof@test.local' },
      smokeCraft: {},
    }
    localStorage.setItem('novee_guest_session', JSON.stringify(session))
  })

  const results = []

  for (const { name, route, file } of ROUTES) {
    const page = await context.newPage()
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(1200)

      const outPath = `${OUT_DIR}/${file}`
      await page.screenshot({ path: outPath, fullPage: false })

      const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase())
      const isLocked = bodyText.includes('locked') || bodyText.includes('unlock this visit') || bodyText.includes('visit not yet')

      const images = await page.evaluate((keyword) => {
        return Array.from(document.images)
          .filter(img => img.src.includes(keyword))
          .map(img => ({
            src: img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete,
            visible: !!(img.offsetWidth || img.offsetHeight || img.getClientRects().length),
          }))
      }, APPROVED_KEYWORD)

      results.push({
        name,
        route,
        file,
        locked: isLocked,
        approvedImages: images,
      })

      console.log(`✓ ${name} | locked=${isLocked} | approved_imgs=${images.length}${images.length > 0 ? ' | ' + images[0].naturalWidth + 'x' + images[0].naturalHeight : ''}`)
    } catch (e) {
      results.push({ name, route, file, locked: false, approvedImages: [], error: e.message })
      console.log(`✗ ${name} | ERROR: ${e.message}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()

  // Write JSON results for report generation
  fs.writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2))
  console.log(`\nDone. ${results.length} pages tested. Results: ${OUT_DIR}/results.json`)
}

run().catch(e => { console.error(e); process.exit(1) })
