#!/usr/bin/env node
/**
 * MVP2 Global Visual Proof Harness.
 *
 * Generates a side-by-side contact sheet for any registered screen:
 * LEFT = approved reference mockup image, RIGHT = actual rendered screenshot
 * of the live route, captured at a documented viewport.
 *
 * This is the family-generic successor to the SmokeCraft-only
 * scripts/smokecraftVisualProof.js. It covers every reference-image family
 * tracked in docs/mvp2-visual-image-registry.md: SmokeCraft, POS3, E.A.T.,
 * Passport, DayOne360, CraftHub.
 *
 * A screen with referenceImage: null has no approved binary reference in
 * the repo yet (see the registry for why). For those screens this script
 * captures the rendered screenshot alone and explicitly reports that no
 * visual comparison is possible — it does NOT fabricate a proof.
 *
 * Usage:
 *   npm run visual:all
 *   npm run visual:smokecraft
 *   npm run visual:passport
 *   npm run visual:pos3
 *   npm run visual:eat
 *   node scripts/visualProof.js --family=passport
 *   node scripts/visualProof.js --route=/smokecraft/seed-soil
 *   node scripts/visualProof.js --base-url=http://localhost:4173
 */

import { existsSync, readdirSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { execSync, spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { VISIT_STRUCTURE } from '../src/constants/session.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'docs', 'visual-proof')
const VIEWPORT = { width: 1440, height: 900 }
const HANDHELD_VIEWPORT = { width: 414, height: 896 }

// ── SmokeCraft visual-proof-only progress seeding ──────────────────────────
// VisitLockGuard (src/components/smokecraft/VisitLockGuard.jsx) locks any
// SmokeCraft session-5+ route until GuestSessionContext's completedSteps
// shows every earlier session done. The harness has no real guest progress,
// so a cold navigation always renders LockedVisit.jsx. This block computes
// the exact completedSteps array needed to legitimately pass that guard for
// a given target stepId — by walking the same VISIT_STRUCTURE the guard
// itself reads — and is used ONLY by this proof script, never by the app.
// It never modifies VisitLockGuard, GuestSessionContext, or any production
// auth/gating code; it only seeds localStorage in a Playwright browser
// context before navigation, exactly like the existing requiresAuth
// novee_admin_session injection used for POS3/E.A.T. below.
function findVisitSession(stepId) {
  for (const v of VISIT_STRUCTURE) {
    const s = v.sessions.find(s => s.id === stepId)
    if (s) return { visit: v.visit, session: s.session }
  }
  return null
}

/** All session ids (excluding 'entry', which the guard always treats as complete) strictly before the target stepId's session. */
function priorSessionIds(stepId) {
  const target = findVisitSession(stepId)
  if (!target) return []
  const ids = []
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (s.session < target.session && s.id !== 'entry') ids.push(s.id)
    }
  }
  return ids
}

/** Builds a full novee_guest_session-shaped object (same shape as createNewSession()) with completedSteps seeded so VisitLockGuard unlocks stepId's route. Proof-only — never written by the real app. */
function buildSeededGuestSession(stepId) {
  const completedSteps = priorSessionIds(stepId)
  const now = Date.now()
  return {
    sessionId: `proof_seed_${now}`,
    createdAt: now,
    updatedAt: now,
    __version: 4,
    profile: { firstName: '', lastName: '', nickname: '', email: '', phone: '', city: '', state: '', zip: '', photo: null, ageConfirmed: false },
    completedSteps,
    xp: 0,
    rank: 'Novice',
    badges: [],
    smokecraftStamps: [],
    mentors: [],
    favorites: [],
    pendingOrders: [],
    currentSmokecraftStep: null,
    latestStampId: null,
    goldenBoxProgress: null,
    guestId: null,
    venueId: 'novee-grand-lounge',
    deviceId: 'kiosk-001',
    entrySource: 'qr-scan',
    entryStartedAt: null,
    lastActiveAt: null,
    guestProfile: null,
    profileComplete: false,
    resumeToken: null,
    audioEnabled: true,
    hapticsEnabled: true,
    lastVisitedRoute: null,
    leaderboardScore: 0,
    selectedCraft: null,
    selectedMentor: null,
    selectedMentorCountry: null,
    selectedLevel: null,
    smokeCraft: {
      currentSession: null, completedSessions: [], sessionScores: [], flavorPreferences: [],
      strengthTolerance: null, aromaInterests: [], vitolaPreferences: [], pairingSelections: [],
      soilSeedSelections: [], mentorNotes: [], passportConnections: [], networkingStatus: 'not_started',
      networkingConsent: {
        allowShareStamp: false, allowShareName: false, allowShareContact: false,
        allowShareBusinessLinks: false, allowShareSmokeCraftLevel: false,
        allowShareFavoriteCigarStyle: false, allowShareEventStamp: false, allowVenueFollowUp: false,
      },
    },
    passport: { passportId: null, earnedStamps: [], latestStampId: null, connectionCount: 0, eventName: null, ceremonySeen: false },
    goldenBox: { eligible: false, progress: 0, entries: [], lastReveal: null },
    leaderboard: { score: 0, rank: 'Novice', submitted: false, displayName: null },
    preferences: { audioEnabled: true, hapticsEnabled: true, readInstead: false, language: 'en' },
    system: { lastVisitedRoute: null, schemaVersion: 4, kioskMode: false, sourceModule: null },
    pos3: { activeTicketId: null, tableNumber: null, staffId: null, suggestedPairings: [], upsellRecommendations: [], inventorySignals: [] },
    eatCommand: { engagementScore: 0, guestMoodSignal: null, sessionValue: 0, staffAssistTriggered: false, environmentNotes: [] },
  }
}

