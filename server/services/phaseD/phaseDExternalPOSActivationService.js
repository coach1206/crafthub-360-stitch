/**
 * Phase D.3 External POS Activation Service
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * contains_secrets: false, stores_secrets: false
 */

import { isDbAvailable } from '../../db/connection.js';
import {
  assertNoExternalPOSSecretsInPayload,
  assertNoFakeExternalPOSConnectedStatus,
  assertNoFakeExternalPOSSyncClaim,
  validateExternalPOSProviderKey,
  validateExternalPOSModeKey,
  validateExternalPOSStatus,
  EXTERNAL_POS_PROVIDER_KEYS,
} from './phaseDExternalPOSContracts.js';

const AREA = 'phase_d_external_pos_activation';

const localFallback = (extra = {}) => ({
  ok: false,
  localPreview: true,
  error: 'database_not_configured',
  area: AREA,
  ...extra,
});

function requireIdempotency(key) {
  if (!key || typeof key !== 'string' || !key.trim()) {
    throw Object.assign(new Error('idempotency_key_required'), { code: 'idempotency_key_required' });
  }
}

async function getDb() {
  const mod = await import('../../db/connection.js');
  return mod.default;
}

async function createRecord(tableName, payload, actorUserId, idempotencyKey) {
  const db = await getDb();
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  const n = fields.length;
  const cols = [...fields, 'created_by', 'idempotency_key'].join(', ');
  const placeholders = [...fields.map((_, i) => `$${i + 1}`), `$${n + 1}`, `$${n + 2}`].join(', ');
  const sql = `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders}) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`;
  const result = await db.query(sql, [...values, actorUserId, idempotencyKey]);
  return result.rows[0] || null;
}

async function listRecords(tableName, filters = {}) {
  const db = await getDb();
  const conditions = Object.entries(filters).map(([k, _], i) => `${k} = $${i + 1}`);
  const values = Object.values(filters);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(`SELECT * FROM ${tableName} ${where} ORDER BY created_at DESC`, values);
  return result.rows;
}

function getDefaultProviders() {
  return EXTERNAL_POS_PROVIDER_KEYS.map(key => ({
    provider_key: key,
    provider_status: 'not_started',
    connected: false,
    api_sync_enabled: false,
    webhook_enabled: false,
    live_mode_enabled: false,
    contains_secrets: false,
    stores_secrets: false,
  }));
}

// --- Provider Registry ---

export async function listExternalPOSProviders() {
  if (!isDbAvailable()) return { ok: true, data: getDefaultProviders(), localPreview: true };
  try {
    const rows = await listRecords('external_pos_provider_registry');
    return { ok: true, data: rows.length ? rows : getDefaultProviders() };
  } catch (e) {
    return localFallback({ data: getDefaultProviders() });
  }
}

