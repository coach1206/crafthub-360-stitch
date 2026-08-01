/**
 * Real Payment Gateway Integration — Production Package 2 of 7.
 * Staff/admin payments list, refund action, webhook-event audit
 * trail, dispute records, and manual reconciliation trigger. Same
 * RBAC-enforced admin conventions as every other Venue Humidor admin
 * screen (VenueHumidorFulfillmentHistory.jsx) — server enforces
 * requireVenueRole on every route; this page never fakes a control
 * that isn't backend-connected.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../../../services/venueHumidor/venueHumidorAdminApiClient.js'
import SmokeCraftScreenShell from '../../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { useAdminVenueId } from './useAdminVenueId.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

const inputStyle = { minHeight: 40, padding: '6px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 12 }
const tabStyle = (active) => ({ minHeight: 36, padding: '6px 14px', borderRadius: 16, border: `1.5px solid ${active ? GOLD : BORDER}`, background: 'transparent', color: active ? GOLD : CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 })

function fmtCents(c) { return `$${((c || 0) / 100).toFixed(2)}` }

export default function VenueHumidorAdminPayments() {
  const navigate = useNavigate()
  const [venueId] = useAdminVenueId()
  const [tab, setTab] = useState('payments')
  const [state, setState] = useState('loading')
  const [payments, setPayments] = useState([])
  const [webhookEvents, setWebhookEvents] = useState([])
  const [disputes, setDisputes] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [refundOrderId, setRefundOrderId] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundResult, setRefundResult] = useState(null)
  const [reconcileResult, setReconcileResult] = useState(null)

  async function load() {
    if (!venueId) { setState('no_venue'); return }
    setState('loading')
    if (tab === 'payments') {
      const result = await api.listPayments(venueId, { status: statusFilter })
      if (!result.ok) { setState(result.status === 403 ? 'unauthorized' : 'error'); return }
      setPayments(result.payments); setState('ready')
    } else if (tab === 'webhooks') {
      const result = await api.listWebhookEvents(venueId)
      if (!result.ok) { setState(result.status === 403 ? 'unauthorized' : 'error'); return }
      setWebhookEvents(result.events); setState('ready')
    } else if (tab === 'disputes') {
      const result = await api.listDisputes(venueId)
      if (!result.ok) { setState(result.status === 403 ? 'unauthorized' : 'error'); return }
      setDisputes(result.disputes); setState('ready')
    } else {
      setState('ready')
    }
  }
  useEffect(() => { load() }, [venueId, tab, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRefund() {
    setRefundResult(null)
    const idempotencyKey = `gb-vh-refund-${refundOrderId}-${Date.now()}`
    const result = await api.refundOrderPayment(venueId, refundOrderId, {
      amountCents: refundAmount ? Math.round(Number(refundAmount) * 100) : undefined,
      reason: refundReason, idempotencyKey,
    })
    setRefundResult(result.ok ? { ok: true, ...result } : { ok: false, error: result.error })
    if (result.ok) load()
  }

  async function handleReconcile() {
    setReconcileResult(null)
    const result = await api.runPaymentReconciliation(venueId)
    setReconcileResult(result.ok ? { ok: true, ...result.run } : { ok: false, error: result.error })
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/admin/humidor/orders')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back to Queue</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 12px' }}>Payments Admin</h1>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button type="button" style={tabStyle(tab === 'payments')} onClick={() => setTab('payments')}>Payments</button>
            <button type="button" style={tabStyle(tab === 'refund')} onClick={() => setTab('refund')}>Refund</button>
            <button type="button" style={tabStyle(tab === 'webhooks')} onClick={() => setTab('webhooks')}>Webhook Events</button>
            <button type="button" style={tabStyle(tab === 'disputes')} onClick={() => setTab('disputes')}>Disputes</button>
            <button type="button" style={tabStyle(tab === 'reconcile')} onClick={() => setTab('reconcile')}>Reconciliation</button>
          </div>

          {state === 'no_venue' && <p style={{ fontSize: 13 }}>Set a venue ID on the queue screen first.</p>}
          {state === 'unauthorized' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You do not have permission to view this — manager/owner/admin required for payments.</p>}
          {state === 'error' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Unable to load right now. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'loading' && <p style={{ fontSize: 13 }}>Loading…</p>}

          {state === 'ready' && tab === 'payments' && (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ marginBottom: 10 }}>
                <select aria-label="Filter by payment state" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
                  <option value="">All payment states</option>
                  {['not_started', 'payment_pending', 'requires_customer_action', 'processing', 'paid', 'failed', 'canceled', 'partially_refunded', 'refunded', 'disputed', 'expired'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: 8 }}>Created</th>
                    <th style={{ padding: 8 }}>Order</th>
                    <th style={{ padding: 8 }}>Provider</th>
                    <th style={{ padding: 8 }}>Mode</th>
                    <th style={{ padding: 8 }}>State</th>
                    <th style={{ padding: 8 }}>Authorized</th>
                    <th style={{ padding: 8 }}>Captured</th>
                    <th style={{ padding: 8 }}>Refunded</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.payment_intent_id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleString()}</td>
                      <td style={{ padding: 8 }}>{p.order_id.slice(0, 8)}…</td>
                      <td style={{ padding: 8 }}>{p.provider}</td>
                      <td style={{ padding: 8 }}>{p.provider_mode}</td>
                      <td style={{ padding: 8, color: p.payment_state === 'paid' ? OK : p.payment_state === 'failed' ? DANGER : CREAM }}>{p.payment_state}</td>
                      <td style={{ padding: 8 }}>{fmtCents(p.amount_authorized_cents)}</td>
                      <td style={{ padding: 8 }}>{fmtCents(p.amount_captured_cents)}</td>
                      <td style={{ padding: 8 }}>{fmtCents(p.amount_refunded_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length === 0 && <p style={{ fontSize: 13, marginTop: 12 }}>No payments recorded yet.</p>}
            </div>
          )}

          {tab === 'refund' && (
            <div style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
              <input aria-label="Order ID to refund" placeholder="Order ID" value={refundOrderId} onChange={e => setRefundOrderId(e.target.value)} style={inputStyle} />
              <input aria-label="Refund amount in dollars (blank = full remaining)" placeholder="Amount ($, blank = full)" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} style={inputStyle} />
              <input aria-label="Refund reason" placeholder="Reason" value={refundReason} onChange={e => setRefundReason(e.target.value)} style={inputStyle} />
              <button type="button" disabled={!refundOrderId} onClick={handleRefund} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${DANGER}`, background: 'transparent', color: DANGER, cursor: refundOrderId ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Issue Refund</button>
              {refundResult && (
                refundResult.ok
                  ? <p style={{ color: refundResult.refund?.status === 'succeeded' ? OK : DANGER, fontSize: 13 }}>Refund {refundResult.refund?.status} — {fmtCents(refundResult.refund?.amount_cents)}{refundResult.deduplicated ? ' (already processed — deduplicated)' : ''}</p>
                  : <p role="alert" style={{ color: DANGER, fontSize: 13 }}>Refund failed: {refundResult.error}</p>
              )}
            </div>
          )}

          {state === 'ready' && tab === 'webhooks' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: 8 }}>Received</th>
                    <th style={{ padding: 8 }}>Event Type</th>
                    <th style={{ padding: 8 }}>Signature Verified</th>
                    <th style={{ padding: 8 }}>Processing Status</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookEvents.map(w => (
                    <tr key={w.webhook_event_id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{new Date(w.received_at).toLocaleString()}</td>
                      <td style={{ padding: 8 }}>{w.provider_event_type}</td>
                      <td style={{ padding: 8, color: w.signature_verified ? OK : DANGER }}>{w.signature_verified ? 'Yes' : 'No'}</td>
                      <td style={{ padding: 8 }}>{w.processing_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {webhookEvents.length === 0 && <p style={{ fontSize: 13, marginTop: 12 }}>No webhook events recorded yet.</p>}
            </div>
          )}

          {state === 'ready' && tab === 'disputes' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: 8 }}>Opened</th>
                    <th style={{ padding: 8 }}>Order</th>
                    <th style={{ padding: 8 }}>Amount</th>
                    <th style={{ padding: 8 }}>Status</th>
                    <th style={{ padding: 8 }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map(d => (
                    <tr key={d.dispute_id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{new Date(d.opened_at).toLocaleString()}</td>
                      <td style={{ padding: 8 }}>{d.order_id.slice(0, 8)}…</td>
                      <td style={{ padding: 8 }}>{fmtCents(d.amount_disputed_cents)}</td>
                      <td style={{ padding: 8, color: d.status === 'won' ? OK : d.status === 'lost' ? DANGER : GOLD }}>{d.status}</td>
                      <td style={{ padding: 8 }}>{d.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {disputes.length === 0 && <p style={{ fontSize: 13, marginTop: 12 }}>No disputes recorded.</p>}
            </div>
          )}

          {tab === 'reconcile' && (
            <div style={{ display: 'grid', gap: 10, maxWidth: 480 }}>
              <p style={{ fontSize: 13 }}>Compares local payment state against the real provider for every non-terminal payment intent older than 2 minutes, and safely repairs any stale local state via the same idempotent completion/cancellation path the webhook handler uses.</p>
              <button type="button" onClick={handleReconcile} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Run Reconciliation</button>
              {reconcileResult && (
                reconcileResult.ok
                  ? <p style={{ fontSize: 13, color: OK }}>Checked {reconcileResult.orders_checked}, found {reconcileResult.discrepancies_found}, repaired {reconcileResult.discrepancies_repaired}.</p>
                  : <p role="alert" style={{ fontSize: 13, color: DANGER }}>Reconciliation failed: {reconcileResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
