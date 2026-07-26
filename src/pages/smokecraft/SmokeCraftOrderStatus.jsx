/**
 * SmokeCraftOrderStatus — simple order tracking view for the guest.
 * Shows guest-facing statuses: Order received → Preparing → Ready → Delivered.
 */
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GUEST_STATUSES = ['Order Received', 'Preparing', 'Ready', 'Delivered']

export default function SmokeCraftOrderStatus() {
  const navigate = useNavigate()
  const { order, orderStatus, receipt, resetOrder, getResumeRoute } = useSmokeCraftOrder()

  const activeStep = orderStatus === 'paid' ? 0 : orderStatus === 'preparing' ? 1 : orderStatus === 'ready' ? 2 : orderStatus === 'delivered' ? 3 : 0

  function handleReturn() {
    navigate(getResumeRoute())
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h1 style={styles.title}>Order Status</h1>
      </div>

      {!order && !receipt ? (
        <div style={styles.noOrder}>
          <p>No active order.</p>
          <button onClick={handleReturn} style={styles.returnBtn}>Return to SmokeCraft</button>
        </div>
      ) : (
        <>
          {/* Status stepper */}
          <div style={styles.stepper}>
            {GUEST_STATUSES.map((label, idx) => (
              <div key={label} style={styles.stepRow}>
                <div style={{ ...styles.stepCircle, ...(idx <= activeStep ? styles.stepCircleActive : {}) }}>
                  {idx < activeStep ? '✓' : idx + 1}
                </div>
                <div style={{ ...styles.stepLabel, ...(idx === activeStep ? styles.stepLabelActive : {}) }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          {receipt && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Order #{receipt.orderNumber?.slice(-8).toUpperCase()}</div>
              {receipt.items?.map(item => (
                <div key={item.cart_item_id} style={styles.itemRow}>
                  <span>{item.item_name} ×{item.quantity || 1}</span>
                  <span>${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
              <div style={styles.total}>Total: ${Number(receipt.total).toFixed(2)}</div>
              {receipt.loyaltyPointsEarned > 0 && (
                <div style={styles.loyalty}>+{receipt.loyaltyPointsEarned} Loyalty Points Earned</div>
              )}
            </div>
          )}

          <div style={styles.ctaRow}>
            <button onClick={handleReturn} style={styles.returnBtn}>← Return to SmokeCraft</button>
            <button onClick={() => navigate('/smokecraft/payment-success')} style={styles.receiptBtn}>View Receipt</button>
          </div>
        </>
      )}
    </div>
    </SmokeCraftScreenShell>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#0f0f0f', color: '#f0e6d3', fontFamily: '"Georgia", serif', paddingBottom: 60 },
  header: { padding: '20px 20px 16px', background: '#1a1208', borderBottom: '1px solid #3d2b10' },
  title: { fontSize: 22, fontWeight: 700, color: '#d4a843', margin: 0 },
  noOrder: { textAlign: 'center', padding: 80, color: '#5a4020' },
  stepper: { padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 0 },
  stepRow: { display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, position: 'relative' },
  stepCircle: { width: 36, height: 36, borderRadius: '50%', background: '#2a1a06', border: '2px solid #3d2b10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#5a4020', flexShrink: 0 },
  stepCircleActive: { background: '#4a7a20', border: '2px solid #5cb85c', color: '#f0f0f0' },
  stepLabel: { fontSize: 15, color: '#5a4020' },
  stepLabelActive: { color: '#5cb85c', fontWeight: 700 },
  section: { padding: '0 20px 20px', borderBottom: '1px solid #2a1a06' },
  sectionTitle: { fontSize: 13, color: '#8b6914', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  itemRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#a08040', fontSize: 14, borderBottom: '1px solid #1a1a0a' },
  total: { fontSize: 16, fontWeight: 700, color: '#d4a843', marginTop: 10 },
  loyalty: { fontSize: 13, color: '#d4d440', marginTop: 6 },
  ctaRow: { padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 },
  returnBtn: { width: '100%', padding: '14px', background: '#8b6914', border: 'none', color: '#f0e6d3', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 16 },
  receiptBtn: { width: '100%', padding: '14px', background: 'none', border: '1px solid #3d2b10', color: '#a08040', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
}
