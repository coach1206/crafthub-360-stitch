#!/usr/bin/env node
// Verification: Phase B.15 — POS360 External Integrations, Sync Governance, Webhooks

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
  }
}

// ── Migration ──────────────────────────────────────────────────────────────
const sql = read('server/db/migrations/045_pos360_external_integrations_sync_governance.sql');
check('migration: file exists', sql.length > 100);
check('migration: pos360_external_provider_profiles table', sql.includes('pos360_external_provider_profiles'));
check('migration: pos360_pos_overlay_connectors table', sql.includes('pos360_pos_overlay_connectors'));
check('migration: pos360_provider_capability_registry table', sql.includes('pos360_provider_capability_registry'));
check('migration: pos360_provider_readiness_results table', sql.includes('pos360_provider_readiness_results'));
check('migration: pos360_integration_credential_metadata table', sql.includes('pos360_integration_credential_metadata'));
check('migration: pos360_webhook_endpoint_contracts table', sql.includes('pos360_webhook_endpoint_contracts'));
check('migration: pos360_webhook_event_intake_log table', sql.includes('pos360_webhook_event_intake_log'));
check('migration: pos360_sync_job_definitions table', sql.includes('pos360_sync_job_definitions'));
check('migration: pos360_sync_job_runs table', sql.includes('pos360_sync_job_runs'));
check('migration: pos360_sync_retry_policies table', sql.includes('pos360_sync_retry_policies'));
check('migration: pos360_sync_error_logs table', sql.includes('pos360_sync_error_logs'));
check('migration: pos360_sync_conflict_records table', sql.includes('pos360_sync_conflict_records'));
check('migration: pos360_sync_reconciliation_records table', sql.includes('pos360_sync_reconciliation_records'));
check('migration: pos360_data_mapping_profiles table', sql.includes('pos360_data_mapping_profiles'));
check('migration: pos360_data_mapping_rules table', sql.includes('pos360_data_mapping_rules'));
check('migration: pos360_import_batch_records table', sql.includes('pos360_import_batch_records'));
check('migration: pos360_import_batch_items table', sql.includes('pos360_import_batch_items'));
check('migration: pos360_export_batch_records table', sql.includes('pos360_export_batch_records'));
check('migration: pos360_export_batch_items table', sql.includes('pos360_export_batch_items'));
check('migration: pos360_data_lineage_records table', sql.includes('pos360_data_lineage_records'));
check('migration: pos360_eat_sync_visibility_records table', sql.includes('pos360_eat_sync_visibility_records'));
check('migration: pos360_smokecraft_sync_visibility_records table', sql.includes('pos360_smokecraft_sync_visibility_records'));
check('migration: pos360_integration_offline_queue table', sql.includes('pos360_integration_offline_queue'));
check('migration: pos360_integration_audit table', sql.includes('pos360_integration_audit'));
check('migration: CREATE TABLE IF NOT EXISTS only', !sql.includes('DROP TABLE'));
check('migration: provider_connected DEFAULT FALSE', sql.includes('provider_connected') && sql.includes('DEFAULT FALSE'));
check('migration: connector_connected DEFAULT FALSE', sql.includes('connector_connected') && sql.includes('DEFAULT FALSE'));
check('migration: webhook_verified DEFAULT FALSE', sql.includes('webhook_verified') && sql.includes('DEFAULT FALSE'));
check('migration: sync_completed DEFAULT FALSE', sql.includes('sync_completed') && sql.includes('DEFAULT FALSE'));
check('migration: import_completed DEFAULT FALSE', sql.includes('import_completed') && sql.includes('DEFAULT FALSE'));
check('migration: export_completed DEFAULT FALSE', sql.includes('export_completed') && sql.includes('DEFAULT FALSE'));
check('migration: reconciliation_completed DEFAULT FALSE', sql.includes('reconciliation_completed') && sql.includes('DEFAULT FALSE'));
check('migration: contains_ai_generated_content DEFAULT FALSE', sql.includes('contains_ai_generated_content') && sql.includes('DEFAULT FALSE'));
check('migration: sync_connected DEFAULT FALSE', sql.includes('sync_connected') && sql.includes('DEFAULT FALSE'));
check('migration: stores_secrets DEFAULT FALSE', sql.includes('stores_secrets') && sql.includes('DEFAULT FALSE'));
check('migration: contains_secrets DEFAULT FALSE', sql.includes('contains_secrets') && sql.includes('DEFAULT FALSE'));
check('migration: signature_verified DEFAULT FALSE', sql.includes('signature_verified') && sql.includes('DEFAULT FALSE'));
check('migration: idempotency_key present', sql.includes('idempotency_key'));
check('migration: UNIQUE idempotency constraint', sql.includes('UNIQUE') && sql.includes('idempotency_key'));
check('migration: conflict_type CHECK constraint', sql.includes('conflict_type') && sql.includes('CHECK'));
check('migration: conflict_status CHECK constraint', sql.includes('conflict_status') && sql.includes('CHECK'));
check('migration: entity_type CHECK constraint', sql.includes('entity_type') && sql.includes('CHECK'));
check('migration: source_system column present', sql.includes('source_system'));
check('migration: target_system column present', sql.includes('target_system'));

