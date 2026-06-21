import { useNavigate } from 'react-router-dom'
import { Shell, SideNav, TopBar, Card, Pill, GOLD, PANEL2 } from '../../components/eat/ui.jsx'
import { getTables, getTickets, ticketTotals } from '../../services/pos3/pos3Service.js'

export default function POS3Tables() {
  const navigate = useNavigate()
  const tables = getTables()
  const tickets = getTickets()
  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1 }}>
          <TopBar system="POS3" title="Tables / Floor" subtitle="Tap a table to view its ticket" />
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
            {tables.map((t) => {
              const tkt = tickets.find((k) => k.tableId === t.id && k.status !== 'paid')
              return (
                <Card key={t.id} onClick={() => tkt ? navigate('/pos3/orders?ticket=' + tkt.id) : navigate('/pos3/handheld')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{t.name}</strong><Pill label={t.status} tone={t.status} />
                  </div>
                  <div style={{ fontSize: 12, color: '#8b95a3' }}>{t.section} · {t.guests}/{t.seats} guests</div>
                  <div style={{ fontSize: 12, color: '#8b95a3', marginTop: 4 }}>{t.server || 'Unassigned'}</div>
                  {tkt && <div style={{ marginTop: 8, padding: 8, background: PANEL2, borderRadius: 8, fontSize: 12 }}>{tkt.id} · <span style={{ color: GOLD }}>${ticketTotals(tkt).total.toFixed(2)}</span></div>}
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </Shell>
  )
}
