/**
 * POS360SmokeCraftCheckout — staff-side POS view for SmokeCraft guest orders.
 *
 * Accessible from /pos3/smokecraft-checkout after staff PIN auth.
 * Shows active guest session, table/seat, existing cart/order, and allows
 * staff to add items, verify age, complete payment, attach transaction.
 *
 * PAYMENT SAFETY: No raw card numbers or CVV. Local-preview simulation if no
 * real processor configured.
 *
 * LOCAL PREVIEW MODE: Labeled clearly throughout.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReturnToGuestButton from '../../components/staffhandoff/ReturnToGuestButton.jsx'
import { loadGuestResumeState } from '../../services/staffHandoffResumeService.js'
import { getVenueMenu } from '../../services/venueInventoryService.js'
import { createCart, addItemToCart, checkoutCart, getCart } from '../../services/smokecraftCartService.js'
import { confirmPayment, attachPOS360Transaction } from '../../services/smokecraftOrderService.js'

const VENUE_ID = 'novee-grand-lounge'

export default function POS360SmokeCraftCheckout() {
  const navigate = useNavigate()
  const resumeState = loadGuestResumeState()

  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [ageVerified, setAgeVerified] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    getVenueMenu(VENUE_ID, null).then(r => {
      setMenuItems(r.items || [])
      if (r.localPreview) setNotice('Local Preview Mode: menu is sample data.')
    })
    // Initialize cart
    if (resumeState?.guestSessionId) {
      createCart({ guestSessionId: resumeState.guestSessionId, venueId: VENUE_ID, tableId: resumeState.tableId }).then(r => {
        if (r?.ok && r.cart) setCart(r.cart)
      })
    }
  }, [])

  const displayed = menuItems.filter(i => !activeCategory || i.item_category === activeCategory)

  async function handleAddItem(item) {
    if (!cart) return
    setLoading(true)
    const r = await addItemToCart(cart.cart_id, { itemId: item.item_id, quantity: 1 })
    if (r?.ok) {
      const updated = await getCart(cart.cart_id)
      if (updated?.ok) { setCart(updated.cart); setCartItems(updated.items || []) }
    }
    setLoading(false)
  }

  async function handleCompletePayment() {
    if (!cart) return
    setLoading(true)

    // Checkout
    const chk = await checkoutCart(cart.cart_id, { ageVerified, tip: 0 })
    if (!chk?.ok) {
      if (chk?.requiresAgeVerification) setNotice('Age verification required before checkout.')
      setLoading(false)
      return
    }

    const orderId = chk.order?.order_id
    if (!orderId) { setLoading(false); return }

    // Simulated payment
    const paymentIntentId = `pi_staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const result = await confirmPayment(orderId, {
      paymentIntentId,
      tenderType: 'staff_pos',
      guestSessionId: resumeState?.guestSessionId,
    })

    // Attach to SmokeCraft session for loyalty dedup
    if (cartItems.length > 0) {
      await attachPOS360Transaction({
        posTransactionId: paymentIntentId,
        guestSessionId: resumeState?.guestSessionId || 'guest',
        venueId: VENUE_ID,
        orderId,
        subtotal: cart?.subtotal || 0,
        quantity: cartItems.length,
        isHouseItem: cartItems.some(i => i.is_house_item),
        paymentIntentId,
      })
    }

    setPaymentResult({ ok: true, orderId, paymentIntentId, localPreview: result?.localPreview ?? true })
    setLoading(false)
  }

  const CATS = ['house_cigar','featured_cigar','liquor','cocktail','food','dinner','pairing_bundle','full_pairing_bundle']

  if (paymentResult?.ok) {
    return (
      <div style={styles.wrap}>
        <div style={styles.successBox}>
          <div style={styles.successCheck}>✓</div>
          <div style={styles.successTitle}>Payment Complete</div>
          <div style={styles.successSub}>Order #{paymentResult.orderId?.slice(-8).toUpperCase()}</div>
          {paymentResult.localPreview && <div style={styles.localBadge}>Local Preview Mode — Simulated</div>}
          <div style={styles.successNote}>Transaction attached to SmokeCraft guest session. Loyalty points awarded.</div>
        </div>
        <ReturnToGuestButton />
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>POS360 — SmokeCraft Staff Checkout</div>
          {resumeState && (
            <div style={styles.guestInfo}>
              Guest: {resumeState.guestSessionId?.slice(-8)} · Visit {resumeState.currentVisit} · Session {resumeState.currentSession}
            </div>
          )}
        </div>
        <ReturnToGuestButton compact />
      </div>

      {notice && <div style={styles.notice}>{notice}</div>}

      {/* Category filter */}
      <div style={styles.cats}>
        <button onClick={() => setActiveCategory(null)} style={{ ...styles.cat, ...(activeCategory === null ? styles.catActive : {}) }}>All</button>
        {CATS.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            style={{ ...styles.cat, ...(activeCategory === c ? styles.catActive : {}) }}>
            {c.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {/* Menu items */}
        <div style={styles.menu}>
          {displayed.map(item => (
            <div key={item.item_id} style={styles.menuItem}>
              <div>
                <div style={styles.menuItemName}>{item.item_name}</div>
                <div style={styles.menuItemPrice}>${Number(item.price).toFixed(2)}</div>
                {!item.available && <span style={styles.oos}>Out of Stock</span>}
              </div>
              <button onClick={() => handleAddItem(item)} disabled={!item.available || loading} style={styles.addBtn}>
                + Add
              </button>
            </div>
          ))}
        </div>

        {/* Cart */}
        <div style={styles.cartPanel}>
          <div style={styles.cartTitle}>Staff Cart</div>
          {cartItems.length === 0 ? (
            <div style={styles.cartEmpty}>No items added yet.</div>
          ) : (
            cartItems.map(item => (
              <div key={item.cart_item_id} style={styles.cartRow}>
                <span>{item.item_name} ×{item.quantity || 1}</span>
                <span>${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</span>
              </div>
            ))
          )}

          {cart && (
            <div style={styles.cartTotal}>Total: ${Number(cart.total || 0).toFixed(2)}</div>
          )}

          {/* Age verification */}
          <label style={styles.ageCheck}>
            <input type="checkbox" checked={ageVerified} onChange={e => setAgeVerified(e.target.checked)} />
            <span>Age verified (21+) by staff</span>
          </label>

          <button onClick={handleCompletePayment} disabled={loading || cartItems.length === 0} style={{ ...styles.payBtn, ...(cartItems.length === 0 ? styles.payBtnDisabled : {}) }}>
            {loading ? 'Processing…' : 'Complete Payment (Simulated)'}
          </button>
          <div style={styles.simNote}>Local Preview Mode: payment is simulated. No real charge.</div>
        </div>
      </div>
    </div>
  )
}

const G = '#E9C176'
const styles = {
  wrap: { minHeight: '100vh', background: '#080604', color: '#f0e6d3', fontFamily: '"Georgia", serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', background: '#100c06', borderBottom: `1px solid rgba(233,193,118,0.15)` },
  headerTitle: { fontSize: 16, fontWeight: 600, color: G },
  guestInfo: { fontSize: 12, color: 'rgba(233,193,118,0.5)', fontFamily: '"JetBrains Mono", monospace', marginTop: 4 },
  notice: { background: '#1a1a04', border: '1px solid #5a5a10', color: '#c0b040', padding: '8px 20px', fontSize: 12 },
  cats: { display: 'flex', overflowX: 'auto', gap: 6, padding: '10px 16px', background: '#0c0a06', borderBottom: '1px solid rgba(233,193,118,0.08)' },
  cat: { background: 'none', border: '1px solid rgba(233,193,118,0.15)', color: 'rgba(233,193,118,0.5)', padding: '4px 10px', borderRadius: 14, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' },
  catActive: { background: 'rgba(233,193,118,0.15)', color: G, borderColor: G },
  body: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 0, height: 'calc(100vh - 110px)', overflow: 'hidden' },
  menu: { overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  menuItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(233,193,118,0.04)', border: '1px solid rgba(233,193,118,0.1)', borderRadius: 8, padding: '10px 12px' },
  menuItemName: { fontSize: 14, color: '#f0e6d3' },
  menuItemPrice: { fontSize: 13, color: G },
  oos: { fontSize: 11, color: '#d04040' },
  addBtn: { background: 'rgba(233,193,118,0.12)', border: `1px solid rgba(233,193,118,0.3)`, color: G, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  cartPanel: { background: '#100c06', borderLeft: '1px solid rgba(233,193,118,0.1)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' },
  cartTitle: { fontSize: 13, color: G, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.1em' },
  cartEmpty: { color: 'rgba(233,193,118,0.3)', fontSize: 13, fontStyle: 'italic' },
  cartRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#c0a860', borderBottom: '1px solid rgba(233,193,118,0.08)', paddingBottom: 6 },
  cartTotal: { fontSize: 16, fontWeight: 700, color: G, borderTop: '1px solid rgba(233,193,118,0.2)', paddingTop: 8 },
  ageCheck: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#f0e6d3', fontSize: 13 },
  payBtn: { padding: '12px', background: G, border: 'none', color: '#0a0600', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  payBtnDisabled: { background: 'rgba(233,193,118,0.15)', color: 'rgba(233,193,118,0.35)', cursor: 'not-allowed' },
  simNote: { fontSize: 11, color: 'rgba(233,193,118,0.3)', fontFamily: '"JetBrains Mono", monospace' },
  successBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 12, padding: 40 },
  successCheck: { fontSize: 64, color: '#5cb85c' },
  successTitle: { fontSize: 24, fontWeight: 700, color: '#5cb85c' },
  successSub: { fontSize: 14, color: 'rgba(92,184,92,0.6)', fontFamily: '"JetBrains Mono", monospace' },
  localBadge: { background: '#1a2010', border: '1px solid #3a6020', color: '#8aba50', padding: '4px 12px', borderRadius: 12, fontSize: 11 },
  successNote: { fontSize: 13, color: 'rgba(233,193,118,0.5)', textAlign: 'center', maxWidth: 320, marginTop: 8 },
}
