/**
 * Venue Test Export Service — Phase 12
 * Builds JSON and CSV export payloads for a venue test.
 * Never exports: auth credentials, secrets, founder controls.
 */

import { listSessions, listNotes, listIssues, buildSummary } from './venueTestService.js'

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvRow(fields) {
  return fields.map(f => {
    const s = String(f ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }).join(',')
}

function buildCsv(headers, rows) {
  return [csvRow(headers), ...rows.map(r => csvRow(r))].join('\n')
}

// ── Exports ───────────────────────────────────────────────────────────────────

export async function exportJson(venueTestId) {
  const [summary, sessions, notes, issues] = await Promise.all([
    buildSummary(venueTestId),
    listSessions(venueTestId),
    listNotes(venueTestId),
    listIssues(venueTestId),
  ])

  return {
    exportedAt:  new Date().toISOString(),
    venueTestId,
    summary,
    sessions: sessions.map(s => ({
      id:                s.id,
      participantLabel:  s.participant_label,
      participantType:   s.participant_type,
      startTime:         s.start_time,
      endTime:           s.end_time,
      completionStatus:  s.completion_status,
    })),
    observerNotes: notes.map(n => ({
      id:         n.id,
      screenName: n.screen_name,
      eventType:  n.event_type,
      note:       n.note,
      severity:   n.severity,
      createdBy:  n.created_by,
      createdAt:  n.created_at,
    })),
    issues: issues.map(i => ({
      id:          i.id,
      issueType:   i.issue_type,
      screenName:  i.screen_name,
      description: i.description,
      severity:    i.severity,
      status:      i.status,
      createdAt:   i.created_at,
    })),
  }
}

export async function exportSessionsCsv(venueTestId) {
  const rows = await listSessions(venueTestId)
  const headers = ['id','participant_label','participant_type','start_time','end_time','completion_status']
  return buildCsv(headers, rows.map(r => [
    r.id, r.participant_label, r.participant_type,
    r.start_time, r.end_time ?? '', r.completion_status,
  ]))
}

export async function exportNotesCsv(venueTestId) {
  const rows = await listNotes(venueTestId)
  const headers = ['id','screen_name','event_type','note','severity','created_by','created_at']
  return buildCsv(headers, rows.map(r => [
    r.id, r.screen_name, r.event_type, r.note,
    r.severity, r.created_by, r.created_at,
  ]))
}

export async function exportIssuesCsv(venueTestId) {
  const rows = await listIssues(venueTestId)
  const headers = ['id','issue_type','screen_name','description','severity','status','created_by','created_at']
  return buildCsv(headers, rows.map(r => [
    r.id, r.issue_type, r.screen_name, r.description,
    r.severity, r.status, r.created_by, r.created_at,
  ]))
}

export async function exportSummaryCsv(venueTestId) {
  const s = await buildSummary(venueTestId)
  if (!s) return 'field,value\nerror,test not found'
  const rows = [
    ['venue_test_id',              s.venueTestId],
    ['venue_name',                 s.venueName],
    ['test_type',                  s.testType],
    ['test_date',                  s.testDate],
    ['status',                     s.status],
    ['total_sessions',             s.totalSessions],
    ['completed_journeys',         s.completedGuestJourneys],
    ['avg_completion_min',         s.averageCompletionTimeMin],
    ['observer_notes_count',       s.observerNotesCount],
    ['total_issues',               s.totalIssues],
    ['issues_blocker',             s.issueCountsBySeverity?.blocker ?? 0],
    ['issues_high',                s.issueCountsBySeverity?.high    ?? 0],
    ['issues_medium',              s.issueCountsBySeverity?.medium  ?? 0],
    ['issues_low',                 s.issueCountsBySeverity?.low     ?? 0],
    ['readiness_score',            s.readinessScore],
    ['recommendation',             s.recommendation],
  ]
  return buildCsv(['field', 'value'], rows)
}

export async function exportFullCsv(venueTestId) {
  const [sessions, notes, issues, summary] = await Promise.all([
    exportSessionsCsv(venueTestId),
    exportNotesCsv(venueTestId),
    exportIssuesCsv(venueTestId),
    exportSummaryCsv(venueTestId),
  ])
  return { sessions, notes, issues, summary }
}
