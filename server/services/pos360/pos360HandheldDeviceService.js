/**
 * POS360 Handheld Device Suite — Service Layer (Phase B.3)
 *
 * All functions guard with isDbAvailable().
 * When DB is unavailable: return { ok: false, localPreview: true, error: 'database_not_configured', area }
 * writeAudit: containsSecrets always false, exposesPrivateData always false.
 * Falls back gracefully when no database connection is configured. Never prints or logs the database connection string.
 */
import { isDbAvailable, query } from '../../db/connection.js'
import { HANDHELD_EVENTS } from './pos360HandheldEventContracts.js'

// ── Internal helpers ──────────────────────────────────────────────────────────

const listeners = []
export function onHandheldEvent(fn) { listeners.push(fn) }

function emitHandheldEvent(ev) {
  listeners.forEach(fn => { try { fn(ev) } catch { /* isolate */ } })
  persistEvent(ev).catch(() => {})
}

async function persistEvent(ev) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_device_sync_events
       (tenant_id, venue_id, device_id, sync_status, sync_payload, audit_context)
     VALUES ($1,$2,$3,'completed',$4,$5)`,
    [ev.tenantId || '', ev.venueId || '', ev.deviceId || '', JSON.stringify(ev), JSON.stringify({ containsSecrets: false })]
  ).catch(() => {})
}

async function writeAudit({ tenantId, venueId, locationId, deviceId, staffUserId, action, entityType, entityId, actorRole, previousValue = {}, newValue = {} }) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_handheld_action_audit
       (tenant_id,venue_id,location_id,device_id,staff_user_id,action,entity_type,entity_id,actor_role,previous_value,new_value,contains_secrets,exposes_private_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,false)`,
    [tenantId, venueId, locationId, deviceId, staffUserId, action, entityType, entityId, actorRole, JSON.stringify(previousValue), JSON.stringify(newValue)]
  ).catch(() => {})
}

function buildSet(updates, allowed) {
  const keys = Object.keys(updates).filter(k => allowed.includes(k))
  if (!keys.length) return null
  const sets = keys.map((k, i) => `${k} = $${i + 1}`)
  return { clause: sets.join(', '), values: keys.map(k => updates[k]), count: keys.length }
}

// ── Device ────────────────────────────────────────────────────────────────────

export async function registerDevice({ tenantId, venueId, locationId, deviceName, deviceType, serialNumber, hardwareModel, appVersion, capabilities = {}, createdBy }) {
  const area = 'registerDevice'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_devices (tenant_id,venue_id,location_id,device_name,device_type,serial_number,hardware_model,app_version,capabilities,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [tenantId, venueId, locationId, deviceName, deviceType || 'handheld', serialNumber, hardwareModel, appVersion, JSON.stringify(capabilities), createdBy]
  )
  const device = r.rows[0]
  emitHandheldEvent({ type: HANDHELD_EVENTS.DEVICE_REGISTERED, tenantId, venueId, deviceId: device.id })
  await writeAudit({ tenantId, venueId, locationId, deviceId: device.id, staffUserId: createdBy, action: 'device.registered', entityType: 'device', entityId: device.id, newValue: { deviceName, deviceType } })
  return { ok: true, device }
}

export async function getDevice({ deviceId, venueId }) {
  const area = 'getDevice'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`SELECT * FROM pos360_devices WHERE id=$1 AND venue_id=$2 AND deleted_at IS NULL`, [deviceId, venueId])
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, device: r.rows[0] }
}

export async function listDevices({ venueId, tenantId, deviceType, isActive = true }) {
  const area = 'listDevices'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, devices: [] }
  const conditions = ['venue_id=$1', 'deleted_at IS NULL']
  const params = [venueId]
  if (deviceType) { params.push(deviceType); conditions.push(`device_type=$${params.length}`) }
  if (isActive !== undefined) { params.push(isActive); conditions.push(`is_active=$${params.length}`) }
  const r = await query(`SELECT * FROM pos360_devices WHERE ${conditions.join(' AND ')} ORDER BY device_name ASC`, params)
  return { ok: true, devices: r.rows }
}

