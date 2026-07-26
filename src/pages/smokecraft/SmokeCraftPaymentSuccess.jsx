/**
 * SmokeCraftPaymentSuccess — receipt screen after confirmed payment.
 * Shows order details, loyalty earned, and Return to SmokeCraft button.
 * Return always restores the exact SmokeCraft route the guest came from.
 */
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

const STATUS_LABELS = {
  queued:     'Order Received',
  started:    'Preparing',
  preparing:  'Preparing',
  ready:      'Ready for Pickup',
  delivered:  'Delivered',
  paid:       'Paid',
}

export default function SmokeCraftPaymentSuccess() {
  const navigate = useNavigate()
  const { receipt, resetOrder, getResumeRoute } = useSmokeCraftOrder()

  function handleReturn() {
    resetOrder()
    navigate(getResumeRoute())
  }

  if (!receipt) {
    return (
      <SmokeCraftScreenShell mode="live" status="ready">
        <div style={styles.wrap}>
          <div style={styles.noReceipt}>
            <p>No receipt found.</p>
            <button onClick={handleReturn} style={styles.returnBtn}>Return to SmokeCraft</button>
          </div>
        </div>
      </SmokeCraftScreenShell>
    )
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={styles.wrap}>
      {/* Success header */}
      <div style={styles.successHeader}>
        <div style={styles.checkmark}>✓</div>
        <h1 style={styles.successTitle}>Order Confirmed!</h1>
        <div style={styles.orderNum}>Order #{receipt.orderNumber?.slice(-8).toUpperCase()}</div>
        {receipt.localPreview && (
          <div style={styles.previewBadge}>Local Preview Mode — Simulated Payment</div>
        )}
      </div>

      {/* Loyalty earned */}
      {receipt.loyaltyPointsEarned > 0 && (
        <div style={styles.loyaltyBanner}>
          <span style={styles.loyaltyIcon}>⭐</span>
          <span>+{receipt.loyaltyPointsEarned} Loyalty Points Earned</span>
        </div>
      )}

      {/* Items */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Items Ordered</div>
        {(receipt.items || []).map(item => (
          <div key={item.cart_item_id} style={styles.receiptRow}>
            <div>
              <div style={styles.receiptItemName}>{item.item_name}</div>
              <div style={styles.receiptItemCat}>{item.item_category?.replace(/_/g, ' ')}</div>
            </div>
            <div style={styles.receiptItemTotal}>
              ×{item.quantity || 1} · ${(Number(item.price) * (item.quantity || 1)).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Receipt</div>
        <ReceiptLine label="Subtotal" value={receipt.subtotal} />
        <ReceiptLine label="Tax" value={receipt.tax} />
        {receipt.tip > 0 && <ReceiptLine label="Tip" value={receipt.tip} />}
        {receipt.serviceCharge > 0 && <ReceiptLine label="Service Charge" value={receipt.serviceCharge} />}
        {receipt.discount > 0 && <ReceiptLine label="Discount" value={-receipt.discount} />}
        <ReceiptLine label="Total" value={receipt.total} bold />
        <div style={styles.paymentStatus}>
          Payment: <span style={styles.paymentStatusValue}>{receipt.paymentStatus?.toUpperCase() || 'PAID'}</span>
          {' · '}{receipt.tenderType?.toUpperCase()}
        </div>
      </div>

      {/* Order status */}
      <div style={styles.statusSection}>
        <div style={styles.statusLabel}>Order Status</div>
        <div style={styles.statusValue}>{STATUS_LABELS['queued']}</div>
        <div style={styles.statusDesc}>Your order has been sent to the SmokeCraft team. We'll have it to you shortly.</div>
      </div>

      {/* Local preview notice */}
      {receipt.localPreview && (
        <div style={styles.localNotice}>
          {receipt.notice}
        </div>
      )}

      {/* Return to SmokeCraft */}
      <div style={styles.ctaRow}>
        <button onClick={handleReturn} style={styles.returnBtn}>
          ← Return to SmokeCraft
        </button>
      </div>

      <div style={styles.footerNote}>
        Thank you for your order. Enjoy the experience.
      </div>
    </div>
    </SmokeCraftScreenShell>
  )
}

function ReceiptLine({ label, value, bold }) {
  return (
    <div style={{ ...styles.receiptLine, ...(bold ? styles.receiptLineBold : {}) }}>
      <span>{label}</span>
      <span>${Math.abs(Number(value)).toFixed(2)}{Number(value) < 0 ? ' (-)' : ''}</span>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#0f0f0f', color: '#f0e6d3', fontFamily: '"Georgia", serif', paddingBottom: 80 },
  noReceipt: { textAlign: 'center', padding: 80, color: '#5a4020' },
  successHeader: { background: '#0a1a0a', borderBottom: '1px solid #1a4a1a', padding: '32px 20px', textAlign: 'center' },
  checkmark: { fontSize: 56, color: '#4a9a4a', lineHeight: 1.2 },
  successTitle: { fontSize: 26, fontWeight: 700, color: '#5cb85c', margin: '8px 0 4px' },
  orderNum: { fontSize: 14, color: '#3a6a3a', letterSpacing: 2 },
  previewBadge: { marginTop: 10, background: '#1a2010', border: '1px solid #3a6020', color: '#8aba50', padding: '4px 12px', borderRadius: 12, fontSize: 11, display: 'inline-block' },
  loyaltyBanner: { background: '#1a1a04', border: '1px solid #6a6a14', color: '#d4d440', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700 },
  loyaltyIcon: { fontSize: 22 },
  section: { padding: '16px 20px', borderBottom: '1px solid #2a1a06' },
  sectionTitle: { fontSize: 12, color: '#8b6914', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  receiptRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #1a1a0a' },
  receiptItemName: { fontSize: 14, fontWeight: 600, color: '#f0e6d3' },
  receiptItemCat: { fontSize: 11, color: '#8b6914', textTransform: 'uppercase', marginTop: 2 },
  receiptItemTotal: { fontSize: 14, color: '#d4a843', fontWeight: 600 },
  receiptLine: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#a08040', fontSize: 14 },
  receiptLineBold: { color: '#d4a843', fontWeight: 700, fontSize: 18, borderTop: '1px solid #3d2b10', marginTop: 6, paddingTop: 10 },
  paymentStatus: { fontSize: 12, color: '#5a8a3a', marginTop: 8 },
  paymentStatusValue: { color: '#5cb85c', fontWeight: 700 },
  statusSection: { padding: '16px 20px', background: '#0d1a0d', borderBottom: '1px solid #1a3a1a' },
  statusLabel: { fontSize: 12, color: '#3a6a3a', textTransform: 'uppercase', letterSpacing: 1 },
  statusValue: { fontSize: 18, fontWeight: 700, color: '#5cb85c', margin: '4px 0' },
  statusDesc: { fontSize: 13, color: '#3a5a3a' },
  localNotice: { background: '#1a2010', border: '1px solid #3a5020', color: '#7a9a50', padding: '10px 20px', fontSize: 12 },
  ctaRow: { padding: '24px 20px' },
  returnBtn: { width: '100%', padding: '16px', background: '#8b6914', border: 'none', color: '#f0e6d3', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 18 },
  footerNote: { textAlign: 'center', color: '#3a2a10', fontSize: 12, paddingBottom: 20 },
}
