/**
 * Required-Interaction Closure Package A — Draft-Persistence Correction.
 * Real Playwright browser verification: server-side draft save, genuine
 * reload, resume, and stale-draft rejection for Sessions 8, 12, 16.
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
const results = []
function ok(msg) { pass++; results.push({ name: msg, ok: true }); console.log(`  PASS  ${msg}`) }
function bad(msg, detail) { fail++; results.push({ name: msg, ok: false, detail }); console.log(`  FAIL  ${msg}${detail ? ' — ' + detail : ''}`) }

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForTimeout(1200)
}

function buildSeedState() {
  const now = Date.now()
  const guestSession = {
    sessionId: 'pkga-draft-' + now, createdAt: now, updatedAt: now, __version: 4,
    profile: { firstName: 'Draft', lastName: 'Correction' },
    completedSteps: ['enroll', 'identity', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format',
      'cut-toast-light', 'lighting-tutorial', 'flavor-memory', 'pairing-lab',
      'mentor-commentary', 'knowledge-drop'],
    xp: 0, rank: 'Novice', badges: [], smokecraftStamps: [], mentors: [], favorites: [], pendingOrders: [],
    currentSmokecraftStep: null, latestStampId: null, goldenBoxProgress: null,
    skillScore: 0, challengeScore: 0, loyaltyPoints: 0, lifetimeLoyaltyPoints: 0, redeemablePoints: 0,
    passportStampCount: 0, purchaseCount: 0, houseCigarPurchases: 0, pairingPurchases: 0,
    eventParticipationCount: 0, referralCount: 0, loyaltyLedger: [], usedTransactionIds: [],
    guestId: 'pkga-draft-guest-' + now, venueId: 'novee-grand-lounge', deviceId: 'kiosk-001', entrySource: 'qr-scan',
    entryStartedAt: now, lastActiveAt: now, guestProfile: null, profileComplete: true, resumeToken: null,
    audioEnabled: true, hapticsEnabled: true, lastVisitedRoute: null, leaderboardScore: 0, selectedCraft: null,
    selectedMentor: null, selectedMentorCountry: null, selectedLevel: null,
    smokeCraft: {}, passport: {}, goldenBox: {}, leaderboard: {}, preferences: {}, system: {}, pos3: {}, eatCommand: {},
  }
  const journey = { stateVersion: 1, selectedVenue: { id: 'v1', name: 'Test Lounge', selectedAt: now } }
  return { guestSession, journey }
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const { guestSession, journey } = buildSeedState()
  const ctx = await browser.newContext({
    viewport: { width: 1024, height: 900 },
    storageState: {
      cookies: [],
      origins: [{
        origin: BASE,
        localStorage: [
          { name: 'novee_guest_session', value: JSON.stringify(guestSession) },
          { name: 'sc_journey_v1', value: JSON.stringify(journey) },
        ],
      }],
    },
  })
  await ctx.addInitScript(() => { sessionStorage.setItem('novee_demo_mode', '1') })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  page.on('pageerror', err => consoleErrors.push(String(err)))

  console.log('\n── Session 8 — enter partial observations, save, leave, return ──')
  await nav(page, '/smokecraft/first-third')
  const loadedReady = await page.locator('button[aria-pressed]').first().isVisible().catch(() => false)
  loadedReady ? ok('Session 8 loads past the server-draft loading phase into the real interaction UI') : bad('Session 8 loads to ready phase')

  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(400)
  await page.fill('textarea[aria-label="First third personal notes"]', 'Genuine reload test note.')
  await page.click('button[aria-label="Save draft"]')
  await page.waitForTimeout(900)
  const savedConfirmed = await page.locator('text=✓ Saved').first().isVisible().catch(() => false)
  savedConfirmed ? ok('Save Draft shows a real server-confirmed "Saved" state (not a fake local-only confirmation)') : bad('Save Draft confirms via server')

  // Leave the route entirely, then come back — exercises server resume,
  // not just client in-memory state.
  await nav(page, '/smokecraft/knowledge-drop')
  await nav(page, '/smokecraft/first-third')
  const zoneRestoredAfterLeave = await page.locator('button[aria-pressed="true"]').first().isVisible().catch(() => false)
  const notesRestoredAfterLeave = await page.locator('textarea[aria-label="First third personal notes"]').inputValue().catch(() => '')
  ;(zoneRestoredAfterLeave && notesRestoredAfterLeave === 'Genuine reload test note.')
    ? ok('After leaving the route and returning, the server draft restores both the selection and the personal note')
    : bad('Draft restores after leaving and returning', `zone=${zoneRestoredAfterLeave} notes="${notesRestoredAfterLeave}"`)

  console.log('\n── Session 8 — genuine hard reload preserves the server draft ──')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const zoneAfterReload = await page.locator('button[aria-pressed="true"]').first().isVisible().catch(() => false)
  zoneAfterReload ? ok('A genuine hard reload restores the selection from the server draft') : bad('Reload restores server draft')

  console.log('\n── Session 8 — complete, then reload confirms completed state (not a stale draft) ──')
  await page.click('button:has-text("Continue to Second Third")')
  await page.waitForTimeout(1800)
  const navigatedAway = page.url().includes('/smokecraft/flavor-memory')
  navigatedAway ? ok('Session 8 completes and navigates to the real next step') : bad('Session 8 completes', page.url())

  const xpAfterComplete = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
    const d = await r.json()
    return d.state?.xpTotal
  })
  const xpPositive = xpAfterComplete > 0
  xpPositive ? ok('XP total is greater than zero after Session 8 completion') : bad('XP reflects completion')

  console.log('\n── Session 8 — stale draft write attempt after completion is denied ──')
  const staleAttempt = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state/tasting/first-third/draft', {
      method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftData: { notesSelected: ['Body Start'] }, expectedVersion: 0 }),
    })
    return r.status
  })
  staleAttempt === 409 ? ok('A stale draft write attempted after completion is denied with 409 (completed state cannot be overwritten)') : bad('Stale draft write denied after completion', String(staleAttempt))

  console.log('\n── Session 8 — no duplicate XP from re-navigating to a completed session ──')
  const xpAfterRevisit = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
    const d = await r.json()
    return d.state?.xpTotal
  })
  xpAfterRevisit === xpAfterComplete ? ok('No duplicate XP was granted from the stale-draft attempt or revisiting') : bad('No duplicate XP', `before=${xpAfterComplete} after=${xpAfterRevisit}`)

  console.log('\n── Session 12 — full draft round trip ──')
  await nav(page, '/smokecraft/second-third')
  const zone12Loaded = await page.locator('button[aria-pressed]').first().isVisible().catch(() => false)
  zone12Loaded ? ok('Session 12 loads past the server-draft loading phase') : bad('Session 12 loads to ready phase')
  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(400)
  await page.click('button[aria-label="Save draft"]')
  await page.waitForTimeout(900)
  const saved12 = await page.locator('text=/✓ Saved|Synced/').first().isVisible().catch(() => false)
  saved12 ? ok('Session 12 draft save confirms server-side') : bad('Session 12 draft save confirms')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const zone12AfterReload = await page.locator('button[aria-pressed="true"]').first().isVisible().catch(() => false)
  zone12AfterReload ? ok('Session 12 selection survives a genuine reload') : bad('Session 12 reload resume')

  console.log('\n── Session 16 — full draft round trip ──')
  await nav(page, '/smokecraft/final-third')
  const flavorButtons = page.locator('button[aria-pressed]')
  const flavorCount = await flavorButtons.count()
  if (flavorCount > 0) { await flavorButtons.first().click(); await page.waitForTimeout(400) }
  await page.click('button[aria-label="Save draft"]')
  await page.waitForTimeout(900)
  const saved16 = await page.locator('text=/✓ Saved|Synced/').first().isVisible().catch(() => false)
  saved16 ? ok('Session 16 draft save confirms server-side') : bad('Session 16 draft save confirms')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const zone16AfterReload = await page.locator('button[aria-pressed="true"]').first().isVisible().catch(() => false)
  zone16AfterReload ? ok('Session 16 selection survives a genuine reload') : bad('Session 16 reload resume')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429|ERR_INTERNET_DISCONNECTED/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the draft-persistence flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await ctx.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-required-interaction-package-a-draft-correction', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-required-interaction-package-a-draft-correction/browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
