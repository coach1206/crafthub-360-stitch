// Phase E.7 — NOVEE OS Onboarding + Training Service
// BUILD ONLY — publication and completion tracking disabled by default

import {
  DEFAULT_ONBOARDING_PROGRAMS, DEFAULT_TRAINING_MANUALS,
  DEFAULT_TRAINING_LESSONS, DEFAULT_CHECKLIST_ITEMS, DEFAULT_ACCEPTANCE_RECORDS,
} from './noveeOSOnboardingTrainingContracts.js'
import FLAGS from '../../config/noveeOSOnboardingTrainingFeatureFlags.js'

const localFallback = (area) => ({ ok: false, localPreview: true, error: 'database_not_configured', area })

async function isDbAvailable() {
  try { const m = await import('../../db/connection.js'); return !!m.default } catch { return false }
}
async function db() { return (await import('../../db/connection.js')).default }

// ── Summary ───────────────────────────────────────────────────────────────────

export async function getOnboardingTrainingSummary() {
  return {
    ok: true,
    summary: {
      onboarding_training_center_exists: true,
      programs_tracked: DEFAULT_ONBOARDING_PROGRAMS.length,
      manuals_tracked: DEFAULT_TRAINING_MANUALS.length,
      lessons_tracked: DEFAULT_TRAINING_LESSONS.length,
      manuals_published: false,
      staff_training_complete: false,
      manager_training_complete: false,
      client_onboarding_complete: false,
      remote_distribution_unlock_enabled: false,
    },
    safety_status: 'BUILD_ONLY_TRAINING_NOT_COMPLETE',
    published: false,
    training_ready: false,
    onboarding_ready: false,
    remote_distribution_ready: false,
  }
}

// ── Programs ──────────────────────────────────────────────────────────────────

