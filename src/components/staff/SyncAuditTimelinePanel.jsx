/**
 * Sync Audit + Lifecycle Timeline Panel — Phase 6G, staff-only.
 * Read-only accountability view over the backend audit log + lifecycle
 * timeline (Phase 6G). Shows who did what, when, from which device, and
 * which business action it affected — without inventing any new write path.
 * Renders staff-facing language only ("Audit recorded", "Backend
 * unavailable", "Replay blocked", etc.) — never claims "Fixed"/"Cleared"/
 * "Recovered"/"Fully resolved" unless the underlying state supports it.
 */
import { useState } from 'react'
import { Card, Pill, Btn, GOLD } from '../eat/ui.jsx'
import {
  getAuditHealth, getAuditDashboardSummary, getEventTimeline, getBusinessActionTimeline,
  getStaffActionLogs, getLatestAuditLogs, formatAuditLogForUI, formatLifecycleStageForUI,
} from '../../services/syncAuditClientService.js'

function stageTone(stageStatus) {
  if (stageStatus === 'confirmed' || stageStatus === 'resolved') return 'open'
  if (stageStatus === 'rejected' || stageStatus === 'would_block') return 'critical'
  if (stageStatus === 'recorded' || stageStatus === 'attempted') return 'pending'
  return 'info'
}

