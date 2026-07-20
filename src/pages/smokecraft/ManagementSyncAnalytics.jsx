import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVenueAnalytics, getIntegrationStatuses } from '../../services/smokecraft/managementSyncApiClient.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

/**
 * Real venue-scoped SmokeCraft analytics — venue-manager only (server
 * enforces requireAuth + requireVenueMembership; a guest hitting this
 * route gets 401/403 from the API and sees the unauthorized state
 * below, never fabricated data). Reachable directly by URL for
 * authorized staff — not linked from any guest-facing screen.
 */
export default function ManagementSyncAnalytics() {
  const navigate = useNavigate()
  const [venueId, setVenueId] = useState('')
  const [range, setRange] = useState('30')
  const [state, setState] = useState('idle') // idle | loading | ready | unauthorized | venue-error | error
  const [data, setData] = useState(null)
  const [integrations, setIntegrations] = useState(null)

  const load = useCallback(async () => {
    if (!venueId) return
    setState('loading')
    const endDate = new Date().toISOString()
    const startDate = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString()
    const [result, integrationsResult] = await Promise.all([
      getVenueAnalytics(venueId, { startDate, endDate }),
      getIntegrationStatuses(venueId),
    ])
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) setState('unauthorized')
      else if (result.error === 'venue_not_found' || result.error === 'venue_inactive') setState('venue-error')
      else setState('error')
      return
    }
    setData(result)
    // Integration statuses are shown best-effort — a failure here never
    // blocks the analytics view that already succeeded above.
    if (integrationsResult.ok) setIntegrations(integrationsResult.integrations)
    setState('ready')
  }, [venueId, range])

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, padding: 'clamp(16px,3vw,32px)' }}>
      <h1 style={{ color: GOLD, fontSize: 'clamp(18px,2.4vw,26px)', margin: '0 0 16px' }}>SmokeCraft Venue Analytics</h1>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          type="text" placeholder="Venue ID" value={venueId}
          onChange={e => setVenueId(e.target.value)}
          aria-label="Venue ID"
          style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', minHeight: 44 }}
        />
        <select value={range} onChange={e => setRange(e.target.value)} aria-label="Reporting date range" style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', minHeight: 44 }}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button type="button" onClick={load} disabled={!venueId} style={{ padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: venueId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', minHeight: 44 }}>
          Load Analytics
        </button>
      </div>

      <div role="status" aria-live="polite">
        {state === 'loading' && <p>Loading…</p>}
        {state === 'unauthorized' && <p style={{ color: 'rgba(255,150,150,0.85)' }}>Unauthorized — sign in with venue-manager access to view this venue's analytics.</p>}
        {state === 'venue-error' && <p style={{ color: 'rgba(255,150,150,0.85)' }}>Venue not found or inactive.</p>}
        {state === 'error' && <p style={{ color: 'rgba(255,150,150,0.85)' }}>Analytics unavailable right now. <button type="button" onClick={load} style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: CREAM, borderRadius: 10, padding: '2px 10px', cursor: 'pointer' }}>Retry</button></p>}

        {state === 'ready' && data && (
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Completed Journeys</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>{data.completedJourneyCount}</div>
            </div>
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Completion Rate</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>
                {data.completionRate.value != null ? `${data.completionRate.value}%` : 'Not enough verified data'}
              </div>
            </div>
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Top Cigars</div>
              {data.cigarTrends.availability === 'ok'
                ? <ul style={{ margin: 0, paddingLeft: 18 }}>{data.cigarTrends.value.map(c => <li key={c.name}>{c.name} ({c.count})</li>)}</ul>
                : <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.5)' }}>Minimum sample size not reached ({data.cigarTrends.sampleSize}/{data.cigarTrends.threshold})</div>}
            </div>
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Top Pairings</div>
              {data.pairingTrends.availability === 'ok'
                ? <ul style={{ margin: 0, paddingLeft: 18 }}>{data.pairingTrends.value.map(c => <li key={c.name}>{c.name} ({c.count})</li>)}</ul>
                : <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.5)' }}>Minimum sample size not reached ({data.pairingTrends.sampleSize}/{data.pairingTrends.threshold})</div>}
            </div>
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Flavor Notes</div>
              {data.flavorTrends.availability === 'ok'
                ? <ul style={{ margin: 0, paddingLeft: 18 }}>{data.flavorTrends.value.map(c => <li key={c.name}>{c.name} ({c.count})</li>)}</ul>
                : <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.5)' }}>Minimum sample size not reached ({data.flavorTrends.sampleSize}/{data.flavorTrends.threshold})</div>}
            </div>
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Scorecard Average</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>
                {data.scorecardAverage.availability === 'ok' ? `${data.scorecardAverage.value} / 5` : 'Not enough verified data'}
              </div>
            </div>
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Sync Health (internal only)</div>
              <div style={{ fontSize: 13 }}>Completed: {data.syncHealth.completed} · Pending: {data.syncHealth.pending} · Failed: {data.syncHealth.failed}</div>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)', marginTop: 6, fontStyle: 'italic' }}>
                POS360 / E.A.T. 360 / NOVEE OS / inventory / staff systems: not connected.
              </div>
            </div>
          </div>
        )}

        {state === 'ready' && integrations && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ color: GOLD, fontSize: 15, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Integration Status <span style={{ fontSize: 10, color: 'rgba(229,226,225,0.4)', fontWeight: 400 }}>(server-verified, real-time)</span>
            </h2>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {Object.values(integrations).map(i => {
                const color = i.state === 'CONNECTED' ? '#7ddca0'
                  : i.state === 'INTERNAL_ONLY' ? GOLD
                  : i.state === 'COMING_SOON' ? 'rgba(229,226,225,0.5)'
                  : i.state === 'ERROR' || i.state === 'UNAVAILABLE' ? 'rgba(255,150,150,0.85)'
                  : 'rgba(229,226,225,0.5)'
                return (
                  <div key={i.key} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{i.displayName}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase' }}>{i.state.replace(/_/g, ' ')}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)', marginTop: 4 }}>{i.message}</div>
                    {i.packageDependency && (
                      <div style={{ fontSize: 10, color: 'rgba(233,193,118,0.6)', marginTop: 4, fontStyle: 'italic' }}>
                        Depends on: {i.packageDependency.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={() => navigate(-1)} style={{ marginTop: 24, background: 'transparent', border: `1px solid ${BORDER}`, color: CREAM, borderRadius: 20, padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
        ← Back
      </button>
    </div>
  )
}