export async function listOnboardingPrograms(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, programs: DEFAULT_ONBOARDING_PROGRAMS.map(p => ({ ...p, status: 'draft', published: false })) }
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_onboarding_program_registry WHERE tenant_id=$1 ORDER BY program_type' : 'SELECT * FROM novee_os_onboarding_program_registry ORDER BY program_type'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, programs: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getOnboardingProgram(id) {
  if (!(await isDbAvailable())) return localFallback('program')
  try {
    const res = await (await db()).query('SELECT * FROM novee_os_onboarding_program_registry WHERE id=$1', [id])
    return { ok: true, program: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createOnboardingProgramPreview(payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('program_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_onboarding_program_registry (tenant_id, program_key, program_name, program_type, audience_role, module_scope_json, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [payload.tenant_id || null, payload.program_key, payload.program_name, payload.program_type || 'admin_onboarding', payload.audience_role || 'admin', JSON.stringify(payload.module_scope_json || []), payload.notes || null]
    )
    return { ok: true, program: res.rows[0], published: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateOnboardingProgramStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('program_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_onboarding_program_registry SET status=$1, notes=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [payload.status || 'draft', payload.notes || null, id]
    )
    return { ok: true, program: res.rows[0] || null, published: false }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Manuals ───────────────────────────────────────────────────────────────────

export async function listTrainingManuals(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, manuals: DEFAULT_TRAINING_MANUALS.map(m => ({ ...m, status: 'draft', published: false })) }
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_training_manual_registry WHERE tenant_id=$1 ORDER BY manual_type,manual_title' : 'SELECT * FROM novee_os_training_manual_registry ORDER BY manual_type,manual_title'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, manuals: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getTrainingManual(id) {
  if (!(await isDbAvailable())) return localFallback('manual')
  try {
    const res = await (await db()).query('SELECT * FROM novee_os_training_manual_registry WHERE id=$1', [id])
    return { ok: true, manual: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createTrainingManualPreview(payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('manual_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_training_manual_registry (tenant_id, manual_key, manual_title, manual_type, audience_role, module_key, version_label, content_summary, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [payload.tenant_id || null, payload.manual_key, payload.manual_title, payload.manual_type || 'admin_guide', payload.audience_role || 'admin', payload.module_key || null, payload.version_label || '0.1.0-draft', payload.content_summary || null, payload.notes || null]
    )
    return { ok: true, manual: res.rows[0], published: false }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateTrainingManualStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('manual_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_training_manual_registry SET status=$1, content_summary=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [payload.status || 'draft', payload.content_summary || null, id]
    )
    return { ok: true, manual: res.rows[0] || null, published: false }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export async function listTrainingLessons(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, lessons: DEFAULT_TRAINING_LESSONS.map(l => ({ ...l, status: 'draft' })) }
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_training_lesson_registry WHERE tenant_id=$1 ORDER BY lesson_category,sort_order' : 'SELECT * FROM novee_os_training_lesson_registry ORDER BY lesson_category,sort_order'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, lessons: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getTrainingLesson(id) {
  if (!(await isDbAvailable())) return localFallback('lesson')
  try {
    const res = await (await db()).query('SELECT * FROM novee_os_training_lesson_registry WHERE id=$1', [id])
    return { ok: true, lesson: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createTrainingLessonPreview(payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('lesson_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_training_lesson_registry (tenant_id, lesson_key, lesson_title, lesson_category, audience_role, module_key, estimated_minutes, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [payload.tenant_id || null, payload.lesson_key, payload.lesson_title, payload.lesson_category || 'platform_overview', payload.audience_role || 'admin', payload.module_key || null, payload.estimated_minutes || 15, payload.notes || null]
    )
    return { ok: true, lesson: res.rows[0] }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateTrainingLessonStatusPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('lesson_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_training_lesson_registry SET status=$1, notes=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [payload.status || 'draft', payload.notes || null, id]
    )
    return { ok: true, lesson: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export async function listOnboardingChecklist(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, items: DEFAULT_CHECKLIST_ITEMS.map(c => ({ ...c, status: 'not_started', evidence_present: false })) }
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_onboarding_checklist_registry WHERE tenant_id=$1 ORDER BY checklist_category' : 'SELECT * FROM novee_os_onboarding_checklist_registry ORDER BY checklist_category'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, items: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getOnboardingChecklistItem(id) {
  if (!(await isDbAvailable())) return localFallback('checklist_item')
  try {
    const res = await (await db()).query('SELECT * FROM novee_os_onboarding_checklist_registry WHERE id=$1', [id])
    return { ok: true, item: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateOnboardingChecklistItemPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('checklist_item_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_onboarding_checklist_registry SET status=$1, blocker_reason=$2, evidence_present=$3, updated_at=now() WHERE id=$4 RETURNING *`,
      [payload.status || 'not_started', payload.blocker_reason || null, payload.evidence_present || false, id]
    )
    return { ok: true, item: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Progress ──────────────────────────────────────────────────────────────────

// trainee_reference_only is intentionally excluded from all list/get queries — no PII displayed
export async function listTrainingProgress(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('progress')
  try {
    const d = await db()
    const q = tenantId ? 'SELECT id, tenant_id, trainee_role, progress_status, completion_status, evidence_required, evidence_present, safe_claim, created_at FROM novee_os_training_progress_registry WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT id, tenant_id, trainee_role, progress_status, completion_status, evidence_required, evidence_present, safe_claim, created_at FROM novee_os_training_progress_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, progress: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getTrainingProgress(id) {
  if (!(await isDbAvailable())) return localFallback('progress_item')
  try {
    const res = await (await db()).query('SELECT id, tenant_id, trainee_role, progress_status, completion_status, evidence_required, evidence_present, safe_claim, created_at FROM novee_os_training_progress_registry WHERE id=$1', [id])
    return { ok: true, progress: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateTrainingProgressPreview(id, payload, actorId = 'system') {
  if (!(await isDbAvailable())) return localFallback('progress_update')
  try {
    const res = await (await db()).query(
      `UPDATE novee_os_training_progress_registry SET progress_status=$1, completion_status=$2, evidence_present=$3, updated_at=now() WHERE id=$4 RETURNING id, trainee_role, progress_status, completion_status, evidence_required, evidence_present, safe_claim`,
      [payload.progress_status || 'not_started', payload.completion_status || 'incomplete', payload.evidence_present || false, id]
    )
    return { ok: true, progress: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export async function listTrainingEvidence(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('evidence')
  try {
    const d = await db()
    const q = tenantId ? 'SELECT * FROM novee_os_training_evidence_registry WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT * FROM novee_os_training_evidence_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, evidence: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createTrainingEvidencePreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('evidence_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_training_evidence_registry (tenant_id, evidence_type, evidence_title, source, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.tenant_id || null, payload.evidence_type, payload.evidence_title, payload.source || null, payload.notes || null, idempotencyKey]
    )
    return { ok: true, evidence: res.rows[0] || null, evidence_status: 'pending' }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Acceptance ────────────────────────────────────────────────────────────────

export async function listOnboardingAcceptanceRecords(tenantId = null) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, records: DEFAULT_ACCEPTANCE_RECORDS }
  try {
    const d = await db()
    const q = tenantId ? 'SELECT id, tenant_id, acceptance_type, accepted_by_role, acceptance_status, accepted_at, safe_claim, created_at FROM novee_os_onboarding_acceptance_registry WHERE tenant_id=$1 ORDER BY created_at DESC' : 'SELECT id, tenant_id, acceptance_type, accepted_by_role, acceptance_status, accepted_at, safe_claim, created_at FROM novee_os_onboarding_acceptance_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, records: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createOnboardingAcceptancePreview(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('acceptance_create')
  try {
    const res = await (await db()).query(
      `INSERT INTO novee_os_onboarding_acceptance_registry (tenant_id, acceptance_type, accepted_by_role, notes, idempotency_key)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id, tenant_id, acceptance_type, accepted_by_role, acceptance_status, safe_claim`,
      [payload.tenant_id || null, payload.acceptance_type, payload.accepted_by_role || 'admin', payload.notes || null, idempotencyKey]
    )
    return { ok: true, record: res.rows[0] || null, acceptance_status: 'pending' }
  } catch (e) { return { ok: false, error: e.message } }
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getOnboardingReadinessScore() {
  return {
    ok: true,
    score: { programs: DEFAULT_ONBOARDING_PROGRAMS.length, manuals: DEFAULT_TRAINING_MANUALS.length, lessons: DEFAULT_TRAINING_LESSONS.length, published_manuals: 0, completed_checklist: 0, total_checklist: DEFAULT_CHECKLIST_ITEMS.length },
    training_ready: false,
    onboarding_ready: false,
    remote_distribution_ready: false,
    safety_status: 'BUILD_ONLY_TRAINING_NOT_COMPLETE',
  }
}

export async function getOnboardingBlockers() {
  return {
    ok: true,
    blockers: [
      { type: 'flag', key: 'NOVEE_ONBOARDING_MANUAL_PUBLICATION_ENABLED', label: 'Manual publication flag is FALSE — no manuals published yet' },
      { type: 'flag', key: 'NOVEE_ONBOARDING_STAFF_COMPLETION_ENABLED', label: 'Staff completion flag is FALSE' },
      { type: 'flag', key: 'NOVEE_ONBOARDING_MANAGER_COMPLETION_ENABLED', label: 'Manager completion flag is FALSE' },
      { type: 'flag', key: 'NOVEE_ONBOARDING_CLIENT_COMPLETION_ENABLED', label: 'Client completion flag is FALSE' },
      { type: 'flag', key: 'NOVEE_ONBOARDING_REMOTE_DISTRIBUTION_UNLOCK_ENABLED', label: 'Remote distribution unlock flag is FALSE' },
      { type: 'evidence', key: 'security_review_evidence', label: 'E.3 Security Activation evidence not yet collected' },
      { type: 'evidence', key: 'deployment_gates_evidence', label: 'E.4 Deployment Activation evidence not yet collected' },
      { type: 'evidence', key: 'pilot_readiness_evidence', label: 'E.5 Pilot Readiness evidence not yet collected' },
    ],
    training_ready: false,
    onboarding_ready: false,
  }
}

export async function getRemoteDistributionTrainingGate() {
  return {
    ok: true,
    gate: 'remote_distribution_training',
    required_programs: ['remote_client_onboarding', 'module_activation_onboarding', 'pilot_onboarding'],
    required_manuals: ['remote_distribution_guide', 'tenant_provisioning_guide', 'licensing_guide'],
    required_acknowledgments: ['remote_distribution_acknowledgment', 'safe_claims_acknowledgment'],
    gate_passed: false,
    remote_distribution_ready: false,
  }
}

export async function getSafeOnboardingClaims() {
  return {
    ok: true,
    safeClaims: [
      'Onboarding + Training Center is built and operational.',
      `${DEFAULT_ONBOARDING_PROGRAMS.length} onboarding programs are tracked.`,
      `${DEFAULT_TRAINING_MANUALS.length} training manuals are tracked (not yet published).`,
      `${DEFAULT_TRAINING_LESSONS.length} training lessons are tracked.`,
      'Training progress and evidence can be tracked without exposing personal data.',
      'Onboarding acceptance records can be created and tracked.',
      'Remote distribution remains blocked until training/onboarding readiness passes.',
      'No manuals are published yet — content requires full review before publication.',
    ],
    unsafeClaims: [
      'Do not claim manuals are fully published.',
      'Do not claim staff training is complete.',
      'Do not claim manager training is complete.',
      'Do not claim client onboarding is complete.',
      'Do not claim guest training is complete.',
      'Do not claim remote distribution is unlocked.',
      'Do not claim SmokeCraft venue training is complete.',
      'Do not claim POS360 staff training is complete.',
      'Do not claim E.A.T. manager training is complete.',
    ],
    safety_status: 'BUILD_ONLY_TRAINING_NOT_COMPLETE',
    published: false,
    training_ready: false,
    onboarding_ready: false,
  }
}

export async function writeOnboardingAuditEvent(payload, actorId = 'system', idempotencyKey = null) {
  if (!(await isDbAvailable())) return localFallback('audit_write')
  try {
    await (await db()).query(
      `INSERT INTO novee_os_onboarding_audit_log (tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, metadata_json, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (idempotency_key) DO NOTHING`,
      [payload.tenant_id || null, actorId, payload.actor_role || null, payload.event_type, payload.event_category || 'general', payload.severity || 'info', payload.summary, JSON.stringify(payload.metadata_json || {}), idempotencyKey]
    )
    return { ok: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getOnboardingAuditLog(tenantId = null) {
  if (!(await isDbAvailable())) return localFallback('audit_log')
  try {
    const d = await db()
    const q = tenantId ? 'SELECT id, tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_onboarding_audit_log WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100' : 'SELECT id, tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_onboarding_audit_log ORDER BY created_at DESC LIMIT 100'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, logs: res.rows }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getOnboardingFeatureFlagSnapshot() {
  return { ok: true, flags: FLAGS, published: false, training_ready: false }
}

export async function validateOnboardingTrainingReadiness() {
  const blockers = await getOnboardingBlockers()
  return {
    ok: true,
    blockers: blockers.blockers,
    published: false,
    training_ready: false,
    onboarding_ready: false,
    remote_distribution_ready: false,
    safety_status: 'BUILD_ONLY_TRAINING_NOT_COMPLETE',
    message: 'Onboarding + Training Center is active. Training completion and manual publication require flag enablement and evidence.',
  }
}
