/**
 * VenueMenuOverlay — premium tablet/kiosk customer self-order panel.
 *
 * Entry points:
 *   <VenueMenuOverlay open onClose={fn} guestSessionId={..} tableId={..} source="customer_self_order" />
 *
 * Paths:
 *   1. Place My Order     → POST /api/pos3/orders → POST /api/pos3/orders/:id/submit
 *   2. Request Staff      → numeric PIN entry → POST /api/auth/staff-pin → staff attaches to order
 *
 * PAYMENT: Card processor not configured. Cash/tab only.
 * All totals are calculated server-side; client display is for reference only.
 *
 * LOCAL PREVIEW: Clearly labeled throughout when backend is unavailable.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { triggerHaptic } from '../../utils/haptics.js'
import {
  fetchVenueMenu,
  verifyStaffPin,
  createOrder,
  submitOrder,
  attachStaffToOrder,
  MENU_CATEGORIES,
} from '../../services/pos3/customerOrderService.js'

const G  = '#E9C176'
const G2 = '#c5a059'
const DARK = '#060402'

const STATION_LABELS = { kitchen:'Kitchen', bar:'Bar', humidor:'Humidor', retail:'Retail', staff:'Staff' }
const STATION_COLORS = { kitchen:'#f0ad4e', bar:'#5bc0de', humidor:'#a97840', retail:'#8aba50', staff:'#d9534f' }

const TAX_RATE = 0.085

// ── Main overlay ──────────────────────────────────────────────
export default function VenueMenuOverlay({ open, onClose, guestSessionId, tableId, tableNumber, source = 'customer_self_order', preselectedItem = null }) {
  const [menuItems, setMenuItems] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [category,  setCategory]  = useState('All')
  const [search,    setSearch]    = useState('')
  const [cart,      setCart]      = useState([])  // { item, quantity, modifiers, notes }
  const [notice,    setNotice]    = useState(null)
  const [syncStatus, setSyncStatus] = useState(null) // 'synced' | 'local_only' | 'sync_failed'
  const [step, setStep] = useState('menu')           // 'menu' | 'cart' | 'confirm_order' | 'staff_pin' | 'success'
  const [submitting,   setSubmitting]   = useState(false)
  const [orderResult,  setOrderResult]  = useState(null)
  const [staffPinState, setStaffPinState] = useState({ pin: '', error: null, checking: false, success: false, staffUser: null })

  const searchRef = useRef(null)

  // Load menu on open
  useEffect(() => {
    if (!open) return
    setStep('menu')
    setCart([])
    setOrderResult(null)
    setSyncStatus(null)
    loadMenu()
  }, [open])

  // Preselect item if provided
  useEffect(() => {
    if (preselectedItem && open && menuItems.length > 0) {
      const found = menuItems.find(i => i.item_id === preselectedItem || i.sku === preselectedItem)
      if (found) addToCart(found)
    }
  }, [preselectedItem, menuItems, open])

  async function loadMenu() {
    setLoading(true)
    const result = await fetchVenueMenu({ category: category === 'All' ? undefined : category, search: search || undefined })
    setMenuItems(result.items || [])
    if (result.localPreview || result.seededDevData) {
      setNotice('Local Preview Mode — menu is sample data. Backend sync not active.')
    }
    setLoading(false)
  }

  // Re-filter locally (avoid re-fetching on every keystroke)
  const displayed = menuItems.filter(item => {
    const catMatch = category === 'All' || item.display_category === category
    const searchMatch = !search || item.item_name?.toLowerCase().includes(search.toLowerCase())
    return catMatch && searchMatch && item.available !== false
  })

  // ── Cart helpers ─────────────────────────────────────────────

  function addToCart(item, modifiers = []) {
    triggerHaptic('light')
    setCart(prev => {
      const existing = prev.findIndex(c => c.item.item_id === item.item_id && JSON.stringify(c.modifiers) === JSON.stringify(modifiers))
      if (existing >= 0) {
        return prev.map((c, i) => i === existing ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { item, quantity: 1, modifiers, notes: '' }]
    })
  }

  function removeFromCart(idx) {
    triggerHaptic('light')
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  function changeQty(idx, delta) {
    setCart(prev => prev.map((c, i) => {
      if (i !== idx) return c
      const q = c.quantity + delta
      return q <= 0 ? null : { ...c, quantity: q }
    }).filter(Boolean))
  }

  const cartTotal = cart.reduce((sum, c) => {
    const base = (c.item.price || 0)
    const modDelta = c.modifiers.reduce((s, m) => s + (m.price_delta || m.priceDelta || 0), 0)
    return sum + (base + modDelta) * c.quantity
  }, 0)
  const cartTax = cartTotal * TAX_RATE
  const cartGrandTotal = cartTotal + cartTax
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  // ── Order submission ─────────────────────────────────────────

  async function handlePlaceOrder() {
    if (cart.length === 0) return
    setSubmitting(true)
    triggerHaptic('medium')

    const items = cart.map(c => ({
      ...c.item,
      quantity: c.quantity,
      modifiers: c.modifiers,
      notes: c.notes,
      price: c.item.price + c.modifiers.reduce((s, m) => s + (m.price_delta || m.priceDelta || 0), 0),
    }))

    const createResult = await createOrder({ guestSessionId, tableId, tableNumber, source, items })

    if (!createResult.ok) {
      setNotice('Failed to create order. Please try again or request staff assistance.')
      setSubmitting(false)
      return
    }

    setSyncStatus(createResult.syncStatus)
    const orderId = createResult.orderId

    const submitResult = await submitOrder(orderId)
    setOrderResult({ orderId, create: createResult, submit: submitResult, staffUser: null })
    setStep('success')
    triggerHaptic('success')
    setSubmitting(false)
  }

  // ── Staff PIN flow ────────────────────────────────────────────

  function handleRequestStaff() {
    triggerHaptic('medium')
    setStep('staff_pin')
    setStaffPinState({ pin: '', error: null, checking: false, success: false, staffUser: null })
  }

  function pinAppend(d) {
    setStaffPinState(p => ({ ...p, pin: p.pin.length < 8 ? p.pin + d : p.pin, error: null }))
  }
  function pinBack() {
    setStaffPinState(p => ({ ...p, pin: p.pin.slice(0, -1), error: null }))
  }

  async function handlePinSubmit() {
    if (staffPinState.pin.length < 4) {
      setStaffPinState(p => ({ ...p, error: 'PIN must be at least 4 digits' }))
      return
    }
    setStaffPinState(p => ({ ...p, checking: true, error: null }))
    triggerHaptic('medium')

    const result = await verifyStaffPin(staffPinState.pin, { guestSessionId, tableId })

    if (!result.backendAvailable) {
      setStaffPinState(p => ({ ...p, checking: false, error: 'Backend unavailable. Staff auth cannot be verified in Local Preview Mode.' }))
      return
    }

    if (!result.ok) {
      setStaffPinState(p => ({ ...p, checking: false, error: result.error || 'Invalid PIN. Access denied.' }))
      triggerHaptic('error')
      return
    }

    // PIN verified — create order as staff-assisted
    setStaffPinState(p => ({ ...p, checking: false, success: true, staffUser: result.staffUser }))
    triggerHaptic('success')

    if (cart.length > 0) {
      const items = cart.map(c => ({
        ...c.item,
        quantity: c.quantity,
        modifiers: c.modifiers,
        notes: c.notes,
        price: c.item.price + c.modifiers.reduce((s, m) => s + (m.price_delta || m.priceDelta || 0), 0),
      }))
      const createResult = await createOrder({ guestSessionId, tableId, tableNumber, source: 'staff_assisted_order', staffUserId: result.staffUser?.id, items })
      if (createResult.ok) {
        await submitOrder(createResult.orderId)
        if (result.staffUser?.id) await attachStaffToOrder(createResult.orderId, result.staffUser, 'waitress_handoff')
        setSyncStatus(createResult.syncStatus)
        setOrderResult({ orderId: createResult.orderId, create: createResult, staffUser: result.staffUser })
      }
    }

    setTimeout(() => setStep('success'), 800)
  }

  if (!open) return null

  // ── STEP: SUCCESS ─────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Overlay onClose={onClose}>
        <div style={s.successBox}>
          <div style={s.successCheck}>✓</div>
          <div style={s.successTitle}>Order Placed</div>
          {orderResult?.orderId && (
            <div style={s.successOrderNum}>Order #{orderResult.orderId.slice(-8).toUpperCase()}</div>
          )}
          {orderResult?.staffUser && (
            <div style={s.successStaff}>{orderResult.staffUser.displayName} is handling your order.</div>
          )}
          {syncStatus === 'local_only' && (
            <div style={s.syncBadge}>⚠ Saved locally — not synced to backend</div>
          )}
          {syncStatus === 'synced' && (
            <div style={{ ...s.syncBadge, background: 'rgba(92,184,92,0.1)', borderColor: 'rgba(92,184,92,0.3)', color: '#5cb85c' }}>
              ✓ Order synced to venue system
            </div>
          )}
          <div style={s.successNote}>Your order has been routed to the relevant station. A staff member will assist you shortly.</div>
          <div style={s.payNote}>Payment: Cash / Tab at end of service. Card payment processor not currently configured.</div>
          <button onClick={onClose} style={s.closeSuccessBtn}>Done</button>
        </div>
      </Overlay>
    )
  }

  // ── STEP: STAFF PIN ───────────────────────────────────────────
  if (step === 'staff_pin') {
    return (
      <Overlay onClose={() => setStep('cart')}>
        <div style={s.pinBox}>
          <div style={s.pinTitle}>Staff Verification</div>
          <div style={s.pinSub}>Staff PIN required to assist guest</div>
          <div style={s.pinDots}>
            {Array.from({ length: Math.max(staffPinState.pin.length, 4) }).map((_, i) => (
              <div key={i} style={{ ...s.pinDot, ...(i < staffPinState.pin.length ? s.pinDotFilled : {}) }} />
            ))}
          </div>
          {staffPinState.error && <div style={s.pinError}>{staffPinState.error}</div>}
          {staffPinState.success && <div style={s.pinSuccess}>✓ Staff verified</div>}
          <div style={s.keypad}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              k === '' ? <div key={i} /> :
              k === '⌫' ? <button key={i} onClick={pinBack} style={s.keyBtn}>{k}</button> :
              <button key={i} onClick={() => pinAppend(k)} style={s.keyBtn}>{k}</button>
            ))}
          </div>
          <button
            onClick={handlePinSubmit}
            disabled={staffPinState.checking || staffPinState.pin.length < 4}
            style={{ ...s.pinSubmit, ...(staffPinState.pin.length < 4 ? s.pinSubmitDisabled : {}) }}
          >
            {staffPinState.checking ? 'Verifying…' : 'Place Order as Staff'}
          </button>
          <button onClick={() => setStep('cart')} style={s.pinCancel}>Cancel — Return to Menu</button>
          <div style={s.pinNote}>Production: PIN is verified against staff credentials via bcrypt. No hardcoded PINs.</div>
        </div>
      </Overlay>
    )
  }

  // ── STEP: CART ────────────────────────────────────────────────
  if (step === 'cart') {
    return (
      <Overlay onClose={onClose}>
        <div style={s.cartHeader}>
          <button onClick={() => setStep('menu')} style={s.backBtn}>← Menu</button>
          <div style={s.cartHeaderTitle}>Your Order</div>
          <button onClick={onClose} style={s.xBtn}>✕</button>
        </div>
        {notice && <div style={s.notice}>{notice}</div>}
        <div style={s.cartBody}>
          {cart.length === 0 ? (
            <div style={s.emptyCart}>No items in your order yet.</div>
          ) : (
            cart.map((c, idx) => (
              <div key={idx} style={s.cartRow}>
                <div style={s.cartRowInfo}>
                  <div style={s.cartItemName}>{c.item.item_name}</div>
                  {c.modifiers.length > 0 && (
                    <div style={s.cartItemMods}>{c.modifiers.map(m => m.label).join(', ')}</div>
                  )}
                  <div style={s.cartItemPrice}>
                    ${((c.item.price + c.modifiers.reduce((s,m)=>s+(m.price_delta||m.priceDelta||0),0)) * c.quantity).toFixed(2)}
                    <span style={s.stationPill}>{STATION_LABELS[c.item.destination_station] || 'Staff'}</span>
                  </div>
                </div>
                <div style={s.qtyCtrl}>
                  <button onClick={() => changeQty(idx, -1)} style={s.qtyBtn}>−</button>
                  <span style={s.qtyNum}>{c.quantity}</span>
                  <button onClick={() => changeQty(idx, +1)} style={s.qtyBtn}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={s.cartTotals}>
            <div style={s.totalRow}><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
            <div style={s.totalRow}><span>Tax (8.5%)</span><span>${cartTax.toFixed(2)}</span></div>
            <div style={{ ...s.totalRow, ...s.totalRowFinal }}><span>Total</span><span>${cartGrandTotal.toFixed(2)}</span></div>
            <div style={s.payHint}>Payment: Cash or tab at service end. Card processor not configured.</div>
          </div>
        )}

        <div style={s.cartActions}>
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || submitting}
            style={{ ...s.placeBtn, ...(cart.length === 0 ? s.placeBtnDisabled : {}) }}
          >
            {submitting ? 'Placing Order…' : 'Place My Order'}
          </button>
          <button onClick={handleRequestStaff} style={s.staffBtn}>
            Request Staff / Waitress
          </button>
        </div>
      </Overlay>
    )
  }

  // ── STEP: MENU (default) ──────────────────────────────────────
  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerTitle}>Venue Menu</div>
          <div style={s.headerSub}>NOVEE Grand Lounge · SmokeCraft Experience</div>
        </div>
        <div style={s.headerRight}>
          {cartCount > 0 && (
            <button onClick={() => setStep('cart')} style={s.cartChip}>
              🛒 {cartCount} · ${cartTotal.toFixed(2)}
            </button>
          )}
          <button onClick={onClose} style={s.xBtn}>✕</button>
        </div>
      </div>

      {notice && <div style={s.notice}>{notice}</div>}

      {/* Search */}
      <div style={s.searchRow}>
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search menu…"
          style={s.searchInput}
        />
      </div>

      {/* Category chips */}
      <div style={s.categories}>
        {['All', ...MENU_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{ ...s.catChip, ...(category === cat ? s.catChipActive : {}) }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu items grid */}
      <div style={s.menuGrid}>
        {loading ? (
          <div style={s.loadingMsg}>Loading menu…</div>
        ) : displayed.length === 0 ? (
          <div style={s.emptyMsg}>No items found.</div>
        ) : (
          displayed.map(item => (
            <MenuItemCard key={item.item_id} item={item} onAdd={addToCart} />
          ))
        )}
      </div>

      {/* Bottom CTA bar */}
      <div style={s.ctaBar}>
        {cartCount > 0 ? (
          <>
            <button onClick={() => setStep('cart')} style={s.viewCartBtn}>
              View Order ({cartCount}) — ${cartGrandTotal.toFixed(2)}
            </button>
            <button onClick={handleRequestStaff} style={s.staffBtnSmall}>
              Request Staff
            </button>
          </>
        ) : (
          <button onClick={handleRequestStaff} style={s.staffBtnFull}>
            Request Staff / Waitress
          </button>
        )}
      </div>
    </Overlay>
  )
}