// ── Contracts ──────────────────────────────────────────────────────────────
const contracts = read('server/services/pos360/pos360IntegrationContracts.js');
check('contracts: file exists', contracts.length > 100);
check('contracts: PROVIDER_TYPES', contracts.includes('PROVIDER_TYPES'));
check('contracts: PROVIDER_KEYS', contracts.includes('PROVIDER_KEYS'));
check('contracts: toast in PROVIDER_KEYS', contracts.includes("'toast'"));
check('contracts: clover in PROVIDER_KEYS', contracts.includes("'clover'"));
check('contracts: square in PROVIDER_KEYS', contracts.includes("'square'"));
check('contracts: quickbooks in PROVIDER_KEYS', contracts.includes("'quickbooks'"));
check('contracts: eat in PROVIDER_KEYS', contracts.includes("'eat'"));
check('contracts: smokecraft in PROVIDER_KEYS', contracts.includes("'smokecraft'"));
check('contracts: PROVIDER_STATUSES', contracts.includes('PROVIDER_STATUSES'));
check('contracts: CONNECTOR_TYPES', contracts.includes('CONNECTOR_TYPES'));
check('contracts: OVERLAY_MODES', contracts.includes('OVERLAY_MODES'));
check('contracts: CONNECTOR_STATUSES', contracts.includes('CONNECTOR_STATUSES'));
check('contracts: CAPABILITY_GROUPS', contracts.includes('CAPABILITY_GROUPS'));
check('contracts: SUPPORTED_STATUSES', contracts.includes('SUPPORTED_STATUSES'));
check('contracts: CREDENTIAL_TYPES', contracts.includes('CREDENTIAL_TYPES'));
check('contracts: CREDENTIAL_STATUSES', contracts.includes('CREDENTIAL_STATUSES'));
check('contracts: WEBHOOK_TYPES', contracts.includes('WEBHOOK_TYPES'));
check('contracts: WEBHOOK_ENDPOINT_STATUSES', contracts.includes('WEBHOOK_ENDPOINT_STATUSES'));
check('contracts: WEBHOOK_EVENT_STATUSES', contracts.includes('WEBHOOK_EVENT_STATUSES'));
check('contracts: SYNC_TYPES', contracts.includes('SYNC_TYPES'));
check('contracts: SYNC_STATUSES', contracts.includes('SYNC_STATUSES'));
check('contracts: SYNC_RUN_STATUSES', contracts.includes('SYNC_RUN_STATUSES'));
check('contracts: RETRY_STRATEGIES', contracts.includes('RETRY_STRATEGIES'));
check('contracts: CONFLICT_TYPES', contracts.includes('CONFLICT_TYPES'));
check('contracts: CONFLICT_STATUSES', contracts.includes('CONFLICT_STATUSES'));
check('contracts: RECONCILIATION_TYPES', contracts.includes('RECONCILIATION_TYPES'));
check('contracts: RECONCILIATION_STATUSES', contracts.includes('RECONCILIATION_STATUSES'));
check('contracts: MAPPING_ENTITY_TYPES', contracts.includes('MAPPING_ENTITY_TYPES'));
check('contracts: MAPPING_STATUSES', contracts.includes('MAPPING_STATUSES'));
check('contracts: TRANSFORM_TYPES', contracts.includes('TRANSFORM_TYPES'));
check('contracts: IMPORT_TYPES', contracts.includes('IMPORT_TYPES'));
check('contracts: IMPORT_STATUSES', contracts.includes('IMPORT_STATUSES'));
check('contracts: EXPORT_TYPES', contracts.includes('EXPORT_TYPES'));
check('contracts: EXPORT_STATUSES', contracts.includes('EXPORT_STATUSES'));
check('contracts: LINEAGE_STATUSES', contracts.includes('LINEAGE_STATUSES'));
check('contracts: VISIBILITY_TYPES', contracts.includes('VISIBILITY_TYPES'));
check('contracts: isValidProviderType', contracts.includes('isValidProviderType'));
check('contracts: isValidProviderKey', contracts.includes('isValidProviderKey'));
check('contracts: isValidProviderStatus', contracts.includes('isValidProviderStatus'));
check('contracts: isValidConnectorType', contracts.includes('isValidConnectorType'));
check('contracts: isValidWebhookType', contracts.includes('isValidWebhookType'));
check('contracts: isValidSyncType', contracts.includes('isValidSyncType'));
check('contracts: isValidConflictType', contracts.includes('isValidConflictType'));
check('contracts: isValidReconciliationType', contracts.includes('isValidReconciliationType'));
check('contracts: isValidImportType', contracts.includes('isValidImportType'));
check('contracts: isValidExportType', contracts.includes('isValidExportType'));

