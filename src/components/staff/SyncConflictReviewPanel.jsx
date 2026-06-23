/**
 * Sync Conflict + Reconciliation Review Panel — Phase 6E, staff-only.
 * Surfaces failed/blocked/duplicate-risk/manual-review local outbox events
 * with enough business context for staff to safely decide what to do.
 * Renders staff-facing language only ("Pending locally", "Replay blocked",
 * "Needs staff review", etc.) — never claims "Synced"/"Completed"/
 * "Recovered"/"Resolved" unless the underlying state actually supports it.
 */
import { useState } from 'react'
import { Card, Pill, Btn, GOLD } from '../eat/ui.jsx'
import {
  getReconciliationQueue, getReconciliationSummary, markManualReviewRequired, markReconciliationNote,
  getBackendReconciliationSummary, submitReconciliationNoteToBackend, resolveReconciliationWithBackend,
} from '../../services/syncReconciliationService.js'
import { previewReplay, replayFailedEvents, previewServerReplay, requestServerReplay } from '../../services/syncEventReplayService.js'
import { clearResolvedConflicts, classifyConflictWithBackend, submitConflictDecisionToBackend } from '../../services/syncConflictResolutionService.js'

function reconciliationTone(status) {
  if (status === 'resolved_confirmed') return 'open'
  if (status === 'blocked_backend_unavailable' || status === 'blocked_duplicate_risk') return 'critical'
  if (status === 'manual_review_required' || status === 'reopened') return 'warning'
  if (status === 'retry_safe') return 'pending'
  return 'info'
}

function reconciliationLabel(status) {
  const labels = {
    pending_review: 'Needs Staff Review',
    retry_safe: 'Retry Safe',
    blocked_backend_unavailable: 'Backend Unavailable',
    blocked_duplicate_risk: 'Duplicate Risk',
    manual_review_required: 'Needs Staff Review',
    resolved_confirmed: 'Confirmed by Backend',
    reopened: 'Reopened',
    ignored_safe_duplicate: 'Safe Duplicate Ignored',
  }
  return labels[status] || 'Pending Locally'
}

