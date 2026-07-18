import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:5000'
const OUT = 'public/proof/smokecraft-package-a-live-correction'
let passed = 0, failed = 0
function ok(n, msg) { passed++; console.log(`  ✓ [${n}] ${msg}`) }
function bad(n, msg) { failed++; console.log(`  ✗ [${n}] ${msg}`) }

async function seedGuest(page, xp = 0) {
  await page.goto(`${BASE}/smokecraft`)
  await page.evaluate((xpVal) => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'gb-live-check', xp: xpVal, completedSteps: ['entry'], profile: {}, badges: [], smokeCraft: {} }))
    localStorage.setItem('novee_demo_mode', 'true')
    localStorage.removeItem('sc_journey_v1')
  }, xp)
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1456, height: 1080 } })
  fs.mkdirSync(OUT, { recursive: true })

  console.log('── Golden Box: approved composition restored, baked zones neutralized ──')
  await seedGuest(page, 340)
  await page.goto(`${BASE}/smokecraft/golden-box`)
  await page.waitForTimeout(500)

  // The approved full composite IS the live background again (git-documented
  // c4f2a03d pattern) — confirm it's actually in use.
  const compositeUsed = await page.evaluate(() => {
    const img = document.querySelector('img[alt*="Golden Box Rules"]')
    return img ? img.src.includes('GOLDEN%20BOX%20RULES') : false
  })
  compositeUsed ? ok(1, 'Approved full GOLDEN BOX RULES.png composite is the live background (not a substitute crop)') : bad(1, 'Approved composite not in use')

  // No baked-form content leaked into the DOM as live text (would only
  // happen if someone duplicated the Identity/Venue forms as real React).
  const body = await page.textContent('body')
  !body.includes('Full Name') ? ok(2, 'No "Full Name" field rebuilt as live text') : bad(2, '"Full Name" found as live text')
  !body.includes('Email Address') ? ok(3, 'No "Email Address" field rebuilt as live text') : bad(3, '"Email Address" found as live text')
  !body.includes('Venue Name') ? ok(4, 'No "Venue Name" field rebuilt as live text') : bad(4, '"Venue Name" found as live text')
  !body.includes('Guest Name') ? ok(5, 'No Guest Agreements table rebuilt as live text') : bad(5, 'Guest Agreements table found as live text')

  // Exactly one real form control (the acknowledgement checkbox) — Identity
  // and Venue Settings inputs are masked blank, not duplicated.
  const inputCount = await page.locator('input').count()
  inputCount === 1 ? ok(6, 'Acknowledgement checkbox is the only form control on Golden Box') : bad(6, `Found ${inputCount} inputs, expected 1`)

  // Real controls exist and are functional, opaquely covering their baked
  // counterparts (Back, XP badge, acknowledgement, Continue).
  const backBtn = await page.locator('button:has-text("Back")').count()
  backBtn > 0 ? ok(7, 'Real Back control exists') : bad(7, 'Back control missing')

  const xpShown = body.includes('340 XP')
  xpShown ? ok(8, 'Real guest XP renders live (replaces baked fake "0 XP")') : bad(8, 'Real XP not shown')

  const continueBtn = await page.locator('button:has-text("Next: Mentor Selection")').count()
  continueBtn > 0 ? ok(9, 'Real Continue control exists, matching approved baked label') : bad(9, 'Continue control missing')

  // Opacity check — every neutralized zone must be fully opaque (no baked
  // text ghosting through underneath).
  const allOpaque = await page.evaluate(() => {
    const checkOpaque = (el) => {
      const bg = getComputedStyle(el).backgroundColor
      const m = bg.match(/rgba?\(([^)]+)\)/)
      if (!m) return true
      const parts = m[1].split(',').map(s => parseFloat(s.trim()))
      const alpha = parts.length === 4 ? parts[3] : 1
      return alpha >= 0.99
    }
    const candidates = Array.from(document.querySelectorAll('button, label, div[aria-hidden="true"]'))
      .filter(el => el.getBoundingClientRect().width > 50)
    return candidates.every(checkOpaque)
  })
  allOpaque ? ok(10, 'All neutralized zones are fully opaque (no baked text bleed-through)') : bad(10, 'A neutralized zone is translucent')

  await page.click('input[type="checkbox"]')
  await page.waitForTimeout(200)
  const enabledAfterCheck = await page.locator('button:has-text("Next: Mentor Selection")').isDisabled()
  enabledAfterCheck === false ? ok(11, 'Continue enables after acknowledgement, matching approved footprint') : bad(11, 'Continue did not enable')

  await page.reload()
  await page.waitForTimeout(500)

  // Full-page + close-up proof
  await page.screenshot({ path: `${OUT}/golden-box-closeup-header.png`, clip: { x: 0, y: 0, width: 1456, height: 160 } })
  await page.screenshot({ path: `${OUT}/golden-box-closeup-commitment-venue.png`, clip: { x: 140, y: 420, width: 810, height: 400 } })
  await page.screenshot({ path: `${OUT}/golden-box-closeup-ack-continue.png`, clip: { x: 900, y: 580, width: 556, height: 120 } })
  await page.screenshot({ path: `${OUT}/golden-box-closeup-guest-agreements.png`, clip: { x: 700, y: 780, width: 756, height: 240 } })
  await page.screenshot({ path: `${OUT}/golden-box-closeup-footer.png`, clip: { x: 950, y: 990, width: 506, height: 90 } })
  ok('proof', 'Close-up proof screenshots captured')

  await browser.close()
  console.log('\n' + '─'.repeat(50))
  console.log(`Result: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
