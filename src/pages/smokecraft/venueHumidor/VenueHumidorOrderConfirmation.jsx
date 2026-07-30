import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSmokeCraftJourney } from '../../../context/SmokeCraftJourneyContext.jsx'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

const STATUS_COPY = {
  draft: { label: 'Draft', color: 'rgba(229,226,225,0.6)', next: 'This order has not been finalized yet.' },
  pending_payment: { label: 'Pending Confirmation', color: GOLD, next: 'Awaiting staff confirmation. Payment processing is not connected — please see staff to complete payment.' },
  completed: { label: 'Completed', color: OK, next: 'Your order is confirmed. Thank you.' },
  cancelled: { label: 'Cancelled', color: DANGER, next: 'This order was cancelled.' },
  refunded: { label: 'Refunded', color: DANGER, next: 'This order was cancelled and refunded.' },
}

function fmtCents(c) { return `$${((c || 0) / 100).toFixed(2)}` }

export default function VenueHumidorOrderConfirmation() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { journey } = useSmokeCraftJourney()
  const venueId = (journey.selectedVenue && !journey.selectedVenue.skipped) ? journey.selectedVenue.id : null

  const [state, setState] = useState('loading')
  const [order, setOrder] = useState(null)
  const [cancelState, setCancelState] = useState('idle')

  async function load() {
    if (!venueId) { setState('no_venue'); return }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState('offline'); return }
    setState('loading')
    const result = await api.getOrder(venueId, orderId)
    if (!result.ok) {
      setState(result.status === 404 ? 'not_found' : result.status === 401 ? 'session_expired' : 'error')
      return
    }
    setOrder(result.order)
    setState('ready')
  }
  useEffect(() => { load() }, [venueId, orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel() {
    setCancelState('cancelling')
    const idempotencyKey = `gb-vh-cancel-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const result = await api.cancelOrder(venueId, orderId, idempotencyKey)
    if (!result.ok) { setCancelState('failed'); return }
    setCancelState('cancelled')
    await load()
  }

  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading order…" />
  if (state === 'offline') return <SmokeCraftScreenShell mode="live" status="offline" onRetry={load} />
  if (state === 'no_venue') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="Select a venue first." />
  if (state === 'not_found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="This order could not be found." />
  if (state === 'session_expired') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Your session has expired. Please refresh." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this order right now." onRetry={load} />

  const statusCopy = STATUS_COPY[order.status] || STATUS_COPY.draft
  const snapshot = order.product_snapshot || {}

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 700, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/venue-humidor')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back to Humidor</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>Order {order.order_number}</h1>

          <div style={{ background: GLASS, border: `1px solid ${statusCopy.color}`, borderRadius: 10, padding: 16, margin: '12px 0' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: statusCopy.color }}>Order Status</div>
            <div style={{ fontSize: 18, color: statusCopy.color, margin: '4px 0' }}>{statusCopy.label}</div>
            <p style={{ fontSize: 13 }}>{statusCopy.next}</p>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gap: 6, fontSize: 13 }}>
            <div><strong>{snapshot.name}</strong> — {snapshot.brand}</div>
            <div>Quantity: {order.items?.[0]?.quantity ?? 1}</div>
            <div>Fulfillment: {order.fulfillment_method?.replace(/_/g, ' ')}</div>
            {order.fulfillment_details?.tableOrSeat && <div>Table/Seat: {order.fulfillment_details.tableOrSeat}</div>}
            {order.customer_notes && <div>Notes: {order.customer_notes}</div>}
            <div>Payment status: {order.payment_status?.replace(/_/g, ' ')}</div>
            <div>Total: {fmtCents(order.total_cents)}</div>
            <div>Created: {order.created_at ? new Date(order.created_at).toLocaleString() : ''}</div>
          </div>

          {order.status === 'pending_payment' && (
            <div>
              <button type="button" disabled={cancelState === 'cancelling'} onClick={handleCancel}
                style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${DANGER}`, background: 'transparent', color: DANGER, cursor: 'pointer', fontFamily: 'inherit' }}>
                {cancelState === 'cancelling' ? 'Cancelling…' : 'Cancel Order'}
              </button>
              {cancelState === 'failed' && <p role="alert" style={{ color: DANGER, fontSize: 12, marginTop: 8 }}>Unable to cancel right now.</p>}
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