// Each screen: family, name, route, reference (filename in public/, or null
// if no binary reference has been uploaded to the repo yet), viewport
// override (for handheld POS3 screens).
const SCREENS = [
  // --- SmokeCraft ---
  { family: 'smokecraft', name: 'smokecraft-home', route: '/smokecraft', reference: 'PROFILE DISCOVER 11.png' },
  { family: 'smokecraft', name: 'enroll', route: '/smokecraft/enroll', reference: 'smokecraft Intake.png' },
  { family: 'smokecraft', name: 'seed-soil', route: '/smokecraft/seed-soil', reference: 'SEED & PAIRING.11.png', seedSmokeCraftStep: 'seed-soil' },
  { family: 'smokecraft', name: 'format', route: '/smokecraft/format', reference: 'SHAPE SIZE BURN.11.png', seedSmokeCraftStep: 'format' },
  { family: 'smokecraft', name: 'cigar-gauge-guide', route: '/smokecraft/cigar-gauge-guide', reference: null, seedSmokeCraftStep: 'format', note: 'Sub-step of Session 5 (Shape, Size & Burn Time) — gated by the same VisitLockGuard stepId ("format") as /smokecraft/format, not a separate completed session. Reference image "cigar gauge guide.png" was shared inline in chat but has not been committed to the repo as a binary file; reference intentionally left null, not substituted.' },
  { family: 'smokecraft', name: 'golden-box', route: '/smokecraft/golden-box', reference: null, note: 'No reference mockup mapped to the plain /smokecraft/golden-box index route (the existing GOLDEN BOX JOURNEY11.png reference is mapped to /smokecraft/golden-box/status below). Ungated — no seeding needed.' },
  { family: 'smokecraft', name: 'golden-box-status', route: '/smokecraft/golden-box/status', reference: 'GOLDEN BOX JOURNEY11.png' },
  { family: 'smokecraft', name: 'mentor-selection', route: '/smokecraft/mentor-selection', reference: null, note: 'Ungated route. No reference mockup uploaded.' },
  { family: 'smokecraft', name: 'leaderboard', route: '/smokecraft/leaderboard', reference: 'lounge demo ranking.11png.png' },

  // Uploaded batch confirmed 2026-06-25 via grep against src/App.jsx (see
  // docs/mvp2-visual-image-registry.md for the exact commands run). Mapping
  // only — no UI fix has been made against these references yet.
  { family: 'smokecraft', name: 'cut-toast-light', route: '/smokecraft/cut-toast-light', reference: 'CUT TOAST, & LIGHT.png', referenceDir: 'design-references/mvp2/smokecraft', seedSmokeCraftStep: 'cut-toast-light' },
  { family: 'smokecraft', name: 'management-sync', route: '/smokecraft/management-sync', reference: 'venue-management-sync.png', referenceDir: 'design-references/mvp2/smokecraft', seedSmokeCraftStep: 'management-sync' },
  { family: 'smokecraft', name: 'final-third', route: '/smokecraft/final-third', reference: 'final-third-tasting.png', referenceDir: 'design-references/mvp2/smokecraft', seedSmokeCraftStep: 'final-third', note: '"findal third tasting.png" is a typo-named duplicate of the same mockup (same dimensions, different compression/md5) — not used as the canonical reference.' },
  { family: 'smokecraft', name: 'flavor-dna', route: '/smokecraft/flavor-dna', reference: 'flavodr dna.png', referenceDir: 'design-references/mvp2/smokecraft', note: 'Filename preserved exactly as uploaded ("flavodr dna.png", typo for "flavor dna"). A cleaned name of "flavor-dna.png" is a recommendation only, not yet approved as canonical.' },
  { family: 'smokecraft', name: 'connections', route: '/smokecraft/connections', reference: 'connections-reference.png', referenceDir: 'design-references/mvp2/smokecraft', seedSmokeCraftStep: 'connections', note: '2026-06-27: reference updated to "connections-reference.png" (copy of public/"360 PASSPORT NETWORK INTERFACE 2.png"), per explicit user mapping request. This is a full passport-connection dashboard mockup (member directory, QR scan, journey-progress rings) — thematically related but NOT a layout match for src/pages/smokecraft/Connections.jsx, which is a single-page consent + action-checklist screen. Used as a loose proof reference only; do not treat side-by-side mismatch as a defect. Superseded mapping (passport-connection-1.png) is still used as the runtime accent-hero source image — unrelated to this reference slot.' },
  { family: 'smokecraft', name: 'request-purchase', route: '/smokecraft/request-purchase', reference: 'request-purchase.png', referenceDir: 'design-references/mvp2/smokecraft', seedSmokeCraftStep: 'request-purchase' },
  { family: 'smokecraft', name: 'humidor-match', route: '/smokecraft/humidor-match', reference: null, seedSmokeCraftStep: 'humidor-match', note: 'Gated by VisitLockGuard (Visit 4, session 9). No reference mockup uploaded. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'first-third', route: '/smokecraft/first-third', reference: null, seedSmokeCraftStep: 'first-third', note: 'Gated by VisitLockGuard (Visit 4, session 12). No reference mockup uploaded. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'second-third', route: '/smokecraft/second-third', reference: null, seedSmokeCraftStep: 'second-third', note: 'Gated by VisitLockGuard (Visit 5, session 13). No reference mockup uploaded. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'scorecard', route: '/smokecraft/scorecard', reference: null, seedSmokeCraftStep: 'scorecard', note: 'Gated by VisitLockGuard (Visit 6, session 16). No reference mockup uploaded. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'passport-stamp', route: '/smokecraft/passport-stamp', reference: 'passport-stamp-reference.png', referenceDir: 'design-references/mvp2/smokecraft', seedSmokeCraftStep: 'passport-stamp', note: '2026-06-27: reference updated to "passport-stamp-reference.png" (copy of public/"360 LUXARY STAMP COLLECT 2.png"), per explicit user mapping request. This is a "Your Stamp Collection" grid mockup (11/24 stamps across 5 categories) — thematically related but NOT a layout match for src/pages/smokecraft/PassportStamp.jsx, which is a single-page "Your Passport Has Been Certified" completion screen. Used as a loose proof reference only; do not treat side-by-side mismatch as a defect. Gated by VisitLockGuard (Visit 8, session 21); proof-only progress still seeded so the real page renders.' },
  { family: 'smokecraft', name: 'session-complete', route: '/smokecraft/session-complete', reference: null, seedSmokeCraftStep: 'session-complete', note: 'Gated by VisitLockGuard (Visit 8, session 24 — final session). No reference mockup uploaded. Proof-only progress seeded so the real page renders.' },

  // 8-visit/24-session journey screens added 2026-06-26. These routes are
  // gated by VisitLockGuard (see App.jsx) based on GuestSessionContext's
  // completedSteps, which this harness has no mechanism to seed (unlike the
  // separate novee_admin_session role-injection used below for POS3/E.A.T.).
  // A cold Playwright navigation will very likely render the LockedVisit.jsx
  // screen instead of real content. No reference mockups exist for these
  // routes — only runtime accent images were uploaded — so reference is null
  // and no side-by-side proof is possible; only a rendered screenshot is captured.
  { family: 'smokecraft', name: 'wrapper-strength', route: '/smokecraft/wrapper-strength', reference: null, seedSmokeCraftStep: 'wrapper-strength', note: 'Gated by VisitLockGuard (Visit 2, session 5). No reference mockup uploaded — runtime accent image only. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'pairing-lab', route: '/smokecraft/pairing-lab', reference: null, seedSmokeCraftStep: 'pairing-lab', note: 'Gated by VisitLockGuard (Visit 3). No reference mockup uploaded — runtime accent image only. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'flavor-memory', route: '/smokecraft/flavor-memory', reference: null, seedSmokeCraftStep: 'flavor-memory', note: 'Gated by VisitLockGuard. No reference mockup uploaded — runtime accent image only. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'smokecraft-challenge', route: '/smokecraft/smokecraft-challenge', reference: null, seedSmokeCraftStep: 'smokecraft-challenge', note: 'Gated by VisitLockGuard. No reference mockup uploaded — runtime accent image only. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'second-humidor-match', route: '/smokecraft/second-humidor-match', reference: null, seedSmokeCraftStep: 'second-humidor-match', note: 'Gated by VisitLockGuard. No reference mockup uploaded — runtime accent image only. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'mini-tasting', route: '/smokecraft/mini-tasting', reference: null, seedSmokeCraftStep: 'mini-tasting', note: 'Gated by VisitLockGuard (Visit 7). No reference mockup uploaded — runtime accent image only. Proof-only progress seeded so the real page renders.' },
  { family: 'smokecraft', name: 'final-review', route: '/smokecraft/final-review', reference: null, seedSmokeCraftStep: 'final-review', note: 'Gated by VisitLockGuard (Visit 8). No reference mockup uploaded — runtime accent image only. Proof-only progress seeded so the real page renders.' },

  // --- Passport ---
  // Reference images exist in public/ but route mapping is NOT confirmed —
  // multiple similarly-named passport mockups exist (360 Passport 1.png,
  // 360 passport  connections 11.png, 360  passport connect  CONECTIONS.png,
  // 360 PASSPORT NETWORK INTERFACE 2.png, 360 PASSPORT CONNECTION 2.png,
  // 360 LUXARY STAMP COLLECT 2.png) and none are wired into src/ yet. Do not
  // guess the mapping (see the golden-box route mistake this protocol
  // exists to prevent) — left as referenceImage: null with a TODO until a
  // human confirms which file maps to which Passport route.
  { family: 'passport', name: 'passport-connections', route: '/passport/connections', reference: null, note: 'Candidate references exist (360 PASSPORT NETWORK INTERFACE 2.png, 360 PASSPORT CONNECTION 2.png, etc.) but mapping is unconfirmed. See registry.' },
  { family: 'passport', name: 'passport-stamps', route: '/passport/stamps', reference: null, note: 'Candidate references exist (DIGETAL STAMP COLLECTION 1.png, 360 LUXARY STAMP COLLECT 2.png) but mapping is unconfirmed. See registry.' },
  { family: 'passport', name: 'passport-profile', route: '/passport/profile', reference: null, note: 'No confirmed reference image.' },
  { family: 'passport', name: 'passport-directory', route: '/passport/directory', reference: null, note: 'No confirmed reference image.' },

  // --- DayOne360 ---
  { family: 'dayone360', name: 'dayone360-concierge', route: '/dayone360', reference: null, note: 'Reference "DAYONE360 CONICERGE 1.png" exists in public/ but is not yet confirmed against this route.' },

  // --- CraftHub ---
  { family: 'crafthub', name: 'crafthub-landing', route: '/crafthub', reference: null, note: 'Reference "CRAFT HUB EXPLAIND.png" exists in public/ but is not yet confirmed against this route.' },
  // "crafthub-landing.png" (uploaded 2026-06-25) does NOT match either
  // /crafthub (CraftHub.jsx) or /system-explained (PublicCraftHubLanding.jsx).
  // It matches the BootConsole.jsx "crafthub" boot stage exactly: logo,
  // title "CRAFTHUB", connectionItems list (SmokeCraft/PourCraft/BeerCraft/
  // WineCraft 360, "Connected"). That stage's backgroundImage is an
  // explicitly-flagged pending asset slot at public/boot/crafthub-360.png
  // (see src/pages/BootConsole.jsx comment above the 'crafthub' stage) —
  // it is not a routed page component, so no proof-harness route capture
  // applies. No SCREENS entry added; left here as a documented finding.

  // --- POS3 (handheld) ---
  // Reference image uploaded 2026-06-25 ("POS 3.11.png"). Route mapping
  // confirmed via src/App.jsx: /pos3/handheld -> POS3Handheld.jsx. Mapping
  // only — no UI fix has been made against this reference yet, so this is
  // NOT visually approved until a proof image is generated and inspected.
  { family: 'pos3', name: 'pos3-handheld', route: '/pos3/handheld', reference: 'POS 3.11.png', referenceDir: 'design-references/mvp2/pos3', viewport: HANDHELD_VIEWPORT, requiresAuth: { role: 'manager' } },
  { family: 'pos3', name: 'pos3-tables', route: '/pos3/tables', reference: null, note: 'No binary reference image in repo.' },
  { family: 'pos3', name: 'pos3-orders', route: '/pos3/orders', reference: null, note: 'No binary reference image in repo.' },
  { family: 'pos3', name: 'pos3-checkout', route: '/pos3/checkout', reference: null, note: 'No binary reference image in repo.' },

  // --- E.A.T. System ---
  // Reference image uploaded 2026-06-25 ("EAT SYSTEM UPDATE 11.png"), the
  // desktop management command center. Route mapping confirmed via
  // src/App.jsx: /eat/command-hub -> EATCommandHub.jsx. Mapping only — no
  // UI fix has been made against this reference yet.
  { family: 'eat', name: 'eat-command-center', route: '/eat/command-hub', reference: 'EAT SYSTEM UPDATE 11.png', referenceDir: 'design-references/mvp2/eat-system', requiresAuth: { role: 'manager' } },
  { family: 'eat', name: 'eat-sections', route: '/eat/sections', reference: null, note: 'No binary reference image in repo.' },
  { family: 'eat', name: 'eat-operations', route: '/eat/operations', reference: null, note: 'No binary reference image in repo.' },
]

function getArg(name, fallback) {
  const prefix = `--${name}=`
  const found = process.argv.find(a => a.startsWith(prefix))
  return found ? found.slice(prefix.length) : fallback
}

function findChromiumExecutable() {
  // Sandboxed dev environments pre-install Chromium under a fixed path
  // (PLAYWRIGHT_BROWSERS_PATH, defaulting to /opt/pw-browsers) and skip the
  // npm postinstall download. CI (GitHub Actions) has no such path — it runs
  // `npx playwright install --with-deps chromium`, which installs into
  // Playwright's own default cache (~/.cache/ms-playwright) under whatever
  // directory/executable layout that Playwright version uses. Only look for
  // the sandbox override; if it's not there, return null so the caller lets
  // Playwright resolve its own installed browser instead of treating "I
  // didn't find this one specific path" as "Chromium isn't installed."
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (!browsersPath || !existsSync(browsersPath)) return null
  const candidates = readdirSync(browsersPath).filter(d => d.startsWith('chromium-') || d === 'chromium')
  for (const dir of candidates) {
    const exe = path.join(browsersPath, dir, 'chrome-linux', 'chrome')
    if (existsSync(exe)) return exe
  }
  return null
}

function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim()
  } catch {
    return 'unknown'
  }
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return true
    } catch {
      // not up yet
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

// Every child_process we spawn (vite preview, vite dev) is tracked here so a
// single cleanup path can guarantee none of them outlive the script. A
// lingering child (e.g. a vite dev server still listening on a port) keeps
// Node's event loop alive even after main() returns, which is what hung the
// GitHub Actions job after "Visual proof artifacts written to docs/visual-proof/"
// had already printed — the proof generation had finished, but the process
// never exited.
const spawnedProcesses = new Set()
function trackProcess(child) {
  spawnedProcesses.add(child)
  child.on('exit', () => spawnedProcesses.delete(child))
  return child
}

function killProcessHard(child) {
  if (!child || child.killed || child.exitCode !== null) return
  try {
    child.kill('SIGTERM')
  } catch {
    // already gone
  }
  setTimeout(() => {
    if (child.exitCode === null && !child.killed) {
      try {
        child.kill('SIGKILL')
      } catch {
        // already gone
      }
    }
  }, 2000)
}

let browserRef = null
let cleanedUp = false
async function cleanup() {
  if (cleanedUp) return
  cleanedUp = true
  try {
    if (browserRef) await browserRef.close()
  } catch {
    // ignore — best-effort shutdown
  }
  for (const child of spawnedProcesses) {
    killProcessHard(child)
  }
  // Give SIGKILL fallbacks a moment to land before the process exits.
  await new Promise(r => setTimeout(r, 2200))
}

process.on('exit', () => {
  for (const child of spawnedProcesses) killProcessHard(child)
})
process.on('SIGINT', async () => {
  await cleanup()
  process.exit(130)
})
process.on('SIGTERM', async () => {
  await cleanup()
  process.exit(143)
})
process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err)
  await cleanup()
  process.exit(1)
})
process.on('unhandledRejection', async (err) => {
  console.error('Unhandled rejection:', err)
  await cleanup()
  process.exit(1)
})

