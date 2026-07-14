/**
 * Batch A screenshot capture: Mentor, Format, SeedSoil
 * Viewports: 1440×900, 1024×768, 768×1024, 390×844
 * States: initial + selected
 */
import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'

const BASE = 'http://localhost:5000'
const OUT  = 'public/proof/smokecraft-exact-visual-repair'

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900  },
  { name: 'tablet-landscape-1024', width: 1024, height: 768  },
  { name: 'tablet-portrait-768',   width: 768,  height: 1024 },
  { name: 'mobile-390',            width: 390,  height: 844  },
]

async function shot(page, path, label) {
  await page.screenshot({ path, fullPage: false })
  console.log(`  captured: ${label}`)
}

async function goto(page, route) {
  await page.addInitScript(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.removeItem('smokecraft_progress')
    localStorage.removeItem('sc_mentor_v1')
    localStorage.removeItem('sc_format_v1')
    localStorage.removeItem('sc_seed_soil_v1')
    localStorage.removeItem('sc_journey_v1')
  })
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.waitForTimeout(1200)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  for (const vp of VIEWPORTS) {
    await mkdir(`${OUT}/${vp.name}`, { recursive: true })
  }

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

  // ── Initial state screenshots at all 4 viewports ──────────────────────────
  for (const vp of VIEWPORTS) {
    const ctx  = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()

    for (const [slug, route] of [['mentor', '/smokecraft/mentor-selection'], ['format', '/smokecraft/format'], ['seed-soil', '/smokecraft/seed-soil']]) {
      await goto(page, route)
      await shot(page, `${OUT}/${vp.name}/${slug}-initial.png`, `${vp.name}/${slug}-initial`)
    }

    await ctx.close()
  }

  // ── Selected-state screenshots (desktop 1440 only) ────────────────────────
  const vpSel = VIEWPORTS[0]
  const ctx   = await browser.newContext({ viewport: { width: vpSel.width, height: vpSel.height } })
  const page  = await ctx.newPage()

  // Mentor — 1 selected (click first card button)
  await goto(page, '/smokecraft/mentor-selection')
  // Find first hotspot button and click it
  const mentorBtns = page.locator('button[aria-pressed]')
  await mentorBtns.first().click()
  await page.waitForTimeout(500)
  await shot(page, `${OUT}/desktop-1440/mentor-selected-1.png`, 'mentor-selected-1')

  // Mentor — 2 selected (click second card too)
  await mentorBtns.nth(1).click()
  await page.waitForTimeout(500)
  await shot(page, `${OUT}/desktop-1440/mentor-selected-2.png`, 'mentor-selected-2')

  // Mentor — reload check
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await shot(page, `${OUT}/desktop-1440/mentor-after-reload.png`, 'mentor-after-reload')

  // Format — 1 vitola selected
  await goto(page, '/smokecraft/format')
  const fmtBtns = page.locator('button[aria-pressed]')
  await fmtBtns.first().click()
  await page.waitForTimeout(500)
  await shot(page, `${OUT}/desktop-1440/format-selected-1.png`, 'format-selected-1')

  // Format — reload check
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await shot(page, `${OUT}/desktop-1440/format-after-reload.png`, 'format-after-reload')

  // Seed & Soil — 1 seed + 1 soil selected
  await goto(page, '/smokecraft/seed-soil')
  const ssBtns = page.locator('button[aria-pressed]')
  // Click seed (first 4) and soil (buttons 4-7)
  await ssBtns.nth(0).click()  // Criollo seed
  await page.waitForTimeout(300)
  await ssBtns.nth(4).click()  // Sandy Loam soil
  await page.waitForTimeout(500)
  await shot(page, `${OUT}/desktop-1440/seed-soil-selected.png`, 'seed-soil-selected')

  // Seed & Soil — reload check
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await shot(page, `${OUT}/desktop-1440/seed-soil-after-reload.png`, 'seed-soil-after-reload')

  await ctx.close()
  await browser.close()

  console.log('\n=== All screenshots captured ===')
}

main().catch(e => { console.error(e); process.exit(1) })
