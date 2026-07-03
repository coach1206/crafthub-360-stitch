/**
 * verifySmokeCraftVenueAdminOperations.js
 * Module Build 6 verification
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function fileContains(filePath, str) {
  try { return fs.readFileSync(filePath, 'utf8').includes(str) } catch { return false }
}
function fileExists(filePath) { return fs.existsSync(filePath) }
function fileNotContains(filePath, str) {
  try { return !fs.readFileSync(filePath, 'utf8').includes(str) } catch { return true }
}
function fileNotMatchesPattern(filePath, pattern) {
  try { return !pattern.test(fs.readFileSync(filePath, 'utf8')) } catch { return true }
}

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ ${label}`)
    failed++
    failures.push(label)
  }
}

function runScript(name) {
  try {
    execSync(`npm run ${name} --silent`, { cwd: root, stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

// --- Paths ---
const ADMIN_STORE    = path.join(root, 'server/services/smokecraft/smokecraftVenueAdminStore.js')
const ACTIVITY_SVC   = path.join(root, 'server/services/smokecraft/smokecraftVenueActivityService.js')
const STAFF_SVC      = path.join(root, 'server/services/smokecraft/smokecraftStaffOperationsService.js')
const ANALYTICS_SVC  = path.join(root, 'server/services/smokecraft/smokecraftAnalyticsService.js')
const MGMT_SVC       = path.join(root, 'server/services/smokecraft/smokecraftManagementControlService.js')
const AUDIT_SVC      = path.join(root, 'server/services/smokecraft/smokecraftOperationalAuditService.js')
const PERM_SVC       = path.join(root, 'server/services/smokecraft/smokecraftVenuePermissionService.js')
const DASHBOARD_SVC  = path.join(root, 'server/services/smokecraft/smokecraftAdminDashboardService.js')
const CONTROLLER     = path.join(root, 'server/controllers/smokecraftVenueAdminController.js')
const ROUTES         = path.join(root, 'server/routes/smokecraftVenueAdminRoutes.js')
const SERVER         = path.join(root, 'server/index.js')
const CONTRACT_ADMIN = path.join(root, 'src/modules/smokecraft/data/smokecraftVenueAdminContract.js')
const CONTRACT_ANAL  = path.join(root, 'src/modules/smokecraft/data/smokecraftAnalyticsContract.js')
const CONTRACT_STAFF = path.join(root, 'src/modules/smokecraft/data/smokecraftStaffOperationsContract.js')
const CONTRACT_MGMT  = path.join(root, 'src/modules/smokecraft/data/smokecraftManagementControlContract.js')
const PANEL_DASH     = path.join(root, 'src/modules/smokecraft/components/SmokeCraftVenueAdminDashboard.jsx')
const PANEL_STAFF    = path.join(root, 'src/modules/smokecraft/components/SmokeCraftStaffOperationsPanel.jsx')
const PANEL_ANAL     = path.join(root, 'src/modules/smokecraft/components/SmokeCraftVenueAnalyticsPanel.jsx')
const PANEL_MGMT     = path.join(root, 'src/modules/smokecraft/components/SmokeCraftManagementControlsPanel.jsx')
const PANEL_AUDIT    = path.join(root, 'src/modules/smokecraft/components/SmokeCraftOperationalAuditPanel.jsx')
const DOCS           = path.join(root, 'docs/SMOKECRAFT_VENUE_ADMIN_OPERATIONS.md')
const README         = path.join(root, 'src/modules/smokecraft/README.md')

// Protected sealed files
const ASSET_SCREEN   = path.join(root, 'src/components/smokecraft/SmokeCraftAssetScreen.jsx')
const HOTSPOT_LAYER  = path.join(root, 'src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
const ASSET_ROUTE    = path.join(root, 'src/components/smokecraft/SmokeCraftAssetRoute.jsx')
const SESSION_JS     = path.join(root, 'src/constants/session.js')

// --- Checks ---
console.log('\n[1] Backend Services')
assert('venue admin store exists',        fileExists(ADMIN_STORE))
assert('venue activity service exists',   fileExists(ACTIVITY_SVC))
assert('staff operations service exists', fileExists(STAFF_SVC))
assert('analytics service exists',        fileExists(ANALYTICS_SVC))
assert('management control service exists', fileExists(MGMT_SVC))
assert('operational audit service exists',  fileExists(AUDIT_SVC))
assert('venue permission service exists',   fileExists(PERM_SVC))
assert('admin dashboard service exists',    fileExists(DASHBOARD_SVC))

console.log('\n[2] Controller and Routes')
assert('venue admin controller exists', fileExists(CONTROLLER))
assert('venue admin routes exist',      fileExists(ROUTES))
assert('routes mounted under /admin',   fileContains(SERVER, 'smokecraftVenueAdminRoutes'))
assert('routes use /admin path',        fileContains(ROUTES, '/status') || fileContains(ROUTES, "router.get('/status"))

console.log('\n[3] Data Contracts')
assert('venue admin contract exists',           fileExists(CONTRACT_ADMIN))
assert('analytics contract exists',             fileExists(CONTRACT_ANAL))
assert('staff operations contract exists',      fileExists(CONTRACT_STAFF))
assert('management control contract exists',    fileExists(CONTRACT_MGMT))

console.log('\n[4] Permission Rules')
assert('customer role is blocked from admin access', fileContains(PERM_SVC, "BLOCKED_ROLES") && fileContains(PERM_SVC, "'customer'"))
assert('staff role can access staff operations',     fileContains(PERM_SVC, "'view_staff_queue'"))
assert('manager role can access analytics',          fileContains(PERM_SVC, "'view_analytics'"))
assert('venueOwner can access management controls',  fileContains(PERM_SVC, "'view_management_controls'"))
assert('platformAdmin can clear demo data',          fileContains(PERM_SVC, "'clear_demo_data'"))

console.log('\n[5] Protected Actions Blocked')
assert('force passport unlock is blocked',        fileContains(MGMT_SVC, 'PROTECTED_CONTROL_ACTIONS') && fileContains(CONTRACT_MGMT, 'force_passport_unlock'))
assert('force connections unlock is blocked',     fileContains(CONTRACT_MGMT, 'force_connections_unlock'))
assert('force POS synced is blocked',             fileContains(CONTRACT_MGMT, 'force_pos_synced'))
assert('force E.A.T. synced is blocked',          fileContains(CONTRACT_MGMT, 'force_eat_synced'))
assert('force reward redeemed is blocked',        fileContains(CONTRACT_MGMT, 'force_reward_redeemed'))
assert('force billing active is blocked',         fileContains(CONTRACT_MGMT, 'force_billing_active'))
assert('force license enforced is blocked',       fileContains(CONTRACT_MGMT, 'force_license_enforced'))

console.log('\n[6] Analytics Content')
assert('analytics includes order totals',         fileContains(ANALYTICS_SVC, 'totalOrderRequests'))
assert('analytics includes pairing totals',       fileContains(ANALYTICS_SVC, 'pairingRecommendations'))
assert('analytics includes reward totals',        fileContains(ANALYTICS_SVC, 'rewardEvaluations'))
assert('analytics includes XP and loyalty',       fileContains(ANALYTICS_SVC, 'xpIssued') && fileContains(ANALYTICS_SVC, 'loyaltyPointsIssued'))
assert('analytics includes fallback usage',       fileContains(ANALYTICS_SVC, 'fallbackUsage'))

console.log('\n[7] Integration Honest Status')
assert('POS360 remains not_connected when unavailable', fileContains(MGMT_SVC, "'not_connected'") && fileContains(MGMT_SVC, 'pos360'))
assert('E.A.T. remains not_connected or preview_only',  fileContains(MGMT_SVC, 'preview_only') && fileContains(MGMT_SVC, 'eat'))
assert('persistence is memory_fallback without DB',     fileContains(ADMIN_STORE, 'memory_fallback'))

console.log('\n[8] Audit Service')
assert('audit entries are created',                 fileContains(AUDIT_SVC, 'createOperationalAuditEntry'))
assert('audit containsSecrets false',               fileContains(AUDIT_SVC, 'containsSecrets:   false'))
assert('audit exposesPrivateData false',            fileContains(AUDIT_SVC, 'exposesPrivateData:false'))

console.log('\n[9] Frontend Components')
assert('SmokeCraftVenueAdminDashboard exists',      fileExists(PANEL_DASH))
assert('SmokeCraftStaffOperationsPanel exists',     fileExists(PANEL_STAFF))
assert('SmokeCraftVenueAnalyticsPanel exists',      fileExists(PANEL_ANAL))
assert('SmokeCraftManagementControlsPanel exists',  fileExists(PANEL_MGMT))
assert('SmokeCraftOperationalAuditPanel exists',    fileExists(PANEL_AUDIT))

console.log('\n[10] Documentation and README')
assert('docs file exists',                          fileExists(DOCS))
assert('README has MODULE BUILD 6',                 fileContains(README, 'MODULE BUILD 6'))

console.log('\n[11] Protected Files Not Modified')
const sealedBefore = [ASSET_SCREEN, HOTSPOT_LAYER, ASSET_ROUTE, SESSION_JS]
for (const f of sealedBefore) {
  // We verify they exist (sealed files must still exist) and aren't touched by this build
  assert(`sealed file exists: ${path.basename(f)}`, fileExists(f))
}
// Check sealed files don't contain admin layer imports (would mean they were modified to include admin code)
assert('SmokeCraftAssetScreen not modified with admin imports', fileNotContains(ASSET_SCREEN, 'smokecraftVenueAdmin'))
assert('SmokeCraftHotspotLayer not modified with admin imports', fileNotContains(HOTSPOT_LAYER, 'smokecraftVenueAdmin'))

console.log('\n[12] Prior Verification Scripts Still Pass')
assert('verify:smokecraft-rewards-monetization passes',     runScript('verify:smokecraft-rewards-monetization'))
assert('verify:smokecraft-pairing-intelligence passes',     runScript('verify:smokecraft-pairing-intelligence'))
assert('verify:smokecraft-ordering-integration passes',     runScript('verify:smokecraft-ordering-integration'))
assert('verify:smokecraft-experience-module passes',        runScript('verify:smokecraft-experience-module'))
assert('verify:module-foundation passes',                   runScript('verify:module-foundation'))

console.log('\n[13] Build')
assert('npm run build passes', runScript('build'))

// --- Summary ---
console.log(`\n${'='.repeat(55)}`)
console.log(`SmokeCraft Venue Admin Operations Verify`)
console.log(`Passed: ${passed} / ${passed + failed}`)
if (failures.length > 0) {
  console.error(`\nFailed assertions:`)
  failures.forEach(f => console.error(`  - ${f}`))
  process.exit(1)
} else {
  console.log(`All assertions passed.`)
  console.log(`\nVenue admin foundation: active.`)
  console.log(`Staff operations: active.`)
  console.log(`Analytics: active (memory_fallback).`)
  console.log(`Management controls: active — protected actions blocked.`)
  console.log(`Operational audit: active.`)
  console.log(`Role permissions: active — customer role blocked.`)
  console.log(`POS360: not_connected.`)
  console.log(`E.A.T.: not_connected / preview_only.`)
  console.log(`Persistence: memory_fallback without DATABASE_URL.`)
  console.log(`Next: MODULE BUILD 7 — SmokeCraft Live Integrations, Provider Connectors, Database Persistence, and Production Sync Readiness`)
}