const GLOBAL_TIMEOUT_MS = 10 * 60 * 1000
const ROUTE_TIMEOUT_MS = 30 * 1000

function withTimeout(promise, ms, label) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

async function main() {
  const onlyRoute = getArg('route', null)
  const onlyFamily = getArg('family', null)
  const explicitBaseUrl = getArg('base-url', null)

  let playwright
  try {
    playwright = await import('playwright')
  } catch {
    console.error('I cannot render visual proof in this sandbox. Do not trust visual completion until this script runs in GitHub Actions or another browser-enabled environment.')
    console.error('Reason: the "playwright" package is not installed. Run `npm install --save-dev playwright` first.')
    process.exit(1)
  }

  // executablePath is only set when a sandbox-specific Chromium override is
  // found. Otherwise leave it undefined so chromium.launch() resolves
  // Playwright's own installed browser (e.g. the one `playwright install`
  // just downloaded in CI).
  const executablePath = findChromiumExecutable() || undefined

  mkdirSync(OUT_DIR, { recursive: true })

  let devServerProcess = null
  let baseUrl = explicitBaseUrl

  if (!baseUrl) {
    console.log('Building app...')
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' })

    console.log('Starting preview server...')
    devServerProcess = trackProcess(spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
      cwd: ROOT,
      stdio: 'pipe',
    }))
    baseUrl = 'http://localhost:4173'

    const up = await waitForServer(baseUrl)
    if (!up) {
      console.error('I cannot render visual proof in this sandbox. Do not trust visual completion until this script runs in GitHub Actions or another browser-enabled environment.')
      console.error('Reason: the preview server did not start in time.')
      await cleanup()
      process.exit(1)
    }
  }

  // Screens flagged requiresAuth depend on the dev-only `novee_admin_session`
  // localStorage hook in src/context/SecurityContext.jsx, which is gated by
  // import.meta.env.DEV and stripped out of the production build that the
  // preview server above serves. Those screens need a separate `vite dev`
  // server, started lazily and only if such a screen is actually selected.
  let devModeServerProcess = null
  let devModeBaseUrl = null
  async function ensureDevModeServer() {
    if (devModeBaseUrl) return devModeBaseUrl
    console.log('Starting vite dev server for auth-injected capture...')
    devModeServerProcess = trackProcess(spawn('npx', ['vite', 'dev', '--port', '5183', '--strictPort'], {
      cwd: ROOT,
      stdio: 'pipe',
    }))
    devModeBaseUrl = 'http://localhost:5183'
    const up = await waitForServer(devModeBaseUrl)
    if (!up) {
      console.error('  Could not start vite dev server for authenticated capture.')
      killProcessHard(devModeServerProcess)
      devModeServerProcess = null
      devModeBaseUrl = null
    }
    return devModeBaseUrl
  }

  const globalTimer = setTimeout(async () => {
    console.error(`I cannot render visual proof in this sandbox. Do not trust visual completion until this script runs in GitHub Actions or another browser-enabled environment.`)
    console.error(`Reason: the full run exceeded the ${GLOBAL_TIMEOUT_MS}ms global timeout.`)
    await cleanup()
    process.exit(1)
  }, GLOBAL_TIMEOUT_MS)

  const commitHash = getCommitHash()
  const { chromium } = playwright
  const browser = await chromium.launch({ executablePath })
  browserRef = browser

  let screens = SCREENS
  if (onlyRoute) screens = screens.filter(s => s.route === onlyRoute)
  if (onlyFamily) screens = screens.filter(s => s.family === onlyFamily)

  const results = []

  for (const screen of screens) {
    const viewport = screen.viewport || VIEWPORT

    let screenBaseUrl = baseUrl
    let usingDevModeAuth = false
    if (screen.requiresAuth) {
      const devUrl = await ensureDevModeServer()
      if (devUrl) {
        screenBaseUrl = devUrl
        usingDevModeAuth = true
      } else {
        console.warn(`  Could not start dev server for ${screen.name} — falling back to production preview (will likely show ACCESS RESTRICTED).`)
      }
    }

    const context = await browser.newContext({ viewport })
    if (usingDevModeAuth) {
      // Visual-proof-only auth injection: writes the same dev-only
      // `novee_admin_session` localStorage key that src/context/SecurityContext.jsx
      // already supports for local role prototyping (gated by import.meta.env.DEV).
      // This does not touch ProtectedRoute.jsx or any production auth path —
      // it only works because Vite's dev server has DEV=true.
      await context.addInitScript(({ key, role }) => {
        window.localStorage.setItem(key, JSON.stringify({ role, grantedAt: Date.now(), source: 'visual-proof-harness' }))
      }, { key: 'novee_admin_session', role: screen.requiresAuth.role })
    }
    let seededSession = null
    if (screen.seedSmokeCraftStep) {
      // Visual-proof-only progress seeding: writes the same
      // `novee_guest_session` localStorage key src/services/sessionStorageService.js
      // already reads/writes for real guest progress. VisitLockGuard (the
      // real route guard) is never modified or bypassed in code — it simply
      // sees completedSteps that look like a guest who legitimately finished
      // every earlier session, exactly as it would for a real returning
      // guest. A cold browser outside this harness has no such seeded
      // localStorage and remains locked.
      seededSession = buildSeededGuestSession(screen.seedSmokeCraftStep)
      await context.addInitScript(({ key, value }) => {
        window.localStorage.setItem(key, JSON.stringify(value))
      }, { key: 'novee_guest_session', value: seededSession })
    }
    const page = await context.newPage()
    const url = `${screenBaseUrl}${screen.route}`
    console.log(`Capturing [${screen.family}] ${screen.route} -> ${url}${usingDevModeAuth ? ' (auth-injected dev server)' : ''}${seededSession ? ' (proof-only SmokeCraft progress seeded)' : ''}`)
    try {
      await withTimeout((async () => {
        await page.goto(url, { waitUntil: 'networkidle', timeout: ROUTE_TIMEOUT_MS })
        await page.waitForTimeout(800)
        const screenshotPath = path.join(OUT_DIR, `${screen.name}-rendered.png`)
        await page.screenshot({ path: screenshotPath, fullPage: false })

        const bodyText = await page.evaluate(() => document.body.innerText)
        const accessGated = /ACCESS RESTRICTED/i.test(bodyText)

        const referencePath = screen.reference ? path.join(ROOT, 'public', screen.referenceDir || '', screen.reference) : null
        const referenceExists = Boolean(referencePath && existsSync(referencePath))

        const meta = {
          family: screen.family,
          screen: screen.name,
          route: screen.route,
          referenceImage: screen.reference,
          referenceFound: referenceExists,
          viewport,
          timestamp: new Date().toISOString(),
          commitHash,
        }

        if (usingDevModeAuth) {
          meta.authInjected = { role: screen.requiresAuth.role, mode: 'dev-server novee_admin_session' }
        }

        if (seededSession) {
          const stillLocked = /is locked/i.test(bodyText) && /Return on your next visit/i.test(bodyText)
          meta.smokeCraftProgressSeeded = true
          meta.seededSession = findVisitSession(screen.seedSmokeCraftStep)?.session ?? null
          meta.routeUnlockedForProof = !stillLocked
          if (stillLocked) {
            meta.warning = `Progress was seeded for proof but the route still rendered LockedVisit.jsx. This is a real gating result, not fabricated — do not treat routeUnlockedForProof as true.`
            console.warn(`  WARNING: ${meta.warning}`)
          }
        }

        if (accessGated) {
          meta.accessGated = true
          meta.warning = `The rendered capture shows an "ACCESS RESTRICTED" auth gate (this route requires staff/manager login), not the actual screen. This proof image does NOT show a real visual comparison against the reference — it only proves the route resolves and is access-controlled. Do not treat this as visual approval or visual failure of the actual screen.`
          console.warn(`  WARNING: ${meta.warning}`)
        }

        if (referenceExists) {
          await buildContactSheet({
            chromiumPage: page,
            referencePath,
            renderedPath: screenshotPath,
            outPath: path.join(OUT_DIR, `${screen.name}-proof.png`),
            meta,
          })
        } else {
          meta.note = screen.note || (screen.reference
            ? `Reference image "${screen.reference}" not found in public/. Rendered screenshot saved alone.`
            : 'No reference image registered for this screen — cannot generate a side-by-side proof. This is NOT visual approval.')
          console.warn(`  NO PROOF POSSIBLE — ${meta.note}`)
        }

        writeFileSync(path.join(OUT_DIR, `${screen.name}-proof.json`), JSON.stringify(meta, null, 2))
        results.push(meta)
      })(), ROUTE_TIMEOUT_MS, `Route ${screen.route}`)
    } catch (err) {
      console.error(`  FAILED to capture ${screen.route}: ${err.message}`)
      results.push({ family: screen.family, screen: screen.name, route: screen.route, error: err.message })
    } finally {
      try {
        await page.close()
      } catch {
        // ignore — context.close() below covers it either way
      }
      await context.close()
    }
  }

  clearTimeout(globalTimer)
  await cleanup()

  console.log('\nVisual proof artifacts written to docs/visual-proof/')
  for (const r of results) {
    const status = r.error
      ? `FAILED — ${r.error}`
      : r.accessGated
        ? 'proof generated, but BEHIND AUTH GATE — not a real screen comparison'
        : (r.referenceFound ? 'proof generated' : 'NO PROOF — ' + (r.note || 'no reference image'))
    console.log(`  - [${r.family}] ${r.screen}: ${status}`)
  }
}

