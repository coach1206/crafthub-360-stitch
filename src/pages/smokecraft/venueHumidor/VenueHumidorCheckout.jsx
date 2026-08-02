import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSmokeCraftJourney } from '../../../context/SmokeCraftJourneyContext.jsx'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { CHECKOUT_DENIAL_COPY, useLocale } from '../compliance/complianceUiKit.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

const FULFILLMENT_LABELS = {
  counter_pickup: 'Purchase at Counter', table_delivery: 'Table Delivery',
  lounge_seat_delivery: 'Lounge Seat Delivery', pos_tab_existing: 'Add to Existing Tab', pos_tab_new: 'Start New Tab',
}

function fmtCents(c) { return `$${((c || 0) / 100).toFixed(2)}` }

export default function VenueHumidorCheckout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const holdId = searchParams.get('holdId')
  const { journey } = useSmokeCraftJourney()
  const venueId = (journey.selectedVenue && !journey.selectedVenue.skipped) ? journey.selectedVenue.id : null

  const [state, setState] = useState('loading')
  const [quote, setQuote] = useState(null)
  const [fulfillmentMethod, setFulfillmentMethod] = useState('counter_pickup')
  const [tableOrSeat, setTableOrSeat] = useState('')
  const [notes, setNotes] = useState('')
  const [submitState, setSubmitState] = useState('idle')
  const [submitError, setSubmitError] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const locale = useLocale()

  async function load() {
    if (!venueId || !holdId) { setState('missing'); return }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState('offline'); return }
    setState('loading')
    const result = await api.getCheckoutQuote(venueId, holdId, 0)
    if (!result.ok) {
      setState(
        result.error === 'expired_hold' ? 'expired' :
        result.error?.startsWith('stale_hold') ? 'stale' :
        result.error === 'wrong_user_hold' || result.error === 'wrong_venue_hold' ? 'unauthorized' :
        result.status === 401 ? 'session_expired' : 'error'
      )
      return
    }
    setQuote(result.quote)
    if (!FULFILLMENT_LABELS[fulfillmentMethod] || !result.quote.fulfillmentOptions[fulfillmentMethod]) {
      const firstSupported = Object.keys(result.quote.fulfillmentOptions).find(k => result.quote.fulfillmentOptions[k])
      if (firstSupported) setFulfillmentMethod(firstSupported)
    }
    setState('ready')
  }
  useEffect(() => { load() }, [venueId, holdId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!quote?.holdExpiresAt) return
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(quote.holdExpiresAt).getTime() - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining === 0) setState('expired')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [quote?.holdExpiresAt])

  async function handleSubmit() {
    if (submitState === 'submitting') return
    setSubmitState('submitting')
    setSubmitError(null)
    const idempotencyKey = `gb-vh-checkout-${holdId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    // NOTE (Production Package 6 Correction): no client-side "ageVerified"
    // boolean is submitted or trusted — eligibility is decided entirely
    // server-side from real compliance records. This body field is now
    // ignored by the server if present at all.
    const result = await api.createOrder(venueId, holdId, {
      fulfillmentMethod, fulfillmentDetails: { tableOrSeat }, customerNotes: notes,
    }, idempotencyKey)
    if (!result.ok) { setSubmitState('failed'); setSubmitError(result.error); return }
    setSubmitState('submitted')
    navigate(`/smokecraft/venue-humidor/order/${result.order.order_id}`)
  }

  if (state === 'missing') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="Start from a cigar's detail page to check out." />
  if (state === 'offline') return <SmokeCraftScreenShell mode="live" status="offline" onRetry={load} />
  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading checkout…" />
  if (state === 'session_expired') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Your session has expired. Please refresh." />
  if (state === 'unauthorized') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="This hold does not belong to your session." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load checkout right now." onRetry={load} />

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 700, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 12px' }}>Checkout</h1>

          {(state === 'expired' || state === 'stale') && (
            <div style={{ background: GLASS, border: `1px solid ${DANGER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: DANGER }}>{state === 'expired' ? 'This hold has expired.' : 'This hold is no longer active.'}</p>
              <button type="button" onClick={() => navigate(-1)} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>Return to Cigar</button>
            </div>
          )}

          {state === 'ready' && quote && (
            <>
              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 14 }}>
                <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {quote.product.primaryImageUrl ? <img src={quote.product.primaryImageUrl} alt={quote.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 10, color: 'rgba(229,226,225,0.4)' }}>No image</span>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)' }}>{quote.product.brand}</div>
                  <div style={{ fontSize: 16, color: GOLD }}>{quote.product.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.65)' }}>Qty {quote.quantity} · {quote.product.vitola}</div>
                </div>
              </div>

              {countdown != null && (
                <p role="status" style={{ fontSize: 12, color: countdown < 60 ? DANGER : 'rgba(229,226,225,0.6)' }}>
                  Hold expires in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                </p>
              )}

              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Fulfillment</h2>
                <select aria-label="Fulfillment method" value={fulfillmentMethod} onChange={e => setFulfillmentMethod(e.target.value)}
                  style={{ minHeight: 44, width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, marginBottom: 8 }}>
                  {Object.entries(FULFILLMENT_LABELS).map(([key, label]) => (
                    <option key={key} value={key} disabled={!quote.fulfillmentOptions[key]}>{label}{!quote.fulfillmentOptions[key] ? ' (unavailable)' : ''}</option>
                  ))}
                </select>
                {(fulfillmentMethod === 'table_delivery' || fulfillmentMethod === 'lounge_seat_delivery') && (
                  <input value={tableOrSeat} onChange={e => setTableOrSeat(e.target.value)} placeholder="Table or seat number" aria-label="Table or seat"
                    style={{ minHeight: 44, width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
                )}
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" aria-label="Customer notes"
                  style={{ width: '100%', minHeight: 60, padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' }} />
              </div>

              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{fmtCents(quote.subtotalCents)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>{fmtCents(quote.taxCents)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: GOLD, fontSize: 16, marginTop: 6 }}><span>Total</span><span>{fmtCents(quote.totalCents)}</span></div>
              </div>

              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: DANGER, margin: '0 0 8px' }}>{quote.paymentNote}</p>
                {/* Production Package 6 Correction: honest, server-derived
                    compliance state — never a client-side self-attest
                    checkbox that would fake eligibility. quote.complianceState
                    comes straight from the same evaluator checkout/orders
                    enforces. */}
                {quote.complianceEligible ? (
                  <p role="status" data-checkout-compliance-state="eligible-for-checkout" style={{ fontSize: 13, color: OK }}>✓ Eligible for checkout (age-verified, policies accepted).</p>
                ) : (
                  <div role="alert" data-checkout-compliance-state={quote.complianceState} style={{ border: `1px solid ${DANGER}`, borderRadius: 8, padding: 10 }}>
                    <p style={{ fontSize: 13, color: DANGER, margin: 0 }}>{(CHECKOUT_DENIAL_COPY[locale] || CHECKOUT_DENIAL_COPY.en)[quote.complianceState]?.title || 'Checkout not yet eligible'}</p>
                    <p style={{ fontSize: 12, margin: '4px 0 8px' }}>{(CHECKOUT_DENIAL_COPY[locale] || CHECKOUT_DENIAL_COPY.en)[quote.complianceState]?.body || ''}</p>
                    <button type="button" onClick={() => navigate(quote.complianceState === 'age-verification-required' || quote.complianceState === 'age-verification-expired'
                        ? `/smokecraft/compliance/age-gate?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}&jurisdiction=${quote.jurisdictionCode || ''}`
                        : `/smokecraft/compliance/policies?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}&jurisdiction=${quote.jurisdictionCode || ''}`)}
                      style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                      {(CHECKOUT_DENIAL_COPY[locale] || CHECKOUT_DENIAL_COPY.en)[quote.complianceState]?.cta || 'Resolve requirement'}
                    </button>
                  </div>
                )}
              </div>

              <button type="button" disabled={!quote.complianceEligible || submitState === 'submitting'} onClick={handleSubmit}
                data-checkout-place-order-state={!quote.complianceEligible ? 'blocked' : submitState}
                style={{ minHeight: 44, width: '100%', padding: '12px 20px', borderRadius: 20, border: `1.5px solid ${quote.complianceEligible ? OK : BORDER}`, background: 'transparent', color: quote.complianceEligible ? OK : 'rgba(229,226,225,0.35)', cursor: quote.complianceEligible && submitState !== 'submitting' ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 15 }}>
                {submitState === 'submitting' ? 'Placing Order…' : 'Place Order'}
              </button>
              {submitState === 'failed' && (
                <div role="alert" style={{ marginTop: 8 }}>
                  <p style={{ color: DANGER, fontSize: 12, margin: 0 }}>{(CHECKOUT_DENIAL_COPY[locale] || CHECKOUT_DENIAL_COPY.en)[submitError]?.title || submitError}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
