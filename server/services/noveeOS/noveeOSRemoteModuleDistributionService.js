// Phase E.6 — NOVEE OS Remote Module Distribution Service
// BUILD ONLY — no live delivery, no real provisioning, no real activation

import {
  DEFAULT_DEPLOYMENT_PACKAGES,
  DEFAULT_MODULE_ACTIVATIONS,
  DEFAULT_ROLLBACK_RECORDS,
} from './noveeOSRemoteModuleDistributionContracts.js'
import FLAGS from '../../config/noveeOSRemoteModuleDistributionFeatureFlags.js'

const localFallback = (area) => ({ ok: false, localPreview: true, error: 'database_not_configured', area })

async function isDbAvailable() {
  try { const m = await import('../../db/connection.js'); return !!m.default } catch { return false }
}
async function db() { return (await import('../../db/connection.js')).default }

// ── Summary ───────────────────────────────────────────────────────────────────

export async function getRemoteModuleDistributionSummary() {
  return {
    ok: true,
    summary: {
      remote_distribution_center_exists: true,
      live_delivery_enabled: false,
      client_provisioning_enabled: false,
      invite_links_enabled: false,
      license_validation_enabled: false,
      remote_activation_enabled: false,
      rollback_execution_enabled: false,
      security_gate_required: true,
      deployment_gate_required: true,
      pilot_gate_required: true,
    },
    safety_status: 'BUILD_ONLY_NO_LIVE_REMOTE_DISTRIBUTION',
    remote_distribution_ready: false,
    production_ready: false,
  }
}

// ── Deployment Packages ────────────────────────────────────────────────────────