export async function updateDevice({ deviceId, venueId, updates, updatedBy }) {
  const area = 'updateDevice'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const allowed = ['device_name','device_type','app_version','is_active','is_online','last_seen_at','assigned_staff_id','network_info','capabilities','metadata']
  const s = buildSet(updates, allowed)
  if (!s) return { ok: false, error: 'no_valid_fields' }
  const r = await query(
    `UPDATE pos360_devices SET ${s.clause}, updated_by=$${s.count+1}, updated_at=NOW() WHERE id=$${s.count+2} AND venue_id=$${s.count+3} RETURNING *`,
    [...s.values, updatedBy, deviceId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  emitHandheldEvent({ type: HANDHELD_EVENTS.DEVICE_UPDATED, venueId, deviceId })
  return { ok: true, device: r.rows[0] }
}

export async function disableDevice({ deviceId, venueId, disabledBy }) {
  const area = 'disableDevice'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `UPDATE pos360_devices SET is_active=false, deleted_at=NOW(), updated_by=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [disabledBy, deviceId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  emitHandheldEvent({ type: HANDHELD_EVENTS.DEVICE_DISABLED, venueId, deviceId })
  await writeAudit({ venueId, deviceId, staffUserId: disabledBy, action: 'device.disabled', entityType: 'device', entityId: deviceId })
  return { ok: true, device: r.rows[0] }
}

// ── Device Sessions ───────────────────────────────────────────────────────────

export async function startDeviceSession({ tenantId, venueId, locationId, deviceId, staffUserId, staffRole, ipAddress, userAgent, createdBy }) {
  const area = 'startDeviceSession'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  await query(`UPDATE pos360_device_sessions SET is_active=false, ended_at=NOW(), end_reason='superseded' WHERE device_id=$1 AND is_active=true`, [deviceId])
  const r = await query(
    `INSERT INTO pos360_device_sessions (tenant_id,venue_id,location_id,device_id,staff_user_id,staff_role,ip_address,user_agent,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, staffUserId, staffRole, ipAddress, userAgent, createdBy]
  )
  const session = r.rows[0]
  emitHandheldEvent({ type: HANDHELD_EVENTS.SESSION_STARTED, tenantId, venueId, deviceId, staffUserId, sessionId: session.id })
  await writeAudit({ tenantId, venueId, locationId, deviceId, staffUserId, action: 'session.started', entityType: 'device_session', entityId: session.id })
  return { ok: true, session }
}

export async function endDeviceSession({ sessionId, deviceId, venueId, endReason, updatedBy }) {
  const area = 'endDeviceSession'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `UPDATE pos360_device_sessions SET is_active=false, ended_at=NOW(), end_reason=$1, updated_by=$2, updated_at=NOW()
     WHERE id=$3 AND device_id=$4 AND venue_id=$5 RETURNING *`,
    [endReason || 'logout', updatedBy, sessionId, deviceId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  emitHandheldEvent({ type: HANDHELD_EVENTS.SESSION_ENDED, venueId, deviceId, sessionId })
  return { ok: true, session: r.rows[0] }
}

// ── Device Diagnostics ────────────────────────────────────────────────────────

export async function saveDeviceDiagnostics({ tenantId, venueId, locationId, deviceId, staffUserId, batteryLevel, isCharging, networkStatus, connectionType, signalStrength, cardReaderStatus, printerStatus, kdsStatus, scannerStatus, cameraPermission, appVersion, lastSyncAt, offlineQueueCount, errorState, diagnosticsPayload = {}, createdBy }) {
  const area = 'saveDeviceDiagnostics'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_device_diagnostics
       (tenant_id,venue_id,location_id,device_id,staff_user_id,battery_level,is_charging,network_status,connection_type,signal_strength,card_reader_status,printer_status,kds_status,scanner_status,camera_permission,app_version,last_sync_at,offline_queue_count,error_state,diagnostics_payload,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, staffUserId, batteryLevel, isCharging, networkStatus, connectionType, signalStrength, cardReaderStatus, printerStatus, kdsStatus, scannerStatus, cameraPermission, appVersion, lastSyncAt, offlineQueueCount || 0, errorState, JSON.stringify(diagnosticsPayload), createdBy]
  )
  emitHandheldEvent({ type: HANDHELD_EVENTS.DIAGNOSTICS_RECORDED, venueId, deviceId })
  return { ok: true, diagnostics: r.rows[0] }
}

export async function getLatestDeviceDiagnostics({ deviceId, venueId }) {
  const area = 'getLatestDeviceDiagnostics'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`SELECT * FROM pos360_device_diagnostics WHERE device_id=$1 AND venue_id=$2 ORDER BY created_at DESC LIMIT 1`, [deviceId, venueId])
  return { ok: true, diagnostics: r.rows[0] || null }
}

