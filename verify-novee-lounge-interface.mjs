import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE = 'http://localhost:5000'
const PROOF = 'public/proof/novee-os-lounge-interface'
fs.mkdirSync(PROOF, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop-1440x900',  width: 1440, height: 900 },
  { name: 'tablet-1024x768',   width: 1024, height: 768 },
  { name: 'tablet-768x1024',   width: 768,  height: 1024 },
  { name: 'mobile-390x844',    width: 390,  height: 844 },
]

const IMAGE_PATH = 'public/assets/novee-os/NOVEE-OS-LOUNGE-INTERFACE.png'

let passed = 0
let failed = 0
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

async function run() {
  // 1. Image file check
  console.log('\n── Image File ──────────────────────────────────────────────')
  check('Locked image path exists', fs.existsSync(IMAGE_PATH))
  const stat = fs.statSync(IMAGE_PATH)
  check('Image file non-empty (>100KB)', stat.size > 100_000, `${stat.size} bytes`)

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n── ${vp.name} ────────────────────────────────────────────────`)
      const page = await browser.newPage()
      await page.setViewportSize({ width: vp.width, height: vp.height })

      // Stub API calls
      await page.route(/^http:\/\/localhost:5000\/api\//, route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      )

      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })

      // Check approved image is in DOM
      const imgSrc = await page.$eval(
        'img[alt="NOVEE OS — Private Experience Layer"]',
        el => el.src
      ).catch(() => null)
      check('Approved image in DOM', !!imgSrc && imgSrc.includes('NOVEE-OS-LOUNGE-INTERFACE'))

      // Check no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      check('No horizontal overflow', bodyWidth <= vp.width, `scrollWidth=${bodyWidth}`)

      // Check hotspot buttons present
      const enterNovee = page.getByRole('button', { name: /Enter NOVEE OS/i })
      check('Enter NOVEE OS hotspot present', await enterNovee.count() > 0)

      const enterCraftHub = page.getByRole('button', { name: /Enter CraftHub 360/i })
      check('Enter CraftHub 360 hotspot present', await enterCraftHub.count() > 0)

      const enterSmokeCraft = page.getByRole('button', { name: /Enter SmokeCraft 360/i })
      check('Enter SmokeCraft 360 hotspot present', await enterSmokeCraft.count() > 0)

      const demoMode = page.getByRole('button', { name: /Demo Mode/i })
      check('Demo Mode hotspot present', await demoMode.count() > 0)

      // Check no visible floating button panel (no h1 with NOVEE OS text rendered as HTML)
      const reactCard = await page.$('h1').catch(() => null)
      check('No duplicate React card interface', !reactCard)

      // Screenshot
      const ssPath = path.join(PROOF, `root-${vp.name}.png`)
      await page.screenshot({ path: ssPath, fullPage: false })
      console.log(`  📸 ${ssPath}`)

      // Navigation tests (only desktop to avoid slowness)
      if (vp.name === 'desktop-1440x900') {
        console.log('\n── Navigation Tests (desktop) ──────────────────────────────')

        // NOVEE OS is intentionally blocked for unauthenticated guests (aria-disabled)
        // Navigation check is covered in verify-novee-entry-frontend.mjs (auth flow)

        // Use a fresh page WITHOUT api stub so novee API calls pass through
        const navPage = await browser.newPage()
        await navPage.setViewportSize({ width: 1440, height: 900 })

        // Test Enter CraftHub 360 → /crafthub (guest-accessible)
        await navPage.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
        await navPage.waitForTimeout(1200)
        await navPage.click('[aria-label="Enter CraftHub 360"]')
        await navPage.waitForTimeout(2500)
        const urlCraft = navPage.url()
        check('Enter CraftHub 360 → /crafthub', urlCraft.includes('/crafthub'), urlCraft)

        // Test Enter SmokeCraft 360 → /smokecraft (guest-accessible)
        await navPage.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 })
        await navPage.waitForTimeout(1200)
        await navPage.click('[aria-label="Enter SmokeCraft 360"]')
        await navPage.waitForTimeout(2500)
        const urlSmoke = navPage.url()
        check('Enter SmokeCraft 360 → /smokecraft', urlSmoke.includes('/smokecraft'), urlSmoke)

        await navPage.close()
      }

      await page.close()
    }
  } finally {
    await browser.close()
  }

  console.log('\n=======================================================')
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (failures.length) console.log('Failures:', failures)
  if (failed > 0) process.exit(1)
}

run().catch(e => { console.error(e); process.exit(1) })
