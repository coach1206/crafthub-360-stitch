/**
 * SmokeCraftCheckout — payment screen.
 *
 * PAYMENT SAFETY:
 * - No raw card numbers or CVV collected here.
 * - Simulated local-preview payment shows a clear notice.
 * - Only triggers loyalty after confirmed payment.
 */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

const TENDER_OPTIONS = [
  { id: 'card',   label: 'Pay Now (Simulated)', desc: 'Simulated card payment — no real charge.' },
  { id: 'tab',    label: 'Add to Tab',          desc: 'Staff will add to your running tab.' },
  { id: 'cash',   label: 'Pay Cash',            desc: 'Pay staff directly with cash.' },
  { id: 'comp',   label: 'Staff Comp',          desc: 'Manager or staff discount/comp.' },
]

export default function SmokeCraftCheckout() {
  const navigate = useNavigate()
  const locState = useLocation().state || {}
  const { cart, cartItems, paymentStatus, processPayment, cancelPayment, getResumeRoute } = useSmokeCraftOrder()

  const [selectedTender, setSelectedTender] = useState('card')
  const [processing, setProcessing] = useState(false)

  const tip = Number(locState.tip || 0)
  const ageVerified = locState.ageVerified || false
  const subtotal = cartItems.reduce((s, i) => s + Number(i.price || 0) * (i.quantity || 1), 0)
  const TAX_RATE = 0.085
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax + tip

  async function handlePay() {
    if (processing) return
    setProcessing(true)
    const result = await processPayment({ tenderType: selectedTender, tip, ageVerified: true })
    setProcessing(false)
    if (result?.ok || result?.receipt) {
      navigate('/smokecraft/payment-success')
    }
  }

  async function handleCancel() {
    await cancelPayment()
    navigate('/smokecraft/cart')
  }

  if (paymentStatus === 'success') {
    navigate('/smokecraft/payment-success')
    return null
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button onClick={() => navigate('/smokecraft/cart')} style={styles.backBtn}>← Cart</button>
        <h1 style={styles.title}>Checkout</h1>
      </div>

      {/* Local preview notice */}
      <div style={styles.previewNotice}>
        Local Preview Mode: payment is simulated. No real charge is processed.
      </div>

      {/* Order summary */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Order Summary</div>
        {cartItems.map(item => (
          <div key={item.cart_item_id} style={styles.summaryRow}>
            <span>{item.item_name} ×{item.quantity || 1}</span>
            <span>${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</span>
          </div>
        ))}
        <div style={styles.divider} />
        <SummaryLine label="Subtotal" value={subtotal} />
        <SummaryLine label="Tax (8.5%)" value={tax} />
        {tip > 0 && <SummaryLine label="Tip" value={tip} />}
        <SummaryLine label="Total" value={total} bold />
      </div>

      {/* Payment method */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Payment Method</div>
        {TENDER_OPTIONS.map(opt => (
          <label key={opt.id} style={styles.tenderOpt}>
            <input type="radio" name="tender" value={opt.id} checked={selectedTender === opt.id} onChange={() => setSelectedTender(opt.id)} />
            <div>
              <div style={styles.tenderLabel}>{opt.label}</div>
              <div style={styles.tenderDesc}>{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Pay button */}
      <div style={styles.ctaRow}>
        <button onClick={handlePay} disabled={processing} style={{ ...styles.payBtn, ...(processing ? styles.payBtnDisabled : {}) }}>
          {processing ? 'Processing…' : `Pay Now — $${total.toFixed(2)}`}
        </button>
        <button onClick={handleCancel} style={styles.cancelBtn}>Cancel</button>
      </div>

      {paymentStatus === 'failed' && (
        <div style={styles.errorMsg}>Payment failed. Please try again or choose a different method.</div>
      )}
    </div>
    </SmokeCraftScreenShell>
  )
}

function SummaryLine({ label, value, bold }) {
  return (
    <div style={{ ...styles.summaryRow, ...(bold ? styles.summaryBold : {}) }}>
      <span>{label}</span>
      <span>${Number(value).toFixed(2)}</span>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#0f0f0f', color: '#f0e6d3', fontFamily: '"Georgia", serif', paddingBottom: 80 },
  header: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: '#1a1208', borderBottom: '1px solid #3d2b10' },
  backBtn: { background: 'none', border: '1px solid #8b6914', color: '#d4a843', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  title: { fontSize: 20, fontWeight: 700, color: '#d4a843', margin: 0 },
  previewNotice: { background: '#1a2010', border: '1px solid #3a6020', color: '#8aba50', padding: '10px 20px', fontSize: 12, textAlign: 'center' },
  section: { padding: '16px 20px', borderBottom: '1px solid #2a1a06' },
  sectionTitle: { fontSize: 12, color: '#8b6914', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#a08040', fontSize: 14 },
  summaryBold: { color: '#d4a843', fontWeight: 700, fontSize: 18, borderTop: '1px solid #3d2b10', marginTop: 6, paddingTop: 10 },
  divider: { borderTop: '1px solid #2a1a06', margin: '8px 0' },
  tenderOpt: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid #2a1a06' },
  tenderLabel: { fontSize: 15, fontWeight: 600, color: '#f0e6d3' },
  tenderDesc: { fontSize: 12, color: '#a08040', marginTop: 2 },
  ctaRow: { padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 },
  payBtn: { padding: '16px', background: '#8b1a1a', border: 'none', color: '#f0e6d3', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 18 },
  payBtnDisabled: { background: '#3d2020', color: '#6a4040', cursor: 'not-allowed' },
  cancelBtn: { padding: '12px', background: 'none', border: '1px solid #3d2b10', color: '#a08040', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  errorMsg: { margin: '16px 20px 0', background: '#2a0a0a', border: '1px solid #8b3030', borderRadius: 8, padding: 12, color: '#d04040', fontSize: 13 },
}
