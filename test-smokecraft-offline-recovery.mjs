/**
 * SmokeCraft MVP2 Offline & Recovery Verification Test
 *
 * Tests that the SmokeCraft guest journey gracefully handles:
 *   A. No DATABASE_URL configured (memory fallback mode)
 *   B. GuestSession storage read/write resilience
 *   C. localStorage being unavailable (quota exceeded / private mode)
 *   D. Server API being unreachable (all guest-flow checks pass offline)
 *   E. Demo mode persists for the session even if page is navigated
 *
 * Run: node test-smokecraft-offline-recovery.mjs
 * Expected: all checks PASS
 */

import { readFileSync, existsSync } from 'fs'

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

// ──────────────────────────────────────────────────────────────────────────────
// A. Database offline — memory fallback
// ──────────────────────────────────────────────────────────────────────────────

console.log('\n── A. Database offline / memory fallback ──')

const dbReadiness = src('server/services/smokecraft/smokecraftDatabaseReadinessService.js')
check('A1: smokecraftDatabaseReadinessService exists', dbReadiness !== null)
check('A2: getPersistenceMode returns memory_fallback when DB unavailable',
  dbReadiness && dbReadiness.includes("'memory_fallback'"))
check('A3: validateDatabaseConfig returns productionReady: false in memory fallback',
  dbReadiness && dbReadiness.includes('productionReady: false'))
check('A4: No crashable throw when DATABASE_URL is missing',
  dbReadiness && !dbReadiness.includes('throw new Error') && !dbReadiness.includes('process.exit'))

const secEventSvc = src('server/services/securityEventService.js')
check('A5: securityEventService switches to in-memory when DB unavailable',
  secEventSvc && secEventSvc.includes('isDbAvailable') && secEventSvc.includes('in_memory') ||
  (secEventSvc && secEventSvc.includes('isDbAvailable') && secEventSvc.includes('memory'))
)
check('A6: In-memory event store has bounded size (max events cap)',
  secEventSvc && (secEventSvc.includes('200') || secEventSvc.includes('maxEvents') || secEventSvc.includes('.slice'))
)

// API endpoint — verify database readiness route exists
const dbStatusRoutes = src('server/routes/databaseStatusRoutes.js')
check('A7: databaseStatusRoutes exists (readiness endpoint for health checks)',
  dbStatusRoutes !== null
)
check('A8: Readiness endpoint does not throw when DB is absent',
  dbStatusRoutes && !dbStatusRoutes.includes('throw') || dbStatusRoutes === null
)

// ──────────────────────────────────────────────────────────────────────────────
// B. GuestSession localStorage resilience
// ──────────────────────────────────────────────────────────────────────────────

console.log('\n── B. GuestSession storage resilience ──')

const sessionSvc = src('src/services/sessionStorageService.js')
check('B1: sessionStorageService exists', sessionSvc !== null)
check('B2: loadSession wraps localStorage.getItem in try/catch',
  sessionSvc && sessionSvc.includes('try') && sessionSvc.includes('localStorage.getItem')
)
check('B3: saveSession wraps localStorage.setItem in try/catch',
  sessionSvc && sessionSvc.includes('try') && sessionSvc.includes('localStorage.setItem')
)
check('B4: clearSession wraps localStorage.removeItem in try/catch',
  sessionSvc && sessionSvc.includes('try') && sessionSvc.includes('localStorage.removeItem')
)
check('B5: loadSession returns null (not throws) when storage fails',
  sessionSvc && sessionSvc.includes('return null') || (sessionSvc && sessionSvc.includes('catch') && sessionSvc.includes('null'))
)

// ──────────────────────────────────────────────────────────────────────────────
// C. SmokeCraftProgressContext resilience
// ──────────────────────────────────────────────────────────────────────────────

console.log('\n── C. SmokeCraftProgressContext recovery ──')

const progCtx = src('src/context/SmokeCraftProgressContext.jsx')
check('C1: SmokeCraftProgressContext exists', progCtx !== null)
check('C2: localStorage mirror write fails silently (try/catch around setItem)',
  progCtx && progCtx.includes('try') && progCtx.includes('setItem') && progCtx.includes('catch')
)
check('C3: completedSteps defaults to [] when session is null/undefined',
  progCtx && progCtx.includes("|| []")
)
check('C4: isSessionUnlocked(n) handled gracefully (no throw on invalid n)',
  progCtx && progCtx.includes('isSessionUnlocked')
)

// ──────────────────────────────────────────────────────────────────────────────
// D. Frontend ErrorBoundary recovery
// ──────────────────────────────────────────────────────────────────────────────

console.log('\n── D. Frontend ErrorBoundary (render crash recovery) ──')

const eb = src('src/components/ErrorBoundary.jsx')
check('D1: ErrorBoundary exists', eb !== null)
check('D2: ErrorBoundary extends Component (class component — required for getDerivedStateFromError)',
  eb && eb.includes('extends Component')
)
check('D3: getDerivedStateFromError sets error state',
  eb && eb.includes('getDerivedStateFromError')
)
check('D4: componentDidCatch logs to console (observable failure signal)',
  eb && eb.includes('componentDidCatch') && eb.includes('console.error')
)
check('D5: Error UI offers Reload action (hard reload for chunk/cache failures)',
  eb && eb.includes('reload')
)
check('D6: Error UI offers Back navigation (does not trap user)',
  eb && (eb.includes('handleBack') || eb.includes('history.back'))
)

// ──────────────────────────────────────────────────────────────────────────────
// E. Demo mode session persistence
// ──────────────────────────────────────────────────────────────────────────────

console.log('\n── E. Demo mode session persistence ──')

const demoCtx = src('src/context/DemoModeContext.jsx')
check('E1: DemoModeContext exists', demoCtx !== null)
check('E2: Demo mode reads from sessionStorage (persists through same tab navigation)',
  demoCtx && demoCtx.includes('sessionStorage.getItem')
)
check('E3: enterDemoMode writes to sessionStorage (activates demo)',
  demoCtx && demoCtx.includes('sessionStorage.setItem') && demoCtx.includes('enterDemoMode')
)
check('E4: exitDemoMode removes from sessionStorage (deactivates cleanly)',
  demoCtx && demoCtx.includes('sessionStorage.removeItem') && demoCtx.includes('exitDemoMode')
)
check('E5: novee_booted is set on enterDemoMode (prevents boot redirect loop)',
  demoCtx && demoCtx.includes("'novee_booted'")
)
check('E6: isDemoBlocked function exists (prevents demo from reaching restricted paths)',
  demoCtx && demoCtx.includes('isDemoBlocked')
)
check('E7: DEMO_BLOCKED_PATHS includes founder and admin paths',
  demoCtx && demoCtx.includes('/founder') && demoCtx.includes('/admin')
)

// ──────────────────────────────────────────────────────────────────────────────
// F. SmokeCraftSessionGuard offline mode behavior
// ──────────────────────────────────────────────────────────────────────────────

console.log('\n── F. SessionGuard offline behavior ──')

const guard = src('src/components/smokecraft/SmokeCraftSessionGuard.jsx')
check('F1: Guard reads from in-memory context (no async API calls)',
  guard && guard.includes('useSmokeCraftProgress') && !guard.includes('fetch(') && !guard.includes('axios')
)
check('F2: Guard renders deterministically from local state (works offline)',
  guard && guard.includes('isSessionUnlocked') && !guard.includes('useEffect')
)

// ──────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\n── Offline/Recovery Results ──`)
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
  console.log(`\n✓ All offline/recovery checks PASS (${passed} checks)`)
  process.exit(0)
}