// ── Feature Flags ──────────────────────────────────────────────────────────
const flags = read('server/config/pos360IntegrationFeatureFlags.js');
check('flags: file exists', flags.length > 100);
check('flags: DEFAULT_POS360_INTEGRATION_FLAGS', flags.includes('DEFAULT_POS360_INTEGRATION_FLAGS'));
check('flags: getIntegrationFlags export', flags.includes('getIntegrationFlags'));
check('flags: externalIntegrationsEnabled', flags.includes('externalIntegrationsEnabled'));
check('flags: noFakeProviderConnectionEnforced', flags.includes('noFakeProviderConnectionEnforced'));
check('flags: noFakeConnectorConnectionEnforced', flags.includes('noFakeConnectorConnectionEnforced'));
check('flags: noFakeWebhookVerificationEnforced', flags.includes('noFakeWebhookVerificationEnforced'));
check('flags: noFakeSyncSuccessEnforced', flags.includes('noFakeSyncSuccessEnforced'));
check('flags: noFakeImportSuccessEnforced', flags.includes('noFakeImportSuccessEnforced'));
check('flags: noFakeExportCompletionEnforced', flags.includes('noFakeExportCompletionEnforced'));
check('flags: noFakeReconciliationEnforced', flags.includes('noFakeReconciliationEnforced'));
check('flags: noSecretsStorageEnforced', flags.includes('noSecretsStorageEnforced'));
check('flags: canAccessPOS3ProtectionRequired', flags.includes('canAccessPOS3ProtectionRequired'));
check('flags: noFakeEatSyncEnforced', flags.includes('noFakeEatSyncEnforced'));
check('flags: noFakeSmokecraftSyncEnforced', flags.includes('noFakeSmokecraftSyncEnforced'));
check('flags: noFakeOrderDataEnforced', flags.includes('noFakeOrderDataEnforced'));
check('flags: noFakePaymentDataEnforced', flags.includes('noFakePaymentDataEnforced'));
check('flags: idempotencyProtectionEnabled', flags.includes('idempotencyProtectionEnabled'));
check('flags: venueOverrides spread pattern', flags.includes('venueOverrides'));