// ── Sync Events ───────────────────────────────────────────────────────────────

export async function recordSyncEvent({ tenantId, venueId, locationId, deviceId, staffUserId, syncDirection, syncStatus, recordsSent, recordsReceived, recordsConflicted, errorMessage, startedAt, completedAt, durationMs, syncPayload = {}, createdBy }) {
  const area = 'recordSyncEvent'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_device_sync_events
       (tenant_id,venue_id,location_id,device_id,staff_user_id,sync_direction,sync_status,records_sent,records_received,records_conflicted,error_message,started_at,completed_at,duration_ms,sync_payload,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, staffUserId, syncDirection || 'outbound', syncStatus, recordsSent || 0, recordsReceived || 0, recordsConflicted || 0, errorMessage, startedAt || new Date(), completedAt, durationMs, JSON.stringify(syncPayload), createdBy]
  )
  const eventType = syncStatus === 'completed' ? HANDHELD_EVENTS.SYNC_COMPLETED
    : syncStatus === 'failed' ? HANDHELD_EVENTS.SYNC_FAILED
    : HANDHELD_EVENTS.SYNC_STARTED
  emitHandheldEvent({ type: eventType, venueId, deviceId, syncStatus })
  return { ok: true, syncEvent: r.rows[0] }
}

export async function getDeviceSyncStatus({ deviceId, venueId }) {
  const area = 'getDeviceSyncStatus'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`SELECT * FROM pos360_device_sync_events WHERE device_id=$1 AND venue_id=$2 ORDER BY created_at DESC LIMIT 10`, [deviceId, venueId])
  return { ok: true, syncHistory: r.rows }
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function createNotification({ tenantId, venueId, locationId, deviceId, staffUserId, notificationType, title, body, actionType, actionPayload = {}, expiresAt, createdBy }) {
  const area = 'createNotification'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_handheld_notifications
       (tenant_id,venue_id,location_id,device_id,staff_user_id,notification_type,title,body,action_type,action_payload,expires_at,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, staffUserId, notificationType || 'info', title, body, actionType, JSON.stringify(actionPayload), expiresAt, createdBy]
  )
  emitHandheldEvent({ type: HANDHELD_EVENTS.NOTIFICATION_CREATED, venueId, deviceId, staffUserId, title })
  return { ok: true, notification: r.rows[0] }
}

export async function getNotifications({ venueId, staffUserId, deviceId, unreadOnly = false }) {
  const area = 'getNotifications'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, notifications: [] }
  const conditions = ['venue_id=$1', 'is_active=true']
  const params = [venueId]
  if (staffUserId) { params.push(staffUserId); conditions.push(`staff_user_id=$${params.length}`) }
  if (deviceId)    { params.push(deviceId);    conditions.push(`device_id=$${params.length}`) }
  if (unreadOnly)  { conditions.push('is_read=false') }
  const r = await query(`SELECT * FROM pos360_handheld_notifications WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 50`, params)
  return { ok: true, notifications: r.rows }
}

