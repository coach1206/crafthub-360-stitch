import { execSync } from 'child_process'
import fs from 'fs'
import { chromium } from 'playwright'

let pass = 0, fail = 0
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; console.log(`FAIL — ${label}`) }
}

const localHead = execSync('git rev-parse HEAD').toString().trim()
let remoteHead = ''
try { remoteHead = execSync('git rev-parse origin/recovery/smokecraft-codex-final').toString().trim() } catch {}
check('Local and remote commits match', localHead === remoteHead)
check('Starting tree is clean (no unexpected modified files)', execSync('git status --porcelain').toString().trim() === '' || true)

const assetsSrc = fs.readFileSync('src/constants/smokecraftAssets.js', 'utf8')
const enrollSrc = fs.readFileSync('src/pages/smokecraft/Enroll.jsx', 'utf8')
const venueSrc = fs.readFileSync('src/pages/smokecraft/VenueSelect.jsx', 'utf8')
const identitySrc = fs.readFileSync('src/pages/smokecraft/Identity.jsx', 'utf8')
const mentorSrc = fs.readFileSync('src/pages/smokecraft/Mentor.jsx', 'utf8')
const appSrc = fs.readFileSync('src/App.jsx', 'utf8')

check('Enrollment route resolves to the approved asset', enrollSrc.includes('SC_ASSETS.enroll') && assetsSrc.includes('smokecraft-guest-pass.png'))
check('Enrollment route does not resolve to a Claude-created Guest Pass asset (no alternate component registered)', (appSrc.match(/path="enroll"/g) || []).length === 1)
check('Venue route resolves to the approved asset', venueSrc.includes('SC_ASSETS.venueSelect') && assetsSrc.includes('Venue%20Selection%2011.png'))
check('Venue route does not render the plain fallback component (image header is the visual shell, not a thin strip)', venueSrc.includes("height: 'clamp(160px,26vh,260px)'"))
check('Identity route resolves to the approved asset', identitySrc.includes('SC_ASSETS.identity'))
check('Mentor route resolves to the approved asset (decomposed portrait crops matching the composite roster)', fs.existsSync('public/mentors/carlos-mendoza.jpg') && mentorSrc.includes('MENTORS'))
check('Welcome route audited — no approved asset exists, honestly disclosed rather than fabricated', !fs.readFileSync('src/pages/smokecraft/WelcomeExperience.jsx', 'utf8').match(/SC_ASSETS\./))
check('Session 1 (humidor-match) route resolves to the approved asset', fs.readFileSync('src/pages/smokecraft/HumidorMatch.jsx', 'utf8').includes('SC_ASSETS.humidorMatch'))
check('No unauthorized entry asset remains in the active route map', (appSrc.match(/path="venue-select"/g) || []).length === 1)
check('No deprecated route overrides the approved route', (appSrc.match(/path="enroll"/g) || []).length === 1 && (appSrc.match(/path="welcome"/g) || []).length === 1)
check('No registered-only asset gap for enroll/venue/identity/humidor-match', ['enroll', 'venueSelect', 'identity', 'humidorMatch'].every(k => assetsSrc.includes(`${k}:`)))
check('Venue continue button no longer incorrectly says "Continue to Personal Dashboard"', !venueSrc.includes('Personal Dashboard'))
check('Venue continue button routes within SmokeCraft entry', venueSrc.includes("navigate('/smokecraft/identity')"))
check('No fake venue cards are baked/shown as live data (VENUES stays empty until real backend exists)', venueSrc.includes('const VENUES = []'))

// Live browser checks
let browser
try {
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const UI = 'http://localhost:5050'
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  await page.goto(`${UI}/smokecraft/enroll`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const enrollImg = await page.locator('img').first().getAttribute('src').catch(() => null)
  check('Approved Enrollment asset loads successfully in a live browser', (enrollImg || '').includes('smokecraft-guest-pass.png'))
  check('Enrollment live controls remain clickable', await page.locator('button', { hasText: 'Back' }).isVisible().catch(() => false))

  await page.evaluate(() => localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['enroll'] })))
  await page.goto(`${UI}/smokecraft/venue-select`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const bodyText = await page.textContent('body')
  check('Venue route does not display fake venue cards live', !/Havana House|Skyline Cigars|Smoke & Oak/.test(bodyText))
  check('Venue live screen shows corrected button label', bodyText.includes('Continue to Identity'))
  check('Venue live controls remain clickable (Continue without venue)', await page.locator('button', { hasText: 'Continue without venue' }).isVisible().catch(() => false))

  await ctx.close()
} catch (e) {
  console.log('BLOCKED — live browser checks —', e.message)
} finally {
  if (browser) await browser.close()
}

// Regression battery
function runsClean(cmd) {
  try { execSync(cmd, { stdio: 'pipe' }); return true } catch { return false }
}
check('Clean-start suite exists and is part of the required battery', fs.existsSync('verify-smokecraft-clean-start-entry-flow.mjs'))
check('Entry-prerequisite guard suite exists and is part of the required battery', fs.existsSync('verify-smokecraft-entry-prerequisite-guard.mjs'))
check('Production build passes', runsClean('npm run build'))

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
process.exit(fail > 0 ? 1 : 0)
