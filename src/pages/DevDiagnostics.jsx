/**
 * Developer Diagnostics — T015
 * Read-only system diagnostics for Developer role.
 * Shows API health, system metrics, and recent error log entries.
 *
 * SECURITY: No guest PII, no credentials, no payment data.
 * Requires: developer role + active dev grant (or founder_level_0)
 */

import { useState, useEffect, useCallback } from 'react'
import { useSecurity } from '../context/SecurityContext.jsx'

const GOLD   = '#C9A84C'
const DARK   = '#060402'
const CARD   = 'rgba(14,9,3,0.98)'
const BORDER = 'rgba(201,168,76,0.16)'
const DIM    = 'rgba(201,168,76,0.45)'
const GREEN  = '#4caf50'
const RED    = '#cc3333'
const API    = '/api/developer'

function mono(v) {
  return (
    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 'inherit' }}>{v}</span>
  )
}

function StatusDot({ ok }) {
  return (
    <span style={{
      display:      'inline-block',
      width:        8, height: 8,
      borderRadius: '50%',
      background:   ok ? GREEN : RED,
      boxShadow:    ok ? `0 0 6px ${GREEN}88` : `0 0 6px ${RED}88`,
      flexShrink:   0,
    }} />
  )
}

function SectionTitle({ icon, label, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 15, color: GOLD }}>{icon}</span>
      <span style={{ color: DIM, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', flex: 1 }}>
        {label}
      </span>
      {action}
    </div>
  )
}

function MetricRow({ label, value, note }) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'baseline',
      gap:          12,
      padding:      '8px 0',
      borderBottom: '1px solid rgba(201,168,76,0.06)',
    }}>
      <span style={{ color: 'rgba(201,168,76,0.35)', fontSize: 10, letterSpacing: '0.1em', width: 140, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ color: GOLD, fontSize: 12, fontFamily: '"JetBrains Mono", monospace', flex: 1 }}>
        {value ?? '—'}
      </span>
      {note && (
        <span style={{ color: 'rgba(201,168,76,0.2)', fontSize: 9, letterSpacing: '0.1em' }}>
          {note}
        </span>
      )}
    </div>
  )
}

function RouteRow({ route, status }) {
  const ok = status === 'operational'
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          10,
      padding:      '7px 0',
      borderBottom: '1px solid rgba(201,168,76,0.05)',
    }}>
      <StatusDot ok={ok} />
      <span style={{ color: 'rgba(201,168,76,0.6)', fontSize: 11, fontFamily: '"JetBrains Mono", monospace', flex: 1 }}>
        {route}
      </span>
      <span style={{ color: ok ? GREEN + 'cc' : RED + 'cc', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        {status}
      </span>
    </div>
  )
}

