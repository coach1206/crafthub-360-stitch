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

const inputStyle = { minHeight: 56, width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 22, letterSpacing: 4, textAlign: 'center', boxSizing: 'border-box' }
const actionBtn = { minHeight: 48, padding: '10px 20px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD }
const actionBtnDisabled = { ...actionBtn, opacity: 0.35, cursor: 'not-allowed', border: `1.5px solid ${BORDER}`, color: 'rgba(229,226,225,0.4)' }

function genKey(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
function fmtCents(c) { return `$${((c || 0) / 100).toFixed(2)}` }

const requiresPickupCode = (method) => method === 'counter_pickup'

export default function VenueHumidorHandoff() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [venueId] = useAdminVenueId()

  const [state, setState] = useState('loading')
  const [order, setOrder] = useState(null)
  const [generatedCode, setGeneratedCode] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [actionState, setActionState] = useState('idle')
  const [actionError, setActionError] = useState(null)

  async function load() {
    if (!venueId) { setState('no_venue'); return }
    setState('loading')
    const result = await api.getOrderDetail(venueId, orderId)
    if (!result.ok) {
      setState(result.status === 404 ? 'not_found' : result.status === 403 ? 'unauthorized' : result.status === 401 ? 'session_expired' : 'error')
      return
    }
    setOrder(result.order)
    setState('ready')
  }
  useEffect(() => { load() }, [venueId, orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function run(fn) {
    setActionState('running')
    setActionError(null)
    const result = await fn()
    if (!result.ok) { setActionState('failed'); setActionError(result.error); return null }
    setActionState('idle')
    await load()
    return result
  }

  const handleGenerateCode = async () => {
    const result = await run(() => api.generateVerificationCode(venueId, orderId, genKey('gencode')))
    if (result) setGeneratedCode(result.code)
  }
  const handleVerify = () => run(() => api.verifyPickupCode(venueId, orderId, codeInput, genKey('verify')))
  const handleConfirmHandoff = () => run(() => api.confirmHandoff(venueId, orderId, { verificationMethod: requiresPickupCode(order.fulfillment_method) ? 'pickup_code' : 'staff_visual', location, notes }, genKey('handoff')))
  const handleComplete = () => run(() => api.completeFulfillmentOrder(venueId, orderId, genKey('complete')))

  if (state === 'no_venue') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="Set a venue ID on the queue screen first." />
  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading order…" />
  if (state === 'not_found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="This order could not be found, or belongs to a different venue." />
  if (state === 'unauthorized') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="You do not have permission to handle this order." />
  if (state === 'session_expired') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Your session has expired. Please refresh." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this order right now." onRetry={load} />

  const fs = order.fulfillment_status
  if (fs !== 'ready') {
    return (
      <SmokeCraftScreenShell mode="live" status="ready">
        <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, padding: 'clamp(16px,3vw,32px)' }}>
          <button type="button" onClick={() => navigate(`/smokecraft/admin/humidor/orders/${orderId}`)} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>← Back to Order</button>
          {fs === 'completed'
            ? <p role="status" style={{ marginTop: 16, color: OK, fontSize: 16 }}>Order completed.</p>
            : <p style={{ marginTop: 16 }}>This order is not ready for handoff (current status: {fs}).</p>}
        </div>
      </SmokeCraftScreenShell>
    )
  }

  const needsCode = requiresPickupCode(order.fulfillment_method)
  const isVerified = !!order.verified_at
  const isHandedOff = !!order.handoff_at

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 700, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate(`/smokecraft/admin/humidor/orders/${orderId}`)} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>← Back to Order</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>Handoff — Order {order.order_number}</h1>
          <p style={{ fontSize: 13, opacity: 0.75 }}>Fulfillment: {order.fulfillment_method?.replace(/_/g, ' ')} · Total {fmtCents(order.total_cents)}</p>

          {needsCode && !isVerified && (
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
              <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Step 1 — Verify Customer</h2>
              <button type="button" disabled={actionState === 'running'} onClick={handleGenerateCode} style={actionBtn}>Generate Pickup Code</button>
              {generatedCode && (
                <p role="status" style={{ marginTop: 10, fontSize: 20, letterSpacing: 4, color: OK }}>Code: {generatedCode}</p>
              )}
              <label htmlFor="codeInput" style={{ display: 'block', fontSize: 12, marginTop: 12, marginBottom: 4 }}>Enter the code the customer provides</label>
              <input id="codeInput" aria-label="Pickup verification code" inputMode="numeric" maxLength={6} value={codeInput} onChange={e => setCodeInput(e.target.value.replace(/\D/g, ''))} style={inputStyle} />
              <button type="button" disabled={actionState === 'running' || codeInput.length !== 6} onClick={handleVerify}
                style={{ ...(codeInput.length === 6 ? actionBtn : actionBtnDisabled), marginTop: 10, width: '100%' }}>Verify Code</button>
            </div>
          )}

          {(!needsCode || isVerified) && (
            <div style={{ background: GLASS, border: `1px solid ${OK}`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
              {needsCode && <p style={{ color: OK, fontSize: 13 }}>Customer verified ✓</p>}
              <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Step 2 — Confirm Handoff</h2>
              {!isHandedOff && (
                <>
                  <label htmlFor="handoffLocation" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Service location (optional)</label>
                  <input id="handoffLocation" value={location} onChange={e => setLocation(e.target.value)} placeholder="Table 4 / Lounge Seat 2 / Counter"
                    style={{ minHeight: 44, width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
                  <label htmlFor="handoffNotes" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Handoff notes (optional)</label>
                  <textarea id="handoffNotes" value={notes} onChange={e => setNotes(e.target.value)}
                    style={{ width: '100%', minHeight: 50, padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
                  <button type="button" disabled={actionState === 'running'} onClick={handleConfirmHandoff} style={{ ...actionBtn, width: '100%' }}>Confirm Handoff</button>
                </>
              )}
              {isHandedOff && <p style={{ color: OK, fontSize: 13 }}>Handoff confirmed ✓ by {order.handoff_staff_id} at {new Date(order.handoff_at).toLocaleString()}</p>}
            </div>
          )}

          {isHandedOff && (
            <button type="button" disabled={actionState === 'running'} onClick={handleComplete} style={{ minHeight: 48, width: '100%', padding: '12px 20px', borderRadius: 20, border: `1.5px solid ${OK}`, background: 'transparent', color: OK, cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}>
              {actionState === 'running' ? 'Completing…' : 'Complete Order'}
            </button>
          )}

          {actionState === 'failed' && (
            <p role="alert" style={{ color: DANGER, fontSize: 12, marginTop: 12 }}>
              {actionError === 'verification_failed' ? 'That code is incorrect.' :
               actionError === 'verification_failed_order_blocked' ? 'Too many incorrect attempts — this order is now blocked.' :
               actionError === 'verification_code_expired' ? 'This code has expired. Generate a new one.' :
               actionError === 'verification_rate_limited' ? 'Too many attempts — this order is blocked.' :
               actionError === 'verification_required' ? 'Verify the customer before confirming handoff.' :
               actionError === 'handoff_required' ? 'Confirm handoff before completing.' :
               actionError === 'insufficient_inventory' ? 'Real inventory is no longer sufficient to complete this order.' :
               `Action failed: ${actionError}`}
            </p>
          )}

          {order.status === 'completed' && (
            <p role="status" style={{ color: OK, fontSize: 16, marginTop: 16 }}>Order completed.</p>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
