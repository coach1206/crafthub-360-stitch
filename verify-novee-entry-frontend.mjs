/**
 * NOVEE OS — Entry Frontend Integration Tests
 * Tests the Boot.jsx lounge interface with backend wiring.
 * Run with: node verify-novee-entry-frontend.mjs
 * Requires: dev server on port 5000
 */

import { chromium } from 'playwright'
import fs from 'fs'

const BASE  = 'http://localhost:5000'
const API   = 'http://localhost:3001'
let passed  = 0
let failed  = 0
const failures = []

function check(label, ok, detail = '') {
  if (ok) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
    failed++
    failures.push(label)
  }
}

function section(title) {
  console.log(`\n── ${title} ──────────────────────────────────────────────`)
}

async function freshPage(browser) {
  const page = await browser.newPage()
  // Stub only API calls that would need real backend (not our new novee endpoints)
  await page.route(/^http:\/\/localhost:5000\/api\/(?!novee)/, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  )
  return page
}

async function run() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

  try {
    // ── Backend API tests (via HTTP) ─────────────────────────────
    section('Backend API: GET /api/novee/entry/status')
    {
      const r = await fetch(`${API}/api/novee/entry/status`, { credentials: 'include' })
      check('Status 200', r.status === 200, `got ${r.status}`)
      const d = await r.json()
      check('Returns authenticated field',      'authenticated' in d)
      check('Returns modules.novee',            !!d.modules?.novee)
      check('Returns modules.crafthub',         !!d.modules?.crafthub)
      check('Returns modules.smokecraft',       !!d.modules?.smokecraft)
      check('Returns demoMode field',           !!d.demoMode)
      check('Unauthenticated → user is null',   d.user === null || d.user === undefined)
      check('Guest cannot access novee',        d.modules?.novee?.authorized === false)
      check('Guest can access crafthub',        d.modules?.crafthub?.authorized === true)
      check('Guest can access smokecraft',      d.modules?.smokecraft?.authorized === true)
    }

    section('Backend API: POST /api/novee/entry/open — valid module')
    {
      const r = await fetch(`${API}/api/novee/entry/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'smokecraft' }),
      })
      check('Status 200 for guest+smokecraft', r.status === 200, `got ${r.status}`)
      const d = await r.json()
      check('Returns success:true',   d.success === true)
      check('Returns route /smokecraft', d.route === '/smokecraft')
    }

    section('Backend API: POST /api/novee/entry/open — unauthorized module')
    {
      const r = await fetch(`${API}/api/novee/entry/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'novee' }),
      })
      check('Status 403 for guest+novee', r.status === 403, `got ${r.status}`)
      const d = await r.json()
      check('Returns success:false', d.success === false)
      check('Returns UNAUTHORIZED code', d.code === 'UNAUTHORIZED')
    }

    section('Backend API: POST /api/novee/entry/open — invalid module')
    {
      const r = await fetch(`${API}/api/novee/entry/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'admin_panel_hack' }),
      })
      check('400 for invalid module', r.status === 400, `got ${r.status}`)
      const d = await r.json()
      check('Returns INVALID_MODULE code', d.code === 'INVALID_MODULE')
    }

    section('Backend API: Demo Mode start/status/end')
    let demoSessionId = null
    {
      const startR = await fetch(`${API}/api/novee/demo/start`, { method: 'POST' })
      check('POST demo/start → 200', startR.status === 200, `got ${startR.status}`)
      const startD = await startR.json()
      check('Returns success:true',       startD.success === true)
      check('Returns demoSessionId',      typeof startD.demoSessionId === 'string')
      check('Returns expiresAt',          typeof startD.expiresAt === 'string')
      check('Mode is demo',               startD.mode === 'demo')
      demoSessionId = startD.demoSessionId

      // Check status with session header
      const statusR = await fetch(`${API}/api/novee/demo/status`, {
        headers: { 'x-novee-demo-session': demoSessionId },
      })
      check('GET demo/status → 200', statusR.status === 200, `got ${statusR.status}`)
      const statusD = await statusR.json()
      check('Demo is active', statusD.active === true)

      // End
      const endR = await fetch(`${API}/api/novee/demo/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-novee-demo-session': demoSessionId },
      })
      check('POST demo/end → 200', endR.status === 200, `got ${endR.status}`)

      // Status after end
      const statusAfterR = await fetch(`${API}/api/novee/demo/status`, {
        headers: { 'x-novee-demo-session': demoSessionId },
      })
      const statusAfterD = await statusAfterR.json()
      check('Demo inactive after end', statusAfterD.active === false)
    }

    section('Backend API: Demo mode allows guest to open novee')
    {
      // Start a demo session
      const startR = await fetch(`${API}/api/novee/demo/start`, { method: 'POST' })
      const startD = await startR.json()
      const sid = startD.demoSessionId

      // Try to open novee with demo session header
      const openR = await fetch(`${API}/api/novee/entry/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-novee-demo-session': sid },
        body: JSON.stringify({ module: 'novee' }),
      })
      check('Demo guest can open novee (200)', openR.status === 200, `got ${openR.status}`)
      const openD = await openR.json()
      check('Returns success:true in demo mode', openD.success === true)
      check('Returns /home route',              openD.route === '/home')

      // Cleanup
      await fetch(`${API}/api/novee/demo/end`, {
        method: 'POST',
        headers: { 'x-novee-demo-session': sid },
      })
    }

    section('Backend API: No secret exposure in status response')
    {
      const r = await fetch(`${API}/api/novee/entry/status`)
      const d = await r.json()
      const raw = JSON.stringify(d)
      check('No JWT token in response',   !raw.includes('eyJ'))
      check('No secret in response',      !raw.includes('JWT_SECRET') && !raw.includes('password'))
      check('No stack trace in response', !raw.includes('at Object') && !raw.includes('at process'))
    }

    // ── Frontend Playwright tests ─────────────────────────────────
    section('Frontend: Root page loads approved image')
    {
      const page = await browser.newPage()
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
      const imgSrc = await page.$eval(
        'img[alt="NOVEE OS — Private Experience Layer"]', el => el.src
      ).catch(() => null)
      check('Approved image in DOM', !!imgSrc && imgSrc.includes('NOVEE-OS-LOUNGE-INTERFACE'))
      const w = await page.evaluate(() => document.body.scrollWidth)
      check('No horizontal overflow', w <= 1440, `scrollWidth=${w}`)
      await page.close()
    }

    section('Frontend: All hotspots present')
    {
      const page = await browser.newPage()
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(800)
      check('Enter NOVEE OS hotspot',       await page.getByRole('button', { name: /Enter NOVEE OS/i }).count() > 0)
      check('Enter CraftHub 360 hotspot',   await page.getByRole('button', { name: /Enter CraftHub 360/i }).count() > 0)
      check('Enter SmokeCraft 360 hotspot', await page.getByRole('button', { name: /Enter SmokeCraft 360/i }).count() > 0)
      check('Demo Mode hotspot',            await page.getByRole('button', { name: /Demo Mode/i }).count() > 0)
      const h1 = await page.$('h1').catch(() => null)
      check('No duplicate React card interface', !h1)
      await page.close()
    }

    section('Frontend: SmokeCraft navigation (guest-accessible)')
    {
      const page = await browser.newPage()
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.route(/^http:\/\/localhost:5000\/api\/(?!novee)/, route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      )
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(800)
      await page.click('[aria-label="Enter SmokeCraft 360"]')
      await page.waitForTimeout(1200)
      check('SmokeCraft → /smokecraft', page.url().includes('/smokecraft'), page.url())
      await page.close()
    }

    section('Frontend: CraftHub navigation (guest-accessible)')
    {
      const page = await browser.newPage()
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.route(/^http:\/\/localhost:5000\/api\/(?!novee)/, route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      )
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(800)
      await page.click('[aria-label="Enter CraftHub 360"]')
      await page.waitForTimeout(1200)
      check('CraftHub → /crafthub', page.url().includes('/crafthub'), page.url())
      await page.close()
    }

    section('Frontend: NOVEE OS card disabled for unauthenticated guest')
    {
      const page = await browser.newPage()
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(1200)
      // Button should exist but be aria-disabled or show no navigation
      const btn = page.getByRole('button', { name: /Enter NOVEE OS/i })
      const ariaDisabled = await btn.getAttribute('aria-disabled').catch(() => null)
      const opacity = await btn.evaluate(el => window.getComputedStyle(el).opacity).catch(() => '1')
      check('NOVEE OS button exists', await btn.count() > 0)
      // Either aria-disabled=true OR opacity < 1 (visual disabled state)
      check('NOVEE OS visually restricted (disabled or dimmed)',
        ariaDisabled === 'true' || parseFloat(opacity) < 1
      )
      await page.close()
    }

    section('Frontend: No SmokeCraft source file regression')
    {
      const scFiles = [
        'src/pages/SmokeCraft.jsx',
        'src/components/smokecraft/SmokeCraftImageBoundsOverlay.jsx',
      ]
      for (const f of scFiles) {
        const content = fs.readFileSync(f, 'utf8')
        // SmokeCraft.jsx must still have getResumeRoute
        if (f.includes('SmokeCraft.jsx')) {
          check('SmokeCraft.jsx has getResumeRoute', content.includes('getResumeRoute'))
          check('SmokeCraft.jsx uses SC_ASSETS.landing', content.includes('SC_ASSETS.landing'))
        }
        if (f.includes('SmokeCraftImageBoundsOverlay')) {
          check('SmokeCraftImageBoundsOverlay unchanged', content.includes('NAV_BAR_HEIGHT'))
        }
      }
    }

  } finally {
    await browser.close()
  }

  console.log('\n=======================================================')
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (failures.length) {
    console.log('Failures:', failures)
    process.exit(1)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