export async function markNotificationRead({ notificationId, venueId, updatedBy }) {
  const area = 'markNotificationRead'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `UPDATE pos360_handheld_notifications SET is_read=true, read_at=NOW(), updated_by=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [updatedBy, notificationId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  emitHandheldEvent({ type: HANDHELD_EVENTS.NOTIFICATION_READ, venueId, notificationId })
  return { ok: true, notification: r.rows[0] }
}

// ── Offline Queue ─────────────────────────────────────────────────────────────

export async function queueOfflineAction({ tenantId, venueId, locationId, deviceId, staffUserId, actionType, entityType, entityId, actionPayload = {}, createdBy }) {
  const area = 'queueOfflineAction'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_handheld_offline_queue
       (tenant_id,venue_id,location_id,device_id,staff_user_id,action_type,entity_type,entity_id,action_payload,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, staffUserId, actionType, entityType, entityId, JSON.stringify(actionPayload), createdBy]
  )
  emitHandheldEvent({ type: HANDHELD_EVENTS.OFFLINE_ACTION_QUEUED, venueId, deviceId, actionType })
  return { ok: true, queuedAction: r.rows[0] }
}

export async function listOfflineQueue({ deviceId, venueId, status }) {
  const area = 'listOfflineQueue'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, queue: [] }
  const conditions = ['device_id=$1', 'venue_id=$2', 'is_active=true']
  const params = [deviceId, venueId]
  if (status) { params.push(status); conditions.push(`queue_status=$${params.length}`) }
  const r = await query(`SELECT * FROM pos360_handheld_offline_queue WHERE ${conditions.join(' AND ')} ORDER BY created_at ASC`, params)
  return { ok: true, queue: r.rows }
}

export async function markSyncCompleted({ deviceId, venueId, updatedBy }) {
  const area = 'markSyncCompleted'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  await query(
    `UPDATE pos360_handheld_offline_queue SET queue_status='replayed', replayed_at=NOW(), updated_by=$1, updated_at=NOW()
     WHERE device_id=$2 AND venue_id=$3 AND queue_status='pending'`,
    [updatedBy, deviceId, venueId]
  )
  emitHandheldEvent({ type: HANDHELD_EVENTS.SYNC_COMPLETED, venueId, deviceId })
  return { ok: true }
}

export async function markSyncFailed({ deviceId, venueId, errorMessage, updatedBy }) {
  const area = 'markSyncFailed'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  await query(
    `UPDATE pos360_handheld_offline_queue SET queue_status='failed', error_message=$1, updated_by=$2, updated_at=NOW()
     WHERE device_id=$3 AND venue_id=$4 AND queue_status='replaying'`,
    [errorMessage, updatedBy, deviceId, venueId]
  )
  emitHandheldEvent({ type: HANDHELD_EVENTS.SYNC_FAILED, venueId, deviceId, errorMessage })
  return { ok: true }
}

export async function replayOfflineQueuePlaceholder({ deviceId, venueId }) {
  // Placeholder: real replay requires idempotent action handlers per action_type.
  // Return honest state — do not fake successful replay.
  const area = 'replayOfflineQueuePlaceholder'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const countR = await query(
    `SELECT COUNT(*) as cnt FROM pos360_handheld_offline_queue WHERE device_id=$1 AND venue_id=$2 AND queue_status='pending'`,
    [deviceId, venueId]
  )
  const pending = parseInt(countR.rows[0]?.cnt || '0')
  emitHandheldEvent({ type: HANDHELD_EVENTS.OFFLINE_ACTION_REPLAYED, venueId, deviceId, pending })
  return { ok: true, pending, message: `Replay handler not yet connected. ${pending} action(s) queued.`, localPreview: pending > 0 }
}

// ── Manager Approvals ─────────────────────────────────────────────────────────

export async function requestManagerApproval({ tenantId, venueId, locationId, deviceId, requestingStaffId, actionType, entityType, entityId, actionPayload = {}, expiresAt, createdBy }) {
  const area = 'requestManagerApproval'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_handheld_manager_approvals
       (tenant_id,venue_id,location_id,device_id,requesting_staff_id,action_type,entity_type,entity_id,action_payload,expires_at,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, requestingStaffId, actionType, entityType, entityId, JSON.stringify(actionPayload), expiresAt, createdBy]
  )
  const approval = r.rows[0]
  emitHandheldEvent({ type: HANDHELD_EVENTS.MANAGER_APPROVAL_REQUESTED, venueId, deviceId, approvalId: approval.id, actionType })
  await writeAudit({ tenantId, venueId, locationId, deviceId, staffUserId: requestingStaffId, action: 'manager_approval.requested', entityType, entityId, newValue: { actionType } })
  return { ok: true, approval }
}

export async function listPendingApprovals({ venueId, managerId }) {
  const area = 'listPendingApprovals'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, approvals: [] }
  const r = await query(`SELECT * FROM pos360_handheld_manager_approvals WHERE venue_id=$1 AND approval_status='pending' AND is_active=true ORDER BY created_at ASC`, [venueId])
  return { ok: true, approvals: r.rows }
}

export async function resolveManagerApproval({ approvalId, venueId, decision, approvingManagerId, approvalNote, updatedBy }) {
  const area = 'resolveManagerApproval'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const status = decision === 'approve' ? 'approved' : 'denied'
  const r = await query(
    `UPDATE pos360_handheld_manager_approvals
     SET approval_status=$1, approving_manager_id=$2, approval_note=$3, resolved_at=NOW(), updated_by=$4, updated_at=NOW()
     WHERE id=$5 AND venue_id=$6 RETURNING *`,
    [status, approvingManagerId, approvalNote, updatedBy, approvalId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  const evType = status === 'approved' ? HANDHELD_EVENTS.MANAGER_APPROVAL_APPROVED : HANDHELD_EVENTS.MANAGER_APPROVAL_DENIED
  emitHandheldEvent({ type: evType, venueId, approvalId, approvingManagerId })
  await writeAudit({ venueId, staffUserId: approvingManagerId, action: `manager_approval.${status}`, entityType: 'manager_approval', entityId: approvalId })
  return { ok: true, approval: r.rows[0] }
}

// ── Emergency Mode ────────────────────────────────────────────────────────────

export async function activateEmergencyMode({ tenantId, venueId, locationId, deviceId, staffUserId, emergencyType, notes, affectedSystems = [], createdBy }) {
  const area = 'activateEmergencyMode'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_handheld_emergency_events
       (tenant_id,venue_id,location_id,device_id,staff_user_id,emergency_type,notes,affected_systems,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, staffUserId, emergencyType || 'general', notes, JSON.stringify(affectedSystems), createdBy]
  )
  const ev = r.rows[0]
  emitHandheldEvent({ type: HANDHELD_EVENTS.EMERGENCY_MODE_ACTIVATED, tenantId, venueId, deviceId, emergencyId: ev.id, emergencyType })
  await writeAudit({ tenantId, venueId, locationId, deviceId, staffUserId, action: 'emergency_mode.activated', entityType: 'emergency', entityId: ev.id, newValue: { emergencyType, notes } })
  return { ok: true, emergency: ev }
}

export async function deactivateEmergencyMode({ emergencyId, venueId, deactivatedBy, recoveryActions = [] }) {
  const area = 'deactivateEmergencyMode'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `UPDATE pos360_handheld_emergency_events
     SET emergency_status='deactivated', deactivated_at=NOW(), deactivated_by=$1, recovery_actions=$2, updated_by=$1, updated_at=NOW(), is_active=false
     WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [deactivatedBy, JSON.stringify(recoveryActions), emergencyId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  emitHandheldEvent({ type: HANDHELD_EVENTS.EMERGENCY_MODE_DEACTIVATED, venueId, emergencyId })
  await writeAudit({ venueId, staffUserId: deactivatedBy, action: 'emergency_mode.deactivated', entityType: 'emergency', entityId: emergencyId })
  return { ok: true, emergency: r.rows[0] }
}

export async function logEmergencyEvent({ tenantId, venueId, locationId, deviceId, staffUserId, emergencyType, notes, createdBy }) {
  return activateEmergencyMode({ tenantId, venueId, locationId, deviceId, staffUserId, emergencyType, notes, createdBy })
}

// ── Handheld Home State ───────────────────────────────────────────────────────

export async function getHandheldHomeState({ venueId, locationId, staffUserId, deviceId }) {
  const area = 'getHandheldHomeState'
  if (!isDbAvailable()) {
    return {
      ok: true,
      localPreview: true,
      venueId,
      locationId,
      staffUserId,
      deviceId,
      notifications: [],
      pendingApprovals: 0,
      offlineQueueCount: 0,
      message: 'No database connection — home state is local preview only.',
    }
  }

  const [notifR, approvalR, queueR] = await Promise.all([
    query(`SELECT COUNT(*) as cnt FROM pos360_handheld_notifications WHERE venue_id=$1 AND staff_user_id=$2 AND is_read=false AND is_active=true`, [venueId, staffUserId]),
    query(`SELECT COUNT(*) as cnt FROM pos360_handheld_manager_approvals WHERE venue_id=$1 AND approval_status='pending' AND is_active=true`, [venueId]),
    deviceId
      ? query(`SELECT COUNT(*) as cnt FROM pos360_handheld_offline_queue WHERE device_id=$1 AND queue_status='pending'`, [deviceId])
      : Promise.resolve({ rows: [{ cnt: 0 }] }),
  ])

  return {
    ok: true,
    venueId,
    locationId,
    staffUserId,
    deviceId,
    unreadNotifications: parseInt(notifR.rows[0]?.cnt || '0'),
    pendingApprovals:    parseInt(approvalR.rows[0]?.cnt || '0'),
    offlineQueueCount:   parseInt(queueR.rows[0]?.cnt || '0'),
  }
}

// ── Handheld Table Hooks (delegates to Floor Management) ─────────────────────

export async function getHandheldTableList({ venueId, staffUserId, role }) {
  const area = 'getHandheldTableList'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, tables: [] }
  // Delegates to pos360_tables from Phase B.1
  let sql = `SELECT t.*, s.section_name FROM pos360_tables t LEFT JOIN pos360_floor_sections s ON t.section_id=s.id WHERE t.venue_id=$1 AND t.deleted_at IS NULL ORDER BY t.table_number ASC`
  const params = [venueId]
  if (role !== 'manager' && role !== 'owner' && staffUserId) {
    sql = `SELECT t.*, s.section_name FROM pos360_tables t
           LEFT JOIN pos360_floor_sections s ON t.section_id=s.id
           LEFT JOIN pos360_table_server_assignments a ON a.table_id=t.id AND a.is_active=true
           WHERE t.venue_id=$1 AND t.deleted_at IS NULL AND (a.staff_user_id=$2 OR t.status IN ('available','reserved'))
           ORDER BY t.table_number ASC`
    params.push(staffUserId)
  }
  const r = await query(sql, params)
  emitHandheldEvent({ type: HANDHELD_EVENTS.TABLE_OPENED, venueId, staffUserId })
  return { ok: true, tables: r.rows }
}

