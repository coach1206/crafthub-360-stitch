/**
 * NOVEE OS — Deployment Activation Service (Phase D.7 / Phase E.4)
 * contains_secrets: false
 * Preview-only writes. No live production deployment. Rollback execution disabled.
 */

import { isDbAvailable } from '../../db/connection.js'
import {
  DEFAULT_DEPLOYMENT_GATES,
  DEFAULT_DEPLOYMENT_PACKAGES,
  DEFAULT_ROLLBACK_PLANS,
  SAFE_DEPLOYMENT_CLAIM_LABELS,
  assertNoExposedDeploymentSecrets,
  assertNoFakeProductionProofClaims,
  assertNoFakeRailwayReadinessClaims,
  assertNoFakeVercelReadinessClaims,
  assertNoFakeBuildPassClaims,
  assertNoFakeVerificationPassClaims,
  assertNoRollbackExecutionClaims,
  assertNoRemoteDistributionBeforeDeploymentReady,
  assertSecurityGateRequired,
  validateDeploymentGatePayload,
  validateDeploymentPackagePayload,
  validateDeploymentEnvironmentPayload,
  validateDeploymentEvidencePayload,
} from './noveeOSDeploymentActivationContracts.js'
import FEATURE_FLAGS from '../../config/noveeOSDeploymentActivationFeatureFlags.js'

const AREA = 'novee_os_deployment_activation'

const localFallback = () => ({ ok: false, localPreview: true, error: 'database_not_configured', area: AREA })

const DEFAULT_ENVIRONMENTS = [
  { environment_key: 'local',      environment_name: 'Local Development',  environment_type: 'local',      hosting_provider: 'self_hosted', status: 'preview', production_candidate: false, verified: false, verification_status: 'not_applicable', safe_claim: 'local_preview_only' },
  { environment_key: 'preview',    environment_name: 'Preview Environment', environment_type: 'preview',    hosting_provider: 'railway',     status: 'preview', production_candidate: false, verified: false, verification_status: 'pending',        safe_claim: 'preview_only' },
  { environment_key: 'staging',    environment_name: 'Staging Environment', environment_type: 'staging',    hosting_provider: 'railway',     status: 'preview', production_candidate: false, verified: false, verification_status: 'pending',        safe_claim: 'not_configured' },
  { environment_key: 'production', environment_name: 'Production',          environment_type: 'production', hosting_provider: 'railway',     status: 'pending', production_candidate: false, verified: false, verification_status: 'pending',        safe_claim: 'not_verified' },
  { environment_key: 'railway',    environment_name: 'Railway',             environment_type: 'railway',    hosting_provider: 'railway',     status: 'pending', production_candidate: false, verified: false, verification_status: 'pending',        safe_claim: 'not_verified' },
  { environment_key: 'vercel',     environment_name: 'Vercel',              environment_type: 'vercel',     hosting_provider: 'vercel',      status: 'pending', production_candidate: false, verified: false, verification_status: 'pending',        safe_claim: 'not_verified' },
  { environment_key: 'github',     environment_name: 'GitHub Actions',      environment_type: 'github',     hosting_provider: 'github_actions', status: 'pending', production_candidate: false, verified: false, verification_status: 'pending',     safe_claim: 'not_verified' },
  { environment_key: 'external',   environment_name: 'External Provider',   environment_type: 'external',   hosting_provider: 'external',    status: 'pending', production_candidate: false, verified: false, verification_status: 'pending',        safe_claim: 'not_configured' },
]

// ── Helpers ───────────────────────────────────────────────────

function computeReadinessScore(gates) {
  const required = (gates || []).filter(g => g.required_for_deployment)
  if (required.length === 0) return 0
  return Math.round(required.filter(g => g.status === 'passed').length / required.length * 100)
}

function computeBlockers(gates) {
  return (gates || [])
    .filter(g => g.required_for_deployment && g.status !== 'passed')
    .map(g => ({ gate_key: g.gate_key, gate_name: g.gate_name, status: g.status, reason: g.blocker_reason }))
}

// ── Service methods ───────────────────────────────────────────

