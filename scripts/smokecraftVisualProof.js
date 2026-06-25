#!/usr/bin/env node
/**
 * SmokeCraft Visual Proof Harness.
 *
 * Generates a side-by-side contact sheet for each SmokeCraft screen:
 * LEFT = approved reference mockup image, RIGHT = actual rendered screenshot
 * of the live route, captured at a documented viewport.
 *
 * See docs/smokecraft-visual-qa-protocol.md for the rules this enforces.
 *
 * Usage:
 *   npm run visual:smokecraft
 *   node scripts/smokecraftVisualProof.js --route=/smokecraft/seed-soil
 *   node scripts/smokecraftVisualProof.js --base-url=http://localhost:4173
 */

import { existsSync, readdirSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { execSync, spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'docs', 'visual-proof')
const VIEWPORT = { width: 1440, height: 900 }

const SCREENS = [
  { name: 'smokecraft-home', route: '/smokecraft', reference: 'PROFILE DISCOVER 11.png' },
  { name: 'enroll', route: '/smokecraft/enroll', reference: 'smokecraft Intake.png' },
  { name: 'seed-soil', route: '/smokecraft/seed-soil', reference: 'SEED & PAIRING.11.png' },
  { name: 'format', route: '/smokecraft/format', reference: 'SHAPE SIZE BURN.11.png' },
  { name: 'golden-box', route: '/smokecraft/golden-box/status', reference: 'GOLDEN BOX JOURNEY11.png' },
  { name: 'leaderboard', route: '/smokecraft/leaderboard', reference: 'lounge demo ranking.11png.png' },
]

function getArg(name, fallback) {
  const prefix = `--${name}=`
  const found = process.argv.find(a => a.startsWith(prefix))
  return found ? found.slice(prefix.length) : fallback
}

function findChromiumExecutable() {
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'
  if (!existsSync(browsersPath)) return null
  const candidates = readdirSync(browsersPath).filter(d => d.startsWith('chromium-') || d === 'chromium')
  for (const dir of candidates) {
    const exe = path.join(browsersPath, dir, 'chrome-linux', 'chrome')
    if (existsSync(exe)) return exe
  }
  return null
}

function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim()
  } catch {
    return 'unknown'
  }
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return true
    } catch {
      // not up yet
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

async function main() {
  const onlyRoute = getArg('route', null)
  const explicitBaseUrl = getArg('base-url', null)

  let playwright
  try {
    playwright = await import('playwright')
  } catch {
    console.error('I cannot render visual proof in this sandbox. Do not trust visual completion until this script runs in GitHub Actions or another browser-enabled environment.')
    console.error('Reason: the "playwright" package is not installed. Run `npm install --save-dev playwright` first.')
    process.exit(1)
  }

  const executablePath = findChromiumExecutable()
  if (!executablePath) {
    console.error('I cannot render visual proof in this sandbox. Do not trust visual completion until this script runs in GitHub Actions or another browser-enabled environment.')
    console.error('Reason: no Chromium executable was found under PLAYWRIGHT_BROWSERS_PATH.')
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })

  let devServerProcess = null
  let baseUrl = explicitBaseUrl

  if (!baseUrl) {
    console.log('Building app...')
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' })

    console.log('Starting preview server...')
    devServerProcess = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
      cwd: ROOT,
      stdio: 'pipe',
    })
    baseUrl = 'http://localhost:4173'

    const up = await waitForServer(baseUrl)
    if (!up) {
      console.error('I cannot render visual proof in this sandbox. Do not trust visual completion until this script runs in GitHub Actions or another browser-enabled environment.')
      console.error('Reason: the preview server did not start in time.')
      devServerProcess.kill()
      process.exit(1)
    }
  }

  const commitHash = getCommitHash()
  const { chromium } = playwright
  const browser = await chromium.launch({ executablePath })
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()

  const screens = onlyRoute ? SCREENS.filter(s => s.route === onlyRoute) : SCREENS
  const results = []

  for (const screen of screens) {
    const url = `${baseUrl}${screen.route}`
    console.log(`Capturing ${screen.route} -> ${url}`)
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(800)
      const screenshotPath = path.join(OUT_DIR, `${screen.name}-rendered.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })

      const referencePath = path.join(ROOT, 'public', screen.reference)
      const referenceExists = existsSync(referencePath)

      const meta = {
        screen: screen.name,
        route: screen.route,
        referenceImage: screen.reference,
        referenceFound: referenceExists,
        viewport: VIEWPORT,
        timestamp: new Date().toISOString(),
        commitHash,
      }

      if (referenceExists) {
        await buildContactSheet({
          chromiumPage: page,
          referencePath,
          renderedPath: screenshotPath,
          outPath: path.join(OUT_DIR, `${screen.name}-proof.png`),
          meta,
        })
      } else {
        meta.note = `Reference image "${screen.reference}" not found in public/. Rendered screenshot saved alone.`
        console.warn(`  WARNING: ${meta.note}`)
      }

      writeFileSync(path.join(OUT_DIR, `${screen.name}-proof.json`), JSON.stringify(meta, null, 2))
      results.push(meta)
    } catch (err) {
      console.error(`  FAILED to capture ${screen.route}: ${err.message}`)
      results.push({ screen: screen.name, route: screen.route, error: err.message })
    }
  }

  await browser.close()
  if (devServerProcess) devServerProcess.kill()

  console.log('\nVisual proof artifacts written to docs/visual-proof/')
  for (const r of results) {
    console.log(`  - ${r.screen}: ${r.error ? 'FAILED — ' + r.error : 'ok'}`)
  }
}

async function buildContactSheet({ chromiumPage, referencePath, renderedPath, outPath, meta }) {
  // Build the side-by-side contact sheet using an isolated HTML page rendered by the same browser,
  // so we don't need an extra image-processing dependency.
  const refExt = path.extname(referencePath).slice(1) || 'png'
  const renderedExt = path.extname(renderedPath).slice(1) || 'png'
  const refUrl = `data:image/${refExt};base64,${readFileSync(referencePath).toString('base64')}`
  const renderedUrl = `data:image/${renderedExt};base64,${readFileSync(renderedPath).toString('base64')}`
  const html = `
    <html><head><style>
      body { margin: 0; background: #111; font-family: monospace; color: #eee; }
      .row { display: flex; }
      .col { flex: 1; padding: 12px; box-sizing: border-box; }
      .col img { width: 100%; display: block; border: 2px solid #444; }
      .label { font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; color: #e9c176; }
      .meta { padding: 10px 12px; font-size: 12px; color: #aaa; border-top: 1px solid #333; }
    </style></head>
    <body>
      <div class="row">
        <div class="col">
          <div class="label">APPROVED REFERENCE</div>
          <img src="${refUrl}" />
        </div>
        <div class="col">
          <div class="label">ACTUAL RENDERED PAGE</div>
          <img src="${renderedUrl}" />
        </div>
      </div>
      <div class="meta">
        route: ${meta.route} | viewport: ${meta.viewport.width}x${meta.viewport.height} |
        timestamp: ${meta.timestamp} | commit: ${meta.commitHash}
      </div>
    </body></html>
  `
  const sheetPage = await chromiumPage.context().newPage()
  await sheetPage.setContent(html, { waitUntil: 'load' })
  await sheetPage.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
    return imgs.length > 0 && imgs.every(img => img.complete && img.naturalWidth > 0)
  }, { timeout: 10000 })
  await sheetPage.waitForTimeout(200)
  await sheetPage.screenshot({ path: outPath, fullPage: true })
  await sheetPage.close()
}

main().catch(err => {
  console.error('I cannot render visual proof in this sandbox. Do not trust visual completion until this script runs in GitHub Actions or another browser-enabled environment.')
  console.error('Reason: unexpected error — ' + err.message)
  process.exit(1)
})
