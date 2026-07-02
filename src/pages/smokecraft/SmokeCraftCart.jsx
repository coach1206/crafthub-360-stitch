/**
 * SmokeCraftCart — guest cart view with quantity, remove, totals, and checkout.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'

const AGE_RESTRICTED = new Set(['house_cigar','featured_cigar','humidor_match','cigar','liquor','cocktail','wine','beer','pairing_bundle','full_pairing_bundle'])

const LOCATION_OPTIONS = [
  { id: 'T1',  label: 'Table 1' },
  { id: 'T2',  label: 'Table 2' },
  { id: 'T3',  label: 'Table 3' },
  { id: 'T4',  label: 'Table 4' },
  { id: 'T5',  label: 'Table 5' },
  { id: 'T6',  label: 'Table 6' },
  { id: 'T7',  label: 'Table 7' },
  { id: 'T8',  label: 'Table 8' },
  { id: 'T9',  label: 'Table 9' },
  { id: 'T10', label: 'Table 10' },
  { id: 'T11', label: 'Table 11' },
  { id: 'T12', label: 'Table 12' },
  { id: 'P1',  label: 'Patio 1' },
  { id: 'P2',  label: 'Patio 2' },
  { id: 'P3',  label: 'Patio 3' },
  { id: 'L1',  label: 'Lounge Chair 1' },
  { id: 'L2',  label: 'Lounge Chair 2' },
  { id: 'L3',  label: 'Lounge Chair 3' },
  { id: 'B1',  label: 'Bar Seat 1' },
  { id: 'B2',  label: 'Bar Seat 2' },
  { id: 'B3',  label: 'Bar Seat 3' },
  { id: 'VIP1',label: 'VIP Room 1' },
]

export default function SmokeCraftCart() {
  const navigate = useNavigate()
  const { cart, cartItems, refreshCart, removeFromCart, cartLoading, location, setLocation, getResumeRoute } = useSmokeCraftOrder()
  const [tip, setTip] = useState(0)
  const [ageConfirmed, setAgeConfirmed] = useState(false)

  useEffect(() => { refreshCart() }, [])

  const hasAgeRestricted = cartItems.some(i => AGE_RESTRICTED.has(i.item_category) || i.age_restricted)
  const subtotal = cartItems.reduce((s, i) => s + Number(i.price || 0) * (i.quantity || 1), 0)
  const TAX_RATE = 0.085
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax + Number(tip)

  function handleCheckout() {
    if (hasAgeRestricted && !ageConfirmed) return
    navigate('/smokecraft/checkout', { state: { tip, ageVerified: ageConfirmed } })
  }

  if (cartLoading) return <div style={styles.loading}>Loading cart…</div>

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button onClick={() => navigate('/smokecraft/menu')} style={styles.backBtn}>← Menu</button>
        <h1 style={styles.title}>Your Cart</h1>
        <button onClick={() => navigate(getResumeRoute())} style={styles.scBtn}>← SmokeCraft</button>
      </div>

      {cartItems.length === 0 ? (
        <div style={styles.empty}>
          <p>Your cart is empty.</p>
          <button onClick={() => navigate('/smokecraft/menu')} style={styles.browseBtn}>Browse Menu</button>
        </div>
      ) : (
        <>
          {/* Item list */}
          <div style={styles.items}>
            {cartItems.map(item => (
              <div key={item.cart_item_id} style={styles.item}>
                <div style={styles.itemLeft}>
                  <div style={styles.itemName}>{item.item_name}</div>
                  <div style={styles.itemCat}>{item.item_category?.replace(/_/g, ' ')}</div>
                  {item.age_restricted && <span style={styles.ageTag}>21+</span>}
                </div>
                <div style={styles.itemRight}>
                  <div style={styles.itemQty}>×{item.quantity || 1}</div>
                  <div style={styles.itemPrice}>${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</div>
                  <button onClick={() => removeFromCart(item.cart_item_id)} style={styles.removeBtn}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Location */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Table / Seat / Location</div>
            <select value={location.tableId || ''} onChange={e => setLocation(l => ({ ...l, tableId: e.target.value, tableName: e.target.options[e.target.selectedIndex].text }))} style={styles.select}>
              <option value=''>Select your location…</option>
              {LOCATION_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <input placeholder="Seat number (optional)" value={location.seatNumber} onChange={e => setLocation(l => ({ ...l, seatNumber: e.target.value }))} style={styles.input} />
          </div>

          {/* Tip */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Tip</div>
            <div style={styles.tipRow}>
              {[0, 10, 15, 20, 25].map(pct => (
                <button key={pct} onClick={() => setTip(subtotal * pct / 100)} style={{ ...styles.tipBtn, ...(Math.abs(tip - subtotal * pct / 100) < 0.01 ? styles.tipBtnActive : {}) }}>
                  {pct === 0 ? 'No tip' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={styles.totals}>
            <TotalRow label="Subtotal" value={subtotal} />
            <TotalRow label="Tax (8.5%)" value={tax} />
            {tip > 0 && <TotalRow label="Tip" value={tip} />}
            <TotalRow label="Total" value={total} bold />
          </div>

          {/* Age verification */}
          {hasAgeRestricted && (
            <div style={styles.ageSection}>
              <div style={styles.ageTitle}>⚠️ Age Verification Required</div>
              <div style={styles.ageDesc}>Your cart includes cigar or liquor items. You must be 21+ to purchase.</div>
              <label style={styles.ageCheck}>
                <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} />
                <span>I confirm I am 21 or older. Staff may verify ID.</span>
              </label>
            </div>
          )}

          {/* Checkout button */}
          <div style={styles.ctaRow}>
            <button
              onClick={handleCheckout}
              disabled={hasAgeRestricted && !ageConfirmed}
              style={{ ...styles.checkoutBtn, ...(hasAgeRestricted && !ageConfirmed ? styles.checkoutBtnDisabled : {}) }}
            >
              Checkout — ${total.toFixed(2)}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function TotalRow({ label, value, bold }) {
  return (
    <div style={{ ...styles.totalRow, ...(bold ? styles.totalRowBold : {}) }}>
      <span>{label}</span>
      <span>${Number(value).toFixed(2)}</span>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#0f0f0f', color: '#f0e6d3', fontFamily: '"Georgia", serif', paddingBottom: 80 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#1a1208', borderBottom: '1px solid #3d2b10' },
  backBtn: { background: 'none', border: '1px solid #8b6914', color: '#d4a843', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  title: { fontSize: 20, fontWeight: 700, color: '#d4a843', margin: 0 },
  scBtn: { background: 'none', border: '1px solid #3d2b10', color: '#a08040', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  loading: { textAlign: 'center', padding: 60, color: '#8b6914' },
  empty: { textAlign: 'center', padding: 80, color: '#5a4020' },
  browseBtn: { background: '#8b6914', border: 'none', color: '#f0e6d3', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600, marginTop: 16 },
  items: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1208', border: '1px solid #3d2b10', borderRadius: 8, padding: '12px 16px' },
  itemLeft: { flex: 1 },
  itemRight: { display: 'flex', alignItems: 'center', gap: 12 },
  itemName: { fontSize: 15, fontWeight: 600, color: '#f0e6d3' },
  itemCat: { fontSize: 11, color: '#8b6914', textTransform: 'uppercase', marginTop: 2 },
  ageTag: { background: '#3a1a1a', color: '#d04040', padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600 },
  itemQty: { color: '#a08040', fontSize: 14 },
  itemPrice: { color: '#d4a843', fontWeight: 700, fontSize: 15, minWidth: 60, textAlign: 'right' },
  removeBtn: { background: 'none', border: 'none', color: '#8b3030', cursor: 'pointer', fontSize: 16, padding: '0 4px' },
  section: { padding: '0 20px', marginTop: 16 },
  sectionTitle: { fontSize: 13, color: '#8b6914', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  select: { width: '100%', background: '#1a1208', border: '1px solid #3d2b10', color: '#f0e6d3', padding: '10px 12px', borderRadius: 8, fontSize: 14, marginBottom: 8 },
  input: { width: '100%', background: '#1a1208', border: '1px solid #3d2b10', color: '#f0e6d3', padding: '10px 12px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  tipRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tipBtn: { background: '#1a1208', border: '1px solid #3d2b10', color: '#a08040', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13 },
  tipBtnActive: { background: '#8b6914', color: '#f0e6d3', borderColor: '#8b6914' },
  totals: { margin: '20px 20px 0', background: '#1a1208', border: '1px solid #3d2b10', borderRadius: 10, padding: 16 },
  totalRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#a08040', fontSize: 14 },
  totalRowBold: { color: '#d4a843', fontWeight: 700, fontSize: 18, borderTop: '1px solid #3d2b10', marginTop: 6, paddingTop: 12 },
  ageSection: { margin: '16px 20px 0', background: '#2a1208', border: '1px solid #8b3030', borderRadius: 10, padding: 16 },
  ageTitle: { fontSize: 15, fontWeight: 700, color: '#d04040', marginBottom: 6 },
  ageDesc: { fontSize: 13, color: '#c08060', marginBottom: 12 },
  ageCheck: { display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', color: '#f0e6d3', fontSize: 13 },
  ctaRow: { padding: '20px 20px 0' },
  checkoutBtn: { width: '100%', padding: '16px', background: '#8b1a1a', border: 'none', color: '#f0e6d3', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 18 },
  checkoutBtnDisabled: { background: '#3d2020', color: '#6a4040', cursor: 'not-allowed' },
}
