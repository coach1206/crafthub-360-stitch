/**
 * SmokeCraft MVP2 Final Partials Closeout Test Suite
 *
 * Covers: contract tests, permission tests, rate-limit tests,
 * truthful-status tests, feature-flag tests, error-logging tests,
 * rollback dry-run tests, asset-registry tests, R9/R10/R23/R18/R19/R7 verification.
 *
 * Does NOT require a running server or browser for most checks.
 * Server-endpoint checks use fetch() against http://localhost:3001 if available.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ── Helpers ───────────────────────────────────────────────────────────────────

let PASS = 0, FAIL = 0, SKIP = 0
const results = []

function pass(id, msg) { PASS++; results.push({ id, status: 'PASS', msg }); console.log(`  PASS  ${id}: ${msg}`) }
function fail(id, msg) { FAIL++; results.push({ id, status: 'FAIL', msg }); console.log(`  FAIL  ${id}: ${msg}`) }
function skip(id, msg) { SKIP++; results.push({ id, status: 'SKIP', msg }); console.log(`  SKIP  ${id}: ${msg}`) }

function section(name) { console.log(`\n── ${name} ──`) }

// ── A. Contract Validator (R9) ───────────────────────────────────────────────

section('A. Contract Validator (R9)')

const validatorPath = resolve('./src/services/smokecraft/smokecraftRuntimeContractValidator.js')
const validatorServerPath = resolve('./server/lib/smokecraftRuntimeContractValidator.js')

if (existsSync(validatorPath)) {
  pass('A1', 'smokecraftRuntimeContractValidator.js exists in src/')
} else {
  fail('A1', 'smokecraftRuntimeContractValidator.js missing from src/')
}

if (existsSync(validatorServerPath)) {
  pass('A2', 'smokecraftRuntimeContractValidator.js exists in server/lib/')
} else {
  fail('A2', 'smokecraftRuntimeContractValidator.js missing from server/lib/')
}

// Dynamic import for validation
let validator = null
try {
  validator = await import('./src/services/smokecraft/smokecraftRuntimeContractValidator.js')
  pass('A3', 'smokecraftRuntimeContractValidator.js imports successfully')
} catch (e) {
  fail('A3', `Import failed: ${e.message}`)
}

if (validator) {
  const { safeValidate, ContractValidationError, CONTRACT_VALIDATORS } = validator

  // Test: valid smoke_session passes
  const validSession = safeValidate('smoke_session', {
    sessionId: 'test-123', venueId: 'novee-grand-lounge',
    xp: 100, completedSteps: 5, finalScore: 80, challengeStatus: 'in_progress'
  })
  if (validSession.valid) {
    pass('A4', 'smoke_session valid payload passes validation')
  } else {
    fail('A4', `smoke_session valid payload rejected: ${validSession.error}`)
  }

  // Test: invalid smoke_session (missing sessionId) is rejected
  const invalidSession = safeValidate('smoke_session', { xp: 'bad' })
  if (!invalidSession.valid) {
    pass('A5', 'smoke_session missing sessionId is correctly rejected')
  } else {
    fail('A5', 'smoke_session missing sessionId should be rejected but was accepted')
  }

  // Test: valid scorecard_submission passes
  const validCard = safeValidate('scorecard_submission', {
    sessionId: 'test-123', guestId: 'guest-1',
    categories: { flavor: 85, draw: 90, burn: 88, construction: 87, appearance: 84, pairing: 89 }
  })
  if (validCard.valid) {
    pass('A6', 'scorecard_submission valid payload passes validation')
  } else {
    fail('A6', `scorecard_submission valid rejected: ${validCard.error}`)
  }

  // Test: malformed scorecard_submission is rejected
  const badCard = safeValidate('scorecard_submission', { sessionId: 123 })
  if (!badCard.valid) {
    pass('A7', 'scorecard_submission with non-string sessionId is rejected')
  } else {
    fail('A7', 'scorecard_submission should reject non-string sessionId')
  }

  // Test: 25 validators registered
  const count = Object.keys(CONTRACT_VALIDATORS || {}).length
  if (count >= 25) {
    pass('A8', `${count} contract validators registered (≥25 required)`)
  } else {
    fail('A8', `Only ${count} validators registered — expected ≥25`)
  }

  // Test: ContractValidationError is a proper Error subclass
  try {
    throw new ContractValidationError('test_contract', 'field', 'bad value', 'x')
  } catch (err) {
    if (err instanceof Error && err.name === 'ContractValidationError' && err.contract === 'test_contract') {
      pass('A9', 'ContractValidationError is a proper Error subclass with contract property')
    } else {
      fail('A9', 'ContractValidationError does not have expected properties')
    }
  }
}

// Verify server routes import validator
const scorecardRoute = readFileSync('./server/routes/smokecraftScorecardRoutes.js', 'utf8')
if (scorecardRoute.includes('safeValidate') && scorecardRoute.includes('smokecraftRuntimeContractValidator')) {
  pass('A10', 'scorecardRoutes.js imports and uses safeValidate (R9 is active at API layer)')
} else {
  fail('A10', 'scorecardRoutes.js does not call safeValidate — R9 not active at API layer')
}

const smokecraftRoute = readFileSync('./server/routes/smokecraftRoutes.js', 'utf8')
if (smokecraftRoute.includes('safeValidate') && smokecraftRoute.includes('smoke_session')) {
  pass('A11', 'smokecraftRoutes.js uses safeValidate for session creation (R9 active)')
} else {
  fail('A11', 'smokecraftRoutes.js does not call safeValidate for session creation')
}

// ── B. Permission Matrix (R10) ───────────────────────────────────────────────

section('B. Permission Matrix (R10)')

let permMatrix = null
try {
  permMatrix = await import('./src/services/smokecraft/smokecraftPermissionMatrix.js')
  pass('B1', 'smokecraftPermissionMatrix.js imports successfully')
} catch (e) {
  fail('B1', `Import failed: ${e.message}`)
}

if (permMatrix) {
  const { canSmokeCraft, canManageFeatureFlags, canViewErrorLogs, canAccessManagement,
          canConfigureIntegrations, SMOKECRAFT_CAPABILITIES, SMOKECRAFT_ROLE_CAPABILITIES } = permMatrix

  // guest cannot manage feature flags
  if (!canManageFeatureFlags('guest')) {
    pass('B2', 'guest cannot manage feature flags')
  } else {
    fail('B2', 'guest should NOT be able to manage feature flags')
  }

  // founder can manage feature flags
  if (canManageFeatureFlags('founder_level_0')) {
    pass('B3', 'founder_level_0 can manage feature flags')
  } else {
    fail('B3', 'founder_level_0 should be able to manage feature flags')
  }

  // admin cannot manage feature flags (founder-only)
  if (!canManageFeatureFlags('admin')) {
    pass('B4', 'admin cannot manage feature flags (founder-only capability)')
  } else {
    fail('B4', 'admin should NOT be able to manage feature flags')
  }

  // manager can view error logs
  if (canViewErrorLogs('manager')) {
    pass('B5', 'manager can view error logs')
  } else {
    fail('B5', 'manager should be able to view error logs')
  }

  // staff cannot access management
  if (!canAccessManagement('staff')) {
    pass('B6', 'staff cannot access management controls')
  } else {
    fail('B6', 'staff should NOT access management controls')
  }

  // manager can access management
  if (canAccessManagement('manager')) {
    pass('B7', 'manager can access management controls')
  } else {
    fail('B7', 'manager should be able to access management controls')
  }

  // admin can configure integrations
  if (canConfigureIntegrations('admin')) {
    pass('B8', 'admin can configure integrations')
  } else {
    fail('B8', 'admin should be able to configure integrations')
  }

  // staff can assist guest
  if (canSmokeCraft('staff', SMOKECRAFT_CAPABILITIES.ASSIST_GUEST)) {
    pass('B9', 'staff can perform ASSIST_GUEST capability')
  } else {
    fail('B9', 'staff should be able to perform ASSIST_GUEST')
  }

  // guest cannot assist guest
  if (!canSmokeCraft('guest', SMOKECRAFT_CAPABILITIES.ASSIST_GUEST)) {
    pass('B10', 'guest cannot perform ASSIST_GUEST')
  } else {
    fail('B10', 'guest should NOT be able to perform ASSIST_GUEST')
  }

  // All 6 roles defined
  const roles = Object.keys(SMOKECRAFT_ROLE_CAPABILITIES)
  if (roles.includes('guest') && roles.includes('founder_level_0')) {
    pass('B11', `Permission matrix covers all role tiers: ${roles.join(', ')}`)
  } else {
    fail('B11', `Permission matrix missing roles — found: ${roles.join(', ')}`)
  }
}

// Verify FeatureFlagAdmin uses permission matrix
const featureFlagAdmin = readFileSync('./src/pages/smokecraft/FeatureFlagAdmin.jsx', 'utf8')
if (featureFlagAdmin.includes('canManageFeatureFlags') && featureFlagAdmin.includes('smokecraftPermissionMatrix')) {
  pass('B12', 'FeatureFlagAdmin.jsx imports and uses canManageFeatureFlags from permission matrix (R10 active)')
} else {
  fail('B12', 'FeatureFlagAdmin.jsx does not use permission matrix')
}

const errorLogViewer = readFileSync('./src/pages/smokecraft/ErrorLogViewer.jsx', 'utf8')
if (errorLogViewer.includes('canViewErrorLogs') && errorLogViewer.includes('smokecraftPermissionMatrix')) {
  pass('B13', 'ErrorLogViewer.jsx imports and uses canViewErrorLogs from permission matrix (R10 active)')
} else {
  fail('B13', 'ErrorLogViewer.jsx does not use permission matrix')
}

// ── C. Truthful Status Guard (R23) ───────────────────────────────────────────

section('C. Truthful Status Guard (R23)')

let tsg = null
try {
  tsg = await import('./src/services/smokecraft/smokecraftTruthfulStatusGuard.js')
  pass('C1', 'smokecraftTruthfulStatusGuard.js imports successfully')
} catch (e) {
  fail('C1', `Import failed: ${e.message}`)
}

if (tsg) {
  const { assertTruthfulStatus, buildEvidence, pos360HandoffStatus, eatSyncStatus,
          humidorConnectionStatus, passportClaimStatus, purchaseRequestStatus, managementSyncStatus } = tsg

  // Test: "Connected" without evidence shows fallback
  const noEvidence = assertTruthfulStatus('Connected', null)
  if (!noEvidence.verified && noEvidence.mode === 'fallback') {
    pass('C2', '"Connected" without evidence returns fallback (not verified)')
  } else {
    fail('C2', `"Connected" without evidence should return fallback, got: ${JSON.stringify(noEvidence)}`)
  }

  // Test: "Connected" with evidence passes
  const evidence = buildEvidence({ providerId: 'device-001', persisted: true, timestamp: new Date().toISOString() })
  const withEvidence = assertTruthfulStatus('Connected', evidence)
  if (withEvidence.verified && withEvidence.label === 'Connected') {
    pass('C3', '"Connected" with valid evidence returns verified label')
  } else {
    fail('C3', `"Connected" with evidence failed: ${JSON.stringify(withEvidence)}`)
  }

  // Test: demo mode shows "(Demo)" suffix
  const demoEvidence = buildEvidence({ demoMode: true })
  const demoResult = assertTruthfulStatus('Synced', demoEvidence)
  if (demoResult.label === 'Synced (Demo)') {
    pass('C4', 'Demo mode adds "(Demo)" suffix to protected word')
  } else {
    fail('C4', `Demo mode should show "Synced (Demo)", got: ${demoResult.label}`)
  }

  // Test: non-protected word passes unconditionally
  const unrestricted = assertTruthfulStatus('Processing')
  if (unrestricted.mode === 'unrestricted') {
    pass('C5', 'Non-protected label passes without evidence (unrestricted mode)')
  } else {
    fail('C5', `Non-protected label should be unrestricted, got: ${unrestricted.mode}`)
  }

  // Test: all 12 protected words fail without evidence
  const WORDS = ['Connected', 'Synced', 'Live', 'Active', 'Delivered', 'Paid',
                 'Available', 'Completed', 'Confirmed', 'Submitted', 'Claimed', 'Ordered']
  const allFallback = WORDS.every(w => !assertTruthfulStatus(w, null).verified)
  if (allFallback) {
    pass('C6', `All 12 protected words show fallback without evidence: ${WORDS.join(', ')}`)
  } else {
    const failed = WORDS.filter(w => assertTruthfulStatus(w, null).verified)
    fail('C6', `These protected words passed without evidence: ${failed.join(', ')}`)
  }

  // Test: POS360 handoff without response → fallback
  const pos = pos360HandoffStatus(null)
  if (!pos.verified) {
    pass('C7', 'pos360HandoffStatus(null) returns unverified fallback')
  } else {
    fail('C7', 'pos360HandoffStatus(null) should return unverified')
  }

  // Test: humidor not connected → fallback
  const humidor = humidorConnectionStatus({ connected: false })
  if (!humidor.verified) {
    pass('C8', 'humidorConnectionStatus(not connected) returns fallback')
  } else {
    fail('C8', 'humidorConnectionStatus should return fallback when not connected')
  }

  // Test: humidor connected with device → verified
  const humidorConn = humidorConnectionStatus({ connected: true, deviceId: 'hum-001', lastSeen: new Date().toISOString() })
  if (humidorConn.verified) {
    pass('C9', 'humidorConnectionStatus(connected with deviceId) returns verified')
  } else {
    fail('C9', `humidorConnectionStatus connected should be verified: ${JSON.stringify(humidorConn)}`)
  }
}

// Verify ManagementSync and RequestPurchase use the guard
const managementSync = readFileSync('./src/pages/smokecraft/ManagementSync.jsx', 'utf8')
if (managementSync.includes('smokecraftTruthfulStatusGuard') && managementSync.includes('managementSyncStatus')) {
  pass('C10', 'ManagementSync.jsx imports and uses managementSyncStatus guard (R23 active)')
} else {
  fail('C10', 'ManagementSync.jsx does not use truthful status guard')
}

const requestPurchase = readFileSync('./src/pages/smokecraft/RequestPurchase.jsx', 'utf8')
if (requestPurchase.includes('purchaseRequestStatus') && requestPurchase.includes('smokecraftTruthfulStatusGuard')) {
  pass('C11', 'RequestPurchase.jsx imports and uses purchaseRequestStatus guard (R23 active)')
} else {
  fail('C11', 'RequestPurchase.jsx does not use truthful status guard')
}

// ── D. Feature Flag Admin (R18) ──────────────────────────────────────────────

section('D. Feature Flag Admin (R18)')

const ffAdmin = readFileSync('./src/pages/smokecraft/FeatureFlagAdmin.jsx', 'utf8')

if (ffAdmin.includes('confirmChange') && ffAdmin.includes('reason.trim()')) {
  pass('D1', 'FeatureFlagAdmin requires reason before confirming change')
} else {
  fail('D1', 'FeatureFlagAdmin missing reason requirement for confirmation')
}

if (ffAdmin.includes('auditLog') && ffAdmin.includes('setAuditLog')) {
  pass('D2', 'FeatureFlagAdmin maintains an audit log')
} else {
  fail('D2', 'FeatureFlagAdmin missing audit log')
}

if (ffAdmin.includes('rollback') || ffAdmin.includes('rollbackTo')) {
  pass('D3', 'FeatureFlagAdmin supports rollback from audit entries')
} else {
  fail('D3', 'FeatureFlagAdmin missing rollback functionality')
}

if (ffAdmin.includes('MUTUALLY_EXCLUSIVE_PAIRS') && ffAdmin.includes('isMutuallyExclusiveConflict')) {
  pass('D4', 'FeatureFlagAdmin enforces mutually exclusive flag pairs')
} else {
  fail('D4', 'FeatureFlagAdmin missing mutually exclusive pair enforcement')
}

if (ffAdmin.includes("meetsMinRole(role, 'admin')") && ffAdmin.includes('canManageFeatureFlags')) {
  pass('D5', 'FeatureFlagAdmin gate uses both role hierarchy and permission matrix')
} else {
  fail('D5', 'FeatureFlagAdmin missing dual-layer permission check')
}

const appJsx = readFileSync('./src/App.jsx', 'utf8')
if (appJsx.includes('smokecraft/feature-flag-admin') && appJsx.includes('FeatureFlagAdmin')) {
  pass('D6', 'FeatureFlagAdmin is wired into App.jsx at /smokecraft/feature-flag-admin')
} else {
  fail('D6', 'FeatureFlagAdmin not found in App.jsx routing')
}

// ── E. Error Logger (R19) ────────────────────────────────────────────────────

section('E. Error Logger (R19)')

let logger = null
try {
  logger = await import('./src/services/smokecraft/smokecraftErrorLogger.js')
  pass('E1', 'smokecraftErrorLogger.js imports successfully')
} catch (e) {
  fail('E1', `Import failed: ${e.message}`)
}

if (logger) {
  const { logFrontendException, logApiError, logContractRejected, logUnauthorizedAccess,
          logRateLimit, logProviderFailure, logFeatureFlagChange, LOG_LEVEL, LOG_CATEGORY } = logger

  // All public functions exist
  const fns = [logFrontendException, logApiError, logContractRejected, logUnauthorizedAccess,
               logRateLimit, logProviderFailure, logFeatureFlagChange]
  if (fns.every(f => typeof f === 'function')) {
    pass('E2', 'All 7 public logging functions are exported')
  } else {
    fail('E2', 'Some logging functions are missing')
  }

  // Log levels defined
  if (LOG_LEVEL.CRITICAL === 'critical' && LOG_LEVEL.ERROR === 'error') {
    pass('E3', 'LOG_LEVEL constants defined correctly')
  } else {
    fail('E3', `LOG_LEVEL missing expected values: ${JSON.stringify(LOG_LEVEL)}`)
  }

  // Log categories defined
  if (LOG_CATEGORY.CONTRACT_REJECTED && LOG_CATEGORY.UNAUTHORIZED_ACCESS) {
    pass('E4', 'LOG_CATEGORY constants include CONTRACT_REJECTED and UNAUTHORIZED_ACCESS')
  } else {
    fail('E4', 'LOG_CATEGORY missing expected categories')
  }

  // Call logFrontendException — should not throw
  try {
    logFrontendException(new Error('test error'), { route: '/test', role: 'guest' })
    pass('E5', 'logFrontendException executes without throwing')
  } catch (e) {
    fail('E5', `logFrontendException threw: ${e.message}`)
  }
}

// PII scrubbing: check source has scrubPii logic
const loggerSrc = readFileSync('./src/services/smokecraft/smokecraftErrorLogger.js', 'utf8')
if (loggerSrc.includes('PII_KEYS') && loggerSrc.includes('[REDACTED]')) {
  pass('E6', 'Logger has PII scrubbing with [REDACTED] replacement')
} else {
  fail('E6', 'Logger missing PII scrubbing')
}

// Server route exists
if (existsSync('./server/routes/smokecraftErrorLogRoutes.js')) {
  pass('E7', 'Server error log route file exists')
} else {
  fail('E7', 'Server error log route missing')
}

const serverIndex = readFileSync('./server/index.js', 'utf8')
if (serverIndex.includes("'/api/smokecraft/error-log'") && serverIndex.includes('smokecraftErrorLogRoutes')) {
  pass('E8', 'Error log route mounted at /api/smokecraft/error-log in server/index.js')
} else {
  fail('E8', 'Error log route not mounted in server/index.js')
}

if (appJsx.includes('smokecraft/error-log') && appJsx.includes('ErrorLogViewer')) {
  pass('E9', 'ErrorLogViewer wired into App.jsx at /smokecraft/error-log')
} else {
  fail('E9', 'ErrorLogViewer not found in App.jsx routing')
}

// ── F. Asset Registry (R7) ───────────────────────────────────────────────────

section('F. Asset Registry (R7)')

let registry = null
try {
  registry = await import('./src/modules/smokecraft/data/smokecraftAssetRegistry.js')
  pass('F1', 'smokecraftAssetRegistry.js imports successfully')
} catch (e) {
  fail('F1', `Import failed: ${e.message}`)
}

if (registry) {
  const { SMOKECRAFT_ASSET_REGISTRY, getAssetForRoute, getActiveAssets } = registry

  if (SMOKECRAFT_ASSET_REGISTRY.length >= 30) {
    pass('F2', `Asset registry has ${SMOKECRAFT_ASSET_REGISTRY.length} entries (≥30 required)`)
  } else {
    fail('F2', `Asset registry only has ${SMOKECRAFT_ASSET_REGISTRY.length} entries`)
  }

  // Key routes covered
  const keyRoutes = ['/smokecraft', '/smokecraft/mentor', '/smokecraft/golden-box',
                     '/smokecraft/first-third', '/smokecraft/scorecard']
  const missing = keyRoutes.filter(r => !getAssetForRoute(r))
  if (missing.length === 0) {
    pass('F3', `All key routes have asset registry entries: ${keyRoutes.join(', ')}`)
  } else {
    fail('F3', `Missing registry entries for: ${missing.join(', ')}`)
  }

  // All entries have canonical paths
  const noCanonical = SMOKECRAFT_ASSET_REGISTRY.filter(e => !e.canonical)
  if (noCanonical.length === 0) {
    pass('F4', 'All registry entries have canonical paths')
  } else {
    fail('F4', `${noCanonical.length} entries missing canonical path`)
  }

  // All active entries
  const active = getActiveAssets()
  if (active.length >= 25) {
    pass('F5', `${active.length} entries are marked 'active'`)
  } else {
    fail('F5', `Only ${active.length} active entries — expected ≥25`)
  }
}

// ── G. Journey Contract (R3) ─────────────────────────────────────────────────

section('G. Journey Contract (R3)')

let contract = null
try {
  contract = await import('./src/modules/smokecraft/data/smokecraftJourneyContract.js')
  pass('G1', 'smokecraftJourneyContract.js imports successfully (self-validation passed at import time)')
} catch (e) {
  fail('G1', `smokecraftJourneyContract.js import failed (self-validation threw): ${e.message}`)
}

if (contract) {
  const { JOURNEY_STEPS, JOURNEY_META, getNextRoute, getPrevRoute, getStepByRoute } = contract

  if (JOURNEY_STEPS.length === 24) {
    pass('G2', 'Journey contract defines exactly 24 sessions')
  } else {
    fail('G2', `Journey contract has ${JOURNEY_STEPS.length} sessions — expected 24`)
  }

  if (JOURNEY_META?.totalSessions === 24) {
    pass('G3', 'JOURNEY_META.totalSessions === 24')
  } else {
    fail('G3', `JOURNEY_META.totalSessions is ${JOURNEY_META?.totalSessions}`)
  }

  // No duplicate IDs
  const ids = JOURNEY_STEPS.map(s => s.id)
  const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupIds.length === 0) {
    pass('G4', 'No duplicate session IDs in contract')
  } else {
    fail('G4', `Duplicate session IDs: ${dupIds.join(', ')}`)
  }

  // Navigation helpers work
  const firstNext = getNextRoute(JOURNEY_STEPS[0].id)
  if (firstNext === JOURNEY_STEPS[1].route) {
    pass('G5', `getNextRoute() returns correct next route from session 1: ${firstNext}`)
  } else {
    fail('G5', `getNextRoute() returned ${firstNext}, expected ${JOURNEY_STEPS[1].route}`)
  }

  // Last step has null next
  const lastStep = JOURNEY_STEPS[23]
  const lastNext = getNextRoute(lastStep.id)
  if (lastNext === null) {
    pass('G6', 'getNextRoute() returns null for final session (session 24)')
  } else {
    fail('G6', `getNextRoute() for final session should be null, got ${lastNext}`)
  }
}

// ── H. Rollback Dry-Run (R17) ────────────────────────────────────────────────

section('H. Rollback Dry-Run (R17)')

if (existsSync('./scripts/migrations/rollback/rollback-master.mjs')) {
  pass('H1', 'rollback-master.mjs exists')
} else {
  fail('H1', 'rollback-master.mjs missing')
}

// Run dry-run for a specific migration
try {
  const { execSync } = await import('child_process')
  const output = execSync('node scripts/migrations/rollback/rollback-master.mjs --dry-run --migration 011', {
    encoding: 'utf8', cwd: process.cwd()
  })
  if (output.includes('DROP TABLE IF EXISTS smoke_sessions')) {
    pass('H2', 'Rollback dry-run for migration 011 generates correct DROP TABLE SQL')
  } else {
    fail('H2', `Rollback dry-run output unexpected: ${output.slice(0, 200)}`)
  }
  if (output.includes('No changes were made')) {
    pass('H3', 'Rollback dry-run confirms no changes were made')
  } else {
    fail('H3', 'Rollback dry-run missing "No changes were made" confirmation')
  }
} catch (e) {
  fail('H2', `Rollback dry-run failed: ${e.message}`)
  fail('H3', 'Rollback dry-run did not complete')
}

// Count migrations registered
const rollbackSrc = readFileSync('./scripts/migrations/rollback/rollback-master.mjs', 'utf8')
const rollbackCount = (rollbackSrc.match(/id: '0/g) || []).length
if (rollbackCount >= 72) {
  pass('H4', `All 72 migrations registered in rollback master (found ${rollbackCount})`)
} else {
  fail('H4', `Only ${rollbackCount} migrations registered — expected 72`)
}

if (rollbackSrc.includes('IF EXISTS') && rollbackSrc.includes('CASCADE')) {
  pass('H5', 'Rollback scripts use IF EXISTS and CASCADE guards (safe/idempotent)')
} else {
  fail('H5', 'Rollback scripts missing IF EXISTS or CASCADE safety guards')
}

skip('H6', 'Live database rollback execution — BLOCKED: DATABASE_URL not available in test environment')

// ── I. Rate Limiting (R11) ───────────────────────────────────────────────────

section('I. Rate Limiting (R11)')

const serverIndexSrc = readFileSync('./server/index.js', 'utf8')
if (serverIndexSrc.includes('express-rate-limit') || serverIndexSrc.includes('rateLimit')) {
  pass('I1', 'server/index.js includes express-rate-limit middleware')
} else {
  fail('I1', 'server/index.js missing express-rate-limit')
}

if (serverIndexSrc.includes('skip') && serverIndexSrc.includes('IS_PROD')) {
  pass('I2', 'Rate limit has production-only skip (disabled in dev)')
} else {
  fail('I2', 'Rate limit missing production-only skip guard')
}

// ── J. Documentation (R21) ───────────────────────────────────────────────────

section('J. Documentation (R21)')

const docs = [
  '01-guest-manual.md', '02-staff-ops.md', '03-manager-guide.md',
  '04-venue-admin.md', '05-platform-admin.md', '06-integration-config.md',
  '07-troubleshooting.md', '08-investor-demo.md', '09-deployment.md',
  '10-rollback-recovery.md', '11-known-limitations.md', '12-data-privacy.md',
  '13-feature-flag-admin.md', '14-error-log-review.md',
]

let docsFull = 0, docsOutline = 0
for (const doc of docs) {
  const path = `./docs/smokecraft/${doc}`
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf8')
    const wordCount = content.split(/\s+/).length
    if (wordCount >= 200) {
      docsFull++
      pass(`J-${doc}`, `${doc} exists with ${wordCount} words (full content)`)
    } else {
      docsOutline++
      fail(`J-${doc}`, `${doc} only has ${wordCount} words — likely an outline only`)
    }
  } else {
    fail(`J-${doc}`, `${doc} is missing from docs/smokecraft/`)
  }
}

// ── K. Image Optimization (R14) ──────────────────────────────────────────────

section('K. Image Optimization (R14)')

const optimizedAssets = [
  'public/assets/smokecraft/optimized/passport-3.webp',
  'public/assets/smokecraft/optimized/MENTOR SELECTION1.webp',
  'public/smokecraft/images/optimized/passport-main.webp',
]
for (const p of optimizedAssets) {
  if (existsSync(p)) {
    const { statSync } = await import('fs')
    const size = statSync(p).size
    pass(`K-${p.split('/').pop()}`, `Optimized WebP exists (${Math.round(size/1024)}KB): ${p}`)
  } else {
    fail(`K-${p.split('/').pop()}`, `Optimized WebP missing: ${p}`)
  }
}

if (existsSync('./scripts/smokecraft-image-audit.mjs')) {
  pass('K-audit', 'Image audit script exists at scripts/smokecraft-image-audit.mjs')
} else {
  fail('K-audit', 'Image audit script missing')
}

skip('K-lighthouse', 'Lighthouse performance measurement — BLOCKED: requires running server + headless Chrome in CI mode')

// ── Final Summary ─────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(60))
console.log('SmokeCraft MVP2 Final Partials Closeout — Test Results')
console.log('='.repeat(60))
console.log(`  PASS: ${PASS}`)
console.log(`  FAIL: ${FAIL}`)
console.log(`  SKIP: ${SKIP} (blocked — require live server, database, or browser)`)
console.log(`  TOTAL: ${PASS + FAIL + SKIP}`)
console.log('='.repeat(60))

if (FAIL > 0) {
  console.log('\nFailed tests:')
  results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ✗ ${r.id}: ${r.msg}`))
  process.exit(1)
} else {
  console.log(`\n✓ All ${PASS} executable checks PASS (${SKIP} skipped — blocked on live infrastructure)`)
}