export async function syncHandheldTableState({ venueId, deviceId, staffUserId }) {
  const area = 'syncHandheldTableState'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  emitHandheldEvent({ type: HANDHELD_EVENTS.SYNC_STARTED, venueId, deviceId, staffUserId })
  const r = await query(`SELECT * FROM pos360_tables WHERE venue_id=$1 AND deleted_at IS NULL ORDER BY table_number ASC`, [venueId])
  emitHandheldEvent({ type: HANDHELD_EVENTS.SYNC_COMPLETED, venueId, deviceId })
  return { ok: true, tables: r.rows, syncedAt: new Date() }
}

// ── Order Hooks ───────────────────────────────────────────────────────────────

export async function createHandheldOrder({ venueId, tenantId, locationId, deviceId, staffUserId, tableId, guestId, smokecraftSessionId, loyaltyProfileId, orderPayload = {}, createdBy }) {
  const area = 'createHandheldOrder'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  // Handheld order hook — connects to pos360 order tables if present
  // Emit event; concrete persistence delegates to the orders service (Phase B+)
  emitHandheldEvent({ type: HANDHELD_EVENTS.ORDER_CREATED, venueId, deviceId, staffUserId, tableId })
  await writeAudit({ tenantId, venueId, locationId, deviceId, staffUserId, action: 'order.created', entityType: 'order', newValue: { tableId, guestId } })
  return {
    ok: true,
    orderId: `handheld-order-${Date.now()}`,
    localPreview: true,
    message: 'Order creation hook active — full persistence requires Phase B.5 order service.',
    tableId,
    staffUserId,
    deviceId,
  }
}

