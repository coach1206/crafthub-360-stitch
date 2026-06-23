/**
 * Sync Reconciliation Store — Phase 6F
 * Backend source of truth for event lookup, fingerprint matching, conflict
 * decisions, reconciliation notes, and replay status. Built additively on
 * top of the Phase 6B `sync_events` table (extended by migration 013) and
 * the new `sync_conflict_decisions` / `sync_reconciliation_notes` tables.
 * Never invents data: every read returns exactly what's in the DB, and every
 * write requires the DB to be available (assertDb), per the existing
 * DbUnavailableError degraded-mode contract from syncEventService.js.
 */

import { query, isDbAvailable } from '../db/connection.js'
import { createBusinessActionFingerprint } from './syncBusinessActionFingerprint.js'

export class DbUnavailableError extends Error {
  constructor() {
    super('Database unavailable — reconciliation degraded')
    this.code = 'DB_UNAVAILABLE'
  }
}

function assertDb() {
  if (!isDbAvailable()) throw new DbUnavailableError()
}

function toCamelEvent(row) {
  if (!row) return null
  return {
    eventId: row.event_id,
    sourceDeviceId: row.source_device_id,
    sourceSystem: row.source_system,
    eventType: row.event_type,
    entityId: row.entity_id,
    payload: row.payload,
    syncStatus: row.sync_status,
    clientCreatedAt: row.client_created_at,
    receivedAt: row.received_at,
    attemptCount: row.attempt_count,
    createdByUserId: row.created_by_user_id,
    createdByRole: row.created_by_role,
    businessActionFingerprint: row.business_action_fingerprint,
    replayStatus: row.replay_status,
    replayAttemptCount: row.replay_attempt_count,
    replayLastAttemptAt: row.replay_last_attempt_at,
    replayConfirmedAt: row.replay_confirmed_at,
    conflictType: row.conflict_type,
    conflictDecision: row.conflict_decision,
    requiresManualReview: row.requires_manual_review,
    reconciliationStatus: row.reconciliation_status,
    reconciliationNote: row.reconciliation_note,
    reconciliationResolvedAt: row.reconciliation_resolved_at,
    reconciliationResolvedBy: row.reconciliation_resolved_by,
    backendConfirmationId: row.backend_confirmation_id,
  }
}

export async function getEventById(eventId) {
  assertDb()
  const result = await query('SELECT * FROM sync_events WHERE event_id = $1', [eventId])
  return toCamelEvent(result.rows[0] || null)
}

/**
 * Looks up a matching backend event by business-action fingerprint, computing
 * the fingerprint server-side from each candidate row when the stored column
 * is empty (covers events recorded before migration 013 backfilled it).
 */
export async function getEventByFingerprint(fingerprint, { excludeEventId = null } = {}) {
  assertDb()
  if (!fingerprint) return null
  const stored = await query(
    `SELECT * FROM sync_events WHERE business_action_fingerprint = $1 AND event_id != COALESCE($2, '00000000-0000-0000-0000-000000000000') ORDER BY received_at ASC LIMIT 1`,
    [fingerprint, excludeEventId]
  )
  if (stored.rows.length > 0) return toCamelEvent(stored.rows[0])

  // Fallback: scan recent rows missing a stored fingerprint and compute it on the fly.
  const candidates = await query(
    `SELECT * FROM sync_events WHERE business_action_fingerprint IS NULL AND event_id != COALESCE($1, '00000000-0000-0000-0000-000000000000') ORDER BY received_at DESC LIMIT 500`,
    [excludeEventId]
  )
  for (const row of candidates.rows) {
    if (createBusinessActionFingerprint(row) === fingerprint) return toCamelEvent(row)
  }
  return null
}

export async function getEventsByDeviceId(deviceId, { limit = 100 } = {}) {
  assertDb()
  const result = await query(
    'SELECT * FROM sync_events WHERE source_device_id = $1 ORDER BY received_at DESC LIMIT $2',
    [deviceId, limit]
  )
  return result.rows.map(toCamelEvent)
}

export async function getEventsSince(since) {
  assertDb()
  const result = await query(
    'SELECT * FROM sync_events WHERE received_at > $1 ORDER BY received_at ASC',
    [new Date(since)]
  )
  return result.rows.map(toCamelEvent)
}

export async function getConflictById(decisionId) {
  assertDb()
  const result = await query('SELECT * FROM sync_conflict_decisions WHERE decision_id = $1', [decisionId])
  return result.rows[0] || null
}

export async function listConflicts({ requiresManualReview = null, limit = 200 } = {}) {
  assertDb()
  if (requiresManualReview === null) {
    const result = await query(
      'SELECT * FROM sync_events WHERE conflict_type != $1 ORDER BY received_at DESC LIMIT $2',
      ['none', limit]
    )
    return result.rows.map(toCamelEvent)
  }
  const result = await query(
    'SELECT * FROM sync_events WHERE conflict_type != $1 AND requires_manual_review = $2 ORDER BY received_at DESC LIMIT $3',
    ['none', requiresManualReview, limit]
  )
  return result.rows.map(toCamelEvent)
}

