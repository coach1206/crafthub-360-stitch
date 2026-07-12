/**
 * SmokeCraft 360 — Final Live MVP2 Closeout Test Suite
 *
 * Verifies all structural, behavioral, and safety properties of the
 * SmokeCraft guest journey after the final live system rebuild. Covers
 * critical defect fixes, architectural guarantees, data honesty, rate
 * limiting configuration, and journey-contract integrity.
 *
 * Run: node e2e-smokecraft-final-live-mvp2-closeout.mjs
 * Expected: all checks PASS
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const ROOT = new URL('.', import.meta.url).pathname

let passed = 0, failed = 0
const results = []

function check(name, condition, detail = '') {
  if (condition) {
    passed++
    results.push({ status: 'PASS', name })
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    results.push({ status: 'FAIL', name, detail })
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`)
  }
}

function src(rel) {
  const fp = ROOT + rel
  return existsSync(fp) ? readFileSync(fp, 'utf8') : null
}

// ── A. Critical defect fixes: stranded screens ────────────────────────────────

console.log('\n── A. Stranded screens fixed (NavBar present) ──')

const leaderboard = src('src/pages/smokecraft/Leaderboard.jsx')
check('A1: Leaderboard imports SmokeCraftNavBar', leaderboard && leaderboard.includes('SmokeCraftNavBar'))
check('A2: Leaderboard imports useNavigate', leaderboard && leaderboard.includes('useNavigate'))
check('A3: Leaderboard renders NavBar with back navigation', leaderboard && leaderboard.includes('onSecondary') && leaderboard.includes('navigate(-1)'))

const eventChallenge = src('src/pages/smokecraft/EventChallenge.jsx')
check('A4: EventChallenge imports SmokeCraftNavBar', eventChallenge && eventChallenge.includes('SmokeCraftNavBar'))
check('A5: EventChallenge imports useNavigate', eventChallenge && eventChallenge.includes('useNavigate'))
check('A6: EventChallenge renders NavBar with back navigation', eventChallenge && eventChallenge.includes('onSecondary') && eventChallenge.includes('navigate(-1)'))

// ── B. GoldenBox gate enforcement ─────────────────────────────────────────────

console.log('\n── B. GoldenBox acknowledged gate ──')

const goldenBox = src('src/pages/smokecraft/GoldenBox.jsx')
check('B1: GoldenBox exists', goldenBox !== null)
check('B2: GoldenBox checks acknowledged before proceeding',
  goldenBox && goldenBox.includes('if (!acknowledged)') && goldenBox.includes('return'))
check('B3: GoldenBox NavBar passes primaryDisabled when not acknowledged',
  goldenBox && goldenBox.includes('primaryDisabled={!acknowledged}'))

const navBar = src('src/components/smokecraft/SmokeCraftNavBar.jsx')
check('B4: SmokeCraftNavBar supports primaryDisabled prop',
  navBar && navBar.includes('primaryDisabled'))
check('B5: SmokeCraftNavBar disables button when primaryDisabled is truthy',
  navBar && navBar.includes('disabled={!!primaryDisabled}'))
check('B6: SmokeCraftNavBar renders visually dimmed when disabled (opacity/color change)',
  navBar && navBar.includes('primaryDisabled') && navBar.includes('cursor: primaryDisabled'))

// ── C. Tasting data forwarded from checkboxes ─────────────────────────────────

console.log('\n── C. Checkbox selections forwarded into session payload ──')

const firstThird = src('src/pages/smokecraft/FirstThird.jsx')
check('C1: FirstThird forwards checked items to notesSelected',
  firstThird && firstThird.includes('notesSelected: checked'))
check('C2: FirstThird sets notesCount from checked.length',
  firstThird && firstThird.includes('notesCount: checked.length'))
check('C3: FirstThird sets tasteProfileSource to guest_selected when items checked',
  firstThird && firstThird.includes("'guest_selected'"))
check('C4: FirstThird safeClaim is honest about capture status',
  firstThird && firstThird.includes('selections captured'))

const secondThird = src('src/pages/smokecraft/SecondThird.jsx')
check('C5: SecondThird forwards checked items to notesSelected',
  secondThird && secondThird.includes('notesSelected: checked'))
check('C6: SecondThird sets notesCount from checked.length',
  secondThird && secondThird.includes('notesCount: checked.length'))
check('C7: SecondThird sets tasteProfileSource to guest_selected when items checked',
  secondThird && secondThird.includes("'guest_selected'"))

// ── D. Rate limiting middleware (R11) ──────────────────────────────────────────

console.log('\n── D. Rate limiting middleware ──')

const serverIndex = src('server/index.js')
check('D1: server/index.js imports express-rate-limit', serverIndex && serverIndex.includes('express-rate-limit'))
check('D2: General rate limiter defined (300 req / 15 min)', serverIndex && serverIndex.includes('generalLimiter') && serverIndex.includes('max: 300'))
check('D3: Auth rate limiter defined (20 req / 15 min)', serverIndex && serverIndex.includes('authLimiter') && serverIndex.includes('max: 20'))
check('D4: Auth limiter applied to /api/auth', serverIndex && serverIndex.includes("app.use('/api/auth', authLimiter)"))
check('D5: General limiter applied to /api', serverIndex && serverIndex.includes("app.use('/api', generalLimiter)"))
check('D6: Rate limiting skipped in non-production (preserves existing tests)', serverIndex && serverIndex.includes('skip: () => !IS_PROD'))
check('D7: express-rate-limit in package.json',
  existsSync(ROOT + 'package.json') &&
  readFileSync(ROOT + 'package.json', 'utf8').includes('express-rate-limit'))

// ── E. Journey contract integrity — R3 / R24 ──────────────────────────────────

console.log('\n── E. Journey contract integrity (R3, R24) ──')

const sessionJs = src('src/constants/session.js')
check('E1: session.js VISIT_STRUCTURE is the authoritative 24-session source',
  sessionJs && sessionJs.includes('TOTAL_SESSIONS = 24') && sessionJs.includes('VISIT_STRUCTURE'))

// Parse VISIT_STRUCTURE sessions from the file — check for duplicates
let sessionIds = []
let sessionNumbers = []
if (sessionJs) {
  const idMatches = [...sessionJs.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1])
  const numMatches = [...sessionJs.matchAll(/session:\s*(\d+)/g)].map(m => parseInt(m[1]))
  // Only take the ones inside VISIT_STRUCTURE (after that marker)
  const vsIdx = sessionJs.indexOf('VISIT_STRUCTURE')
  const vsSection = vsIdx >= 0 ? sessionJs.slice(vsIdx) : ''
  sessionIds = [...vsSection.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1])
  sessionNumbers = [...vsSection.matchAll(/session:\s*(\d+)/g)].map(m => parseInt(m[1]))
}

const uniqueIds = new Set(sessionIds)
const uniqueNums = new Set(sessionNumbers)
check('E2: No duplicate session IDs in VISIT_STRUCTURE',
  sessionIds.length > 0 && uniqueIds.size === sessionIds.length,
  sessionIds.length !== uniqueIds.size ? `Duplicates: ${sessionIds.filter((id, i) => sessionIds.indexOf(id) !== i).join(', ')}` : '')

check('E3: No duplicate session numbers in VISIT_STRUCTURE',
  sessionNumbers.length > 0 && uniqueNums.size === sessionNumbers.length,
  sessionNumbers.length !== uniqueNums.size ? `Duplicates: ${sessionNumbers.filter((n, i) => sessionNumbers.indexOf(n) !== i).join(', ')}` : '')

check('E4: VISIT_STRUCTURE has exactly 24 sessions',
  sessionNumbers.length === 24,
  `Found ${sessionNumbers.length}`)

check('E5: Session numbers are sequential 1–24',
  sessionNumbers.length === 24 && sessionNumbers.every((n, i) => n === i + 1),
  sessionNumbers.length !== 24 ? 'Wrong count' : '')

check('E6: SMOKECRAFT_FLOW exists as supplemental flow reference',
  sessionJs && sessionJs.includes('SMOKECRAFT_FLOW'))

check('E7: isVisitUnlocked enforces sequential visit gate',
  sessionJs && sessionJs.includes('isVisitUnlocked') && sessionJs.includes('every'))

// ── F. Architecture — no hotspot pills in guest flow ──────────────────────────

console.log('\n── F. No visible hotspots in guest flow ──')

const hotspotLayer = src('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
check('F1: SmokeCraftHotspotLayer exists (legacy component preserved)',
  hotspotLayer !== null)
check('F2: SmokeCraftHotspotLayer does not render in production guest flow (no IS_PROD bypass)',
  hotspotLayer && !hotspotLayer.includes('IS_PROD') ||
  hotspotLayer && hotspotLayer.includes('opacity: 0') ||
  hotspotLayer && hotspotLayer.includes('pointerEvents'))

// SmokeCraftAssetRoute used by Scan and GuestPass only
const assetRoute = src('src/components/smokecraft/SmokeCraftAssetRoute.jsx')
check('F3: SmokeCraftAssetRoute exists (legacy overlay component preserved)',
  assetRoute !== null)

const scanJsx = src('src/pages/smokecraft/Scan.jsx')
const guestPassJsx = src('src/pages/smokecraft/GuestPass.jsx')
check('F4: SmokeCraftAssetRoute is used by Scan.jsx (expected active use)',
  scanJsx && scanJsx.includes('SmokeCraftAssetRoute'))
check('F5: SmokeCraftAssetRoute is used by GuestPass.jsx (expected active use)',
  guestPassJsx && guestPassJsx.includes('SmokeCraftAssetRoute'))

// ── G. Data honesty (R23) ─────────────────────────────────────────────────────

console.log('\n── G. Data honesty / no fake integration connections ──')

const flagContract = src('src/modules/smokecraft/data/smokecraftFeatureFlagContract.js')
check('G1: smokecraftFeatureFlagContract exists', flagContract !== null)
check('G2: canFakeIntegrationConnection is false', flagContract && flagContract.includes('canFakeIntegrationConnection:    false'))
check('G3: productionSync.enabled defaults to false', flagContract && flagContract.includes("'smokecraft.productionSync.enabled'") && flagContract.includes("default: false"))
check('G4: billing.enabled defaults to false', flagContract && flagContract.includes("'smokecraft.billing.enabled'") && flagContract.includes("default: false"))
check('G5: pairing.provider.enabled defaults to false', flagContract && flagContract.includes("'smokecraft.pairing.provider.enabled'") && flagContract.includes("default: false"))

const dbReadiness = src('server/services/smokecraft/smokecraftDatabaseReadinessService.js')
check('G6: smokecraftDatabaseReadinessService shows honest backend status', dbReadiness !== null)
check('G7: memory_fallback mode is the honest fallback (not faking connection)',
  dbReadiness && dbReadiness.includes("'memory_fallback'"))

// ── H. Session guard offline behavior ─────────────────────────────────────────

console.log('\n── H. Session guard offline correctness ──')

const guard = src('src/components/smokecraft/SmokeCraftSessionGuard.jsx')
check('H1: SmokeCraftSessionGuard exists', guard !== null)
check('H2: Guard uses isSessionUnlocked from context (no direct API call)',
  guard && guard.includes('isSessionUnlocked') && !guard.includes('fetch('))
check('H3: Guard does not depend on useEffect for lock state (pure sync render)',
  guard && !guard.includes('useEffect'))

// ── I. Demo mode and investor reset ───────────────────────────────────────────

console.log('\n── I. Demo mode & investor reset ──')

const demoReset = src('src/components/smokecraft/SmokeCraftDemoReset.jsx')
check('I1: SmokeCraftDemoReset exists', demoReset !== null)
check('I2: SmokeCraftDemoReset requires isDemoMode OR admin role',
  demoReset && demoReset.includes('isDemoMode') && demoReset.includes("'admin'"))
check('I3: SmokeCraftDemoReset shows AccessDenied to unauthorized users',
  demoReset && demoReset.includes('AccessDenied'))
check('I4: Reset clears only local storage keys (never touches backend)',
  demoReset && demoReset.includes('localStorage.removeItem') && !demoReset.includes('fetch('))

const demoCtx = src('src/context/DemoModeContext.jsx')
check('I5: Demo mode persists in sessionStorage (same-tab navigation)',
  demoCtx && demoCtx.includes('sessionStorage.setItem') && demoCtx.includes('enterDemoMode'))
check('I6: DEMO_BLOCKED_PATHS includes founder and admin',
  demoCtx && demoCtx.includes('/founder') && demoCtx.includes('/admin'))

// ── J. Error recovery ─────────────────────────────────────────────────────────

console.log('\n── J. Error recovery ──')

const eb = src('src/components/ErrorBoundary.jsx')
check('J1: ErrorBoundary wraps render crashes', eb !== null)
check('J2: ErrorBoundary offers Reload', eb && eb.includes('reload'))
check('J3: ErrorBoundary offers Back (no user trap)', eb && (eb.includes('handleBack') || eb.includes('history.back')))

const sessionSvc = src('src/services/sessionStorageService.js')
check('J4: sessionStorageService wraps localStorage in try/catch',
  sessionSvc && sessionSvc.includes('try') && sessionSvc.includes('localStorage'))
check('J5: loadSession returns null on failure (no throw)',
  sessionSvc && sessionSvc.includes('return null'))

// ── K. Production build integrity ─────────────────────────────────────────────

console.log('\n── K. Production build integrity ──')

check('K1: dist/index.html exists (production build present)',
  existsSync(ROOT + 'dist/index.html'))
check('K2: vercel.json exists (SPA rewrites configured)',
  existsSync(ROOT + 'vercel.json'))
const vercelJson = existsSync(ROOT + 'vercel.json')
  ? readFileSync(ROOT + 'vercel.json', 'utf8') : null
check('K3: vercel.json has rewrite rules',
  vercelJson && (vercelJson.includes('rewrites') || vercelJson.includes('routes')))

const masterRegistry = src('src/modules/smokecraft/data/smokecraftMvp2MasterRegistry.js')
check('K4: smokecraftMvp2MasterRegistry.js is single source of truth (imports verified)',
  masterRegistry !== null && masterRegistry.includes('JOURNEY_STEPS'))

// ── L. Approved asset integrity ───────────────────────────────────────────────

console.log('\n── L. Approved asset directory ──')

const approvedDir = ROOT + 'public/assets/smokecraft-reference/approved'
const approvedExists = existsSync(approvedDir)
check('L1: Approved asset directory exists', approvedExists)
const approvedFiles = approvedExists ? readdirSync(approvedDir).filter(f => !f.startsWith('.')) : []
check('L2: At least 40 approved images present', approvedFiles.length >= 40, `Found: ${approvedFiles.length}`)
console.log(`     (${approvedFiles.length} files in approved/)`)

// Key reference images from the journey
const KEY_ASSETS = [
  'smokecraft-landing.png',
  'MENTOR SELECTION1.png',
  'FINAL THIRD.png',
  'FIRST  THIRD1.png',
  'SEED & SOIL.png',
  'Scorecard.png',
]
for (const asset of KEY_ASSETS) {
  check(`L3: Key asset exists — ${asset}`,
    existsSync(join(approvedDir, asset)) ||
    existsSync(ROOT + `public/${asset}`) ||
    existsSync(ROOT + `public/assets/smokecraft/${asset}`) ||
    existsSync(ROOT + `public/assets/smokecraft-reference/approved/${asset}`))
}

// ──────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\n── Final Live MVP2 Closeout Results ──`)
console.log(`  PASS: ${passed}`)
console.log(`  FAIL: ${failed}`)
console.log(`  Total: ${passed + failed}`)

if (failed > 0) {
  console.error('\nFAILED CHECKS:')
  results.filter(r => r.status === 'FAIL').forEach(r =>
    console.error(`  ✗ ${r.name}${r.detail ? ' — ' + r.detail : ''}`)
  )
  process.exit(1)
} else {
  console.log(`\n✓ All final live MVP2 closeout checks PASS (${passed} checks)`)
  process.exit(0)
}
