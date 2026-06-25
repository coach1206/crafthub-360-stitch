#!/usr/bin/env node
/**
 * MVP2 Global Visual Proof Harness.
 *
 * Generates a side-by-side contact sheet for any registered screen:
 * LEFT = approved reference mockup image, RIGHT = actual rendered screenshot
 * of the live route, captured at a documented viewport.
 *
 * This is the family-generic successor to the SmokeCraft-only
 * scripts/smokecraftVisualProof.js. It covers every reference-image family
 * tracked in docs/mvp2-visual-image-registry.md: SmokeCraft, POS3, E.A.T.,
 * Passport, DayOne360, CraftHub.
 *
 * A screen with referenceImage: null has no approved binary reference in
 * the repo yet (see the registry for why). For those screens this script
 * captures the rendered screenshot alone and explicitly reports that no
 * visual comparison is possible — it does NOT fabricate a proof.
 *
 * Usage:
 *   npm run visual:all
 *   npm run visual:smokecraft
 *   npm run visual:passport
 *   npm run visual:pos3
 *   npm run visual:eat
 *   node scripts/visualProof.js --family=passport
 *   node scripts/visualProof.js --route=/smokecraft/seed-soil
 *   node scripts/visualProof.js --base-url=http://localhost:4173
 */

import { existsSync, readdirSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { execSync, spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'docs', 'visual-proof')
const VIEWPORT = { width: 1440, height: 900 }
const HANDHELD_VIEWPORT = { width: 414, height: 896 }

// Each screen: family, name, route, reference (filename in public/, or null
// if no binary reference has been uploaded to the repo yet), viewport
// override (for handheld POS3 screens).
const SCREENS = [
  // --- SmokeCraft ---
  { family: 'smokecraft', name: 'smokecraft-home', route: '/smokecraft', reference: 'PROFILE DISCOVER 11.png' },
  { family: 'smokecraft', name: 'enroll', route: '/smokecraft/enroll', reference: 'smokecraft Intake.png' },
  { family: 'smokecraft', name: 'seed-soil', route: '/smokecraft/seed-soil', reference: 'SEED & PAIRING.11.png' },
  { family: 'smokecraft', name: 'format', route: '/smokecraft/format', reference: 'SHAPE SIZE BURN.11.png' },
  { family: 'smokecraft', name: 'golden-box', route: '/smokecraft/golden-box/status', reference: 'GOLDEN BOX JOURNEY11.png' },
  { family: 'smokecraft', name: 'leaderboard', route: '/smokecraft/leaderboard', reference: 'lounge demo ranking.11png.png' },

  // --- Passport ---
  // Reference images exist in public/ but route mapping is NOT confirmed —
  // multiple similarly-named passport mockups exist (360 Passport 1.png,
  // 360 passport  connections 11.png, 360  passport connect  CONECTIONS.png,
  // 360 PASSPORT NETWORK INTERFACE 2.png, 360 PASSPORT CONNECTION 2.png,
  // 360 LUXARY STAMP COLLECT 2.png) and none are wired into src/ yet. Do not
  // guess the mapping (see the golden-box route mistake this protocol
  // exists to prevent) — left as referenceImage: null with a TODO until a
  // human confirms which file maps to which Passport route.
  { family: 'passport', name: 'passport-connections', route: '/passport/connections', reference: null, note: 'Candidate references exist (360 PASSPORT NETWORK INTERFACE 2.png, 360 PASSPORT CONNECTION 2.png, etc.) but mapping is unconfirmed. See registry.' },
  { family: 'passport', name: 'passport-stamps', route: '/passport/stamps', reference: null, note: 'Candidate references exist (DIGETAL STAMP COLLECTION 1.png, 360 LUXARY STAMP COLLECT 2.png) but mapping is unconfirmed. See registry.' },
  { family: 'passport', name: 'passport-profile', route: '/passport/profile', reference: null, note: 'No confirmed reference image.' },
  { family: 'passport', name: 'passport-directory', route: '/passport/directory', reference: null, note: 'No confirmed reference image.' },

  // --- DayOne360 ---
  { family: 'dayone360', name: 'dayone360-concierge', route: '/dayone360', reference: null, note: 'Reference "DAYONE360 CONICERGE 1.png" exists in public/ but is not yet confirmed against this route.' },

  // --- CraftHub ---
  { family: 'crafthub', name: 'crafthub-landing', route: '/crafthub', reference: null, note: 'Reference "CRAFT HUB EXPLAIND.png" exists in public/ but is not yet confirmed against this route.' },

  // --- POS3 (handheld) ---
  // Reference image uploaded 2026-06-25 ("POS 3.11.png"). Route mapping
  // confirmed via src/App.jsx: /pos3/handheld -> POS3Handheld.jsx. Mapping
  // only — no UI fix has been made against this reference yet, so this is
  // NOT visually approved until a proof image is generated and inspected.
  { family: 'pos3', name: 'pos3-handheld', route: '/pos3/handheld', reference: 'POS 3.11.png', referenceDir: 'design-references/mvp2/pos3', viewport: HANDHELD_VIEWPORT },
  { family: 'pos3', name: 'pos3-tables', route: '/pos3/tables', reference: null, note: 'No binary reference image in repo.' },
  { family: 'pos3', name: 'pos3-orders', route: '/pos3/orders', reference: null, note: 'No binary reference image in repo.' },
  { family: 'pos3', name: 'pos3-checkout', route: '/pos3/checkout', reference: null, note: 'No binary reference image in repo.' },

  // --- E.A.T. System ---
  // Reference image uploaded 2026-06-25 ("EAT SYSTEM UPDATE 11.png"), the
  // desktop management command center. Route mapping confirmed via
  // src/App.jsx: /eat/command-hub -> EATCommandHub.jsx. Mapping only — no
  // UI fix has been made against this reference yet.
  { family: 'eat', name: 'eat-command-center', route: '/eat/command-hub', reference: 'EAT SYSTEM UPDATE 11.png', referenceDir: 'design-references/mvp2/eat-system' },
  { family: 'eat', name: 'eat-sections', route: '/eat/sections', reference: null, note: 'No binary reference image in repo.' },
  { family: 'eat', name: 'eat-operations', route: '/eat/operations', reference: null, note: 'No binary reference image in repo.' },
]

function getArg(name, fallback) {
  const prefix = `--${name}=`
  const found = process.argv.find(a => a.startsWith(prefix))
  return found ? found.slice(prefix.length) : fallback
}

function findChromiumExecutable() {
  // Sandboxed dev environments pre-install Chromium under a fixed path
  // (PLAYWRIGHT_BROWSERS_PATH, defaulting to /opt/pw-browsers) and skip the
  // npm postinstall download. CI (GitHub Actions) has no such path — it runs
  // `npx playwright install --with-deps chromium`, which installs into
  // Playwright's own default cache (~/.cache/ms-playwright) under whatever
  // directory/executable layout that Playwright version uses. Only look for
  // the sandbox override; if it's not there, return null so the caller lets
  // Playwright resolve its own installed browser instead of treating "I
  // didn't find this one specific path" as "Chromium isn't installed."
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (!browsersPath || !existsSync(browsersPath)) return null
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
  const onlyFamily = getArg('family', null)
  const explicitBaseUrl = getArg('base-url', null)

  let playwright
  try {
    playwright = await import('playwright')
  } catch {
    console.error('I cannot render visual proof in this sandbox. Do not trust visual completion until this script runs in GitHub Actions or another browser-enabled environment.')
    console.error('Reason: the "playwright" package is not installed. Run `npm install --save-dev playwright` first.')
    process.exit(1)
  }

  // executablePath is only set when a sandbox-specific Chromium override is
  // found. Otherwise leave it undefined so chromium.launch() resolves
  // Playwright's own installed browser (e.g. the one `playwright install`
  // just downloaded in CI).
  const executablePath = findChromiumExecutable() || undefined

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

  let screens = SCREENS
  if (onlyRoute) screens = screens.filter(s => s.route === onlyRoute)
  if (onlyFamily) screens = screens.filter(s => s.family === onlyFamily)

  const results = []

  for (const screen of screens) {
    const viewport = screen.viewport || VIEWPORT
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    const url = `${baseUrl}${screen.route}`
    console.log(`Capturing [${screen.family}] ${screen.route} -> ${url}`)
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(800)
      const screenshotPath = path.join(OUT_DIR, `${screen.name}-rendered.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })

      const bodyText = await page.evaluate(() => document.body.innerText)
      const accessGated = /ACCESS RESTRICTED/i.test(bodyText)

      const referencePath = screen.reference ? path.join(ROOT, 'public', screen.referenceDir || '', screen.reference) : null
      const referenceExists = Boolean(referencePath && existsSync(referencePath))

      const meta = {
        family: screen.family,
        screen: screen.name,
        route: screen.route,
        referenceImage: screen.reference,
        referenceFound: referenceExists,
        viewport,
        timestamp: new Date().toISOString(),
        commitHash,
      }

      if (accessGated) {
        meta.accessGated = true
        meta.warning = `The rendered capture shows an "ACCESS RESTRICTED" auth gate (this route requires staff/manager login), not the actual screen. This proof image does NOT show a real visual comparison against the reference — it only proves the route resolves and is access-controlled. Do not treat this as visual approval or visual failure of the actual screen.`
        console.warn(`  WARNING: ${meta.warning}`)
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
        meta.note = screen.note || (screen.reference
          ? `Reference image "${screen.reference}" not found in public/. Rendered screenshot saved alone.`
          : 'No reference image registered for this screen — cannot generate a side-by-side proof. This is NOT visual approval.')
        console.warn(`  NO PROOF POSSIBLE — ${meta.note}`)
      }

      writeFileSync(path.join(OUT_DIR, `${screen.name}-proof.json`), JSON.stringify(meta, null, 2))
      results.push(meta)
    } catch (err) {
      console.error(`  FAILED to capture ${screen.route}: ${err.message}`)
      results.push({ family: screen.family, screen: screen.name, route: screen.route, error: err.message })
    } finally {
      await context.close()
    }
  }

  await browser.close()
  if (devServerProcess) devServerProcess.kill()

  console.log('\nVisual proof artifacts written to docs/visual-proof/')
  for (const r of results) {
    const status = r.error
      ? `FAILED — ${r.error}`
      : r.accessGated
        ? 'proof generated, but BEHIND AUTH GATE — not a real screen comparison'
        : (r.referenceFound ? 'proof generated' : 'NO PROOF — ' + (r.note || 'no reference image'))
    console.log(`  - [${r.family}] ${r.screen}: ${status}`)
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
      .warning { padding: 10px 12px; font-size: 12px; color: #ff6b6b; border-top: 1px solid #333; font-weight: bold; }
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
        family: ${meta.family} | route: ${meta.route} | viewport: ${meta.viewport.width}x${meta.viewport.height} |
        timestamp: ${meta.timestamp} | commit: ${meta.commitHash}
      </div>
      ${meta.warning ? `<div class="warning">WARNING: ${meta.warning}</div>` : ''}
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
