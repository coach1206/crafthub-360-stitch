/**
 * SmokeCraft Admin Readiness Dashboard (Truth Gate — Phase 5).
 *
 * GET-able page at /smokecraft/admin/readiness. Calls the real,
 * admin-gated GET /api/smokecraft/diagnostics/readiness endpoint and
 * renders a single Green/Amber/Red status the owner can read without
 * opening logs, DevTools, SQL, or the database. Matches the existing
 * admin page visual pattern (see FeatureFlagAdmin.jsx / ErrorLogViewer.jsx)
 * rather than inventing a new design language.
 */
import { useState, useEffect, useCallback } from 'react'
import { useSecurity } from '../../context/SecurityContext.jsx'
import { meetsMinRole } from '../../config/roleMap.js'

const GOLD  = '#E9C176'
const DARK  = '#0a0603'
const DIM   = 'rgba(229,226,225,0.5)'
const ERROR = '#e57373'
const GREEN = '#81c784'
const AMBER = '#ffb74d'

const STATUS_COLOR = { ready: GREEN, degraded: AMBER, failed: ERROR }
const STATUS_LABEL = { ready: 'Ready', degraded: 'Degraded', failed: 'Failed' }

function StatusPill({ status }) {
  const color = STATUS_COLOR[status] || DIM
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 16px', borderRadius: 999, border: `1.5px solid ${color}`,
      color, fontWeight: 700, fontSize: 14, letterSpacing: '0.04em',
    }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {STATUS_LABEL[status] || status || 'Unknown'}
    </span>
  )
}

function CheckRow({ label, result }) {
  const ok = result?.ok
  const color = ok ? GREEN : ERROR
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px', borderBottom: '1px solid rgba(233,193,118,0.08)', fontSize: 13,
    }}>
      <span style={{ color: 'rgba(229,226,225,0.85)' }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>
        {ok ? 'OK' : (result?.code || 'FAIL')}
      </span>
    </div>
  )
}

export default function AdminReadiness() {
  const { role } = useSecurity()
  const isAdmin = meetsMinRole(role, 'admin')

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [data, setData]         = useState(null)
  const [lastRun, setLastRun]   = useState(null)

  const runCheck = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/smokecraft/diagnostics/readiness', { credentials: 'include' })
      if (res.status === 401) { setError('Not authenticated. Log in as an admin account.'); setData(null); return }
      if (res.status === 403) { setError('Access denied — admin role or higher required.'); setData(null); return }
      if (!res.ok) { setError(`Readiness endpoint returned HTTP ${res.status}.`); setData(null); return }
      const json = await res.json()
      setData(json)
      setLastRun(new Date().toISOString())
    } catch (err) {
      setError('Could not reach the readiness endpoint (network error).')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { runCheck() }, [runCheck])

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, color: ERROR, fontFamily: 'Georgia, serif' }}>
        Access denied. SmokeCraft readiness requires admin-level access or higher.
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: DARK, padding: '32px 20px', fontFamily: 'Georgia, serif' }}>
      <h1 style={{ color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
        SmokeCraft Production Readiness
      </h1>
      <p style={{ color: DIM, fontSize: 13, marginBottom: 20 }}>
        Proves the application's own production state — no log search, DevTools, or database access required.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {data && <StatusPill status={data.overallStatus} />}
        <button
          type="button"
          onClick={runCheck}
          disabled={loading}
          style={{
            padding: '8px 20px', borderRadius: 6, border: `1px solid ${GOLD}`,
            background: loading ? 'rgba(233,193,118,0.2)' : 'transparent', color: GOLD,
            cursor: loading ? 'default' : 'pointer', fontSize: 13, fontFamily: 'Georgia, serif', fontWeight: 700,
          }}
        >
          {loading ? 'Running…' : 'Run Readiness Check'}
        </button>
        {lastRun && <span style={{ color: DIM, fontSize: 12 }}>Last run: {new Date(lastRun).toLocaleString()}</span>}
      </div>

      {error && (
        <div style={{ background: '#3b1a1a', border: `1px solid ${ERROR}`, borderRadius: 8, padding: '10px 16px', marginBottom: 20, color: ERROR, fontSize: 13 }}>
          {error}
        </div>
      )}

      {data && (
        <>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(233,193,118,0.12)', borderRadius: 8, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: DIM }}>
            <div>Environment: <span style={{ color: GOLD }}>{data.environment}</span></div>
            <div>Application version: <span style={{ color: GOLD }}>{data.applicationVersion || 'unknown'}</span></div>
            <div>Deployed commit: <span style={{ color: GOLD }}>{data.commit || 'unknown'}</span></div>
            {data.failureCodes?.length > 0 && (
              <div style={{ marginTop: 6, color: ERROR }}>Failure codes: {data.failureCodes.join(', ')}</div>
            )}
            {data.degradedCodes?.length > 0 && (
              <div style={{ marginTop: 6, color: AMBER }}>Degraded codes: {data.degradedCodes.join(', ')}</div>
            )}
          </div>

          <h2 style={{ color: GOLD, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Checks</h2>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(233,193,118,0.12)', borderRadius: 8, marginBottom: 20 }}>
            <CheckRow label="Database connectivity"          result={data.checks?.databaseConnectivity} />
            <CheckRow label="Migrations complete"             result={data.checks?.migrations} />
            <CheckRow label="Schema verification"             result={data.checks?.schemaVerification} />
            <CheckRow label="Tasting draft table"              result={data.checks?.tastingDraftTable} />
            <CheckRow label="Tasting draft columns"            result={data.checks?.tastingDraftColumns} />
            <CheckRow label="Player-state dependency"          result={data.checks?.playerStateDependency} />
            <CheckRow label="Venue data (active venue count)"  result={{ ok: data.checks?.venueData?.ok }} />
            <CheckRow label="Session 2 draft read test"        result={data.checks?.session2DraftRead} />
            <CheckRow label="Session 2 draft write test (rolled back)" result={data.checks?.session2DraftWrite} />
          </div>
          <p style={{ color: DIM, fontSize: 11 }}>
            Active venues: {data.checks?.venueData?.activeVenueCount ?? 0} · The Session 2 write test always runs inside a transaction that is rolled back — no permanent player or venue record is ever created by this page.
          </p>
        </>
      )}
    </div>
  )
}
