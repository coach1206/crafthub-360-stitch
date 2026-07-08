/**
 * NOVEE OS — Security Activation Service (Phase D.6 / Phase E.3)
 * contains_secrets: false
 * Preview-only writes. No live security enforcement. No fake claims.
 */

import { isDbAvailable } from '../../db/connection.js'
import {
  DEFAULT_SECURITY_GATES,
  DEFAULT_SECURITY_PROVIDERS,
  DEFAULT_SECURITY_RISKS,
  SAFE_SECURITY_CLAIM_LABELS,
  assertNoExposedSecrets,
  assertNoFakeCertificationClaims,
  assertNoFakeProviderConnectionClaims,
  assertNoFakeVulnerabilityScanClaims,
  assertNoFakePenTestClaims,
  assertRemoteDistributionBlockedUntilSecurityReady,
  validateSecurityGatePayload,
  validateSecurityProviderPayload,
  validateSecurityEvidencePayload,
} from './noveeOSSecurityActivationContracts.js'
import FEATURE_FLAGS from '../../config/noveeOSSecurityActivationFeatureFlags.js'

const AREA = 'novee_os_security_activation'

const localFallback = (area) => ({ ok: false, localPreview: true, error: 'database_not_configured', area })

// ── Helpers ───────────────────────────────────────────────────

function computeReadinessScore(gates) {
  if (!gates || gates.length === 0) return 0
  const required = gates.filter(g => g.required_for_remote_distribution)
  if (required.length === 0) return 0
  const passed = required.filter(g => g.status === 'passed').length
  return Math.round((passed / required.length) * 100)
}

function computeBlockers(gates) {
  return gates
    .filter(g => g.required_for_remote_distribution && g.status !== 'passed')
    .map(g => ({ gate_key: g.gate_key, gate_name: g.gate_name, status: g.status, reason: g.blocker_reason }))
}

// ── Service methods ───────────────────────────────────────────

export async function getSecurityActivationSummary(tenantId) {
  const gates     = await listSecurityActivationGates(tenantId)
  const providers = await listSecurityProviders(tenantId)
  const risks     = await listSecurityRisks(tenantId)
  const score     = computeReadinessScore(gates.data || DEFAULT_SECURITY_GATES)
  const blockers  = computeBlockers(gates.data || DEFAULT_SECURITY_GATES)

  return {
    ok:                            true,
    area:                          AREA,
    safety_status:                 'BUILD_ONLY_NO_LIVE_ENFORCEMENT',
    readiness_score:               score,
    production_ready:              false,
    production_enforcement_enabled: FEATURE_FLAGS.NOVEE_SECURITY_PRODUCTION_ENFORCEMENT_ENABLED,
    live_provider_connections:     FEATURE_FLAGS.NOVEE_SECURITY_LIVE_PROVIDER_CONNECTIONS_ENABLED,
    remote_distribution_allowed:   false,
    remote_distribution_blocked_reason: 'All security gates must pass before remote distribution is allowed.',
    blockers_count:                blockers.length,
    blockers,
    providers_configured:          (providers.data || DEFAULT_SECURITY_PROVIDERS).filter(p => p.configured).length,
    total_providers:               (providers.data || DEFAULT_SECURITY_PROVIDERS).length,
    open_risks:                    (risks.data || DEFAULT_SECURITY_RISKS).filter(r => r.status === 'open').length,
    safe_claims:                   SAFE_SECURITY_CLAIM_LABELS,
    timestamp:                     new Date().toISOString(),
  }
}

export async function listSecurityProviders(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: DEFAULT_SECURITY_PROVIDERS, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT * FROM novee_os_security_provider_registry WHERE tenant_id = $1 ORDER BY created_at'
      : 'SELECT * FROM novee_os_security_provider_registry ORDER BY created_at'
    const result = await db.query(q, tenantId ? [tenantId] : [])
    const rows = result.rows.length > 0 ? result.rows : DEFAULT_SECURITY_PROVIDERS
    return { ok: true, data: rows, area: AREA }
  } catch { return { ok: true, localPreview: true, data: DEFAULT_SECURITY_PROVIDERS, area: AREA } }
}