export async function getDeploymentActivationSummary(tenantId) {
  const gates    = await listDeploymentReadinessGates(tenantId)
  const packages = await listDeploymentPackages(tenantId)
  const score    = computeReadinessScore(gates.data || DEFAULT_DEPLOYMENT_GATES)
  const blockers = computeBlockers(gates.data || DEFAULT_DEPLOYMENT_GATES)

  assertNoRemoteDistributionBeforeDeploymentReady({ remote_distribution_ready: false })

  return {
    ok:                            true,
    area:                          AREA,
    safety_status:                 'BUILD_ONLY_NO_LIVE_DEPLOYMENT',
    readiness_score:               score,
    production_ready:              false,
    deployment_ready:              false,
    remote_distribution_ready:     false,
    live_production_enabled:       FEATURE_FLAGS.NOVEE_DEPLOYMENT_LIVE_PRODUCTION_ENABLED,
    rollback_execution_enabled:    FEATURE_FLAGS.NOVEE_DEPLOYMENT_ROLLBACK_EXECUTION_ENABLED,
    remote_distribution_enabled:   FEATURE_FLAGS.NOVEE_DEPLOYMENT_REMOTE_DISTRIBUTION_ENABLED,
    security_gate_required:        FEATURE_FLAGS.NOVEE_DEPLOYMENT_SECURITY_GATE_REQUIRED,
    security_gate_bypassed:        false,
    blockers_count:                blockers.length,
    blockers,
    packages_deployment_ready:     (packages.data || DEFAULT_DEPLOYMENT_PACKAGES).filter(p => p.deployment_ready).length,
    total_packages:                (packages.data || DEFAULT_DEPLOYMENT_PACKAGES).length,
    safe_claims:                   SAFE_DEPLOYMENT_CLAIM_LABELS,
    timestamp:                     new Date().toISOString(),
  }
}

export async function listDeploymentEnvironments(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: DEFAULT_ENVIRONMENTS, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT * FROM novee_os_deployment_environment_registry WHERE tenant_id=$1 ORDER BY created_at'
      : 'SELECT * FROM novee_os_deployment_environment_registry ORDER BY created_at'
    const result = await db.query(q, tenantId ? [tenantId] : [])
    return { ok: true, data: result.rows.length > 0 ? result.rows : DEFAULT_ENVIRONMENTS, area: AREA }
  } catch { return { ok: true, localPreview: true, data: DEFAULT_ENVIRONMENTS, area: AREA } }
}

