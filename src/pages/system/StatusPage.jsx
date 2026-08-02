// Production Package 7 — practical-minimum public status page, /status.
// Honest current/incident/maintenance state only. No sensitive infra
// disclosure (no error rates, DB internals, provider names/credentials).
// Publication to a public domain is pending — this route is verified
// locally in this sandbox only.
import { useEffect, useState } from 'react'

const GOLD = '#E9C176'
const CARD = { background: '#0b0f18', border: '1px solid rgba(233,193,118,0.25)', borderRadius: 10, padding: 16, marginBottom: 16 }

const LABELS = {
  smokecraft:       'SmokeCraft 360',
  venueHumidor:     'Venue Humidor',
  checkoutPayments: 'Checkout / Payments',
  mediaDelivery:    'Media Delivery',
  passportRewards:  'Passport / Rewards',
  goldenBox:        'Golden Box',
  pos360:           'POS360',
  eat360:           'E.A.T. 360',
}

const STATE_COLOR = {
  operational: '#8fd19e',
  'operational-test-mode': '#8fd19e',
  degraded: '#e5b56a',
  external_activation_pending: 'rgba(229,226,225,0.5)',
}

const STATE_LABEL = {
  operational: 'Operational',
  'operational-test-mode': 'Operational (test mode)',
  degraded: 'Degraded',
  external_activation_pending: 'External activation pending',
}

export default function StatusPage() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/status/public', { cache: 'no-store' })
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setError('Status endpoint unreachable — showing no data rather than a false "operational" claim.'))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#e5e2e1', fontFamily: 'Georgia, serif', padding: 'clamp(16px,4vw,40px)' }}>
      <h1 style={{ color: GOLD, fontSize: 22, marginBottom: 4 }}>SmokeCraft 360 — System Status</h1>
      <p style={{ color: 'rgba(229,226,225,0.55)', fontSize: 13, marginBottom: 24 }}>
        This page reflects this server's own internal health checks. Publication to a public domain is pending — this environment has no live public URL.
      </p>

      {error && <div style={{ color: '#e57373', marginBottom: 16 }}>{error}</div>}

      <div style={CARD}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Incident status</div>
        <div style={{ fontSize: 13 }}>
          {status ? (status.incident?.active ? status.incident.description : 'No active incident.') : 'loading…'}
        </div>
      </div>

      <div style={CARD}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Maintenance status</div>
        <div style={{ fontSize: 13 }}>
          {status ? (status.maintenance?.active ? status.maintenance.description : 'No scheduled maintenance.') : 'loading…'}
        </div>
      </div>

      <div style={CARD}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Components</div>
        {status ? Object.entries(status.components || {}).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
            <span style={{ color: 'rgba(229,226,225,0.7)' }}>{LABELS[key] || key}</span>
            <span style={{ color: STATE_COLOR[val.state] || '#e5e2e1', fontFamily: 'monospace' }}>{STATE_LABEL[val.state] || val.state}</span>
          </div>
        )) : <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.5)' }}>loading…</div>}
      </div>

      <div style={{ ...CARD, marginBottom: 0 }}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>External monitoring</div>
        <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.65)' }}>
          {status?.externalMonitoring?.note || 'No live external monitoring provider is connected in this environment.'}
        </div>
      </div>
    </div>
  )
}
