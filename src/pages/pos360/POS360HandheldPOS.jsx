/**
 * POS360 Handheld POS Device Suite — Phase B.3
 * Route: /pos3/handheld
 *
 * Handheld-first design: one-handed operation, large touch targets,
 * bottom navigation, premium dark hospitality style.
 * Visual anchor: /smokecraft-pos360.png
 */

import React, { useState, useEffect, useCallback, useContext } from 'react'
import { usePOS360VenueContextHook } from '../../utils/pos360VenueContext.js'

// ── Design tokens ─────────────────────────────────────────────────────────────
const DARK_BG    = '#080604'
const DARK_CARD  = '#13100d'
const DARK_LINE  = '#1e1a16'
const DARK_TEXT  = '#f5f0ea'
const DARK_MUTE  = '#8a7d6e'
const GOLD       = '#c9952c'
const GOLD_DIM   = '#9a701e'
const RED        = '#c94040'
const GREEN      = '#3a9c5e'
const BLUE       = '#3a6b9c'
const AMBER      = '#d4862a'

// ── Shared sub-components ─────────────────────────────────────────────────────

function SyncStatus({ localPreview, isOnline }) {
  if (!localPreview && isOnline !== false) return null
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color: isOnline === false ? AMBER : DARK_MUTE, padding:'4px 10px', borderRadius:4, background:'rgba(201,149,44,0.08)' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: isOnline === false ? AMBER : DARK_MUTE, display:'inline-block' }} />
      {isOnline === false ? 'Offline — changes queued' : 'Local preview'}
    </div>
  )
}

function EmptyState({ icon, title, message }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', gap:12, color:DARK_MUTE, textAlign:'center' }}>
      <span style={{ fontSize:36, opacity:0.5 }}>{icon}</span>
      <div style={{ fontWeight:600, fontSize:14, color:DARK_TEXT }}>{title}</div>
      {message && <div style={{ fontSize:12, lineHeight:1.5, maxWidth:260 }}>{message}</div>}
    </div>
  )
}

function TouchTile({ label, icon, enabled = true, badge, onClick }) {
  return (
    <button
      onClick={enabled ? onClick : undefined}
      style={{
        background: enabled ? DARK_CARD : 'rgba(19,16,13,0.5)',
        border: `1px solid ${enabled ? DARK_LINE : 'rgba(30,26,22,0.4)'}`,
        borderRadius: 12,
        padding: '18px 12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: enabled ? 'pointer' : 'not-allowed',
        opacity: enabled ? 1 : 0.45,
        position: 'relative',
        minHeight: 90,
        transition: 'all 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { if (enabled) e.currentTarget.style.borderColor = GOLD_DIM }}
      onMouseLeave={e => { if (enabled) e.currentTarget.style.borderColor = DARK_LINE }}
    >
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ fontSize: 12, color: enabled ? DARK_TEXT : DARK_MUTE, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      {!enabled && (
        <span style={{ position:'absolute', top:6, right:6, fontSize:10, color:DARK_MUTE }}>🔒</span>
      )}
      {badge > 0 && (
        <span style={{ position:'absolute', top:6, right:6, background:RED, color:'#fff', borderRadius:10, fontSize:10, fontWeight:700, minWidth:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>{badge}</span>
      )}
    </button>
  )
}

function BottomNav({ active, onNav, unreadCount, pendingApprovals }) {
  const tabs = [
    { id:'home',     label:'Home',     icon:'🏠' },
    { id:'orders',   label:'Orders',   icon:'🧾' },
    { id:'tables',   label:'Tables',   icon:'🍽️' },
    { id:'menu',     label:'Menu',     icon:'📋' },
    { id:'payments', label:'Pay',      icon:'💳' },
    { id:'more',     label:'More',     icon:'⋯' },
  ]
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0,
      background: DARK_CARD,
      borderTop: `1px solid ${DARK_LINE}`,
      display:'flex',
      zIndex:100,
      paddingBottom:'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onNav(t.id)}
          style={{
            flex:1, padding:'8px 4px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            background:'transparent', border:'none', cursor:'pointer',
            color: active === t.id ? GOLD : DARK_MUTE,
            fontSize:11, fontWeight: active === t.id ? 700 : 400,
            position:'relative',
            WebkitTapHighlightColor:'transparent',
          }}
        >
          <span style={{ fontSize:20 }}>{t.icon}</span>
          <span>{t.label}</span>
          {t.id === 'more' && (unreadCount > 0 || pendingApprovals > 0) && (
            <span style={{ position:'absolute', top:4, right:'25%', width:8, height:8, borderRadius:'50%', background:RED }} />
          )}
        </button>
      ))}
    </nav>
  )
}

// ── Handheld Home ─────────────────────────────────────────────────────────────