export default function DevDiagnostics() {
  const { user } = useSecurity()
  const [health,    setHealth]    = useState(null)
  const [metrics,   setMetrics]   = useState(null)
  const [errors,    setErrors]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [refreshAt, setRefreshAt] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [hRes, mRes, eRes] = await Promise.allSettled([
        fetch(`${API}/health`,   { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/metrics`,  { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/errors`,   { credentials: 'include' }).then(r => r.json()),
      ])
      if (hRes.status === 'fulfilled') setHealth(hRes.value?.data || null)
      if (mRes.status === 'fulfilled') setMetrics(mRes.value?.data || null)
      if (eRes.status === 'fulfilled') setErrors(eRes.value?.data?.errors || [])
      setRefreshAt(new Date())
    } catch {
      /* Silently handled — partial data still shown */
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const dbOk      = health?.database === 'connected'
  const sysStatus = health?.status

  function fmt(bytes) {
    if (!bytes && bytes !== 0) return '—'
    if (bytes >= 1024 ** 3) return `${(bytes / 1024**3).toFixed(1)} GB`
    if (bytes >= 1024 ** 2) return `${(bytes / 1024**2).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  function fmtUptime(secs) {
    if (!secs && secs !== 0) return '—'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    return `${h}h ${m}m ${s}s`
  }

  return (
    <div style={{
      minHeight:  '100vh',
      background: DARK,
      padding:    'clamp(1.5rem, 4vw, 2.5rem)',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: DIM, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '0.4rem' }}>
            NOVEE OS — DEVELOPER DIAGNOSTICS
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                color: GOLD, fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: 400, letterSpacing: '0.1em',
                margin: '0 0 0.25rem', textTransform: 'uppercase',
              }}>
                System Diagnostics
              </h1>
              <div style={{ color: '#3a3020', fontSize: '12px', letterSpacing: '0.08em' }}>
                Read-only · No guest data · No credentials
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {refreshAt && (
                <span style={{ color: 'rgba(201,168,76,0.2)', fontSize: 9, letterSpacing: '0.12em', fontFamily: '"JetBrains Mono", monospace' }}>
                  {refreshAt.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={load}
                disabled={loading}
                style={{
                  display:       'flex',
                  alignItems:    'center',
                  gap:           4,
                  padding:       '6px 14px',
                  background:    'rgba(201,168,76,0.06)',
                  border:        '1px solid rgba(201,168,76,0.2)',
                  borderRadius:  16,
                  color:         'rgba(201,168,76,0.5)',
                  fontSize:      10,
                  letterSpacing: '0.14em',
                  cursor:        loading ? 'not-allowed' : 'pointer',
                  fontFamily:    '"JetBrains Mono", monospace',
                  textTransform: 'uppercase',
                  transition:    'all 0.15s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>refresh</span>
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Status strip */}
        <div style={{
          display:       'flex',
          gap:           12,
          marginBottom:  '1.5rem',
          padding:       '12px 16px',
          background:    CARD,
          border:        `1px solid ${dbOk ? 'rgba(76,175,80,0.25)' : 'rgba(204,51,51,0.25)'}`,
          borderRadius:  8,
          flexWrap:      'wrap',
          alignItems:    'center',
        }}>
          <StatusDot ok={dbOk} />
          <span style={{ color: dbOk ? GREEN + 'cc' : RED + 'cc', fontSize: 11, letterSpacing: '0.1em' }}>
            Database: {health?.database || 'unknown'}
          </span>
          <div style={{ width: 1, height: 14, background: 'rgba(201,168,76,0.12)' }} />
          <span style={{ color: 'rgba(201,168,76,0.5)', fontSize: 11, letterSpacing: '0.1em' }}>
            Status: {mono(sysStatus || 'unknown')}
          </span>
          <div style={{ width: 1, height: 14, background: 'rgba(201,168,76,0.12)' }} />
          <span style={{ color: 'rgba(201,168,76,0.5)', fontSize: 11, letterSpacing: '0.1em' }}>
            Env: {mono(health?.environment || 'unknown')}
          </span>
          <div style={{ width: 1, height: 14, background: 'rgba(201,168,76,0.12)' }} />
          <span style={{ color: 'rgba(201,168,76,0.5)', fontSize: 11, letterSpacing: '0.1em' }}>
            Uptime: {mono(fmtUptime(health?.uptime))}
          </span>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) minmax(260px,1.4fr)', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left: System metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '1.5rem' }}>
              <SectionTitle icon="memory" label="System Metrics" />
              {metrics ? (
                <>
                  <MetricRow label="Process PID"      value={metrics.pid} />
                  <MetricRow label="Node.js Version"  value={metrics.nodeVersion} />
                  <MetricRow label="Platform"         value={metrics.platform} />
                  <MetricRow label="CPU Cores"        value={metrics.cpuCount} />
                  <MetricRow label="Heap Used"        value={fmt(metrics.heapUsed)}  note="v8" />
                  <MetricRow label="Heap Total"       value={fmt(metrics.heapTotal)} note="v8" />
                  <MetricRow label="RSS Memory"       value={fmt(metrics.rss)} />
                  <MetricRow label="External Memory"  value={fmt(metrics.external)} />
                  <MetricRow label="Free System Mem"  value={fmt(metrics.freeMem)} />
                  <MetricRow label="Total System Mem" value={fmt(metrics.totalMem)} />
                </>
              ) : (
                <div style={{ color: 'rgba(201,168,76,0.2)', fontSize: 11, letterSpacing: '0.1em', padding: '0.5rem 0' }}>
                  {loading ? 'Loading metrics…' : 'Metrics unavailable.'}
                </div>
              )}
            </div>

            {/* Recent errors */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '1.5rem' }}>
              <SectionTitle icon="error_outline" label="Recent Errors" />
              {errors.length === 0 ? (
                <div style={{ color: GREEN + '88', fontSize: 11, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot ok />
                  No recent errors logged.
                </div>
              ) : (
                errors.slice(0, 10).map((e, i) => (
                  <div key={i} style={{
                    padding:      '8px 10px',
                    marginBottom: 6,
                    background:   'rgba(204,51,51,0.05)',
                    border:       '1px solid rgba(204,51,51,0.15)',
                    borderRadius: 4,
                  }}>
                    <div style={{ color: 'rgba(220,80,80,0.7)', fontSize: 10, fontFamily: '"JetBrains Mono", monospace', marginBottom: 2 }}>
                      {e.timestamp || '—'}
                    </div>
                    <div style={{ color: 'rgba(201,168,76,0.5)', fontSize: 11, lineHeight: 1.5 }}>
                      {e.message || JSON.stringify(e)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Route health */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '1.5rem' }}>
            <SectionTitle icon="route" label="API Route Health" />
            {health?.routes?.length ? (
              health.routes.map(r => (
                <RouteRow key={r.route} route={r.route} status={r.status} />
              ))
            ) : (
              <div style={{ color: 'rgba(201,168,76,0.2)', fontSize: 11, letterSpacing: '0.1em' }}>
                {loading ? 'Loading routes…' : 'Route data unavailable.'}
              </div>
            )}

            {/* Session info */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(201,168,76,0.08)' }}>
              <div style={{ color: DIM, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Active Session
              </div>
              <MetricRow label="Developer"    value={user?.email || '—'} />
              <MetricRow label="Role"         value="developer" />
              <MetricRow label="Access Type"  value="grant-gated" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem', paddingTop: '1.5rem',
          borderTop: '1px solid rgba(201,168,76,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          <a href="/" style={{ color: 'rgba(201,168,76,0.35)', fontSize: '11px', letterSpacing: '0.1em', textDecoration: 'none' }}>
            ← Home
          </a>
          <span style={{ color: 'rgba(201,168,76,0.12)', fontSize: 9, letterSpacing: '0.15em', fontFamily: '"JetBrains Mono", monospace' }}>
            NOVEE OS — READ-ONLY DIAGNOSTICS — THIS SESSION IS AUDITED
          </span>
        </div>
      </div>
    </div>
  )
}