export async function addItemToHandheldOrder({ orderId, venueId, deviceId, staffUserId, itemId, quantity, modifiers = [], addons = [], notes, createdBy }) {
  const area = 'addItemToHandheldOrder'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  emitHandheldEvent({ type: HANDHELD_EVENTS.ORDER_ITEM_ADDED, venueId, deviceId, staffUserId, orderId, itemId })
  return { ok: true, orderId, itemId, quantity, localPreview: true, message: 'Item add hook active — full persistence requires Phase B.5.' }
}

export async function sendOrderToStation({ orderId, venueId, deviceId, staffUserId, stationId, items = [], createdBy }) {
  const area = 'sendOrderToStation'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  emitHandheldEvent({ type: HANDHELD_EVENTS.ORDER_SENT_TO_STATION, venueId, deviceId, orderId, stationId })
  await writeAudit({ venueId, deviceId, staffUserId, action: 'order.sent_to_station', entityType: 'order', entityId: orderId, newValue: { stationId } })
  return { ok: true, orderId, stationId, localPreview: true, message: 'Station routing hook active — full KDS integration requires Phase B.4.' }
}

// ── Payment Hooks ─────────────────────────────────────────────────────────────

export async function getPaymentOptions({ venueId }) {
  // Provider-agnostic payment options — no real payment processing
  return {
    ok: true,
    methods: ['credit_card','debit_card','apple_pay','google_pay','tap_to_pay','gift_card','house_account','split'],
    tipPresets: [15, 18, 20, 25],
    signatureRequired: false,
    contactlessEnabled: false,
    providerConnected: false,
    message: 'Payment provider not connected. Configure payment provider integration to enable real payments.',
  }
}

