// Focused verification for the Ticket Tapper journey-scope integration
// package. Scope: SmokeCraft Venue Commerce (full mode), /smokecraft/venue-select
// (compact), /smokecraft/session-complete (compact). Does not re-test the 30
// unrelated full-bleed journey routes (covered by their own existing suites).
import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:4174'
const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

async function seedGuest(page, { withVenue } = {}) {
  await page.goto(`${BASE}/smokecraft/venue-select`)
  await page.evaluate((withVenue) => {
    // Demo mode bypasses SmokeCraftSessionGuard locks so this focused suite
    // can reach each target route directly without re-deriving the full
    // 27-session unlock chain (already covered by the spine test suite).
    sessionStorage.setItem('novee_demo_mode', '1')
    sessionStorage.setItem('demoMode', 'true')
    sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      completedSteps: ['entry', 'enroll', 'venue-select', 'identity'],
      xp: 500, badges: [],
    }))
    const journey = {
      selectedVenue: withVenue ? { id: 'venue-test-a', name: 'Test Venue A', skipped: false, selectedAt: Date.now() } : null,
      identity: { preferredName: 'Test Guest' },
    }
    localStorage.setItem('sc_journey_v1', JSON.stringify(journey))
  }, withVenue)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// 1. No hardcoded venue ID literal remains in the commerce page source
const commerceSrc = fs.readFileSync('src/pages/smokecraft/SmokeCraftVenueCommerce.jsx', 'utf8')
check('Hardcoded smokecraft-360-main venue ID removed from commerce page', !commerceSrc.includes("'smokecraft-360-main'"))
check('Commerce page derives venueId from journey.selectedVenue', commerceSrc.includes('journey.selectedVenue'))

// 2. Venue-select: no venue selected -> compact strip shows honest no-venue state, no API call for specials
await seedGuest(page, { withVenue: false })
let sawSpecialsFetch = false
page.on('request', req => { if (req.url().includes('/api/smokecraft/ticket-tapper/specials/')) sawSpecialsFetch = true })
await page.goto(`${BASE}/smokecraft/venue-select`)
await page.waitForTimeout(800)
const noVenueText = await page.locator('text=Select a venue to see specials').count()
check('Venue Select: no-venue compact state shown before selection', noVenueText > 0)
check('Venue Select: no specials API call made without a venue', !sawSpecialsFetch)

// 3. Route scope: strip absent on a sampled full-bleed journey route (Pairing Lab)
await seedGuest(page, { withVenue: true })
await page.evaluate(() => {
  const j = JSON.parse(localStorage.getItem('sc_journey_v1'))
  j.pairing = { selectedCigar: true }
  localStorage.setItem('sc_journey_v1', JSON.stringify(j))
})
await page.goto(`${BASE}/smokecraft/pairing-lab`)
await page.waitForTimeout(500)
const tapperOnPairingLab = await page.locator("text=Venue Specials").count() + await page.locator("text=Tonight's Specials").count()
check('Ticket Tapper absent from Pairing Lab (full-bleed journey route)', tapperOnPairingLab === 0)

// 4. Session Complete: compact strip present, no page-level horizontal overflow
await page.goto(`${BASE}/smokecraft/session-complete`)
await page.waitForTimeout(800)
const scHasStrip = await page.locator('text=Venue Specials').count()
check('Session Complete: compact Ticket Tapper section present', scHasStrip > 0)
const scOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
check('Session Complete: no page-level horizontal overflow', !scOverflow)

// 5. No TicketTicker.jsx usage anywhere in smokecraft pages/components touched this pass
const files = [
  'src/pages/smokecraft/SmokeCraftVenueCommerce.jsx',
  'src/pages/smokecraft/VenueSelect.jsx',
  'src/pages/smokecraft/SessionComplete.jsx',
  'src/components/smokecraft/TicketTapperSpecialsStrip.jsx',
]
const usesTicketTicker = files.some(f => fs.readFileSync(f, 'utf8').includes('TicketTicker'))
check('No TicketTicker.jsx import/usage in touched files', !usesTicketTicker)

await browser.close()

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
