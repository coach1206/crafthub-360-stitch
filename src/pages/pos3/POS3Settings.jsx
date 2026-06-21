import { Shell, SideNav, TopBar, Card, EatBadge } from '../../components/eat/ui.jsx'
import { getStaff } from '../../services/pos3/pos3Service.js'

export default function POS3Settings() {
  const staff = getStaff()
  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1 }}>
          <TopBar system="POS3" title="POS 3 Settings" subtitle="Terminal configuration" />
          <div style={{ padding: 20, display: 'grid', gap: 16, maxWidth: 640 }}>
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Terminal</div>
              <Field l="Venue" v="CraftHub 360 — Demo Lounge" />
              <Field l="Device" v="Handheld / Tablet" />
              <Field l="Shift" v="PM" />
              <div style={{ marginTop: 10 }}><EatBadge /></div>
            </Card>
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Staff on Terminal</div>
              {staff.map((s) => <Field key={s.id} l={s.name} v={`${s.role} · ${s.shift}`} />)}
            </Card>
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Integrations</div>
              <div style={{ fontSize: 13, color: '#8b95a3' }}>Payment processors (Square / Clover / Toast / Stripe) are not configured in this environment. POS 3 reports into NOVEE through CraftHub via the local-first ops event bus.</div>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  )
}
const Field = ({ l, v }) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.05)' }}><span style={{ color: '#8b95a3' }}>{l}</span><span>{v}</span></div>
