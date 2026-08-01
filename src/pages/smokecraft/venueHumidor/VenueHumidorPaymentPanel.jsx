/**
 * Real Payment Gateway Integration — Production Package 2 of 7.
 *
 * Customer-facing payment panel for a pending_payment order. Never
 * declares an order paid itself — it only ever displays the server's
 * own reported payment_state (fetched from
 * GET /orders/:orderId/payment-status, which is populated exclusively
 * by verified Stripe webhooks). Card data never touches this
 * component or any server code — it goes directly from the browser to
 * Stripe via the hosted PaymentElement, using only the publishable
 * key (never a secret key).
 *
 * If STRIPE_SECRET_KEY/STRIPE_PUBLISHABLE_KEY are not configured in
 * this environment, this panel honestly falls back to the existing
 * staff-confirmation note rather than rendering a broken payment form.
 */
import { useEffect, useRef, useState } from 'react'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'

const GOLD = '#E9C176'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'
const CREAM = '#e5e2e1'

const HONEST_STATE_COPY = {
  checking: 'Checking payment availability…',
  unavailable: 'Payment processing is not connected. Please see staff to complete payment.',
  creating_intent: 'Preparing secure payment…',
  requires_customer_action: 'Enter your payment details below.',
  processing: 'Processing your payment…',
  paid: 'Payment received. Thank you.',
  failed: 'Payment failed. You may retry with a different payment method.',
  canceled: 'This payment was canceled.',
  error: 'Unable to load payment right now.',
}

export default function VenueHumidorPaymentPanel({ venueId, orderId, onPaid }) {
  const [panelState, setPanelState] = useState('checking')
  const [clientSecret, setClientSecret] = useState(null)
  const [publishableKey, setPublishableKey] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)
  const elementsRef = useRef(null)
  const stripeRef = useRef(null)
  const mountRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const keyStatus = await api.getStripePublishableKeyStatus()
      if (cancelled) return
      if (!keyStatus.ok || !keyStatus.ready) { setPanelState('unavailable'); return }

      setPanelState('creating_intent')
      const idempotencyKey = `gb-vh-pi-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const result = await api.createPaymentIntent(venueId, orderId, idempotencyKey)
      if (cancelled) return
      if (!result.ok) {
        if (result.error === 'stripe_not_configured') { setPanelState('unavailable'); return }
        setPanelState('error'); setErrorDetail(result.error); return
      }
      if (result.paymentState === 'paid') { setPanelState('paid'); onPaid?.(); return }
      if (!result.clientSecret) {
        // Deduplicated re-use of an existing intent whose client
        // secret was only issued at first creation — poll status
        // instead of re-rendering a payment form.
        setPanelState(result.paymentState)
        startPolling()
        return
      }
      setClientSecret(result.clientSecret)

      // publishableKeyStatus intentionally never returns the raw key
      // for logging safety — the real key comes only from the env at
      // build time, matching src/lib/stripeClient.js's contract.
      const { getStripePublishableKey } = await import('../../../lib/stripeClient.js')
      setPublishableKey(getStripePublishableKey())
      setPanelState('requires_customer_action')
    }
    init()
    return () => { cancelled = true; if (pollRef.current) clearInterval(pollRef.current) }
  }, [venueId, orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (panelState !== 'requires_customer_action' || !clientSecret || !publishableKey || !mountRef.current) return
    let cancelled = false
    async function mountElements() {
      const { loadStripe } = await import('@stripe/stripe-js')
      const stripe = await loadStripe(publishableKey)
      if (cancelled || !stripe) return
      stripeRef.current = stripe
      const elements = stripe.elements({ clientSecret })
      elementsRef.current = elements
      const paymentElement = elements.create('payment')
      paymentElement.mount(mountRef.current)
    }
    mountElements()
    return () => { cancelled = true }
  }, [panelState, clientSecret, publishableKey])

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const status = await api.getPaymentStatus(venueId, orderId)
      if (!status.ok) return
      if (status.paymentState === 'paid') {
        clearInterval(pollRef.current)
        setPanelState('paid')
        onPaid?.()
      } else if (['failed', 'canceled'].includes(status.paymentState)) {
        clearInterval(pollRef.current)
        setPanelState(status.paymentState)
        setErrorDetail(status.failureMessage)
      }
    }, 2500)
  }

  async function handleConfirm() {
    if (!stripeRef.current || !elementsRef.current) return
    setPanelState('processing')
    const { error } = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      redirect: 'if_required',
    })
    if (error) {
      setPanelState('failed')
      setErrorDetail(error.message)
      return
    }
    // The client NEVER declares success itself — it only starts
    // polling the server's own webhook-populated payment status.
    startPolling()
  }

  async function handleRetry() {
    setClientSecret(null)
    setErrorDetail(null)
    setPanelState('checking')
    const idempotencyKey = `gb-vh-pi-retry-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const result = await api.createPaymentIntent(venueId, orderId, idempotencyKey)
    if (!result.ok) { setPanelState('error'); setErrorDetail(result.error); return }
    if (!result.clientSecret) { setPanelState(result.paymentState); startPolling(); return }
    setClientSecret(result.clientSecret)
    const { getStripePublishableKey } = await import('../../../lib/stripeClient.js')
    setPublishableKey(getStripePublishableKey())
    setPanelState('requires_customer_action')
  }

  return (
    <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }} data-payment-panel-state={panelState}>
      <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Payment</h2>
      <p role="status" style={{ fontSize: 13, color: panelState === 'failed' ? DANGER : panelState === 'paid' ? OK : CREAM, margin: '0 0 10px' }}>
        {HONEST_STATE_COPY[panelState] || panelState}
      </p>
      {errorDetail && <p role="alert" style={{ fontSize: 12, color: DANGER, marginBottom: 8 }}>{errorDetail}</p>}

      {panelState === 'requires_customer_action' && (
        <>
          <div ref={mountRef} style={{ marginBottom: 12 }} />
          <button type="button" onClick={handleConfirm}
            style={{ minHeight: 44, width: '100%', padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${OK}`, background: 'transparent', color: OK, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
            Pay Now
          </button>
        </>
      )}

      {(panelState === 'failed' || panelState === 'canceled') && (
        <button type="button" onClick={handleRetry}
          style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
          Retry Payment
        </button>
      )}
    </div>
  )
}