function HandheldHome({ venueCtx, homeState, onNav }) {
  const tiles = [
    { id:'new_order',     label:'New Order',   icon:'🧾', nav:'orders',   enabled:true },
    { id:'tables',        label:'Tables',      icon:'🍽️',  nav:'tables',   enabled:true },
    { id:'open_tabs',     label:'Open Tabs',   icon:'📑',  nav:'orders',   enabled:true },
    { id:'payments',      label:'Payments',    icon:'💳',  nav:'payments', enabled:true },
    { id:'smokecraft',    label:'SmokeCraft',  icon:'🚬',  nav:'smokecraft',enabled:true },
    { id:'guests',        label:'Guests',      icon:'👥',  nav:'guests',   enabled:true },
    { id:'loyalty',       label:'Loyalty',     icon:'🏅',  nav:'loyalty',  enabled:true },
    { id:'reports',       label:'Reports',     icon:'📊',  nav:'reports',  enabled: venueCtx?.role !== 'staff' },
    { id:'notifications', label:'Notifications',icon:'🔔', nav:'notifications', enabled:true, badge: homeState?.unreadNotifications },
    { id:'settings',      label:'Settings',    icon:'⚙️',  nav:'settings', enabled: venueCtx?.role !== 'staff' },
  ]

  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:11, color:DARK_MUTE, marginBottom:2 }}>NOVEE OS · POS360</div>
          <div style={{ fontSize:18, fontWeight:700, color:DARK_TEXT }}>Handheld POS</div>
        </div>
        <SyncStatus localPreview={homeState?.localPreview} isOnline={navigator.onLine} />
      </div>

      {venueCtx?.isLocalFallback && (
        <div style={{ background:'rgba(212,134,42,0.1)', border:`1px solid ${AMBER}`, borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:12, color:AMBER }}>
          Local dev mode — venue context not authenticated.
        </div>
      )}

      {homeState?.pendingApprovals > 0 && (
        <div
          onClick={() => onNav('approvals')}
          style={{ background:'rgba(201,149,44,0.12)', border:`1px solid ${GOLD_DIM}`, borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:13, color:GOLD, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
        >
          <span>⏳ {homeState.pendingApprovals} pending manager approval{homeState.pendingApprovals > 1 ? 's' : ''}</span>
          <span style={{ fontSize:10 }}>View →</span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:16 }}>
        {tiles.map(t => (
          <TouchTile
            key={t.id}
            label={t.label}
            icon={t.icon}
            enabled={t.enabled}
            badge={t.badge}
            onClick={() => onNav(t.nav)}
          />
        ))}
      </div>

      {/* SmokeCraft visual anchor */}
      <div
        onClick={() => onNav('smokecraft')}
        style={{
          backgroundImage:'url(/smokecraft-pos360.png)',
          backgroundSize:'cover', backgroundPosition:'center',
          borderRadius:12, height:100, position:'relative', cursor:'pointer',
          border:`1px solid ${DARK_LINE}`, overflow:'hidden', marginBottom:16,
        }}
      >
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(8,6,4,0.85) 0%, rgba(8,6,4,0.3) 100%)', borderRadius:12 }} />
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 16px' }}>
          <div style={{ fontSize:11, color:GOLD, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>SmokeCraft</div>
          <div style={{ fontSize:14, color:DARK_TEXT, fontWeight:600 }}>Guest Intelligence</div>
          <div style={{ fontSize:11, color:DARK_MUTE }}>Flavor profiles · Pairings · Loyalty</div>
        </div>
      </div>

      {homeState?.offlineQueueCount > 0 && (
        <div style={{ background:'rgba(201,149,44,0.08)', border:`1px solid ${DARK_LINE}`, borderRadius:8, padding:'8px 12px', fontSize:12, color:DARK_MUTE, marginBottom:16 }}>
          📦 {homeState.offlineQueueCount} action{homeState.offlineQueueCount > 1 ? 's' : ''} queued offline
        </div>
      )}
    </div>
  )
}

// ── Dynamic Menu ──────────────────────────────────────────────────────────────

function HandheldDynamicMenu({ venueCtx, onItemSelect }) {
  const [menuState, setMenuState]     = useState(null)
  const [categories, setCategories]   = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [items, setItems]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')

  const venueId = venueCtx?.venueId

  useEffect(() => {
    if (!venueId) return
    setLoading(true)
    fetch(`/api/pos360/menu/venues/${venueId}/handheld/active-menu`)
      .then(r => r.json())
      .then(d => {
        setMenuState(d)
        if (d.categories) setCategories(d.categories)
      })
      .catch(() => setMenuState({ error: 'network_error' }))
      .finally(() => setLoading(false))
  }, [venueId])

  useEffect(() => {
    if (!activeCategory || !venueId) return
    fetch(`/api/pos360/menu/venues/${venueId}/handheld/categories/${activeCategory}/items`)
      .then(r => r.json())
      .then(d => { if (d.items) setItems(d.items) })
      .catch(() => {})
  }, [activeCategory, venueId])

  useEffect(() => {
    if (!search || !venueId) return
    const t = setTimeout(() => {
      fetch(`/api/pos360/menu/venues/${venueId}/handheld/search?q=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(d => { if (d.items) setItems(d.items) })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [search, venueId])

  if (!venueId) {
    return <EmptyState icon="🏪" title="No venue context" message="Sign in to access the menu." />
  }

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:200 }}>
        <div style={{ width:24, height:24, border:`2px solid ${GOLD}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (menuState?.message?.includes('No active menu')) {
    return <EmptyState icon="📋" title="No active menu" message="No active menu configured for this venue." />
  }

  return (
    <div style={{ padding:'0 16px' }}>
      {/* Search bar */}
      <div style={{ position:'relative', marginBottom:12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search menu items..."
          style={{
            width:'100%', padding:'10px 12px 10px 36px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`,
            borderRadius:10, color:DARK_TEXT, fontSize:14, boxSizing:'border-box',
          }}
        />
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:DARK_MUTE, fontSize:16 }}>🔍</span>
      </div>

      {/* Dynamic category pills — from DB, never hardcoded */}
      {!search && categories.length > 0 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:12, scrollbarWidth:'none' }}>
          {categories.map(cat => (
            <button
              key={cat.id || cat.category_id}
              onClick={() => setActiveCategory(cat.id || cat.category_id)}
              style={{
                background: activeCategory === (cat.id || cat.category_id) ? GOLD : DARK_CARD,
                color: activeCategory === (cat.id || cat.category_id) ? DARK_BG : DARK_TEXT,
                border: `1px solid ${activeCategory === (cat.id || cat.category_id) ? GOLD : DARK_LINE}`,
                borderRadius:20, padding:'6px 14px', fontSize:13, fontWeight:600,
                whiteSpace:'nowrap', cursor:'pointer',
                WebkitTapHighlightColor:'transparent',
              }}
            >
              {cat.category_name || cat.name}
            </button>
          ))}
        </div>
      )}

      {!search && categories.length === 0 && (
        <EmptyState icon="📂" title="No categories" message="Categories are loaded dynamically from the venue's menu configuration." />
      )}

      {/* Items list */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => onItemSelect && onItemSelect(item)}
            style={{
              background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:10,
              padding:'12px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = GOLD_DIM}
            onMouseLeave={e => e.currentTarget.style.borderColor = DARK_LINE}
          >
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:DARK_TEXT, marginBottom:2 }}>{item.item_name}</div>
              {item.description && <div style={{ fontSize:12, color:DARK_MUTE, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.description}</div>}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:15, fontWeight:700, color:GOLD }}>
                {item.base_price != null ? `$${parseFloat(item.base_price).toFixed(2)}` : '—'}
              </div>
              {item.status === 'out_of_stock' && <div style={{ fontSize:10, color:RED, fontWeight:700 }}>OUT OF STOCK</div>}
            </div>
          </div>
        ))}
        {activeCategory && items.length === 0 && (
          <EmptyState icon="🍽️" title="No items" message="No items in this category." />
        )}
      </div>
    </div>
  )
}

// ── Tables Panel ──────────────────────────────────────────────────────────────