export async function getExternalPOSProvider(providerKey) {
  if (!validateExternalPOSProviderKey(providerKey)) return { ok: false, error: `invalid provider_key: ${providerKey}` };
  if (!isDbAvailable()) {
    const p = getDefaultProviders().find(r => r.provider_key === providerKey);
    return { ok: true, data: p || null, localPreview: true };
  }
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM external_pos_provider_registry WHERE provider_key = $1', [providerKey]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function getExternalPOSProviderStatus(providerKey) {
  if (!validateExternalPOSProviderKey(providerKey)) return { ok: false, error: `invalid provider_key: ${providerKey}` };
  if (!isDbAvailable()) return { ok: true, data: { provider_key: providerKey, current_status: 'not_started', connected: false, live_mode_enabled: false }, localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM external_pos_provider_status WHERE provider_key = $1', [providerKey]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function getExternalPOSModes() {
  return {
    ok: true,
    data: [
      { mode_key: 'companion_mode', label: 'Companion Mode', api_sync_required: false, live_mode_required: false },
      { mode_key: 'export_import_mode', label: 'Export / Import Mode', api_sync_required: false, live_mode_required: false },
      { mode_key: 'api_contract_mode', label: 'API Contract Mode', api_sync_required: true, live_mode_required: true },
      { mode_key: 'manual_mapping_mode', label: 'Manual Mapping Mode', api_sync_required: false, live_mode_required: false },
      { mode_key: 'hybrid_mode', label: 'Hybrid Mode', api_sync_required: false, live_mode_required: false },
    ],
  };
}

export async function getExternalPOSCapabilities(providerKey) {
  if (!validateExternalPOSProviderKey(providerKey)) return { ok: false, error: `invalid provider_key: ${providerKey}` };
  const capabilityMap = {
    toast:               ['companion_mode', 'csv_export_import', 'api_sync', 'manual_mapping'],
    clover:              ['companion_mode', 'csv_export_import', 'api_sync', 'manual_mapping'],
    square_pos:          ['companion_mode', 'csv_export_import', 'api_sync', 'manual_mapping'],
    lightspeed:          ['companion_mode', 'csv_export_import', 'api_sync', 'manual_mapping'],
    shopify_pos:         ['companion_mode', 'csv_export_import', 'api_sync', 'manual_mapping'],
    spoton:              ['companion_mode', 'csv_export_import', 'manual_mapping'],
    touchbistro:         ['companion_mode', 'csv_export_import', 'manual_mapping'],
    revel:               ['companion_mode', 'csv_export_import', 'manual_mapping'],
    generic_csv:         ['csv_export_import', 'manual_mapping'],
    manual_pos_companion:['companion_mode', 'manual_mapping'],
    future_pos_provider: [],
  };
  return { ok: true, data: { provider_key: providerKey, capabilities: capabilityMap[providerKey] || [], all_live: false } };
}

// --- Credential Presence Status ---

export async function getExternalPOSCredentialPresenceStatus(providerKey) {
  if (!validateExternalPOSProviderKey(providerKey)) return { ok: false, error: `invalid provider_key: ${providerKey}` };
  if (!isDbAvailable()) return { ok: true, data: { provider_key: providerKey, presence_status: 'absent', stores_raw_keys: false, stores_api_secret: false }, localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM external_pos_credentials_status WHERE provider_key = $1', [providerKey]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function recordExternalPOSCredentialPresenceStatus(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!validateExternalPOSProviderKey(payload.provider_key)) return { ok: false, error: `invalid provider_key: ${payload.provider_key}` };
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('external_pos_credentials_status', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Companion Mode ---

export async function listCompanionModeProfiles(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_companion_mode_profiles', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function createCompanionModeProfile(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  assertNoFakeExternalPOSConnectedStatus(payload);
  if (!validateExternalPOSProviderKey(payload.provider_key)) return { ok: false, error: `invalid provider_key: ${payload.provider_key}` };
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_companion_mode_profiles', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function updateCompanionModeProfile(id, payload, actorUserId) {
  assertNoExternalPOSSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const sets = Object.keys(payload).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const r = await db.query(`UPDATE external_pos_companion_mode_profiles SET ${sets}, updated_at = NOW() WHERE id = $${Object.keys(payload).length + 1} RETURNING *`, [...Object.values(payload), id]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) { return { ok: false, error: e.message }; }
}

// --- Import Profiles ---

export async function listImportProfiles(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_import_profiles', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function createImportProfile(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!validateExternalPOSProviderKey(payload.provider_key)) return { ok: false, error: `invalid provider_key: ${payload.provider_key}` };
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_import_profiles', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function updateImportProfile(id, payload, actorUserId) {
  assertNoExternalPOSSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const sets = Object.keys(payload).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const r = await db.query(`UPDATE external_pos_import_profiles SET ${sets}, updated_at = NOW() WHERE id = $${Object.keys(payload).length + 1} RETURNING *`, [...Object.values(payload), id]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) { return { ok: false, error: e.message }; }
}

// --- CSV Templates ---

export async function listCSVImportTemplates(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_csv_import_templates', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function createCSVImportTemplate(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_csv_import_templates', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function updateCSVImportTemplate(id, payload, actorUserId) {
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const sets = Object.keys(payload).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const r = await db.query(`UPDATE external_pos_csv_import_templates SET ${sets}, updated_at = NOW() WHERE id = $${Object.keys(payload).length + 1} RETURNING *`, [...Object.values(payload), id]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) { return { ok: false, error: e.message }; }
}

// --- Import Batches ---

export async function createImportBatch(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!validateExternalPOSProviderKey(payload.provider_key)) return { ok: false, error: `invalid provider_key: ${payload.provider_key}` };
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_import_batches', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function listImportBatches(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_import_batches', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function getImportBatch(id) {
  if (!isDbAvailable()) return { ok: true, data: null, localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM external_pos_import_batches WHERE id = $1', [id]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) { return localFallback(); }
}

export async function createImportBatchItem(payload, actorUserId) {
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const r = await db.query('INSERT INTO external_pos_import_batch_items (batch_id, item_type, raw_data, mapped_data) VALUES ($1, $2, $3, $4) RETURNING *', [payload.batch_id, payload.item_type, payload.raw_data || {}, payload.mapped_data || {}]);
    return { ok: true, data: r.rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listImportBatchItems(batchId) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_import_batch_items', { batch_id: batchId }) }; }
  catch (e) { return localFallback({ data: [] }); }
}

// --- Manual Mapping Profiles ---

export async function listManualMappingProfiles(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_manual_mapping_profiles', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function createManualMappingProfile(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!validateExternalPOSProviderKey(payload.provider_key)) return { ok: false, error: `invalid provider_key: ${payload.provider_key}` };
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_manual_mapping_profiles', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function updateManualMappingProfile(id, payload, actorUserId) {
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const sets = Object.keys(payload).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const r = await db.query(`UPDATE external_pos_manual_mapping_profiles SET ${sets}, updated_at = NOW() WHERE id = $${Object.keys(payload).length + 1} RETURNING *`, [...Object.values(payload), id]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) { return { ok: false, error: e.message }; }
}

// --- Generic mapping CRUD factory ---
function makeListCreate(tableName) {
  return {
    list:   async (filters = {}) => {
      if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
      try { return { ok: true, data: await listRecords(tableName, filters) }; }
      catch (e) { return localFallback({ data: [] }); }
    },
    create: async (payload, actorUserId, idempotencyKey) => {
      requireIdempotency(idempotencyKey);
      assertNoExternalPOSSecretsInPayload(payload);
      if (!isDbAvailable()) return localFallback();
      try { return { ok: true, data: await createRecord(tableName, payload, actorUserId, idempotencyKey) }; }
      catch (e) { return { ok: false, error: e.message }; }
    },
  };
}

const menuCat      = makeListCreate('external_pos_menu_category_mapping');
const menuItem     = makeListCreate('external_pos_menu_item_mapping');
const modifier     = makeListCreate('external_pos_modifier_mapping');
const tax          = makeListCreate('external_pos_tax_mapping');
const tip          = makeListCreate('external_pos_tip_mapping');
const payType      = makeListCreate('external_pos_payment_type_mapping');
const staffRole    = makeListCreate('external_pos_staff_role_mapping');
const tableSect    = makeListCreate('external_pos_table_section_mapping');
const revenueCtrl  = makeListCreate('external_pos_revenue_center_mapping');
const dept         = makeListCreate('external_pos_department_mapping');
const invSignal    = makeListCreate('external_pos_inventory_signal_mapping');
const humidor      = makeListCreate('external_pos_humidor_mapping');
const bar          = makeListCreate('external_pos_bar_mapping');
const kitchen      = makeListCreate('external_pos_kitchen_mapping');
const orderFlow    = makeListCreate('external_pos_order_flow_mapping');
const ticketFlow   = makeListCreate('external_pos_ticket_flow_mapping');
const closeout     = makeListCreate('external_pos_closeout_mapping');
const report       = makeListCreate('external_pos_report_mapping');

export const createMenuCategoryMapping     = menuCat.create;
export const listMenuCategoryMappings      = menuCat.list;
export const createMenuItemMapping         = menuItem.create;
export const listMenuItemMappings          = menuItem.list;
export const createModifierMapping         = modifier.create;
export const listModifierMappings          = modifier.list;
export const createTaxMapping              = tax.create;
export const listTaxMappings               = tax.list;
export const createTipMapping              = tip.create;
export const listTipMappings               = tip.list;
export const createPaymentTypeMapping      = payType.create;
export const listPaymentTypeMappings       = payType.list;
export const createStaffRoleMapping        = staffRole.create;
export const listStaffRoleMappings         = staffRole.list;
export const createTableSectionMapping     = tableSect.create;
export const listTableSectionMappings      = tableSect.list;
export const createRevenueCenterMapping    = revenueCtrl.create;
export const listRevenueCenterMappings     = revenueCtrl.list;
export const createDepartmentMapping       = dept.create;
export const listDepartmentMappings        = dept.list;
export const createInventorySignalMapping  = invSignal.create;
export const listInventorySignalMappings   = invSignal.list;
export const createHumidorMapping          = humidor.create;
export const listHumidorMappings           = humidor.list;
export const createBarMapping              = bar.create;
export const listBarMappings               = bar.list;
export const createKitchenMapping          = kitchen.create;
export const listKitchenMappings           = kitchen.list;
export const createOrderFlowMapping        = orderFlow.create;
export const listOrderFlowMappings         = orderFlow.list;
export const createTicketFlowMapping       = ticketFlow.create;
export const listTicketFlowMappings        = ticketFlow.list;
export const createCloseoutMapping         = closeout.create;
export const listCloseoutMappings          = closeout.list;
export const createReportMapping           = report.create;
export const listReportMappings            = report.list;

// --- API Contract Registry ---

export async function listAPIContractRegistry(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_api_contract_registry', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function createAPIContractRegistryEntry(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  assertNoFakeExternalPOSConnectedStatus(payload);
  if (!validateExternalPOSProviderKey(payload.provider_key)) return { ok: false, error: `invalid provider_key: ${payload.provider_key}` };
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_api_contract_registry', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

// --- Webhook Registry ---

export async function listWebhookRegistry(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_webhook_registry', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function createWebhookRegistryEntry(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!validateExternalPOSProviderKey(payload.provider_key)) return { ok: false, error: `invalid provider_key: ${payload.provider_key}` };
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_webhook_registry', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function updateWebhookHealth(payload, actorUserId) {
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const r = await db.query('INSERT INTO external_pos_webhook_health (provider_key, health_status, last_checked_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING RETURNING *', [payload.provider_key, payload.health_status || 'unknown']);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function getWebhookHealth(providerKey) {
  if (!isDbAvailable()) return { ok: true, data: null, localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM external_pos_webhook_health WHERE provider_key = $1 ORDER BY created_at DESC LIMIT 1', [providerKey]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) { return localFallback(); }
}

// --- Live Mode Requests ---

export async function createLiveModeRequest(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!validateExternalPOSProviderKey(payload.provider_key)) return { ok: false, error: `invalid provider_key: ${payload.provider_key}` };
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_live_mode_requests', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function listLiveModeRequests(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_live_mode_requests', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

// Preview only — does NOT enable live mode
export async function approveLiveModeRequestPreviewOnly(requestId, actorUserId) {
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const r = await db.query(
      "UPDATE external_pos_live_mode_requests SET request_status = 'approved', approved_by = $1, approved_at = NOW() WHERE id = $2 RETURNING *",
      [actorUserId, requestId]
    );
    return {
      ok: true,
      data: r.rows[0] || null,
      warning: 'approveLiveModeRequestPreviewOnly: this does NOT enable live mode. A separate admin action with full credential verification is required.',
    };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function getLiveModeLockStatus(providerKey) {
  if (!validateExternalPOSProviderKey(providerKey)) return { ok: false, error: `invalid provider_key: ${providerKey}` };
  if (!isDbAvailable()) return { ok: true, data: { provider_key: providerKey, lock_status: 'locked', lock_reason: 'Phase D.3 activation required before live mode' }, localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM external_pos_environment_locks WHERE provider_key = $1', [providerKey]);
    return { ok: true, data: r.rows[0] || { provider_key: providerKey, lock_status: 'locked' } };
  } catch (e) { return localFallback(); }
}

// --- Tenant Mapping ---

export async function getTenantExternalPOSMapping(tenantId) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM external_pos_tenant_mapping WHERE tenant_id = $1', [tenantId]);
    return { ok: true, data: r.rows };
  } catch (e) { return localFallback({ data: [] }); }
}

export async function createTenantExternalPOSMapping(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_tenant_mapping', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

// --- Module Mapping ---

export async function getModuleExternalPOSMapping(moduleKey) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM external_pos_module_mapping WHERE module_key = $1', [moduleKey]);
    return { ok: true, data: r.rows };
  } catch (e) { return localFallback({ data: [] }); }
}

export async function createModuleExternalPOSMapping(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_module_mapping', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

// --- Compliance Checklist ---

export async function listComplianceChecklist(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_compliance_checklist', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function updateComplianceChecklistItem(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_compliance_checklist', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

// --- Risk Flags ---

export async function listRiskFlags(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_risk_flags', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function createRiskFlag(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  if (!isDbAvailable()) return localFallback();
  try { return { ok: true, data: await createRecord('external_pos_risk_flags', payload, actorUserId, idempotencyKey) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

// --- Activation Audit ---

export async function listActivationAudit(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try { return { ok: true, data: await listRecords('external_pos_activation_audit', filters) }; }
  catch (e) { return localFallback({ data: [] }); }
}

export async function writeActivationAudit(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoExternalPOSSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const r = await db.query(
      'INSERT INTO external_pos_activation_audit (provider_key, tenant_id, event_type, event_description, event_data, actor_id, contains_secrets) VALUES ($1, $2, $3, $4, $5, $6, FALSE) RETURNING *',
      [payload.provider_key, payload.tenant_id, payload.event_type, payload.event_description, payload.event_data || {}, actorUserId]
    );
    return { ok: true, data: r.rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

// --- Readiness Summary ---

export async function getExternalPOSReadinessSummary() {
  return {
    ok: true,
    data: {
      phase: 'D.3',
      external_pos_sync_live: false,
      companion_mode_available: false,
      import_mode_available: false,
      api_contract_mode_live: false,
      manual_mapping_available: false,
      providers_connected: 0,
      providers_total: 11,
      all_providers_default_status: 'not_started',
      no_secret_storage: true,
      no_fake_connected_status: true,
      no_fake_sync_claim: true,
      environment_locks_active: true,
      honest_limitations: [
        'No external POS is connected in this phase',
        'Companion mode requires venue-level configuration',
        'Import mode requires actual POS-exported files',
        'API contract mode requires credentials, partner approval, and live-mode unlock',
        'Manual mapping requires admin configuration',
      ],
      area: AREA,
    },
  };
}
