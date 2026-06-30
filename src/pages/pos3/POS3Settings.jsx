import { useNavigate } from 'react-router-dom'
import { EatBadge } from '../../components/eat/ui.jsx'
import { LightShell, LightHeader, LightCard, LightBottomNav, L_NAVY } from '../../components/eat/lightTheme.jsx'
import { getStaff } from '../../services/pos3/pos3Service.js'

export default function POS3Settings() {
  const navigate = useNavigate()
  const staff = getStaff()
  return (
    <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 84 }}>
      <LightHeader eyebrow="POS 3" title="Settings" subtitle="Terminal configuration" />
      <div style={{ padding: '14px 16px', display: 'grid', gap: 14 }}>
        <LightCard style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: L_NAVY }}>Terminal</div>
          <Field l="Venue" v="CraftHub 360 — Demo Lounge" />
          <Field l="Device" v="Handheld / Tablet" />
          <Field l="Shift" v="PM" />
          <div style={{ marginTop: 10 }}><EatBadge /></div>
        </LightCard>
        <LightCard style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: L_NAVY }}>Staff on Terminal</div>
          {staff.map((s) => <Field key={s.id} l={s.name} v={`${s.role} · ${s.shift}`} />)}
        </LightCard>
        <LightCard style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, color: L_NAVY }}>Integrations</div>
          <div style={{ fontSize: 12, color: '#8b95a3' }}>Payment processors (Square / Clover / Toast / Stripe) are not configured in this environment. POS 3 reports into NOVEE through CraftHub via the local-first ops event bus.</div>
        </LightCard>
      </div>
      <LightBottomNav items={[
        { label: 'Home', icon: 'home', onClick: () => navigate('/pos3') },
        { label: 'Tables', icon: 'table_restaurant', onClick: () => navigate('/pos3/tables') },
        { label: 'Orders', icon: 'receipt_long', onClick: () => navigate('/pos3/orders') },
        { label: 'Messages', icon: 'chat', disabled: true, disabledReason: 'Staff messaging is not yet built' },
        { label: 'More', icon: 'more_horiz', active: true, onClick: () => navigate('/pos3/settings') },
      ]} />
    </LightShell>
  )
}
const Field = ({ l, v }) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderTop: '1px solid rgba(19,41,75,0.06)' }}><span style={{ color: '#8b95a3' }}>{l}</span><span style={{ color: '#1c2230' }}>{v}</span></div>
