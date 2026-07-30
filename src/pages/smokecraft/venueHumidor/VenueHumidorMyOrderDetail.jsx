import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

const STATUS_LABEL = {
  new: 'New', awaiting_confirmation: 'Awaiting Confirmation', confirmed: 'Confirmed',
  in_preparation: 'In Preparation', ready: 'Ready', completed: 'Completed',
  cancelled: 'Cancelled', expired: 'Expired', blocked: 'Blocked',
}
const STATUS_COLOR = {
  new: CREAM, awaiting_confirmation: GOLD, confirmed: GOLD, in_preparation: GOLD,
  ready: OK, completed: OK, cancelled: DANGER, expired: DANGER, blocked: DANGER,
}

function fmtCents(c) { return `$${((c || 0) / 100).toFixed(2)}` }

export default function VenueHumidorMyOrderDetail() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [state, setState] = useState('loading')
  const [order, setOrder] = useState(null)

  async function load() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState('offline'); return }
    setState('loading')
    const result = await api.getMyOrderDetail(orderId)
    if (!result.ok) {
      setState(result.status === 404 ? 'not_found' : result.status === 403 ? 'unauthorized' : result.status === 401 ? 'session_expired' : 'error')
      return
    }
    setOrder(result.order)
    setState('ready')
  }
  useEffect(() => { load() }, [orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'offline') return <SmokeCraftScreenShell mode="live" status="offline" onRetry={load} />
  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading order…" />
  if (state === 'not_found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="This order could not be found." />
  if (state === 'unauthorized') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="This order does not belong to your account." />
  if (state === 'session_expired') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Your session has expired. Please refresh." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this order right now." onRetry={load} />

  const fs = order.fulfillment_status
  const receiptEligible = ['completed', 'cancelled', 'refunded'].includes(order.status)

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 700, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/orders')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>← Back to My Orders</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>Order {order.order_number}</h1>
          <p style={{ fontSize: 13, opacity: 0.75 }}>{order.venue_name}{order.venue_address ? ` — ${order.venue_address}` : ''}</p>

          <div style={{ background: GLASS, border: `1px solid ${STATUS_COLOR[fs]}`, borderRadius: 10, padding: 16, margin: '12px 0' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: STATUS_COLOR[fs] }}>Status</div>
            <div style={{ fontSize: 18, color: STATUS_COLOR[fs] }}>{STATUS_LABEL[fs] || fs}</div>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gap: 6, fontSize: 13 }}>
            <div>Ordered: {new Date(order.created_at).toLocaleString()}</div>
            <div>Fulfillment: {order.fulfillment_method?.replace(/_/g, ' ')}</div>
            {order.fulfillment_details?.tableOrSeat && <div>Location: {order.fulfillment_details.tableOrSeat}</div>}
            {order.ready_at && <div>Ready: {new Date(order.ready_at).toLocaleString()}</div>}
            {order.handoff_at && <div>Handed off: {new Date(order.handoff_at).toLocaleString()}</div>}
            {order.completed_at && <div>Completed: {new Date(order.completed_at).toLocaleString()}</div>}
            {order.cancelled_at && <div>Cancelled: {new Date(order.cancelled_at).toLocaleString()}</div>}
            {order.customer_notes && <div>Your notes: {order.customer_notes}</div>}
            <div>Payment: {order.payment_status?.replace(/_/g, ' ')}</div>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 10px' }}>Items</h2>
            {order.items.map(item => (
              <div key={item.order_item_id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  {item.primary_image_url && <img src={item.primary_image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, fontSize: 12 }}>
                  <div><strong>{item.brand}</strong> — {item.product_name}</div>
                  <div style={{ opacity: 0.7 }}>{item.country} · {item.vitola} · {item.strength} · Qty {item.quantity} · {fmtCents(item.line_total_cents)}</div>
                  {item.is_archived && <div style={{ color: DANGER, fontSize: 11 }}>No longer carried</div>}
                  {!item.is_archived && !item.is_customer_visible && <div style={{ color: DANGER, fontSize: 11 }}>Currently hidden</div>}
                  {!item.is_archived && item.is_customer_visible && !item.reorderEligible && <div style={{ color: DANGER, fontSize: 11 }}>Out of stock</div>}
                  {item.passportAcquisitionId && <div style={{ color: OK, fontSize: 11 }}>✓ In your Passport</div>}
                </div>
                <button type="button" disabled={!item.reorderEligible} onClick={() => navigate(`/smokecraft/venue-humidor/${item.product_id}`)}
                  style={{ minHeight: 36, padding: '6px 14px', borderRadius: 16, border: `1px solid ${item.reorderEligible ? GOLD : BORDER}`, background: 'transparent', color: item.reorderEligible ? GOLD : 'rgba(229,226,225,0.4)', cursor: item.reorderEligible ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 11 }}>
                  Reorder
                </button>
              </div>
            ))}
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gap: 6, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{fmtCents(order.subtotal_cents)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>{fmtCents(order.tax_cents)}</span></div>
            {order.tip_cents > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tip</span><span>{fmtCents(order.tip_cents)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: GOLD, fontSize: 16 }}><span>Total</span><span>{fmtCents(order.total_cents)}</span></div>
          </div>

          {receiptEligible
            ? <button type="button" onClick={() => navigate(`/smokecraft/orders/${orderId}/receipt`)} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>View Receipt</button>
            : <p style={{ fontSize: 12, opacity: 0.6 }}>A receipt will be available once this order is completed.</p>}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
