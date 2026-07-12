/**
 * SmokeCraft Visual Regression Suite (R16)
 *
 * Captures screenshots of all 24 session screens in demo mode and
 * compares them against baseline snapshots. Reports pixel diff percentage.
 *
 * Usage:
 *   node e2e-smokecraft-visual-regression.mjs [--update-baseline] [--threshold 0.02]
 *
 * Options:
 *   --update-baseline   Write new baselines instead of comparing
 *   --threshold N       Pixel diff fraction to flag as regression (default 0.02 = 2%)
 *
 * Baselines stored in: ./visual-regression-baselines/
 * Screenshots stored in: ./visual-regression-current/
 *
 * Requires: npm i playwright  (or uses pre-installed at PLAYWRIGHT_BROWSERS_PATH)
 * Chromium path: /opt/pw-browsers/chromium
 */

import { chromium } from 'playwright'
import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const BASE_URL    = process.env.SMOKECRAFT_BASE_URL || 'http://localhost:5173'
const BASELINE_DIR = './visual-regression-baselines'
const CURRENT_DIR  = './visual-regression-current'
const UPDATE       = process.argv.includes('--update-baseline')
const THRESHOLD    = parseFloat(
  (process.argv.find(a => a.startsWith('--threshold=')) || '').replace('--threshold=', '') ||
  process.argv[process.argv.indexOf('--threshold') + 1] ||
  '0.02'
)

const ROUTES = [
  { id: 'smokecraft-home',          path: '/smokecraft',                label: 'SmokeCraft Home' },
  { id: 'smokecraft-enroll',        path: '/smokecraft/enroll',         label: 'Enroll' },
  { id: 'smokecraft-golden-box',    path: '/smokecraft/golden-box',     label: 'Golden Box' },
  { id: 'smokecraft-art',           path: '/smokecraft/art',            label: 'Art' },
  { id: 'smokecraft-mentor',        path: '/smokecraft/mentor',         label: 'Mentor' },
  { id: 'smokecraft-format',        path: '/smokecraft/format',         label: 'Format' },
  { id: 'smokecraft-origins',       path: '/smokecraft/origins',        label: 'Origins' },
  { id: 'smokecraft-curation',      path: '/smokecraft/curation',       label: 'Curation' },
  { id: 'smokecraft-leaves',        path: '/smokecraft/leaves',         label: 'Leaves' },
  { id: 'smokecraft-cultivation',   path: '/smokecraft/cultivation',    label: 'Cultivation' },
  { id: 'smokecraft-blend',         path: '/smokecraft/blend',          label: 'Blend' },
  { id: 'smokecraft-flavor-dna',    path: '/smokecraft/flavor-dna',     label: 'Flavor DNA' },
  { id: 'smokecraft-pairing',       path: '/smokecraft/pairing',        label: 'Pairing' },
  { id: 'smokecraft-available',     path: '/smokecraft/available',      label: 'Available' },
  { id: 'smokecraft-assistant',     path: '/smokecraft/assistant',      label: 'Assistant' },
  { id: 'smokecraft-terroir',       path: '/smokecraft/terroir',        label: 'Terroir' },
  { id: 'smokecraft-pairing-mastery', path: '/smokecraft/pairing-mastery', label: 'Pairing Mastery' },
  { id: 'smokecraft-vitola',        path: '/smokecraft/vitola',         label: 'Vitola' },
  { id: 'smokecraft-identity',      path: '/smokecraft/identity',       label: 'Identity' },
  { id: 'smokecraft-seed-soil',     path: '/smokecraft/seed-soil',      label: 'Seed & Soil' },
  { id: 'smokecraft-humidor-match', path: '/smokecraft/humidor-match',  label: 'Humidor Match' },
  { id: 'smokecraft-cut-toast',     path: '/smokecraft/cut-toast-light',label: 'Cut Toast Light' },
  { id: 'smokecraft-first-third',   path: '/smokecraft/first-third',    label: 'First Third' },
  { id: 'smokecraft-second-third',  path: '/smokecraft/second-third',   label: 'Second Third' },
  { id: 'smokecraft-final-third',   path: '/smokecraft/final-third',    label: 'Final Third' },
  { id: 'smokecraft-scorecard',     path: '/smokecraft/scorecard',      label: 'Scorecard' },
  { id: 'smokecraft-leaderboard',   path: '/smokecraft/leaderboard',    label: 'Leaderboard' },
  { id: 'smokecraft-passport-stamp',path: '/smokecraft/passport-stamp', label: 'Passport Stamp' },
  { id: 'smokecraft-session-complete', path: '/smokecraft/session-complete', label: 'Session Complete' },
]

const PASS = '\x1b[32m✓\x1b[0m'
const FAIL = '\x1b[31m✗\x1b[0m'
const SKIP = '\x1b[33m~\x1b[0m'

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function md5(buf) {
  return createHash('md5').update(buf).digest('hex')
}