export default function SyncAuditTimelinePanel() {
  const [health, setHealth] = useState(null)
  const [summary, setSummary] = useState(null)
  const [latestLogs, setLatestLogs] = useState([])
  const [eventIdInput, setEventIdInput] = useState('')
  const [fingerprintInput, setFingerprintInput] = useState('')
  const [eventTimeline, setEventTimeline] = useState(null)
  const [businessTimeline, setBusinessTimeline] = useState(null)
  const [actorIdInput, setActorIdInput] = useState('')
  const [actorLogs, setActorLogs] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastAction, setLastAction] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  async function refreshAuditLogs() {
    setLoading(true)
    try {
      const [h, s, logs] = await Promise.all([
        getAuditHealth(),
        getAuditDashboardSummary(),
        getLatestAuditLogs({ limit: 50 }),
      ])
      setHealth(h)
      setSummary(s)
      setLatestLogs(logs.backendReachable ? logs.logs : [])
      setLastAction(h.backendReachable
        ? `Audit logs refreshed — ${logs.backendReachable ? logs.logs.length : 0} recent entries.`
        : 'Backend unavailable — audit logs could not be refreshed.')
    } finally {
      setLoading(false)
    }
  }

  async function loadEventTimeline() {
    if (!eventIdInput) {
      setLastAction('Enter an Event ID before loading a timeline.')
      return
    }
    setLoading(true)
    try {
      const result = await getEventTimeline(eventIdInput)
      setEventTimeline(result)
      setLastAction(result.backendReachable
        ? `Timeline loaded for event ${eventIdInput}.`
        : 'Backend unavailable — event timeline could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  async function loadBusinessActionTimeline() {
    if (!fingerprintInput) {
      setLastAction('Enter a Business Action Fingerprint before loading a timeline.')
      return
    }
    setLoading(true)
    try {
      const result = await getBusinessActionTimeline(fingerprintInput)
      setBusinessTimeline(result)
      setLastAction(result.backendReachable
        ? `Business action timeline loaded for fingerprint ${fingerprintInput}.`
        : 'Backend unavailable — business action timeline could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  async function loadStaffActions() {
    if (!actorIdInput) {
      setLastAction('Enter a Staff/User ID before loading their actions.')
      return
    }
    setLoading(true)
    try {
      const result = await getStaffActionLogs(actorIdInput, { limit: 50 })
      setActorLogs(result)
      setLastAction(result.backendReachable
        ? `Loaded ${result.logs.length} audit entries for ${actorIdInput}.`
        : 'Backend unavailable — staff action logs could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>Audit Logs & Event Lifecycle Timeline — Staff Only</div>
        {health && (
          <Pill
            label={
              health.authRequired ? 'Sign-In Required'
                : health.forbidden ? 'Staff Access Required'
                : health.backendReachable ? (health.degraded ? 'Degraded' : 'Backend Reachable')
                : 'Backend Unavailable'
            }
            tone={
              health.authRequired || health.forbidden ? 'critical'
                : health.backendReachable ? (health.degraded ? 'warning' : 'open')
                : 'critical'
            }
          />
        )}
      </div>

      {!health && (
        <div style={{ color: '#8b95a3', marginBottom: 12 }}>
          No audit data loaded yet — click "Refresh Audit Logs" to check backend health and recent activity.
        </div>
      )}

      {health?.degraded && (
        <div style={{ fontSize: 12, color: '#f0907f', marginBottom: 12 }}>
          {health.message || 'Database unavailable — audit logs are not durably available right now.'}
        </div>
      )}

      {summary?.backendReachable && !summary.degraded && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: '#aab3bf', flexWrap: 'wrap' }}>
          <span>Total audit logs: <b style={{ color: '#cdd5df' }}>{summary.totalAuditLogs ?? 0}</b></span>
          {Object.entries(summary.byActionCategory || {}).map(([cat, count]) => (
            <span key={cat}>{cat}: <b style={{ color: GOLD }}>{count}</b></span>
          ))}
        </div>
      )}

      {lastAction && <div style={{ fontSize: 12, color: GOLD, marginBottom: 12 }}>{lastAction}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Btn tone="blue" onClick={refreshAuditLogs} disabled={loading}>Refresh Audit Logs</Btn>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <input
          value={eventIdInput}
          onChange={(e) => setEventIdInput(e.target.value)}
          placeholder="Event ID..."
          style={{ minWidth: 200, background: '#161d26', border: '1px solid rgba(212,168,67,0.18)', borderRadius: 8, color: '#e8eef5', padding: '7px 10px', fontSize: 12 }}
        />
        <Btn tone="purple" style={{ padding: '7px 12px', fontSize: 12 }} onClick={loadEventTimeline} disabled={loading}>Load Event Timeline</Btn>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <input
          value={fingerprintInput}
          onChange={(e) => setFingerprintInput(e.target.value)}
          placeholder="Business Action Fingerprint..."
          style={{ minWidth: 200, background: '#161d26', border: '1px solid rgba(212,168,67,0.18)', borderRadius: 8, color: '#e8eef5', padding: '7px 10px', fontSize: 12 }}
        />
        <Btn tone="purple" style={{ padding: '7px 12px', fontSize: 12 }} onClick={loadBusinessActionTimeline} disabled={loading}>Load Business Action Timeline</Btn>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input
          value={actorIdInput}
          onChange={(e) => setActorIdInput(e.target.value)}
          placeholder="Staff/User ID..."
          style={{ minWidth: 200, background: '#161d26', border: '1px solid rgba(212,168,67,0.18)', borderRadius: 8, color: '#e8eef5', padding: '7px 10px', fontSize: 12 }}
        />
        <Btn tone="green" style={{ padding: '7px 12px', fontSize: 12 }} onClick={loadStaffActions} disabled={loading}>View Latest Staff Actions</Btn>
      </div>

      {eventTimeline?.backendReachable && (
        <TimelineBlock title={`Event Timeline — ${eventIdInput}`} timeline={eventTimeline.timeline} expandedId={expandedId} setExpandedId={setExpandedId} />
      )}

      {businessTimeline?.backendReachable && (
        <TimelineBlock title={`Business Action Timeline — ${fingerprintInput}`} timeline={businessTimeline.timeline} expandedId={expandedId} setExpandedId={setExpandedId} />
      )}

      {actorLogs?.backendReachable && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#cdd5df', marginBottom: 8 }}>Staff Actions — {actorIdInput}</div>
          <LogList logs={actorLogs.logs.map(formatAuditLogForUI)} expandedId={expandedId} setExpandedId={setExpandedId} />
        </div>
      )}

      {latestLogs.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#cdd5df', marginBottom: 8 }}>Latest Audit Activity</div>
          <LogList logs={latestLogs.map(formatAuditLogForUI)} expandedId={expandedId} setExpandedId={setExpandedId} />
        </div>
      )}
    </Card>
  )
}

function TimelineBlock({ title, timeline, expandedId, setExpandedId }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#cdd5df', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(timeline || []).map((entry, i) => {
          const isLifecycle = entry.kind === 'lifecycle'
          const formatted = isLifecycle ? formatLifecycleStageForUI(entry) : formatAuditLogForUI(entry)
          const id = `${entry.kind}-${formatted?.id || i}`
          return (
            <div key={id} style={{ border: '1px solid rgba(212,168,67,0.18)', borderRadius: 10, padding: 10, background: '#1d2530' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{formatted?.label}</span>
                <Pill label={isLifecycle ? (formatted?.status || 'recorded') : (entry.actionCategory || 'audit')} tone={isLifecycle ? stageTone(formatted?.status) : 'info'} />
              </div>
              <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 4 }}>
                {formatted?.actor ? `Actor: ${formatted.actor} · ` : ''}
                {formatted?.deviceId ? `Device: ${formatted.deviceId} · ` : ''}
                {new Date(formatted?.createdAt).toLocaleString()}
              </div>
              {formatted?.reason && <div style={{ fontSize: 11, color: '#aab3bf', marginTop: 4 }}>Reason: {formatted.reason}</div>}
              <button
                onClick={() => setExpandedId(expandedId === id ? null : id)}
                style={{ background: 'transparent', border: 'none', color: GOLD, fontSize: 11, cursor: 'pointer', marginTop: 6, padding: 0 }}
              >
                {expandedId === id ? 'Hide technical details' : 'Show technical details'}
              </button>
              {expandedId === id && (
                <pre style={{ marginTop: 6, fontSize: 11, color: '#8b95a3', background: '#0f1419', padding: 8, borderRadius: 8, overflowX: 'auto' }}>
                  {JSON.stringify(entry, null, 2)}
                </pre>
              )}
            </div>
          )
        })}
        {(!timeline || timeline.length === 0) && (
          <div style={{ color: '#8b95a3', fontSize: 12 }}>No timeline entries found.</div>
        )}
      </div>
    </div>
  )
}

