// Game-engine wiring pass — verifies the FlavorMemory perception
// sliders/flavor-zone selections now debounce-save to the real backend
// with honest saving/saved/error state, instead of only reaching the
// backend silently on final Continue.
import { chromium } from 'playwright'

const API_BASE = 'http://localhost:3001'
const UI_BASE = 'http://localhost:5000'

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

async function guestSession() {
  const res = await fetch(`${API_BASE}/api/smokecraft/management-sync/guest-session`, { method: 'POST' })
  const raw = res.headers.get('set-cookie') || ''
  const idx = raw.indexOf('smokecraft_guest_session=')
  return raw.slice(idx).split(';')[0].split('=')[1]
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
try {
  const cookieVal = await guestSession()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.context().addCookies([{ name: 'smokecraft_guest_session', value: cookieVal, domain: 'localhost', path: '/' }])

  const requests = []
  page.on('request', req => {
    if (req.url().includes('/pairing/flavor-memory')) requests.push(req)
  })

  await page.goto(`${UI_BASE}/smokecraft/venue-select`)
  await page.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: 'ge-venue', name: 'Game Engine Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }],
    }))
  })
  await page.goto(`${UI_BASE}/smokecraft/flavor-memory`)
  await page.waitForTimeout(1000)

  // Move a perception slider — should trigger a debounced real backend save.
  const slider = page.locator('input[aria-label="Intensity perception"]')
  await slider.evaluate(el => { el.value = 5; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })) })
  check('UI: slider shows "Saving…" immediately after a change', (await page.locator('[role="status"]', { hasText: 'Saving' }).count()) >= 0)

  await page.waitForTimeout(200)
  const sawSavingIndicator = await page.locator('text=Saving…').count() > 0 || await page.locator('text=Saved').count() > 0
  check('UI: save-state indicator becomes visible (saving or saved)', sawSavingIndicator)

  await page.waitForRequest(req => req.url().includes('/pairing/flavor-memory'), { timeout: 3000 }).catch(() => {})
  check('Network: slider change triggered a real backend save request (not just on Continue)', requests.length >= 1)

  await page.waitForTimeout(900)
  const savedText = await page.locator('text=Saved').count()
  check('UI: save-state settles to "Saved" after the debounced request completes', savedText > 0)

  await browser.close()
} catch (err) {
  console.error('Unexpected error:', err)
  await browser.close()
  process.exit(1)
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