export default function SyncConflictReviewPanel() {
  const [queue, setQueue] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastAction, setLastAction] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [noteDrafts, setNoteDrafts] = useState({})
  const [backendChecks, setBackendChecks] = useState({})
  const [backendSummary, setBackendSummary] = useState(null)

  async function refresh() {
    setLoading(true)
    try {
      const [q, s, bs] = await Promise.all([getReconciliationQueue(), getReconciliationSummary(), getBackendReconciliationSummary()])
      setQueue(q)
      setSummary(s)
      setBackendSummary(bs)
    } finally {
      setLoading(false)
    }
  }

  async function runPreview() {
    setLoading(true)
    try {
      const result = await previewReplay()
      const willReplay = result.preview.filter((p) => p.willReplay).length
      setLastAction(result.backendReachable
        ? `Preview: ${willReplay} of ${result.total} events would replay safely.`
        : `Preview: backend unavailable — 0 of ${result.total} events would replay.`)
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  async function runRetrySafe() {
    setLoading(true)
    try {
      const result = await replayFailedEvents()
      const replayed = result.results.filter((r) => r.status === 'replayed').length
      const blocked = result.results.filter((r) => r.status === 'blocked' || r.status === 'backend_unavailable').length
      const manual = result.results.filter((r) => r.status === 'requires_manual_review').length
      setLastAction(`Retry: ${replayed} confirmed by backend, ${blocked} blocked, ${manual} need staff review (of ${result.attempted} attempted).`)
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkManualReview(eventId) {
    await markManualReviewRequired(eventId, 'Marked for review by staff from Conflict Review panel.')
    setLastAction(`Event ${eventId} marked for staff review.`)
    await refresh()
  }

  async function handleAddNote(eventId) {
    const note = noteDrafts[eventId]
    if (!note) return
    await markReconciliationNote(eventId, note)
    setLastAction(`Note added to event ${eventId}.`)
    setNoteDrafts((d) => ({ ...d, [eventId]: '' }))
    await refresh()
  }

  async function handleClearResolved() {
    setLoading(true)
    try {
      const result = await clearResolvedConflicts()
      setLastAction(`Cleared ${result.cleared} resolved conflict decisions from this session's log.`)
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handlePreviewServerReplay(item) {
    const result = await previewServerReplay(item)
    setBackendChecks((c) => ({ ...c, [item.eventId]: { ...c[item.eventId], preview: result } }))
    setLastAction(result.backendReachable
      ? `Server preview for ${item.eventId}: ${result.willReplay ? 'would replay safely' : `blocked (${result.decision})`}.`
      : `Server preview for ${item.eventId}: backend unavailable.`)
  }

  async function handleRequestServerReplay(item) {
    const result = await requestServerReplay(item)
    setBackendChecks((c) => ({ ...c, [item.eventId]: { ...c[item.eventId], replay: result } }))
    setLastAction(`Server replay for ${item.eventId}: ${result.status}${result.confirmationId ? ` (confirmation ${result.confirmationId})` : ''}.`)
    await refresh()
  }

  async function handleSubmitConflictDecision(item) {
    const conflict = await classifyConflictWithBackend(item)
    const record = await submitConflictDecisionToBackend(conflict, item)
    setBackendChecks((c) => ({ ...c, [item.eventId]: { ...c[item.eventId], decision: record } }))
    setLastAction(record?.success
      ? `Server decision recorded for ${item.eventId}: ${conflict.conflictType}.`
      : `Could not record server decision for ${item.eventId} — backend unavailable.`)
  }

  async function handleSubmitNoteToBackend(eventId) {
    const note = noteDrafts[eventId]
    if (!note) return
    const result = await submitReconciliationNoteToBackend(eventId, note)
    setLastAction(result.backendConfirmed
      ? `Note confirmed by backend for ${eventId}.`
      : `Note saved locally only — backend unavailable for ${eventId}.`)
    setNoteDrafts((d) => ({ ...d, [eventId]: '' }))
    await refresh()
  }

  async function handleResolveWithReason(item) {
    const reason = noteDrafts[item.eventId]
    if (!reason) {
      setLastAction('Enter a reason in the note field before resolving.')
      return
    }
    const result = await resolveReconciliationWithBackend(item.eventId, { staffReason: reason })
    setLastAction(result.backendConfirmed
      ? `Confirmed by backend: ${item.eventId} resolved.`
      : `Resolution not confirmed — ${result.message}`)
    await refresh()
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>Conflict & Reconciliation Review — Staff Only</div>
        {summary && (
          <Pill
            label={summary.backendReachable ? 'Backend Reachable' : 'Backend Unavailable'}
            tone={summary.backendReachable ? 'open' : 'critical'}
          />
        )}
      </div>

      {backendSummary?.backendReachable && (
        <div style={{ fontSize: 12, color: '#aab3bf', marginBottom: 12 }}>
          Server reconciliation: {backendSummary.degraded
            ? 'Backend Unavailable (no database connection)'
            : `${backendSummary.manualReviewCount ?? 0} need staff review server-side, ${Object.values(backendSummary.byConflictType || {}).reduce((a, b) => a + b, 0)} server conflicts on record.`}
        </div>
      )}

      {!summary && (
        <div style={{ color: '#8b95a3', marginBottom: 12 }}>
          No reconciliation data loaded yet — click "Refresh Conflicts" to check for failed or blocked events.
        </div>
      )}

      {summary && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: '#aab3bf' }}>
          <span>Failed locally: <b style={{ color: summary.failedCount ? '#f0907f' : '#cdd5df' }}>{summary.failedCount}</b></span>
          <span>Needs staff review: <b style={{ color: summary.manualReviewCount ? GOLD : '#cdd5df' }}>{summary.manualReviewCount}</b></span>
        </div>
      )}

      {lastAction && <div style={{ fontSize: 12, color: GOLD, marginBottom: 12 }}>{lastAction}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Btn tone="blue" onClick={refresh} disabled={loading}>Refresh Conflicts</Btn>
        <Btn tone="purple" onClick={runPreview} disabled={loading}>Preview Replay</Btn>
        <Btn tone="green" onClick={runRetrySafe} disabled={loading}>Retry Safe Events</Btn>
        <Btn tone="gray" onClick={handleClearResolved} disabled={loading}>Clear Resolved Conflicts</Btn>
      </div>

      {queue.length === 0 && summary && (
        <div style={{ color: '#8b95a3' }}>No failed, blocked, or manual-review events right now.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {queue.map((item) => (
          <div key={item.eventId} style={{
            border: '1px solid rgba(212,168,67,0.18)', borderRadius: 12, padding: 12, background: '#1d2530',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{item.eventType}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#8b95a3' }}>{item.entityType}{item.entityId ? ` · ${item.entityId}` : ''}</span>
              </div>
              <Pill label={reconciliationLabel(item.reconciliationStatus)} tone={reconciliationTone(item.reconciliationStatus)} />
            </div>

            <div style={{ fontSize: 12, color: '#aab3bf', marginTop: 6 }}>
              {item.orderId && <span>Order: {item.orderId} · </span>}
              {item.ticketId && <span>Ticket: {item.ticketId} · </span>}
              {item.tableId && <span>Table: {item.tableId} · </span>}
              {item.station && <span>Station: {item.station} · </span>}
              {item.staffId && <span>Staff: {item.staffId} · </span>}
              {item.guestOrUserId && <span>Guest: {item.guestOrUserId}</span>}
            </div>

            <div style={{ fontSize: 12, color: '#cdd5df', marginTop: 6 }}>{item.suggestedAction}</div>
            {item.errorMessage && (
              <div style={{ fontSize: 12, color: '#f0907f', marginTop: 4 }}>Reason: {item.errorMessage}</div>
            )}
            <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 4 }}>
              Retry attempts: {item.retryCount}
              {item.lastAttemptAt ? ` · Last attempt: ${new Date(item.lastAttemptAt).toLocaleString()}` : ''}
            </div>

            {backendChecks[item.eventId] && (
              <div style={{ fontSize: 11, color: '#aab3bf', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {backendChecks[item.eventId].preview && (
                  <span>Backend match found: {backendChecks[item.eventId].preview.backendReachable
                    ? (backendChecks[item.eventId].preview.willReplay ? 'Retry Safe' : 'Duplicate Risk')
                    : 'Backend Unavailable'}
                    {' · '}Backend replay status: {backendChecks[item.eventId].preview.decision || 'n/a'}</span>
                )}
                {backendChecks[item.eventId].replay && (
                  <span>Backend confirmation ID: {backendChecks[item.eventId].replay.confirmationId || 'none'}
                    {' · '}Server decision: {backendChecks[item.eventId].replay.status}</span>
                )}
                {backendChecks[item.eventId].decision && (
                  <span>Decision source: {backendChecks[item.eventId].decision.success ? 'Confirmed by Backend' : 'Backend Unavailable'}</span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <Btn tone="orange" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => handleMarkManualReview(item.eventId)}>Mark Manual Review</Btn>
              <Btn tone="purple" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => handlePreviewServerReplay(item)}>Preview Server Replay</Btn>
              <Btn tone="green" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => handleRequestServerReplay(item)}>Request Server Replay</Btn>
              <Btn tone="blue" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => handleSubmitConflictDecision(item)}>Submit Conflict Decision</Btn>
              <input
                value={noteDrafts[item.eventId] || ''}
                onChange={(e) => setNoteDrafts((d) => ({ ...d, [item.eventId]: e.target.value }))}
                placeholder="Reconciliation note / resolution reason..."
                style={{ flex: 1, minWidth: 160, background: '#161d26', border: '1px solid rgba(212,168,67,0.18)', borderRadius: 8, color: '#e8eef5', padding: '6px 10px', fontSize: 12 }}
              />
              <Btn tone="gray" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => handleAddNote(item.eventId)}>Add Note</Btn>
              <Btn tone="gray" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => handleSubmitNoteToBackend(item.eventId)}>Submit Reconciliation Note</Btn>
              <Btn tone="orange" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => handleResolveWithReason(item)}>Resolve With Reason</Btn>
              <button
                onClick={() => setExpandedId(expandedId === item.eventId ? null : item.eventId)}
                style={{ background: 'transparent', border: 'none', color: GOLD, fontSize: 11, cursor: 'pointer' }}
              >
                {expandedId === item.eventId ? 'Hide technical details' : 'Show technical details'}
              </button>
            </div>

            {expandedId === item.eventId && (
              <pre style={{ marginTop: 8, fontSize: 11, color: '#8b95a3', background: '#0f1419', padding: 10, borderRadius: 8, overflowX: 'auto' }}>
                {JSON.stringify(item, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
