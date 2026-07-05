/**
 * Phase D.2 Payment Provider Activation Service
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * contains_secrets: false, stores_secrets: false
 */

import { isDbAvailable } from '../../db/connection.js';
import {
  assertNoSecretsInPayload,
  requireProviderKey,
  requireProviderStatus,
  isValidCredentialStatus,
  isValidEnvironmentLockStatus,
  isValidPaymentAuditEventType,
  isNonEmpty,
} from './phaseDPaymentProviderContracts.js';

const AREA = 'phase_d_payment_provider_activation';

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
  const idxOffset = fields.length;
  const cols = [...fields, 'created_by', 'idempotency_key'].join(', ');
  const placeholders = [...fields.map((_, i) => `$${i + 1}`), `$${idxOffset + 1}`, `$${idxOffset + 2}`].join(', ');
  const sql = `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders}) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`;
  const result = await db.query(sql, [...values, actorUserId, idempotencyKey]);
  return result.rows[0] || null;
}

async function listRecords(tableName, filters = {}) {
  const db = await getDb();
  const conditions = Object.entries(filters).map(([k, _], i) => `${k} = $${i + 1}`);
  const values = Object.values(filters);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM ${tableName} ${where} ORDER BY created_at DESC`;
  const result = await db.query(sql, values);
  return result.rows;
}

function getDefaultProviders() {
  return [
    {
      provider_key: 'stripe',
      provider_name: 'Stripe',
      provider_status: 'not_started',
      provider_connected: false,
      live_mode_enabled: false,
      payment_processing_enabled: false,
      credentials_present: false,
      credentials_verified: false,
      contains_secrets: false,
      stores_secrets: false,
    },
    {
      provider_key: 'square',
      provider_name: 'Square',
      provider_status: 'not_started',
      provider_connected: false,
      live_mode_enabled: false,
      payment_processing_enabled: false,
      credentials_present: false,
      credentials_verified: false,
      contains_secrets: false,
      stores_secrets: false,
    },
    {
      provider_key: 'manual_invoice',
      provider_name: 'Manual Invoice',
      provider_status: 'not_started',
      provider_connected: false,
      live_mode_enabled: false,
      payment_processing_enabled: false,
      credentials_present: false,
      credentials_verified: false,
      contains_secrets: false,
      stores_secrets: false,
    },
    {
      provider_key: 'cash_offline',
      provider_name: 'Cash / Offline',
      provider_status: 'not_started',
      provider_connected: false,
      live_mode_enabled: false,
      payment_processing_enabled: false,
      credentials_present: false,
      credentials_verified: false,
      contains_secrets: false,
      stores_secrets: false,
    },
    {
      provider_key: 'future_placeholder',
      provider_name: 'Future Provider (Placeholder)',
      provider_status: 'not_started',
      provider_connected: false,
      live_mode_enabled: false,
      payment_processing_enabled: false,
      credentials_present: false,
      credentials_verified: false,
      contains_secrets: false,
      stores_secrets: false,
    },
  ];
}

// --- Provider Registry ---

export async function listPaymentProviders() {
  if (!isDbAvailable()) return { ok: true, data: getDefaultProviders(), localPreview: true };
  try {
    const rows = await listRecords('payment_provider_registry');
    return { ok: true, data: rows.length ? rows : getDefaultProviders() };
  } catch (e) {
    return localFallback({ data: getDefaultProviders() });
  }
}

export async function getPaymentProvider(providerKey) {
  requireProviderKey(providerKey);
  if (!isDbAvailable()) {
    const p = getDefaultProviders().find(r => r.provider_key === providerKey);
    return { ok: true, data: p || null, localPreview: true };
  }
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM payment_provider_registry WHERE provider_key = $1', [providerKey]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function registerPaymentProvider(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  requireProviderKey(payload.provider_key);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('payment_provider_registry', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function updatePaymentProviderStatus(providerKey, status, actorUserId) {
  requireProviderKey(providerKey);
  requireProviderStatus(status);
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const r = await db.query(
      'UPDATE payment_provider_registry SET provider_status = $1, updated_by = $2, updated_at = NOW() WHERE provider_key = $3 RETURNING *',
      [status, actorUserId, providerKey]
    );
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Credential Status ---

export async function listCredentialStatuses() {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const rows = await listRecords('payment_provider_credentials_status');
    return { ok: true, data: rows };
  } catch (e) {
    return localFallback({ data: [] });
  }
}

export async function getCredentialStatus(providerKey) {
  requireProviderKey(providerKey);
  if (!isDbAvailable()) return { ok: true, data: null, localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM payment_provider_credentials_status WHERE provider_key = $1', [providerKey]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function updateCredentialStatus(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  requireProviderKey(payload.provider_key);
  if (payload.presence_status && !isValidCredentialStatus(payload.presence_status)) {
    return { ok: false, error: `Invalid credential presence_status: ${payload.presence_status}` };
  }
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('payment_provider_credentials_status', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Environment Locks ---

export async function listEnvironmentLocks() {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const rows = await listRecords('payment_provider_environment_locks');
    return { ok: true, data: rows };
  } catch (e) {
    return localFallback({ data: [] });
  }
}

export async function getEnvironmentLock(providerKey) {
  requireProviderKey(providerKey);
  if (!isDbAvailable()) return { ok: true, data: null, localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query('SELECT * FROM payment_provider_environment_locks WHERE provider_key = $1', [providerKey]);
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function updateEnvironmentLock(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  requireProviderKey(payload.provider_key);
  if (payload.lock_status && !isValidEnvironmentLockStatus(payload.lock_status)) {
    return { ok: false, error: `Invalid lock_status: ${payload.lock_status}` };
  }
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('payment_provider_environment_locks', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Live Mode Requests ---

export async function listLiveModeRequests() {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const rows = await listRecords('payment_provider_live_mode_requests');
    return { ok: true, data: rows };
  } catch (e) {
    return localFallback({ data: [] });
  }
}

export async function submitLiveModeRequest(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  requireProviderKey(payload.provider_key);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('payment_provider_live_mode_requests', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function approveLiveModeRequest(requestId, actorUserId) {
  if (!isNonEmpty(requestId)) return { ok: false, error: 'request_id_required' };
  if (!isDbAvailable()) return localFallback();
  try {
    const db = await getDb();
    const r = await db.query(
      "UPDATE payment_provider_live_mode_requests SET request_status = 'approved', approved_by = $1, approved_at = NOW() WHERE id = $2 RETURNING *",
      [actorUserId, requestId]
    );
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Compliance Checks ---

export async function listComplianceChecks() {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const rows = await listRecords('payment_provider_compliance_checks');
    return { ok: true, data: rows };
  } catch (e) {
    return localFallback({ data: [] });
  }
}

export async function createComplianceCheck(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('payment_provider_compliance_checks', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Audit Log ---

export async function writePaymentProviderAudit(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  if (payload.event_type && !isValidPaymentAuditEventType(payload.event_type)) {
    return { ok: false, error: `Invalid audit event_type: ${payload.event_type}` };
  }
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('payment_provider_audit_log', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function listPaymentProviderAudit(filters = {}) {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const rows = await listRecords('payment_provider_audit_log', filters);
    return { ok: true, data: rows };
  } catch (e) {
    return localFallback({ data: [] });
  }
}

// --- Stripe Specific ---

export async function getStripeActivationStatus() {
  if (!isDbAvailable()) return { ok: true, data: { provider_key: 'stripe', provider_status: 'not_started', live_mode_enabled: false, payment_processing_enabled: false }, localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query("SELECT * FROM payment_provider_registry WHERE provider_key = 'stripe'");
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function updateStripeConfig(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('stripe_activation_config', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Square Specific ---

export async function getSquareActivationStatus() {
  if (!isDbAvailable()) return { ok: true, data: { provider_key: 'square', provider_status: 'not_started', live_mode_enabled: false, payment_processing_enabled: false }, localPreview: true };
  try {
    const db = await getDb();
    const r = await db.query("SELECT * FROM payment_provider_registry WHERE provider_key = 'square'");
    return { ok: true, data: r.rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function updateSquareConfig(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('square_activation_config', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Manual Invoice ---

export async function getManualInvoiceConfig() {
  if (!isDbAvailable()) return { ok: true, data: null, localPreview: true };
  try {
    const rows = await listRecords('manual_invoice_config');
    return { ok: true, data: rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function updateManualInvoiceConfig(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('manual_invoice_config', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Cash / Offline ---

export async function getCashOfflineConfig() {
  if (!isDbAvailable()) return { ok: true, data: null, localPreview: true };
  try {
    const rows = await listRecords('cash_offline_config');
    return { ok: true, data: rows[0] || null };
  } catch (e) {
    return localFallback();
  }
}

export async function updateCashOfflineConfig(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('cash_offline_config', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Safety Enforcement Status ---

export async function getPaymentSafetyStatus() {
  return {
    ok: true,
    data: {
      no_fake_payment_processing: true,
      no_raw_card_data_storage: true,
      no_secrets_in_database: true,
      no_fake_provider_connection: true,
      no_fake_invoice_completion: true,
      live_mode_approval_gate_required: true,
      credential_validation_required: true,
      platform_admin_guard_required: true,
      audit_trail_required: true,
      idempotency_enforced: true,
      area: AREA,
    },
  };
}

// --- PCI Scope ---

export async function listPciScopeItems() {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const rows = await listRecords('payment_pci_scope');
    return { ok: true, data: rows };
  } catch (e) {
    return localFallback({ data: [] });
  }
}

export async function createPciScopeItem(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('payment_pci_scope', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Webhook Registry ---

export async function listWebhookEndpoints() {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const rows = await listRecords('payment_webhook_registry');
    return { ok: true, data: rows };
  } catch (e) {
    return localFallback({ data: [] });
  }
}

export async function registerWebhookEndpoint(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  requireProviderKey(payload.provider_key);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('payment_webhook_registry', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- Refund Rules ---

export async function listRefundRules() {
  if (!isDbAvailable()) return { ok: true, data: [], localPreview: true };
  try {
    const rows = await listRecords('payment_refund_rules');
    return { ok: true, data: rows };
  } catch (e) {
    return localFallback({ data: [] });
  }
}

export async function createRefundRule(payload, actorUserId, idempotencyKey) {
  requireIdempotency(idempotencyKey);
  assertNoSecretsInPayload(payload);
  if (!isDbAvailable()) return localFallback();
  try {
    const row = await createRecord('payment_refund_rules', payload, actorUserId, idempotencyKey);
    return { ok: true, data: row };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