function HandheldTables({ venueCtx }) {
  const [tables, setTables]   = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const venueId = venueCtx?.venueId

  useEffect(() => {
    if (!venueId) return
    setLoading(true)
    fetch(`/api/pos360/handheld/venues/${venueId}/tables`)
      .then(r => r.json())
      .then(d => { if (d.tables) setTables(d.tables) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [venueId])

  const STATUS_COLOR = {
    available:        GREEN,
    occupied:         BLUE,
    ordered:          GOLD,
    needs_attention:  RED,
    check_dropped:    AMBER,
    payment_pending:  AMBER,
    dirty:            DARK_MUTE,
    reserved:         '#9c3a9c',
    blocked:          RED,
  }

  const sync = () => {
    if (!venueId) return
    setSyncing(true)
    fetch(`/api/pos360/handheld/venues/${venueId}/tables/sync`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) })
      .then(r => r.json())
      .then(d => { if (d.tables) setTables(d.tables) })
      .catch(() => {})
      .finally(() => setSyncing(false))
  }

  if (!venueId) return <EmptyState icon="🏪" title="No venue" message="Sign in to view tables." />

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT }}>Floor Tables</div>
        <button
          onClick={sync}
          disabled={syncing}
          style={{ background:'transparent', border:`1px solid ${DARK_LINE}`, borderRadius:8, padding:'6px 12px', color:GOLD, fontSize:12, cursor:'pointer' }}
        >
          {syncing ? '⟳ Syncing…' : '⟳ Sync'}
        </button>
      </div>

      {loading ? (
        <EmptyState icon="⏳" title="Loading tables…" />
      ) : tables.length === 0 ? (
        <EmptyState icon="🍽️" title="No tables found" message="No tables configured. Set up floor sections in Floor Management." />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
          {tables.map(t => (
            <div
              key={t.id}
              style={{
                background:DARK_CARD, border:`2px solid ${STATUS_COLOR[t.status] || DARK_LINE}`,
                borderRadius:10, padding:'12px 8px', textAlign:'center', cursor:'pointer',
              }}
            >
              <div style={{ fontSize:18, fontWeight:700, color:DARK_TEXT }}>{t.table_number || t.table_name}</div>
              <div style={{ fontSize:10, color: STATUS_COLOR[t.status] || DARK_MUTE, fontWeight:600, textTransform:'uppercase', marginTop:2 }}>
                {(t.status || 'unknown').replace(/_/g, ' ')}
              </div>
              {t.section_name && <div style={{ fontSize:10, color:DARK_MUTE, marginTop:2 }}>{t.section_name}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Orders Panel ──────────────────────────────────────────────────────────────

function HandheldOrders({ venueCtx, onCreateOrder }) {
  const [cart, setCart]           = useState([])
  const [tableId, setTableId]     = useState('')
  const [orderNote, setOrderNote] = useState('')
  const [creating, setCreating]   = useState(false)
  const [result, setResult]       = useState(null)

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1, modifiers: [], addons: [] }]
    })
  }

  const removeFromCart = (itemId) => setCart(prev => prev.filter(c => c.id !== itemId))

  const subtotal = cart.reduce((sum, c) => sum + (parseFloat(c.base_price || 0) * c.qty), 0)

  const submitOrder = async () => {
    if (!venueCtx?.venueId) return
    setCreating(true)
    try {
      const r = await fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/orders`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tableId, orderNote, items: cart, deviceId: venueCtx.deviceId, staffUserId: venueCtx.staffUserId })
      })
      const d = await r.json()
      setResult(d)
      if (d.ok) setCart([])
    } catch (e) {
      setResult({ ok: false, error: e.message })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT, marginBottom:12 }}>New Order</div>

      {result && (
        <div style={{
          background: result.ok ? 'rgba(58,156,94,0.1)' : 'rgba(201,64,64,0.1)',
          border: `1px solid ${result.ok ? GREEN : RED}`,
          borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:13,
          color: result.ok ? GREEN : RED,
        }}>
          {result.ok ? `✓ Order ${result.orderId} created` : `✗ ${result.error || 'Failed'}`}
          {result.message && <div style={{ fontSize:11, color:DARK_MUTE, marginTop:4 }}>{result.message}</div>}
        </div>
      )}

      <input
        value={tableId}
        onChange={e => setTableId(e.target.value)}
        placeholder="Table ID or number (optional)"
        style={{ width:'100%', padding:'10px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, color:DARK_TEXT, fontSize:13, marginBottom:10, boxSizing:'border-box' }}
      />

      {/* Cart */}
      {cart.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:DARK_MUTE, marginBottom:6, fontWeight:600 }}>CART ({cart.length} item{cart.length > 1 ? 's' : ''})</div>
          {cart.map(item => (
            <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, marginBottom:6 }}>
              <div>
                <div style={{ fontSize:13, color:DARK_TEXT, fontWeight:600 }}>{item.item_name}</div>
                <div style={{ fontSize:11, color:DARK_MUTE }}>
                  {item.qty} × ${parseFloat(item.base_price || 0).toFixed(2)}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <button
                  onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: Math.max(1, c.qty - 1) } : c))}
                  style={{ background:DARK_LINE, border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:DARK_TEXT, fontSize:16 }}
                >−</button>
                <span style={{ color:DARK_TEXT, fontSize:13, minWidth:16, textAlign:'center' }}>{item.qty}</span>
                <button
                  onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))}
                  style={{ background:DARK_LINE, border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:DARK_TEXT, fontSize:16 }}
                >+</button>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{ background:'transparent', border:'none', cursor:'pointer', color:RED, fontSize:16, padding:'0 4px' }}
                >✕</button>
              </div>
            </div>
          ))}

          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', background:`${GOLD}18`, border:`1px solid ${GOLD_DIM}`, borderRadius:8, marginBottom:10 }}>
            <span style={{ color:DARK_TEXT, fontWeight:600 }}>Subtotal</span>
            <span style={{ color:GOLD, fontWeight:700, fontSize:16 }}>${subtotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      <textarea
        value={orderNote}
        onChange={e => setOrderNote(e.target.value)}
        placeholder="Order notes…"
        rows={2}
        style={{ width:'100%', padding:'10px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, color:DARK_TEXT, fontSize:13, marginBottom:12, boxSizing:'border-box', resize:'none' }}
      />

      <button
        onClick={submitOrder}
        disabled={creating || cart.length === 0}
        style={{
          width:'100%', padding:'14px', background: cart.length === 0 ? DARK_LINE : GOLD, border:'none',
          borderRadius:10, color: cart.length === 0 ? DARK_MUTE : DARK_BG, fontSize:15, fontWeight:700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {creating ? 'Placing Order…' : `Place Order${cart.length > 0 ? ` · $${subtotal.toFixed(2)}` : ''}`}
      </button>

      {cart.length === 0 && (
        <div style={{ marginTop:16 }}>
          <EmptyState icon="📋" title="Cart is empty" message="Browse the Menu tab and add items to build an order." />
        </div>
      )}
    </div>
  )
}

// ── Payments Panel ────────────────────────────────────────────────────────────

function HandheldPayments({ venueCtx }) {
  const [tipPercent, setTipPercent]   = useState(null)
  const [customTip, setCustomTip]     = useState('')
  const [orderId, setOrderId]         = useState('')
  const [amount, setAmount]           = useState('')
  const [method, setMethod]           = useState('credit_card')
  const [payResult, setPayResult]     = useState(null)
  const [tipResult, setTipResult]     = useState(null)
  const [options, setOptions]         = useState(null)

  useEffect(() => {
    if (!venueCtx?.venueId) return
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/payment-options`)
      .then(r => r.json()).then(setOptions).catch(() => {})
  }, [venueCtx?.venueId])

  const tipPresets = options?.tipPresets || [15, 18, 20, 25]
  const amountNum  = parseFloat(amount) || 0
  const tipAmt     = tipPercent != null ? (amountNum * tipPercent / 100) : parseFloat(customTip) || 0

  const initPayment = async () => {
    if (!venueCtx?.venueId) return
    const r = await fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/payment-intent`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ orderId, amount: amountNum, currency:'USD', paymentMethod: method })
    })
    setPayResult(await r.json())
  }

  const saveTip = async () => {
    if (!venueCtx?.venueId || !orderId) return
    const r = await fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/orders/${orderId}/tip`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tipAmount: tipAmt, tipPercent })
    })
    setTipResult(await r.json())
  }

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT, marginBottom:12 }}>Payments</div>

      {options && !options.providerConnected && (
        <div style={{ background:'rgba(212,134,42,0.08)', border:`1px solid ${AMBER}`, borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:AMBER }}>
          ⚠️ Payment provider not connected. Configure payment integration to enable real transactions.
        </div>
      )}

      <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Order ID" style={{ width:'100%', padding:'10px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, color:DARK_TEXT, fontSize:13, marginBottom:10, boxSizing:'border-box' }} />
      <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="Amount ($)" style={{ width:'100%', padding:'10px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, color:DARK_TEXT, fontSize:13, marginBottom:10, boxSizing:'border-box' }} />

      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:DARK_MUTE, marginBottom:6, fontWeight:600 }}>PAYMENT METHOD</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {(options?.methods || ['credit_card','debit_card','apple_pay','google_pay']).map(m => (
            <button key={m} onClick={() => setMethod(m)}
              style={{ background: method === m ? GOLD : DARK_CARD, border:`1px solid ${method===m ? GOLD : DARK_LINE}`, borderRadius:8, padding:'6px 12px', fontSize:12, color: method===m ? DARK_BG : DARK_TEXT, cursor:'pointer' }}>
              {m.replace(/_/g,' ')}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:DARK_MUTE, marginBottom:6, fontWeight:600 }}>TIP</div>
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          {tipPresets.map(p => (
            <button key={p} onClick={() => { setTipPercent(p); setCustomTip('') }}
              style={{ flex:1, padding:'10px 4px', background: tipPercent===p ? GOLD : DARK_CARD, border:`1px solid ${tipPercent===p ? GOLD : DARK_LINE}`, borderRadius:8, color: tipPercent===p ? DARK_BG : DARK_TEXT, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {p}%
            </button>
          ))}
          <button onClick={() => setTipPercent(null)}
            style={{ padding:'10px 12px', background: tipPercent===null && !customTip ? GOLD : DARK_CARD, border:`1px solid ${tipPercent===null && !customTip ? GOLD : DARK_LINE}`, borderRadius:8, color: tipPercent===null && !customTip ? DARK_BG : DARK_TEXT, fontSize:13, cursor:'pointer' }}>
            Custom
          </button>
        </div>
        {tipPercent === null && (
          <input value={customTip} onChange={e => setCustomTip(e.target.value)} type="number" step="0.01" placeholder="Custom tip ($)"
            style={{ width:'100%', padding:'10px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, color:DARK_TEXT, fontSize:13, boxSizing:'border-box' }} />
        )}
        {amountNum > 0 && (tipPercent != null || parseFloat(customTip) > 0) && (
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:13, color:DARK_MUTE }}>
            <span>Tip</span><span style={{ color:GOLD, fontWeight:600 }}>${tipAmt.toFixed(2)}</span>
          </div>
        )}
      </div>

      {orderId && (
        <button onClick={saveTip} style={{ width:'100%', padding:'12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, color:GOLD, fontSize:14, cursor:'pointer', marginBottom:8 }}>
          Save Tip
        </button>
      )}

      {tipResult && (
        <div style={{ padding:'8px 12px', background:'rgba(58,156,94,0.1)', border:`1px solid ${GREEN}`, borderRadius:8, fontSize:12, color:GREEN, marginBottom:8 }}>
          ✓ Tip captured
        </div>
      )}

      <button onClick={initPayment} disabled={!orderId || !amountNum}
        style={{ width:'100%', padding:'14px', background: (!orderId||!amountNum) ? DARK_LINE : GOLD, border:'none', borderRadius:10, color: (!orderId||!amountNum) ? DARK_MUTE : DARK_BG, fontSize:15, fontWeight:700, cursor: (!orderId||!amountNum) ? 'not-allowed' : 'pointer' }}>
        Charge ${(amountNum + tipAmt).toFixed(2)}
      </button>

      {payResult && (
        <div style={{ marginTop:10, padding:'10px 14px', background: payResult.ok ? 'rgba(58,156,94,0.1)' : 'rgba(212,134,42,0.1)', border:`1px solid ${payResult.ok ? GREEN : AMBER}`, borderRadius:8, fontSize:12, color: payResult.ok ? GREEN : AMBER }}>
          {payResult.message || (payResult.ok ? 'Payment processed' : 'Payment failed')}
        </div>
      )}

      <div style={{ marginTop:20 }}>
        <div style={{ fontSize:12, color:DARK_MUTE, fontWeight:600, marginBottom:8 }}>CONTACTLESS & DIGITAL</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[['🍎 Apple Pay', false], ['🤖 Google Pay', false], ['📱 Tap to Pay', false], ['🎁 Gift Card', false]].map(([label, enabled]) => (
            <div key={label} style={{ background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:13, color: enabled ? DARK_TEXT : DARK_MUTE }}>{label}</div>
              <div style={{ fontSize:10, color:DARK_MUTE, marginTop:2 }}>Provider required</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── SmokeCraft Panel ──────────────────────────────────────────────────────────

function HandheldSmokeCraftPanel({ venueCtx }) {
  const [guestId, setGuestId]       = useState('')
  const [scData, setScData]         = useState(null)
  const [loading, setLoading]       = useState(false)

  const loadContext = () => {
    if (!guestId || !venueCtx?.venueId) return
    setLoading(true)
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/guests/${guestId}/smokecraft`)
      .then(r => r.json()).then(setScData).catch(e => setScData({ error: e.message }))
      .finally(() => setLoading(false))
  }

  return (
    <div style={{ padding:'0 16px' }}>
      <div
        style={{
          backgroundImage:'url(/smokecraft-pos360.png)', backgroundSize:'cover', backgroundPosition:'center',
          borderRadius:12, height:80, position:'relative', marginBottom:16, border:`1px solid ${DARK_LINE}`, overflow:'hidden',
        }}
      >
        <div style={{ position:'absolute', inset:0, background:'rgba(8,6,4,0.75)', borderRadius:12 }} />
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 16px' }}>
          <div style={{ fontSize:16, fontWeight:700, color:DARK_TEXT }}>SmokeCraft Intelligence</div>
          <div style={{ fontSize:11, color:GOLD }}>Guest profiles · Pairings · Passport · Loyalty</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <input value={guestId} onChange={e => setGuestId(e.target.value)} placeholder="Guest ID or lookup"
          style={{ flex:1, padding:'10px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, color:DARK_TEXT, fontSize:13 }} />
        <button onClick={loadContext} disabled={loading || !guestId}
          style={{ padding:'10px 16px', background:GOLD, border:'none', borderRadius:8, color:DARK_BG, fontWeight:700, cursor:'pointer' }}>
          {loading ? '…' : 'Load'}
        </button>
      </div>

      {scData ? (
        scData.error ? (
          <div style={{ color:RED, fontSize:13 }}>Error: {scData.error}</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Passport Status', value: scData.passportStatus, empty:'Not enrolled' },
              { label:'Loyalty Status',  value: scData.loyaltyStatus,  empty:'No loyalty data' },
              { label:'Flavor Memory',   value: scData.flavorMemory?.join(', '), empty:'No flavor history' },
              { label:'Pairing Recs',    value: scData.pairingRecommendations?.length > 0 ? `${scData.pairingRecommendations.length} available` : null, empty:'No recommendations' },
              { label:'XP Eligibility',  value: scData.xpRewardEligibility, empty:'Not eligible' },
            ].map(({ label, value, empty }) => (
              <div key={label} style={{ background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, padding:'10px 14px' }}>
                <div style={{ fontSize:11, color:DARK_MUTE, marginBottom:3 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize:14, color: value ? DARK_TEXT : DARK_MUTE }}>{value || empty}</div>
              </div>
            ))}
            {scData.message && <div style={{ fontSize:11, color:DARK_MUTE, fontStyle:'italic' }}>{scData.message}</div>}
          </div>
        )
      ) : (
        <EmptyState icon="🚬" title="SmokeCraft Guest Intelligence" message="Enter a guest ID above to load their SmokeCraft profile, flavor memory, and pairing recommendations." />
      )}
    </div>
  )
}

// ── Guest / Loyalty Panel ─────────────────────────────────────────────────────

function HandheldGuestPanel({ venueCtx }) {
  const [searchQ, setSearchQ]   = useState('')
  const [guests, setGuests]     = useState([])
  const [selected, setSelected] = useState(null)
  const [loyalty, setLoyalty]   = useState(null)

  const doSearch = () => {
    if (!venueCtx?.venueId || !searchQ) return
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/guests/search?q=${encodeURIComponent(searchQ)}`)
      .then(r => r.json()).then(d => setGuests(d.guests || [])).catch(() => {})
  }

  const loadGuest = (g) => {
    setSelected(g)
    if (!venueCtx?.venueId) return
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/guests/${g.id}/loyalty`)
      .then(r => r.json()).then(setLoyalty).catch(() => {})
  }

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT, marginBottom:12 }}>Guests & Loyalty</div>

      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="Search guests by name / email…"
          style={{ flex:1, padding:'10px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, color:DARK_TEXT, fontSize:13 }} />
        <button onClick={doSearch} style={{ padding:'10px 16px', background:GOLD, border:'none', borderRadius:8, color:DARK_BG, fontWeight:700, cursor:'pointer' }}>Go</button>
      </div>

      {guests.map(g => (
        <div key={g.id} onClick={() => loadGuest(g)}
          style={{ background:DARK_CARD, border:`1px solid ${selected?.id === g.id ? GOLD : DARK_LINE}`, borderRadius:8, padding:'10px 14px', marginBottom:8, cursor:'pointer' }}>
          <div style={{ fontWeight:600, color:DARK_TEXT }}>{g.first_name} {g.last_name}</div>
          {g.email && <div style={{ fontSize:12, color:DARK_MUTE }}>{g.email}</div>}
        </div>
      ))}

      {selected && loyalty && (
        <div style={{ marginTop:12, background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontWeight:700, color:GOLD, marginBottom:8 }}>{selected.first_name} — Loyalty</div>
          {loyalty.message && <div style={{ fontSize:12, color:DARK_MUTE, fontStyle:'italic' }}>{loyalty.message}</div>}
          {!loyalty.loyaltyProfile && <div style={{ fontSize:13, color:DARK_MUTE }}>No loyalty profile found.</div>}
        </div>
      )}

      {guests.length === 0 && !searchQ && (
        <EmptyState icon="👥" title="Guest lookup" message="Search by name, email, or phone to find a guest profile." />
      )}
    </div>
  )
}

// ── Notifications Panel ───────────────────────────────────────────────────────

function HandheldNotifications({ venueCtx }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!venueCtx?.venueId) return
    setLoading(true)
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/notifications?unreadOnly=false`)
      .then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(() => {})
      .finally(() => setLoading(false))
  }, [venueCtx?.venueId])

  const markRead = (id) => {
    if (!venueCtx?.venueId) return
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/notifications/${id}/read`, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' })
      .then(() => setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read:true } : n)))
      .catch(() => {})
  }

  if (loading) return <EmptyState icon="⏳" title="Loading…" />
  if (notifications.length === 0) return <EmptyState icon="🔔" title="No notifications" message="You're all caught up." />

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT, marginBottom:12 }}>Notifications</div>
      {notifications.map(n => (
        <div key={n.id}
          style={{ background:DARK_CARD, border:`1px solid ${n.is_read ? DARK_LINE : GOLD_DIM}`, borderRadius:8, padding:'12px 14px', marginBottom:8, opacity: n.is_read ? 0.6 : 1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
            <div style={{ fontSize:13, fontWeight:600, color:DARK_TEXT }}>{n.title}</div>
            {!n.is_read && <button onClick={() => markRead(n.id)} style={{ fontSize:10, color:GOLD, background:'transparent', border:'none', cursor:'pointer' }}>Mark read</button>}
          </div>
          {n.body && <div style={{ fontSize:12, color:DARK_MUTE }}>{n.body}</div>}
          <div style={{ fontSize:10, color:DARK_MUTE, marginTop:4 }}>{new Date(n.created_at).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  )
}

// ── Device Diagnostics ────────────────────────────────────────────────────────

function HandheldDeviceDiagnostics({ venueCtx }) {
  const [diag, setDiag] = useState(null)
  const [loading, setLoading] = useState(false)

  const deviceId = venueCtx?.deviceId || 'local-dev-device'
  const venueId  = venueCtx?.venueId

  const loadDiag = () => {
    if (!venueId) return
    setLoading(true)
    fetch(`/api/pos360/handheld/venues/${venueId}/devices/${deviceId}/diagnostics`)
      .then(r => r.json()).then(setDiag).catch(() => setDiag({ error: 'unavailable' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDiag() }, [venueId])

  const deviceInfo = [
    { label:'Device ID',       value: deviceId },
    { label:'Device Type',     value: venueCtx?.deviceType || 'handheld' },
    { label:'Network',         value: navigator.onLine ? 'Online' : 'Offline' },
    { label:'App Version',     value: diag?.diagnostics?.app_version || import.meta.env.VITE_APP_VERSION || 'dev' },
    { label:'Battery',         value: diag?.diagnostics?.battery_level != null ? `${diag.diagnostics.battery_level}%` : 'N/A' },
    { label:'Card Reader',     value: diag?.diagnostics?.card_reader_status || 'Not connected' },
    { label:'Printer',         value: diag?.diagnostics?.printer_status || 'Not connected' },
    { label:'KDS',             value: diag?.diagnostics?.kds_status || 'Not connected' },
    { label:'Scanner',         value: diag?.diagnostics?.scanner_status || 'Scanner provider not connected.' },
    { label:'Camera',          value: diag?.diagnostics?.camera_permission || 'Permission not granted' },
    { label:'Offline Queue',   value: diag?.diagnostics?.offline_queue_count ?? '—' },
    { label:'Last Sync',       value: diag?.diagnostics?.last_sync_at ? new Date(diag.diagnostics.last_sync_at).toLocaleTimeString() : 'Never' },
  ]

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT }}>Device Diagnostics</div>
        <button onClick={loadDiag} disabled={loading} style={{ fontSize:12, color:GOLD, background:'transparent', border:`1px solid ${DARK_LINE}`, borderRadius:6, padding:'5px 10px', cursor:'pointer' }}>
          {loading ? '…' : '↺ Refresh'}
        </button>
      </div>
      {deviceInfo.map(({ label, value }) => (
        <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'9px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, marginBottom:6 }}>
          <span style={{ fontSize:12, color:DARK_MUTE }}>{label}</span>
          <span style={{ fontSize:12, color:DARK_TEXT, fontWeight:600, maxWidth:180, textAlign:'right' }}>{String(value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Offline Queue Panel ───────────────────────────────────────────────────────

function HandheldOfflineQueue({ venueCtx }) {
  const [queue, setQueue]     = useState([])
  const [loading, setLoading] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const [result, setResult]   = useState(null)

  const deviceId = venueCtx?.deviceId || 'local-dev-device'
  const venueId  = venueCtx?.venueId

  const loadQueue = () => {
    if (!venueId) return
    setLoading(true)
    fetch(`/api/pos360/handheld/venues/${venueId}/devices/${deviceId}/offline-queue`)
      .then(r => r.json()).then(d => setQueue(d.queue || [])).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadQueue() }, [venueId])

  const replay = async () => {
    if (!venueId) return
    setReplaying(true)
    const r = await fetch(`/api/pos360/handheld/venues/${venueId}/devices/${deviceId}/offline-queue/replay`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' })
    setResult(await r.json())
    setReplaying(false)
    loadQueue()
  }

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT }}>Offline Queue</div>
        <button onClick={loadQueue} style={{ fontSize:12, color:GOLD, background:'transparent', border:`1px solid ${DARK_LINE}`, borderRadius:6, padding:'5px 10px', cursor:'pointer' }}>↺</button>
      </div>

      {result && (
        <div style={{ background:'rgba(212,134,42,0.08)', border:`1px solid ${AMBER}`, borderRadius:8, padding:'8px 12px', marginBottom:10, fontSize:12, color:AMBER }}>
          {result.message}
        </div>
      )}

      {queue.length > 0 && (
        <button onClick={replay} disabled={replaying} style={{ width:'100%', padding:'10px', background:GOLD, border:'none', borderRadius:8, color:DARK_BG, fontWeight:700, cursor:'pointer', marginBottom:12 }}>
          {replaying ? 'Replaying…' : `Replay ${queue.length} Queued Action${queue.length > 1 ? 's' : ''}`}
        </button>
      )}

      {loading ? <EmptyState icon="⏳" title="Loading queue…" /> :
       queue.length === 0 ? <EmptyState icon="✅" title="Queue empty" message="No offline actions pending sync." /> :
       queue.map(a => (
         <div key={a.id} style={{ background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
           <div style={{ display:'flex', justifyContent:'space-between' }}>
             <div style={{ fontSize:13, fontWeight:600, color:DARK_TEXT }}>{a.action_type}</div>
             <div style={{ fontSize:11, color: a.queue_status==='pending' ? AMBER : a.queue_status==='replayed' ? GREEN : RED }}>{a.queue_status}</div>
           </div>
           <div style={{ fontSize:11, color:DARK_MUTE, marginTop:2 }}>{new Date(a.created_at).toLocaleString()}</div>
         </div>
       ))
      }
    </div>
  )
}

// ── Manager Approvals Panel ───────────────────────────────────────────────────

function HandheldManagerApprovals({ venueCtx }) {
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!venueCtx?.venueId) return
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/manager-approvals`)
      .then(r => r.json()).then(d => setApprovals(d.approvals || [])).catch(() => {})
      .finally(() => setLoading(false))
  }, [venueCtx?.venueId])

  const resolve = (approvalId, decision) => {
    if (!venueCtx?.venueId) return
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/manager-approvals/${approvalId}/resolve`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ decision })
    }).then(() => setApprovals(prev => prev.filter(a => a.id !== approvalId))).catch(() => {})
  }

  if (loading) return <EmptyState icon="⏳" title="Loading approvals…" />
  if (approvals.length === 0) return <EmptyState icon="✅" title="No pending approvals" message="All approvals are up to date." />

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT, marginBottom:12 }}>Manager Approvals</div>
      {approvals.map(a => (
        <div key={a.id} style={{ background:DARK_CARD, border:`1px solid ${GOLD_DIM}`, borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:600, color:DARK_TEXT, marginBottom:4 }}>{a.action_type?.replace(/_/g,' ').toUpperCase()}</div>
          <div style={{ fontSize:12, color:DARK_MUTE, marginBottom:8 }}>
            Requested by: {a.requesting_staff_id} · {new Date(a.requested_at).toLocaleTimeString()}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => resolve(a.id, 'approve')}
              style={{ flex:1, padding:'10px', background:GREEN, border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer' }}>
              ✓ Approve
            </button>
            <button onClick={() => resolve(a.id, 'deny')}
              style={{ flex:1, padding:'10px', background:RED, border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer' }}>
              ✗ Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Emergency Mode Panel ──────────────────────────────────────────────────────

function HandheldEmergencyMode({ venueCtx }) {
  const [activating, setActivating] = useState(false)
  const [type, setType]             = useState('general')
  const [notes, setNotes]           = useState('')
  const [result, setResult]         = useState(null)

  const TYPES = ['general','fire','medical','security','power_loss','network_loss']

  const activate = async () => {
    if (!venueCtx?.venueId) return
    setActivating(true)
    const r = await fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/emergency`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ emergencyType: type, notes, deviceId: venueCtx.deviceId, staffUserId: venueCtx.staffUserId })
    })
    setResult(await r.json())
    setActivating(false)
  }

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ background:'rgba(201,64,64,0.1)', border:`2px solid ${RED}`, borderRadius:12, padding:'20px 16px', marginBottom:16, textAlign:'center' }}>
        <div style={{ fontSize:24, marginBottom:8 }}>🚨</div>
        <div style={{ fontSize:16, fontWeight:700, color:RED, marginBottom:4 }}>Emergency Mode</div>
        <div style={{ fontSize:12, color:DARK_MUTE }}>Activates emergency protocols for this device and venue.</div>
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:DARK_MUTE, marginBottom:6, fontWeight:600 }}>EMERGENCY TYPE</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)}
              style={{ padding:'8px 10px', background: type===t ? 'rgba(201,64,64,0.2)' : DARK_CARD, border:`1px solid ${type===t ? RED : DARK_LINE}`, borderRadius:8, color: type===t ? RED : DARK_MUTE, fontSize:12, cursor:'pointer' }}>
              {t.replace(/_/g,' ')}
            </button>
          ))}
        </div>
      </div>

      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={3}
        style={{ width:'100%', padding:'10px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, color:DARK_TEXT, fontSize:13, marginBottom:12, boxSizing:'border-box', resize:'none' }} />

      {result && (
        <div style={{ padding:'10px 14px', background: result.ok ? 'rgba(201,64,64,0.1)' : 'rgba(30,26,22,1)', border:`1px solid ${result.ok ? RED : DARK_LINE}`, borderRadius:8, fontSize:12, color: result.ok ? RED : DARK_MUTE, marginBottom:12 }}>
          {result.ok ? '🚨 Emergency mode activated. Log ID: ' + (result.emergency?.id || '—') : (result.error || 'Failed')}
        </div>
      )}

      <button onClick={activate} disabled={activating}
        style={{ width:'100%', padding:'16px', background: activating ? DARK_LINE : RED, border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, cursor: activating ? 'not-allowed' : 'pointer' }}>
        {activating ? 'Activating…' : '🚨 Activate Emergency Mode'}
      </button>
    </div>
  )
}

