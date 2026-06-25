import { useState, useCallback } from 'react'
import { useNavigate }           from 'react-router-dom'
import { useGuestSession }       from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS }             from '../../constants/session.js'

// APPROVED SMOKECRAFT VISUAL RULE:
// No stock-photo fallback URLs, no CSS-drawn graphics, no cartoon/placeholder art.
// If a real image is missing, render "Image pending" only.

function PairingImage({ src, alt, className, style }) {
  const [failed, setFailed] = useState(!src)
  if (!failed && src) {
    return (
      <img
        className={className}
        style={style}
        alt={alt}
        src={src}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <div
      className={className}
      style={{
        ...style,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(10,6,3,0.85)', border: '1px solid rgba(233,193,118,0.24)',
        color: 'rgba(233,193,118,0.5)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}
    >
      Image pending
    </div>
  )
}

/* ── Pairing data ──────────────────────────────────────────── */
const CIGAR = {
  id:               'cigar-opusx',
  name:             'Arturo Fuente OpusX',
  category:         'Cigar',
  type:             'cigar',
  source:           'humidor',
  imageUrl:         null,
  shortDescription: 'Full-bodied Dominican masterpiece',
  tastingNotes:     'Leather, cedar, baking spice, dark cocoa, and an extraordinarily long finish.',
  pairingReason:    'The anchor of this curated pairing path — everything on this menu was selected to complement its profile.',
  matchScore:       100,
  price:            34,
  inventoryStatus:  'low_stock',
  available:        true,
  orderDestination: 'HUMIDOR',
  tags:             ['Full Bodied', 'Dominican', 'Premium'],
}

const PAIRING_ITEMS = [
  {
    id:               'drink-old-rip',
    name:             'Old Rip Van Winkle',
    category:         'Bourbon',
    type:             'drink',
    source:           'bar',
    imageUrl:         null,
    shortDescription: 'The classic spirit',
    tastingNotes:     'Sweet caramel, baking spice, toasted oak, and warm vanilla with a lingering finish.',
    pairingReason:    'Its full-bodied sweetness balances the spicy pepper finish of the OpusX without overpowering.',
    matchScore:       98,
    price:            42,
    inventoryStatus:  'available',
    available:        true,
    orderDestination: 'BAR',
    tags:             ['Bourbon', 'Full Body', 'Premium'],
  },
  {
    id:               'drink-zacapa',
    name:             'Zacapa Centenario',
    category:         'Rum',
    type:             'drink',
    source:           'bar',
    imageUrl:         null,
    shortDescription: 'The tropical depth',
    tastingNotes:     'Molasses, dried tropical fruit, warm spice, toasted wood, and rich earth.',
    pairingReason:    'Works with the sweet-spiced cedar notes and enhances the cigar\'s earthy mid-section.',
    matchScore:       94,
    price:            28,
    inventoryStatus:  'available',
    available:        true,
    orderDestination: 'BAR',
    tags:             ['Rum', 'Sweet Spice', 'Tropical'],
  },
  {
    id:               'coffee-blue-mountain',
    name:             'Blue Mountain',
    category:         'Coffee',
    type:             'drink',
    source:           'bar',
    imageUrl:         null,
    shortDescription: 'The morning ritual',
    tastingNotes:     'Bright clean acidity, milk chocolate body, smooth finish — no bitterness.',
    pairingReason:    'Cleanses the palate between draws; medium body pairs with creamy wrapper profiles.',
    matchScore:       91,
    price:            12,
    inventoryStatus:  'available',
    available:        true,
    orderDestination: 'BAR',
    tags:             ['Coffee', 'Medium Body', 'Smooth'],
  },
  {
    id:               'dessert-cacao-noir',
    name:             'Cacao Noir 85%',
    category:         'Dessert',
    type:             'food',
    source:           'kitchen',
    imageUrl:         null,
    shortDescription: 'The dark indulgence',
    tastingNotes:     'Bitter cocoa solids, roasted depth, subtle sweetness, mineral finish.',
    pairingReason:    'Mirrors the charred cedar and dark cocoa notes of the cigar\'s final third.',
    matchScore:       96,
    price:            16,
    inventoryStatus:  'available',
    available:        true,
    orderDestination: 'KITCHEN',
    tags:             ['Chocolate', 'Dark Cocoa', 'Dessert'],
  },
]

const BUNDLE = {
  id:               'bundle-opus-signature',
  name:             'OpusX Signature Bundle',
  category:         'Bundle',
  shortDescription: 'The complete curated experience',
  items:            [...PAIRING_ITEMS],
  price:            PAIRING_ITEMS.reduce((s, i) => s + i.price, 0),
}

const DEST_COLORS = {
  BAR:     { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.5)',  text: '#93c5fd', label: 'Bar'     },
  HUMIDOR: { bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.5)',  text: '#D4AF37', label: 'Humidor' },
  KITCHEN: { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.4)',   text: '#86efac', label: 'Kitchen' },
}

const STOCK_LABEL = { available: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Unavailable' }
const STOCK_COLOR = { available: '#86efac', low_stock: '#fcd34d', out_of_stock: '#f87171' }

/* ── Component ─────────────────────────────────────────────── */
export default function Pairing() {
  const navigate = useNavigate()
  const { addXP, completeStep, awardStamp, addPendingOrder, session } = useGuestSession()

  const [cart,          setCart]          = useState([])
  const [selectedItem,  setSelectedItem]  = useState(null)
  const [cartOpen,      setCartOpen]      = useState(false)
  const [orderResult,   setOrderResult]   = useState(null)
  const [orderError,    setOrderError]    = useState(null)
  const [showStamp,     setShowStamp]     = useState(false)
  const [orderNotes,    setOrderNotes]    = useState('')
  const [sending,       setSending]       = useState(false)
  const [savedItems,    setSavedItems]    = useState([])

  const cartCount   = cart.reduce((s, i) => s + i.quantity, 0)
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  /* ── cart helpers ─────────────────────────────────────────── */
  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(c => c.id !== id))
  }, [])

  const changeQty = useCallback((id, delta) => {
    setCart(prev => prev.map(c => c.id === id
      ? { ...c, quantity: Math.max(1, c.quantity + delta) }
      : c
    ))
  }, [])

  const addBundle = useCallback(() => {
    setCart([
      ...PAIRING_ITEMS.map(i => ({ ...i, quantity: 1 })),
      { ...CIGAR, quantity: 1 },
    ])
    setCartOpen(true)
    if (selectedItem) setSelectedItem(null)
  }, [selectedItem])

  const toggleSave = useCallback((id) => {
    setSavedItems(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }, [])

  /* ── send order to API ───────────────────────────────────── */
  async function sendOrder() {
    if (cart.length === 0 || sending) return
    setSending(true)
    setOrderError(null)
    try {
      const payload = {
        guestId:   session?.guestId   || 'guest-demo',
        venueId:   'grand-lounge',
        tableId:   session?.tableId   || null,
        sessionId: session?.sessionId || 'smokecraft-session',
        items:     cart.map(i => ({
          id:               i.id,
          name:             i.name,
          category:         i.category,
          orderDestination: i.orderDestination,
          price:            i.price,
          quantity:         i.quantity,
        })),
        notes: orderNotes,
      }
      const res  = await fetch('/api/pairings/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.ok) {
        setOrderResult(data.order)
        setCart([])
        setCartOpen(false)
        setOrderNotes('')
        if (!session?.completedSteps?.includes('pairing')) {
          addXP(XP_AWARDS.PAIRING_COMPLETE)
          completeStep('pairing')
          awardStamp('pairing-specialist', 'pairing')
          setShowStamp(true)
        }
        cart.forEach(i => addPendingOrder({ id: i.id, name: i.name, type: 'pairing' }))
      }
    } catch (_) {
      // Honest failure — the order was never actually sent to staff. Cart is
      // preserved so the guest can retry instead of seeing a fake success.
      setOrderError('Could not reach the staff order system. Your order was not sent — please try again or ask staff directly.')
    } finally {
      setSending(false)
    }
  }

  /* ── UI helpers ──────────────────────────────────────────── */
  function DestBadge({ destination }) {
    const d = DEST_COLORS[destination] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', text: '#aaa', label: destination }
    return (
      <span style={{
        background: d.bg, border: `1px solid ${d.border}`, color: d.text,
        fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
        padding: '2px 8px', borderRadius: 4, display: 'inline-block',
      }}>{d.label}</span>
    )
  }

  function StockBadge({ status }) {
    return (
      <span style={{
        color: STOCK_COLOR[status] || '#aaa', fontSize: 10,
        fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        ● {STOCK_LABEL[status] || status}
      </span>
    )
  }

  const MatchRing = ({ score, size = 56 }) => {
    const r = (size / 2) - 5
    const circ = 2 * Math.PI * r
    const dash = circ * (score / 100)
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#D4AF37" strokeWidth={4}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.5))' }} />
        <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
          fill="#D4AF37" fontSize={size * 0.22} fontWeight={700}
          style={{ transform: `rotate(90deg) translateX(-${size/2 * 0.05}px)`, transformOrigin: `${size/2}px ${size/2}px`, fontFamily: 'inherit' }}>
          {score}
        </text>
      </svg>
    )
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen"
      style={{ backgroundImage: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.02) 0%, transparent 45%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.018) 0%, transparent 40%)' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 30%, rgba(212,175,55,0.07) 0%, transparent 70%)' }} />

      {/* ── Top App Bar ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-20
        bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className="material-symbols-outlined text-primary hover:bg-surface-variant/50 p-2 rounded-full transition-colors active:scale-95">
            arrow_back
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-label-lg text-label-lg text-primary hidden md:block">Grand Lounge</span>
          {/* Cart button */}
          <button onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 h-[44px] px-4 rounded-lg gold-border text-primary hover:bg-primary/10 transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
            <span className="font-label-md hidden sm:block">Order Tray</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-on-primary
                text-[10px] font-bold flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            )}
          </button>
          <div className="w-9 h-9 rounded-full border border-primary/30 overflow-hidden hidden sm:block">
            <PairingImage alt="Member" className="w-full h-full object-cover" src={null} style={{ fontSize: 7 }} />
          </div>
        </div>
      </header>

      <main className="pt-28 pb-36 px-margin max-w-[1440px] mx-auto">

        {/* Header (legacy supplemental page — not part of the 24-session VISIT_STRUCTURE, so no Round/Visit/Session stepper) */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">Cigar Experience Architect</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-0.5">The Art of Pairing</h2>
          </div>
        </div>

        {/* ── Featured Cigar Hero ───────────────────────────────── */}
        <div className="glass-card rounded-xl overflow-hidden mb-12 flex flex-col md:flex-row shadow-2xl">
          <div className="md:w-1/3 relative h-64 md:h-auto cursor-pointer" onClick={() => setSelectedItem(CIGAR)}>
            <PairingImage className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              alt={CIGAR.name} src={CIGAR.imageUrl} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold border border-primary/40 uppercase tracking-tighter">
                  Featured Selection
                </span>
                <StockBadge status={CIGAR.inventoryStatus} />
              </div>
              <h3 className="font-headline-md text-headline-md text-white">{CIGAR.name}</h3>
              <p className="text-white/60 text-xs mt-1">Tap to view details</p>
            </div>
          </div>
          <div className="md:w-2/3 p-8 flex flex-col justify-between">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {CIGAR.tags.map(t => (
                  <span key={t} className="bg-surface-container-highest text-primary px-3 py-1 rounded-full
                    text-xs font-bold uppercase tracking-widest border border-primary/20">{t}</span>
                ))}
              </div>
              <div className="border-l-4 border-l-primary pl-4 py-2 bg-primary/5 rounded-r-xl mb-5">
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1">Sommelier's Note</p>
                <p className="font-body-lg text-body-lg text-on-surface leading-relaxed italic">
                  "A legendary blend that redefines the pinnacle of tobacco craftsmanship. Each pairing below was curated to elevate its complex notes."
                </p>
              </div>
              <div className="flex gap-5 mb-6">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-sm" style={FILL1}>stars</span>
                  <span className="font-label-lg text-label-lg">Full Bodied</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="font-label-lg text-label-lg">90 min Smoke</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  <span className="font-label-lg text-label-lg">${CIGAR.price}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => addToCart(CIGAR)} disabled={!CIGAR.available}
                className="flex items-center gap-2 bg-primary text-on-primary px-6 h-[56px] rounded-lg font-label-lg uppercase tracking-wider
                  shadow-[0_0_16px_rgba(212,175,55,0.25)] hover:shadow-[0_0_28px_rgba(212,175,55,0.4)] transition-all active:scale-[0.97] disabled:opacity-40">
                <span className="material-symbols-outlined text-[18px]">smoking_rooms</span>
                Add Cigar to Humidor Order
              </button>
              <button onClick={addBundle}
                className="flex items-center gap-2 gold-border text-primary px-6 h-[56px] rounded-lg font-label-lg uppercase tracking-wider hover:bg-primary/10 transition-all active:scale-[0.97]">
                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                Add Full Bundle
              </button>
            </div>
          </div>
        </div>

        {/* ── Pairing Cards Grid ────────────────────────────────── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1">4 Curated Companions</p>
              <h3 className="font-headline-md text-headline-md text-on-surface">Select Your Pairing</h3>
            </div>
            <p className="text-on-surface-variant text-xs">Tap any card to view details and order</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {PAIRING_ITEMS.map(item => (
              <div key={item.id}
                onClick={() => setSelectedItem(item)}
                className="glass-card rounded-xl overflow-hidden shadow-xl cursor-pointer group
                  transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(212,175,55,0.2)]
                  active:scale-[0.98]"
                style={{ touchAction: 'manipulation', minHeight: 64 }}>

                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <PairingImage className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={item.imageUrl} alt={item.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Destination badge top-right */}
                  <div className="absolute top-3 right-3">
                    <DestBadge destination={item.orderDestination} />
                  </div>

                  {/* Category bottom-left */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{item.category}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-headline-md text-headline-md text-primary leading-tight">{item.name}</h4>
                    <MatchRing score={item.matchScore} size={44} />
                  </div>
                  <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">
                    {item.shortDescription}
                  </p>

                  {/* Match score bar */}
                  <div className="mb-3 p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Match Score</span>
                      <span className="text-[10px] font-bold text-primary">{item.matchScore}%</span>
                    </div>
                    <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.matchScore}%` }} />
                    </div>
                  </div>

                  <p className="text-on-surface/60 text-xs leading-relaxed mb-4 line-clamp-2">{item.tastingNotes}</p>

                  {/* Price + stock */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-primary font-bold text-sm">${item.price}</span>
                    <StockBadge status={item.inventoryStatus} />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); if (item.available) addToCart(item) }}
                      disabled={!item.available}
                      className="flex-1 h-[52px] bg-primary text-on-primary rounded-lg font-label-md text-xs uppercase tracking-wide
                        hover:opacity-90 transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                      {item.available ? 'Add to Order' : 'Unavailable'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleSave(item.id) }}
                      className="w-[52px] h-[52px] gold-border text-primary rounded-lg hover:bg-primary/10 transition-all active:scale-[0.97] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]"
                        style={savedItems.includes(item.id) ? FILL1 : undefined}>
                        bookmark
                      </span>
                    </button>
                  </div>
                  <p className="text-center text-on-surface-variant text-[10px] mt-3 uppercase tracking-widest">
                    Tap card to view & order
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Action Bar ──────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center items-center gap-4 py-8 border-t border-outline-variant/20 mt-10">
          <button onClick={addBundle}
            className="flex items-center gap-3 bg-primary text-on-primary px-10 h-[72px] rounded-lg font-label-lg uppercase tracking-widest
              shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all active:scale-[0.97] border border-primary/50">
            <span className="material-symbols-outlined" style={FILL1}>add_shopping_cart</span>
            Add Full Bundle
          </button>
          <button onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 gold-border text-primary px-10 h-[72px] rounded-lg font-label-lg uppercase tracking-widest hover:bg-primary/10 transition-all relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            View Order Tray
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/smokecraft/available')}
            className="flex items-center gap-3 bg-surface-container-highest text-primary px-12 h-[72px] rounded-lg font-label-lg uppercase tracking-widest hover:bg-surface-variant transition-all ml-auto">
            Continue
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════
          ITEM DETAIL MODAL
      ══════════════════════════════════════════════════════════ */}
      {selectedItem && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
          onClick={() => setSelectedItem(null)}>
          <div className="w-full max-w-lg mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(160deg,#1a1208 0%,#100d05 100%)', border: '1px solid rgba(212,175,55,0.2)' }}
            onClick={e => e.stopPropagation()}>

            {/* Hero image */}
            <div className="relative h-56">
              <PairingImage className="w-full h-full object-cover"
                src={selectedItem.imageUrl} alt={selectedItem.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <button onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <DestBadge destination={selectedItem.orderDestination} />
                  <StockBadge status={selectedItem.inventoryStatus} />
                </div>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, color: '#fff', lineHeight: 1.2 }}>
                  {selectedItem.name}
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Match score */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mb-0.5">Match Score</p>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 rounded-full bg-surface-variant overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${selectedItem.matchScore}%` }} />
                    </div>
                    <span className="text-primary font-bold text-sm">{selectedItem.matchScore}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-0.5">Price</p>
                  <p className="text-primary font-bold text-xl">${selectedItem.price}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedItem.tags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedItem.tags.map(t => (
                    <span key={t} className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Tasting notes */}
              <div className="mb-4 p-3.5 rounded-xl" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mb-1.5">Tasting Notes</p>
                <p className="text-on-surface/80 text-sm leading-relaxed">{selectedItem.tastingNotes}</p>
              </div>

              {/* Pairing reason */}
              <div className="mb-5 p-3.5 rounded-xl border-l-2 border-primary"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mb-1.5">Why This Pairing</p>
                <p className="text-on-surface/70 text-sm leading-relaxed italic">{selectedItem.pairingReason}</p>
              </div>

              {/* Unavailable notice */}
              {!selectedItem.available && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  Currently unavailable. Ask staff for a substitute.
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                {selectedItem.type === 'drink' || selectedItem.type === 'cigar' || selectedItem.type === 'food' ? (
                  <button onClick={() => { addToCart(selectedItem); setSelectedItem(null) }}
                    disabled={!selectedItem.available}
                    className="w-full h-[60px] rounded-xl bg-primary text-on-primary font-label-lg uppercase tracking-wider
                      flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40
                      shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_28px_rgba(212,175,55,0.35)]">
                    <span className="material-symbols-outlined">
                      {selectedItem.orderDestination === 'BAR' ? 'local_bar'
                        : selectedItem.orderDestination === 'HUMIDOR' ? 'smoking_rooms'
                        : 'restaurant'}
                    </span>
                    {selectedItem.orderDestination === 'BAR'     ? 'Add Drink to Bar Order'
                      : selectedItem.orderDestination === 'HUMIDOR' ? 'Add Cigar to Humidor Order'
                      : 'Add to Kitchen Order'}
                  </button>
                ) : null}

                <div className="flex gap-2">
                  <button onClick={addBundle}
                    className="flex-1 h-[56px] rounded-xl gold-border text-primary font-label-md uppercase tracking-wide
                      flex items-center justify-center gap-1.5 hover:bg-primary/10 transition-all active:scale-[0.97]">
                    <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                    Add Pairing Bundle
                  </button>
                  <button onClick={() => toggleSave(selectedItem.id)}
                    className="w-[56px] h-[56px] rounded-xl gold-border text-primary flex items-center justify-center
                      hover:bg-primary/10 transition-all active:scale-[0.97]">
                    <span className="material-symbols-outlined text-[18px]"
                      style={savedItems.includes(selectedItem.id) ? FILL1 : undefined}>bookmark</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelectedItem(null)}
                    className="flex-1 h-[56px] rounded-xl text-on-surface-variant font-label-md uppercase tracking-wide
                      flex items-center justify-center gap-1.5 bg-surface-container-high hover:bg-surface-variant transition-all active:scale-[0.97]">
                    <span className="material-symbols-outlined text-[16px]">support_agent</span>
                    Ask Staff
                  </button>
                  <button onClick={() => { setCartOpen(true); setSelectedItem(null) }}
                    className="flex-1 h-[56px] rounded-xl text-primary font-label-md uppercase tracking-wide
                      flex items-center justify-center gap-1.5 bg-surface-container-high hover:bg-primary/10 transition-all active:scale-[0.97]">
                    <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                    View Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          CART / ORDER TRAY DRAWER
      ══════════════════════════════════════════════════════════ */}
      {cartOpen && (
        <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:justify-end"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={() => setCartOpen(false)}>
          <div className="w-full max-w-md h-[90vh] sm:h-full flex flex-col rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none overflow-hidden"
            style={{ background: '#0e0b04', border: '1px solid rgba(212,175,55,0.2)', borderBottom: 'none' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
              <div>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, color: '#D4AF37' }}>Order Tray</h3>
                <p className="text-on-surface-variant text-xs mt-0.5">{cartCount} item{cartCount !== 1 ? 's' : ''} selected</p>
              </div>
              <button onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl opacity-30">shopping_cart</span>
                  <p className="text-sm">Your order tray is empty.</p>
                  <p className="text-xs opacity-60">Tap any pairing card to add items.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <PairingImage src={item.imageUrl} alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0" style={{ fontSize: 8 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                        <DestBadge destination={item.orderDestination} />
                      </div>
                      <p className="text-primary text-xs font-bold">${item.price} ea</p>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => changeQty(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-surface-container text-primary hover:bg-primary/20 transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="text-white font-bold w-4 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => changeQty(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-surface-container text-primary hover:bg-primary/20 transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                      <button onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-full text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors flex items-center justify-center ml-1">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Destinations breakdown */}
            {cart.length > 0 && (
              <div className="px-5 py-3 border-t border-outline-variant/20">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">Order Routing</p>
                <div className="flex flex-wrap gap-2">
                  {['BAR','HUMIDOR','KITCHEN'].map(dest => {
                    const count = cart.filter(i => i.orderDestination === dest).length
                    if (!count) return null
                    const d = DEST_COLORS[dest]
                    return (
                      <div key={dest} style={{ background: d.bg, border: `1px solid ${d.border}`, color: d.text,
                        fontSize: 10, padding: '4px 10px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.1em' }}>
                        {dest} · {count} item{count !== 1 ? 's' : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {cart.length > 0 && (
              <div className="px-5 py-3 border-t border-outline-variant/20">
                <textarea
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Add notes for staff (optional)…"
                  rows={2}
                  className="w-full bg-surface-container rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40
                    border border-outline-variant/30 focus:border-primary/50 focus:outline-none resize-none transition-colors"
                />
              </div>
            )}

            {/* Subtotal + Send */}
            <div className="px-5 py-4 border-t border-outline-variant/20">
              {cart.length > 0 && (
                <div className="flex justify-between items-center mb-3">
                  <span className="text-on-surface-variant text-sm uppercase tracking-widest font-label-sm">Subtotal</span>
                  <span className="text-primary font-bold text-xl">${cartSubtotal.toFixed(2)}</span>
                </div>
              )}
              {orderError && (
                <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(220,80,60,0.12)', border: '1px solid rgba(220,80,60,0.35)', color: '#f0a89a' }}>
                  {orderError}
                </div>
              )}
              <button onClick={sendOrder}
                disabled={cart.length === 0 || sending}
                className="w-full h-[64px] rounded-xl bg-primary text-on-primary font-label-lg uppercase tracking-wider
                  flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-40
                  shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_28px_rgba(212,175,55,0.35)]">
                {sending
                  ? <><span className="material-symbols-outlined animate-spin">progress_activity</span>Sending…</>
                  : <><span className="material-symbols-outlined" style={FILL1}>send</span>Send Order to Staff</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ORDER CONFIRMATION MODAL
      ══════════════════════════════════════════════════════════ */}
      {orderResult && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl text-center"
            style={{ background: 'linear-gradient(160deg,#1a1208,#0e0b04)', border: '1px solid rgba(212,175,55,0.3)' }}>

            {/* Gold top bar */}
            <div style={{ height: 4, background: 'linear-gradient(90deg,#8b6914,#e9c176,#f5d98a,#c5a059,#8b6914)' }} />

            <div className="px-8 py-8">
              {/* Checkmark */}
              <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'rgba(212,175,55,0.12)', border: '2px solid rgba(212,175,55,0.4)' }}>
                <span className="material-symbols-outlined text-primary text-4xl" style={FILL1}>check_circle</span>
              </div>

              <p style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, color: '#D4AF37', marginBottom: 6 }}>
                Pairing Sent to Staff
              </p>
              <p className="text-on-surface-variant text-sm mb-6">Your order is on its way to the team.</p>

              {/* Order summary */}
              <div className="rounded-xl p-4 mb-5 text-left space-y-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant uppercase tracking-widest">Order #</span>
                  <span className="text-primary font-mono font-bold">{orderResult.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant uppercase tracking-widest">Items</span>
                  <span className="text-white font-bold">{orderResult.items?.length || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant uppercase tracking-widest">Est. Wait</span>
                  <span className="text-white font-bold">~12–18 min</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant uppercase tracking-widest">Total</span>
                  <span className="text-primary font-bold">${(orderResult.subtotal || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Destinations */}
              {orderResult.items && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {[...new Set(orderResult.items.map(i => i.destination))].map(dest => (
                    <DestBadge key={dest} destination={dest} />
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button onClick={() => { setOrderResult(null); navigate('/smokecraft/available') }}
                  className="w-full h-[56px] rounded-xl bg-primary text-on-primary font-label-lg uppercase tracking-wider
                    flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.97]">
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  Continue Experience
                </button>
                <button onClick={() => setOrderResult(null)}
                  className="w-full h-[48px] rounded-xl text-on-surface-variant font-label-md uppercase tracking-wide
                    bg-surface-container hover:bg-surface-variant transition-all active:scale-[0.97]">
                  Return to Pairings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Passport Stamp Toast ─────────────────────────────────── */}
      {showStamp && (
        <div className="fixed bottom-8 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[70]">
          <div className="glass-card p-5 rounded-xl border-l-4 border-l-primary flex items-center gap-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 border border-primary/30">
              <span className="material-symbols-outlined text-3xl text-primary" style={FILL1}>workspace_premium</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-headline-md text-headline-md text-primary text-sm">Pairing Specialist</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Stamp earned — passport updated.</p>
            </div>
            <button onClick={() => setShowStamp(false)}
              className="material-symbols-outlined text-on-surface-variant hover:text-white transition-colors flex-shrink-0">
              close
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Nav (mobile) ───────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20
        bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/20 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] md:hidden">
        {[
          { icon: 'explore',      label: 'Explore' },
          { icon: 'inventory_2',  label: 'Inventory' },
          { icon: 'menu_book',    label: 'Passport', active: true },
          { icon: 'auto_awesome', label: 'Assistant' },
        ].map(({ icon, label, active }) => (
          <div key={label}
            className={`flex flex-col items-center justify-center transition-colors ${active ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined" style={active ? FILL1 : undefined}>{icon}</span>
            <span className="font-label-sm text-label-sm text-[10px]">{label}</span>
          </div>
        ))}
      </nav>
    </div>
  )
}
