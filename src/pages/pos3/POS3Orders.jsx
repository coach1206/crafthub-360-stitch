import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Pill, Btn, useToast } from '../../components/eat/ui.jsx'
import { LightShell, LightHeader, LightCard, LightBottomNav, L_NAVY, L_GOLD } from '../../components/eat/lightTheme.jsx'
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
      <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 84 }}>
        <LightHeader eyebrow="POS 3" title="Order Review" />
        <div style={{ padding: 20, color: '#8b95a3' }}>No open tickets.</div>
        <LightBottomNav items={[
          { label: 'Home', icon: 'home', onClick: () => navigate('/pos3') },
          { label: 'Tables', icon: 'table_restaurant', onClick: () => navigate('/pos3/tables') },
          { label: 'Orders', icon: 'receipt_long', active: true, onClick: () => navigate('/pos3/orders') },
          { label: 'Messages', icon: 'chat', disabled: true, disabledReason: 'Staff messaging is not yet built' },
          { label: 'More', icon: 'more_horiz', onClick: () => navigate('/pos3/settings') },
        ]} />
      </LightShell>
    )
  }

  const totals = ticketTotals(ticket)
  const routing = routingSummary(ticket)

  return (
    <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 84 }}>
      <LightHeader eyebrow="POS 3" title={`Review · ${ticket.id}`} subtitle={`${ticket.tableId} · ${ticket.server}`} />
      <div style={{ padding: '14px 16px 0' }}>
        <LightCard style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {tickets.map((t) => (
              <button key={t.id} onClick={() => setActiveId(t.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: t.id === ticket.id ? L_GOLD : '#eceae3', color: t.id === ticket.id ? '#1c2230' : '#4a5266', fontSize: 12, fontWeight: 600 }}>{t.id}</button>
            ))}
          </div>
          {ticket.items.map((i) => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: L_NAVY }}>{i.qty}× {i.name}</div>
                <div style={{ fontSize: 11, color: '#8b95a3' }}>{i.modifier}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Pill label={i.station} tone={i.station} />
                <span style={{ color: '#9c7320', fontWeight: 700, width: 56, textAlign: 'right', fontSize: 13 }}>${(i.price * i.qty).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            <Btn tone="gray" onClick={() => { holdTicket(ticket.id); toast('Ticket held') }} style={{ width: '100%' }}>Hold Ticket</Btn>
            <Btn tone="orange" onClick={() => { sendOrder(ticket.id); toast('Order sent — E.A.T. notified') }} style={{ width: '100%' }}>Send Order</Btn>
            <Btn tone="green" onClick={() => navigate('/pos3/checkout?ticket=' + ticket.id)} style={{ width: '100%' }}>Checkout</Btn>
          </div>
        </LightCard>

        <LightCard style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: L_NAVY }}>Order Routing Summary</div>
          {['kitchen', 'bar', 'humidor'].map((s) => (
            <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <Pill label={s} tone={s} /><span style={{ fontSize: 13, color: L_NAVY }}>{routing[s] || 0}</span>
            </div>
          ))}
        </LightCard>
        <LightCard style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: L_NAVY }}>Order Totals</div>
          <Row l="Subtotal" v={totals.subtotal} />
          <Row l="Tax" v={totals.tax} />
          <div style={{ borderTop: '1px solid rgba(19,41,75,0.1)', marginTop: 6, paddingTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, color: L_NAVY }}><span>Total</span><span style={{ color: '#9c7320' }}>${totals.total.toFixed(2)}</span></div>
          </div>
        </LightCard>
      </div>
      <LightBottomNav items={[
        { label: 'Home', icon: 'home', onClick: () => navigate('/pos3') },
        { label: 'Tables', icon: 'table_restaurant', onClick: () => navigate('/pos3/tables') },
        { label: 'Orders', icon: 'receipt_long', active: true, onClick: () => navigate('/pos3/orders') },
        { label: 'Messages', icon: 'chat', disabled: true, disabledReason: 'Staff messaging is not yet built' },
        { label: 'More', icon: 'more_horiz', onClick: () => navigate('/pos3/settings') },
      ]} />
    </LightShell>
  )
}

const Row = ({ l, v }) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#6b7385', fontSize: 13 }}><span>{l}</span><span>${v.toFixed(2)}</span></div>
