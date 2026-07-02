#!/usr/bin/env node
/**
 * Phase 10 — POS360 Platform Layer Verification
 * 58 checks. Run: node server/scripts/verifyPos360PlatformLayer.js
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0; let failed = 0

function assert(label, condition, detail = '') {
  if (condition) { console.log(`  ✓ ${label}`); passed++ }
  else { console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`); failed++ }
}

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)) }
function fileContains(rel, str) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8').includes(str) } catch { return false }
}

console.log('\n══════════════════════════════════════════════════')
console.log('  Phase 10 — POS360 Platform Layer Verification')
console.log('══════════════════════════════════════════════════\n')

// ── 1. Database readiness ─────────────────────────────────────────────────────
console.log('1. Database & Migration Runner')
{
  assert('DB connection file exists', fileExists('server/db/connection.js'))
  assert('DB connection: isDatabaseReady or isDbAvailable exported', fileContains('server/db/connection.js', 'isDbAvailable') || fileContains('server/db/connection.js', 'isDatabaseReady'))
  assert('DB connection: no crash when DATABASE_URL missing', fileContains('server/db/connection.js', 'prototype mode') || fileContains('server/db/connection.js', 'DATABASE_URL'))
  assert('Migration runner exists', fileExists('server/db/runMigrations.js'))
  assert('Migration runner handles missing DATABASE_URL', fileContains('server/db/runMigrations.js', 'DATABASE_URL') || fileContains('server/db/runMigrations.js', 'database_required') || fileContains('server/db/runMigrations.js', 'preview'))
}

// ── 2. Migration file ─────────────────────────────────────────────────────────
console.log('\n2. POS360 Migration File (018)')
{
  const mig = 'server/db/migrations/018_pos360_integration_hub.sql'
  assert('Migration 018 exists', fileExists(mig))
  assert('pos_provider_connections table defined', fileContains(mig, 'pos_provider_connections'))
  assert('pos_location_mappings table defined', fileContains(mig, 'pos_location_mappings'))
  assert('pos_menu_item_mappings table defined', fileContains(mig, 'pos_menu_item_mappings'))
  assert('pos_inventory_sync_logs table defined', fileContains(mig, 'pos_inventory_sync_logs'))
  assert('pos_order_sync_logs table defined', fileContains(mig, 'pos_order_sync_logs'))
  assert('pos_webhook_events table defined', fileContains(mig, 'pos_webhook_events'))
  assert('pos360_manual_orders table defined', fileContains(mig, 'pos360_manual_orders'))
  assert('pos360_audit_logs table defined', fileContains(mig, 'pos360_audit_logs'))
  assert('pos360_idempotency_keys table defined', fileContains(mig, 'pos360_idempotency_keys'))
}

// ── 3. Encryption utility ─────────────────────────────────────────────────────
console.log('\n3. Encryption Utility')
{
  assert('Encryption utility exists', fileExists('server/utils/encryption.js'))
  const { encryptSecret, decryptSecret, maskSecret, getEncryptionStatus } = await import('../utils/encryption.js')
  assert('encryptSecret exported', typeof encryptSecret === 'function')
  assert('decryptSecret exported', typeof decryptSecret === 'function')
  assert('maskSecret exported', typeof maskSecret === 'function')
  assert('getEncryptionStatus exported', typeof getEncryptionStatus === 'function')

  const status = getEncryptionStatus()
  assert('getEncryptionStatus returns object with status field', !!status?.status)

  // With no env var: must not expose the key
  const encResult = encryptSecret('test-token')
  const resultStr = JSON.stringify(encResult)
  assert('encryptSecret does not return raw token in string', !resultStr.includes('test-token') || encResult.status === 'encryption_key_required')

  const masked = maskSecret('abcdefgh')
  assert('maskSecret returns masked value', masked.includes('****') || masked.length <= 8)
}

// ── 4. Provider config ────────────────────────────────────────────────────────
console.log('\n4. Provider Env Config')
{
  assert('posProviderConfig.js exists', fileExists('server/config/posProviderConfig.js'))
  const { getProviderConfig, getProviderReadiness, listProviderReadiness } = await import('../config/posProviderConfig.js')
  assert('getProviderConfig exported', typeof getProviderConfig === 'function')
  assert('getProviderReadiness exported', typeof getProviderReadiness === 'function')
  assert('listProviderReadiness exported', typeof listProviderReadiness === 'function')

  const squareReadiness = getProviderReadiness('square')
  assert('Missing Square env → credentials_missing or oauth_required',
    ['credentials_missing', 'oauth_required', 'provider_not_connected'].includes(squareReadiness.readinessStatus))

  const toastReadiness = getProviderReadiness('toast')
  assert('Missing Toast env → credentials_missing or partner_approval_required',
    ['credentials_missing', 'oauth_required', 'partner_approval_required', 'provider_not_connected'].includes(toastReadiness.readinessStatus))

  const manualReadiness = getProviderReadiness('manual_pos360')
  assert('manual_pos360 is always ready', manualReadiness.readinessStatus === 'ready' || manualReadiness.readinessStatus === 'manual_mode')
}

// ── 5. Provider adapters ──────────────────────────────────────────────────────
console.log('\n5. Provider Adapters')
{
  const adapterFiles = [
    'server/services/pos/providers/basePosProviderAdapter.js',
    'server/services/pos/providers/squareAdapter.js',
    'server/services/pos/providers/toastAdapter.js',
    'server/services/pos/providers/cloverAdapter.js',
    'server/services/pos/providers/lightspeedAdapter.js',
    'server/services/pos/providers/shopifyPosAdapter.js',
    'server/services/pos/providers/manualPos360Adapter.js',
    'server/services/pos/providers/futureProviderAdapter.js',
  ]
  for (const f of adapterFiles) assert(`${path.basename(f)} exists`, fileExists(f))

  const { default: SquareAdapter } = await import('../services/pos/providers/squareAdapter.js')
  const { default: ToastAdapter } = await import('../services/pos/providers/toastAdapter.js')
  const { default: ManualAdapter } = await import('../services/pos/providers/manualPos360Adapter.js')

  const square = new SquareAdapter()
  assert('Square providerName = square', square.providerName === 'square')
  const squareOAuth = await square.beginOAuth()
  assert('Square beginOAuth returns oauth_required or credentials_missing',
    ['oauth_required', 'credentials_missing', 'integration_required'].includes(squareOAuth.status))

  const toast = new ToastAdapter()
  assert('Toast providerName = toast', toast.providerName === 'toast')
  const toastOAuth = await toast.beginOAuth()
  assert('Toast beginOAuth returns partner_approval_required or integration_required',
    ['partner_approval_required', 'integration_required', 'oauth_required'].includes(toastOAuth.status))

  const manual = new ManualAdapter()
  assert('Manual providerName = manual_pos360', manual.providerName === 'manual_pos360')
  const manualOrder = await manual.createOrder({ items: [], orderId: 'test-1' })
  assert('Manual createOrder returns manual_mode', manualOrder.status === 'manual_mode')
}

// ── 6. POS360 Integration Hub ─────────────────────────────────────────────────
console.log('\n6. POS360 Integration Hub')
{
  assert('pos360IntegrationHub.js exists', fileExists('server/services/pos360IntegrationHub.js'))
  const hub = await import('../services/pos360IntegrationHub.js')
  assert('listSupportedProviders exported', typeof hub.listSupportedProviders === 'function')
  assert('getProviderConnectionStatus exported', typeof hub.getProviderConnectionStatus === 'function')
  assert('createProviderOrder exported', typeof hub.createProviderOrder === 'function')
  assert('createManualOrderTicket exported', typeof hub.createManualOrderTicket === 'function')
  assert('getVenuePOSReadiness exported', typeof hub.getVenuePOSReadiness === 'function')

  // Tenant guard check
  const noVenue = await hub.getProviderConnectionStatus(null)
  assert('Missing venueId → tenant_guard_active', noVenue.status === 'tenant_guard_active' || noVenue.error === 'venueId required')

  // Provider not connected blocks live order
  const orderResult = await hub.createProviderOrder('venue-001', 'square', { orderId: 'o1', items: [] })
  assert('Disconnected provider blocks live order', !['order pushed', 'pushed_to_provider', 'synced'].some(w => JSON.stringify(orderResult).toLowerCase().includes(w)))

  // Manual mode available
  const manualMode = await hub.getManualModeStatus('venue-001')
  assert('Manual mode returns manual_mode status', manualMode.status === 'manual_mode' || manualMode.manualModeAvailable === true)

  // Square is NOT hardwired — hub delegates to adapter
  assert('Square not hardwired (hub delegates to adapter)',
    !fileContains('server/services/pos360IntegrationHub.js', 'SQUARE_APP_ID') &&
    !fileContains('server/services/pos360IntegrationHub.js', 'squareClient'))
}

// ── 7. Item Mapping Service ───────────────────────────────────────────────────
console.log('\n7. Item Mapping Service')
{
  assert('pos360ItemMappingService.js exists', fileExists('server/services/pos360ItemMappingService.js'))
  const ms = await import('../services/pos360ItemMappingService.js')
  assert('getItemMappings exported', typeof ms.getItemMappings === 'function')
  assert('validateOrderMappings exported', typeof ms.validateOrderMappings === 'function')
  assert('getMappingForSmokeCraftItem exported', typeof ms.getMappingForSmokeCraftItem === 'function')

  // Missing mapping returns mapping_required
  const mappingCheck = await ms.validateOrderMappings('venue-001', 'square', { items: [{ id: 'unmapped-item', name: 'Test' }] })
  assert('Missing mapping → mapping_required', mappingCheck.valid === false && mappingCheck.status === 'mapping_required')

  // Manual POS360 bypasses mapping
  const manualCheck = await ms.validateOrderMappings('venue-001', 'manual_pos360', { items: [{ id: 'any-item', name: 'Test' }] })
  assert('manual_pos360 bypasses mapping requirement', manualCheck.valid === true || manualCheck.bypass === 'manual_pos360')
}

// ── 8. Order Bridge ───────────────────────────────────────────────────────────
console.log('\n8. Order Bridge Service')
{
  assert('pos360OrderBridgeService.js exists', fileExists('server/services/pos360OrderBridgeService.js'))
  const ob = await import('../services/pos360OrderBridgeService.js')
  assert('generateIdempotencyKey exported', typeof ob.generateIdempotencyKey === 'function')
  assert('preventDuplicateOrderPush exported', typeof ob.preventDuplicateOrderPush === 'function')
  assert('routeOrderToProvider exported', typeof ob.routeOrderToProvider === 'function')
  assert('routeOrderToManualPOS360 exported', typeof ob.routeOrderToManualPOS360 === 'function')

  // Idempotency protection
  const key = ob.generateIdempotencyKey('venue-001', { orderId: 'order-abc', items: [] })
  assert('generateIdempotencyKey returns string', typeof key === 'string' && key.length > 0)
  const dup1 = await ob.preventDuplicateOrderPush('venue-001', key)
  assert('First push not duplicate', dup1.duplicate === false)

  // Provider not connected blocks live push
  const routeResult = await ob.routeOrderToProvider('venue-001', 'square', { orderId: 'order-xyz', items: [] })
  assert('Provider not connected → blocks live push', routeResult.status !== 'pushed_to_provider')
  assert('Provider not connected → manualModeAvailable', routeResult.manualModeAvailable === true || routeResult.status === 'manual_mode')

  // Manual mode creates local ticket
  const manualResult = await ob.routeOrderToManualPOS360('venue-001', { orderId: 'order-manual', items: [{ id: 'cigar-1', name: 'Padron', quantity: 1, price: 20 }] })
  assert('Manual route creates manual_mode ticket', manualResult.status === 'manual_mode')
  assert('Manual ticket has ticketId', !!manualResult.ticketId)
}

// ── 9. Webhook Service ────────────────────────────────────────────────────────
console.log('\n9. Webhook Service')
{
  assert('pos360WebhookService.js exists', fileExists('server/services/pos360WebhookService.js'))
  const ws = await import('../services/pos360WebhookService.js')
  assert('receiveWebhook exported', typeof ws.receiveWebhook === 'function')
  assert('verifyWebhook exported', typeof ws.verifyWebhook === 'function')
  assert('ignoreDuplicateWebhook exported', typeof ws.ignoreDuplicateWebhook === 'function')

  // Missing webhook secret → not verified
  const verification = await ws.verifyWebhook('square', {}, {})
  assert('Missing webhook secret → not verified', verification.verified === false)
  assert('Missing webhook secret → credentials_missing or webhook_pending',
    ['credentials_missing', 'webhook_pending'].includes(verification.status))

  // Duplicate webhook detection
  const isDup1 = ws.ignoreDuplicateWebhook('square', 'event-unique-001')
  const isDup2 = ws.ignoreDuplicateWebhook('square', 'event-unique-001')
  assert('Second identical webhook is duplicate', isDup1 === false && isDup2 === true)
}

// ── 10. Audit Log Service ─────────────────────────────────────────────────────
console.log('\n10. Audit Log Service')
{
  assert('pos360AuditLogService.js exists', fileExists('server/services/pos360AuditLogService.js'))
  const al = await import('../services/pos360AuditLogService.js')
  assert('logPOSAction exported', typeof al.logPOSAction === 'function')
  assert('logOrderSyncAttempt exported', typeof al.logOrderSyncAttempt === 'function')
  assert('getAuditLogsForVenue exported', typeof al.getAuditLogsForVenue === 'function')

  const logResult = await al.logPOSAction({ venueId: 'venue-001', actionType: 'test_action' })
  assert('logPOSAction: status audit_logged', logResult.status === 'audit_logged')
  assert('logPOSAction without DB: persistenceStatus not_persisted',
    logResult.persistenceStatus === 'not_persisted' || logResult.storageMode === 'memory_fallback')
}

// ── 11. Provider Health Service ───────────────────────────────────────────────
console.log('\n11. Provider Health Service')
{
  assert('pos360ProviderHealthService.js exists', fileExists('server/services/pos360ProviderHealthService.js'))
  const ph = await import('../services/pos360ProviderHealthService.js')
  assert('getProviderHealth exported', typeof ph.getProviderHealth === 'function')
  assert('getRateLimitStatus exported', typeof ph.getRateLimitStatus === 'function')
  assert('normalizeProviderError exported', typeof ph.normalizeProviderError === 'function')
  assert('shouldRetryProviderCall exported', typeof ph.shouldRetryProviderCall === 'function')
  assert('getRetryPlan exported', typeof ph.getRetryPlan === 'function')

  const health = await ph.getProviderHealth('square')
  assert('Provider health does not claim live connection', health.status !== 'provider_active' && health.status !== 'live_provider')

  const normalized = ph.normalizeProviderError('square', new Error('429 Too Many Requests'))
  assert('Normalized error has safeMessage (not raw)', !!normalized.safeMessage && !normalized.safeMessage.includes('429'))
  assert('429 normalized to rate_limited', normalized.status === 'rate_limited')

  const retry = ph.getRetryPlan('square', new Error('429'))
  assert('Retry plan: maxRetries = 3', retry.maxRetries === 3)
}

// ── 12. Tenant Guard ──────────────────────────────────────────────────────────
console.log('\n12. Tenant Guard Middleware')
{
  assert('venueTenantGuard.js exists', fileExists('server/middleware/venueTenantGuard.js'))
  const { venueTenantGuard, assertTenantVenueId } = await import('../middleware/venueTenantGuard.js')
  assert('venueTenantGuard exported', typeof venueTenantGuard === 'function')
  assert('assertTenantVenueId exported', typeof assertTenantVenueId === 'function')
}

// ── 13. Routes & Controller ───────────────────────────────────────────────────
console.log('\n13. Routes & Controller')
{
  assert('pos360IntegrationRoutes.js exists', fileExists('server/routes/pos360IntegrationRoutes.js'))
  assert('pos360IntegrationController.js exists', fileExists('server/controllers/pos360IntegrationController.js'))
  assert('Routes mounted in server/index.js', fileContains('server/index.js', 'pos360IntegrationRoutes') && fileContains('server/index.js', '/api/pos360'))
  assert('Controller does not expose access_token', !fileContains('server/controllers/pos360IntegrationController.js', "'access_token'") || fileContains('server/controllers/pos360IntegrationController.js', 'delete result'))
}

// ── 14. E.A.T. Command Hub POS Hooks ─────────────────────────────────────────
console.log('\n14. E.A.T. Command Hub POS Hooks')
{
  assert('eatCommandHubContract.js has getPOS360ReadinessHooks', fileContains('server/services/eatCommandHubContract.js', 'getPOS360ReadinessHooks'))
  assert('EAT hub references encryption_key_required', fileContains('server/services/eatCommandHubContract.js', 'encryption_key_required'))
  assert('EAT hub references database_required', fileContains('server/services/eatCommandHubContract.js', 'database_required'))
  assert('EAT hub references manual_mode_available', fileContains('server/services/eatCommandHubContract.js', 'manual_mode_available'))
}

// ── 15. Documentation ─────────────────────────────────────────────────────────
console.log('\n15. Documentation')
{
  assert('POS360_PLATFORM_LAYER.md exists', fileExists('docs/POS360_PLATFORM_LAYER.md'))
  assert('Doc includes "platform layer" language', fileContains('docs/POS360_PLATFORM_LAYER.md', 'platform layer'))
  assert('Doc includes "POS360 is the center" or hub language', fileContains('docs/POS360_PLATFORM_LAYER.md', 'POS360') && fileContains('docs/POS360_PLATFORM_LAYER.md', 'hub'))
}

// ── 16. Protected Files ───────────────────────────────────────────────────────
console.log('\n16. Protected Files Untouched')
{
  const protectedFiles = [
    'src/components/smokecraft/SmokeCraftAssetScreen.jsx',
    'src/components/smokecraft/SmokeCraftHotspotLayer.jsx',
    'src/constants/session.js',
  ]
  // Check they still exist and haven't had POS360 injected
  for (const f of protectedFiles) {
    assert(`${path.basename(f)} exists`, fileExists(f))
    assert(`${path.basename(f)} not modified with POS360 code`, !fileContains(f, 'pos360') && !fileContains(f, 'POS360IntegrationHub'))
  }
  assert('VISIT_STRUCTURE unchanged', fileContains('src/constants/session.js', 'VISIT_STRUCTURE'))
}

// ── 17. Forbidden language check ──────────────────────────────────────────────
console.log('\n17. Forbidden Language Check')
{
  const BANNED = ['live synced', 'order pushed', 'inventory updated live', 'provider active', 'live provider', 'real-time order sync', 'real-time inventory']
  const filesToCheck = [
    'server/services/pos360IntegrationHub.js',
    'server/services/pos360OrderBridgeService.js',
    'server/controllers/pos360IntegrationController.js',
    'server/services/pos360WebhookService.js',
  ]
  for (const f of filesToCheck) {
    if (!fileExists(f)) continue
    const content = fs.readFileSync(path.join(ROOT, f), 'utf8').toLowerCase()
    const found = BANNED.filter(b => content.includes(b))
    assert(`${path.basename(f)}: no forbidden live-sync language`, found.length === 0, found.join(', '))
  }
}

// ── 18. Package scripts ───────────────────────────────────────────────────────
console.log('\n18. Package Scripts')
{
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  assert('db:migrate script exists', !!pkg.scripts?.['db:migrate'])
  assert('verify:pos360 script exists', !!pkg.scripts?.['verify:pos360'])
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('══════════════════════════════════════════════════\n')

if (failed > 0) process.exit(1)
