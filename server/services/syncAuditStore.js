/**
 * Sync Audit Store — Phase 6G
 * Backend source of truth for audit logs and event lifecycle timeline.
 * Built additively on `sync_audit_logs` / `sync_event_lifecycle`
 * (migration 014) — never touches sync_events, sync_failures,
 * sync_conflict_decisions, or sync_reconciliation_notes directly.
 * Honest degraded-mode contract: if the DB is unavailable, every read/write
 * returns {dbAvailable:false, degraded:true, message} or throws
 * DbUnavailableError — never claims a log was durably written when it
 * wasn't.
 */

import { query, isDbAvailable } from '../db/connection.js'
import { sanitizeAuditMetadata } from './syncSecurityResponseService.js'

export class DbUnavailableError extends Error {
  constructor() {
    super('Database unavailable — audit store degraded')
    this.code = 'DB_UNAVAILABLE'
  }
}

function assertDb() {
  if (!isDbAvailable()) throw new DbUnavailableError()
}

// Metadata is for operational context only — never include payment details,
// guest PII, auth secrets, or full payloads. Phase 6H extends this guard
// (see syncSecurityResponseService.sanitizeAuditMetadata) to also strip
// auth headers/cookies/passwords/reset tokens/API keys and cap value size —
// failures here never block the audit write, they just drop the field.
function sanitizeMetadata(metadata) {
  return sanitizeAuditMetadata(metadata).sanitized
}

function toCamelAuditLog(row) {
  if (!row) return null
  return {
    auditId: row.audit_id,
    eventId: row.event_id,
    businessActionFingerprint: row.business_action_fingerprint,
    actorUserId: row.actor_user_id,
    actorStaffId: row.actor_staff_id,
    actorRole: row.actor_role,
    actorDisplayName: row.actor_display_name,
    actorSource: row.actor_source,
    deviceId: row.device_id,
    actionType: row.action_type,
    actionCategory: row.action_category,
    entityType: row.entity_type,
    entityId: row.entity_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    decisionId: row.decision_id,
    reconciliationNoteId: row.reconciliation_note_id,
    replayAttemptId: row.replay_attempt_id,
    reason: row.reason,
    metadata: row.metadata,
    createdAt: row.created_at,
  }
}

function toCamelLifecycle(row) {
  if (!row) return null
  return {
    lifecycleId: row.lifecycle_id,
    eventId: row.event_id,
    businessActionFingerprint: row.business_action_fingerprint,
    eventType: row.event_type,
    deviceId: row.device_id,
    lifecycleStage: row.lifecycle_stage,
    stageStatus: row.stage_status,
    source: row.source,
    actorUserId: row.actor_user_id,
    actorStaffId: row.actor_staff_id,
    actorRole: row.actor_role,
    reason: row.reason,
    metadata: row.metadata,
    createdAt: row.created_at,
  }
}

export async function recordAuditLog(entry) {
  assertDb()
  const inserted = await query(
    `INSERT INTO sync_audit_logs
       (event_id, business_action_fingerprint, actor_user_id, actor_staff_id, actor_role,
        actor_display_name, actor_source, device_id, action_type, action_category,
        entity_type, entity_id, previous_status, new_status, decision_id,
        reconciliation_note_id, replay_attempt_id, reason, metadata, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     RETURNING *`,
    [
      entry.eventId || null, entry.businessActionFingerprint || null, entry.actorUserId || null,
      entry.actorStaffId || null, entry.actorRole || null, entry.actorDisplayName || null,
      entry.actorSource || 'system', entry.deviceId || null, entry.actionType, entry.actionCategory,
      entry.entityType || null, entry.entityId || null, entry.previousStatus || null, entry.newStatus || null,
      entry.decisionId || null, entry.reconciliationNoteId || null, entry.replayAttemptId || null,
      entry.reason || null, JSON.stringify(sanitizeMetadata(entry.metadata)), entry.ipAddress || null, entry.userAgent || null,
    ]
  )
  return toCamelAuditLog(inserted.rows[0])
}