function LogList({ logs, expandedId, setExpandedId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {logs.map((log, i) => {
        const id = `log-${log?.id || i}`
        return (
          <div key={id} style={{ border: '1px solid rgba(212,168,67,0.18)', borderRadius: 10, padding: 10, background: '#1d2530' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{log?.label}</span>
              <Pill label={log?.category || 'system'} tone="info" />
            </div>
            <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 4 }}>
              Actor: {log?.actor} {log?.deviceId ? `· Device: ${log.deviceId}` : ''} · {new Date(log?.createdAt).toLocaleString()}
            </div>
            {log?.reason && <div style={{ fontSize: 11, color: '#aab3bf', marginTop: 4 }}>Reason: {log.reason}</div>}
            <button
              onClick={() => setExpandedId(expandedId === id ? null : id)}
              style={{ background: 'transparent', border: 'none', color: GOLD, fontSize: 11, cursor: 'pointer', marginTop: 6, padding: 0 }}
            >
              {expandedId === id ? 'Hide technical details' : 'Show technical details'}
            </button>
            {expandedId === id && (
              <pre style={{ marginTop: 6, fontSize: 11, color: '#8b95a3', background: '#0f1419', padding: 8, borderRadius: 8, overflowX: 'auto' }}>
                {JSON.stringify(log?.raw, null, 2)}
              </pre>
            )}
          </div>
        )
      })}
      {logs.length === 0 && <div style={{ color: '#8b95a3', fontSize: 12 }}>No audit entries found.</div>}
    </div>
  )
}