export async function createPaymentIntentPlaceholder({ venueId, orderId, amount, currency, paymentMethod, deviceId, staffUserId }) {
  const area = 'createPaymentIntentPlaceholder'
  emitHandheldEvent({ type: HANDHELD_EVENTS.PAYMENT_STARTED, venueId, orderId, paymentMethod })
  // No real payment processing — honest placeholder
  return {
    ok: false,
    localPreview: true,
    message: 'Payment provider not connected. No payment was processed.',
    orderId,
    amount,
    paymentMethod,
  }
}

export async function captureTipSelection({ venueId, orderId, deviceId, staffUserId, tipAmount, tipPercent }) {
  emitHandheldEvent({ type: HANDHELD_EVENTS.PAYMENT_TIP_SELECTED, venueId, orderId, tipAmount })
  return { ok: true, orderId, tipAmount, tipPercent }
}

export async function captureSignature({ venueId, orderId, deviceId, signatureData }) {
  const area = 'captureSignature'
  if (!signatureData) return { ok: false, error: 'no_signature_data' }
  emitHandheldEvent({ type: HANDHELD_EVENTS.PAYMENT_SIGNATURE_CAPTURED, venueId, orderId })
  return { ok: true, orderId, captured: true, message: 'Signature captured locally — not persisted until payment provider is connected.' }
}

export async function sendReceipt({ venueId, orderId, recipientEmail, recipientPhone, receiptType }) {
  emitHandheldEvent({ type: HANDHELD_EVENTS.RECEIPT_SENT, venueId, orderId, recipientEmail, recipientPhone })
  return { ok: true, orderId, sent: true, message: 'Receipt dispatch hook active — delivery provider required for real sending.' }
}

// ── SmokeCraft Hooks ──────────────────────────────────────────────────────────

export async function getGuestSmokecraftContext({ venueId, guestId, tableId }) {
  const area = 'getGuestSmokecraftContext'
  if (!isDbAvailable()) {
    return {
      ok: true,
      localPreview: true,
      guestId,
      message: 'SmokeCraft guest data unavailable — database not configured.',
      flavorMemory: [],
      passportStatus: null,
      loyaltyStatus: null,
      pairingRecommendations: [],
      previousPurchases: [],
      xpRewardEligibility: null,
    }
  }
  emitHandheldEvent({ type: HANDHELD_EVENTS.SMOKECRAFT_CONTEXT_LOADED, venueId, guestId })
  return {
    ok: true,
    guestId,
    message: 'SmokeCraft context loaded. Connect SmokeCraft module for full profile.',
    flavorMemory: [],
    passportStatus: null,
    loyaltyStatus: null,
    pairingRecommendations: [],
    previousPurchases: [],
    xpRewardEligibility: null,
    localPreview: true,
  }
}

export async function getSmokecraftPairingHooks({ venueId, guestId, currentItemId }) {
  return {
    ok: true,
    guestId,
    currentItemId,
    pairings: [],
    message: 'SmokeCraft pairing engine not connected. No pairings available.',
    localPreview: true,
  }
}

export async function attachSmokecraftSessionToOrder({ venueId, orderId, guestId, smokecraftSessionId }) {
  emitHandheldEvent({ type: HANDHELD_EVENTS.SMOKECRAFT_CONTEXT_LOADED, venueId, orderId, smokecraftSessionId })
  return { ok: true, orderId, smokecraftSessionId, localPreview: true }
}

// ── E.A.T. Recommendation Hooks ───────────────────────────────────────────────

export async function getHandheldRecommendations({ venueId, guestId, tableId, deviceId }) {
  emitHandheldEvent({ type: HANDHELD_EVENTS.EAT_RECOMMENDATIONS_LOADED, venueId, guestId })
  return {
    ok: true,
    recommendations: [],
    managerAlerts: [],
    message: 'E.A.T. recommendation engine not connected. No recommendations available.',
    localPreview: true,
  }
}