export async function getDeploymentEnvironment(environmentId) {
  if (!isDbAvailable()) {
    const found = DEFAULT_ENVIRONMENTS.find(e => e.environment_key === environmentId)
    return found ? { ok: true, localPreview: true, data: found, area: AREA } : localFallback()
  }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query('SELECT * FROM novee_os_deployment_environment_registry WHERE environment_id=$1', [environmentId])
    if (result.rows.length === 0) return { ok: false, error: 'environment_not_found', area: AREA }
    return { ok: true, data: result.rows[0], area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function createDeploymentEnvironmentPreview(payload, actorId, ikey) {
  validateDeploymentEnvironmentPayload(payload)
  const safe = { ...payload, production_candidate: false, verified: false, verification_status: 'pending' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `INSERT INTO novee_os_deployment_environment_registry
       (tenant_id, environment_key, environment_name, environment_type, hosting_provider, status, production_candidate, verified, verification_status, safe_claim, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,false,false,'pending',$7,$8)
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [safe.tenant_id, safe.environment_key, safe.environment_name, safe.environment_type,
       safe.hosting_provider || null, safe.status || 'preview', safe.safe_claim || 'preview_only', ikey || null]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function updateDeploymentEnvironmentStatusPreview(environmentId, payload, actorId) {
  assertNoExposedDeploymentSecrets(payload)
  assertNoFakeProductionProofClaims(payload)
  assertNoFakeRailwayReadinessClaims(payload)
  assertNoFakeVercelReadinessClaims(payload)
  const safe = { ...payload, production_candidate: false, verified: false }
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `UPDATE novee_os_deployment_environment_registry SET status=$1, updated_at=NOW() WHERE environment_id=$2 RETURNING *`,
      [safe.status || 'preview', environmentId]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function listDeploymentReadinessGates(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: DEFAULT_DEPLOYMENT_GATES, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT * FROM novee_os_deployment_readiness_gates WHERE tenant_id=$1 ORDER BY created_at'
      : 'SELECT * FROM novee_os_deployment_readiness_gates ORDER BY created_at'
    const result = await db.query(q, tenantId ? [tenantId] : [])
    return { ok: true, data: result.rows.length > 0 ? result.rows : DEFAULT_DEPLOYMENT_GATES, area: AREA }
  } catch { return { ok: true, localPreview: true, data: DEFAULT_DEPLOYMENT_GATES, area: AREA } }
}

export async function getDeploymentReadinessGate(gateId) {
  if (!isDbAvailable()) {
    const found = DEFAULT_DEPLOYMENT_GATES.find(g => g.gate_key === gateId)
    return found ? { ok: true, localPreview: true, data: found, area: AREA } : localFallback()
  }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query('SELECT * FROM novee_os_deployment_readiness_gates WHERE gate_id=$1', [gateId])
    if (result.rows.length === 0) return { ok: false, error: 'gate_not_found', area: AREA }
    return { ok: true, data: result.rows[0], area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function updateDeploymentReadinessGatePreview(gateId, payload, actorId) {
  validateDeploymentGatePayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `UPDATE novee_os_deployment_readiness_gates SET status=$1, blocker_reason=$2, evidence_present=$3, updated_at=NOW() WHERE gate_id=$4 RETURNING *`,
      [payload.status, payload.blocker_reason || null, payload.evidence_present || false, gateId]
    )
    return { ok: true, data: result.rows[0] || payload, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function listDeploymentPackages(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: DEFAULT_DEPLOYMENT_PACKAGES, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT * FROM novee_os_deployment_package_registry WHERE tenant_id=$1 ORDER BY created_at'
      : 'SELECT * FROM novee_os_deployment_package_registry ORDER BY created_at'
    const result = await db.query(q, tenantId ? [tenantId] : [])
    return { ok: true, data: result.rows.length > 0 ? result.rows : DEFAULT_DEPLOYMENT_PACKAGES, area: AREA }
  } catch { return { ok: true, localPreview: true, data: DEFAULT_DEPLOYMENT_PACKAGES, area: AREA } }
}

export async function getDeploymentPackage(packageId) {
  if (!isDbAvailable()) {
    const found = DEFAULT_DEPLOYMENT_PACKAGES.find(p => p.package_key === packageId)
    return found ? { ok: true, localPreview: true, data: found, area: AREA } : localFallback()
  }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query('SELECT * FROM novee_os_deployment_package_registry WHERE package_id=$1', [packageId])
    if (result.rows.length === 0) return { ok: false, error: 'package_not_found', area: AREA }
    return { ok: true, data: result.rows[0], area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function createDeploymentPackagePreview(payload, actorId, ikey) {
  validateDeploymentPackagePayload(payload)
  const safe = { ...payload, deployment_ready: false, remote_distribution_ready: false, build_status: 'not_built', verification_status: 'not_verified' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `INSERT INTO novee_os_deployment_package_registry
       (tenant_id, package_key, package_name, package_type, version_label, status, build_status, verification_status, security_gate_status, deployment_ready, remote_distribution_ready, safe_claim, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,'not_built','not_verified','pending',false,false,$7,$8)
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [safe.tenant_id, safe.package_key, safe.package_name, safe.package_type,
       safe.version_label || '0.1.0-preview', safe.status || 'preview', safe.safe_claim || 'preview_only', ikey || null]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function updateDeploymentPackageStatusPreview(packageId, payload, actorId) {
  assertNoExposedDeploymentSecrets(payload)
  assertNoFakeProductionProofClaims(payload)
  assertNoFakeBuildPassClaims(payload)
  const safe = { ...payload, deployment_ready: false, remote_distribution_ready: false }
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `UPDATE novee_os_deployment_package_registry SET status=$1, updated_at=NOW() WHERE package_id=$2 RETURNING *`,
      [safe.status || 'preview', packageId]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function listRollbackPlans(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: DEFAULT_ROLLBACK_PLANS, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT * FROM novee_os_rollback_plan_registry WHERE tenant_id=$1 ORDER BY created_at'
      : 'SELECT * FROM novee_os_rollback_plan_registry ORDER BY created_at'
    const result = await db.query(q, tenantId ? [tenantId] : [])
    return { ok: true, data: result.rows.length > 0 ? result.rows : DEFAULT_ROLLBACK_PLANS, area: AREA }
  } catch { return { ok: true, localPreview: true, data: DEFAULT_ROLLBACK_PLANS, area: AREA } }
}

export async function getRollbackPlan(rollbackPlanId) {
  if (!isDbAvailable()) {
    const found = DEFAULT_ROLLBACK_PLANS.find(p => p.plan_key === rollbackPlanId)
    return found ? { ok: true, localPreview: true, data: found, area: AREA } : localFallback()
  }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query('SELECT * FROM novee_os_rollback_plan_registry WHERE rollback_plan_id=$1', [rollbackPlanId])
    if (result.rows.length === 0) return { ok: false, error: 'rollback_plan_not_found', area: AREA }
    return { ok: true, data: result.rows[0], area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function createRollbackPlanPreview(payload, actorId, ikey) {
  assertNoExposedDeploymentSecrets(payload)
  assertNoRollbackExecutionClaims(payload)
  const safe = { ...payload, rollback_execution_enabled: false, rollback_tested: false }
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `INSERT INTO novee_os_rollback_plan_registry
       (tenant_id, plan_key, plan_name, rollback_available, rollback_execution_enabled, rollback_tested, blocker_reason, safe_claim, idempotency_key)
       VALUES ($1,$2,$3,false,false,false,$4,$5,$6)
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [safe.tenant_id, safe.plan_key, safe.plan_name, safe.blocker_reason || null, safe.safe_claim || 'rollback_planning_tracked', ikey || null]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function updateRollbackPlanStatusPreview(rollbackPlanId, payload, actorId) {
  assertNoExposedDeploymentSecrets(payload)
  assertNoRollbackExecutionClaims(payload)
  const safe = { ...payload, rollback_execution_enabled: false }
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `UPDATE novee_os_rollback_plan_registry SET rollback_available=$1, updated_at=NOW() WHERE rollback_plan_id=$2 RETURNING *`,
      [safe.rollback_available || false, rollbackPlanId]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function listDeploymentEvidence(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: [], area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT * FROM novee_os_deployment_evidence_registry WHERE tenant_id=$1 ORDER BY created_at DESC'
      : 'SELECT * FROM novee_os_deployment_evidence_registry ORDER BY created_at DESC'
    const result = await db.query(q, tenantId ? [tenantId] : [])
    return { ok: true, data: result.rows, area: AREA }
  } catch { return { ok: true, localPreview: true, data: [], area: AREA } }
}

export async function createDeploymentEvidencePreview(payload, actorId, ikey) {
  validateDeploymentEvidencePayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `INSERT INTO novee_os_deployment_evidence_registry
       (tenant_id, evidence_type, evidence_title, evidence_status, source, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id, payload.evidence_type, payload.evidence_title,
       payload.evidence_status || 'pending', payload.source || null, payload.notes || null, ikey || null]
    )
    return { ok: true, data: result.rows[0] || payload, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function getDeploymentReadinessScore(tenantId) {
  const gates = await listDeploymentReadinessGates(tenantId)
  const score = computeReadinessScore(gates.data || DEFAULT_DEPLOYMENT_GATES)
  return { ok: true, score, deployment_ready: false, remote_distribution_ready: false, area: AREA }
}

export async function getDeploymentBlockers(tenantId) {
  const gates = await listDeploymentReadinessGates(tenantId)
  const blockers = computeBlockers(gates.data || DEFAULT_DEPLOYMENT_GATES)
  return {
    ok: true, blockers,
    deployment_ready:              false,
    remote_distribution_ready:     false,
    rollback_execution_enabled:    false,
    remote_distribution_blocked_reason: 'All deployment gates and security gates must pass before remote distribution is enabled.',
    area: AREA,
  }
}

export async function getSecurityGateDependency() {
  return {
    ok:                          true,
    area:                        AREA,
    security_gate_required:      true,
    security_gate_bypassed:      false,
    security_activation_phase:   'Phase E.3',
    security_activation_route:   '/phase-d/security-activation',
    security_gates_required:     14,
    security_gates_passed:       0,
    message:                     'Phase E.3 Security Activation must complete all 14 required gates before deployment activation can proceed.',
  }
}

export async function getRemoteDistributionDeploymentGate(tenantId) {
  const gatesResult = await listDeploymentReadinessGates(tenantId)
  const gates = gatesResult.data || DEFAULT_DEPLOYMENT_GATES
  const total = gates.filter(g => g.required_for_remote_distribution).length
  return {
    ok:                          true,
    gate_key:                    'remote_distribution_deployment_gate',
    blocked:                     true,
    remote_distribution_ready:   false,
    deployment_ready:            false,
    rollback_execution_enabled:  false,
    blocked_reason:              'All 19 deployment gates and Phase E.3 security gates must pass before remote distribution is allowed.',
    required_gates_passed:       0,
    total_required_gates:        total,
    area:                        AREA,
  }
}

export async function getSafeDeploymentClaims() {
  return {
    ok: true, area: AREA,
    can_claim: [
      'Deployment Activation Center exists (Phase D.7 built)',
      'Deployment readiness gates are tracked (19 gates)',
      'Deployment blockers are visible in the operator dashboard',
      'Rollback planning records are tracked',
      'Rollback execution is disabled',
      'Remote distribution remains blocked until all deployment gates pass',
      'Security gate dependency is enforced (Phase E.3 required)',
      'No fake production proof claims are permitted',
      'No fake Railway/Vercel readiness claims are permitted',
      'No secrets are exposed in API responses',
      'Deployment package registry exists (8 packages tracked)',
      'Environment registry exists (8 environments tracked)',
    ],
    cannot_claim_without_proof: [
      'Production deployment is live',
      'Railway production database is verified',
      'Vercel production deployment is verified',
      'GitHub deployment workflow is verified',
      'Build passed in production',
      'All verification scripts passed in production',
      'Rollback execution is enabled',
      'Client remote deployment is available',
      'Remote module distribution is live',
    ],
  }
}

export async function writeDeploymentAuditEvent(event, tenantId, actorId) {
  assertNoExposedDeploymentSecrets(event)
  const safe = {
    tenant_id:      tenantId || null,
    actor_id:       actorId  || 'system',
    actor_role:     event.actor_role     || 'system',
    event_type:     event.event_type     || 'deployment_event',
    event_category: event.event_category || 'general',
    severity:       event.severity       || 'info',
    summary:        event.summary        || 'Deployment event recorded.',
    metadata_json:  event.metadata       || null,
  }
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: safe, area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const result = await db.query(
      `INSERT INTO novee_os_deployment_audit_log
       (tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, metadata_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [safe.tenant_id, safe.actor_id, safe.actor_role, safe.event_type,
       safe.event_category, safe.severity, safe.summary, safe.metadata_json]
    )
    return { ok: true, data: result.rows[0] || safe, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function getDeploymentAuditLog(tenantId, limit = 50) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: [], area: AREA }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId
      ? 'SELECT audit_id, tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_deployment_audit_log WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2'
      : 'SELECT audit_id, tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_deployment_audit_log ORDER BY created_at DESC LIMIT $1'
    const result = await db.query(q, tenantId ? [tenantId, limit] : [limit])
    return { ok: true, data: result.rows, area: AREA }
  } catch (e) { return { ok: false, error: e.message, area: AREA } }
}

export async function getDeploymentFeatureFlagSnapshot() {
  return {
    ok: true, area: AREA,
    flags: Object.entries(FEATURE_FLAGS).map(([key, value]) => ({
      flag_key:          key,
      flag_value:        value,
      flag_category:     key.includes('LIVE') || key.includes('ROLLBACK') || key.includes('REMOTE') ? 'production_gate' : 'safety',
      production_impact: key.includes('LIVE') || key.includes('ROLLBACK_EXECUTION') || key.includes('REMOTE_DISTRIBUTION'),
      safe_default:      !value || key.includes('BLOCKED') || key.includes('REQUIRED') || (key.includes('ENABLED') && !key.includes('LIVE') && !key.includes('ROLLBACK') && !key.includes('REMOTE')),
    })),
  }
}

export async function validateDeploymentActivationReadiness(tenantId) {
  const summary = await getDeploymentActivationSummary(tenantId)
  return {
    ok:                          true,
    area:                        AREA,
    readiness_score:             summary.readiness_score,
    deployment_ready:            false,
    remote_distribution_ready:   false,
    rollback_execution_enabled:  false,
    blockers:                    summary.blockers,
    blockers_count:              summary.blockers_count,
    safety_status:               'BUILD_ONLY_NO_LIVE_DEPLOYMENT',
    message:                     'Deployment activation center is built and tracked. No live deployment is active. Remote distribution and rollback execution remain disabled.',
    recommended_next_phase:      'Phase E.5 — Live Pilot Readiness',
  }
}
