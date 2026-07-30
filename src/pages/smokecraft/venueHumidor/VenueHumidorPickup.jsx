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

const FULFILLMENT_LABEL = {
  counter_pickup: 'Customer Pickup at Counter', table_delivery: 'Table Delivery',
  lounge_seat_delivery: 'Lounge Seat Delivery', pos_tab_existing: 'Added to Venue Tab', pos_tab_new: 'New Venue Tab',
}

const FULFILLMENT_STATUS_COPY = {
  new: { label: 'Order Received', color: CREAM, message: 'Staff will confirm your order shortly.' },
  awaiting_confirmation: { label: 'Awaiting Confirmation', color: GOLD, message: 'Staff will confirm your order shortly.' },
  confirmed: { label: 'Confirmed', color: GOLD, message: 'Your order has been confirmed and is being prepared.' },
  in_preparation: { label: 'In Preparation', color: GOLD, message: 'Your cigar is being prepared for you.' },
  ready: { label: 'Ready', color: OK, message: 'Your order is ready. Please see staff for pickup or service.' },
  completed: { label: 'Completed', color: OK, message: 'This order has been completed. Thank you.' },
  cancelled: { label: 'Cancelled', color: DANGER, message: 'This order was cancelled.' },
  expired: { label: 'Expired', color: DANGER, message: 'This order expired before pickup and is no longer active.' },
  blocked: { label: 'Needs Attention', color: DANGER, message: 'Please see staff at the counter — this order needs a quick check before it can be completed.' },
}

function fmtCents(c) { return `$${((c || 0) / 100).toFixed(2)}` }

export default function VenueHumidorPickup() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { journey } = useSmokeCraftJourney()
  const venueId = (journey.selectedVenue && !journey.selectedVenue.skipped) ? journey.selectedVenue.id : null
  const venueName = journey.selectedVenue?.name

  const [state, setState] = useState('loading')
  const [order, setOrder] = useState(null)

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
  useEffect(() => {
    if (state !== 'ready' || !order || ['completed', 'cancelled', 'expired'].includes(order.fulfillment_status)) return
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [state, order?.fulfillment_status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading your order…" />
  if (state === 'offline') return <SmokeCraftScreenShell mode="live" status="offline" onRetry={load} />
  if (state === 'no_venue') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="Select a venue first." />
  if (state === 'not_found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="This order could not be found." />
  if (state === 'session_expired') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Your session has expired. Please refresh." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this order right now." onRetry={load} />

  const copy = FULFILLMENT_STATUS_COPY[order.fulfillment_status] || FULFILLMENT_STATUS_COPY.new
  const snapshot = order.product_snapshot || {}

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 700, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/venue-humidor')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back to Humidor</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>Order {order.order_number}</h1>
          {venueName && <p style={{ fontSize: 13, opacity: 0.75 }}>{venueName}</p>}

          <div style={{ background: GLASS, border: `1px solid ${copy.color}`, borderRadius: 10, padding: 16, margin: '12px 0' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: copy.color }}>Status</div>
            <div style={{ fontSize: 18, color: copy.color, margin: '4px 0' }}>{copy.label}</div>
            <p style={{ fontSize: 13 }}>{copy.message}</p>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gap: 6, fontSize: 13 }}>
            <div><strong>{snapshot.name}</strong> — {snapshot.brand}</div>
            <div>Quantity: {order.items?.[0]?.quantity ?? 1}</div>
            <div>Fulfillment: {FULFILLMENT_LABEL[order.fulfillment_method] || order.fulfillment_method}</div>
            {order.fulfillment_details?.tableOrSeat && <div>Table/Seat: {order.fulfillment_details.tableOrSeat}</div>}
            <div>Total: {fmtCents(order.total_cents)}</div>
            <div>Ordered: {order.created_at ? new Date(order.created_at).toLocaleString() : ''}</div>
            {order.ready_at && <div>Ready since: {new Date(order.ready_at).toLocaleString()}</div>}
            {order.completed_at && <div>Completed: {new Date(order.completed_at).toLocaleString()}</div>}
          </div>

          {order.fulfillment_status === 'ready' && order.fulfillment_method === 'counter_pickup' && order.hasActivePickupCode && (
            <div style={{ background: GLASS, border: `1px solid ${GOLD}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 13 }}>Please see a staff member at the counter with your order number to complete verification and pick up your order.</p>
            </div>
          )}

          {order.fulfillment_status === 'blocked' && (
            <div style={{ background: GLASS, border: `1px solid ${DANGER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: DANGER }}>We need to verify a detail before completing this order. Please speak with a staff member.</p>
            </div>
          )}

          {order.fulfillment_status === 'expired' && (
            <div style={{ background: GLASS, border: `1px solid ${DANGER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: DANGER }}>This order's pickup window has passed. Please contact the venue if you still want this order.</p>
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
