import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:5000'
const OUT = 'public/proof/smokecraft-package-a-live-correction'
let passed = 0, failed = 0
function ok(n, msg) { passed++; console.log(`  ✓ [${n}] ${msg}`) }
function bad(n, msg) { failed++; console.log(`  ✗ [${n}] ${msg}`) }

async function seedGuest(page) {
  await page.goto(`${BASE}/smokecraft`)
  await page.evaluate(() => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'gb-live-check', xp: 0, completedSteps: ['entry'], profile: {}, badges: [], smokeCraft: {} }))
    localStorage.setItem('novee_demo_mode', 'true')
    localStorage.removeItem('sc_journey_v1')
  })
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  fs.mkdirSync(OUT, { recursive: true })

  console.log('── Golden Box: baked-content absence ──')
  await seedGuest(page)
  await page.goto(`${BASE}/smokecraft/golden-box`)
  await page.waitForTimeout(500)

  const body = await page.textContent('body')
  !body.includes('Full Name') ? ok(1, 'No "Full Name" field on Golden Box') : bad(1, '"Full Name" found')
  !body.includes('Email Address') ? ok(2, 'No "Email Address" field on Golden Box') : bad(2, '"Email Address" found')
  !body.includes('Birth Date') ? ok(3, 'No "Birth Date" field on Golden Box') : bad(3, '"Birth Date" found')
  !body.includes('Country') ? ok(4, 'No "Country" field on Golden Box') : bad(4, '"Country" found')
  !body.includes('Venue Settings') ? ok(5, 'No "Venue Settings" section on Golden Box') : bad(5, '"Venue Settings" found')

  const inputCount = await page.locator('input').count()
  inputCount === 1 ? ok(6, 'Acknowledgement checkbox is the only form control on Golden Box') : bad(6, `Found ${inputCount} inputs, expected 1`)

  // Confirm the full GOLDEN BOX RULES.png composite is never rendered live
  const compositeUsed = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'))
    const bgUrls = els.map(el => getComputedStyle(el).backgroundImage).filter(b => b && b !== 'none')
    return bgUrls.some(b => b.includes('GOLDEN%20BOX%20RULES'))
  })
  !compositeUsed ? ok(7, 'Full GOLDEN BOX RULES.png composite is never used as a live background') : bad(7, 'Composite image still rendered live')

  const heroUsed = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'))
    const bgUrls = els.map(el => getComputedStyle(el).backgroundImage).filter(b => b && b !== 'none')
    return bgUrls.some(b => b.includes('golden-box-hero.jpg'))
  })
  heroUsed ? ok(8, 'Dedicated clean golden-box-hero.jpg is used for the decorative header') : bad(8, 'golden-box-hero.jpg not found in use')

  // Disable/remove all background images and confirm content survives
  const survivesWithoutBackgrounds = await page.evaluate(() => {
    document.querySelectorAll('*').forEach(el => { el.style.backgroundImage = 'none' })
    const b = document.body.innerText
    return b.includes('Golden Box Rules') && b.includes('Respect the Cigar') && !!document.querySelector('input[type="checkbox"]')
  })
  survivesWithoutBackgrounds ? ok(9, 'Disabling all background images does not remove Golden Box rules or controls') : bad(9, 'Content depended on background images')

  await page.reload()
  await page.waitForTimeout(500)

  // Close-up proof: header region only
  await page.screenshot({ path: `${OUT}/golden-box-closeup-header.png`, clip: { x: 0, y: 0, width: 1440, height: 160 } })
  // Close-up proof: principles + acknowledgement region
  await page.screenshot({ path: `${OUT}/golden-box-closeup-principles-ack.png`, clip: { x: 180, y: 160, width: 620, height: 540 } })
  // Close-up proof: quick reminders region
  await page.screenshot({ path: `${OUT}/golden-box-closeup-reminders.png`, clip: { x: 790, y: 160, width: 480, height: 420 } })
  // Close-up proof: footer region (no overlap check)
  await page.screenshot({ path: `${OUT}/golden-box-closeup-footer.png`, clip: { x: 0, y: 740, width: 1440, height: 160 } })
  ok('proof', 'Close-up proof screenshots captured')

  await browser.close()
  console.log('\n' + '─'.repeat(50))
  console.log(`Result: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
