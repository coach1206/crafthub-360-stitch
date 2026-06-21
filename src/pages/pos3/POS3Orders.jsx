import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Shell, SideNav, TopBar, Card, Pill, Btn, GOLD, PANEL2, useToast } from '../../components/eat/ui.jsx'
import { getTickets, ticketTotals, routingSummary, sendOrder, holdTicket } from '../../services/pos3/pos3Service.js'

export default function POS3Orders() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const tickets = getTickets().filter((t) => t.status !== 'paid')
  const [activeId, setActiveId] = useState(params.get('ticket') || tickets[0]?.id)
  const ticket = tickets.find((t) => t.id === activeId) || tickets[0]

  if (!ticket) {
    return (
      <Shell><div style={{ display: 'flex' }}><SideNav system="POS3" /><div style={{ flex: 1 }}><TopBar system="POS3" title="Order Review" /><div style={{ padding: 20, color: '#8b95a3' }}>No open tickets.</div></div></div></Shell>
    )
  }

  const totals = ticketTotals(ticket)
  const routing = routingSummary(ticket)

  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1 }}>
          <TopBar system="POS3" title={`Review · Ticket ${ticket.id}`} subtitle={`${ticket.tableId} · ${ticket.server}`} />
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
            <Card>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {tickets.map((t) => (
                  <button key={t.id} onClick={() => setActiveId(t.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: t.id === ticket.id ? GOLD : PANEL2, color: t.id === ticket.id ? '#0f1419' : '#aab3bf', fontSize: 12, fontWeight: 600 }}>{t.id}</button>
                ))}
              </div>
              {ticket.items.map((i) => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{i.qty}× {i.name}</div>
                    <div style={{ fontSize: 12, color: '#8b95a3' }}>{i.modifier}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Pill label={i.station} tone={i.station} />
                    <span style={{ color: GOLD, fontWeight: 700, width: 64, textAlign: 'right' }}>${(i.price * i.qty).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <Btn tone="gray" onClick={() => { holdTicket(ticket.id); toast('Ticket held') }}>Hold Ticket</Btn>
                <Btn tone="orange" onClick={() => { sendOrder(ticket.id); toast('Order sent — E.A.T. notified') }}>Send Order</Btn>
                <Btn tone="green" onClick={() => navigate('/pos3/checkout?ticket=' + ticket.id)}>Checkout</Btn>
              </div>
            </Card>

            <div>
              <Card style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Order Routing Summary</div>
                {['kitchen', 'bar', 'humidor'].map((s) => (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <Pill label={s} tone={s} /><span>{routing[s] || 0}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Order Totals</div>
                <Row l="Subtotal" v={totals.subtotal} />
                <Row l="Tax" v={totals.tax} />
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 6, paddingTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>Total</span><span style={{ color: GOLD }}>${totals.total.toFixed(2)}</span></div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

const Row = ({ l, v }) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#aab3bf', fontSize: 13 }}><span>{l}</span><span>${v.toFixed(2)}</span></div>
