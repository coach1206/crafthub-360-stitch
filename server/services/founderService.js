/**
 * Founder Service — manages founder-level controls, override log, and emergency lock.
 * Dual-mode: PostgreSQL when available, in-memory fallback.
 * Every action writes a security event.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { recordFounderAction, recordEmergencyLock } from './securityEventService.js'

const memControls   = new Map()
const memOverrideLog = []

function now() { return new Date().toISOString() }

export async function getFounderControls() {
  if (isDbAvailable()) {
    try {
      const result = await query('SELECT * FROM founder_controls ORDER BY control_key ASC')
      return result.rows
    } catch (err) {
      console.warn('[founderService] getFounderControls failed:', err.message)
    }
  }
  if (memControls.size === 0) {
    _seedMemControls()
  }
  return [...memControls.values()]
}

export async function getFounderControl(controlKey) {
  if (isDbAvailable()) {
    try {
      const result = await query('SELECT * FROM founder_controls WHERE control_key=$1', [controlKey])
      return result.rows[0] || null
    } catch (err) {
      console.warn('[founderService] getFounderControl failed:', err.message)
    }
  }
  return memControls.get(controlKey) || null
}

export async function updateFounderControl(controlKey, value, updatedBy) {
  const existing = await getFounderControl(controlKey)
  if (existing?.locked) {
    return { error: 'This control is locked and cannot be modified', locked: true }
  }

  if (isDbAvailable()) {
    try {
      const result = await query(
        `INSERT INTO founder_controls (control_key, control_value, updated_by, updated_at)
         VALUES ($1,$2,$3,NOW())
         ON CONFLICT (control_key) DO UPDATE SET
           control_value=EXCLUDED.control_value,
           updated_by=EXCLUDED.updated_by,
           updated_at=NOW()
         RETURNING *`,
        [controlKey, JSON.stringify(value), updatedBy]
      )
      await recordFounderAction(updatedBy, 'control.updated', controlKey, { value })
      return result.rows[0]
    } catch (err) {
      console.warn('[founderService] updateFounderControl failed:', err.message)
    }
  }

  const record = { control_key: controlKey, control_value: value, locked: false, updated_by: updatedBy, updated_at: now() }
  memControls.set(controlKey, record)
  await recordFounderAction(updatedBy, 'control.updated', controlKey, { value })
  return record
}

export async function triggerEmergencyLock(actorId, reason) {
  const lockState = {
    active:      true,
    activatedAt: new Date().toISOString(),
    activatedBy: actorId,
    reason:      reason || 'Emergency lock activated',
    prototype:   true,   // never actually locks in prototype mode
  }

  await updateFounderControl('emergency_lock', lockState, actorId)
  await recordEmergencyLock(actorId, reason)

  return {
    ...lockState,
    message: 'PROTOTYPE LOCK ACTIVE — System lock recorded but not enforced in development mode',
  }
}

export async function triggerFounderOverride(actorId, targetSessionId, reason) {
  const overrideRecord = {
    overrideId:      `ov_${Date.now().toString(36)}`,
    actorId,
    targetSessionId,
    reason:          reason || 'Founder override',
    triggeredAt:     now(),
    prototype:       true,
  }
  memOverrideLog.push(overrideRecord)
  await recordFounderAction(actorId, 'override.triggered', 'session', { targetSessionId, reason })
  return overrideRecord
}

export async function getOverrideLog(limit = 20) {
  return [...memOverrideLog].reverse().slice(0, limit)
}

// ── Private ───────────────────────────────────────────────────

function _seedMemControls() {
  const defaults = [
    ['revenue_settings',     { tier: 'standard', commissionRate: 0, status: 'locked' },         true],
    ['deployment_controls',  { environment: 'development', deployLock: false, status: 'prototype' }, false],
    ['emergency_lock',       { active: false, activatedAt: null, reason: null, status: 'prototype' }, false],
    ['integration_settings', { pos: 'prototype', crm: 'prototype', analytics: 'prototype' },    false],
    ['license',              { status: 'prototype', venueId: 'novee-grand-lounge', tier: 'development' }, true],
  ]
  for (const [key, value, locked] of defaults) {
    memControls.set(key, { control_key: key, control_value: value, locked, updated_at: now() })
  }
}
