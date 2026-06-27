import { useNavigate } from 'react-router-dom'
import { Pill } from '../../components/eat/ui.jsx'
import { LightShell, LightHeader, LightCard, LightBottomNav, L_NAVY } from '../../components/eat/lightTheme.jsx'
import { getTables, getTickets, ticketTotals } from '../../services/pos3/pos3Service.js'

export default function POS3Tables() {
  const navigate = useNavigate()
  const tables = getTables()
  const tickets = getTickets()
  return (
    <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 84 }}>
      <LightHeader eyebrow="POS 3" title="Tables / Floor" subtitle="Tap a table to view its ticket" />
      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {tables.map((t) => {
          const tkt = tickets.find((k) => k.tableId === t.id && k.status !== 'paid')
          return (
            <LightCard key={t.id} onClick={() => tkt ? navigate('/pos3/orders?ticket=' + tkt.id) : navigate('/pos3/handheld')} style={{ padding: 12, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong style={{ fontSize: 13, color: L_NAVY }}>{t.name}</strong><Pill label={t.status} tone={t.status} />
              </div>
              <div style={{ fontSize: 11, color: '#8b95a3' }}>{t.section} · {t.guests}/{t.seats} guests</div>
              <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 4 }}>{t.server || 'Unassigned'}</div>
              {tkt && <div style={{ marginTop: 8, padding: 8, background: '#f1efe9', borderRadius: 8, fontSize: 11 }}>{tkt.id} · <span style={{ color: '#9c7320', fontWeight: 700 }}>${ticketTotals(tkt).total.toFixed(2)}</span></div>}
            </LightCard>
          )
        })}
      </div>
      <LightBottomNav items={[
        { label: 'Home', icon: 'home', onClick: () => navigate('/pos3') },
        { label: 'Tables', icon: 'table_restaurant', active: true, onClick: () => navigate('/pos3/tables') },
        { label: 'Orders', icon: 'receipt_long', onClick: () => navigate('/pos3/orders') },
        { label: 'Messages', icon: 'chat', disabled: true, disabledReason: 'Staff messaging is not yet built' },
        { label: 'More', icon: 'more_horiz', onClick: () => navigate('/pos3/settings') },
      ]} />
    </LightShell>
  )
}