// ── Reports Preview ───────────────────────────────────────────────────────────

function HandheldReportsPreview({ venueCtx }) {
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (!venueCtx?.venueId) return
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/reports/preview`)
      .then(r => r.json()).then(setReport).catch(() => {})
  }, [venueCtx?.venueId])

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT, marginBottom:12 }}>Reports Preview</div>
      {report?.message && (
        <div style={{ fontSize:12, color:DARK_MUTE, fontStyle:'italic', marginBottom:12 }}>{report.message}</div>
      )}
      {[
        { label:"Today's Sales",     value: report?.todaySales,        empty:'—' },
        { label:'Open Orders',       value: report?.openOrders,        empty:'—' },
        { label:'Table Status',      value: report?.tableStatusCounts, empty:'—' },
        { label:'Payment Status',    value: report?.paymentStatus,     empty:'—' },
      ].map(({ label, value, empty }) => (
        <div key={label} style={{ background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, padding:'12px 14px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, color:DARK_MUTE }}>{label}</span>
          <span style={{ fontSize:14, color: value != null ? GOLD : DARK_MUTE, fontWeight:600 }}>{value != null ? JSON.stringify(value) : empty}</span>
        </div>
      ))}
      <EmptyState icon="📊" title="Full reports coming in Phase B.6" message="Connect reporting service for real-time sales, staff activity, and SmokeCraft analytics." />
    </div>
  )
}

// ── Settings Panel ────────────────────────────────────────────────────────────

function HandheldSettings({ venueCtx }) {
  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT, marginBottom:16 }}>Settings</div>
      {[
        { label:'Venue', value: venueCtx?.venueId || 'Not configured' },
        { label:'Location', value: venueCtx?.locationId || '—' },
        { label:'Staff ID', value: venueCtx?.staffUserId || 'Not signed in' },
        { label:'Role', value: venueCtx?.role || '—' },
        { label:'Device ID', value: venueCtx?.deviceId || '—' },
        { label:'Context', value: venueCtx?.isLocalFallback ? 'Local dev' : 'Authenticated' },
      ].map(({ label, value }) => (
        <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', background:DARK_CARD, border:`1px solid ${DARK_LINE}`, borderRadius:8, marginBottom:8 }}>
          <span style={{ fontSize:12, color:DARK_MUTE }}>{label}</span>
          <span style={{ fontSize:12, color:DARK_TEXT, fontWeight:600, maxWidth:200, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

// ── More Menu ─────────────────────────────────────────────────────────────────

function MoreMenu({ onNav }) {
  const items = [
    { id:'smokecraft',    label:'SmokeCraft',        icon:'🚬', desc:'Guest intelligence & pairings' },
    { id:'guests',        label:'Guests',            icon:'👥', desc:'Guest profiles & history' },
    { id:'loyalty',       label:'Loyalty',           icon:'🏅', desc:'Rewards & member status' },
    { id:'reports',       label:'Reports',           icon:'📊', desc:'Sales & activity preview' },
    { id:'notifications', label:'Notifications',     icon:'🔔', desc:'Alerts & updates' },
    { id:'settings',      label:'Settings',          icon:'⚙️',  desc:'Device & venue settings' },
    { id:'diagnostics',   label:'Diagnostics',       icon:'🔬', desc:'Device health & sync status' },
    { id:'offline',       label:'Offline Queue',     icon:'📦', desc:'Queued actions pending sync' },
    { id:'approvals',     label:'Manager Approvals', icon:'✅', desc:'Pending approval requests' },
    { id:'emergency',     label:'Emergency Mode',    icon:'🚨', desc:'Activate emergency protocols', danger: true },
  ]

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT, marginBottom:12 }}>More</div>
      {items.map(item => (
        <div key={item.id} onClick={() => onNav(item.id)}
          style={{ background:DARK_CARD, border:`1px solid ${item.danger ? 'rgba(201,64,64,0.3)' : DARK_LINE}`, borderRadius:10, padding:'12px 14px', marginBottom:8, cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = item.danger ? RED : GOLD_DIM}
          onMouseLeave={e => e.currentTarget.style.borderColor = item.danger ? 'rgba(201,64,64,0.3)' : DARK_LINE}
        >
          <span style={{ fontSize:22 }}>{item.icon}</span>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color: item.danger ? RED : DARK_TEXT }}>{item.label}</div>
            <div style={{ fontSize:11, color:DARK_MUTE }}>{item.desc}</div>
          </div>
          <span style={{ marginLeft:'auto', color:DARK_MUTE, fontSize:14 }}>›</span>
        </div>
      ))}
    </div>
  )
}

// ── Item Detail Drawer ────────────────────────────────────────────────────────

function ItemDetailDrawer({ item, venueCtx, onAddToCart, onClose }) {
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!item || !venueCtx?.venueId) return
    fetch(`/api/pos360/menu/venues/${venueCtx.venueId}/items/${item.id}/resolve`)
      .then(r => r.json()).then(setDetail).catch(() => {})
  }, [item?.id, venueCtx?.venueId])

  if (!item) return null

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end',
    }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(2px)' }} />
      <div style={{
        position:'relative', background:DARK_CARD, borderRadius:'16px 16px 0 0',
        border:`1px solid ${DARK_LINE}`, padding:'20px 16px 32px',
        maxHeight:'80vh', overflowY:'auto',
      }}>
        <div style={{ width:40, height:4, background:DARK_LINE, borderRadius:2, margin:'0 auto 16px' }} />
        <div style={{ fontSize:17, fontWeight:700, color:DARK_TEXT, marginBottom:4 }}>{item.item_name}</div>
        {item.description && <div style={{ fontSize:13, color:DARK_MUTE, marginBottom:12, lineHeight:1.5 }}>{item.description}</div>}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, padding:'10px 14px', background:DARK_BG, borderRadius:8 }}>
          <span style={{ fontSize:13, color:DARK_MUTE }}>Base price</span>
          <span style={{ fontSize:18, fontWeight:700, color:GOLD }}>
            {item.base_price != null ? `$${parseFloat(item.base_price).toFixed(2)}` : '—'}
          </span>
        </div>

        {detail?.activePrice != null && detail.activePrice !== item.base_price && (
          <div style={{ padding:'8px 12px', background:`${GOLD}18`, borderRadius:8, marginBottom:12, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:DARK_MUTE }}>Active price</span>
            <span style={{ fontSize:14, fontWeight:700, color:GOLD }}>${parseFloat(detail.activePrice).toFixed(2)}</span>
          </div>
        )}

        {detail?.tax != null && (
          <div style={{ padding:'8px 12px', background:DARK_BG, borderRadius:8, marginBottom:12, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:DARK_MUTE }}>Tax</span>
            <span style={{ fontSize:12, color:DARK_TEXT }}>{detail.tax}%</span>
          </div>
        )}

        {item.status === 'out_of_stock' ? (
          <div style={{ width:'100%', padding:'14px', background:RED, border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, textAlign:'center' }}>
            Out of Stock
          </div>
        ) : (
          <button onClick={() => { onAddToCart && onAddToCart(item); onClose() }}
            style={{ width:'100%', padding:'14px', background:GOLD, border:'none', borderRadius:10, color:DARK_BG, fontSize:15, fontWeight:700, cursor:'pointer' }}>
            Add to Order
          </button>
        )}
      </div>
    </div>
  )
}

// ── E.A.T. Panel ──────────────────────────────────────────────────────────────

function HandheldEATPanel({ venueCtx }) {
  const [recs, setRecs] = useState(null)

  useEffect(() => {
    if (!venueCtx?.venueId) return
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/recommendations`)
      .then(r => r.json()).then(setRecs).catch(() => {})
  }, [venueCtx?.venueId])

  return (
    <div style={{ padding:'0 16px' }}>
      <div style={{ fontSize:15, fontWeight:700, color:DARK_TEXT, marginBottom:12 }}>E.A.T. Intelligence</div>
      {recs?.message && <div style={{ fontSize:12, color:DARK_MUTE, fontStyle:'italic', marginBottom:12 }}>{recs.message}</div>}
      {(!recs?.recommendations?.length && !recs?.managerAlerts?.length) && (
        <EmptyState icon="🤖" title="E.A.T. not connected" message="E.A.T. recommendation engine requires integration. No recommendations available." />
      )}
    </div>
  )
}

