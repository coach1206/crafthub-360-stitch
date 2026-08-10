#!/usr/bin/env node
/**
 * SmokeCraft Two-Generation Migration — Owner Visual Proof
 *
 * Captures every converted migration screen in a real Chromium browser and
 * writes one master owner-review contact sheet plus individual screenshots.
 *
 * Output:
 *   docs/visual-proof/migration/*.png
 *   docs/visual-proof/migration/SMOKECRAFT_ONE_SYSTEM_FINAL_INDEX.png
 *   docs/visual-proof/migration/SMOKECRAFT_ONE_SYSTEM_FINAL_REPORT.json
 *
 * Usage:
 *   node scripts/smokecraftMigrationVisualProof.js
 *   node scripts/smokecraftMigrationVisualProof.js --base-url=http://localhost:4173
 */

import { existsSync, readdirSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { execSync, spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'docs', 'visual-proof', 'migration')
const VIEWPORT = { width: 1440, height: 900 }

const SCREENS = [
  { n: 1,  name: 'identity', route: '/smokecraft/identity' },
  { n: 2,  name: 'seed-soil', route: '/smokecraft/seed-soil' },
  { n: 3,  name: 'format', route: '/smokecraft/format' },
  { n: 4,  name: 'cut-toast-light', route: '/smokecraft/cut-toast-light' },
  { n: 5,  name: 'first-third', route: '/smokecraft/first-third' },
  { n: 6,  name: 'second-third', route: '/smokecraft/second-third' },
  { n: 7,  name: 'final-third', route: '/smokecraft/final-third' },
  { n: 8,  name: 'scorecard', route: '/smokecraft/scorecard' },
  { n: 9,  name: 'request-purchase', route: '/smokecraft/request-purchase' },
  { n: 10, name: 'pairing-recommendations', route: '/smokecraft/pairing-recommendations' },
  { n: 11, name: 'passport-stamp', route: '/smokecraft/passport-stamp' },
  { n: 12, name: 'connections', route: '/smokecraft/connections' },
  { n: 13, name: 'rewards', route: '/smokecraft/rewards' },
  { n: 14, name: 'second-humidor-match', route: '/smokecraft/second-humidor-match' },
]

function getArg(name, fallback = null) {
  const prefix = `--${name}=`
  const found = process.argv.find(a => a.startsWith(prefix))
  return found ? found.slice(prefix.length) : fallback
}

function getCommitHash() {
  try { return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() }
  catch { return 'unknown' }
}

function findChromiumExecutable() {
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'
  if (!existsSync(browsersPath)) return null
  const candidates = readdirSync(browsersPath).filter(d => d.startsWith('chromium-') || d === 'chromium')
  for (const dir of candidates) {
    for (const rel of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
      const exe = path.join(browsersPath, dir, rel)
      if (existsSync(exe)) return exe
    }
  }
  return null
}

async function waitForServer(url, timeoutMs = 60000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const r = await fetch(url)
      if (r.ok || r.status === 404) return true
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

async function buildMasterIndex(browserContext, results, commitHash) {
  const tiles = results.filter(r => r.ok && r.screenshotPath).map(r => {
    const data = readFileSync(r.screenshotPath).toString('base64')
    return `
      <article class="tile">
        <div class="head"><span>${String(r.n).padStart(2, '0')}</span><strong>${r.name}</strong></div>
        <img src="data:image/png;base64,${data}" />
        <div class="meta">${r.route}<br>actual: ${r.actualUrl}</div>
      </article>`
  }).join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#080b10;color:#e5e2e1;font-family:Arial,sans-serif;padding:24px}
    h1{margin:0 0 6px;color:#e9c176;font-size:28px}.sub{color:#9ca3af;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    .tile{background:#0d1420;border:1px solid rgba(233,193,118,.32);border-radius:12px;overflow:hidden}
    .head{display:flex;gap:10px;align-items:center;padding:10px 12px;color:#e9c176;text-transform:uppercase;letter-spacing:.06em;font-size:12px}
    .head span{border:1px solid rgba(233,193,118,.4);border-radius:999px;padding:2px 7px}.tile img{display:block;width:100%;height:auto;background:#050505}
    .meta{padding:8px 12px 12px;color:#9ca3af;font:11px/1.4 monospace;word-break:break-all}
    .footer{margin-top:18px;color:#9ca3af;font:12px monospace}
  </style></head><body>
    <h1>SmokeCraft 360 — Two-Generation Migration Visual Proof</h1>
    <div class="sub">14 converted screens · real Chromium render · owner inspection sheet</div>
    <div class="grid">${tiles}</div>
    <div class="footer">commit ${commitHash} · viewport ${VIEWPORT.width}×${VIEWPORT.height} · generated ${new Date().toISOString()}</div>
  </body></html>`

  const p = await browserContext.newPage()
  await p.setViewportSize({ width: 1800, height: 1000 })
  await p.setContent(html, { waitUntil: 'load' })
  await p.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0), { timeout: 20000 })
  const out = path.join(OUT_DIR, 'SMOKECRAFT_ONE_SYSTEM_FINAL_INDEX.png')
  await p.screenshot({ path: out, fullPage: true })
  await p.close()
  return out
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const explicitBaseUrl = getArg('base-url')
  let devServer = null
  let baseUrl = explicitBaseUrl

  let playwright
  try { playwright = await import('playwright') }
  catch (e) {
    console.error('VISUAL PROOF BLOCKED: Playwright is unavailable. Do not mark owner acceptance ready.')
    process.exit(1)
  }

  const executablePath = findChromiumExecutable()
  if (!executablePath) {
    console.error('VISUAL PROOF BLOCKED: Chromium not found under PLAYWRIGHT_BROWSERS_PATH. Do not mark owner acceptance ready.')
    process.exit(1)
  }

  if (!baseUrl) {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' })
    devServer = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { cwd: ROOT, stdio: 'pipe' })
    baseUrl = 'http://localhost:4173'
    if (!await waitForServer(baseUrl)) {
      console.error('VISUAL PROOF BLOCKED: preview server did not start.')
      devServer?.kill()
      process.exit(1)
    }
  }

  const commitHash = getCommitHash()
  const { chromium } = playwright
  const browser = await chromium.launch({ executablePath })
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()
  const results = []

  for (const screen of SCREENS) {
    const expectedUrl = `${baseUrl}${screen.route}`
    const screenshotPath = path.join(OUT_DIR, `${String(screen.n).padStart(2, '0')}-${screen.name}.png`)
    try {
      await page.goto(expectedUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(900)
      const actualUrl = page.url()
      await page.screenshot({ path: screenshotPath, fullPage: true })
      const routeStayed = new URL(actualUrl).pathname === screen.route
      results.push({ ...screen, ok: true, routeStayed, actualUrl, screenshotPath })
      console.log(`${routeStayed ? 'PASS' : 'REDIRECT'} ${screen.route} -> ${actualUrl}`)
    } catch (e) {
      results.push({ ...screen, ok: false, error: e.message, actualUrl: page.url() })
      console.error(`FAIL ${screen.route}: ${e.message}`)
    }
  }

  const indexPath = await buildMasterIndex(context, results, commitHash)
  await browser.close()
  devServer?.kill()

  const report = {
    generatedAt: new Date().toISOString(),
    commitHash,
    viewport: VIEWPORT,
    total: SCREENS.length,
    captured: results.filter(r => r.ok).length,
    stayedOnExpectedRoute: results.filter(r => r.ok && r.routeStayed).length,
    redirected: results.filter(r => r.ok && !r.routeStayed).length,
    failed: results.filter(r => !r.ok).length,
    ownerAcceptanceReady: results.every(r => r.ok && r.routeStayed),
    indexPath: path.relative(ROOT, indexPath),
    results: results.map(r => ({ ...r, screenshotPath: r.screenshotPath ? path.relative(ROOT, r.screenshotPath) : null })),
  }
  writeFileSync(path.join(OUT_DIR, 'SMOKECRAFT_ONE_SYSTEM_FINAL_REPORT.json'), JSON.stringify(report, null, 2))

  console.log(`\nOwner visual index: ${path.relative(ROOT, indexPath)}`)
  console.log(`Captured ${report.captured}/${report.total}; expected-route ${report.stayedOnExpectedRoute}/${report.total}; redirected ${report.redirected}; failed ${report.failed}`)
  if (!report.ownerAcceptanceReady) process.exitCode = 2
}

main().catch(err => {
  console.error(`VISUAL PROOF FAILED: ${err.message}`)
  process.exit(1)
})