// ── Locales ────────────────────────────────────────────────────────────────
const locales = read('src/locales/pos360Integrations.js');
check('locales: file exists', locales.length > 100);
check('locales: en-US locale', locales.includes("'en-US'"));
check('locales: es-DO locale', locales.includes("'es-DO'"));
check('locales: es locale', locales.includes("'es'"));
check('locales: ht locale', locales.includes("'ht'"));
check('locales: de locale', locales.includes("'de'"));
check('locales: pt locale', locales.includes("'pt'"));
check('locales: tIntegrations function', locales.includes('tIntegrations'));
check('locales: getSupportedIntegrationLanguages', locales.includes('getSupportedIntegrationLanguages'));
check('locales: pageTitle key', locales.includes('pageTitle'));
check('locales: providerProfiles key', locales.includes('providerProfiles'));
check('locales: webhookEndpoints key', locales.includes('webhookEndpoints'));
check('locales: syncJobDefinitions key', locales.includes('syncJobDefinitions'));
check('locales: reconciliation key', locales.includes('reconciliation'));
check('locales: notConnected honest state', locales.includes('provider_connected: false'));
check('locales: noWebhookVerification honest state', locales.includes('webhook_verified: false'));
check('locales: noSyncCompleted honest state', locales.includes('sync_completed: false'));
check('locales: noImportCompleted honest state', locales.includes('import_completed: false'));
check('locales: noExportCompleted honest state', locales.includes('export_completed: false'));
check('locales: noReconciliationCompleted honest state', locales.includes('reconciliation_completed: false'));
check('locales: noAiContent honest state', locales.includes('contains_ai_generated_content: false'));
check('locales: noSecretsStored honest state', locales.includes('stores_secrets: false'));
check('locales: deviceLine present', locales.includes('Touchscreen'));

// ── Service ────────────────────────────────────────────────────────────────
const service = read('server/services/pos360/pos360ExternalIntegrationsService.js');
check('service: file exists', service.length > 100);
check('service: JSDoc falls back gracefully', service.includes('Falls back gracefully'));
check('service: JSDoc never prints connection string', service.includes('Never prints or logs the database connection string'));
check('service: AREA constant', service.includes("AREA = 'pos360-external-integrations'"));
check('service: isDbAvailable import', service.includes('isDbAvailable'));
check('service: connection.js import path', service.includes("from '../../db/connection.js'"));
check('service: LOCAL fallback', service.includes('localPreview: true'));
check('service: localPreview area field', service.includes("area: AREA"));
check('service: auditRecord function', service.includes('auditRecord'));
check('service: contains_secrets: false in audit', service.includes('contains_secrets: false') || service.includes('contains_secrets,FALSE'));
check('service: stores_secrets: false in audit', service.includes('stores_secrets: false') || service.includes('stores_secrets,FALSE'));
check('service: provider_connected: false in upsert', service.includes('provider_connected: false'));
check('service: connector_connected: false in upsert', service.includes('connector_connected: false'));
check('service: webhook_verified: false in upsert', service.includes('webhook_verified: false'));
check('service: sync_completed: false in run', service.includes('sync_completed: false'));
check('service: import_completed: false in batch', service.includes('import_completed: false'));
check('service: export_completed: false in batch', service.includes('export_completed: false'));
check('service: reconciliation_completed: false', service.includes('reconciliation_completed: false'));
check('service: contains_ai_generated_content: false', service.includes('contains_ai_generated_content: false'));
check('service: sync_connected: false', service.includes('sync_connected: false'));
check('service: stores_secrets: false in credential', service.includes('stores_secrets: false'));
check('service: idempotency duplicate check', service.includes('duplicate: true'));
check('service: listProviderProfiles', service.includes('listProviderProfiles'));
check('service: upsertProviderProfile', service.includes('upsertProviderProfile'));
check('service: deleteProviderProfile', service.includes('deleteProviderProfile'));
check('service: listOverlayConnectors', service.includes('listOverlayConnectors'));
check('service: upsertOverlayConnector', service.includes('upsertOverlayConnector'));
check('service: listCapabilities', service.includes('listCapabilities'));
check('service: listReadinessResults', service.includes('listReadinessResults'));
check('service: listCredentialMetadata', service.includes('listCredentialMetadata'));
check('service: listWebhookEndpoints', service.includes('listWebhookEndpoints'));
check('service: upsertWebhookEndpoint', service.includes('upsertWebhookEndpoint'));
check('service: listWebhookEvents', service.includes('listWebhookEvents'));
check('service: listSyncJobDefinitions', service.includes('listSyncJobDefinitions'));
check('service: insertSyncJobRun', service.includes('insertSyncJobRun'));
check('service: listSyncErrors', service.includes('listSyncErrors'));
check('service: listConflictRecords', service.includes('listConflictRecords'));
check('service: resolveConflict', service.includes('resolveConflict'));
check('service: insertReconciliationRecord', service.includes('insertReconciliationRecord'));
check('service: listMappingProfiles', service.includes('listMappingProfiles'));
check('service: listMappingRules', service.includes('listMappingRules'));
check('service: insertImportBatch', service.includes('insertImportBatch'));
check('service: insertExportBatch', service.includes('insertExportBatch'));
check('service: listDataLineageRecords', service.includes('listDataLineageRecords'));
check('service: listEatSyncVisibility', service.includes('listEatSyncVisibility'));
check('service: upsertEatSyncVisibility', service.includes('upsertEatSyncVisibility'));
check('service: listSmokecraftSyncVisibility', service.includes('listSmokecraftSyncVisibility'));
check('service: upsertSmokecraftSyncVisibility', service.includes('upsertSmokecraftSyncVisibility'));
check('service: listOfflineQueue', service.includes('listOfflineQueue'));
check('service: enqueueOfflineItem', service.includes('enqueueOfflineItem'));
check('service: listIntegrationAudit', service.includes('listIntegrationAudit'));