export async function listModuleDeploymentPackages(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, packages: DEFAULT_DEPLOYMENT_PACKAGES.map(p => ({ ...p, remote_distribution_ready: false, remote_distribution_enabled: false, production_ready: false, package_status: 'draft' })) }
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_module_deployment_packages WHERE tenant_id=$1 ORDER BY created_at' : 'SELECT * FROM novee_os_module_deployment_packages ORDER BY created_at'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, packages: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getModuleDeploymentPackage(id) {
  if (!(await isDbAvailable())) return localFallback('deployment_package')
  try {
    const res = await (await db()).query('SELECT * FROM novee_os_module_deployment_packages WHERE id=$1', [id])
    return { ok: true, package: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createModuleDeploymentPackagePreview(payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('deployment_package_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_module_deployment_packages (tenant_id, package_key, package_name, package_type, module_keys_json, version_label, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [payload.tenant_id || null, payload.package_key, payload.package_name, payload.package_type || 'preview_bundle', JSON.stringify(payload.module_keys_json || []), payload.version_label || '0.0.1-preview', payload.notes || null]
    )
    return { ok: true, package: res.rows[0], remote_distribution_ready: false, remote_distribution_enabled: false, production_ready: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateModuleDeploymentPackageStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('deployment_package_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_module_deployment_packages SET package_status=$1, notes=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [payload.package_status || 'draft', payload.notes || null, id]
    )
    return { ok: true, package: res.rows[0] || null, remote_distribution_ready: false }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Client Provisioning Requests ───────────────────────────────────────────────

export async function listClientProvisioningRequests(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('provisioning_requests')
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_client_provisioning_requests WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT * FROM novee_os_client_provisioning_requests ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, requests: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getClientProvisioningRequest(id) {
  if (!(await isDbAvailable())) return localFallback('provisioning_request')
  try {
    const res = await (await db()).query('SELECT * FROM novee_os_client_provisioning_requests WHERE id=$1', [id])
    return { ok: true, request: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createClientProvisioningRequestPreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('provisioning_request_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_client_provisioning_requests (tenant_id, client_name, client_type, venue_name, venue_type, requested_modules_json, requested_by, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id || null, payload.client_name, payload.client_type, payload.venue_name || null, payload.venue_type || null, JSON.stringify(payload.requested_modules_json || []), actorId, payload.notes || null, idempotencyKey]
    )
    return { ok: true, request: res.rows[0] || null, provisioning_status: 'pending', approval_status: 'pending' }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateClientProvisioningRequestStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('provisioning_request_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_client_provisioning_requests SET provisioning_status=$1, notes=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [payload.provisioning_status || 'pending', payload.notes || null, id]
    )
    return { ok: true, request: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Invite Sessions ────────────────────────────────────────────────────────────

export async function listInviteSessions(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('invite_sessions')
  try {
    const d = await db()
    const q = tenantId ? 'SELECT id, tenant_id, invite_status, invite_type, module_scope_json, onboarding_scope_json, remote_activation_allowed, safe_claim, expires_at, created_at FROM novee_os_invite_sessions WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT id, tenant_id, invite_status, invite_type, module_scope_json, onboarding_scope_json, remote_activation_allowed, safe_claim, expires_at, created_at FROM novee_os_invite_sessions ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, sessions: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getInviteSession(id) {
  if (!(await isDbAvailable())) return localFallback('invite_session')
  try {
    const res = await (await db()).query('SELECT id, tenant_id, invite_status, invite_type, module_scope_json, onboarding_scope_json, remote_activation_allowed, safe_claim, expires_at, created_at FROM novee_os_invite_sessions WHERE id=$1', [id])
    return { ok: true, session: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createInviteSessionPreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('invite_session_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_invite_sessions (tenant_id, provisioning_request_id, invite_type, module_scope_json, onboarding_scope_json, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id, tenant_id, invite_status, invite_type, module_scope_json, onboarding_scope_json, remote_activation_allowed, safe_claim, expires_at, created_at`,
      [payload.tenant_id || null, payload.provisioning_request_id || null, payload.invite_type || 'pilot', JSON.stringify(payload.module_scope_json || []), JSON.stringify(payload.onboarding_scope_json || []), payload.notes || null, idempotencyKey]
    )
    return { ok: true, session: res.rows[0] || null, remote_activation_allowed: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateInviteSessionStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('invite_session_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_invite_sessions SET invite_status=$1, notes=$2, updated_at=now() WHERE id=$3 RETURNING id, invite_status, invite_type, safe_claim`,
      [payload.invite_status || 'draft', payload.notes || null, id]
    )
    return { ok: true, session: res.rows[0] || null, remote_activation_allowed: false }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── License Keys ───────────────────────────────────────────────────────────────

export async function listLicenseKeys(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('license_keys')
  try {
    const d = await db()
    const q = tenantId ? 'SELECT id, tenant_id, license_type, license_status, module_scope_json, seat_limit, venue_limit, validation_status, safe_claim, expires_at, created_at FROM novee_os_license_keys WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT id, tenant_id, license_type, license_status, module_scope_json, seat_limit, venue_limit, validation_status, safe_claim, expires_at, created_at FROM novee_os_license_keys ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, keys: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getLicenseKey(id) {
  if (!(await isDbAvailable())) return localFallback('license_key')
  try {
    const res = await (await db()).query('SELECT id, tenant_id, license_type, license_status, module_scope_json, seat_limit, venue_limit, validation_status, safe_claim, expires_at, created_at FROM novee_os_license_keys WHERE id=$1', [id])
    return { ok: true, key: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createLicenseKeyPreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('license_key_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_license_keys (tenant_id, provisioning_request_id, license_type, module_scope_json, seat_limit, venue_limit, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id, tenant_id, license_type, license_status, module_scope_json, seat_limit, venue_limit, validation_status, safe_claim, created_at`,
      [payload.tenant_id || null, payload.provisioning_request_id || null, payload.license_type || 'pilot', JSON.stringify(payload.module_scope_json || []), payload.seat_limit || 0, payload.venue_limit || 0, payload.notes || null, idempotencyKey]
    )
    return { ok: true, key: res.rows[0] || null, license_status: 'draft', validation_status: 'not_validated' }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateLicenseKeyStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('license_key_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_license_keys SET license_status=$1, notes=$2, updated_at=now() WHERE id=$3 RETURNING id, license_type, license_status, validation_status, safe_claim`,
      [payload.license_status || 'draft', payload.notes || null, id]
    )
    return { ok: true, key: res.rows[0] || null, validation_status: 'not_validated' }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Module Activations ─────────────────────────────────────────────────────────

export async function listModuleActivations(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, activations: DEFAULT_MODULE_ACTIVATIONS.map(m => ({ ...m, activation_status: 'pending', activated_for_client: false, activated_for_pilot: false, activated_for_production: false, remote_activation_allowed: false })) }
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_module_activations WHERE tenant_id=$1 ORDER BY module_key' : 'SELECT * FROM novee_os_module_activations ORDER BY module_key'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, activations: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getModuleActivation(id) {
  if (!(await isDbAvailable())) return localFallback('module_activation')
  try {
    const res = await (await db()).query('SELECT * FROM novee_os_module_activations WHERE id=$1', [id])
    return { ok: true, activation: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createModuleActivationPreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('module_activation_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_module_activations (tenant_id, module_key, module_name, activation_mode, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id || null, payload.module_key, payload.module_name, payload.activation_mode || 'preview', payload.notes || null, idempotencyKey]
    )
    return { ok: true, activation: res.rows[0] || null, activated_for_client: false, activated_for_production: false, remote_activation_allowed: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateModuleActivationStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('module_activation_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_module_activations SET activation_status=$1, activation_mode=$2, notes=$3, updated_at=now() WHERE id=$4 RETURNING *`,
      [payload.activation_status || 'pending', payload.activation_mode || 'preview', payload.notes || null, id]
    )
    return { ok: true, activation: res.rows[0] || null, activated_for_client: false, remote_activation_allowed: false }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Deployment Versions ────────────────────────────────────────────────────────

export async function listDeploymentVersions(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('deployment_versions')
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_deployment_versions WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT * FROM novee_os_deployment_versions ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, versions: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getDeploymentVersion(id) {
  if (!(await isDbAvailable())) return localFallback('deployment_version')
  try {
    const res = await (await db()).query('SELECT * FROM novee_os_deployment_versions WHERE id=$1', [id])
    return { ok: true, version: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createDeploymentVersionPreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('deployment_version_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_deployment_versions (tenant_id, package_id, version_label, changelog_summary, module_versions_json, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id || null, payload.package_id || null, payload.version_label, payload.changelog_summary || null, JSON.stringify(payload.module_versions_json || {}), payload.notes || null, idempotencyKey]
    )
    return { ok: true, version: res.rows[0] || null, production_ready: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateDeploymentVersionStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('deployment_version_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_deployment_versions SET version_status=$1, changelog_summary=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [payload.version_status || 'draft', payload.changelog_summary || null, id]
    )
    return { ok: true, version: res.rows[0] || null, production_ready: false }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Rollback Records ───────────────────────────────────────────────────────────

export async function listRollbackRecords(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, records: DEFAULT_ROLLBACK_RECORDS.map(r => ({ ...r, rollback_execution_enabled: false })) }
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_rollback_records WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT * FROM novee_os_rollback_records ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, records: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getRollbackRecord(id) {
  if (!(await isDbAvailable())) return localFallback('rollback_record')
  try {
    const res = await (await db()).query('SELECT * FROM novee_os_rollback_records WHERE id=$1', [id])
    return { ok: true, record: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createRollbackRecordPreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('rollback_record_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_rollback_records (tenant_id, package_id, deployment_version_id, rollback_target_version, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id || null, payload.package_id || null, payload.deployment_version_id || null, payload.rollback_target_version || null, payload.notes || null, idempotencyKey]
    )
    return { ok: true, record: res.rows[0] || null, rollback_execution_enabled: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateRollbackRecordStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('rollback_record_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_rollback_records SET rollback_status=$1, notes=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [payload.rollback_status || 'not_initiated', payload.notes || null, id]
    )
    return { ok: true, record: res.rows[0] || null, rollback_execution_enabled: false }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Gate Dependencies ──────────────────────────────────────────────────────────

export async function getSecurityGateDependency() {
  return { ok: true, gate: 'security_activation', phase: 'E.3', required: true, status: 'required_before_remote_distribution', passed: false }
}

export async function getDeploymentGateDependency() {
  return { ok: true, gate: 'deployment_activation', phase: 'E.4', required: true, status: 'required_before_remote_distribution', passed: false }
}

export async function getPilotGateDependency() {
  return { ok: true, gate: 'live_pilot_readiness', phase: 'E.5', required: true, status: 'required_before_remote_distribution', passed: false }
}

// ── Readiness / Blockers ───────────────────────────────────────────────────────

export async function getRemoteDistributionReadinessScore() {
  return {
    ok: true,
    score: { gates_required: 3, gates_passed: 0, readiness_percent: 0 },
    remote_distribution_ready: false,
    production_ready: false,
    live_delivery_enabled: false,
    safety_status: 'BUILD_ONLY_NO_LIVE_REMOTE_DISTRIBUTION',
  }
}

export async function getRemoteDistributionBlockers() {
  return {
    ok: true,
    blockers: [
      { type: 'gate', key: 'security_activation', label: 'Phase E.3 Security Activation — must pass', phase: 'E.3' },
      { type: 'gate', key: 'deployment_activation', label: 'Phase E.4 Deployment Activation — must pass', phase: 'E.4' },
      { type: 'gate', key: 'live_pilot_readiness', label: 'Phase E.5 Live Pilot Readiness — must pass', phase: 'E.5' },
      { type: 'flag', key: 'NOVEE_REMOTE_MODULE_LIVE_DELIVERY_ENABLED', label: 'Live delivery flag is FALSE by default' },
      { type: 'flag', key: 'NOVEE_REMOTE_MODULE_CLIENT_PROVISIONING_ENABLED', label: 'Client provisioning flag is FALSE by default' },
      { type: 'flag', key: 'NOVEE_REMOTE_MODULE_INVITE_LINKS_ENABLED', label: 'Invite links flag is FALSE by default' },
      { type: 'flag', key: 'NOVEE_REMOTE_MODULE_LICENSE_VALIDATION_ENABLED', label: 'License validation flag is FALSE by default' },
      { type: 'flag', key: 'NOVEE_REMOTE_MODULE_REMOTE_ACTIVATION_ENABLED', label: 'Remote activation flag is FALSE by default' },
      { type: 'flag', key: 'NOVEE_REMOTE_MODULE_ROLLBACK_EXECUTION_ENABLED', label: 'Rollback execution flag is FALSE by default' },
    ],
    remote_distribution_ready: false,
  }
}

export async function getSafeRemoteDistributionClaims() {
  return {
    ok: true,
    safeClaims: [
      'Remote Module Distribution Center is built and operational.',
      'Module deployment packages are tracked (11 packages defined).',
      'Client provisioning requests can be previewed and tracked.',
      'Invite sessions can be previewed and tracked — no raw tokens exposed.',
      'License key records can be previewed and tracked — no raw keys exposed.',
      'Module activations are tracked for 13 modules.',
      'Deployment versions are tracked.',
      'Rollback planning is visible — execution remains disabled.',
      'Remote distribution remains blocked until E.3, E.4, and E.5 gates pass.',
      'All live delivery flags default to FALSE.',
    ],
    unsafeClaims: [
      'Do not claim remote delivery is live.',
      'Do not claim client provisioning is live.',
      'Do not claim invite links are live.',
      'Do not claim license validation is live.',
      'Do not claim tenant activation is live.',
      'Do not claim SmokeCraft is production-ready.',
      'Do not claim AMBI is built.',
      'Do not claim Agent X is built.',
      'Do not claim EgoMusic is built.',
      'Do not claim public go-live is enabled.',
      'Do not claim rollback execution is enabled.',
    ],
    safety_status: 'BUILD_ONLY_NO_LIVE_REMOTE_DISTRIBUTION',
    remote_distribution_ready: false,
  }
}

export async function writeRemoteDistributionAuditEvent(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('audit_event_write')
  try {
    await (await db()).query(
      `INSERT INTO novee_os_remote_distribution_audit_log (tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, metadata_json, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (idempotency_key) DO NOTHING`,
      [payload.tenant_id || null, actorId, payload.actor_role || null, payload.event_type, payload.event_category || 'general', payload.severity || 'info', payload.summary, JSON.stringify(payload.metadata_json || {}), idempotencyKey]
    )
    return { ok: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getRemoteDistributionAuditLog(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('audit_log')
  try {
    const d = await db()
    const q = tenantId ? 'SELECT id, tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_remote_distribution_audit_log WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100' : 'SELECT id, tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_remote_distribution_audit_log ORDER BY created_at DESC LIMIT 100'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, logs: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getRemoteDistributionFeatureFlagSnapshot() {
  return { ok: true, flags: FLAGS, remote_distribution_ready: false, live_delivery_enabled: false }
}

export async function validateRemoteModuleDistributionReadiness() {
  const blockers = await getRemoteDistributionBlockers()
  return {
    ok: true,
    blockers: blockers.blockers,
    remote_distribution_ready: false,
    live_delivery_enabled: false,
    client_provisioning_enabled: false,
    invite_links_enabled: false,
    license_validation_enabled: false,
    remote_activation_enabled: false,
    rollback_execution_enabled: false,
    safety_status: 'BUILD_ONLY_NO_LIVE_REMOTE_DISTRIBUTION',
    message: 'Remote Module Distribution Center is active. Live delivery requires E.3 Security, E.4 Deployment, and E.5 Pilot gates to pass.',
  }
}
