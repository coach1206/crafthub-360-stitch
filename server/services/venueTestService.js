/**
 * Venue Test Service — Phase 12
 * Manages venue tests, sessions, observer notes, and issues.
 * Prototype fallback: in-memory store when DB is unavailable.
 */

import { query, isDbAvailable } from '../db/connection.js'
import { DEFAULT_TEST_CONFIG }  from '../config/testModeConfig.js'

// ── Prototype (in-memory) store ───────────────────────────────────────────────
const proto = {
  tests:    [],
  sessions: [],
  notes:    [],
  issues:   [],
  exports:  [],
}

let _protoIdSeq = 1
const protoId = () => `proto_${_protoIdSeq++}`
const protoVtId = () => `vt_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
const now = () => new Date().toISOString()

// ── Venue Tests ───────────────────────────────────────────────────────────────

export async function getActiveTest() {
  if (!isDbAvailable()) {
    return proto.tests.find(t => t.status === 'active') || null
  }
  const { rows } = await query(
    `SELECT * FROM venue_tests WHERE status = 'active' ORDER BY created_at DESC LIMIT 1`
  )
  return rows[0] || null
}

export async function getTestById(venueTestId) {
  if (!isDbAvailable()) {
    return proto.tests.find(t => t.venue_test_id === venueTestId) || null
  }
  const { rows } = await query(
    `SELECT * FROM venue_tests WHERE venue_test_id = $1`,
    [venueTestId]
  )
  return rows[0] || null
}

export async function startTest({ venueName, testType, createdBy }) {
  const testDate = new Date().toISOString().slice(0, 10)

  if (!isDbAvailable()) {
    const t = {
      id:            protoId(),
      venue_test_id: protoVtId(),
      venue_name:    venueName || 'Prototype Venue',
      test_type:     testType  || DEFAULT_TEST_CONFIG.testType,
      test_date:     testDate,
      status:        'active',
      created_by:    createdBy || 'system',
      created_at:    now(),
      updated_at:    now(),
    }
    proto.tests.push(t)
    return t
  }
  const { rows } = await query(
    `INSERT INTO venue_tests (venue_name, test_type, test_date, status, created_by)
     VALUES ($1,$2,$3,'active',$4) RETURNING *`,
    [venueName || 'Venue', testType || 'venue_walkthrough', testDate, createdBy || 'system']
  )
  return rows[0]
}

export async function endTest(venueTestId) {
  if (!isDbAvailable()) {
    const t = proto.tests.find(t => t.venue_test_id === venueTestId)
    if (t) { t.status = 'completed'; t.updated_at = now() }
    return t || null
  }
  const { rows } = await query(
    `UPDATE venue_tests SET status='completed', updated_at=NOW()
     WHERE venue_test_id=$1 RETURNING *`,
    [venueTestId]
  )
  return rows[0] || null
}

export async function listTests(limit = 20) {
  if (!isDbAvailable()) {
    return [...proto.tests].sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0, limit)
  }
  const { rows } = await query(
    `SELECT * FROM venue_tests ORDER BY created_at DESC LIMIT $1`, [limit]
  )
  return rows
}

// ── Test Sessions ─────────────────────────────────────────────────────────────

export async function startSession({ venueTestId, participantLabel, participantType, guestSessionId }) {
  if (!isDbAvailable()) {
    const s = {
      id:                protoId(),
      venue_test_id:     venueTestId,
      guest_session_id:  guestSessionId || null,
      participant_label: participantLabel || 'Participant',
      participant_type:  participantType  || 'guest',
      start_time:        now(),
      end_time:          null,
      completion_status: 'in_progress',
      notes:             {},
      created_at:        now(),
    }
    proto.sessions.push(s)
    return s
  }
  const { rows } = await query(
    `INSERT INTO venue_test_sessions
       (venue_test_id, guest_session_id, participant_label, participant_type)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [venueTestId, guestSessionId || null, participantLabel || 'Participant', participantType || 'guest']
  )
  return rows[0]
}

export async function endSession(sessionId, { completionStatus = 'completed', notes = {} } = {}) {
  if (!isDbAvailable()) {
    const s = proto.sessions.find(s => String(s.id) === String(sessionId))
    if (s) { s.end_time = now(); s.completion_status = completionStatus; s.notes = notes }
    return s || null
  }
  const { rows } = await query(
    `UPDATE venue_test_sessions
     SET end_time=NOW(), completion_status=$2, notes=$3
     WHERE id=$1 RETURNING *`,
    [sessionId, completionStatus, JSON.stringify(notes)]
  )
  return rows[0] || null
}

export async function listSessions(venueTestId) {
  if (!isDbAvailable()) {
    return proto.sessions.filter(s => s.venue_test_id === venueTestId)
  }
  const { rows } = await query(
    `SELECT * FROM venue_test_sessions WHERE venue_test_id=$1 ORDER BY start_time DESC`,
    [venueTestId]
  )
  return rows
}

// ── Observer Notes ────────────────────────────────────────────────────────────