function exitNow(code) {
  // Forces a clean exit even if a lingering handle (browser pipe, leftover
  // child process, open socket) would otherwise keep Node's event loop alive.
  process.exitCode = code
  setImmediate(() => process.exit(code))
}

async function buildContactSheet({ chromiumPage, referencePath, renderedPath, outPath, meta }) {
  // Build the side-by-side contact sheet using an isolated HTML page rendered by the same browser,
  // so we don't need an extra image-processing dependency.
  const refExt = path.extname(referencePath).slice(1) || 'png'
  const renderedExt = path.extname(renderedPath).slice(1) || 'png'
  const refUrl = `data:image/${refExt};base64,${readFileSync(referencePath).toString('base64')}`
  const renderedUrl = `data:image/${renderedExt};base64,${readFileSync(renderedPath).toString('base64')}`
  const html = `
    <html><head><style>
      body { margin: 0; background: #111; font-family: monospace; color: #eee; }
      .row { display: flex; }
      .col { flex: 1; padding: 12px; box-sizing: border-box; }
      .col img { width: 100%; display: block; border: 2px solid #444; }
      .label { font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; color: #e9c176; }
      .meta { padding: 10px 12px; font-size: 12px; color: #aaa; border-top: 1px solid #333; }
      .warning { padding: 10px 12px; font-size: 12px; color: #ff6b6b; border-top: 1px solid #333; font-weight: bold; }
    </style></head>
    <body>
      <div class="row">
        <div class="col">
          <div class="label">APPROVED REFERENCE</div>
          <img src="${refUrl}" />
        </div>
        <div class="col">
          <div class="label">ACTUAL RENDERED PAGE</div>
          <img src="${renderedUrl}" />
        </div>
      </div>
      <div class="meta">
        family: ${meta.family} | route: ${meta.route} | viewport: ${meta.viewport.width}x${meta.viewport.height} |
        timestamp: ${meta.timestamp} | commit: ${meta.commitHash}
      </div>
      ${meta.warning ? `<div class="warning">WARNING: ${meta.warning}</div>` : ''}
    </body></html>
  `
  const sheetPage = await chromiumPage.context().newPage()
  await sheetPage.setContent(html, { waitUntil: 'load' })
  await sheetPage.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
    return imgs.length > 0 && imgs.every(img => img.complete && img.naturalWidth > 0)
  }, { timeout: 10000 })
  await sheetPage.waitForTimeout(200)
  await sheetPage.screenshot({ path: outPath, fullPage: true })
  await sheetPage.close()
}

main()
  .then(() => exitNow(0))
  .catch(async err => {
    console.error('I cannot render visual proof in this sandbox. Do not trust visual completion until this script runs in GitHub Actions or another browser-enabled environment.')
    console.error('Reason: unexpected error — ' + err.message)
    await cleanup()
    exitNow(1)
  })