// ── Main POS360 Handheld POS ──────────────────────────────────────────────────

export default function POS360HandheldPOS() {
  const venueCtx  = usePOS360VenueContextHook()
  const [tab, setTab]           = useState('home')
  const [homeState, setHomeState] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    if (!venueCtx?.venueId) return
    const params = new URLSearchParams({
      staffUserId: venueCtx.staffUserId || '',
      deviceId:    venueCtx.deviceId || '',
    })
    fetch(`/api/pos360/handheld/venues/${venueCtx.venueId}/home?${params}`)
      .then(r => r.json()).then(setHomeState).catch(() => {})
  }, [venueCtx?.venueId])

  const addToCart = useCallback((item) => {
    setCartItems(prev => {
      const ex = prev.find(c => c.id === item.id)
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }, [])

  const unreadCount     = homeState?.unreadNotifications || 0
  const pendingApprovals = homeState?.pendingApprovals || 0

  const renderTab = () => {
    switch (tab) {
      case 'home':          return <HandheldHome venueCtx={venueCtx} homeState={homeState} onNav={setTab} />
      case 'menu':          return <HandheldDynamicMenu venueCtx={venueCtx} onItemSelect={setSelectedItem} />
      case 'tables':        return <HandheldTables venueCtx={venueCtx} />
      case 'orders':        return <HandheldOrders venueCtx={venueCtx} />
      case 'payments':      return <HandheldPayments venueCtx={venueCtx} />
      case 'more':          return <MoreMenu onNav={setTab} />
      case 'smokecraft':    return <HandheldSmokeCraftPanel venueCtx={venueCtx} />
      case 'guests':
      case 'loyalty':       return <HandheldGuestPanel venueCtx={venueCtx} />
      case 'notifications': return <HandheldNotifications venueCtx={venueCtx} />
      case 'reports':       return <HandheldReportsPreview venueCtx={venueCtx} />
      case 'settings':      return <HandheldSettings venueCtx={venueCtx} />
      case 'diagnostics':   return <HandheldDeviceDiagnostics venueCtx={venueCtx} />
      case 'offline':       return <HandheldOfflineQueue venueCtx={venueCtx} />
      case 'approvals':     return <HandheldManagerApprovals venueCtx={venueCtx} />
      case 'emergency':     return <HandheldEmergencyMode venueCtx={venueCtx} />
      case 'eat':           return <HandheldEATPanel venueCtx={venueCtx} />
      default:              return <HandheldHome venueCtx={venueCtx} homeState={homeState} onNav={setTab} />
    }
  }

  const tabLabels = {
    home:'Home', menu:'Menu', tables:'Tables', orders:'Orders', payments:'Payments',
    more:'More', smokecraft:'SmokeCraft', guests:'Guests', loyalty:'Loyalty',
    reports:'Reports', notifications:'Notifications', settings:'Settings',
    diagnostics:'Diagnostics', offline:'Offline Queue', approvals:'Approvals',
    emergency:'Emergency', eat:'E.A.T.',
  }

  return (
    <div style={{ background:DARK_BG, minHeight:'100dvh', color:DARK_TEXT, fontFamily:'system-ui,sans-serif', position:'relative' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input, textarea, button { font-family: inherit; }
        input::placeholder, textarea::placeholder { color: #8a7d6e; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1a16; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <header style={{
        position:'sticky', top:0, zIndex:90, background:DARK_CARD,
        borderBottom:`1px solid ${DARK_LINE}`, padding:'10px 16px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button
            onClick={() => setTab('home')}
            style={{ background:'transparent', border:'none', cursor:'pointer', padding:0 }}
            title="Home"
          >
            <div style={{ width:28, height:28, borderRadius:6, background:GOLD, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:DARK_BG }}>P</div>
          </button>
          <div>
            <div style={{ fontSize:11, color:DARK_MUTE, lineHeight:1 }}>POS360</div>
            <div style={{ fontSize:13, fontWeight:700, color:DARK_TEXT, lineHeight:1.2 }}>{tabLabels[tab] || 'Handheld'}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {!navigator.onLine && (
            <div style={{ fontSize:10, color:AMBER, background:'rgba(212,134,42,0.12)', padding:'3px 8px', borderRadius:4, fontWeight:600 }}>OFFLINE</div>
          )}
          {venueCtx?.isLocalFallback && (
            <div style={{ fontSize:10, color:DARK_MUTE, background:DARK_LINE, padding:'3px 8px', borderRadius:4 }}>DEV</div>
          )}
          <button onClick={() => setTab('notifications')}
            style={{ background:'transparent', border:'none', cursor:'pointer', position:'relative', fontSize:18, padding:'2px 4px' }}>
            🔔
            {unreadCount > 0 && <span style={{ position:'absolute', top:-2, right:-2, width:8, height:8, borderRadius:'50%', background:RED }} />}
          </button>
        </div>
      </header>

      {/* Main content — padded for bottom nav */}
      <main style={{ paddingBottom: 80, paddingTop:8, overflowY:'auto' }}>
        {renderTab()}
      </main>

      {/* Bottom navigation */}
      <BottomNav
        active={['home','orders','tables','menu','payments','more'].includes(tab) ? tab : 'more'}
        onNav={setTab}
        unreadCount={unreadCount}
        pendingApprovals={pendingApprovals}
      />

      {/* Item detail drawer */}
      {selectedItem && (
        <ItemDetailDrawer
          item={selectedItem}
          venueCtx={venueCtx}
          onAddToCart={addToCart}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