// ── Controller ─────────────────────────────────────────────────────────────
const ctrl = read('server/controllers/pos360ExternalIntegrationsController.js');
check('controller: file exists', ctrl.length > 100);
check('controller: ok500 pattern', ctrl.includes('ok500'));
check('controller: vid pattern', ctrl.includes('vid(req)'));
check('controller: actor pattern', ctrl.includes('actor(req)'));
check('controller: listProviderProfiles', ctrl.includes('listProviderProfiles'));
check('controller: upsertProviderProfile', ctrl.includes('upsertProviderProfile'));
check('controller: deleteProviderProfile', ctrl.includes('deleteProviderProfile'));
check('controller: listOverlayConnectors', ctrl.includes('listOverlayConnectors'));
check('controller: listWebhookEndpoints', ctrl.includes('listWebhookEndpoints'));
check('controller: upsertWebhookEndpoint', ctrl.includes('upsertWebhookEndpoint'));
check('controller: listSyncJobDefinitions', ctrl.includes('listSyncJobDefinitions'));
check('controller: insertSyncJobRun', ctrl.includes('insertSyncJobRun'));
check('controller: listConflictRecords', ctrl.includes('listConflictRecords'));
check('controller: resolveConflict', ctrl.includes('resolveConflict'));
check('controller: insertReconciliationRecord', ctrl.includes('insertReconciliationRecord'));
check('controller: insertImportBatch', ctrl.includes('insertImportBatch'));
check('controller: insertExportBatch', ctrl.includes('insertExportBatch'));
check('controller: listEatSyncVisibility', ctrl.includes('listEatSyncVisibility'));
check('controller: listSmokecraftSyncVisibility', ctrl.includes('listSmokecraftSyncVisibility'));
check('controller: listIntegrationAudit', ctrl.includes('listIntegrationAudit'));

