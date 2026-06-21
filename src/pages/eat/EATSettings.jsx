import { ManagementLayout, Card, EatBadge } from '../../components/eat/ui.jsx'
import { EAT_STAFF } from '../../data/eat/seedData.js'

const Field = ({ l, v }) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.05)' }}><span style={{ color: '#8b95a3' }}>{l}</span><span>{v}</span></div>

export default function EATSettings() {
  return (
    <ManagementLayout title="Settings" subtitle="E.A.T. venue configuration">
      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Venue</div>
          <Field l="Venue" v="CraftHub 360 — Demo Lounge" />
          <Field l="Managed System" v="E.A.T." />
          <div style={{ marginTop: 10 }}><EatBadge /></div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Management Staff</div>
          {EAT_STAFF.map((s) => <Field key={s.id} l={s.name} v={`${s.role} · ${s.section}`} />)}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Integrations</div>
          <div style={{ fontSize: 13, color: '#8b95a3' }}>
            E.A.T. communicates with POS 3 and SmokeCraft via the local-first ops event bus (localStorage). No external backend is configured in this environment.
          </div>
        </Card>
      </div>
    </ManagementLayout>
  )
}
