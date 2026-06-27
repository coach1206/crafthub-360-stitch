import { useEffect, useState } from 'react'
import { ManagementLayout, Card, Pill, EatBadge, GOLD } from '../../components/eat/ui.jsx'
import { EAT_STAFF, EAT_SECTIONS } from '../../data/eat/seedData.js'
import { getOpsEvents } from '../../services/shared/opsStorage.js'
import { subscribe, SYSTEMS } from '../../services/shared/opsEventBus.js'

const Field = ({ l, v }) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.05)' }}><span style={{ color: '#8b95a3' }}>{l}</span><span>{v}</span></div>

const NOTIFICATION_PREFS = [
  { label: 'Humidor request alerts', status: 'configuration-ready' },
  { label: 'Low inventory alerts', status: 'configuration-ready' },
  { label: 'Staff clock-in/out alerts', status: 'configuration-ready' },
]

export default function EATSettings() {
  const [events, setEvents] = useState([])
  useEffect(() => {
    const refresh = () => setEvents(getOpsEvents())
    refresh()
    return subscribe(() => refresh())
  }, [])

  const connected = (system) => events.some((e) => e.sourceSystem === system || e.targetSystem === system)

  return (
    <ManagementLayout title="Settings" subtitle="E.A.T. venue configuration">
      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Venue</div>
          <Field l="Venue" v="CraftHub 360 — Demo Lounge" />
          <Field l="Managed System" v="E.A.T." />
          <Field l="Device Mode" v="Manager / Admin (desktop, tablet)" />
          <div style={{ marginTop: 10 }}><EatBadge /></div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Station Visibility</div>
          {EAT_SECTIONS.map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#cdd5df' }}>{s.name}</span>
              <Pill label={s.status === 'active' ? 'visible' : 'hidden'} tone={s.status === 'active' ? 'open' : 'dirty'} />
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Management Staff &amp; Role Access</div>
          {EAT_STAFF.map((s) => <Field key={s.id} l={s.name} v={`${s.role} · ${s.section} · access_eat_command`} />)}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Sync &amp; Integrations</div>
          <div style={{ fontSize: 13, color: '#8b95a3', marginBottom: 10 }}>
            E.A.T. communicates with POS 3 and SmokeCraft via the local-first ops event bus (localStorage). No external backend is configured in this environment.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#8b95a3' }}>POS 3 connection</span>
            <Pill label={connected(SYSTEMS.POS3) ? 'connected' : 'no events yet'} tone={connected(SYSTEMS.POS3) ? 'open' : 'dirty'} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#8b95a3' }}>SmokeCraft connection</span>
            <Pill label={connected(SYSTEMS.SMOKECRAFT) ? 'connected' : 'no events yet'} tone={connected(SYSTEMS.SMOKECRAFT) ? 'open' : 'dirty'} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.08em', marginTop: 14, marginBottom: 8 }}>SYNC PREFERENCES</div>
          <Field l="Sync mode" v="Local-first, event bus (configuration-ready)" />
          <Field l="Catch-up cursor" v="Automatic (configuration-ready)" />
        </Card>

        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Notification Preferences</div>
          {NOTIFICATION_PREFS.map((n) => (
            <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#cdd5df' }}>{n.label}</span>
              <Pill label={n.status} tone="dirty" />
            </div>
          ))}
        </Card>
      </div>
    </ManagementLayout>
  )
}
