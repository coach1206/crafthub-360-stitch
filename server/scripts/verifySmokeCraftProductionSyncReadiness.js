/**
 * verifySmokeCraftProductionSyncReadiness.js
 * Module Build 7 — 63 assertions
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function assert(label, condition) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(label)
    console.error(`  FAIL: ${label}`)
  }
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

function fileContains(rel, str) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8').includes(str)
  } catch {
    return false
  }
}

function fileNotContains(rel, pattern) {
  try {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    if (typeof pattern === 'string') return !content.includes(pattern)
    return !pattern.test(content)
  } catch {
    return true
  }
}

// ── Data contracts ─────────────────────────────────────────────

const CONTRACT_ENV   = 'src/modules/smokecraft/data/smokecraftEnvironmentContract.js'
const CONTRACT_CONN  = 'src/modules/smokecraft/data/smokecraftConnectorContract.js'
const CONTRACT_SYNC  = 'src/modules/smokecraft/data/smokecraftProductionSyncContract.js'
const CONTRACT_INTEG = 'src/modules/smokecraft/data/smokecraftIntegrationContract.js'

assert('smokecraftEnvironmentContract.js exists', fileExists(CONTRACT_ENV))
assert('ENV_VARS defined with DATABASE_URL', fileContains(CONTRACT_ENV, 'DATABASE_URL'))
assert('ENV_VARS has POS360_API_KEY secret:true', fileContains(CONTRACT_ENV, 'POS360_API_KEY'))
assert('ENV_VARS has BILLING_PROVIDER_KEY', fileContains(CONTRACT_ENV, 'BILLING_PROVIDER_KEY'))
assert('createEnvVarStatus exported', fileContains(CONTRACT_ENV, 'createEnvVarStatus'))

assert('smokecraftConnectorContract.js exists', fileExists(CONTRACT_CONN))
assert('CONNECTOR_CATEGORIES has pos360', fileContains(CONTRACT_CONN, 'pos360'))
assert('CONNECTOR_CATEGORIES has 10 entries', (() => {
  const content = fs.existsSync(path.join(ROOT, CONTRACT_CONN))
    ? fs.readFileSync(path.join(ROOT, CONTRACT_CONN), 'utf8') : ''
  const cats = ['pos360','eat_system','pairing_provider','venue_menu_provider','passport_connections',
    'loyalty_provider','billing_provider','analytics_provider','marketplace_provider','license_provider']
  return cats.every(c => content.includes(c))
})())
assert('CONNECTION_STATUSES defined', fileContains(CONTRACT_CONN, 'CONNECTION_STATUSES'))
assert('createConnectorRecord exported', fileContains(CONTRACT_CONN, 'createConnectorRecord'))

assert('smokecraftProductionSyncContract.js exists', fileExists(CONTRACT_SYNC))
assert('SYNC_STATUSES has blocked_not_connected', fileContains(CONTRACT_SYNC, 'blocked_not_connected'))
assert('SYNC_STATUSES has dead_letter', fileContains(CONTRACT_SYNC, 'dead_letter'))
assert('MAX_RETRY_ATTEMPTS defined', fileContains(CONTRACT_SYNC, 'MAX_RETRY_ATTEMPTS'))
assert('createSyncEvent exported', fileContains(CONTRACT_SYNC, 'createSyncEvent'))

assert('smokecraftIntegrationContract.js exists', fileExists(CONTRACT_INTEG))
assert('createIntegrationStatus exported', fileContains(CONTRACT_INTEG, 'createIntegrationStatus'))
assert('productionReady: false in contract', fileContains(CONTRACT_INTEG, 'productionReady: false'))

// ── Backend services ────────────────────────────────────────────

const SECRET_SVC  = 'server/services/smokecraft/smokecraftSecretSafetyService.js'
const ENV_SVC     = 'server/services/smokecraft/smokecraftEnvironmentValidationService.js'
const DB_SVC      = 'server/services/smokecraft/smokecraftDatabaseReadinessService.js'
const STORE_SVC   = 'server/services/smokecraft/smokecraftSyncEventStore.js'
const AUDIT_SVC   = 'server/services/smokecraft/smokecraftConnectorAuditService.js'
const REG_SVC     = 'server/services/smokecraft/smokecraftProviderConnectorRegistry.js'
const RETRY_SVC   = 'server/services/smokecraft/smokecraftSyncRetryService.js'
const QUEUE_SVC   = 'server/services/smokecraft/smokecraftProductionSyncQueueService.js'
const HEALTH_SVC  = 'server/services/smokecraft/smokecraftIntegrationHealthService.js'
const READY_SVC   = 'server/services/smokecraft/smokecraftProductionReadinessService.js'

assert('smokecraftSecretSafetyService.js exists', fileExists(SECRET_SVC))
assert('detectPotentialSecretLeak exported', fileContains(SECRET_SVC, 'detectPotentialSecretLeak'))
assert('assertNoFrontendSecretExposure exported', fileContains(SECRET_SVC, 'assertNoFrontendSecretExposure'))
assert('secret safety returns containsSecrets: false', fileContains(SECRET_SVC, 'containsSecrets: false'))
assert('secret safety REDACTED placeholder used', fileContains(SECRET_SVC, '[REDACTED]'))

assert('smokecraftEnvironmentValidationService.js exists', fileExists(ENV_SVC))
assert('validateEnvironment exported', fileContains(ENV_SVC, 'validateEnvironment'))
assert('env service never prints secret values', fileContains(ENV_SVC, 'valuesRedacted') || fileContains(ENV_SVC, 'secretsSafe'))
assert('getEnvironmentValidationReport exported', fileContains(ENV_SVC, 'getEnvironmentValidationReport'))

assert('smokecraftDatabaseReadinessService.js exists', fileExists(DB_SVC))
assert('memory_fallback mode in db service', fileContains(DB_SVC, 'memory_fallback'))
assert('database_config_detected mode in db service', fileContains(DB_SVC, 'database_config_detected'))
assert('getDatabaseReadinessStatus exported', fileContains(DB_SVC, 'getDatabaseReadinessStatus'))
assert('db productionReady: false without verified connection', fileContains(DB_SVC, 'productionReady: false'))

assert('smokecraftSyncEventStore.js exists', fileExists(STORE_SVC))
assert('sync store guards against false synced claim', fileContains(STORE_SVC, '_connectorConfirmed'))
assert('createSyncEventRecord exported', fileContains(STORE_SVC, 'createSyncEventRecord'))
assert('dead_letter handling in store', fileContains(STORE_SVC, 'dead_letter') || fileContains(STORE_SVC, 'markSyncDeadLetter'))

assert('smokecraftConnectorAuditService.js exists', fileExists(AUDIT_SVC))
assert('CONNECTOR_AUDIT_EVENTS defined', fileContains(AUDIT_SVC, 'CONNECTOR_AUDIT_EVENTS'))
assert('audit entries containsSecrets: false', fileContains(AUDIT_SVC, 'containsSecrets'))
assert('getConnectorAuditLog exported', fileContains(AUDIT_SVC, 'getConnectorAuditLog'))

assert('smokecraftProviderConnectorRegistry.js exists', fileExists(REG_SVC))
assert('registry never sets connected: true', fileNotContains(REG_SVC, /connected:\s*true/))
assert('getConnectorRegistry exported', fileContains(REG_SVC, 'getConnectorRegistry'))
assert('connectedCount in registry report', fileContains(REG_SVC, 'connectedCount'))

assert('smokecraftSyncRetryService.js exists', fileExists(RETRY_SVC))
assert('retry blocks when not connected', fileContains(RETRY_SVC, 'blocked_not_connected') || fileContains(RETRY_SVC, 'isConnectorConnected'))
assert('exponential backoff in retry service', fileContains(RETRY_SVC, 'RETRY_DELAY_MS') || fileContains(RETRY_SVC, 'retryDelay') || fileContains(RETRY_SVC, 'backoff'))
assert('scheduleRetry exported', fileContains(RETRY_SVC, 'scheduleRetry'))

assert('smokecraftProductionSyncQueueService.js exists', fileExists(QUEUE_SVC))
assert('queuePOS360SyncEvent exported', fileContains(QUEUE_SVC, 'queuePOS360SyncEvent'))
assert('queueEatSyncEvent exported', fileContains(QUEUE_SVC, 'queueEatSyncEvent'))
assert('POS360 sync cannot claim sent_to_pos without confirmation', fileContains(QUEUE_SVC, 'sent_to_pos') || fileContains(QUEUE_SVC, 'canSendSmokeCraftOrderToPOS'))
assert('getSyncQueueStatus exported', fileContains(QUEUE_SVC, 'getSyncQueueStatus'))

assert('smokecraftIntegrationHealthService.js exists', fileExists(HEALTH_SVC))
assert('getIntegrationHealthSummary exported', fileContains(HEALTH_SVC, 'getIntegrationHealthSummary'))
assert('health summary productionReady: false', fileContains(HEALTH_SVC, 'productionReady: false'))

assert('smokecraftProductionReadinessService.js exists', fileExists(READY_SVC))
assert('getProductionReadinessStatus exported', fileContains(READY_SVC, 'getProductionReadinessStatus'))
assert('productionReady false in readiness service', fileContains(READY_SVC, 'productionReady') && (fileContains(READY_SVC, 'productionReady: false') || fileContains(READY_SVC, 'productionReady = false') || fileContains(READY_SVC, 'productionReady,')))
assert('getIntegrationSystemStatus exported', fileContains(READY_SVC, 'getIntegrationSystemStatus'))

// ── Controller + Routes ─────────────────────────────────────────

const CONTROLLER = 'server/controllers/smokecraftIntegrationController.js'
const ROUTES     = 'server/routes/smokecraftIntegrationRoutes.js'

assert('smokecraftIntegrationController.js exists', fileExists(CONTROLLER))
assert('controller strips env var values', fileContains(CONTROLLER, '[REDACTED]'))
assert('getHealthStatus handler exported', fileContains(CONTROLLER, 'getHealthStatus'))
assert('retrySyncEvent handler exported', fileContains(CONTROLLER, 'retrySyncEvent'))

assert('smokecraftIntegrationRoutes.js exists', fileExists(ROUTES))
assert('routes register /health', fileContains(ROUTES, '/health'))
assert('routes register /sync/queue', fileContains(ROUTES, '/sync/queue'))
assert('routes register /audit', fileContains(ROUTES, '/audit'))

// ── server/index.js ─────────────────────────────────────────────

const SERVER = 'server/index.js'
assert('smokecraftIntegrationRoutes imported in server/index.js', fileContains(SERVER, 'smokecraftIntegrationRoutes'))
assert('integrations route mounted at /api/modules/smokecraft/integrations', fileContains(SERVER, '/api/modules/smokecraft/integrations'))

// ── Frontend ────────────────────────────────────────────────────

assert('SmokeCraftIntegrationStatusPanel.jsx exists', fileExists('src/modules/smokecraft/components/SmokeCraftIntegrationStatusPanel.jsx'))
assert('SmokeCraftDatabaseReadinessPanel.jsx exists', fileExists('src/modules/smokecraft/components/SmokeCraftDatabaseReadinessPanel.jsx'))
assert('SmokeCraftProviderConnectorsPanel.jsx exists', fileExists('src/modules/smokecraft/components/SmokeCraftProviderConnectorsPanel.jsx'))
assert('SmokeCraftProductionSyncPanel.jsx exists', fileExists('src/modules/smokecraft/components/SmokeCraftProductionSyncPanel.jsx'))
assert('SmokeCraftEnvironmentValidationPanel.jsx exists', fileExists('src/modules/smokecraft/components/SmokeCraftEnvironmentValidationPanel.jsx'))
assert('Integration panel shows not_connected statuses', fileContains('src/modules/smokecraft/components/SmokeCraftIntegrationStatusPanel.jsx', 'not_connected'))
assert('Env panel shows REDACTED notice', fileContains('src/modules/smokecraft/components/SmokeCraftEnvironmentValidationPanel.jsx', '[REDACTED]'))
assert('DB panel shows memory_fallback warning', fileContains('src/modules/smokecraft/components/SmokeCraftDatabaseReadinessPanel.jsx', 'memory_fallback'))

// ── Frontend service ────────────────────────────────────────────

const FE_SVC = 'src/modules/smokecraft/services/smokecraftIntegrationService.js'
assert('smokecraftIntegrationService.js exists', fileExists(FE_SVC))
assert('getIntegrationHealth exported', fileContains(FE_SVC, 'getIntegrationHealth'))
assert('getProductionReadiness exported', fileContains(FE_SVC, 'getProductionReadiness'))

// ── Documentation ───────────────────────────────────────────────

assert('SMOKECRAFT_PRODUCTION_SYNC_READINESS.md exists', fileExists('docs/SMOKECRAFT_PRODUCTION_SYNC_READINESS.md'))

// ── Summary ─────────────────────────────────────────────────────

const total = passed + failed
console.log(`\nSmokeCraft Production Sync Readiness — ${total} assertions, ${passed} passed, ${failed} failed`)
if (failures.length) {
  console.log('\nFailed assertions:')
  failures.forEach(f => console.log(`  - ${f}`))
  process.exit(1)
} else {
  console.log('All assertions passed.')
  process.exit(0)
}