// ── Menu Item Card ────────────────────────────────────────────
function MenuItemCard({ item, onAdd }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedMods, setSelectedMods] = useState([])

  const modifiers = item.modifier_schema || []
  const station = item.destination_station || 'staff'
  const stationColor = STATION_COLORS[station] || '#888'

  function toggleMod(mod) {
    setSelectedMods(prev => {
      const idx = prev.findIndex(m => m.id === mod.id)
      return idx >= 0 ? prev.filter((_, i) => i !== idx) : [...prev, mod]
    })
  }

  function handleAdd() {
    onAdd(item, selectedMods)
    setSelectedMods([])
    setExpanded(false)
    triggerHaptic('light')
  }

  const modPrice = selectedMods.reduce((s, m) => s + (m.price_delta || m.priceDelta || 0), 0)
  const displayPrice = item.price + modPrice

  return (
    <div style={s.card} onClick={() => setExpanded(e => !e)}>
      <div style={s.cardTop}>
        <div style={s.cardInfo}>
          <div style={s.cardName}>{item.item_name}</div>
          {item.description && <div style={s.cardDesc}>{item.description}</div>}
          <div style={s.cardMeta}>
            <span style={{ ...s.stationDot, background: stationColor }} />
            <span style={s.cardStation}>{STATION_LABELS[station]}</span>
            {item.age_restricted && <span style={s.ageBadge}>21+</span>}
            {item.prep_time_minutes && <span style={s.prepTime}>{item.prep_time_minutes}m</span>}
          </div>
        </div>
        <div style={s.cardPriceCol}>
          <div style={s.cardPrice}>${displayPrice.toFixed(2)}</div>
          <button
            onClick={e => { e.stopPropagation(); handleAdd() }}
            style={s.addBtn}
            aria-label={`Add ${item.item_name}`}
          >
            +
          </button>
        </div>
      </div>

      {expanded && modifiers.length > 0 && (
        <div style={s.modPanel} onClick={e => e.stopPropagation()}>
          <div style={s.modTitle}>Customize</div>
          <div style={s.modList}>
            {modifiers.map(mod => {
              const active = selectedMods.some(m => m.id === mod.id)
              const delta = mod.price_delta || mod.priceDelta || 0
              return (
                <button
                  key={mod.id}
                  onClick={() => toggleMod(mod)}
                  style={{ ...s.modChip, ...(active ? s.modChipActive : {}) }}
                >
                  {mod.label}
                  {delta !== 0 && <span style={s.modPrice}>{delta > 0 ? `+$${delta.toFixed(2)}` : `-$${Math.abs(delta).toFixed(2)}`}</span>}
                </button>
              )
            })}
          </div>
          <button onClick={handleAdd} style={s.addWithModsBtn}>
            Add to Order — ${displayPrice.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Overlay wrapper ───────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  backdrop: { position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'flex-end', justifyContent:'center' },
  sheet: { width:'100%', maxWidth:780, height:'92vh', background:'#0a0703', borderRadius:'20px 20px 0 0', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 -8px 40px rgba(0,0,0,0.6)', border:'1px solid rgba(233,193,118,0.12)' },

  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px 12px', background:'#0f0b07', borderBottom:'1px solid rgba(233,193,118,0.12)', flexShrink:0 },
  headerLeft: {},
  headerTitle: { fontSize:20, fontWeight:700, color:G, fontFamily:'"Georgia", serif', letterSpacing:'0.04em' },
  headerSub: { fontSize:11, color:'rgba(233,193,118,0.4)', fontFamily:'"JetBrains Mono", monospace', marginTop:3 },
  headerRight: { display:'flex', alignItems:'center', gap:10 },

  searchRow: { padding:'10px 16px', flexShrink:0 },
  searchInput: { width:'100%', background:'rgba(233,193,118,0.06)', border:'1px solid rgba(233,193,118,0.2)', color:'#f0e6d3', borderRadius:12, padding:'12px 16px', fontSize:15, fontFamily:'"Georgia", serif', outline:'none', boxSizing:'border-box' },

  categories: { display:'flex', gap:8, padding:'0 16px 10px', overflowX:'auto', flexShrink:0 },
  catChip: { flexShrink:0, background:'none', border:'1px solid rgba(233,193,118,0.18)', color:'rgba(233,193,118,0.5)', padding:'8px 16px', borderRadius:20, cursor:'pointer', fontSize:13, fontFamily:'"JetBrains Mono", monospace', whiteSpace:'nowrap' },
  catChipActive: { background:'rgba(233,193,118,0.14)', color:G, borderColor:G },

  menuGrid: { flex:1, overflowY:'auto', padding:'8px 12px', display:'flex', flexDirection:'column', gap:8 },
  loadingMsg: { color:'rgba(233,193,118,0.4)', textAlign:'center', padding:40, fontFamily:'"JetBrains Mono", monospace', fontSize:12 },
  emptyMsg: { color:'rgba(233,193,118,0.3)', textAlign:'center', padding:40, fontStyle:'italic' },

  // Menu item card
  card: { background:'rgba(233,193,118,0.04)', border:'1px solid rgba(233,193,118,0.1)', borderRadius:14, padding:'14px 16px', cursor:'pointer', transition:'border-color 0.15s', ':hover':{borderColor:'rgba(233,193,118,0.25)'} },
  cardTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 },
  cardInfo: { flex:1 },
  cardName: { fontSize:16, fontWeight:600, color:'#f0e6d3', fontFamily:'"Georgia", serif' },
  cardDesc: { fontSize:12, color:'rgba(233,193,118,0.45)', marginTop:4 },
  cardMeta: { display:'flex', alignItems:'center', gap:8, marginTop:8, flexWrap:'wrap' },
  stationDot: { width:7, height:7, borderRadius:'50%', display:'inline-block' },
  cardStation: { fontSize:11, color:'rgba(233,193,118,0.5)', fontFamily:'"JetBrains Mono", monospace' },
  ageBadge: { fontSize:10, background:'rgba(208,64,64,0.15)', border:'1px solid rgba(208,64,64,0.35)', color:'#e06060', padding:'2px 7px', borderRadius:10, fontFamily:'"JetBrains Mono", monospace' },
  prepTime: { fontSize:10, color:'rgba(233,193,118,0.35)', fontFamily:'"JetBrains Mono", monospace' },
  cardPriceCol: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 },
  cardPrice: { fontSize:18, fontWeight:700, color:G, fontFamily:'"Georgia", serif' },
  addBtn: { width:44, height:44, borderRadius:22, background:G, border:'none', color:DARK, fontSize:24, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 },

  // Modifier panel
  modPanel: { marginTop:12, borderTop:'1px solid rgba(233,193,118,0.1)', paddingTop:12 },
  modTitle: { fontSize:11, color:'rgba(233,193,118,0.45)', fontFamily:'"JetBrains Mono", monospace', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 },
  modList: { display:'flex', flexWrap:'wrap', gap:8 },
  modChip: { background:'none', border:'1px solid rgba(233,193,118,0.2)', color:'rgba(233,193,118,0.6)', padding:'8px 14px', borderRadius:10, cursor:'pointer', fontSize:13, fontFamily:'"Georgia", serif' },
  modChipActive: { background:'rgba(233,193,118,0.14)', color:G, borderColor:G },
  modPrice: { fontSize:11, marginLeft:4, color:'rgba(233,193,118,0.5)' },
  addWithModsBtn: { marginTop:10, width:'100%', background:G, border:'none', color:DARK, padding:'12px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'"Georgia", serif' },

  // CTA bar
  ctaBar: { padding:'12px 16px', background:'#0f0b07', borderTop:'1px solid rgba(233,193,118,0.1)', display:'flex', gap:10, flexShrink:0 },
  viewCartBtn: { flex:1, background:G, border:'none', color:DARK, padding:'16px', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'"Georgia", serif' },
  staffBtnSmall: { background:'rgba(233,193,118,0.08)', border:'1px solid rgba(233,193,118,0.3)', color:G, padding:'16px', borderRadius:14, fontSize:13, cursor:'pointer', fontFamily:'"JetBrains Mono", monospace', whiteSpace:'nowrap' },
  staffBtnFull: { flex:1, background:'rgba(233,193,118,0.08)', border:'1px solid rgba(233,193,118,0.3)', color:G, padding:'16px', borderRadius:14, fontSize:15, cursor:'pointer', fontFamily:'"Georgia", serif' },

  // Cart step
  cartHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', background:'#0f0b07', borderBottom:'1px solid rgba(233,193,118,0.1)', flexShrink:0 },
  cartHeaderTitle: { fontSize:18, fontWeight:700, color:G, fontFamily:'"Georgia", serif' },
  backBtn: { background:'none', border:'none', color:G, fontSize:14, cursor:'pointer', fontFamily:'"JetBrains Mono", monospace', padding:'8px 0' },
  cartBody: { flex:1, overflowY:'auto', padding:'12px 16px' },
  emptyCart: { color:'rgba(233,193,118,0.3)', fontStyle:'italic', textAlign:'center', padding:40 },
  cartRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(233,193,118,0.08)' },
  cartRowInfo: { flex:1 },
  cartItemName: { fontSize:15, color:'#f0e6d3', fontFamily:'"Georgia", serif' },
  cartItemMods: { fontSize:12, color:'rgba(233,193,118,0.45)', marginTop:2 },
  cartItemPrice: { fontSize:14, color:G, marginTop:4, display:'flex', alignItems:'center', gap:8 },
  stationPill: { fontSize:10, background:'rgba(233,193,118,0.1)', border:'1px solid rgba(233,193,118,0.2)', color:'rgba(233,193,118,0.5)', padding:'2px 8px', borderRadius:8, fontFamily:'"JetBrains Mono", monospace' },
  qtyCtrl: { display:'flex', alignItems:'center', gap:12 },
  qtyBtn: { width:36, height:36, borderRadius:18, background:'rgba(233,193,118,0.1)', border:'1px solid rgba(233,193,118,0.25)', color:G, fontSize:18, cursor:'pointer', fontFamily:'"Georgia", serif', lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' },
  qtyNum: { fontSize:16, fontWeight:700, color:'#f0e6d3', minWidth:20, textAlign:'center' },
  cartTotals: { padding:'14px 16px', borderTop:'1px solid rgba(233,193,118,0.12)', flexShrink:0 },
  totalRow: { display:'flex', justifyContent:'space-between', fontSize:14, color:'rgba(233,193,118,0.6)', marginBottom:6 },
  totalRowFinal: { fontSize:18, fontWeight:700, color:G, borderTop:'1px solid rgba(233,193,118,0.15)', paddingTop:8, marginTop:4 },
  payHint: { fontSize:11, color:'rgba(233,193,118,0.3)', fontFamily:'"JetBrains Mono", monospace', marginTop:8 },
  cartActions: { padding:'12px 16px', background:'#0f0b07', borderTop:'1px solid rgba(233,193,118,0.1)', display:'flex', flexDirection:'column', gap:10, flexShrink:0 },
  placeBtn: { background:G, border:'none', color:DARK, padding:'18px', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'"Georgia", serif' },
  placeBtnDisabled: { background:'rgba(233,193,118,0.15)', color:'rgba(233,193,118,0.3)', cursor:'not-allowed' },
  staffBtn: { background:'rgba(233,193,118,0.08)', border:'1px solid rgba(233,193,118,0.3)', color:G, padding:'16px', borderRadius:14, fontSize:15, cursor:'pointer', fontFamily:'"Georgia", serif' },

  // Staff PIN step
  pinBox: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', gap:16, overflowY:'auto' },
  pinTitle: { fontSize:22, fontWeight:600, color:G, fontFamily:'"Georgia", serif', letterSpacing:'0.04em' },
  pinSub: { fontSize:13, color:'rgba(233,193,118,0.45)', fontFamily:'"JetBrains Mono", monospace' },
  pinDots: { display:'flex', gap:14 },
  pinDot: { width:14, height:14, borderRadius:'50%', border:'2px solid rgba(233,193,118,0.3)', background:'transparent' },
  pinDotFilled: { background:G, borderColor:G },
  pinError: { background:'#2a0808', border:'1px solid rgba(208,64,64,0.4)', color:'#e06060', padding:'8px 16px', borderRadius:8, fontSize:13, maxWidth:300, textAlign:'center' },
  pinSuccess: { color:'#5cb85c', fontSize:16, fontWeight:700 },
  keypad: { display:'grid', gridTemplateColumns:'repeat(3, 76px)', gap:10 },
  keyBtn: { height:68, borderRadius:12, background:'rgba(233,193,118,0.07)', border:'1px solid rgba(233,193,118,0.18)', color:G, fontSize:22, fontWeight:300, cursor:'pointer', fontFamily:'"Georgia", serif', touchAction:'manipulation' },
  pinSubmit: { width:240, padding:'14px', background:G, border:'none', color:DARK, borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'"Georgia", serif' },
  pinSubmitDisabled: { background:'rgba(233,193,118,0.15)', color:'rgba(233,193,118,0.3)', cursor:'not-allowed' },
  pinCancel: { background:'none', border:'1px solid rgba(233,193,118,0.15)', color:'rgba(233,193,118,0.4)', padding:'10px 20px', borderRadius:8, cursor:'pointer', fontSize:12, fontFamily:'"JetBrains Mono", monospace' },
  pinNote: { fontSize:10, color:'rgba(233,193,118,0.25)', fontFamily:'"JetBrains Mono", monospace', maxWidth:280, textAlign:'center' },

  // Success step
  successBox: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, gap:14 },
  successCheck: { fontSize:64, color:'#5cb85c' },
  successTitle: { fontSize:24, fontWeight:700, color:'#5cb85c', fontFamily:'"Georgia", serif' },
  successOrderNum: { fontSize:14, color:'rgba(92,184,92,0.6)', fontFamily:'"JetBrains Mono", monospace' },
  successStaff: { fontSize:13, color:G },
  syncBadge: { background:'rgba(233,193,118,0.08)', border:'1px solid rgba(233,193,118,0.2)', color:'rgba(233,193,118,0.5)', padding:'6px 14px', borderRadius:12, fontSize:11, fontFamily:'"JetBrains Mono", monospace' },
  successNote: { fontSize:13, color:'rgba(233,193,118,0.5)', textAlign:'center', maxWidth:320 },
  payNote: { fontSize:11, color:'rgba(233,193,118,0.3)', fontFamily:'"JetBrains Mono", monospace', textAlign:'center', maxWidth:300 },
  closeSuccessBtn: { background:G, border:'none', color:DARK, padding:'14px 40px', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'"Georgia", serif' },

  // Shared
  xBtn: { background:'none', border:'1px solid rgba(233,193,118,0.2)', color:'rgba(233,193,118,0.5)', width:36, height:36, borderRadius:18, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  cartChip: { background:'rgba(233,193,118,0.12)', border:`1px solid rgba(233,193,118,0.3)`, color:G, padding:'8px 14px', borderRadius:20, fontSize:13, fontFamily:'"JetBrains Mono", monospace', cursor:'pointer', whiteSpace:'nowrap' },
  notice: { background:'#1a1a04', borderBottom:'1px solid #5a5a10', color:'#c0b040', padding:'8px 16px', fontSize:11, fontFamily:'"JetBrains Mono", monospace', flexShrink:0 },
}
