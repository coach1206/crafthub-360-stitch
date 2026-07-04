/**
 * POS360 Offline Mode, Sync Engine & Conflict Handling (Phase B.6)
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { SYNC_EVENTS, HIGH_RISK_ACTIONS, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './pos360SyncEventContracts.js'

// ── Audit helper ──────────────────────────────────────────────────────────────
async function syncAudit(venueId, tenantId, action, entityType, entityId, actor, batchId, actionId, prev, next, extra = {}) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_sync_audit
      (tenant_id, venue_id, location_id, device_id, staff_user_id, sync_batch_id, sync_action_id,
       entity_type, entity_id, action, actor_id, actor_role, previous_value, new_value,
       contains_secrets, exposes_private_data, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,FALSE,FALSE,$15)`,
    [tenantId, venueId, extra.locationId ?? null, extra.deviceId ?? null,
     actor?.actorId ?? null, batchId ?? null, actionId ?? null,
     entityType, entityId ?? null, action,
     actor?.actorId ?? null, actor?.actorRole ?? null,
     prev ? JSON.stringify(prev) : null, next ? JSON.stringify(next) : null,
     extra.metadata ? JSON.stringify(extra.metadata) : null]
  )
}

function isHighRisk(actionType = '') {
  return HIGH_RISK_ACTIONS.some(h => actionType.toLowerCase().includes(h))
}

// ── Offline queue (sync actions) ──────────────────────────────────────────────
export async function queueOfflineAction(venueId, tenantId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return {
      ok: true, localPreview: true,
      action: { id: 'preview-action', idempotencyKey: body.idempotencyKey, status: 'queued' },
    }
  }
  // Idempotency check
  const dup = await query(
    `SELECT id, sync_status FROM pos360_sync_actions WHERE idempotency_key=$1 AND venue_id=$2`,
    [body.idempotencyKey, venueId]
  )
  if (dup.rows.length) {
    await syncAudit(venueId, tenantId, SYNC_EVENTS.ACTION_DUPLICATE_BLOCKED, 'sync_action', dup.rows[0].id, actor, null, null, null, { idempotencyKey: body.idempotencyKey }, { deviceId: body.deviceId })
    return { ok: false, duplicate: true, existingId: dup.rows[0].id, message: 'Duplicate action blocked.' }
  }

  const highRisk = isHighRisk(body.actionType ?? '')
  const { rows } = await query(
    `INSERT INTO pos360_sync_actions
      (tenant_id, venue_id, location_id, device_id, staff_user_id, sync_batch_id,
       idempotency_key, action_hash, action_type, entity_type, entity_id,
       order_id, table_id, action_payload, priority, sync_status,
       is_high_risk, requires_manager_review, device_created_at, clock_drift_ms,
       created_by, contains_secrets, exposes_private_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'queued',$16,$17,$18,$19,$20,FALSE,FALSE)
     RETURNING *`,
    [tenantId, venueId, body.locationId ?? null, body.deviceId ?? null, actor.actorId ?? null,
     body.syncBatchId ?? null, body.idempotencyKey, body.actionHash ?? body.idempotencyKey,
     body.actionType, body.entityType, body.entityId ?? null,
     body.orderId ?? null, body.tableId ?? null,
     JSON.stringify(body.actionPayload ?? {}),
     body.priority ?? 'order', highRisk, highRisk || body.requiresManagerReview === true,
     body.deviceCreatedAt ?? new Date().toISOString(),
     body.clockDriftMs ?? null, actor.actorId ?? null]
  )
  const act = rows[0]
  await syncAudit(venueId, tenantId, SYNC_EVENTS.ACTION_QUEUED, 'sync_action', act.id, actor, act.sync_batch_id, act.id, null, act, { deviceId: body.deviceId })
  return { ok: true, action: act }
}

export async function listOfflineActions(venueId, filters = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, actions: [], message: 'No offline actions are queued for this device.' }
  }
  const conditions = ['venue_id=$1', 'is_active=TRUE']
  const params = [venueId]
  let p = 2
  if (filters.deviceId)   { conditions.push(`device_id=$${p++}`);   params.push(filters.deviceId) }
  if (filters.syncStatus) { conditions.push(`sync_status=$${p++}`); params.push(filters.syncStatus) }
  if (filters.priority)   { conditions.push(`priority=$${p++}`);    params.push(filters.priority) }
  const { rows } = await query(
    `SELECT * FROM pos360_sync_actions WHERE ${conditions.join(' AND ')}
     ORDER BY CASE priority
       WHEN 'emergency' THEN 1 WHEN 'payment' THEN 2 WHEN 'order' THEN 3
       WHEN 'production' THEN 4 WHEN 'table' THEN 5 WHEN 'guest' THEN 6
       WHEN 'loyalty' THEN 7 WHEN 'audit' THEN 8 ELSE 9 END, created_at ASC
     LIMIT 200`,
    params
  )
  return { ok: true, actions: rows }
}

export async function getOfflineAction(actionId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query('SELECT * FROM pos360_sync_actions WHERE id=$1', [actionId])
  return rows.length ? { ok: true, action: rows[0] } : { ok: false, error: 'action_not_found' }
}

export async function cancelOfflineAction(actionId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query(
    `UPDATE pos360_sync_actions SET sync_status='canceled', updated_at=NOW(), updated_by=$2
     WHERE id=$1 AND sync_status IN ('queued','failed') RETURNING *`,
    [actionId, actor.actorId ?? null]
  )
  return rows.length ? { ok: true, action: rows[0] } : { ok: false, error: 'action_not_found_or_not_cancelable' }
}

export async function markActionFailed(actionId, reason = null, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query(
    `UPDATE pos360_sync_actions
     SET sync_status='failed', failure_reason=$2, failed_at=NOW(),
         replay_attempt_count=replay_attempt_count+1, updated_at=NOW(), updated_by=$3
     WHERE id=$1 RETURNING *`,
    [actionId, reason, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'action_not_found' }
  const a = rows[0]
  // Move to dead letter if max retries exceeded
  if (a.replay_attempt_count >= a.max_replay_attempts) {
    return moveToDeadLetter(actionId, 'max_retries_exceeded', actor)
  }
  return { ok: true, action: a }
}

export async function moveToDeadLetter(actionId, reason = null, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const src = await query('SELECT * FROM pos360_sync_actions WHERE id=$1', [actionId])
  if (!src.rows.length) return { ok: false, error: 'action_not_found' }
  const a = src.rows[0]
  await query(
    `INSERT INTO pos360_sync_dead_letters
      (tenant_id, venue_id, location_id, device_id, staff_user_id, sync_action_id, sync_batch_id,
       idempotency_key, action_type, entity_type, entity_id, action_payload, failure_reason,
       replay_attempt_count, contains_secrets, exposes_private_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,FALSE,FALSE)`,
    [a.tenant_id, a.venue_id, a.location_id, a.device_id, a.staff_user_id,
     a.id, a.sync_batch_id, a.idempotency_key, a.action_type, a.entity_type, a.entity_id,
     a.action_payload, reason ?? a.failure_reason, a.replay_attempt_count]
  )
  await query(
    `UPDATE pos360_sync_actions SET sync_status='dead_lettered', dead_lettered_at=NOW(), updated_at=NOW()
     WHERE id=$1`,
    [actionId]
  )
  await syncAudit(a.venue_id, a.tenant_id, SYNC_EVENTS.ACTION_DEAD_LETTERED, 'sync_action', actionId, actor, a.sync_batch_id, actionId, null, { reason })
  return { ok: true }
}

export async function getQueueSummary(venueId, deviceId = null) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, summary: {}, message: 'No offline actions are queued for this device.' }
  }
  const cond = deviceId ? 'venue_id=$1 AND device_id=$2' : 'venue_id=$1'
  const params = deviceId ? [venueId, deviceId] : [venueId]
  const { rows } = await query(
    `SELECT sync_status, priority, COUNT(*) as count
     FROM pos360_sync_actions WHERE ${cond} AND is_active=TRUE
     GROUP BY sync_status, priority ORDER BY sync_status, priority`,
    params
  )
  return { ok: true, summary: rows }
}

// ── Sync batches ──────────────────────────────────────────────────────────────
export async function createSyncBatch(venueId, tenantId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, batch: { id: 'preview-batch', status: 'pending' } }
  }
  const { rows } = await query(
    `INSERT INTO pos360_sync_batches
      (tenant_id, venue_id, location_id, device_id, staff_user_id, status, priority,
       action_count, max_retries, created_by)
     VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,$9) RETURNING *`,
    [tenantId, venueId, body.locationId ?? null, body.deviceId ?? null, actor.actorId ?? null,
     body.priority ?? 'order', body.actionCount ?? 0, body.maxRetries ?? 5, actor.actorId ?? null]
  )
  const batch = rows[0]
  await syncAudit(venueId, tenantId, SYNC_EVENTS.BATCH_CREATED, 'sync_batch', batch.id, actor, batch.id, null, null, batch, { deviceId: body.deviceId })
  return { ok: true, batch }
}

export async function getSyncBatch(batchId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query('SELECT * FROM pos360_sync_batches WHERE id=$1', [batchId])
  if (!rows.length) return { ok: false, error: 'batch_not_found' }
  const actions = await query('SELECT * FROM pos360_sync_actions WHERE sync_batch_id=$1 ORDER BY created_at', [batchId])
  return { ok: true, batch: rows[0], actions: actions.rows }
}

export async function listSyncBatches(venueId, filters = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, batches: [] }
  }
  const cond = filters.deviceId
    ? 'venue_id=$1 AND device_id=$2 AND is_active=TRUE'
    : 'venue_id=$1 AND is_active=TRUE'
  const params = filters.deviceId ? [venueId, filters.deviceId] : [venueId]
  const { rows } = await query(
    `SELECT * FROM pos360_sync_batches WHERE ${cond} ORDER BY created_at DESC LIMIT 50`,
    params
  )
  return { ok: true, batches: rows }
}

async function setBatchStatus(batchId, status, extra = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const timeCol = { started: 'started_at', completed: 'completed_at', failed: 'failed_at', paused: 'paused_at' }[status] ?? null
  const setCols = timeCol ? `status=$2, ${timeCol}=NOW(), updated_at=NOW(), updated_by=$3` : `status=$2, updated_at=NOW(), updated_by=$3`
  const { rows } = await query(
    `UPDATE pos360_sync_batches SET ${setCols} WHERE id=$1 RETURNING *`,
    [batchId, status, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'batch_not_found' }
  const b = rows[0]
  const evt = { started: SYNC_EVENTS.BATCH_STARTED, completed: SYNC_EVENTS.BATCH_COMPLETED, failed: SYNC_EVENTS.BATCH_FAILED, paused: SYNC_EVENTS.BATCH_PAUSED }[status]
  if (evt) await syncAudit(b.venue_id, b.tenant_id, evt, 'sync_batch', batchId, actor, batchId, null, null, { status }, { deviceId: b.device_id })
  return { ok: true, batch: b }
}

export async function startSyncBatch(batchId, actor = {})    { return setBatchStatus(batchId, 'started',   {}, actor) }
export async function completeSyncBatch(batchId, actor = {}) { return setBatchStatus(batchId, 'completed', {}, actor) }
export async function failSyncBatch(batchId, actor = {})     { return setBatchStatus(batchId, 'failed',    {}, actor) }
export async function pauseSyncBatch(batchId, actor = {})    { return setBatchStatus(batchId, 'paused',    {}, actor) }

export async function retrySyncBatch(batchId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query(
    `UPDATE pos360_sync_batches SET status='pending', retry_count=retry_count+1, failed_at=NULL, updated_at=NOW()
     WHERE id=$1 AND status IN ('failed','paused') RETURNING *`,
    [batchId]
  )
  return rows.length ? { ok: true, batch: rows[0] } : { ok: false, error: 'batch_not_found_or_not_retryable' }
}

// ── Replay ────────────────────────────────────────────────────────────────────
export async function checkIdempotencyKey(idempotencyKey, venueId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, exists: false }
  }
  const { rows } = await query(
    `SELECT id, sync_status FROM pos360_sync_actions WHERE idempotency_key=$1 AND venue_id=$2`,
    [idempotencyKey, venueId]
  )
  return { ok: true, exists: rows.length > 0, action: rows[0] ?? null }
}

export async function validateReplayAction(actionId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query('SELECT * FROM pos360_sync_actions WHERE id=$1', [actionId])
  if (!rows.length) return { ok: false, error: 'action_not_found' }
  const a = rows[0]
  const valid = ['queued','failed'].includes(a.sync_status) && a.replay_attempt_count < a.max_replay_attempts
  return { ok: true, valid, action: a, reason: valid ? null : 'Action not in replayable state or max retries exceeded.' }
}

export async function recordReplayLog(actionId, batchId, attempt, status, extra = {}, actor = {}) {
  if (!isDbAvailable()) return { ok: true, localPreview: true }
  const src = await query('SELECT tenant_id, venue_id, device_id FROM pos360_sync_actions WHERE id=$1', [actionId])
  if (!src.rows.length) return { ok: false, error: 'action_not_found' }
  const { tenant_id, venue_id, device_id } = src.rows[0]
  const { rows } = await query(
    `INSERT INTO pos360_sync_replay_logs
      (tenant_id, venue_id, device_id, sync_action_id, sync_batch_id, attempt_number,
       status, response_code, response_body, failure_reason, replay_duration_ms, actor_id, actor_role)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [tenant_id, venue_id, device_id, actionId, batchId ?? null, attempt, status,
     extra.responseCode ?? null, extra.responseBody ? JSON.stringify(extra.responseBody) : null,
     extra.failureReason ?? null, extra.durationMs ?? null,
     actor.actorId ?? null, actor.actorRole ?? null]
  )
  return { ok: true, log: rows[0] }
}

export async function replayAction(actionId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Replay failed. This action requires review.' }
  }
  const validation = await validateReplayAction(actionId)
  if (!validation.valid) return { ok: false, error: validation.reason ?? 'Replay failed. This action requires review.' }
  const a = validation.action
  const start = Date.now()
  // Mark replaying
  await query(
    `UPDATE pos360_sync_actions SET sync_status='replaying', server_received_at=COALESCE(server_received_at,NOW()),
     replay_attempt_count=replay_attempt_count+1, updated_at=NOW() WHERE id=$1`,
    [actionId]
  )
  await syncAudit(a.venue_id, a.tenant_id, SYNC_EVENTS.ACTION_VALIDATED, 'sync_action', actionId, actor, a.sync_batch_id, actionId, null, { status: 'replaying' })

  // Detect clock drift
  if (a.device_created_at) {
    const driftMs = Math.abs(new Date().getTime() - new Date(a.device_created_at).getTime())
    const DRIFT_THRESHOLD_MS = 300000 // 5 minutes
    if (driftMs > DRIFT_THRESHOLD_MS) {
      await query(`UPDATE pos360_sync_actions SET clock_drift_ms=$2 WHERE id=$1`, [actionId, driftMs])
      await createEATAlert(a.venue_id, a.tenant_id, {
        alertType: 'device_health', alertLevel: 'warning',
        title: 'Clock drift detected', body: `Device clock is ~${Math.round(driftMs/1000)}s off server time.`,
        deviceId: a.device_id, syncActionId: actionId,
      })
    }
  }

  // Mark replayed
  await query(
    `UPDATE pos360_sync_actions SET sync_status='replayed', replayed_at=NOW(), updated_at=NOW() WHERE id=$1`,
    [actionId]
  )
  await recordReplayLog(actionId, a.sync_batch_id, a.replay_attempt_count, 'success',
    { durationMs: Date.now() - start }, actor)
  await syncAudit(a.venue_id, a.tenant_id, SYNC_EVENTS.ACTION_REPLAYED, 'sync_action', actionId, actor, a.sync_batch_id, actionId, null, { status: 'replayed' })
  return { ok: true, actionId }
}

export async function replayBatch(batchId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Replay failed. This action requires review.' }
  }
  await startSyncBatch(batchId, actor)
  const { rows: actions } = await query(
    `SELECT id FROM pos360_sync_actions WHERE sync_batch_id=$1 AND sync_status IN ('queued','failed')
     ORDER BY CASE priority WHEN 'emergency' THEN 1 WHEN 'payment' THEN 2 WHEN 'order' THEN 3 ELSE 4 END, created_at`,
    [batchId]
  )
  const results = []
  let anyFailed = false
  for (const { id } of actions) {
    const r = await replayAction(id, actor)
    results.push({ actionId: id, ok: r.ok })
    if (!r.ok) anyFailed = true
  }
  if (anyFailed) {
    await failSyncBatch(batchId, actor)
  } else {
    await completeSyncBatch(batchId, actor)
  }
  return { ok: !anyFailed, results }
}

export async function getReplayLogs(actionId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, logs: [] }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_sync_replay_logs WHERE sync_action_id=$1 ORDER BY created_at DESC`,
    [actionId]
  )
  return { ok: true, logs: rows }
}

export async function rollbackReplayHook(batchId, reason = null, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Replay failed. This action requires review.' }
  }
  const { rows } = await query(
    `UPDATE pos360_sync_batches SET rollback_triggered=TRUE, rollback_at=NOW(), updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [batchId]
  )
  if (!rows.length) return { ok: false, error: 'batch_not_found' }
  const b = rows[0]
  // Reset replaying actions back to queued
  await query(
    `UPDATE pos360_sync_actions SET sync_status='queued', updated_at=NOW()
     WHERE sync_batch_id=$1 AND sync_status='replaying'`,
    [batchId]
  )
  await syncAudit(b.venue_id, b.tenant_id, SYNC_EVENTS.ROLLBACK_REQUESTED, 'sync_batch', batchId, actor, batchId, null, null, { reason }, { deviceId: b.device_id })
  return { ok: true, batch: b }
}

// ── Conflicts ─────────────────────────────────────────────────────────────────
export async function detectConflict(venueId, tenantId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, conflict: null }
  }
  const highRisk = body.isHighRisk ?? isHighRisk(body.conflictType ?? '')
  const { rows } = await query(
    `INSERT INTO pos360_sync_conflicts
      (tenant_id, venue_id, location_id, device_id, staff_user_id, sync_action_id, sync_batch_id,
       order_id, table_id, entity_type, entity_id, conflict_type, conflict_status,
       resolution_policy, server_value, device_value, is_high_risk, requires_manager_review, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'detected',$13,$14,$15,$16,$17,$18) RETURNING *`,
    [tenantId, venueId, body.locationId ?? null, body.deviceId ?? null, actor.actorId ?? null,
     body.syncActionId ?? null, body.syncBatchId ?? null,
     body.orderId ?? null, body.tableId ?? null,
     body.entityType, body.entityId ?? null, body.conflictType,
     body.resolutionPolicy ?? (highRisk ? 'manager_review_required' : 'server_wins'),
     body.serverValue ? JSON.stringify(body.serverValue) : null,
     body.deviceValue ? JSON.stringify(body.deviceValue) : null,
     highRisk, highRisk || body.requiresManagerReview === true, actor.actorId ?? null]
  )
  const conflict = rows[0]
  await syncAudit(venueId, tenantId, SYNC_EVENTS.CONFLICT_DETECTED, 'sync_conflict', conflict.id, actor, body.syncBatchId, body.syncActionId, body.serverValue, body.deviceValue)

  if (conflict.requires_manager_review) {
    await assignConflictToManagerReview(conflict.id, actor)
  }
  return { ok: true, conflict }
}

export async function listConflicts(venueId, filters = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, conflicts: [], message: 'No sync conflicts require review.' }
  }
  const conditions = ['venue_id=$1', 'is_active=TRUE']
  const params = [venueId]
  let p = 2
  if (filters.status) { conditions.push(`conflict_status=$${p++}`); params.push(filters.status) }
  const { rows } = await query(
    `SELECT * FROM pos360_sync_conflicts WHERE ${conditions.join(' AND ')} ORDER BY is_high_risk DESC, created_at DESC LIMIT 100`,
    params
  )
  return { ok: true, conflicts: rows }
}

export async function getConflict(conflictId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query('SELECT * FROM pos360_sync_conflicts WHERE id=$1', [conflictId])
  return rows.length ? { ok: true, conflict: rows[0] } : { ok: false, error: 'conflict_not_found' }
}

export async function resolveConflict(conflictId, policy, resolvedValue, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query(
    `UPDATE pos360_sync_conflicts
     SET conflict_status='resolved', resolution_policy=$2,
         resolved_value=$3, resolved_by=$4, resolved_at=NOW(), updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [conflictId, policy, resolvedValue ? JSON.stringify(resolvedValue) : null, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'conflict_not_found' }
  const c = rows[0]
  await query(
    `INSERT INTO pos360_sync_conflict_resolutions
      (tenant_id, venue_id, conflict_id, resolution_policy, resolved_by)
     VALUES ($1,$2,$3,$4,$5)`,
    [c.tenant_id, c.venue_id, conflictId, policy, actor.actorId ?? null]
  )
  await syncAudit(c.venue_id, c.tenant_id, SYNC_EVENTS.CONFLICT_RESOLVED, 'sync_conflict', conflictId, actor, c.sync_batch_id, c.sync_action_id, { status: 'detected' }, { status: 'resolved', policy })
  return { ok: true, conflict: c }
}

export async function assignConflictToManagerReview(conflictId, actor = {}) {
  if (!isDbAvailable()) return { ok: true, localPreview: true }
  const c = await getConflict(conflictId)
  if (!c.ok) return c
  const { rows } = await query(
    `INSERT INTO pos360_sync_manager_review_queue
      (tenant_id, venue_id, sync_action_id, sync_batch_id, conflict_id,
       review_type, status, priority, reason, device_id, staff_user_id, entity_type, entity_id)
     VALUES ($1,$2,$3,$4,$5,'conflict','pending',$6,$7,$8,$9,$10,$11) RETURNING id`,
    [c.conflict.tenant_id, c.conflict.venue_id, c.conflict.sync_action_id, c.conflict.sync_batch_id, conflictId,
     c.conflict.is_high_risk ? 'emergency' : 'order',
     'High-risk conflict requires manager review.',
     c.conflict.device_id, c.conflict.staff_user_id, c.conflict.entity_type, c.conflict.entity_id]
  )
  await query(`UPDATE pos360_sync_conflicts SET conflict_status='manager_review', manager_review_id=$2 WHERE id=$1`, [conflictId, rows[0].id])
  await syncAudit(c.conflict.venue_id, c.conflict.tenant_id, SYNC_EVENTS.CONFLICT_MANAGER_REVIEW_REQUIRED, 'sync_conflict', conflictId, actor, null, null, null, { reviewId: rows[0].id })
  return { ok: true, reviewId: rows[0].id }
}

export async function applyConflictResolutionPolicy(conflictId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const c = await getConflict(conflictId)
  if (!c.ok) return c
  const policy = c.conflict.resolution_policy ?? 'server_wins'
  const resolved = policy === 'device_wins' ? c.conflict.device_value : c.conflict.server_value
  await syncAudit(c.conflict.venue_id, c.conflict.tenant_id, SYNC_EVENTS.POLICY_APPLIED, 'sync_conflict', conflictId, actor, null, null, null, { policy })
  return resolveConflict(conflictId, policy, resolved, actor)
}

export async function getConflictSummary(venueId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, summary: [] }
  }
  const { rows } = await query(
    `SELECT conflict_status, conflict_type, COUNT(*) as count
     FROM pos360_sync_conflicts WHERE venue_id=$1 AND is_active=TRUE
     GROUP BY conflict_status, conflict_type ORDER BY count DESC`,
    [venueId]
  )
  return { ok: true, summary: rows }
}

// ── Dead-letter ───────────────────────────────────────────────────────────────
export async function listDeadLetters(venueId, filters = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, deadLetters: [], message: 'No actions in the dead-letter queue.' }
  }
  const cond = filters.deviceId ? 'venue_id=$1 AND device_id=$2 AND archived=FALSE' : 'venue_id=$1 AND archived=FALSE'
  const params = filters.deviceId ? [venueId, filters.deviceId] : [venueId]
  const { rows } = await query(`SELECT * FROM pos360_sync_dead_letters WHERE ${cond} ORDER BY created_at DESC LIMIT 100`, params)
  return { ok: true, deadLetters: rows }
}

export async function getDeadLetter(dlId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query('SELECT * FROM pos360_sync_dead_letters WHERE id=$1', [dlId])
  return rows.length ? { ok: true, deadLetter: rows[0] } : { ok: false, error: 'dead_letter_not_found' }
}

export async function retryDeadLetter(dlId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Replay failed. This action requires review.' }
  }
  const dl = await getDeadLetter(dlId)
  if (!dl.ok) return dl
  const d = dl.deadLetter
  if (!d.sync_action_id) return { ok: false, error: 'no_source_action' }
  await query(`UPDATE pos360_sync_dead_letters SET replay_attempt_count=replay_attempt_count+1, updated_at=NOW() WHERE id=$1`, [dlId])
  return replayAction(d.sync_action_id, actor)
}

export async function archiveDeadLetter(dlId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  await query(`UPDATE pos360_sync_dead_letters SET archived=TRUE, archived_at=NOW() WHERE id=$1`, [dlId])
  return { ok: true }
}

export async function escalateDeadLetter(dlId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query(
    `UPDATE pos360_sync_dead_letters SET escalated=TRUE, escalated_at=NOW() WHERE id=$1 RETURNING *`,
    [dlId]
  )
  if (!rows.length) return { ok: false, error: 'dead_letter_not_found' }
  const d = rows[0]
  await query(
    `INSERT INTO pos360_sync_manager_review_queue
      (tenant_id, venue_id, dead_letter_id, review_type, status, priority, reason, device_id)
     VALUES ($1,$2,$3,'dead_letter','pending','order','Escalated dead-letter action.',$4)`,
    [d.tenant_id, d.venue_id, dlId, d.device_id]
  )
  return { ok: true, deadLetter: d }
}

// ── Device health ─────────────────────────────────────────────────────────────
export async function saveDeviceSyncHealth(venueId, tenantId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, health: { ...body, localPreview: true } }
  }
  const { rows } = await query(
    `INSERT INTO pos360_sync_device_health
      (tenant_id, venue_id, location_id, device_id, device_type, device_name, app_version,
       network_status, connection_type, battery_level, is_charging,
       last_online_at, last_offline_at, last_sync_at,
       pending_queue_count, failed_queue_count, dead_letter_count, conflict_count,
       sync_health_score, clock_drift_ms, clock_drift_detected, error_state, is_local_fallback)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
     RETURNING *`,
    [tenantId, venueId, body.locationId ?? null, body.deviceId ?? null,
     body.deviceType ?? null, body.deviceName ?? null, body.appVersion ?? null,
     body.networkStatus ?? 'unknown', body.connectionType ?? null,
     body.batteryLevel ?? null, body.isCharging ?? null,
     body.lastOnlineAt ?? null, body.lastOfflineAt ?? null, body.lastSyncAt ?? null,
     body.pendingQueueCount ?? 0, body.failedQueueCount ?? 0,
     body.deadLetterCount ?? 0, body.conflictCount ?? 0,
     body.syncHealthScore ?? null, body.clockDriftMs ?? null,
     body.clockDriftDetected ?? false, body.errorState ?? null,
     body.isLocalFallback ?? false]
  )
  await syncAudit(venueId, tenantId, SYNC_EVENTS.DEVICE_HEALTH_RECORDED, 'device', body.deviceId ?? 'unknown', actor, null, null, null, rows[0])
  if (body.clockDriftDetected) {
    await syncAudit(venueId, tenantId, SYNC_EVENTS.CLOCK_DRIFT_DETECTED, 'device', body.deviceId ?? 'unknown', actor, null, null, null, { clockDriftMs: body.clockDriftMs })
  }
  return { ok: true, health: rows[0] }
}

export async function getDeviceSyncHealth(venueId, deviceId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, health: null, message: 'Device health unavailable — database not configured.' }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_sync_device_health WHERE venue_id=$1 AND device_id=$2 ORDER BY recorded_at DESC LIMIT 1`,
    [venueId, deviceId]
  )
  return { ok: true, health: rows[0] ?? null }
}

export async function getVenueSyncHealth(venueId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, devices: [], summary: {} }
  }
  const { rows } = await query(
    `SELECT DISTINCT ON (device_id) * FROM pos360_sync_device_health
     WHERE venue_id=$1 ORDER BY device_id, recorded_at DESC`,
    [venueId]
  )
  const summary = {
    deviceCount:        rows.length,
    onlineCount:        rows.filter(r => r.network_status === 'online').length,
    offlineCount:       rows.filter(r => r.network_status === 'offline').length,
    totalPendingActions:rows.reduce((s, r) => s + (r.pending_queue_count ?? 0), 0),
    totalDeadLetters:   rows.reduce((s, r) => s + (r.dead_letter_count ?? 0), 0),
    avgHealthScore:     rows.length ? (rows.reduce((s, r) => s + parseFloat(r.sync_health_score ?? 100), 0) / rows.length).toFixed(1) : null,
  }
  return { ok: true, devices: rows, summary }
}

export async function getMultiLocationSyncHealthHook(tenantId) {
  return { ok: true, localPreview: true, message: 'Multi-location sync health not yet connected.', tenantId }
}

export async function recordOfflineDetected(venueId, tenantId, body = {}, actor = {}) {
  await syncAudit(venueId, tenantId, SYNC_EVENTS.OFFLINE_DETECTED, 'device', body.deviceId ?? 'unknown', actor, null, null, null, body)
  await createEATAlert(venueId, tenantId, { alertType: 'offline_device', alertLevel: 'warning', title: 'Device went offline', body: `Device ${body.deviceId ?? 'unknown'} lost connection.`, deviceId: body.deviceId })
  return { ok: true }
}

export async function recordOnlineRestored(venueId, tenantId, body = {}, actor = {}) {
  await syncAudit(venueId, tenantId, SYNC_EVENTS.ONLINE_RESTORED, 'device', body.deviceId ?? 'unknown', actor, null, null, null, body)
  return { ok: true }
}

export async function recordClockDrift(venueId, tenantId, body = {}, actor = {}) {
  await syncAudit(venueId, tenantId, SYNC_EVENTS.CLOCK_DRIFT_DETECTED, 'device', body.deviceId ?? 'unknown', actor, null, null, null, body)
  await createEATAlert(venueId, tenantId, { alertType: 'device_health', alertLevel: 'warning', title: 'Clock drift detected', body: `Device ${body.deviceId ?? 'unknown'} clock drift: ${body.driftMs ?? '?'}ms`, deviceId: body.deviceId })
  return { ok: true }
}

// ── E.A.T. alerts ─────────────────────────────────────────────────────────────
export async function createEATAlert(venueId, tenantId, body = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, alert: null }
  }
  const { rows } = await query(
    `INSERT INTO pos360_sync_eat_alerts
      (tenant_id, venue_id, location_id, device_id, alert_type, alert_level, title, body,
       entity_type, entity_id, sync_action_id, sync_batch_id, conflict_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [tenantId, venueId, body.locationId ?? null, body.deviceId ?? null,
     body.alertType, body.alertLevel ?? 'warning', body.title, body.body ?? null,
     body.entityType ?? null, body.entityId ?? null,
     body.syncActionId ?? null, body.syncBatchId ?? null, body.conflictId ?? null]
  )
  return { ok: true, alert: rows[0] }
}

export async function listEATAlerts(venueId, filters = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, alerts: [], message: 'E.A.T. sync alerts are not connected yet.' }
  }
  const conditions = ['venue_id=$1']
  const params = [venueId]
  let p = 2
  if (filters.acknowledged !== undefined) { conditions.push(`acknowledged=$${p++}`); params.push(filters.acknowledged) }
  if (filters.alertType) { conditions.push(`alert_type=$${p++}`); params.push(filters.alertType) }
  const { rows } = await query(
    `SELECT * FROM pos360_sync_eat_alerts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 100`,
    params
  )
  return { ok: true, alerts: rows }
}

export async function acknowledgeEATAlert(alertId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query(
    `UPDATE pos360_sync_eat_alerts SET acknowledged=TRUE, acknowledged_by=$2, acknowledged_at=NOW()
     WHERE id=$1 RETURNING *`,
    [alertId, actor.actorId ?? null]
  )
  return rows.length ? { ok: true, alert: rows[0] } : { ok: false, error: 'alert_not_found' }
}

export async function getEATSyncRiskSummary(venueId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, message: 'E.A.T. sync alerts are not connected yet.', summary: {} }
  }
  const { rows } = await query(
    `SELECT alert_type, alert_level, COUNT(*) as count
     FROM pos360_sync_eat_alerts WHERE venue_id=$1 AND acknowledged=FALSE
     GROUP BY alert_type, alert_level ORDER BY count DESC`,
    [venueId]
  )
  return { ok: true, summary: rows }
}

// ── Manager review queue ──────────────────────────────────────────────────────
export async function listManagerReviewItems(venueId, filters = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, items: [] }
  }
  const conditions = ['venue_id=$1']
  const params = [venueId]
  if (filters.status) { conditions.push(`status=$${params.length+1}`); params.push(filters.status) }
  const { rows } = await query(
    `SELECT * FROM pos360_sync_manager_review_queue WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 100`,
    params
  )
  return { ok: true, items: rows }
}

export async function approveReplay(reviewId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query(
    `UPDATE pos360_sync_manager_review_queue SET status='approved', reviewed_by=$2, reviewed_at=NOW(), decision='approve'
     WHERE id=$1 RETURNING *`,
    [reviewId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'review_not_found' }
  const r = rows[0]
  await syncAudit(r.venue_id, r.tenant_id, SYNC_EVENTS.MANAGER_REVIEW_APPROVED, 'manager_review', reviewId, actor, r.sync_batch_id, r.sync_action_id, null, { reviewId })
  if (r.sync_action_id) return replayAction(r.sync_action_id, actor)
  return { ok: true }
}

export async function denyReplay(reviewId, reason = null, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const { rows } = await query(
    `UPDATE pos360_sync_manager_review_queue SET status='denied', reviewed_by=$2, reviewed_at=NOW(), decision='deny', decision_notes=$3
     WHERE id=$1 RETURNING *`,
    [reviewId, actor.actorId ?? null, reason]
  )
  if (!rows.length) return { ok: false, error: 'review_not_found' }
  const r = rows[0]
  if (r.sync_action_id) {
    await query(`UPDATE pos360_sync_actions SET sync_status='failed', failure_reason='denied_by_manager', updated_at=NOW() WHERE id=$1`, [r.sync_action_id])
  }
  await syncAudit(r.venue_id, r.tenant_id, SYNC_EVENTS.MANAGER_REVIEW_DENIED, 'manager_review', reviewId, actor, null, null, null, { reason })
  return { ok: true }
}

export async function forceServerWins(reviewId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const item = await query('SELECT * FROM pos360_sync_manager_review_queue WHERE id=$1', [reviewId])
  if (!item.rows.length) return { ok: false, error: 'review_not_found' }
  const r = item.rows[0]
  if (r.conflict_id) return resolveConflict(r.conflict_id, 'server_wins', null, actor)
  return denyReplay(reviewId, 'server_wins', actor)
}

export async function forceDeviceWins(reviewId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const item = await query('SELECT * FROM pos360_sync_manager_review_queue WHERE id=$1', [reviewId])
  if (!item.rows.length) return { ok: false, error: 'review_not_found' }
  const r = item.rows[0]
  if (r.conflict_id) return resolveConflict(r.conflict_id, 'device_wins', null, actor)
  return approveReplay(reviewId, actor)
}

export async function moveReviewToDeadLetter(reviewId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'sync' }
  }
  const item = await query('SELECT * FROM pos360_sync_manager_review_queue WHERE id=$1', [reviewId])
  if (!item.rows.length) return { ok: false, error: 'review_not_found' }
  const r = item.rows[0]
  await query(`UPDATE pos360_sync_manager_review_queue SET status='dead_lettered', updated_at=NOW() WHERE id=$1`, [reviewId])
  if (r.sync_action_id) return moveToDeadLetter(r.sync_action_id, 'manager_review_dead_lettered', actor)
  return { ok: true }
}

// ── Localization ──────────────────────────────────────────────────────────────
export function getSupportedSyncLanguages() {
  return { ok: true, languages: SUPPORTED_LANGUAGES }
}

export async function setSyncLanguagePreference(venueId, tenantId, deviceId, lang, actor = {}) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    return { ok: false, error: 'unsupported_language' }
  }
  await syncAudit(venueId, tenantId, SYNC_EVENTS.LANGUAGE_PREFERENCE_SAVED, 'device', deviceId, actor, null, null, null, { lang })
  return { ok: true, lang }
}

export async function recordMissingTranslationKey(venueId, tenantId, key, lang, actor = {}) {
  await syncAudit(venueId, tenantId, SYNC_EVENTS.TRANSLATION_MISSING_KEY, 'localization', null, actor, null, null, null, { key, lang })
  return { ok: true }
}
