/**
 * Demo Session Service — Phase 13
 * Manages demo sessions and events.
 * Prototype fallback when DB unavailable.
 */

import { query, isDbAvailable } from '../db/connection.js'

const proto = { sessions: [], events: [], exports: [] }
let _seq = 1
const pid  = () => `proto_${_seq++}`
const demoId = () => `demo_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
const now  = () => new Date().toISOString()

export async function getActiveDemo() {
  if (!isDbAvailable()) return proto.sessions.find(s => s.status === 'active') || null
  const { rows } = await query(`SELECT * FROM demo_sessions WHERE status='active' ORDER BY created_at DESC LIMIT 1`)
  return rows[0] || null
}

export async function getDemoById(demoId_) {
  if (!isDbAvailable()) return proto.sessions.find(s => s.demo_id === demoId_) || null
  const { rows } = await query(`SELECT * FROM demo_sessions WHERE demo_id=$1`, [demoId_])
  return rows[0] || null
}

export async function startDemo({ demoType, audienceType, venueName, presenterName, createdBy }) {
  if (!isDbAvailable()) {
    const s = { id: pid(), demo_id: demoId(), demo_type: demoType || 'founder_walkthrough', audience_type: audienceType || 'founder_only', venue_name: venueName || '', presenter_name: presenterName || '', status: 'active', started_at: now(), ended_at: null, created_by: createdBy || 'system', created_at: now(), updated_at: now() }
    proto.sessions.push(s); return s
  }
  const { rows } = await query(
    `INSERT INTO demo_sessions (demo_type,audience_type,venue_name,presenter_name,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [demoType || 'founder_walkthrough', audienceType || 'founder_only', venueName || '', presenterName || '', createdBy || 'system']
  )
  return rows[0]
}

export async function endDemo(demoId_) {
  if (!isDbAvailable()) {
    const s = proto.sessions.find(s => s.demo_id === demoId_)
    if (s) { s.status = 'completed'; s.ended_at = now(); s.updated_at = now() }
    return s || null
  }
  const { rows } = await query(
    `UPDATE demo_sessions SET status='completed',ended_at=NOW(),updated_at=NOW() WHERE demo_id=$1 RETURNING *`, [demoId_]
  )
  return rows[0] || null
}

export async function recordEvent({ demoId_, eventType, screenName, moduleName, payload }) {
  if (!isDbAvailable()) {
    const e = { id: pid(), demo_id: demoId_, event_type: eventType || 'screen_view', screen_name: screenName || 'unknown', module_name: moduleName || 'unknown', payload: payload || {}, created_at: now() }
    proto.events.push(e); return e
  }
  const { rows } = await query(
    `INSERT INTO demo_events (demo_id,event_type,screen_name,module_name,payload) VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [demoId_, eventType || 'screen_view', screenName || 'unknown', moduleName || 'unknown', JSON.stringify(payload || {})]
  )
  return rows[0]
}

export async function buildDemoSummary(demoId_) {
  const session = await getDemoById(demoId_)
  if (!session) return null
  let events = []
  if (!isDbAvailable()) {
    events = proto.events.filter(e => e.demo_id === demoId_)
  } else {
    const { rows } = await query(`SELECT * FROM demo_events WHERE demo_id=$1 ORDER BY created_at`, [demoId_])
    events = rows
  }
  const duration = session.ended_at
    ? Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 1000)
    : Math.round((Date.now() - new Date(session.started_at)) / 1000)
  return { session, events, eventCount: events.length, durationSeconds: duration, modulesVisited: [...new Set(events.map(e => e.module_name))].filter(m => m !== 'unknown') }
}

export async function resetDemoSessions(demoId_) {
  if (!isDbAvailable()) {
    if (demoId_) {
      proto.sessions = proto.sessions.filter(s => s.demo_id !== demoId_)
      proto.events   = proto.events.filter(e => e.demo_id !== demoId_)
    } else {
      proto.sessions = []; proto.events = []
    }
    return { cleared: ['proto demo sessions', 'proto demo events'] }
  }
  const cleared = []
  if (demoId_) {
    const r1 = await query(`DELETE FROM demo_events WHERE demo_id=$1`, [demoId_])
    const r2 = await query(`DELETE FROM demo_sessions WHERE demo_id=$1`, [demoId_])
    cleared.push(`demo_events: ${r1.rowCount}`, `demo_sessions: ${r2.rowCount}`)
  } else {
    const r1 = await query(`DELETE FROM demo_events`)
    const r2 = await query(`DELETE FROM demo_sessions`)
    cleared.push(`demo_events: ${r1.rowCount}`, `demo_sessions: ${r2.rowCount}`)
  }
  return { cleared }
}

export { proto as demoProto }
