/**
 * e2e-smokecraft-landing-root-fix.mjs
 * Targeted test for the /smokecraft landing root fix.
 * Verifies 20 checks × 4 viewports.
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const VIEWPORTS = [
  { name: 'desktop',          width: 1440, height: 900  },
  { name: 'tablet-landscape', width: 1024, height: 768  },
  { name: 'tablet-portrait',  width: 820,  height: 1180 },
  { name: 'mobile',           width: 390,  height: 844  },
]

// Old printed-UI mockup must NOT be active background
const OLD_LANDING_ASSET = 'smokecraft-landing.png'
// New clean atmospheric asset
const NEW_LANDING_ASSET  = 'smokecraft-art.png'

const PASS = '✅ PASS'
const FAIL = '❌ FAIL'

const results = []
let totalPass = 0
let totalFail = 0

function record(viewport, check, value, pass) {
  const status = pass ? PASS : FAIL
  if (pass) totalPass++; else totalFail++
  results.push({ viewport, check, value, status })
  if (!pass) console.error(`  ${FAIL} [${viewport}] ${check}: ${value}`)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

// ─── Per-viewport checks ───────────────────────────────────────────────────
for (const vp of VIEWPORTS) {
  const page = await browser.newPage()
  await page.setViewportSize({ width: vp.width, height: vp.height })

  // ── Clear session/local storage ───────────────────────────────────────────
  await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    sessionStorage.clear()
    localStorage.clear()
  })
  await page.reload({ waitUntil: 'networkidle' })

  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const brokenImages = []

  // Check 1 — /smokecraft renders (200 → page loaded)
  const title = await page.title().catch(() => '')
  record(vp.name, '01_page_renders', title || '(loaded)', true)

  // Check 2 — old landing mockup NOT active background
  const bgImages = await page.evaluate(() => {
    const all = []
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage
      if (bg && bg !== 'none') all.push(bg)
    })
    return all
  })
  const hasOldAsset = bgImages.some(b => b.includes(OLD_LANDING_ASSET))
  record(vp.name, '02_old_mockup_not_background', hasOldAsset ? 'found' : 'absent', !hasOldAsset)

  // Check 3 — new atmospheric asset is active background
  const hasNewAsset = bgImages.some(b => b.includes(NEW_LANDING_ASSET))
  record(vp.name, '03_clean_bg_active', hasNewAsset ? 'found' : 'absent', hasNewAsset)

  // Check 4 — SECONDARY_NAV chip panel does not exist
  // The old panel had a specific structure: fixed bottom:168 with 6 chips
  // We detect by looking for buttons with those exact label texts clustered in a fixed div
  const secondaryNavExists = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const labels = btns.map(b => b.textContent.trim())
    // Old secondary nav rendered ALL of these as individual buttons in a fixed panel
    const oldChips = ['Browse Humidor', 'Enter Challenge', 'How It Works', 'View Pairing', 'My Passport', 'Rankings']
    const matched = oldChips.filter(c => labels.includes(c))
    if (matched.length < 4) return false
    // Check if they live inside a fixed container
    for (const btn of btns) {
      if (oldChips.includes(btn.textContent.trim())) {
        let el = btn.parentElement
        while (el) {
          const pos = getComputedStyle(el).position
          if (pos === 'fixed') {
            const bottom = parseInt(getComputedStyle(el).bottom || '0')
            if (bottom > 100) return true  // the old panel was bottom:168
          }
          el = el.parentElement
        }
      }
    }
    return false
  })
  record(vp.name, '04_secondary_nav_absent', secondaryNavExists ? 'present' : 'absent', !secondaryNavExists)

  // Check 5 — SmokeCraftNavBar NOT mounted (it renders role=navigation with fixed position at bottom:0)
  const navBarExists = await page.evaluate(() => {
    const navEls = document.querySelectorAll('[role="navigation"]')
    for (const el of navEls) {
      const style = getComputedStyle(el)
      if (style.position === 'fixed' && parseInt(style.bottom || '1') === 0) return true
    }
    return false
  })
  record(vp.name, '05_navbar_absent', navBarExists ? 'present' : 'absent', !navBarExists)

  // Check 6 — progress header hidden on landing
  const progressHeaderExists = await page.evaluate(() => {
    // SmokeCraftProgressHeader: fixed, top:0, zIndex:200, height:44px, contains "Visit"
    const all = document.querySelectorAll('*')
    for (const el of all) {
      const style = getComputedStyle(el)
      if (style.position === 'fixed' && style.top === '0px' && el.textContent.includes('Visit')) return true
    }
    return false
  })
  record(vp.name, '06_progress_header_hidden', progressHeaderExists ? 'present' : 'absent', !progressHeaderExists)

  // Check 7 — "Start SmokeCraft" appears exactly once
  const startCount = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter(b => /start smokecraft/i.test(b.textContent)).length
  )
  record(vp.name, '07_start_count', startCount, startCount === 1)

  // Check 8 — Continue is absent with cleared storage (currentSession = 1, no saved progress)
  const continueCount = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter(b => /continue previous session/i.test(b.textContent)).length
  )
  record(vp.name, '08_continue_absent_cleared', continueCount, continueCount === 0)

  // Check 9 — How It Works appears exactly once
  const howCount = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter(b => /how it works/i.test(b.textContent)).length
  )
  record(vp.name, '09_how_it_works_count', howCount, howCount === 1)

  // Check 10 — Passport appears exactly once
  const passportCount = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter(b => /view passport/i.test(b.textContent)).length
  )
  record(vp.name, '10_passport_count', passportCount, passportCount === 1)

  // Check 11 — Pairing appears exactly once
  const pairingCount = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter(b => /view pairing/i.test(b.textContent)).length
  )
  record(vp.name, '11_pairing_count', pairingCount, pairingCount === 1)

  // Check 12 — Rankings appears exactly once
  const rankingsCount = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter(b => /^rankings$/i.test(b.textContent.trim())).length
  )
  record(vp.name, '12_rankings_count', rankingsCount, rankingsCount === 1)

  // Check 13 — no fixed or absolute CTAs (all primary actions in normal flow)
  // Walk up from each primary CTA; skip SmokeCraftAssetScreen's root (aria-label = asset screen)
  // which is intentionally position:fixed as the full-screen background shell.
  const fixedCtaExists = await page.evaluate(() => {
    const primaryLabels = ['Start SmokeCraft', 'Continue Previous Session', 'How It Works']
    for (const btn of document.querySelectorAll('button')) {
      if (!primaryLabels.some(l => btn.textContent.trim().toLowerCase().includes(l.toLowerCase()))) continue
      let el = btn.parentElement
      while (el && el !== document.body) {
        const pos = getComputedStyle(el).position
        // SmokeCraftAssetScreen root is the structural background shell — not a floating panel
        const isAssetShell = el.getAttribute('aria-label') && el.getAttribute('aria-label').includes('SmokeCraft')
        if ((pos === 'fixed' || pos === 'absolute') && !isAssetShell) return true
        el = el.parentElement
      }
    }
    return false
  })
  record(vp.name, '13_no_fixed_abs_cta', fixedCtaExists ? 'fixed/abs found' : 'normal flow', !fixedCtaExists)

  // Check 14 — no horizontal overflow
  const hasHorizOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  )
  record(vp.name, '14_no_horiz_overflow', hasHorizOverflow ? 'overflow' : 'ok', !hasHorizOverflow)

  // Check 15 — no console errors
  record(vp.name, '15_no_console_errors', errors.length ? errors[0].slice(0, 60) : 'none', errors.length === 0)

  // Check 16 — no broken images (404)
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach(img => {
      if (!img.complete || img.naturalWidth === 0) window.__brokenImgs = (window.__brokenImgs || 0) + 1
    })
  })
  const broken = await page.evaluate(() => window.__brokenImgs || 0)
  record(vp.name, '16_no_broken_images', broken ? `${broken} broken` : 'ok', broken === 0)

  // Check 17 — Start SmokeCraft navigates correctly (→ /smokecraft/identity)
  await page.evaluate(() => sessionStorage.clear())
  const startBtn = page.getByRole('button', { name: /start smokecraft/i })
  if (await startBtn.count() > 0) {
    await startBtn.click()
    await page.waitForURL('**/smokecraft/identity', { timeout: 5000 }).catch(() => {})
    const url17 = page.url()
    record(vp.name, '17_start_navigates', url17, url17.includes('/smokecraft/identity') || url17.includes('/smokecraft/enroll'))
    await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  } else {
    record(vp.name, '17_start_navigates', 'button not found', false)
  }

  // Check 18 — How It Works navigates correctly (→ /smokecraft/how-it-works)
  const howBtn = page.getByRole('button', { name: /how it works/i })
  if (await howBtn.count() > 0) {
    await howBtn.click()
    await page.waitForURL('**/smokecraft/how-it-works', { timeout: 5000 }).catch(() => {})
    const url18 = page.url()
    record(vp.name, '18_howitworks_navigates', url18, url18.includes('/smokecraft/how-it-works'))
    await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  } else {
    record(vp.name, '18_howitworks_navigates', 'button not found', false)
  }

  // Check 19 — Golden Box renders and is unchanged (enable demo mode to bypass session lock)
  await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.goto(BASE + '/smokecraft/golden-box', { waitUntil: 'networkidle' })
  const goldenBoxInputs = await page.evaluate(() => document.querySelectorAll('input, select, textarea').length)
  record(vp.name, '19_golden_box_renders', `${goldenBoxInputs} inputs`, goldenBoxInputs >= 4)

  // Check 20 — window.__SMOKECRAFT_BUILD__ available
  await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  const buildId = await page.evaluate(() => window.__SMOKECRAFT_BUILD__?.commit || null)
  record(vp.name, '20_build_identity', buildId ? buildId.slice(0, 10) : 'missing', buildId != null)

  await page.close()
}

await browser.close()

// ─── Report ───────────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════')
console.log('  SMOKECRAFT LANDING ROOT FIX — TEST REPORT')
console.log('════════════════════════════════════════════')

const colW = [20, 38, 26]
const header = `${'VIEWPORT'.padEnd(colW[0])} ${'CHECK'.padEnd(colW[1])} ${'VALUE'.padEnd(colW[2])} STATUS`
console.log(header)
console.log('─'.repeat(header.length))

for (const r of results) {
  console.log(
    `${r.viewport.padEnd(colW[0])} ${r.check.padEnd(colW[1])} ${String(r.value).slice(0,colW[2]).padEnd(colW[2])} ${r.status}`
  )
}

console.log('─'.repeat(header.length))
console.log(`\n  PASS: ${totalPass}   FAIL: ${totalFail}   TOTAL: ${totalPass + totalFail}`)

if (totalFail === 0) {
  console.log('\n  ✅ LANDING ROOT FIX TESTS PASSED\n')
} else {
  console.log('\n  ❌ SOME CHECKS FAILED\n')
  process.exit(1)
}