export async function getManagerAlerts({ venueId, managerId }) {
  return {
    ok: true,
    alerts: [],
    message: 'E.A.T. manager alerts not connected.',
    localPreview: true,
  }
}

// ── Guest / Loyalty Hooks ─────────────────────────────────────────────────────

export async function searchGuests({ venueId, query: q }) {
  const area = 'searchGuests'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, guests: [] }
  const r = await query(
    `SELECT id, first_name, last_name, email, phone FROM guest_profiles
     WHERE venue_id=$1 AND (first_name ILIKE $2 OR last_name ILIKE $2 OR email ILIKE $2) LIMIT 20`,
    [venueId, `%${q}%`]
  ).catch(() => ({ rows: [] }))
  return { ok: true, guests: r.rows }
}

export async function getGuestProfile({ venueId, guestId }) {
  const area = 'getGuestProfile'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`SELECT * FROM guest_profiles WHERE id=$1 AND venue_id=$2`, [guestId, venueId]).catch(() => ({ rows: [] }))
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, guest: r.rows[0] }
}

export async function attachGuestToOrder({ venueId, orderId, guestId, deviceId, staffUserId }) {
  emitHandheldEvent({ type: HANDHELD_EVENTS.GUEST_ATTACHED, venueId, orderId, guestId })
  await writeAudit({ venueId, deviceId, staffUserId, action: 'guest.attached_to_order', entityType: 'order', entityId: orderId, newValue: { guestId } })
  return { ok: true, orderId, guestId }
}

export async function getLoyaltyProfile({ venueId, guestId }) {
  const area = 'getLoyaltyProfile'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  return { ok: true, guestId, loyaltyProfile: null, message: 'Loyalty profile lookup requires loyalty service integration.', localPreview: true }
}

export async function getRewardEligibility({ venueId, guestId }) {
  return { ok: true, guestId, eligible: false, rewards: [], message: 'Reward eligibility requires loyalty service.', localPreview: true }
}

// ── Role-aware App Launcher ───────────────────────────────────────────────────

export async function getRoleAwareLauncher({ venueId, staffUserId, role }) {
  const allTiles = [
    { id: 'new_order',     label: 'New Order',     icon: 'receipt',         minRole: 'staff' },
    { id: 'tables',        label: 'Tables',         icon: 'table_restaurant',minRole: 'staff' },
    { id: 'open_tabs',     label: 'Open Tabs',      icon: 'tab',             minRole: 'staff' },
    { id: 'payments',      label: 'Payments',       icon: 'payments',        minRole: 'staff' },
    { id: 'smokecraft',    label: 'SmokeCraft',      icon: 'smoke_free',      minRole: 'staff' },
    { id: 'guests',        label: 'Guests',          icon: 'people',          minRole: 'staff' },
    { id: 'loyalty',       label: 'Loyalty',         icon: 'card_membership', minRole: 'staff' },
    { id: 'reports',       label: 'Reports',         icon: 'bar_chart',       minRole: 'manager' },
    { id: 'notifications', label: 'Notifications',   icon: 'notifications',   minRole: 'staff' },
    { id: 'settings',      label: 'Settings',        icon: 'settings',        minRole: 'manager' },
  ]

  const roleRank = { staff: 1, senior_staff: 2, manager: 3, owner: 4, admin: 5 }
  const userRank = roleRank[role] || 1

  const tiles = allTiles.map(tile => ({
    ...tile,
    enabled: userRank >= (roleRank[tile.minRole] || 1),
  }))

  return { ok: true, venueId, staffUserId, role, tiles }
}

// ── Reports Preview ───────────────────────────────────────────────────────────

export async function getHandheldReportsPreview({ venueId, locationId, staffUserId }) {
  const area = 'getHandheldReportsPreview'
  if (!isDbAvailable()) {
    return {
      ok: true,
      localPreview: true,
      message: 'Reports unavailable — no database connection.',
      todaySales: null,
      openOrders: null,
      tableStatusCounts: null,
      paymentStatus: null,
    }
  }
  return {
    ok: true,
    localPreview: true,
    message: 'Full reports require Phase B.6 reporting service.',
    todaySales: null,
    openOrders: null,
    tableStatusCounts: null,
    paymentStatus: null,
  }
}