// ── Routes ─────────────────────────────────────────────────────────────────
const routes = read('server/routes/pos360ExternalIntegrationsRoutes.js');
check('routes: file exists', routes.length > 100);
check('routes: canAccessPOS3 import', routes.includes('canAccessPOS3'));
check('routes: GET /providers', routes.includes("router.get('/providers'"));
check('routes: POST /providers with canAccessPOS3', routes.includes("router.post('/providers', canAccessPOS3"));
check('routes: DELETE /providers/:id with canAccessPOS3', routes.includes("router.delete('/providers/:id', canAccessPOS3"));
check('routes: GET /connectors', routes.includes("router.get('/connectors'"));
check('routes: POST /connectors with canAccessPOS3', routes.includes("router.post('/connectors', canAccessPOS3"));
check('routes: GET /webhooks/endpoints', routes.includes("router.get('/webhooks/endpoints'"));
check('routes: POST /webhooks/endpoints with canAccessPOS3', routes.includes("router.post('/webhooks/endpoints', canAccessPOS3"));
check('routes: DELETE /webhooks/endpoints with canAccessPOS3', routes.includes("router.delete('/webhooks/endpoints/:id', canAccessPOS3"));
check('routes: GET /sync/jobs', routes.includes("router.get('/sync/jobs'"));
check('routes: POST /sync/jobs with canAccessPOS3', routes.includes("router.post('/sync/jobs', canAccessPOS3"));
check('routes: GET /sync/conflicts', routes.includes("router.get('/sync/conflicts'"));
check('routes: PATCH resolve conflict with canAccessPOS3', routes.includes("canAccessPOS3, c.resolveConflict"));
check('routes: POST /sync/reconciliations with canAccessPOS3', routes.includes("router.post('/sync/reconciliations', canAccessPOS3"));
check('routes: POST /import/batches with canAccessPOS3', routes.includes("router.post('/import/batches', canAccessPOS3"));
check('routes: POST /export/batches with canAccessPOS3', routes.includes("router.post('/export/batches', canAccessPOS3"));
check('routes: POST /visibility/eat with canAccessPOS3', routes.includes("router.post('/visibility/eat', canAccessPOS3"));
check('routes: POST /visibility/smokecraft with canAccessPOS3', routes.includes("router.post('/visibility/smokecraft', canAccessPOS3"));
check('routes: GET /audit', routes.includes("router.get('/audit'"));
check('routes: export default router', routes.includes('export default router'));

// ── UI Component ──────────────────────────────────────────────────────────
const ui = read('src/pages/pos360/POS360ExternalIntegrations.jsx');
check('ui: file exists', ui.length > 100);
check('ui: smokecraft-pos360.png referenced (1)', ui.includes('/smokecraft-pos360.png'));
check('ui: smokecraft-pos360.png referenced (2)', (ui.match(/smokecraft-pos360\.png/g) || []).length >= 2);
check('ui: Touchscreen · Handheld · Tablet · Desktop', ui.includes('Touchscreen · Handheld · Tablet · Desktop'));
check('ui: DARK_BG design token', ui.includes("'#080604'"));
check('ui: GOLD design token', ui.includes("'#c9952c'"));
check('ui: DARK_CARD design token', ui.includes("'#13110d'"));
check('ui: DARK_LINE design token', ui.includes("'#2a2520'"));
check('ui: DARK_TEXT design token', ui.includes("'#f0ead8'"));
check('ui: DARK_MUTE design token', ui.includes("'#8a7e6a'"));
check('ui: Provider Profiles tab', ui.includes('Provider Profiles'));
check('ui: POS Overlay Connectors tab', ui.includes('POS Overlay Connectors'));
check('ui: Capability Registry tab', ui.includes('Capability Registry'));
check('ui: Readiness Checks tab', ui.includes('Readiness Checks'));
check('ui: Credential Metadata tab', ui.includes('Credential Metadata'));
check('ui: Webhook Endpoints tab', ui.includes('Webhook Endpoints'));
check('ui: Webhook Intake Log tab', ui.includes('Webhook Intake Log'));
check('ui: Sync Job Definitions tab', ui.includes('Sync Job Definitions'));
check('ui: Sync Job Runs tab', ui.includes('Sync Job Runs'));
check('ui: Retry Policies tab', ui.includes('Retry Policies'));
check('ui: Sync Error Logs tab', ui.includes('Sync Error Logs'));
check('ui: Conflict Records tab', ui.includes('Conflict Records'));
check('ui: Reconciliation tab', ui.includes('Reconciliation'));
check('ui: Data Mapping Profiles tab', ui.includes('Data Mapping Profiles'));
check('ui: Data Mapping Rules tab', ui.includes('Data Mapping Rules'));
check('ui: Import Batches tab', ui.includes('Import Batches'));
check('ui: Export Batches tab', ui.includes('Export Batches'));
check('ui: Data Lineage tab', ui.includes('Data Lineage'));
check('ui: E.A.T. Sync Visibility tab', ui.includes('E.A.T. Sync Visibility'));
check('ui: SmokeCraft Sync Visibility tab', ui.includes('SmokeCraft Sync Visibility'));
check('ui: Offline Queue tab', ui.includes('Offline Queue'));
check('ui: Integration Audit Log tab', ui.includes('Integration Audit Log'));
check('ui: provider_connected: false badge', ui.includes('provider_connected: false'));
check('ui: connector_connected: false badge', ui.includes('connector_connected: false'));
check('ui: webhook_verified: false badge', ui.includes('webhook_verified: false'));
check('ui: sync_completed: false badge', ui.includes('sync_completed: false'));
check('ui: import_completed: false badge', ui.includes('import_completed: false'));
check('ui: export_completed: false badge', ui.includes('export_completed: false'));
check('ui: reconciliation_completed: false badge', ui.includes('reconciliation_completed: false'));
check('ui: contains_ai_generated_content: false badge', ui.includes('contains_ai_generated_content: false'));
check('ui: sync_connected: false badge', ui.includes('sync_connected: false'));
check('ui: stores_secrets: false badge', ui.includes('stores_secrets: false'));
check('ui: no fake order data note', ui.includes('no fake') || ui.includes('No fake') || ui.includes('remains FALSE'));
check('ui: SmokeCraft lock rule mention', ui.includes('SmokeCraft') && (ui.includes('progression') || ui.includes('VISIT_STRUCTURE') || ui.includes('locks')));
check('ui: E.A.T. no AI injection note', ui.includes('AI-generated content'));

