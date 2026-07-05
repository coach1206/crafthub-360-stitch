/**
 * Phase D.1 — Provider Activation Roadmap Service
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * contains_secrets: false, stores_secrets: false
 */

import {
  isValidActivationStatus, isValidCredentialStatus, isValidTestStatus,
  isValidVerificationStatus, isValidReadinessStatus, isValidRollbackStatus,
  isValidBlockerStatus, isValidClaimStatus,
} from './phaseDProviderActivationContracts.js';

const AREA = 'phase_d_provider_activation';

const localFallback = (area = AREA) => ({
  ok: false, localPreview: true, error: 'database_not_configured', area,
});

const requireIdempotency = (key) => {
  if (!key) return { error: 'idempotency_key_required' };
  return null;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

export function getDefaultPhaseDRoadmap() {
  return [
    { phase: 'D.1', name: 'Provider Activation Roadmap', status: 'current', live_mode_enabled: false },
    { phase: 'D.2', name: 'Payment Provider Activation', status: 'not_started', live_mode_enabled: false },
    { phase: 'D.3', name: 'External POS Provider Activation', status: 'not_started', live_mode_enabled: false },
    { phase: 'D.4', name: 'Inventory Provider Activation', status: 'not_started', live_mode_enabled: false },
    { phase: 'D.5', name: 'Communication Provider Activation', status: 'not_started', live_mode_enabled: false },
    { phase: 'D.6', name: 'Security Provider Activation', status: 'not_started', live_mode_enabled: false },
    { phase: 'D.7', name: 'Deployment Activation', status: 'not_started', live_mode_enabled: false },
    { phase: 'D.8', name: 'Live Pilot Readiness & Provider Launch Lock', status: 'not_started', live_mode_enabled: false },
  ];
}

export function getDefaultProviderCategories() {
  const cats = [
    { provider_category: 'deployment',           activation_order: 1, readiness_status: 'foundation_ready' },
    { provider_category: 'payments',             activation_order: 2, readiness_status: 'provider_required' },
    { provider_category: 'billing',              activation_order: 3, readiness_status: 'provider_required' },
    { provider_category: 'email',                activation_order: 4, readiness_status: 'provider_required' },
    { provider_category: 'sms',                  activation_order: 5, readiness_status: 'provider_required' },
    { provider_category: 'external_pos',         activation_order: 6, readiness_status: 'provider_required' },
    { provider_category: 'inventory',            activation_order: 7, readiness_status: 'provider_required' },
    { provider_category: 'kds_printer',          activation_order: 8, readiness_status: 'provider_required' },
    { provider_category: 'sso',                  activation_order: 9, readiness_status: 'provider_required' },
    { provider_category: 'mfa',                  activation_order: 10, readiness_status: 'provider_required' },
    { provider_category: 'marketplace',          activation_order: 11, readiness_status: 'provider_required' },
    { provider_category: 'white_label',          activation_order: 12, readiness_status: 'provider_required' },
    { provider_category: 'smokecraft_sync',      activation_order: 13, readiness_status: 'provider_required' },
    { provider_category: 'eat_automation',       activation_order: 14, readiness_status: 'provider_required' },
    { provider_category: 'tax_engine',           activation_order: 15, readiness_status: 'provider_required' },
    { provider_category: 'payroll_accounting',   activation_order: 16, readiness_status: 'provider_required' },
    { provider_category: 'manual_fallback',      activation_order: 99, readiness_status: 'foundation_ready' },
  ];
  return cats.map(c => ({
    ...c,
    provider_connected: false, live_mode_enabled: false,
    contains_secrets: false, stores_secrets: false,
  }));
}

export function getDefaultProviderCandidates() {
  return [
    { provider_key: 'stripe',          provider_category: 'payments',         activation_status: 'credentials_required', readiness_status: 'provider_required', demo_live_mode: 'demo', provider_connected: false, live_mode_enabled: false },
    { provider_key: 'square',          provider_category: 'payments',         activation_status: 'credentials_required', readiness_status: 'provider_required', demo_live_mode: 'demo', provider_connected: false, live_mode_enabled: false },
    { provider_key: 'twilio',          provider_category: 'sms',              activation_status: 'credentials_required', readiness_status: 'provider_required', demo_live_mode: 'demo', provider_connected: false, live_mode_enabled: false },
    { provider_key: 'sendgrid',        provider_category: 'email',            activation_status: 'credentials_required', readiness_status: 'provider_required', demo_live_mode: 'demo', provider_connected: false, live_mode_enabled: false },
    { provider_key: 'auth0',           provider_category: 'sso',              activation_status: 'credentials_required', readiness_status: 'provider_required', demo_live_mode: 'demo', provider_connected: false, live_mode_enabled: false },
    { provider_key: 'railway',         provider_category: 'deployment',       activation_status: 'configuration_required', readiness_status: 'foundation_ready', demo_live_mode: 'staging_placeholder', provider_connected: false, live_mode_enabled: false },
    { provider_key: 'taxjar',          provider_category: 'tax_engine',       activation_status: 'credentials_required', readiness_status: 'provider_required', demo_live_mode: 'demo', provider_connected: false, live_mode_enabled: false },
    { provider_key: 'manual_csv',      provider_category: 'manual_fallback',  activation_status: 'not_started', readiness_status: 'foundation_ready', demo_live_mode: 'local_preview', provider_connected: false, live_mode_enabled: false },
  ];
}

export function getDefaultActivationOrder() {
  return [
    { activation_order: 1,  provider_key: 'railway',    provider_category: 'deployment',       phase_label: 'D.7', rationale: 'Environment must be live before providers connect' },
    { activation_order: 2,  provider_key: 'stripe',     provider_category: 'payments',         phase_label: 'D.2', rationale: 'Payments required for billing activation' },
    { activation_order: 3,  provider_key: 'sendgrid',   provider_category: 'email',            phase_label: 'D.5', rationale: 'Email required for staff invite delivery' },
    { activation_order: 4,  provider_key: 'twilio',     provider_category: 'sms',              phase_label: 'D.5', rationale: 'SMS required for guest notifications' },
    { activation_order: 5,  provider_key: 'api_generic', provider_category: 'external_pos',   phase_label: 'D.3', rationale: 'External POS sync after comms' },
    { activation_order: 6,  provider_key: 'api_generic', provider_category: 'inventory',      phase_label: 'D.4', rationale: 'Inventory sync after POS' },
    { activation_order: 7,  provider_key: 'kds_generic', provider_category: 'kds_printer',    phase_label: 'D.4', rationale: 'Hardware after inventory' },
    { activation_order: 8,  provider_key: 'auth0',      provider_category: 'sso',             phase_label: 'D.6', rationale: 'SSO/MFA after core providers' },
    { activation_order: 9,  provider_key: 'api_generic', provider_category: 'marketplace',    phase_label: 'D.8', rationale: 'Marketplace after security' },
    { activation_order: 10, provider_key: 'custom_domain', provider_category: 'white_label',  phase_label: 'D.7', rationale: 'White-label domain after deployment' },
    { activation_order: 11, provider_key: 'webhook_generic', provider_category: 'smokecraft_sync', phase_label: 'D.8', rationale: 'SmokeCraft sync last' },
    { activation_order: 12, provider_key: 'api_generic', provider_category: 'eat_automation', phase_label: 'D.8', rationale: 'E.A.T. automation final phase' },
    { activation_order: 13, provider_key: 'taxjar',     provider_category: 'tax_engine',      phase_label: 'D.8', rationale: 'Tax engine with live transactions' },
  ];
}

export function getDefaultProviderReadinessMatrix() {
  return getDefaultProviderCandidates().map(c => ({
    provider_key: c.provider_key,
    provider_category: c.provider_category,
    readiness_status: c.readiness_status,
    demo_live_mode: c.demo_live_mode,
    provider_connected: false,
    credentials_received: false,
    credentials_verified: false,
    activation_completed: false,
    test_completed: false,
    verification_completed: false,
    rollback_ready: false,
    live_mode_enabled: false,
    payment_processed: false,
    billing_connected: false,
    pos_sync_enabled: false,
    inventory_sync_enabled: false,
    notification_delivery_enabled: false,
    security_provider_connected: false,
    deployment_completed: false,
    marketplace_transaction_enabled: false,
    contains_secrets: false,
    stores_secrets: false,
  }));
}

export function getDefaultSafeActivationClaims() {
  return [
    { claim_key: 'foundation_ready',       claim_text: 'Provider activation roadmap foundation built and verified.', claim_status: 'safe' },
    { claim_key: 'activation_order_ready', claim_text: 'Phase D activation order documented and controlled.', claim_status: 'safe' },
    { claim_key: 'no_fake_enforced',       claim_text: 'No-fake activation controls enforced at all layers.', claim_status: 'safe' },
    { claim_key: 'credential_placeholder', claim_text: 'Credential placeholder system ready — no live credentials stored.', claim_status: 'safe' },
    { claim_key: 'matrix_ready',           claim_text: 'Provider readiness matrix foundation built.', claim_status: 'safe' },
  ];
}

export function getDefaultUnsafeActivationClaims() {
  return [
    { claim_key: 'live_provider',     claim_text: 'Live provider connected.', claim_status: 'not_safe', reason_not_safe: 'No provider connected — Phase D activation required.' },
    { claim_key: 'live_payments',     claim_text: 'Live payment processing active.', claim_status: 'not_safe', reason_not_safe: 'payment_processed: false — provider activation required.' },
    { claim_key: 'live_billing',      claim_text: 'Billing connected.', claim_status: 'not_safe', reason_not_safe: 'billing_connected: false — Phase D.2 required.' },
    { claim_key: 'live_sso',          claim_text: 'SSO connected.', claim_status: 'not_safe', reason_not_safe: 'security_provider_connected: false — Phase D.6 required.' },
    { claim_key: 'live_deployment',   claim_text: 'Production deployed.', claim_status: 'not_safe', reason_not_safe: 'deployment_completed: false — Phase D.7 required.' },
    { claim_key: 'live_marketplace',  claim_text: 'Marketplace transactions live.', claim_status: 'not_safe', reason_not_safe: 'marketplace_transaction_enabled: false — Phase D.8 required.' },
  ];
}

export function getDefaultPhaseDHonestLimitations() {
  return [
    'No provider is connected. Phase D activation is required.',
    'No credentials have been verified. Credential verification requires external provider setup.',
    'No payment processing is active. Stripe/Square activation is Phase D.2.',
    'No billing connection. Billing activation is Phase D.2.',
    'No external POS sync. POS activation is Phase D.3.',
    'No inventory sync. Inventory activation is Phase D.4.',
    'No email or SMS delivery. Communication activation is Phase D.5.',
    'No SSO or MFA. Security provider activation is Phase D.6.',
    'No deployment completed. Deployment activation is Phase D.7.',
    'No marketplace transactions. Marketplace activation is Phase D.8.',
    'No SmokeCraft sync. SmokeCraft activation is Phase D.8.',
    'No E.A.T. automation. E.A.T. activation is Phase D.8.',
    'No live mode. Live mode requires all Phase D provider activations.',
  ];
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function getDb() {
  const db = (await import('../../db/connection.js')).default;
  return db;
}

async function isDbReady() {
  try {
    const { isDbAvailable } = await import('../../db/connection.js');
    return isDbAvailable();
  } catch { return false; }
}

async function createRecord(tableName, payload, actorUserId, idempotencyKey) {
  const iErr = requireIdempotency(idempotencyKey);
  if (iErr) return { ok: false, ...iErr };
  if (!(await isDbReady())) return localFallback();
  try {
    const db = await getDb();
    const cols = Object.keys(payload);
    const vals = Object.values(payload);
    const ph   = vals.map((_, i) => `$${i + 1}`).join(', ');
    const row  = await db.query(
      `INSERT INTO ${tableName} (${cols.join(', ')}, actor_user_id, idempotency_key)
       VALUES (${ph}, $${vals.length + 1}, $${vals.length + 2})
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [...vals, actorUserId || 'system', idempotencyKey],
    );
    return { ok: true, data: row.rows[0] || null };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function listRecords(tableName, filters = {}) {
  if (!(await isDbReady())) return { ok: false, localPreview: true, data: [], area: AREA };
  try {
    const db   = await getDb();
    const keys = Object.keys(filters);
    const where = keys.length
      ? 'WHERE ' + keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')
      : '';
    const row = await db.query(
      `SELECT * FROM ${tableName} ${where} ORDER BY created_at DESC LIMIT 500`,
      Object.values(filters),
    );
    return { ok: true, data: row.rows };
  } catch (e) { return { ok: false, error: e.message, data: [] }; }
}

async function updateField(tableName, idCol, id, field, value, actorUserId, reason, idempotencyKey) {
  const iErr = requireIdempotency(idempotencyKey);
  if (iErr) return { ok: false, ...iErr };
  if (!(await isDbReady())) return localFallback();
  try {
    const db = await getDb();
    const row = await db.query(
      `UPDATE ${tableName} SET ${field} = $1, reason = $2, actor_user_id = $3, updated_at = NOW()
       WHERE ${idCol} = $4 RETURNING *`,
      [value, reason || null, actorUserId || 'system', id],
    );
    return { ok: true, data: row.rows[0] || null };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────

export async function createProviderActivationRoadmap({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_activation_roadmaps', payload, actorUserId, idempotencyKey);
}
export async function listProviderActivationRoadmaps({ filters = {} } = {}) {
  return listRecords('phase_d_provider_activation_roadmaps', filters);
}
export async function updateProviderActivationRoadmapStatus({ roadmapId, status, actorUserId, reason, idempotencyKey }) {
  return updateField('phase_d_provider_activation_roadmaps', 'id', roadmapId, 'roadmap_status', status, actorUserId, reason, idempotencyKey);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function createProviderCategory({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_categories', payload, actorUserId, idempotencyKey);
}
export async function listProviderCategories({ filters = {} } = {}) {
  return listRecords('phase_d_provider_categories', filters);
}

// ─── Candidates ───────────────────────────────────────────────────────────────

export async function createProviderCandidate({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_candidates', payload, actorUserId, idempotencyKey);
}
export async function listProviderCandidates({ filters = {} } = {}) {
  return listRecords('phase_d_provider_candidates', filters);
}
export async function updateProviderCandidateStatus({ providerCandidateId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidActivationStatus(status)) return { ok: false, error: 'invalid_activation_status' };
  return updateField('phase_d_provider_candidates', 'id', providerCandidateId, 'activation_status', status, actorUserId, reason, idempotencyKey);
}

// ─── Activation order / dependencies ─────────────────────────────────────────

export async function createProviderActivationOrder({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_activation_order', payload, actorUserId, idempotencyKey);
}
export async function listProviderActivationOrder({ filters = {} } = {}) {
  return listRecords('phase_d_provider_activation_order', filters);
}
export async function createProviderDependency({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_dependencies', payload, actorUserId, idempotencyKey);
}
export async function listProviderDependencies({ filters = {} } = {}) {
  return listRecords('phase_d_provider_dependencies', filters);
}

// ─── Credentials ──────────────────────────────────────────────────────────────

export async function createCredentialPlaceholder({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_credentials_placeholders', payload, actorUserId, idempotencyKey);
}
export async function listCredentialPlaceholders({ filters = {} } = {}) {
  return listRecords('phase_d_provider_credentials_placeholders', filters);
}
export async function updateCredentialStatus({ credentialPlaceholderId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidCredentialStatus(status)) return { ok: false, error: 'invalid_credential_status' };
  return updateField('phase_d_provider_credentials_placeholders', 'id', credentialPlaceholderId, 'credential_status', status, actorUserId, reason, idempotencyKey);
}

// ─── Prerequisites ────────────────────────────────────────────────────────────

export async function createProviderPrerequisite({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_prerequisites', payload, actorUserId, idempotencyKey);
}
export async function listProviderPrerequisites({ filters = {} } = {}) {
  return listRecords('phase_d_provider_prerequisites', filters);
}

// ─── Blockers ─────────────────────────────────────────────────────────────────

export async function createProviderBlocker({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_blockers', payload, actorUserId, idempotencyKey);
}
export async function listProviderBlockers({ filters = {} } = {}) {
  return listRecords('phase_d_provider_blockers', filters);
}
export async function updateProviderBlockerStatus({ blockerId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidBlockerStatus(status)) return { ok: false, error: 'invalid_blocker_status' };
  return updateField('phase_d_provider_blockers', 'id', blockerId, 'blocker_status', status, actorUserId, reason, idempotencyKey);
}

// ─── Requirements ─────────────────────────────────────────────────────────────

export async function createLegalRequirement({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_legal_requirements', payload, actorUserId, idempotencyKey);
}
export async function listLegalRequirements({ filters = {} } = {}) {
  return listRecords('phase_d_provider_legal_requirements', filters);
}
export async function createBillingRequirement({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_billing_requirements', payload, actorUserId, idempotencyKey);
}
export async function listBillingRequirements({ filters = {} } = {}) {
  return listRecords('phase_d_provider_billing_requirements', filters);
}
export async function createSecurityRequirement({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_security_requirements', payload, actorUserId, idempotencyKey);
}
export async function listSecurityRequirements({ filters = {} } = {}) {
  return listRecords('phase_d_provider_security_requirements', filters);
}

// ─── Activation statuses ──────────────────────────────────────────────────────

export async function createProviderActivationStatus({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_activation_statuses', payload, actorUserId, idempotencyKey);
}
export async function listProviderActivationStatuses({ filters = {} } = {}) {
  return listRecords('phase_d_provider_activation_statuses', filters);
}
export async function updateProviderActivationStatus({ activationStatusId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidActivationStatus(status)) return { ok: false, error: 'invalid_activation_status' };
  return updateField('phase_d_provider_activation_statuses', 'id', activationStatusId, 'activation_status', status, actorUserId, reason, idempotencyKey);
}

// ─── Test statuses ────────────────────────────────────────────────────────────

export async function createProviderTestStatus({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_test_statuses', payload, actorUserId, idempotencyKey);
}
export async function listProviderTestStatuses({ filters = {} } = {}) {
  return listRecords('phase_d_provider_test_statuses', filters);
}
export async function updateProviderTestStatus({ testStatusId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidTestStatus(status)) return { ok: false, error: 'invalid_test_status' };
  return updateField('phase_d_provider_test_statuses', 'id', testStatusId, 'test_status', status, actorUserId, reason, idempotencyKey);
}

// ─── Verification statuses ────────────────────────────────────────────────────

export async function createProviderVerificationStatus({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_verification_statuses', payload, actorUserId, idempotencyKey);
}
export async function listProviderVerificationStatuses({ filters = {} } = {}) {
  return listRecords('phase_d_provider_verification_statuses', filters);
}
export async function updateProviderVerificationStatus({ verificationStatusId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidVerificationStatus(status)) return { ok: false, error: 'invalid_verification_status' };
  return updateField('phase_d_provider_verification_statuses', 'id', verificationStatusId, 'verification_status', status, actorUserId, reason, idempotencyKey);
}

// ─── Rollback / failure ───────────────────────────────────────────────────────

export async function createProviderRollbackRecord({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_rollback_records', payload, actorUserId, idempotencyKey);
}
export async function listProviderRollbackRecords({ filters = {} } = {}) {
  return listRecords('phase_d_provider_rollback_records', filters);
}
export async function updateProviderRollbackStatus({ rollbackId, status, actorUserId, reason, idempotencyKey }) {
  if (!isValidRollbackStatus(status)) return { ok: false, error: 'invalid_rollback_status' };
  return updateField('phase_d_provider_rollback_records', 'id', rollbackId, 'rollback_status', status, actorUserId, reason, idempotencyKey);
}
export async function createProviderFailureRecord({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_failure_records', payload, actorUserId, idempotencyKey);
}
export async function listProviderFailureRecords({ filters = {} } = {}) {
  return listRecords('phase_d_provider_failure_records', filters);
}

// ─── Matrix / claims ──────────────────────────────────────────────────────────

export async function createProviderReadinessMatrixRecord({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_provider_readiness_matrix', payload, actorUserId, idempotencyKey);
}
export async function listProviderReadinessMatrix({ filters = {} } = {}) {
  return listRecords('phase_d_provider_readiness_matrix', filters);
}
export async function createSafeActivationClaim({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_safe_activation_claims', payload, actorUserId, idempotencyKey);
}
export async function listSafeActivationClaims({ filters = {} } = {}) {
  return listRecords('phase_d_safe_activation_claims', filters);
}
export async function createUnsafeActivationClaim({ payload, actorUserId, idempotencyKey }) {
  return createRecord('phase_d_unsafe_activation_claims', payload, actorUserId, idempotencyKey);
}
export async function listUnsafeActivationClaims({ filters = {} } = {}) {
  return listRecords('phase_d_unsafe_activation_claims', filters);
}
export function getSafePhaseDActivationClaims() { return getDefaultSafeActivationClaims(); }
export function getUnsafePhaseDActivationClaims() { return getDefaultUnsafeActivationClaims(); }
export function getPhaseDHonestLimitations() { return getDefaultPhaseDHonestLimitations(); }

// ─── Snapshots / audit ────────────────────────────────────────────────────────

export async function createProviderActivationSnapshot({ actorUserId, idempotencyKey }) {
  const iErr = requireIdempotency(idempotencyKey);
  if (iErr) return { ok: false, ...iErr };
  const snapshot_data = {
    phase: 'D.1',
    live_mode_enabled: false,
    provider_connected: false,
    payment_processed: false,
    billing_connected: false,
    deployment_completed: false,
    contains_secrets: false,
    stores_secrets: false,
    taken_at: new Date().toISOString(),
  };
  return createRecord('phase_d_activation_snapshots', { snapshot_data, snapshot_label: 'phase_d_activation_snapshot', phase_label: 'D.1', live_mode_enabled: false, contains_secrets: false, stores_secrets: false }, actorUserId, idempotencyKey);
}

export async function getLatestProviderActivationSnapshot() {
  if (!(await isDbReady())) return { ok: false, localPreview: true, data: null, area: AREA };
  try {
    const db  = await getDb();
    const row = await db.query('SELECT * FROM phase_d_activation_snapshots ORDER BY created_at DESC LIMIT 1');
    return { ok: true, data: row.rows[0] || null };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function writeProviderActivationAudit({ actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason }) {
  if (!(await isDbReady())) return { ok: false, localPreview: true, area: AREA };
  try {
    const db = await getDb();
    await db.query(
      `INSERT INTO phase_d_activation_audit
       (actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,false,false,true,true)`,
      [actorUserId || 'system', action, entityType, entityId || null,
       JSON.stringify(beforeSnapshot || {}), JSON.stringify(afterSnapshot || {}), reason || null],
    );
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}