/**
 * Simple pixel diff: compares two PNG buffers by byte content.
 * Returns a fraction 0–1 of bytes that differ in the raw data.
 * Full pixel-level diffing requires an image library; this is a
 * conservative byte-level check sufficient for detecting major visual regressions.
 */
function byteDiff(a, b) {
  if (a.length !== b.length) return 1.0
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++
  }
  return diff / a.length
}

async function run() {
  ensureDir(BASELINE_DIR)
  ensureDir(CURRENT_DIR)

  console.log(`\n${'='.repeat(60)}`)
  console.log(`SmokeCraft Visual Regression Suite (R16)`)
  console.log(`Mode: ${UPDATE ? 'UPDATE BASELINE' : 'COMPARE'}`)
  console.log(`Threshold: ${(THRESHOLD * 100).toFixed(1)}%`)
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`${'='.repeat(60)}\n`)

  const BATCH_SIZE = 5

  async function launchFreshContext() {
    const browser = await chromium.launch({
      executablePath: '/opt/pw-browsers/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--memory-pressure-off'],
    })
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },  // iPhone 14 Pro
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()
    // Set demo mode cookie/storage so session-locked screens render
    await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {})
    await page.evaluate(() => {
      sessionStorage.setItem('novee_demo_mode', '1')
      localStorage.setItem('novee_demo_session_active', '1')
      localStorage.setItem('novee_guest_session', JSON.stringify({
        sessionId: 'visual-regression-demo',
        completedSteps: Array.from({ length: 24 }, (_, i) => `session-${i + 1}-complete`),
        smokeCraft: { xp: { total: 2400 }, currentSession: 24 },
        passport: { passportId: null, earnedStamps: [] },
      }))
    })
    return { browser, page }
  }

  const results = []
  let passed = 0, failed = 0, skipped = 0
  let browser = null
  let page = null

  for (let i = 0; i < ROUTES.length; i++) {
    const route = ROUTES[i]
    // Restart browser context every BATCH_SIZE routes to avoid resource exhaustion
    if (i % BATCH_SIZE === 0) {
      if (browser) await browser.close().catch(() => {})
      const fresh = await launchFreshContext()
      browser = fresh.browser
      page = fresh.page
    }
    const baselinePath = join(BASELINE_DIR, `${route.id}.png`)
    const currentPath  = join(CURRENT_DIR,  `${route.id}.png`)

    try {
      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: 'load',
        timeout: 20000,
      })
      // Wait for main content to render
      await page.waitForTimeout(800)

      const screenshot = await page.screenshot({ fullPage: false })
      writeFileSync(currentPath, screenshot)

      if (UPDATE) {
        writeFileSync(baselinePath, screenshot)
        results.push({ id: route.id, label: route.label, status: 'baseline_written' })
        console.log(`${SKIP} [BASELINE] ${route.label}`)
        skipped++
        continue
      }

      if (!existsSync(baselinePath)) {
        results.push({ id: route.id, label: route.label, status: 'no_baseline', diff: null })
        console.log(`${SKIP} [NO BASELINE] ${route.label} — run with --update-baseline first`)
        skipped++
        continue
      }

      const baseline = readFileSync(baselinePath)
      const diffFraction = byteDiff(baseline, screenshot)
      const diffPercent  = (diffFraction * 100).toFixed(2)
      const regression   = diffFraction > THRESHOLD

      if (regression) {
        results.push({ id: route.id, label: route.label, status: 'regression', diff: diffPercent })
        console.log(`${FAIL} [REGRESSION ${diffPercent}%] ${route.label}`)
        failed++
      } else {
        results.push({ id: route.id, label: route.label, status: 'pass', diff: diffPercent })
        console.log(`${PASS} [PASS ${diffPercent}%] ${route.label}`)
        passed++
      }
    } catch (err) {
      results.push({ id: route.id, label: route.label, status: 'error', error: err.message })
      console.log(`${FAIL} [ERROR] ${route.label} — ${err.message}`)
      failed++
    }
  }

  if (browser) await browser.close().catch(() => {})

  // Write JSON report
  const report = {
    runAt:      new Date().toISOString(),
    mode:       UPDATE ? 'update_baseline' : 'compare',
    threshold:  THRESHOLD,
    baseUrl:    BASE_URL,
    summary:    { total: ROUTES.length, passed, failed, skipped },
    results,
  }
  const reportPath = './visual-regression-report.json'
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log(`\n${'='.repeat(60)}`)
  if (UPDATE) {
    console.log(`Baselines written: ${skipped}/${ROUTES.length}`)
  } else {
    console.log(`Results: ${passed} pass / ${failed} fail / ${skipped} skip`)
  }
  console.log(`Report: ${reportPath}`)
  console.log(`${'='.repeat(60)}\n`)

  if (failed > 0) process.exit(1)
}

run().catch(err => {
  console.error('Visual regression suite failed:', err)
  process.exit(1)
})