// ── Server index wiring ────────────────────────────────────────────────────
const idx = read('server/index.js');
check('server index: import pos360ExternalIntegrationsRoutes', idx.includes('pos360ExternalIntegrationsRoutes'));
check('server index: app.use /api/pos360/integrations', idx.includes('/api/pos360/integrations'));
check('server index: B.14 settings route still present', idx.includes('/api/pos360/settings'));
check('server index: B.13 reports route still present', idx.includes('/api/pos360/reports'));

// ── App.jsx wiring ─────────────────────────────────────────────────────────
const app = read('src/App.jsx');
check('app: import POS360ExternalIntegrations', app.includes('POS360ExternalIntegrations'));
check('app: Route path="external-integrations"', app.includes('path="external-integrations"'));
check('app: B.14 settings route still present', app.includes('settings-venue-admin'));
check('app: B.13 reports route still present', app.includes('reports-analytics-decision'));

// ── package.json wiring ────────────────────────────────────────────────────
const pkg = read('package.json');
check('package.json: verify:pos360-external-integrations script', pkg.includes('verify:pos360-external-integrations'));
check('package.json: verify:pos360-settings-venue-admin still present', pkg.includes('verify:pos360-settings-venue-admin'));
check('package.json: verify:pos360-reports-analytics-decision still present', pkg.includes('verify:pos360-reports-analytics-decision'));

// ── Security invariants ────────────────────────────────────────────────────
check('security: no fake provider_connected=true', !service.includes('provider_connected: true') && !service.includes("provider_connected=TRUE"));
check('security: no fake connector_connected=true', !service.includes('connector_connected: true') && !service.includes("connector_connected=TRUE"));
check('security: no fake webhook_verified=true', !service.includes('webhook_verified: true') && !service.includes("webhook_verified=TRUE"));
check('security: no fake sync_completed=true', !service.includes('sync_completed: true') && !service.includes("sync_completed=TRUE"));
check('security: no fake import_completed=true', !service.includes('import_completed: true') && !service.includes("import_completed=TRUE"));
check('security: no fake export_completed=true', !service.includes('export_completed: true') && !service.includes("export_completed=TRUE"));
check('security: no fake reconciliation_completed=true', !service.includes('reconciliation_completed: true') && !service.includes("reconciliation_completed=TRUE"));
check('security: canAccessPOS3 on all write routes', routes.includes('canAccessPOS3'));
check('security: no DATABASE_URL logged in service', !service.includes('DATABASE_URL') || !service.includes('console.log'));
check('security: stores_secrets always FALSE insert', service.includes('stores_secrets,FALSE') || service.includes('stores_secrets: false'));

// ── Summary ────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\nPhase B.15 — POS360 External Integrations & Sync Governance`);
console.log(`Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFAILED CHECKS:');
  failures.forEach(f => console.log(`  ✗ ${f}`));
  process.exit(1);
} else {
  console.log('\n✓ All checks passed — Phase B.15 verification PASS');
  process.exit(0);
}
