/**
 * PilotReadinessDashboard — Phase 13
 * Reads Phase 12 venue test summary data and renders a pilot readiness panel.
 */

import { useState, useEffect } from 'react'
import { READINESS_LABEL }     from '../../config/testModeConfig.js'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'

function Metric({ label, value, note, color }) {
  return (
    <div style={{ background: 'rgba(201,168,76,0.04)', border: `1px solid rgba(201,168,76,0.1)`, borderRadius: '8px', padding: '0.875rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 400, color: color || GOLD, lineHeight: 1, marginBottom: '0.3rem', fontFamily: 'monospace' }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: `${GOLD}55`, textTransform: 'uppercase' }}>{label}</div>
      {note && <div style={{ fontSize: '0.62rem', color: `${GOLD}44`, marginTop: '0.2rem' }}>{note}</div>}
    </div>
  )
}

function SevBadge({ label, count, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid rgba(201,168,76,0.07)` }}>
      <span style={{ fontSize: '0.75rem', color: `${GOLD}77`, fontFamily: 'Georgia, serif' }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: count > 0 ? color : `${GOLD}33`, fontWeight: count > 0 ? 600 : 400 }}>{count ?? 0}</span>
    </div>
  )
}

export default function PilotReadinessDashboard({ compact = false }) {
  const [loading, setLoading] = useState(true)
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      try {
        // Fetch active test first
        const sr = await fetch('/api/venue-test/status', { credentials: 'include' })
        const sd = await sr.json()
        if (!sd.success || !sd.data?.activeTest?.venue_test_id) {
          setError('No active venue test found. Run a test in Venue Test Control first.')
          return
        }
        const vtId = sd.data.activeTest.venue_test_id
        const mr = await fetch(`/api/venue-test/summary?venueTestId=${vtId}`, { credentials: 'include' })
        const md = await mr.json()
        if (md.success) setData(md.data)
        else setError(md.message || 'Summary unavailable')
      } catch (e) {
        setError('Could not load venue test data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ padding: '1.5rem', textAlign: 'center', color: `${GOLD}44`, fontSize: '0.78rem', fontFamily: 'Georgia, serif' }}>
      Loading pilot readiness data…
    </div>
  )

  if (error) return (
    <div style={{ padding: compact ? '0.875rem' : '1.25rem', background: CARD, border: `1px solid rgba(201,168,76,0.1)`, borderRadius: '10px' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: `${GOLD}44`, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pilot Readiness</div>
      <div style={{ fontSize: '0.78rem', color: `${GOLD}55`, fontFamily: 'Georgia, serif', lineHeight: 1.6 }}>{error}</div>
      <a href="/venue-test" style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.7rem', color: '#a3e635', textDecoration: 'underline', fontFamily: 'Georgia, serif' }}>
        → Run a venue test
      </a>
    </div>
  )

  const readiness = READINESS_LABEL(data.readinessScore)

  return (
    <div style={{ background: CARD, border: `1px solid ${readiness.color}22`, borderRadius: '10px', overflow: 'hidden' }}>
      {/* Score header */}
      <div style={{ padding: compact ? '1rem 1.25rem' : '1.5rem', borderBottom: `1px solid rgba(201,168,76,0.08)`, display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', minWidth: '72px' }}>
          <div style={{ fontSize: compact ? '2.2rem' : '3rem', fontWeight: 400, color: readiness.color, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{data.readinessScore}</div>
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.15em', color: `${GOLD}44`, textTransform: 'uppercase' }}>Score</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: compact ? '0.82rem' : '0.95rem', color: readiness.color, fontFamily: 'Georgia, serif', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>{readiness.label}</div>
          <div style={{ fontSize: '0.72rem', color: `${GOLD}77`, lineHeight: 1.5, fontFamily: 'Georgia, serif' }}>{data.recommendation}</div>
          <div style={{ fontSize: '0.6rem', color: `${GOLD}44`, marginTop: '0.35rem', fontFamily: 'monospace' }}>{data.venueName} · {data.testType?.replace(/_/g,' ')}</div>
        </div>
      </div>

      {!compact && (
        <div style={{ padding: '1.25rem' }}>
          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
            <Metric label="Sessions"  value={data.totalSessions}          color={GOLD} />
            <Metric label="Completed" value={data.completedGuestJourneys} color="#4ade80" />
            <Metric label="Notes"     value={data.observerNotesCount}      color="#60a5fa" />
            <Metric label="Issues"    value={data.totalIssues}             color={data.totalIssues > 0 ? '#fbbf24' : '#4ade80'} />
          </div>

          {/* Issues by severity */}
          <div style={{ marginBottom: '0.5rem', fontSize: '0.6rem', letterSpacing: '0.15em', color: `${GOLD}44`, textTransform: 'uppercase' }}>Issues by Severity</div>
          <SevBadge label="Blocker" count={data.issueCountsBySeverity?.blocker} color="#f87171" />
          <SevBadge label="High"    count={data.issueCountsBySeverity?.high}    color="#f97316" />
          <SevBadge label="Medium"  count={data.issueCountsBySeverity?.medium}  color="#fbbf24" />
          <SevBadge label="Low"     count={data.issueCountsBySeverity?.low}     color="#4ade80" />

          {/* Top screens */}
          {data.topScreensWithIssues?.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: `${GOLD}44`, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Top Screens with Issues</div>
              {data.topScreensWithIssues.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.73rem', borderBottom: `1px solid rgba(201,168,76,0.06)` }}>
                  <span style={{ color: `${GOLD}88`, fontFamily: 'monospace' }}>{s.screen}</span>
                  <span style={{ color: GOLD }}>{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
