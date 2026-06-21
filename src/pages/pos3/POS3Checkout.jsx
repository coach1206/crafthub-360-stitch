import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Shell, SideNav, TopBar, Card, Pill, Btn, GOLD, PANEL2, useToast } from '../../components/eat/ui.jsx'
import { getTickets, ticketTotals, checkoutTicket } from '../../services/pos3/pos3Service.js'

const PROVIDERS = ['Square', 'Clover', 'Toast', 'Stripe']

export default function POS3Checkout() {
  const [params] = useSearchParams()
  const toast = useToast()
  const tickets = getTickets().filter((t) => t.status !== 'paid')
  const [activeId, setActiveId] = useState(params.get('ticket') || tickets[0]?.id)
  const [paid, setPaid] = useState(false)
  const ticket = tickets.find((t) => t.id === activeId) || tickets[0]

  if (!ticket && !paid) {
    return <Shell><div style={{ display: 'flex' }}><SideNav system="POS3" /><div style={{ flex: 1 }}><TopBar system="POS3" title="Checkout" /><div style={{ padding: 20, color: '#8b95a3' }}>No open tickets to check out.</div></div></div></Shell>
  }

  const totals = ticket ? ticketTotals(ticket) : { subtotal: 0, tax: 0, total: 0 }

  function payManual() {
    checkoutTicket(ticket.id, { method: 'manual', provider: 'local' })
    setPaid(true)
    toast(`${ticket.id} marked paid (local) — E.A.T. notified`)
  }

  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1 }}>
          <TopBar system="POS3" title="Checkout" subtitle={ticket ? `${ticket.id} · ${ticket.tableId}` : 'Complete'} />
          <div style={{ padding: 20, maxWidth: 560 }}>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                <span>Amount Due</span><span style={{ color: GOLD }}>${totals.total.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#8b95a3', marginTop: 4 }}>Subtotal ${totals.subtotal.toFixed(2)} · Tax ${totals.tax.toFixed(2)}</div>
            </Card>

            {paid ? (
              <Card style={{ borderColor: 'rgba(80,200,120,0.5)' }}>
                <Pill label="paid" tone="paid" />
                <div style={{ marginTop: 10 }}>Payment recorded locally and persisted. A TICKET_CHECKED_OUT event was emitted to E.A.T.</div>
              </Card>
            ) : (
              <>
                <Card style={{ marginBottom: 16, borderColor: 'rgba(80,200,120,0.4)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Manual / Local Payment (ready)</div>
                  <div style={{ fontSize: 12, color: '#8b95a3', marginBottom: 12 }}>Marks the ticket paid, persists to localStorage, and emits a real ops event. No external processor.</div>
                  <Btn tone="green" onClick={payManual}>Mark Paid (Cash / Local)</Btn>
                </Card>

                <div style={{ fontSize: 12, color: '#8b95a3', marginBottom: 8 }}>Card processors — not configured in this environment</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {PROVIDERS.map((p) => (
                    <div key={p} title="Not configured in this environment"
                      onClick={() => toast(`${p} — Not configured in this environment`)}
                      style={{ background: PANEL2, opacity: 0.55, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, cursor: 'not-allowed' }}>
                      <div style={{ fontWeight: 600 }}>{p}</div>
                      <div style={{ fontSize: 11, color: '#8b95a3' }}>Not configured</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
