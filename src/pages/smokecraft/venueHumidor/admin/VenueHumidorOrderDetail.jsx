import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../../../services/venueHumidor/venueHumidorAdminApiClient.js'
import SmokeCraftScreenShell from '../../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { useAdminVenueId } from './useAdminVenueId.js'

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
function genKey(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

const actionBtn = { minHeight: 44, padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD }
const actionBtnDisabled = { ...actionBtn, opacity: 0.35, cursor: 'not-allowed', borderColor: BORDER, color: 'rgba(229,226,225,0.4)' }

export default function VenueHumidorOrderDetail() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [venueId] = useAdminVenueId()

  const [state, setState] = useState('loading')
  const [order, setOrder] = useState(null)
  const [actionState, setActionState] = useState('idle')
  const [actionError, setActionError] = useState(null)
  const [note, setNote] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)

  async function load() {
    if (!venueId) { setState('no_venue'); return }
    setState('loading')
    const result = await api.getOrderDetail(venueId, orderId)
    if (!result.ok) {
      setState(
        result.status === 404 ? 'not_found' :
        result.status === 403 ? 'unauthorized' :
        result.status === 401 ? 'session_expired' : 'error'
      )
      return
    }
    setOrder(result.order)
    setState('ready')
  }
  useEffect(() => { load() }, [venueId, orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function runAction(label, fn) {
    setActionState('running')
    setActionError(null)
    const result = await fn()
    if (!result.ok) { setActionState('failed'); setActionError(result.error); return }
    setActionState('idle')
    await load()
  }

  const handleClaim = () => runAction('claim', () => api.claimOrder(venueId, orderId, genKey('claim')))
  const handleConfirm = () => runAction('confirm', () => api.confirmOrder(venueId, orderId, genKey('confirm')))
  const handlePrepare = () => runAction('prepare', () => api.startPreparation(venueId, orderId, genKey('prepare')))
  const handleReady = () => runAction('ready', () => api.markReady(venueId, orderId, genKey('ready')))
  const handlePick = (itemId) => runAction('pick', () => api.markItemPicked(venueId, orderId, itemId, genKey('pick')))
  const handleComplete = () => runAction('complete', () => api.completeFulfillmentOrder(venueId, orderId, genKey('complete')))
  const handleAddNote = () => { if (!note.trim()) return; runAction('note', () => api.addFulfillmentNote(venueId, orderId, note.trim(), genKey('note'))); setNote('') }
  const handleCancel = () => {
    if (!cancelReason.trim()) { setActionState('failed'); setActionError('cancellation_reason_required'); return }
    runAction('cancel', () => api.cancelFulfillmentOrder(venueId, orderId, cancelReason.trim(), genKey('cancel')))
    setShowCancelForm(false)
    setCancelReason('')
  }

  if (state === 'no_venue') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="Set a venue ID on the queue screen first." />
  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading order…" />
  if (state === 'not_found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="This order could not be found, or belongs to a different venue." />
  if (state === 'unauthorized') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="You do not have permission to view this order." />
  if (state === 'session_expired') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Your session has expired. Please refresh." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this order right now." onRetry={load} />

  const fs = order.fulfillment_status
  const canClaim = !order.assigned_staff_id && ['new', 'awaiting_confirmation', 'confirmed', 'in_preparation'].includes(fs)
  const canConfirm = fs === 'new' || fs === 'awaiting_confirmation'
  const canPrepare = fs === 'confirmed'
  const canPick = fs === 'confirmed' || fs === 'in_preparation'
  const allPicked = order.items.every(i => i.is_picked)
  const canReady = fs === 'in_preparation' && allPicked
  const canComplete = fs === 'ready'
  const canCancel = ['new', 'awaiting_confirmation', 'confirmed', 'in_preparation', 'ready'].includes(fs)

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/admin/humidor/orders')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>← Back to Queue</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>Order {order.order_number}</h1>

          <div style={{ background: GLASS, border: `1px solid ${STATUS_COLOR[fs]}`, borderRadius: 10, padding: 16, margin: '12px 0' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: STATUS_COLOR[fs] }}>Fulfillment Status</div>
            <div style={{ fontSize: 18, color: STATUS_COLOR[fs] }}>{STATUS_LABEL[fs] || fs}</div>
            <p style={{ fontSize: 12 }}>Order status: {order.status} · Payment: {order.payment_status?.replace(/_/g, ' ')}</p>
            <p style={{ fontSize: 12 }}>Assigned: {order.assigned_staff_id || 'Unassigned'}{order.assigned_staff_id ? ` (v${order.assignment_version})` : ''}</p>
            {order.cancellation_reason && <p style={{ fontSize: 12, color: DANGER }}>Cancellation reason: {order.cancellation_reason}</p>}
            {order.blocked_reason && <p style={{ fontSize: 12, color: DANGER }}>Blocked: {order.blocked_reason}</p>}
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gap: 6, fontSize: 13 }}>
            <div>Customer: {order.customer_reference}</div>
            <div>Fulfillment method: {order.fulfillment_method?.replace(/_/g, ' ')}</div>
            {order.fulfillment_details?.tableOrSeat && <div>Table/Seat: {order.fulfillment_details.tableOrSeat}</div>}
            {order.customer_notes && <div>Customer notes: {order.customer_notes}</div>}
            <div>Created: {new Date(order.created_at).toLocaleString()}</div>
            {order.ready_at && <div>Ready at: {new Date(order.ready_at).toLocaleString()}</div>}
            {order.completed_at && <div>Completed at: {new Date(order.completed_at).toLocaleString()}</div>}
            {order.cancelled_at && <div>Cancelled at: {new Date(order.cancelled_at).toLocaleString()}</div>}
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 10px' }}>Items</h2>
            {order.items.map(item => (
              <div key={item.order_item_id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  {item.primary_image_url && <img src={item.primary_image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, fontSize: 12 }}>
                  <div><strong>{item.brand}</strong> — {item.product_name}</div>
                  <div style={{ opacity: 0.7 }}>SKU {item.sku} · {item.vitola} · {item.strength} · Qty {item.quantity} · {fmtCents(item.line_total_cents)}</div>
                  <div style={{ opacity: 0.7 }}>Available: {item.availability?.availableQuantity} · Zone: {item.humidor_zone || '—'}</div>
                </div>
                {item.is_picked
                  ? <span style={{ color: OK, fontSize: 12 }}>Picked ✓</span>
                  : <button type="button" disabled={!canPick || actionState === 'running'} onClick={() => handlePick(item.order_item_id)}
                      style={canPick ? actionBtn : actionBtnDisabled}>Mark Picked</button>}
              </div>
            ))}
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gap: 6, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{fmtCents(order.subtotal_cents)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>{fmtCents(order.tax_cents)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: GOLD, fontSize: 16 }}><span>Total</span><span>{fmtCents(order.total_cents)}</span></div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button type="button" disabled={!canClaim || actionState === 'running'} onClick={handleClaim} style={canClaim ? actionBtn : actionBtnDisabled}>Claim Order</button>
            <button type="button" disabled={!canConfirm || actionState === 'running'} onClick={handleConfirm} style={canConfirm ? actionBtn : actionBtnDisabled}>Confirm Order</button>
            <button type="button" disabled={!canPrepare || actionState === 'running'} onClick={handlePrepare} style={canPrepare ? actionBtn : actionBtnDisabled}>Start Preparation</button>
            <button type="button" disabled={!canReady || actionState === 'running'} onClick={handleReady} style={canReady ? actionBtn : actionBtnDisabled} title={!allPicked ? 'All items must be picked first' : ''}>Mark Ready</button>
            <button type="button" disabled={!canComplete || actionState === 'running'} onClick={handleComplete} style={canComplete ? { ...actionBtn, borderColor: OK, color: OK } : actionBtnDisabled}>Complete Order</button>
            {canCancel && !showCancelForm && (
              <button type="button" onClick={() => setShowCancelForm(true)} style={{ ...actionBtn, borderColor: DANGER, color: DANGER }}>Cancel Order</button>
            )}
          </div>

          {showCancelForm && (
            <div style={{ background: GLASS, border: `1px solid ${DANGER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <label htmlFor="cancelReason" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Cancellation reason (required)</label>
              <textarea id="cancelReason" value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' }} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button type="button" disabled={actionState === 'running'} onClick={handleCancel} style={{ ...actionBtn, borderColor: DANGER, color: DANGER }}>Confirm Cancellation</button>
                <button type="button" onClick={() => setShowCancelForm(false)} style={{ ...actionBtn }}>Back</button>
              </div>
            </div>
          )}

          {actionState === 'failed' && (
            <p role="alert" style={{ color: DANGER, fontSize: 12, marginBottom: 12 }}>
              {actionError === 'already_claimed' ? 'This order was already claimed by another staff member.' :
               actionError === 'stale_version' ? 'Someone else updated this order first — refreshed.' :
               actionError === 'items_not_picked' ? 'All items must be marked picked before this order can be marked ready.' :
               actionError === 'insufficient_inventory' ? 'Real inventory is no longer sufficient to complete this order.' :
               actionError === 'cancellation_reason_required' ? 'A cancellation reason is required.' :
               `Action failed: ${actionError}`}
            </p>
          )}

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
            <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Add Staff Note</h2>
            <textarea aria-label="Staff note" value={note} onChange={e => setNote(e.target.value)}
              style={{ width: '100%', minHeight: 50, padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' }} />
            <button type="button" disabled={!note.trim() || actionState === 'running'} onClick={handleAddNote} style={note.trim() ? { ...actionBtn, marginTop: 8 } : { ...actionBtnDisabled, marginTop: 8 }}>Add Note</button>
          </div>
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