export async function recordConflictDecision({
  eventId, eventType, businessActionFingerprint, conflictType, decision, reason,
  decidedBy = null, source = 'server', requiresManualReview = false, safeToAutoResolve = false,
}) {
  assertDb()
  const inserted = await query(
    `INSERT INTO sync_conflict_decisions
       (event_id, event_type, business_action_fingerprint, conflict_type, decision, reason,
        decided_by, source, requires_manual_review, safe_to_auto_resolve)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [eventId, eventType, businessActionFingerprint || null, conflictType, decision, reason || null,
     decidedBy, source, requiresManualReview, safeToAutoResolve]
  )
  await query(
    `UPDATE sync_events SET conflict_type = $2, conflict_decision = $3, requires_manual_review = $4 WHERE event_id = $1`,
    [eventId, conflictType, decision, requiresManualReview]
  )
  return inserted.rows[0]
}

export async function createReconciliationNote(eventId, note, { createdBy = null, source = 'staff' } = {}) {
  assertDb()
  const inserted = await query(
    `INSERT INTO sync_reconciliation_notes (event_id, note, created_by, source)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [eventId, note, createdBy, source]
  )
  await query(
    `UPDATE sync_events SET reconciliation_note = $2 WHERE event_id = $1`,
    [eventId, note]
  )
  return inserted.rows[0]
}

/** Requires either an explicit staffReason or a backendConfirmationId — never fabricates resolution. */
export async function resolveReconciliation(eventId, { staffReason, backendConfirmationId, resolvedBy = null } = {}) {
  assertDb()
  if (!staffReason && !backendConfirmationId) {
    throw new Error('resolveReconciliation requires staffReason or backendConfirmationId')
  }
  const result = await query(
    `UPDATE sync_events
       SET reconciliation_status = 'resolved_confirmed',
           reconciliation_note = COALESCE($2, reconciliation_note),
           reconciliation_resolved_at = NOW(),
           reconciliation_resolved_by = $3,
           backend_confirmation_id = COALESCE($4, backend_confirmation_id),
           requires_manual_review = FALSE
     WHERE event_id = $1
     RETURNING *`,
    [eventId, staffReason || null, resolvedBy, backendConfirmationId || null]
  )
  return toCamelEvent(result.rows[0] || null)
}

export async function recordReplayAttempt(eventId) {
  assertDb()
  const result = await query(
    `UPDATE sync_events
       SET replay_attempt_count = replay_attempt_count + 1, replay_last_attempt_at = NOW()
     WHERE event_id = $1 RETURNING *`,
    [eventId]
  )
  return toCamelEvent(result.rows[0] || null)
}

export async function markReplayConfirmed(eventId, { confirmationId = null } = {}) {
  assertDb()
  const result = await query(
    `UPDATE sync_events
       SET replay_status = 'replayed_confirmed', replay_confirmed_at = NOW(),
           backend_confirmation_id = COALESCE($2, backend_confirmation_id)
     WHERE event_id = $1 RETURNING *`,
    [eventId, confirmationId]
  )
  return toCamelEvent(result.rows[0] || null)
}

export async function markReplayRejected(eventId, reason) {
  assertDb()
  const result = await query(
    `UPDATE sync_events SET replay_status = 'replay_rejected' WHERE event_id = $1 RETURNING *`,
    [eventId]
  )
  await query(
    `INSERT INTO sync_failures (event_id, reason, resolved) VALUES ($1,$2,FALSE)`,
    [eventId, reason || 'replay_rejected']
  )
  return toCamelEvent(result.rows[0] || null)
}

/**
 * `replayEvent` is the single write path that actually re-applies an event's
 * effect, by delegating to the same idempotent recordEvent() used by the
 * normal sync intake (Phase 6B) — it never duplicates that logic.
 */
export async function replayEvent(eventId, recordEventFn, ctx) {
  assertDb()
  const event = await getEventById(eventId)
  if (!event) return { replayed: false, reason: 'missing_event' }
  const { duplicate } = await recordEventFn({
    eventId: event.eventId,
    sourceSystem: event.sourceSystem,
    eventType: event.eventType,
    entityId: event.entityId,
    payload: event.payload,
    clientCreatedAt: event.clientCreatedAt,
  }, ctx)
  return { replayed: true, duplicate }
}

export async function getReconciliationSummary() {
  if (!isDbAvailable()) {
    return {
      dbAvailable: false,
      degraded: true,
      message: 'Database unavailable — reconciliation store is offline. Conflict and replay decisions cannot be confirmed right now.',
    }
  }
  const conflicts = await query(
    `SELECT conflict_type, COUNT(*) AS count FROM sync_events WHERE conflict_type != 'none' GROUP BY conflict_type`
  )
  const manualReview = await query(
    `SELECT COUNT(*) AS count FROM sync_events WHERE requires_manual_review = TRUE`
  )
  const replayStatuses = await query(
    `SELECT replay_status, COUNT(*) AS count FROM sync_events GROUP BY replay_status`
  )
  return {
    dbAvailable: true,
    degraded: false,
    byConflictType: conflicts.rows.reduce((acc, r) => ({ ...acc, [r.conflict_type]: Number(r.count) }), {}),
    manualReviewCount: Number(manualReview.rows[0]?.count || 0),
    byReplayStatus: replayStatuses.rows.reduce((acc, r) => ({ ...acc, [r.replay_status]: Number(r.count) }), {}),
  }
}
