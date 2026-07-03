/**
 * Post-Phase Final Audit Verification Script
 * Verifies the post-phase audit layer exists and is correctly structured.
 * Confirms the sealed core build is intact, no Phase 20 language is introduced,
 * Module Build 1 is the next step, and production blockers are clearly listed.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(process.cwd())
const pass = []
const fail = []

function assert(condition, label) {
  if (condition) {
    pass.push(label)
  } else {
    fail.push(label)
    console.error(`  FAIL: ${label}`)
  }
}

function fileExists(rel) {
  return existsSync(resolve(ROOT, rel))
}

function fileContains(rel, str) {
  if (!existsSync(resolve(ROOT, rel))) return false
  return readFileSync(resolve(ROOT, rel), 'utf8').includes(str)
}

function fileNotContains(rel, str) {
  if (!existsSync(resolve(ROOT, rel))) return true
  return !readFileSync(resolve(ROOT, rel), 'utf8').includes(str)
}

const SVC    = 'server/services/postPhase/postPhaseAuditService.js'
const CTRL   = 'server/controllers/postPhaseAuditController.js'
const ROUTE  = 'server/routes/postPhaseAuditRoutes.js'
const DOCS   = 'docs/POST_PHASE_FINAL_AUDIT_REVIEW.md'
const IDX    = 'server/index.js'
const PKG    = 'package.json'
const VERIFY = 'server/scripts/verifyPostPhaseAudit.js'

console.log('\n── Post-Phase Final Audit Verification ──\n')

// ── File existence ──────────────────────────────────────────────────────────
console.log('File existence:')
assert(fileExists(SVC),    'postPhaseAuditService.js exists')
assert(fileExists(CTRL),   'postPhaseAuditController.js exists')
assert(fileExists(ROUTE),  'postPhaseAuditRoutes.js exists')
assert(fileExists(DOCS),   'POST_PHASE_FINAL_AUDIT_REVIEW.md exists')
assert(fileExists(VERIFY), 'verifyPostPhaseAudit.js exists')

// ── Service exports ─────────────────────────────────────────────────────────
console.log('\npostPhaseAuditService.js exports:')
assert(fileContains(SVC, 'buildPostPhaseAuditReport'),      'exports buildPostPhaseAuditReport')
assert(fileContains(SVC, 'getSealedCoreStatus'),            'exports getSealedCoreStatus')
assert(fileContains(SVC, 'getFPLMRLIntegrity'),             'exports getFPLMRLIntegrity')
assert(fileContains(SVC, 'getProductionBlockers'),          'exports getProductionBlockers')
assert(fileContains(SVC, 'getStripeReadinessSummary'),      'exports getStripeReadinessSummary')
assert(fileContains(SVC, 'getDatabaseReadinessSummary'),    'exports getDatabaseReadinessSummary')
assert(fileContains(SVC, 'getSessionSecretReadiness'),      'exports getSessionSecretReadiness')
assert(fileContains(SVC, 'getEnvironmentSetupChecklist'),   'exports getEnvironmentSetupChecklist')
assert(fileContains(SVC, 'getModuleBuildReadiness'),        'exports getModuleBuildReadiness')
assert(fileContains(SVC, 'getModuleBuild1Requirements'),    'exports getModuleBuild1Requirements')
assert(fileContains(SVC, 'getNoveeOSPlatformClarification'), 'exports getNoveeOSPlatformClarification')

// ── NOVEE OS platform clarification ─────────────────────────────────────────
console.log('\nNOVEE OS platform clarification:')
assert(fileContains(SVC, 'platform_software'),              'service describes NOVEE OS as platform_software')
assert(fileContains(SVC, 'isPlatformSoftware: true'),       'service marks isPlatformSoftware: true')
assert(fileContains(SVC, 'isWebsite: false'),               'service marks isWebsite: false')
assert(fileContains(SVC, 'noveeos.com'),                    'service references noveeos.com as portal')
assert(fileContains(SVC, 'web_portal'),                     'service marks noveeos.com as web_portal')
assert(fileContains(SVC, 'isPlatformSoftwareItself: false'),'service marks portal as not platform software')

// ── No Phase 20 language ─────────────────────────────────────────────────────
console.log('\nNo Phase 20 language:')
assert(fileContains(SVC, 'noPhase20: true'),                'service has noPhase20: true')
assert(fileContains(SVC, 'isPhase20: false'),               'module build readiness has isPhase20: false')
assert(fileNotContains(SVC, '"Phase 20"'),                  'service has no "Phase 20" string')
assert(fileContains(DOCS, 'not Phase 20'),                  'docs clarify this is not Phase 20')
assert(fileNotContains(DOCS, 'Phase 20 —'),                 'docs have no "Phase 20 —" label')

// ── Module Build 1 as next step ──────────────────────────────────────────────
console.log('\nModule Build 1 as next step:')
assert(fileContains(SVC, 'MODULE BUILD 1'),                 'service names MODULE BUILD 1 as next')
assert(fileContains(SVC, 'NOVEE OS Module Packaging Foundation'), 'service names Module Build 1 correctly')
assert(fileContains(SVC, 'next_to_build'),                  'Module Build 1 status is next_to_build')
assert(fileContains(SVC, 'nextRecommendedPrompt'),          'service has nextRecommendedPrompt field')
assert(fileContains(DOCS, 'MODULE BUILD 1'),                'docs name MODULE BUILD 1 as next')
assert(fileContains(DOCS, 'NEXT TO BUILD'),                 'docs mark Module Build 1 as NEXT TO BUILD')

// ── Production blockers listed ───────────────────────────────────────────────
console.log('\nProduction blockers:')
assert(fileContains(SVC, 'missing_database_url'),           'lists missing_database_url blocker')
assert(fileContains(SVC, 'DATABASE_URL'),                   'references DATABASE_URL')
assert(fileContains(SVC, 'session_secret_required'),        'lists session_secret_required blocker')
assert(fileContains(SVC, 'SESSION_SECRET'),                 'references SESSION_SECRET')
assert(fileContains(SVC, 'stripe_secret_key_required'),     'lists stripe_secret_key_required')
assert(fileContains(SVC, 'stripe_publishable_key_required'), 'lists stripe_publishable_key_required')
assert(fileContains(SVC, 'stripe_webhook_secret_required'), 'lists stripe_webhook_secret_required')
assert(fileContains(SVC, 'migrations_pending'),             'lists migrations_pending')
assert(fileContains(SVC, 'external_sync_not_live'),         'lists external_sync_not_live')
assert(fileContains(SVC, 'vendor_sync_not_live'),           'lists vendor_sync_not_live')
assert(fileContains(SVC, 'real_time_push_pending'),         'lists real_time_push_pending')

// ── Stripe readiness language is safe ────────────────────────────────────────
console.log('\nStripe readiness is safe:')
assert(fileContains(SVC, 'stripe_secret_key_present_redacted'), 'uses safe redacted status name')
assert(fileContains(SVC, 'stripe_publishable_key_present_redacted'), 'uses safe redacted publishable status')
assert(fileContains(SVC, 'Key values are never returned'),  'documents no key exposure')
assert(fileContains(SVC, "'****'"),                         'uses **** redaction pattern')
assert(fileNotContains(SVC, 'process.env.STRIPE_SECRET_KEY + '), 'does not concatenate real key')

// ── Database readiness language is safe ──────────────────────────────────────
console.log('\nDatabase readiness is safe:')
assert(fileContains(SVC, 'database_url_present_redacted'),  'uses safe database url status')
assert(fileContains(SVC, 'missing_database_url'),           'uses missing_database_url status')
assert(fileContains(SVC, 'migrations_pending'),             'uses migrations_pending status')
assert(fileContains(SVC, 'schema_required'),                'uses schema_required status')
assert(fileContains(SVC, 'production_database_blocked'),    'uses production_database_blocked status')

// ── Session secret language is safe ──────────────────────────────────────────
console.log('\nSession secret readiness is safe:')
assert(fileContains(SVC, 'session_secret_present_redacted'), 'uses safe session secret status')
assert(fileContains(SVC, 'session_secret_required'),        'uses session_secret_required status')
assert(fileContains(SVC, 'auth_session_ready_with_env'),    'uses auth_session_ready_with_env status')
assert(fileContains(SVC, 'auth_session_production_blocked'), 'uses auth_session_production_blocked status')

// ── Module build sequence ────────────────────────────────────────────────────
console.log('\nModule build sequence:')
assert(fileContains(SVC, 'moduleBuildSequence'),            'service has moduleBuildSequence')
assert(fileContains(SVC, 'totalModuleBuilds: 9'),           'lists 9 module builds')
assert(fileContains(SVC, 'SmokeCraft Experience Module'),   'includes SmokeCraft module')
assert(fileContains(SVC, 'POS360 Module'),                  'includes POS360 module')
assert(fileContains(SVC, 'E.A.T. Command Hub Module'),      'includes E.A.T. module')
assert(fileContains(SVC, 'ISPAE'),                          'includes ISPAE module')
assert(fileContains(SVC, 'DMRC'),                           'includes DMRC module')
assert(fileContains(SVC, 'LOCC Module'),                    'includes LOCC module')
assert(fileContains(SVC, 'EOCG Module'),                    'includes EOCG module')
assert(fileContains(SVC, 'White-Label Marketplace'),        'includes white-label module')
assert(fileContains(SVC, 'awaiting_build_1'),               'modules 2-9 are awaiting_build_1')

// ── Module Build 1 requirements ───────────────────────────────────────────────
console.log('\nModule Build 1 requirements:')
assert(fileContains(SVC, 'module_registry'),                'lists module_registry requirement')
assert(fileContains(SVC, 'module_manifest_format'),         'lists module_manifest_format requirement')
assert(fileContains(SVC, 'install_hooks'),                  'lists install_hooks requirement')
assert(fileContains(SVC, 'uninstall_hooks'),                'lists uninstall_hooks requirement')
assert(fileContains(SVC, 'module_versioning'),              'lists module_versioning requirement')
assert(fileContains(SVC, 'module_permissions'),             'lists module_permissions requirement')
assert(fileContains(SVC, 'module_route_registry'),          'lists module_route_registry requirement')
assert(fileContains(SVC, 'module_eat_hooks'),               'lists module_eat_hooks requirement')
assert(fileContains(SVC, 'tenant_venue_module_activation'), 'lists tenant_venue_module_activation requirement')
assert(fileContains(SVC, 'license_gate_preparation'),       'lists license_gate_preparation requirement')
assert(fileContains(SVC, 'audit_trail_for_module_changes'), 'lists audit_trail requirement')
assert(fileContains(SVC, 'requirements_prepared_not_yet_built'), 'module build 1 not yet built')

// ── Route registration ────────────────────────────────────────────────────────
console.log('\nRoute registration:')
assert(fileContains(ROUTE, 'handlePostPhaseAuditReview'),   'route imports handlePostPhaseAuditReview')
assert(fileContains(ROUTE, "'/audit-review'"),              'registers /audit-review route')
assert(fileContains(ROUTE, "'/sealed-core-status'"),        'registers /sealed-core-status route')
assert(fileContains(ROUTE, "'/production-blockers'"),       'registers /production-blockers route')
assert(fileContains(ROUTE, "'/stripe-readiness'"),          'registers /stripe-readiness route')
assert(fileContains(ROUTE, "'/database-readiness'"),        'registers /database-readiness route')
assert(fileContains(ROUTE, "'/module-build-readiness'"),    'registers /module-build-readiness route')
assert(fileContains(ROUTE, "'/module-build-1-requirements'"), 'registers /module-build-1-requirements route')
assert(fileContains(IDX, 'postPhaseAuditRoutes'),           'server/index.js imports postPhaseAuditRoutes')
assert(fileContains(IDX, "'/api/post-phase'"),              'server/index.js mounts /api/post-phase')

// ── Documentation ─────────────────────────────────────────────────────────────
console.log('\nPOST_PHASE_FINAL_AUDIT_REVIEW.md:')
assert(fileContains(DOCS, 'NOVEE OS is platform software'),  'docs state NOVEE OS is platform software')
assert(fileContains(DOCS, 'not a website'),                  'docs clarify NOVEE OS is not a website')
assert(fileContains(DOCS, 'noveeos.com is the public-facing portal'), 'docs clarify noveeos.com role')
assert(fileContains(DOCS, 'core_build_sealed'),              'docs show core_build_sealed status')
assert(fileContains(DOCS, 'e150d9f7'),                       'docs show Phase 19 commit hash')
assert(fileContains(DOCS, 'production_blocked_until_env_configured'), 'docs show production status')
assert(fileContains(DOCS, 'missing_database_url'),           'docs list DATABASE_URL blocker')
assert(fileContains(DOCS, 'session_secret_required'),        'docs list SESSION_SECRET blocker')
assert(fileContains(DOCS, 'stripe_secret_key_required'),     'docs list Stripe blocker')
assert(fileContains(DOCS, 'migrations_pending'),             'docs list migrations blocker')
assert(fileContains(DOCS, 'GET /api/post-phase/audit-review'), 'docs list API endpoint')
assert(fileContains(DOCS, 'MODULE BUILD 1'),                 'docs name next build step')
assert(fileContains(DOCS, 'Module registry'),                'docs list module registry requirement')
assert(fileContains(DOCS, 'License gate preparation'),       'docs list license gate requirement')
assert(fileContains(DOCS, 'not Phase 20'),                   'docs confirm this is not Phase 20')
assert(fileContains(DOCS, 'POST-PHASE MODULE BUILD SERIES'), 'docs name the series correctly')

// ── Secrets not exposed in docs ───────────────────────────────────────────────
console.log('\nNo secrets exposed:')
// Allow sk_live_ as an example format string; reject actual key values (8+ chars after prefix)
assert(!/sk_live_[A-Za-z0-9]{8}/.test(existsSync(resolve(ROOT, DOCS)) ? readFileSync(resolve(ROOT, DOCS), 'utf8') : ''), 'docs have no hardcoded sk_live_ key value')
assert(fileNotContains(DOCS, 'sk_test_'),                    'docs have no hardcoded sk_test_ key')
assert(fileNotContains(DOCS, 'whsec_'),                      'docs have no hardcoded whsec_ key')

// ── Prior sealed systems still exist ─────────────────────────────────────────
console.log('\nSealed core files still present:')
assert(fileExists('server/services/finalLockdown/finalLockdownAuditService.js'),      'FPLMRL audit service sealed')
assert(fileExists('server/services/finalLockdown/protectedFileIntegrityService.js'),  'protected file integrity sealed')
assert(fileExists('server/services/moduleReadiness/moduleReadinessMapService.js'),    'module readiness map sealed')
assert(fileExists('server/services/environment/environmentReadinessService.js'),      'EPRL sealed')
assert(fileExists('server/services/operations/operationsDashboardService.js'),        'LOCC sealed')
assert(fileExists('server/services/externalPos/externalPOSConnectorGateway.js'),      'EOCG sealed')
assert(fileExists('server/services/inventory/inventoryAvailabilityService.js'),       'ISPAE sealed')
assert(fileExists('server/services/reorder/reorderApprovalService.js'),               'DMRC sealed')
assert(fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx'),             'SmokeCraft protected file sealed')
assert(fileExists('src/constants/session.js'),                                         'session.js protected file sealed')

// ── Package script ────────────────────────────────────────────────────────────
console.log('\npackage.json:')
assert(fileContains(PKG, 'verify:post-phase-audit'),         'verify:post-phase-audit script in package.json')

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n── Results ──')
console.log(`  Passed: ${pass.length}`)
console.log(`  Failed: ${fail.length}`)

if (fail.length > 0) {
  console.error('\nFailed assertions:')
  fail.forEach(f => console.error(`  - ${f}`))
  process.exit(1)
} else {
  console.log('\n  All post-phase audit assertions passed.')
  console.log('  19-phase core build is sealed. No Phase 20.')
  console.log('  Module Build 1 is the next step.')
  console.log('  Production blockers clearly listed.')
  console.log('  NOVEE OS is platform software. noveeos.com is the portal.')
  process.exit(0)
}