export async function getSecurityProvider(providerId) {
  if (!isDbAvailable()) {
    const found = DEFAULT_SECURITY_PROVIDERS.find(p => p.provider_key === providerId)
    return found ? { ok: true, localPreview: true, data: found, area: AREA } : localFallback(AREA)
  }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query('SELECT * FROM novee_os_security_provider_registry WHERE provider_id = $1', [providerId])
    if (result.rows.length === 0) return { ok: false, error: 'provider_not_found', area: AREA }
    return { ok: true, data: result.rows[0], area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function createSecurityProviderPreview(payload, actorId, ikey) {
  assertNoExposedSecrets(payload)
  assertNoFakeProviderConnectionClaims(payload)
  assertNoFakeCertificationClaims(payload)
  validateSecurityProviderPayload(payload)

  const safe = {
    ...payload,
    live_connection_enabled: false,
    production_ready:        false,
    configured:              false,
    credential_reference_only: true,
  }

  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `INSERT INTO novee_os_security_provider_registry
       (tenant_id, provider_key, provider_name, provider_type, status, configured, production_ready,
        live_connection_enabled, credential_reference_only, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,false,false,false,true,$6)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [safe.tenant_id, safe.provider_key, safe.provider_name, safe.provider_type, safe.status || 'preview', ikey || null]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function updateSecurityProviderStatusPreview(providerId, payload, actorId) {
  assertNoExposedSecrets(payload)
  assertNoFakeProviderConnectionClaims(payload)

  const safe = { ...payload, live_connection_enabled: false, production_ready: false }

  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `UPDATE novee_os_security_provider_registry SET status=$1, updated_at=NOW() WHERE provider_id=$2 RETURNING *`,
      [safe.status || 'preview', providerId]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function listSecurityActivationGates(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: DEFAULT_SECURITY_GATES, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT * FROM novee_os_security_activation_gates WHERE tenant_id = $1 ORDER BY created_at'
      : 'SELECT * FROM novee_os_security_activation_gates ORDER BY created_at'
    const result = await db.query(q, tenantId ? [tenantId] : [])
    const rows = result.rows.length > 0 ? result.rows : DEFAULT_SECURITY_GATES
    return { ok: true, data: rows, area: AREA }
  } catch { return { ok: true, localPreview: true, data: DEFAULT_SECURITY_GATES, area: AREA } }
}

export async function getSecurityActivationGate(gateId) {
  if (!isDbAvailable()) {
    const found = DEFAULT_SECURITY_GATES.find(g => g.gate_key === gateId)
    return found ? { ok: true, localPreview: true, data: found, area: AREA } : localFallback(AREA)
  }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query('SELECT * FROM novee_os_security_activation_gates WHERE gate_id = $1', [gateId])
    if (result.rows.length === 0) return { ok: false, error: 'gate_not_found', area: AREA }
    return { ok: true, data: result.rows[0], area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function updateSecurityActivationGatePreview(gateId, payload, actorId) {
  validateSecurityGatePayload(payload)
  assertNoExposedSecrets(payload)

  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `UPDATE novee_os_security_activation_gates SET status=$1, blocker_reason=$2, evidence_present=$3, updated_at=NOW() WHERE gate_id=$4 RETURNING *`,
      [payload.status, payload.blocker_reason || null, payload.evidence_present || false, gateId]
    )
    return { ok: true, data: result.rows[0] || payload, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function listSecurityRisks(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: DEFAULT_SECURITY_RISKS, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT * FROM novee_os_security_risk_registry WHERE tenant_id = $1 ORDER BY severity, created_at'
      : 'SELECT * FROM novee_os_security_risk_registry ORDER BY severity, created_at'
    const result = await db.query(q, tenantId ? [tenantId] : [])
    const rows = result.rows.length > 0 ? result.rows : DEFAULT_SECURITY_RISKS
    return { ok: true, data: rows, area: AREA }
  } catch { return { ok: true, localPreview: true, data: DEFAULT_SECURITY_RISKS, area: AREA } }
}

export async function createSecurityRiskPreview(payload, actorId, ikey) {
  assertNoExposedSecrets(payload)
  assertNoFakeCertificationClaims(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `INSERT INTO novee_os_security_risk_registry
       (tenant_id, risk_key, risk_title, risk_category, severity, status, owner_role, mitigation_summary, blocker, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id, payload.risk_key, payload.risk_title, payload.risk_category,
       payload.severity || 'medium', payload.status || 'open', payload.owner_role || null,
       payload.mitigation_summary || null, payload.blocker || false, ikey || null]
    )
    return { ok: true, data: result.rows[0] || payload, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function updateSecurityRiskStatusPreview(riskId, payload, actorId) {
  assertNoExposedSecrets(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `UPDATE novee_os_security_risk_registry SET status=$1, updated_at=NOW() WHERE risk_id=$2 RETURNING *`,
      [payload.status, riskId]
    )
    return { ok: true, data: result.rows[0] || payload, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function listSecurityEvidence(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: [], area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT * FROM novee_os_security_readiness_evidence WHERE tenant_id = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM novee_os_security_readiness_evidence ORDER BY created_at DESC'
    const result = await db.query(q, tenantId ? [tenantId] : [])
    return { ok: true, data: result.rows, area: AREA }
  } catch { return { ok: true, localPreview: true, data: [], area: AREA } }
}

export async function createSecurityEvidencePreview(payload, actorId, ikey) {
  validateSecurityEvidencePayload(payload)
  assertNoExposedSecrets(payload)
  assertNoFakeCertificationClaims(payload)
  assertNoFakeVulnerabilityScanClaims(payload)
  assertNoFakePenTestClaims(payload)

  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `INSERT INTO novee_os_security_readiness_evidence
       (tenant_id, evidence_type, evidence_title, evidence_status, source, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id, payload.evidence_type, payload.evidence_title,
       payload.evidence_status || 'pending', payload.source || null, payload.notes || null, ikey || null]
    )
    return { ok: true, data: result.rows[0] || payload, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function getSecurityReadinessScore(tenantId) {
  const gates = await listSecurityActivationGates(tenantId)
  const score = computeReadinessScore(gates.data || DEFAULT_SECURITY_GATES)
  return { ok: true, score, production_ready: false, remote_distribution_allowed: false, area: AREA }
}

export async function getSecurityBlockers(tenantId) {
  const gates = await listSecurityActivationGates(tenantId)
  const blockers = computeBlockers(gates.data || DEFAULT_SECURITY_GATES)
  assertRemoteDistributionBlockedUntilSecurityReady({ remote_distribution_allowed: false })
  return {
    ok: true,
    blockers,
    remote_distribution_allowed: false,
    remote_distribution_blocked_reason: 'All required security gates must pass before remote distribution is enabled.',
    area: AREA,
  }
}

export async function getRemoteDistributionSecurityGate(tenantId) {
  const gatesResult = await listSecurityActivationGates(tenantId)
  const gates = gatesResult.data || DEFAULT_SECURITY_GATES
  const remoteGate = gates.find(g => g.gate_key === 'remote_distribution_security_lock')
  return {
    ok: true,
    gate:                          remoteGate || null,
    remote_distribution_allowed:   false,
    blocked:                       true,
    blocked_reason:                'Remote distribution security gate requires all upstream security gates to pass first.',
    required_gates_passed:         0,
    total_required_gates:          gates.filter(g => g.required_for_remote_distribution).length,
    area:                          AREA,
  }
}

export async function getSafeSecurityClaims() {
  return {
    ok:   true,
    area: AREA,
    can_claim: [
      'Security Activation Center exists (Phase D.6 built)',
      'Security gates are tracked and visible',
      'Security blockers are surfaced in the operator dashboard',
      'Remote distribution is blocked until required security gates pass',
      'Audit event tracking is built',
      'Risk registry exists',
      'Evidence tracking exists',
      'No fake certification claims are permitted',
      'No fake provider connection claims are permitted',
      'Secrets are not exposed in API responses',
    ],
    cannot_claim_without_proof: [
      'SOC 2 certified',
      'ISO 27001 certified',
      'HIPAA compliant',
      'PCI DSS compliant',
      'Penetration tested',
      'Vulnerability scan passed',
      'Live WAF connected',
      'Live security provider connected',
      'Production remote distribution secured',
    ],
  }
}

export async function writeSecurityAuditEvent(event, tenantId, actorId) {
  assertNoExposedSecrets(event)
  const safe = {
    tenant_id:      tenantId || null,
    actor_id:       actorId  || 'system',
    actor_role:     event.actor_role     || 'system',
    event_type:     event.event_type     || 'security_event',
    event_category: event.event_category || 'general',
    severity:       event.severity       || 'info',
    summary:        event.summary        || 'Security event recorded.',
    metadata_json:  event.metadata       || null,
    ip_address:     null,
    user_agent:     null,
  }

  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `INSERT INTO novee_os_security_audit_log
       (tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, metadata_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [safe.tenant_id, safe.actor_id, safe.actor_role, safe.event_type,
       safe.event_category, safe.severity, safe.summary, safe.metadata_json]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function getSecurityAuditLog(tenantId, limit = 50) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: [], area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT audit_id, tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_security_audit_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2'
      : 'SELECT audit_id, tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_security_audit_log ORDER BY created_at DESC LIMIT $1'
    const args = tenantId ? [tenantId, limit] : [limit]
    const result = await db.query(q, args)
    return { ok: true, data: result.rows, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function getSecurityFeatureFlagSnapshot() {
  const FEATURE_FLAGS_MODULE = await import('../../config/noveeOSSecurityActivationFeatureFlags.js')
  const flags = FEATURE_FLAGS_MODULE.default
  return {
    ok:   true,
    area: AREA,
    flags: Object.entries(flags).map(([key, value]) => ({
      flag_key:          key,
      flag_value:        value,
      flag_category:     key.includes('LIVE') || key.includes('ENFORCEMENT') ? 'production_gate' : 'safety',
      production_impact: key.includes('ENFORCEMENT') || key.includes('LIVE'),
      safe_default:      !value || key.includes('BLOCKED') || key.includes('REQUIRES') || key.includes('ENABLED') && !key.includes('LIVE') && !key.includes('ENFORCEMENT'),
    })),
  }
}

export async function validateSecurityActivationReadiness(tenantId) {
  const summary = await getSecurityActivationSummary(tenantId)
  return {
    ok:                         true,
    area:                       AREA,
    readiness_score:            summary.readiness_score,
    production_ready:           false,
    remote_distribution_ready:  false,
    blockers:                   summary.blockers,
    blockers_count:             summary.blockers_count,
    safety_status:              'BUILD_ONLY_NO_LIVE_ENFORCEMENT',
    message:                    'Security activation center is built and tracked. No live enforcement is active. Remote distribution remains blocked.',
    recommended_next_phase:     'Phase E.4 — Deployment Activation',
  }
}
