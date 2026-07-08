// Phase E.5 — NOVEE OS Live Pilot Readiness Service
// BUILD ONLY — no live pilot approval, no go-live, no remote distribution

import { DEFAULT_PILOT_READINESS_GATES, DEFAULT_PILOT_MODULES } from './noveeOSLivePilotReadinessContracts.js'
import NOVEE_OS_LIVE_PILOT_READINESS_FLAGS from '../../config/noveeOSLivePilotReadinessFeatureFlags.js'

const localFallback = (area) => ({ ok: false, localPreview: true, error: 'database_not_configured', area })

async function isDbAvailable() {
  try { const m = await import('../../db/connection.js'); return !!m.default }
  catch { return false }
}

export async function listPilotVenues(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('pilot_venues')
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId ? 'SELECT * FROM novee_os_pilot_venue_registry WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT * FROM novee_os_pilot_venue_registry ORDER BY created_at DESC'
    const res = tenantId ? await db.query(q, [tenantId]) : await db.query(q)
    return { ok: true, venues: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getPilotVenue(id) {
  if (!(await isDbAvailable())) return localFallback('pilot_venue')
  try {
    const db = (await import('../../db/connection.js')).default
    const res = await db.query('SELECT * FROM novee_os_pilot_venue_registry WHERE id=$1', [id])
    return { ok: true, venue: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createPilotVenuePreview(payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('pilot_venue_create')
  try {
    const db = (await import('../../db/connection.js')).default
    const res = await db.query(
      `INSERT INTO novee_os_pilot_venue_registry (tenant_id, venue_name, venue_type, notes)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [payload.tenant_id || null, payload.venue_name, payload.venue_type, payload.notes || null]
    )
    return { ok: true, venue: res.rows[0], pilot_approved: false, go_live_approved: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listPilotReadinessGates(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, gates: DEFAULT_PILOT_READINESS_GATES.map(g => ({ ...g, gate_status: 'not_started', pilot_approved: false })) }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId ? 'SELECT * FROM novee_os_live_pilot_readiness_gates WHERE tenant_id=$1 ORDER BY sort_order' : 'SELECT * FROM novee_os_live_pilot_readiness_gates ORDER BY sort_order'
    const res = tenantId ? await db.query(q, [tenantId]) : await db.query(q)
    return { ok: true, gates: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getPilotReadinessGate(gateKey) {
  if (!(await isDbAvailable())) return localFallback('pilot_gate')
  try {
    const db = (await import('../../db/connection.js')).default
    const res = await db.query('SELECT * FROM novee_os_live_pilot_readiness_gates WHERE gate_key=$1', [gateKey])
    return { ok: true, gate: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updatePilotReadinessGatePreview(gateKey, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('pilot_gate_update')
  try {
    const db = (await import('../../db/connection.js')).default
    const res = await db.query(
      `UPDATE novee_os_live_pilot_readiness_gates SET gate_status=$1, notes=$2, updated_at=now() WHERE gate_key=$3 RETURNING *`,
      [payload.gate_status || 'not_started', payload.notes || null, gateKey]
    )
    return { ok: true, gate: res.rows[0] || null, pilot_approved: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listModuleReadiness(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, modules: DEFAULT_PILOT_MODULES.map(m => ({ ...m, readiness_status: 'not_evaluated', pilot_approved: false, production_ready: false })) }
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId ? 'SELECT * FROM novee_os_pilot_module_readiness_registry WHERE tenant_id=$1 ORDER BY module_family,module_key' : 'SELECT * FROM novee_os_pilot_module_readiness_registry ORDER BY module_family,module_key'
    const res = tenantId ? await db.query(q, [tenantId]) : await db.query(q)
    return { ok: true, modules: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getModuleReadiness(moduleKey) {
  if (!(await isDbAvailable())) return localFallback('module_readiness')
  try {
    const db = (await import('../../db/connection.js')).default
    const res = await db.query('SELECT * FROM novee_os_pilot_module_readiness_registry WHERE module_key=$1', [moduleKey])
    return { ok: true, module: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateModuleReadinessPreview(moduleKey, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('module_readiness_update')
  try {
    const db = (await import('../../db/connection.js')).default
    const res = await db.query(
      `UPDATE novee_os_pilot_module_readiness_registry SET readiness_status=$1, blocking_issues=$2, notes=$3, last_evaluated_at=now(), updated_at=now() WHERE module_key=$4 RETURNING *`,
      [payload.readiness_status || 'not_evaluated', payload.blocking_issues || 0, payload.notes || null, moduleKey]
    )
    return { ok: true, module: res.rows[0] || null, pilot_approved: false, production_ready: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listPilotChecklist(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('pilot_checklist')
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId ? 'SELECT * FROM novee_os_pilot_checklist_registry WHERE tenant_id=$1 ORDER BY category,created_at' : 'SELECT * FROM novee_os_pilot_checklist_registry ORDER BY category,created_at'
    const res = tenantId ? await db.query(q, [tenantId]) : await db.query(q)
    return { ok: true, checklist: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updatePilotChecklistItem(checklistKey, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('checklist_update')
  try {
    const db = (await import('../../db/connection.js')).default
    const res = await db.query(
      `UPDATE novee_os_pilot_checklist_registry SET status=$1, completed=$2, notes=$3, updated_at=now() WHERE checklist_key=$4 RETURNING *`,
      [payload.status || 'pending', payload.completed || false, payload.notes || null, checklistKey]
    )
    return { ok: true, item: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listPilotEvidence(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('pilot_evidence')
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId ? 'SELECT * FROM novee_os_pilot_evidence_registry WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT * FROM novee_os_pilot_evidence_registry ORDER BY created_at DESC'
    const res = tenantId ? await db.query(q, [tenantId]) : await db.query(q)
    return { ok: true, evidence: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function submitPilotEvidencePreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('pilot_evidence_submit')
  try {
    const db = (await import('../../db/connection.js')).default
    const res = await db.query(
      `INSERT INTO novee_os_pilot_evidence_registry (tenant_id, gate_id, evidence_type, evidence_label, evidence_url, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id || null, payload.gate_id || null, payload.evidence_type, payload.evidence_label, payload.evidence_url || null, payload.notes || null, idempotencyKey]
    )
    return { ok: true, evidence: res.rows[0] || null, verified: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listPilotAuditLog(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('pilot_audit_log')
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId ? 'SELECT * FROM novee_os_pilot_audit_log WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100' : 'SELECT * FROM novee_os_pilot_audit_log ORDER BY created_at DESC LIMIT 100'
    const res = tenantId ? await db.query(q, [tenantId]) : await db.query(q)
    return { ok: true, logs: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function logPilotAuditEvent(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('pilot_audit_log_write')
  try {
    const db = (await import('../../db/connection.js')).default
    await db.query(
      `INSERT INTO novee_os_pilot_audit_log (tenant_id, actor_id, action, entity_type, entity_id, payload, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING`,
      [payload.tenant_id || null, actorId, payload.action, payload.entity_type || null, payload.entity_id || null, JSON.stringify(payload.payload || {}), idempotencyKey]
    )
    return { ok: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listAcceptanceRegistry(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('acceptance_registry')
  try {
    const db = (await import('../../db/connection.js')).default
    const q = tenantId ? 'SELECT * FROM novee_os_pilot_acceptance_registry WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT * FROM novee_os_pilot_acceptance_registry ORDER BY created_at DESC'
    const res = tenantId ? await db.query(q, [tenantId]) : await db.query(q)
    return { ok: true, acceptances: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createAcceptancePreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('acceptance_create')
  try {
    const db = (await import('../../db/connection.js')).default
    const res = await db.query(
      `INSERT INTO novee_os_pilot_acceptance_registry (tenant_id, venue_id, acceptance_type, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id || null, payload.venue_id || null, payload.acceptance_type || 'pilot', payload.notes || null, idempotencyKey]
    )
    return { ok: true, acceptance: res.rows[0] || null, acceptance_approved: false, live_pilot_enabled: false, public_go_live_enabled: false, remote_distribution_enabled: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getPilotReadinessScore() {
  const gates = await listPilotReadinessGates()
  const modules = await listModuleReadiness()
  const gateList = gates.gates || []
  const moduleList = modules.modules || []
  const passedGates = gateList.filter(g => g.gate_status === 'passed').length
  const totalGates = gateList.length || DEFAULT_PILOT_READINESS_GATES.length
  const readyModules = moduleList.filter(m => m.readiness_status === 'ready').length
  const totalModules = moduleList.length || DEFAULT_PILOT_MODULES.length
  return {
    ok: true,
    score: { passedGates, totalGates, readyModules, totalModules, gatePassRate: totalGates ? Math.round(passedGates / totalGates * 100) : 0 },
    pilot_approved: false,
    go_live_approved: false,
    remote_distribution_ready: false,
    safety_status: 'BUILD_ONLY_NO_LIVE_PILOT',
  }
}

export async function getPilotBlockers() {
  const gates = await listPilotReadinessGates()
  const modules = await listModuleReadiness()
  const blockerGates = (gates.gates || []).filter(g => g.blocking && g.gate_status !== 'passed')
  const blockerModules = (modules.modules || []).filter(m => m.blocking_issues > 0)
  return {
    ok: true,
    blockers: [
      ...blockerGates.map(g => ({ type: 'gate', key: g.gate_key, label: g.gate_label, status: g.gate_status })),
      ...blockerModules.map(m => ({ type: 'module', key: m.module_key, label: m.module_label, issues: m.blocking_issues })),
    ],
    pilot_approved: false,
    go_live_approved: false,
  }
}

export async function getSafePilotClaims() {
  return {
    ok: true,
    safeClaims: [
      'Live Pilot Readiness Center is built and visible.',
      'Pilot gate registry is operational.',
      'Module readiness tracking is active.',
      'All pilot approval flags are FALSE — no live pilot approved.',
      'Remote distribution is not enabled.',
      'Public go-live is not enabled.',
      'Phase E.3 Security Activation is required before pilot approval.',
      'Phase E.4 Deployment Activation is required before pilot approval.',
    ],
    unsafe: [
      'Do not claim pilot is approved.',
      'Do not claim go-live is approved.',
      'Do not claim remote distribution is enabled.',
      'Do not claim any module is production-ready unless all gates pass.',
    ],
    safety_status: 'BUILD_ONLY_NO_LIVE_PILOT',
    pilot_approved: false,
    go_live_approved: false,
    remote_distribution_ready: false,
  }
}

export async function getPilotFeatureFlagSnapshot() {
  return {
    ok: true,
    flags: NOVEE_OS_LIVE_PILOT_READINESS_FLAGS,
    pilot_approved: false,
    go_live_approved: false,
    remote_distribution_ready: false,
  }
}

export async function validateLivePilotReadiness() {
  const score = await getPilotReadinessScore()
  const blockers = await getPilotBlockers()
  return {
    ok: true,
    readiness: score.score,
    blockers: blockers.blockers,
    pilot_approved: false,
    go_live_approved: false,
    remote_distribution_ready: false,
    safety_status: 'BUILD_ONLY_NO_LIVE_PILOT',
    message: 'Pilot readiness layer is active. All live approvals require full gate passage through this center.',
  }
}