export async function recordLifecycleStage(entry) {
  assertDb()
  const inserted = await query(
    `INSERT INTO sync_event_lifecycle
       (event_id, business_action_fingerprint, event_type, device_id, lifecycle_stage,
        stage_status, source, actor_user_id, actor_staff_id, actor_role, reason, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      entry.eventId, entry.businessActionFingerprint || null, entry.eventType, entry.deviceId || null,
      entry.lifecycleStage, entry.stageStatus || 'recorded', entry.source || 'server',
      entry.actorUserId || null, entry.actorStaffId || null, entry.actorRole || null,
      entry.reason || null, JSON.stringify(sanitizeMetadata(entry.metadata)),
    ]
  )
  return toCamelLifecycle(inserted.rows[0])
}

export async function getAuditLogs({ actionCategory = null, actionType = null, limit = 100 } = {}) {
  assertDb()
  const clauses = []
  const params = []
  if (actionCategory) { params.push(actionCategory); clauses.push(`action_category = $${params.length}`) }
  if (actionType) { params.push(actionType); clauses.push(`action_type = $${params.length}`) }
  params.push(limit)
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const result = await query(
    `SELECT * FROM sync_audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
    params
  )
  return result.rows.map(toCamelAuditLog)
}

export async function getAuditLogsByEventId(eventId) {
  assertDb()
  const result = await query(
    'SELECT * FROM sync_audit_logs WHERE event_id = $1 ORDER BY created_at ASC',
    [eventId]
  )
  return result.rows.map(toCamelAuditLog)
}

export async function getAuditLogsByFingerprint(fingerprint) {
  assertDb()
  const result = await query(
    'SELECT * FROM sync_audit_logs WHERE business_action_fingerprint = $1 ORDER BY created_at ASC',
    [fingerprint]
  )
  return result.rows.map(toCamelAuditLog)
}

export async function getAuditLogsByActor(actorId, { limit = 100 } = {}) {
  assertDb()
  const result = await query(
    `SELECT * FROM sync_audit_logs WHERE actor_staff_id = $1 OR actor_user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [actorId, limit]
  )
  return result.rows.map(toCamelAuditLog)
}

export async function getLifecycleByEventId(eventId) {
  assertDb()
  const result = await query(
    'SELECT * FROM sync_event_lifecycle WHERE event_id = $1 ORDER BY created_at ASC',
    [eventId]
  )
  return result.rows.map(toCamelLifecycle)
}

export async function getLifecycleByFingerprint(fingerprint) {
  assertDb()
  const result = await query(
    'SELECT * FROM sync_event_lifecycle WHERE business_action_fingerprint = $1 ORDER BY created_at ASC',
    [fingerprint]
  )
  return result.rows.map(toCamelLifecycle)
}

/** Full, time-ordered timeline for a single business action: audit logs + lifecycle stages merged. */
export async function getBusinessActionTimeline(fingerprint) {
  assertDb()
  const [logs, lifecycle] = await Promise.all([
    getAuditLogsByFingerprint(fingerprint),
    getLifecycleByFingerprint(fingerprint),
  ])
  const merged = [
    ...logs.map((l) => ({ kind: 'audit', ...l })),
    ...lifecycle.map((l) => ({ kind: 'lifecycle', ...l })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  return { businessActionFingerprint: fingerprint, total: merged.length, timeline: merged }
}

export async function getAuditSummary({ since = null } = {}) {
  if (!isDbAvailable()) {
    return {
      dbAvailable: false,
      degraded: true,
      message: 'Database unavailable — audit store is offline. Audit logs cannot be durably recorded or read right now.',
    }
  }
  const params = since ? [new Date(since)] : []
  const whereClause = since ? 'WHERE created_at > $1' : ''
  const byCategory = await query(
    `SELECT action_category, COUNT(*) AS count FROM sync_audit_logs ${whereClause} GROUP BY action_category`,
    params
  )
  const byStage = await query(
    `SELECT lifecycle_stage, COUNT(*) AS count FROM sync_event_lifecycle ${since ? 'WHERE created_at > $1' : ''} GROUP BY lifecycle_stage`,
    params
  )
  const totalLogs = await query(`SELECT COUNT(*) AS count FROM sync_audit_logs ${whereClause}`, params)
  return {
    dbAvailable: true,
    degraded: false,
    totalAuditLogs: Number(totalLogs.rows[0]?.count || 0),
    byActionCategory: byCategory.rows.reduce((acc, r) => ({ ...acc, [r.action_category]: Number(r.count) }), {}),
    byLifecycleStage: byStage.rows.reduce((acc, r) => ({ ...acc, [r.lifecycle_stage]: Number(r.count) }), {}),
  }
}
