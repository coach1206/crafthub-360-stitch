import { useEffect, useState } from 'react'
import { EatManagementLayout, EatCard, LightPill, L_NAVY } from '../../components/eat/lightTheme.jsx'
import { EAT_STAFF, EAT_SECTIONS } from '../../data/eat/seedData.js'
import { getOpsEvents } from '../../services/shared/opsStorage.js'
import { subscribe, SYSTEMS } from '../../services/shared/opsEventBus.js'

const Field = ({ l, v }) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderTop: '1px solid rgba(19,41,75,0.06)' }}><span style={{ color: '#8b95a3' }}>{l}</span><span style={{ color: '#1c2230' }}>{v}</span></div>

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
    <EatManagementLayout title="Settings" subtitle="E.A.T. venue configuration">
      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <EatCard>
          <div style={{ fontWeight: 700, marginBottom: 10, color: L_NAVY }}>Venue</div>
          <Field l="Venue" v="CraftHub 360 — Demo Lounge" />
          <Field l="Managed System" v="E.A.T." />
          <Field l="Device Mode" v="Manager / Admin (desktop, tablet)" />
          <div style={{ marginTop: 10 }}><LightPill tone="gold">Managed by E.A.T.</LightPill></div>
        </EatCard>

        <EatCard>
          <div style={{ fontWeight: 700, marginBottom: 10, color: L_NAVY }}>Station Visibility</div>
          {EAT_SECTIONS.map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
              <span style={{ color: '#1c2230' }}>{s.name}</span>
              <LightPill tone={s.status === 'active' ? 'green' : 'navy'}>{s.status === 'active' ? 'visible' : 'hidden'}</LightPill>
            </div>
          ))}
        </EatCard>

        <EatCard>
          <div style={{ fontWeight: 700, marginBottom: 10, color: L_NAVY }}>Management Staff &amp; Role Access</div>
          {EAT_STAFF.map((s) => <Field key={s.id} l={s.name} v={`${s.role} · ${s.section} · access_eat_command`} />)}
        </EatCard>

        <EatCard>
          <div style={{ fontWeight: 700, marginBottom: 10, color: L_NAVY }}>Sync &amp; Integrations</div>
          <div style={{ fontSize: 13, color: '#6b7385', marginBottom: 10 }}>
            E.A.T. communicates with POS 3 and SmokeCraft via the local-first ops event bus (localStorage). No external backend is configured in this environment.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
            <span style={{ color: '#8b95a3' }}>POS 3 connection</span>
            <LightPill tone={connected(SYSTEMS.POS3) ? 'green' : 'navy'}>{connected(SYSTEMS.POS3) ? 'connected' : 'no events yet'}</LightPill>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
            <span style={{ color: '#8b95a3' }}>SmokeCraft connection</span>
            <LightPill tone={connected(SYSTEMS.SMOKECRAFT) ? 'green' : 'navy'}>{connected(SYSTEMS.SMOKECRAFT) ? 'connected' : 'no events yet'}</LightPill>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.08em', marginTop: 14, marginBottom: 8 }}>SYNC PREFERENCES</div>
          <Field l="Sync mode" v="Local-first, event bus (configuration-ready)" />
          <Field l="Catch-up cursor" v="Automatic (configuration-ready)" />
        </EatCard>

        <EatCard>
          <div style={{ fontWeight: 700, marginBottom: 10, color: L_NAVY }}>Notification Preferences</div>
          {NOTIFICATION_PREFS.map((n) => (
            <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
              <span style={{ color: '#1c2230' }}>{n.label}</span>
              <LightPill tone="navy">{n.status}</LightPill>
            </div>
          ))}
        </EatCard>
      </div>
    </EatManagementLayout>
  )
}