export async function addObserverNote({ venueTestId, guestSessionId, screenName, eventType, note, severity, createdBy }) {
  if (!isDbAvailable()) {
    const n = {
      id:               protoId(),
      venue_test_id:    venueTestId,
      guest_session_id: guestSessionId || null,
      screen_name:      screenName   || 'unknown',
      event_type:       eventType    || 'observation',
      note:             note         || '',
      severity:         severity     || 'low',
      created_by:       createdBy    || 'observer',
      created_at:       now(),
    }
    proto.notes.push(n)
    return n
  }
  const { rows } = await query(
    `INSERT INTO observer_notes
       (venue_test_id, guest_session_id, screen_name, event_type, note, severity, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [venueTestId, guestSessionId || null, screenName || 'unknown', eventType || 'observation', note || '', severity || 'low', createdBy || 'observer']
  )
  return rows[0]
}

export async function listNotes(venueTestId) {
  if (!isDbAvailable()) {
    return proto.notes.filter(n => n.venue_test_id === venueTestId)
  }
  const { rows } = await query(
    `SELECT * FROM observer_notes WHERE venue_test_id=$1 ORDER BY created_at DESC`,
    [venueTestId]
  )
  return rows
}

// ── Issues ────────────────────────────────────────────────────────────────────

export async function logIssue({ venueTestId, guestSessionId, issueType, screenName, description, severity, createdBy }) {
  if (!isDbAvailable()) {
    const i = {
      id:               protoId(),
      venue_test_id:    venueTestId,
      guest_session_id: guestSessionId || null,
      issue_type:       issueType    || 'other',
      screen_name:      screenName   || 'unknown',
      description:      description  || '',
      severity:         severity     || 'medium',
      status:           'open',
      created_by:       createdBy    || 'observer',
      created_at:       now(),
      updated_at:       now(),
    }
    proto.issues.push(i)
    return i
  }
  const { rows } = await query(
    `INSERT INTO venue_test_issues
       (venue_test_id, guest_session_id, issue_type, screen_name, description, severity, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [venueTestId, guestSessionId || null, issueType || 'other', screenName || 'unknown', description || '', severity || 'medium', createdBy || 'observer']
  )
  return rows[0]
}

export async function listIssues(venueTestId) {
  if (!isDbAvailable()) {
    return proto.issues.filter(i => i.venue_test_id === venueTestId)
  }
  const { rows } = await query(
    `SELECT * FROM venue_test_issues WHERE venue_test_id=$1 ORDER BY created_at DESC`,
    [venueTestId]
  )
  return rows
}

// ── Summary / Readiness Score ─────────────────────────────────────────────────

const SEVERITY_WEIGHTS = { blocker: 20, high: 10, medium: 5, low: 1 }

export async function buildSummary(venueTestId) {
  const test     = await getTestById(venueTestId)
  const sessions = await listSessions(venueTestId)
  const notes    = await listNotes(venueTestId)
  const issues   = await listIssues(venueTestId)

  if (!test) return null

  const completed = sessions.filter(s => s.completion_status === 'completed').length
  const total     = sessions.length

  const durations = sessions
    .filter(s => s.end_time)
    .map(s => new Date(s.end_time) - new Date(s.start_time))
  const avgMs  = durations.length ? durations.reduce((a,b)=>a+b,0)/durations.length : 0
  const avgMin = Math.round(avgMs / 60000)

  const issuesBySeverity = {}
  const issuesByType     = {}
  const screenIssues     = {}

  for (const i of issues) {
    issuesBySeverity[i.severity] = (issuesBySeverity[i.severity] || 0) + 1
    issuesByType[i.issue_type]   = (issuesByType[i.issue_type]   || 0) + 1
    screenIssues[i.screen_name]  = (screenIssues[i.screen_name]  || 0) + 1
  }

  const topScreens = Object.entries(screenIssues)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 5)
    .map(([screen, count]) => ({ screen, count }))

  let penalty = 0
  for (const [sev, count] of Object.entries(issuesBySeverity)) {
    penalty += (SEVERITY_WEIGHTS[sev] || 0) * count
  }

  const completionBonus = total > 0 ? Math.round((completed / total) * 20) : 0
  const rawScore = Math.max(0, Math.min(100, 100 - penalty + completionBonus))

  let recommendation = 'Begin testing with at least 3 participants before scoring.'
  if (rawScore >= 90)      recommendation = 'System is performing well. Schedule pilot dates.'
  else if (rawScore >= 75) recommendation = 'Minor issues found. Address before live pilot.'
  else if (rawScore >= 60) recommendation = 'Several issues need resolution before piloting.'
  else                     recommendation = 'Critical issues detected. Do not proceed to live pilot.'

  return {
    venueTestId:             test.venue_test_id,
    venueName:               test.venue_name,
    testType:                test.test_type,
    testDate:                test.test_date,
    status:                  test.status,
    totalSessions:           total,
    completedGuestJourneys:  completed,
    averageCompletionTimeMin: avgMin,
    observerNotesCount:      notes.length,
    issueCountsBySeverity:   issuesBySeverity,
    issueCountsByType:       issuesByType,
    topScreensWithIssues:    topScreens,
    totalIssues:             issues.length,
    readinessScore:          rawScore,
    recommendation,
  }
}

// ── Proto store accessor (used by demoResetService) ───────────────────────────
export { proto }
