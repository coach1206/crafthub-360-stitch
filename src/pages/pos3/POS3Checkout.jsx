import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Pill, Btn, useToast } from '../../components/eat/ui.jsx'
import { LightShell, LightHeader, LightCard, LightBottomNav, L_NAVY, L_GOLD } from '../../components/eat/lightTheme.jsx'
import { getOpenTickets, closeTicket, cashoutTicket } from '../../services/pos3/orderService.js'
import { calcTotals, completeCashPayment, completeCardPayment, completeSplitPayment } from '../../services/pos3/paymentService.js'
import { buildReceipt } from '../../services/pos3/receiptService.js'
import { recordInventoryImpact } from '../../services/pos3/inventoryImpactService.js'

const PROVIDERS = ['Square', 'Clover', 'Toast', 'Stripe']
const TIP_PRESETS = [0, 15, 18, 20]

export default function POS3Checkout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const tickets = getOpenTickets()
  const [activeId, setActiveId] = useState(params.get('ticket') || tickets[0]?.id)
  const [paid, setPaid] = useState(false)
  const [tipPct, setTipPct] = useState(0)
  const [customTip, setCustomTip] = useState('')
  const [cashTendered, setCashTendered] = useState('')
  const [lastResult, setLastResult] = useState(null)
  const ticket = tickets.find((t) => t.id === activeId) || tickets[0]

  if (!ticket && !paid) {
    return (
      <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 84 }}>
        <LightHeader eyebrow="POS 3" title="Checkout" />
        <div style={{ padding: 20, color: '#8b95a3' }}>No open tickets to check out.</div>
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

  const subtotalNoTip = ticket ? calcTotals(ticket, 0).subtotal : 0
  const tipAmount = customTip !== '' ? Number(customTip) || 0 : +(subtotalNoTip * (tipPct / 100)).toFixed(2)
  const totals = ticket ? calcTotals(ticket, tipAmount) : { subtotal: 0, tax: 0, tip: 0, total: 0 }
  const tenderedNum = Number(cashTendered) || 0
  const changeDuePreview = Math.max(0, +(tenderedNum - totals.total).toFixed(2))

  function payCash() {
    const result = completeCashPayment(ticket.id, cashTendered, tipAmount, ticket)
    if (!result.success) {
      toast(result.error || 'Cash tendered is less than the total due.')
      return
    }
    cashoutTicket(ticket.id)
    const receipt = buildReceipt(ticket, { ...result, tenderType: 'cash' })
    recordInventoryImpact(ticket)
    setLastResult({ ...result, receipt })
    setPaid(true)
    toast(`${ticket.id} paid — change due $${result.changeDue.toFixed(2)} — receipt ${receipt.id}`)
  }

  function tryCard(provider) {
    const result = completeCardPayment(ticket.id, provider)
    toast(result.error)
  }

  function trySplit() {
    const result = completeSplitPayment(ticket.id)
    toast(result.error)
  }

  return (
    <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 84 }}>
      <LightHeader eyebrow="POS 3" title="Checkout" subtitle={ticket ? `${ticket.id} · ${ticket.tableId || ''}` : 'Complete'} />
      <div style={{ padding: '14px 16px 0' }}>
        {!paid && tickets.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {tickets.map((t) => (
              <button key={t.id} onClick={() => setActiveId(t.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: t.id === ticket.id ? L_GOLD : '#eceae3', color: t.id === ticket.id ? '#1c2230' : '#4a5266', fontSize: 12, fontWeight: 600 }}>{t.id}</button>
            ))}
          </div>
        )}

        {!paid && ticket && (
          <LightCard style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: L_NAVY }}>Items</div>
            {ticket.items.map((i) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(19,41,75,0.06)', fontSize: 13, color: L_NAVY }}>
                <span>{i.qty}× {i.name}</span>
                <span style={{ color: '#9c7320', fontWeight: 700 }}>${(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </LightCard>
        )}

        <LightCard style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17, color: L_NAVY }}>
            <span>Amount Due</span><span style={{ color: '#9c7320' }}>${totals.total.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 4 }}>Subtotal ${totals.subtotal.toFixed(2)} · Tax ${totals.tax.toFixed(2)} · Tip ${totals.tip.toFixed(2)}</div>
        </LightCard>

        {paid ? (
          <LightCard style={{ padding: 14, borderColor: 'rgba(46,160,90,0.4)' }}>
            <Pill label="paid" tone="paid" />
            <div style={{ marginTop: 10, fontSize: 13, color: L_NAVY }}>
              Payment recorded locally and persisted. Ticket closed, receipt {lastResult?.receipt?.id} created,
              inventory impact recorded, and POS_PAYMENT_COMPLETED / POS_TICKET_CLOSED / EAT_REVENUE_EVENT_CREATED events were emitted to E.A.T.
            </div>
            {lastResult && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#6b7385' }}>Change due: ${lastResult.changeDue.toFixed(2)}</div>
            )}
          </LightCard>
        ) : (
          <>
            <LightCard style={{ padding: 14, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: L_NAVY }}>Tip</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {TIP_PRESETS.map((p) => (
                  <button key={p} onClick={() => { setTipPct(p); setCustomTip('') }} style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600,
                    background: tipPct === p && customTip === '' ? L_GOLD : '#eceae3', color: tipPct === p && customTip === '' ? '#1c2230' : '#4a5266',
                  }}>{p}%</button>
                ))}
              </div>
              <input
                type="number" placeholder="Custom tip $" value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(19,41,75,0.15)', background: '#fff', color: L_NAVY, width: 160 }}
              />
            </LightCard>

            <LightCard style={{ padding: 14, marginBottom: 14, borderColor: 'rgba(46,160,90,0.35)' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13, color: L_NAVY }}>Cash Payment (ready)</div>
              <div style={{ fontSize: 11, color: '#8b95a3', marginBottom: 12 }}>Enter cash tendered, see change due live, then complete payment locally. No external processor.</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <input
                  type="number" placeholder="Cash tendered" value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(19,41,75,0.15)', background: '#fff', color: L_NAVY, width: 160 }}
                />
                <span style={{ fontSize: 12, color: '#6b7385' }}>Change due: <strong style={{ color: '#9c7320' }}>${changeDuePreview.toFixed(2)}</strong></span>
              </div>
              <Btn tone="green" onClick={payCash} style={{ width: '100%' }}>Complete Payment (Cash)</Btn>
            </LightCard>

            <div style={{ fontSize: 11, color: '#8b95a3', marginBottom: 8 }}>Card processors — not configured in this environment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {PROVIDERS.map((p) => (
                <div key={p} title="Not configured in this environment"
                  onClick={() => tryCard(p)}
                  style={{ background: '#eceae3', opacity: 0.7, border: '1px dashed rgba(19,41,75,0.2)', borderRadius: 12, padding: 14, cursor: 'not-allowed' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: L_NAVY }}>{p}</div>
                  <div style={{ fontSize: 11, color: '#8b95a3' }}>Not configured</div>
                </div>
              ))}
            </div>

            <div
              title="Coming soon"
              onClick={trySplit}
              style={{ background: '#eceae3', opacity: 0.7, border: '1px dashed rgba(19,41,75,0.2)', borderRadius: 12, padding: 14, cursor: 'not-allowed', marginBottom: 16 }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: L_NAVY }}>Split Payment</div>
              <div style={{ fontSize: 11, color: '#8b95a3' }}>Coming soon — not configured</div>
            </div>
          </>
        )}
      </div>
      <LightBottomNav items={[
        { label: 'Home', icon: 'home', onClick: () => navigate('/pos3') },
        { label: 'Tables', icon: 'table_restaurant', onClick: () => navigate('/pos3/tables') },
        { label: 'Orders', icon: 'receipt_long', onClick: () => navigate('/pos3/orders') },
        { label: 'Messages', icon: 'chat', disabled: true, disabledReason: 'Staff messaging is not yet built' },
        { label: 'More', icon: 'more_horiz', onClick: () => navigate('/pos3/settings') },
      ]} />
    </LightShell>
  )
}
