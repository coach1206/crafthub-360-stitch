import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Wine, Beer, GlassWater, UtensilsCrossed, Plus, Minus, CheckCircle2, ChefHat, SplitSquareHorizontal, ShieldCheck, X } from 'lucide-react'
import { useSecurity } from '../context/SecurityContext.jsx'
import {
  getActiveOrders, getTables, getProviderInventory,
  getProviderStatus, getPOS3Providers, sendRecommendation, getStaff,
} from '../services/pos3IntegrationApiService.js'

const FADE    = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.07 } } }

const categories = ['All', 'Smoke', 'Pour', 'Beer', 'Wine', 'Food']

const menuItems = [
  { id: 1, name: 'Robusto Select',    cat: 'Smoke', price: 42,  Icon: Flame,           emoji: '🔥', desc: 'Nicaragua · Ring 50 · 2021' },
  { id: 2, name: 'Old Fashioned',     cat: 'Pour',  price: 18,  Icon: GlassWater,      emoji: '🥃', desc: 'Bourbon · Stirred · 38% ABV' },
  { id: 3, name: 'Barrel Stout',      cat: 'Beer',  price: 12,  Icon: Beer,            emoji: '🖤', desc: 'Imperial Stout · 11.2%' },
  { id: 4, name: 'Opus One Pour',     cat: 'Wine',  price: 65,  Icon: Wine,            emoji: '🍷', desc: 'Napa Valley · 2018 · 98pts' },
  { id: 5, name: 'Tasting Flight',    cat: 'Food',  price: 34,  Icon: UtensilsCrossed, emoji: '🍽️', desc: "5-course · Chef's selection" },
  { id: 6, name: 'Churchill Reserve', cat: 'Smoke', price: 78,  Icon: Flame,           emoji: '🔥', desc: 'Dominican · Ring 47 · 96pts' },
  { id: 7, name: 'Negroni',           cat: 'Pour',  price: 17,  Icon: GlassWater,      emoji: '🍊', desc: 'Gin · Campari · Vermouth' },
  { id: 8, name: 'Gold Haze IPA',     cat: 'Beer',  price: 11,  Icon: Beer,            emoji: '🌟', desc: 'NEIPA · 6.8% · 42 IBU' },
]

const MODIFIERS = {
  Smoke: [
    { key: 'strength', label: 'Strength',  options: ['Mild', 'Medium', 'Full Body'] },
    { key: 'cut',      label: 'Cut',        options: ['Straight Cut', 'V-Cut', 'Punch Cut'] },
    { key: 'light',    label: 'Light With', options: ['Cedar Match', 'Soft Flame', 'Torch'] },
  ],
  Pour: [
    { key: 'size',    label: 'Size',    options: ['Single', 'Double', 'Neat'] },
    { key: 'ice',     label: 'Ice',     options: ['No Ice', 'Rocks', 'Sphere'] },
    { key: 'garnish', label: 'Garnish', options: ['Standard', 'Extra', 'None'] },
  ],
  Beer: [
    { key: 'temp',  label: 'Temperature', options: ['Cold', 'Extra Cold', 'Draft Temp'] },
    { key: 'glass', label: 'Glass',       options: ['Pint', 'Tulip', 'Snifter'] },
  ],
  Wine: [
    { key: 'format', label: 'Format',      options: ['Glass', 'Half Bottle', 'Bottle'] },
    { key: 'temp',   label: 'Temperature', options: ['Cellar Temp', 'Slight Chill', 'Room Temp'] },
  ],
  Food: [
    { key: 'temp',    label: 'Temperature', options: ['Hot', 'Warm', 'Room Temp'] },
    { key: 'allergy', label: 'Allergen',    options: ['None', 'No Nuts', 'No Dairy', 'No Gluten'] },
    { key: 'portion', label: 'Portion',     options: ['Standard', 'Half Portion', 'Double Portion'] },
  ],
}

const PROVIDER = 'prototype'
const statusColor = {
  occupied:  '#D4AF37',
  available: '#5A9A5A',
  reserved:  '#7A7A7A',
  closed:    '#3A3A3A',
}
const TABLE_SEATS = { T1:2, T2:4, T3:6, T4:4, T5:2, T6:8, T7:2, T8:4, T9:2, T10:6, T11:4, T12:2, T13:4 }

export default function POS3() {
  const navigate = useNavigate()
  const { role, hasPermission } = useSecurity()
  const isStaff   = ['staff','manager','admin','founder_level_0'].includes(role)
  const isManager = ['manager','admin','founder_level_0'].includes(role)
  const isAdmin   = ['admin','founder_level_0'].includes(role)
  const isFounder = role === 'founder_level_0'

  // ── Cart & checkout ────────────────────────────────────────────────
  const [cart, setCart]       = useState([])
  const [cat, setCat]         = useState('All')
  const [charged, setCharged] = useState(false)

  // ── New POS features ───────────────────────────────────────────────
  const [modifierModal, setModifierModal] = useState(null)       // { item, selections:{} }
  const [kitchenFired,  setKitchenFired]  = useState(new Set())  // set of cart itemIds fired to kitchen
  const [barFired,      setBarFired]      = useState(new Set())  // set of cart itemIds fired to bar
  const [kitchenFlash,  setKitchenFlash]  = useState(false)
  const [barFlash,      setBarFlash]      = useState(false)
  const [splitMode,     setSplitMode]     = useState(false)
  const [splitA,        setSplitA]        = useState([])
  const [splitB,        setSplitB]        = useState([])
  const [chargedA,      setChargedA]      = useState(false)
  const [chargedB,      setChargedB]      = useState(false)
  const [overrideActive,setOverrideActive]= useState(false)
  const [discountPct,   setDiscountPct]   = useState(0)
  const [compItems,     setCompItems]     = useState(new Set())
  const [selectedTable, setSelectedTable] = useState(null)       // table object for detail drawer
  const [checkClosed,   setCheckClosed]   = useState(false)

  // ── Management data ────────────────────────────────────────────────
  const [orders,      setOrders]      = useState([])
  const [tables,      setTables]      = useState([])
  const [inventory,   setInventory]   = useState([])
  const [providers,   setProviders]   = useState([])
  const [staffList,   setStaffList]   = useState([])
  const [loadingMgmt, setLoadingMgmt] = useState(false)
  const [payloadDrawer, setPayloadDrawer] = useState(null)

  useEffect(() => {
    if (!isStaff) return
    setLoadingMgmt(true)
    const fetches = [
      getActiveOrders(PROVIDER).then(r => setOrders(r?.orders || [])),
      getTables(PROVIDER).then(r => setTables(r?.tables || [])),
    ]
    if (isManager) {
      fetches.push(getProviderInventory(PROVIDER).then(r => setInventory(r?.inventory || [])))
      fetches.push(getStaff(PROVIDER).then(r => setStaffList(r?.staff || [])))
    }
    if (isAdmin) {
      fetches.push(getPOS3Providers().then(r => setProviders(r?.providers || [])))
    }
    Promise.all(fetches).finally(() => setLoadingMgmt(false))
  }, [role])

  // ── Cart helpers ───────────────────────────────────────────────────
  function add(item) {
    setCart(c => {
      const ex = c.find(i => i.id === item.id)
      return ex ? c.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...item, qty: 1 }]
    })
  }
  function dec(id) {
    setCart(c => c.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0))
  }

  const total    = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count    = cart.reduce((s, i) => s + i.qty, 0)
  const filtered = cat === 'All' ? menuItems : menuItems.filter(i => i.cat === cat)
  const lowStockItems = inventory.filter(i => i.reorderRecommended)

  // ── Modifier modal ─────────────────────────────────────────────────
  function openModifier(item) {
    const mods = MODIFIERS[item.cat]
    if (!mods) { add(item); return }
    setModifierModal({ item, selections: {} })
  }
  function selectMod(key, val) {
    setModifierModal(m => ({ ...m, selections: { ...m.selections, [key]: val } }))
  }
  function addWithMods() {
    if (!modifierModal) return
    add({ ...modifierModal.item, mods: modifierModal.selections })
    setModifierModal(null)
  }

  // ── Kitchen / Bar fire ─────────────────────────────────────────────
  function fireToKitchen() {
    const ids = cart.filter(i => ['Food', 'Smoke'].includes(i.cat)).map(i => i.id)
    if (!ids.length) return
    setKitchenFired(prev => new Set([...prev, ...ids]))
    setKitchenFlash(true)
    setTimeout(() => setKitchenFlash(false), 1800)
  }
  function fireToBar() {
    const ids = cart.filter(i => ['Pour', 'Beer', 'Wine'].includes(i.cat)).map(i => i.id)
    if (!ids.length) return
    setBarFired(prev => new Set([...prev, ...ids]))
    setBarFlash(true)
    setTimeout(() => setBarFlash(false), 1800)
  }

  // ── Split check ────────────────────────────────────────────────────
  function initSplit() {
    setSplitA([...cart])
    setSplitB([])
    setSplitMode(true)
  }
  function moveToB(id) {
    const item = splitA.find(i => i.id === id)
    if (item) { setSplitA(p => p.filter(i => i.id !== id)); setSplitB(p => [...p, item]) }
  }
  function moveToA(id) {
    const item = splitB.find(i => i.id === id)
    if (item) { setSplitB(p => p.filter(i => i.id !== id)); setSplitA(p => [...p, item]) }
  }
  function chargeParty(party) {
    if (party === 'A') { setChargedA(true); setTimeout(() => setChargedA(false), 2000) }
    else               { setChargedB(true); setTimeout(() => setChargedB(false), 2000) }
  }
  const totalA = splitA.reduce((s, i) => s + i.price * i.qty, 0)
  const totalB = splitB.reduce((s, i) => s + i.price * i.qty, 0)

  // ── Manager override ───────────────────────────────────────────────
  function toggleComp(id) {
    setCompItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const overrideTotal = cart.reduce((s, i) => {
    if (compItems.has(i.id)) return s
    return s + i.price * i.qty * (1 - discountPct / 100)
  }, 0)
  const displayTotal = overrideActive ? overrideTotal : total

  // ── Close check ────────────────────────────────────────────────────
  function charge() {
    setCharged(true)
    setTimeout(() => { setCharged(false) }, 3000)
  }
  function closeCheck() {
    setCart([])
    setKitchenFired(new Set())
    setBarFired(new Set())
    setSplitMode(false)
    setOverrideActive(false)
    setCompItems(new Set())
    setDiscountPct(0)
    setCharged(false)
    setCheckClosed(true)
    setTimeout(() => setCheckClosed(false), 2000)
  }

  // ── Helpers ────────────────────────────────────────────────────────
  function modsLabel(mods) {
    if (!mods) return null
    return Object.values(mods).filter(Boolean).join(' · ')
  }

  const kitchenItems = cart.filter(i => ['Food', 'Smoke'].includes(i.cat))
  const barItems     = cart.filter(i => ['Pour', 'Beer', 'Wine'].includes(i.cat))

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER} style={{ position: 'relative' }}>

      {/* ── Atmospheric background ──────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
        <img src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1400&auto=format&fit=crop&q=80"
          alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.14 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,3,2,0.82) 0%, rgba(8,6,3,0.70) 50%, rgba(4,3,2,0.88) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 20%, rgba(212,175,55,0.06) 0%, transparent 60%)' }} />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 220 }}>
        <img src="/pos3-device.jpeg" alt="POS3"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 30%, rgba(1,1,1,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Unified Checkout</div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 34, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>POS 3 Terminal</div>
        </div>
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', zIndex: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D4AF37' }}>arrow_back</span>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BACK</span>
        </button>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)' }}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{count} items</span>
          </div>
        </div>
      </motion.div>

      {/* ── Category filter ──────────────────────────────────────────── */}
      <motion.div variants={FADE} style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(c => (
            <motion.button key={c} whileTap={{ scale: 0.95 }} onClick={() => setCat(c)} style={{
              flexShrink: 0, height: 44, padding: '0 20px', borderRadius: 22, border: 'none', cursor: 'pointer',
              fontFamily: '"JetBrains Mono",monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: cat === c ? '#D4AF37' : 'rgba(122,122,122,0.12)',
              color: cat === c ? '#010101' : '#7A7A7A', fontWeight: cat === c ? 700 : 400,
              transition: 'all 0.15s', boxShadow: cat === c ? '0 0 16px rgba(212,175,55,0.4)' : 'none',
            }}>{c}</motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Menu grid ────────────────────────────────────────────────── */}
      <motion.div variants={FADE} style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.map(item => {
            const inCart    = cart.find(i => i.id === item.id)
            const isKFired  = kitchenFired.has(item.id)
            const isBFired  = barFired.has(item.id)
            return (
              <motion.div key={item.id} whileTap={{ scale: 0.96 }}>
                <div className="glass-card" style={{
                  padding: '18px 16px', cursor: 'pointer',
                  border: inCart ? '1px solid rgba(212,175,55,0.45)' : '1px solid rgba(122,122,122,0.2)',
                  boxShadow: inCart ? '0 0 16px rgba(212,175,55,0.12)' : 'none',
                  transition: 'all 0.15s', position: 'relative',
                }}>
                  {/* Fired badges */}
                  {(isKFired || isBFired) && (
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                      {isKFired && <span style={{ fontSize: 10, background: 'rgba(224,123,57,0.2)', border: '1px solid rgba(224,123,57,0.4)', borderRadius: 8, padding: '2px 6px', color: '#E07B39', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.06em' }}>🔥 KITCHEN</span>}
                      {isBFired && <span style={{ fontSize: 10, background: 'rgba(123,167,212,0.2)', border: '1px solid rgba(123,167,212,0.4)', borderRadius: 8, padding: '2px 6px', color: '#7BA7D4', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.06em' }}>🍹 BAR</span>}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{item.emoji}</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37' }}>${item.price}</span>
                  </div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 15, color: '#E5E2E1', marginBottom: 3, lineHeight: 1.2 }}>{item.name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.04em', marginBottom: 14, lineHeight: 1.4 }}>{item.desc}</div>
                  {/* Show mods if in cart */}
                  {inCart?.mods && (
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#D4AF3799', letterSpacing: '0.04em', marginBottom: 8 }}>
                      {modsLabel(inCart.mods)}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {inCart ? (
                      <>
                        <button onClick={e => { e.stopPropagation(); dec(item.id) }}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(122,122,122,0.3)', background: 'rgba(122,122,122,0.1)', color: '#7A7A7A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 18, color: '#D4AF37', minWidth: 20, textAlign: 'center' }}>{inCart.qty}</span>
                        <button onClick={e => { e.stopPropagation(); add(item) }}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.5)', background: 'rgba(212,175,55,0.12)', color: '#D4AF37', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(212,175,55,0.2)' }}>
                          <Plus size={14} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => openModifier(item)}
                        style={{ flex: 1, height: 36, borderRadius: 8, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Plus size={13} /> Add
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Checkout panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {cart.length > 0 && !charged && !splitMode && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: 'sticky', bottom: 88, zIndex: 40, margin: '16px 16px 0' }}>
            <div className="glass-card-gold" style={{ padding: '20px 24px' }}>

              {/* Line items */}
              <div style={{ marginBottom: 16 }}>
                {cart.map(i => (
                  <div key={i.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 13, color: '#E5E2E1' }}>
                        {i.qty > 1 && <span style={{ color: '#D4AF37', marginRight: 4 }}>{i.qty}×</span>}{i.name}
                        {compItems.has(i.id) && <span style={{ marginLeft: 6, fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#5A9A5A', background: 'rgba(90,154,90,0.15)', border: '1px solid rgba(90,154,90,0.3)', borderRadius: 6, padding: '1px 5px' }}>COMP</span>}
                      </div>
                      {i.mods && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A', marginTop: 2 }}>{modsLabel(i.mods)}</div>}
                    </div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 14, color: compItems.has(i.id) ? '#5A5A5A' : '#D4AF37', textDecoration: compItems.has(i.id) ? 'line-through' : 'none', marginLeft: 12, flexShrink: 0 }}>
                      ${(i.price * i.qty).toFixed(0)}
                    </div>
                  </div>
                ))}
                {overrideActive && discountPct > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(90,154,90,0.2)' }}>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A9A5A' }}>{discountPct}% DISCOUNT</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A9A5A' }}>-${(total - overrideTotal).toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* Fire to Kitchen / Bar */}
              {(kitchenItems.length > 0 || barItems.length > 0) && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {kitchenItems.length > 0 && (
                    <button onClick={fireToKitchen} style={{
                      flex: 1, height: 44, borderRadius: 10, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                      background: kitchenFlash ? 'rgba(224,123,57,0.3)' : 'rgba(224,123,57,0.12)',
                      border: `1px solid rgba(224,123,57,${kitchenFlash ? 0.7 : 0.35})`,
                      color: kitchenFlash ? '#FFBD67' : '#E07B39',
                      boxShadow: kitchenFlash ? '0 0 14px rgba(224,123,57,0.4)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                      <ChefHat size={14} />
                      {kitchenFlash ? '✓ FIRED' : `KITCHEN (${kitchenItems.length})`}
                    </button>
                  )}
                  {barItems.length > 0 && (
                    <button onClick={fireToBar} style={{
                      flex: 1, height: 44, borderRadius: 10, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                      background: barFlash ? 'rgba(123,167,212,0.3)' : 'rgba(123,167,212,0.1)',
                      border: `1px solid rgba(123,167,212,${barFlash ? 0.7 : 0.3})`,
                      color: barFlash ? '#A8CFEA' : '#7BA7D4',
                      boxShadow: barFlash ? '0 0 14px rgba(123,167,212,0.35)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                      <span style={{ fontSize: 14 }}>🍹</span>
                      {barFlash ? '✓ SENT' : `BAR (${barItems.length})`}
                    </button>
                  )}
                </div>
              )}

              {/* Total + Charge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {count} item{count > 1 ? 's' : ''} · {overrideActive ? 'Adjusted Total' : 'Order Total'}
                  </div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 40, color: '#D4AF37', lineHeight: 1 }}>
                    ${displayTotal.toFixed(0)}
                  </div>
                </div>
                <button className="btn-gold" style={{ height: 56, fontSize: 13, padding: '0 28px' }} onClick={charge}>
                  CHARGE ${displayTotal.toFixed(0)}
                </button>
              </div>

              {/* Action row: Split / Override */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={initSplit} style={{
                  flex: 1, height: 40, borderRadius: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37',
                }}>
                  <SplitSquareHorizontal size={13} /> Split Check
                </button>
                {isManager && (
                  <button onClick={() => setOverrideActive(o => !o)} style={{
                    flex: 1, height: 40, borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: overrideActive ? 'rgba(90,154,90,0.15)' : 'rgba(122,122,122,0.08)',
                    border: `1px solid ${overrideActive ? 'rgba(90,154,90,0.4)' : 'rgba(122,122,122,0.2)'}`,
                    color: overrideActive ? '#5A9A5A' : '#7A7A7A',
                  }}>
                    <ShieldCheck size={13} /> Override
                  </button>
                )}
              </div>

              {/* Manager Override panel */}
              <AnimatePresence>
                {overrideActive && isManager && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}>
                    <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(90,154,90,0.06)', border: '1px solid rgba(90,154,90,0.2)' }}>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#5A9A5A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                        Manager Override
                      </div>

                      {/* Discount slider */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#A0A0A0' }}>Discount</span>
                          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A9A5A', fontWeight: 700 }}>{discountPct}%</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {[0, 10, 15, 20, 25, 50, 100].map(pct => (
                            <button key={pct} onClick={() => setDiscountPct(pct)} style={{
                              height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer', border: 'none',
                              fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
                              background: discountPct === pct ? '#5A9A5A' : 'rgba(90,154,90,0.1)',
                              color: discountPct === pct ? '#010101' : '#5A9A5A',
                              transition: 'all 0.15s',
                            }}>{pct === 100 ? 'COMP' : `${pct}%`}</button>
                          ))}
                        </div>
                      </div>

                      {/* Per-item comp toggles */}
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Comp Individual Items</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {cart.map(i => (
                          <button key={i.id} onClick={() => toggleComp(i.id)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            background: compItems.has(i.id) ? 'rgba(90,154,90,0.12)' : 'rgba(122,122,122,0.06)',
                            border: `1px solid ${compItems.has(i.id) ? 'rgba(90,154,90,0.3)' : 'rgba(122,122,122,0.15)'}`,
                            transition: 'all 0.15s',
                          }}>
                            <span style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 12, color: '#E5E2E1' }}>{i.name}</span>
                            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: compItems.has(i.id) ? '#5A9A5A' : '#7A7A7A' }}>
                              {compItems.has(i.id) ? '✓ COMPED' : 'COMP'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Charged success + Close Check */}
        {charged && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'sticky', bottom: 88, zIndex: 40, margin: '16px 16px 0' }}>
            <div className="glass-card-gold" style={{ padding: '28px 24px', textAlign: 'center' }}>
              <CheckCircle2 size={48} style={{ color: '#D4AF37', marginBottom: 12, filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.6))' }} />
              <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 22, color: '#D4AF37', marginBottom: 6 }}>Payment Complete</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', letterSpacing: '0.08em', marginBottom: 20 }}>
                Transaction processed · +{Math.floor(total * 2)} XP earned
              </div>
              <button onClick={closeCheck} style={{
                height: 48, width: '100%', borderRadius: 12, cursor: 'pointer',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
                background: 'rgba(224,90,90,0.12)', border: '1px solid rgba(224,90,90,0.35)', color: '#E05A5A',
              }}>Close Check &amp; Clear Table</button>
            </div>
          </motion.div>
        )}

        {checkClosed && (
          <motion.div key="closed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'sticky', bottom: 88, zIndex: 40, margin: '16px 16px 0' }}>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 18, color: '#5A9A5A' }}>✓ Check Closed — Table Clear</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Split Check Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {splitMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Split Check</div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 22, color: '#E5E2E1' }}>Divide Items Between Parties</div>
                </div>
                <button onClick={() => setSplitMode(false)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(122,122,122,0.3)', background: 'rgba(122,122,122,0.1)', color: '#7A7A7A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {/* Party A */}
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Party A — ${totalA}
                  </div>
                  {splitA.length === 0 && (
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#5A5A5A', padding: '16px 12px', borderRadius: 8, border: '1px dashed rgba(122,122,122,0.2)', textAlign: 'center' }}>
                      Tap items from B →
                    </div>
                  )}
                  {splitA.map(i => (
                    <button key={i.id} onClick={() => moveToB(i.id)} style={{
                      width: '100%', padding: '10px 12px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                      background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                    }}>
                      <span style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 12, color: '#E5E2E1' }}>{i.name}</span>
                      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#D4AF37' }}>${i.price * i.qty} →</span>
                    </button>
                  ))}
                  {!chargedA && splitA.length > 0 && (
                    <button onClick={() => chargeParty('A')} style={{
                      width: '100%', height: 44, marginTop: 8, borderRadius: 10, cursor: 'pointer',
                      fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                      background: '#D4AF37', color: '#010101', border: 'none',
                    }}>
                      Charge A · ${totalA}
                    </button>
                  )}
                  {chargedA && (
                    <div style={{ textAlign: 'center', marginTop: 8, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A9A5A' }}>✓ Party A Charged</div>
                  )}
                </div>

                {/* Party B */}
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7BA7D4', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Party B — ${totalB}
                  </div>
                  {splitB.length === 0 && (
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#5A5A5A', padding: '16px 12px', borderRadius: 8, border: '1px dashed rgba(122,122,122,0.2)', textAlign: 'center' }}>
                      ← Tap items from A
                    </div>
                  )}
                  {splitB.map(i => (
                    <button key={i.id} onClick={() => moveToA(i.id)} style={{
                      width: '100%', padding: '10px 12px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                      background: 'rgba(123,167,212,0.08)', border: '1px solid rgba(123,167,212,0.2)',
                    }}>
                      <span style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 12, color: '#E5E2E1' }}>← {i.name}</span>
                      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7BA7D4' }}>${i.price * i.qty}</span>
                    </button>
                  ))}
                  {!chargedB && splitB.length > 0 && (
                    <button onClick={() => chargeParty('B')} style={{
                      width: '100%', height: 44, marginTop: 8, borderRadius: 10, cursor: 'pointer',
                      fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                      background: '#7BA7D4', color: '#010101', border: 'none',
                    }}>
                      Charge B · ${totalB}
                    </button>
                  )}
                  {chargedB && (
                    <div style={{ textAlign: 'center', marginTop: 8, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A9A5A' }}>✓ Party B Charged</div>
                  )}
                </div>
              </div>
            </div>

            {(chargedA || chargedB) && (chargedA && chargedB || splitA.length === 0 || splitB.length === 0) && (
              <div style={{ padding: '16px 20px 24px' }}>
                <button onClick={() => { setSplitMode(false); if (chargedA && chargedB) closeCheck() }} style={{
                  width: '100%', height: 52, borderRadius: 14, cursor: 'pointer',
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
                  background: 'rgba(224,90,90,0.12)', border: '1px solid rgba(224,90,90,0.35)', color: '#E05A5A',
                }}>
                  {chargedA && chargedB ? 'Close Check & Clear Table' : 'Back to Check'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modifier Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {modifierModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModifierModal(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxHeight: '80vh', overflowY: 'auto', background: '#0E0B06', borderTop: '1px solid rgba(212,175,55,0.25)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Customise Order</div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 22, color: '#E5E2E1' }}>
                    {modifierModal.item.emoji} {modifierModal.item.name}
                  </div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', marginTop: 4 }}>${modifierModal.item.price}</div>
                </div>
                <button onClick={() => setModifierModal(null)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(122,122,122,0.3)', background: 'rgba(122,122,122,0.1)', color: '#7A7A7A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              {(MODIFIERS[modifierModal.item.cat] || []).map(group => (
                <div key={group.key} style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>{group.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {group.options.map(opt => {
                      const selected = modifierModal.selections[group.key] === opt
                      return (
                        <button key={opt} onClick={() => selectMod(group.key, opt)} style={{
                          height: 40, padding: '0 16px', borderRadius: 20, cursor: 'pointer', border: 'none',
                          fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: selected ? 700 : 400,
                          background: selected ? '#D4AF37' : 'rgba(122,122,122,0.12)',
                          color: selected ? '#010101' : '#9A9A9A',
                          boxShadow: selected ? '0 0 12px rgba(212,175,55,0.35)' : 'none',
                          transition: 'all 0.15s',
                        }}>{opt}</button>
                      )
                    })}
                  </div>
                </div>
              ))}

              <button onClick={addWithMods} style={{
                width: '100%', height: 56, borderRadius: 14, cursor: 'pointer',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
                background: '#D4AF37', color: '#010101', border: 'none',
                boxShadow: '0 0 24px rgba(212,175,55,0.4)',
              }}>
                Add to Check — ${modifierModal.item.price}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          STAFF & MANAGEMENT PANELS
      ══════════════════════════════════════════════════════════════ */}

      {isStaff && (
        <>
          {/* Active Orders */}
          <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 18 }}>receipt_long</span>
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Active Orders</span>
                </div>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>{orders.length} open</span>
              </div>
              {loadingMgmt && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A' }}>Loading…</div>}
              {!loadingMgmt && orders.length === 0 && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A' }}>No active orders</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map(order => (
                  <div key={order.providerOrderId} style={{
                    padding: '14px 16px', borderRadius: 10,
                    background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 13, color: '#D4AF37' }}>{order.tableNumber}</span>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>{order.items?.length || 0} items</span>
                      </div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#5A5A5A' }}>{order.staffName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 18, color: '#D4AF37' }}>${order.total?.toFixed(2)}</div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#5A9A5A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Table Map with seat numbers */}
          <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 18 }}>table_restaurant</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Table Map</span>
              </div>
              {loadingMgmt && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A' }}>Loading tables…</div>}
              {!loadingMgmt && tables.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5A5A5A' }}>table_restaurant</span>
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A5A5A' }}>Table data temporarily unavailable</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {tables.map(t => {
                  const sc  = statusColor[t.status] || '#7A7A7A'
                  const key = (t.tableId || '').replace(/[^A-Za-z0-9]/g, '')
                  const seats = TABLE_SEATS[key] || t.seats || 4
                  const isSelected = selectedTable?.tableId === t.tableId
                  return (
                    <button key={t.tableId}
                      onClick={() => setSelectedTable(isSelected ? null : t)}
                      style={{
                        padding: '12px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                        border: isSelected ? `2px solid ${sc}` : `1px solid ${sc}33`,
                        background: isSelected ? `${sc}18` : `${sc}08`,
                        boxShadow: isSelected ? `0 0 16px ${sc}33` : 'none',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 12, color: sc, marginBottom: 2 }}>{t.tableNumber}</div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#5A5A5A', marginBottom: 4 }}>{t.zone}</div>
                      {/* Seat dots */}
                      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                        {Array.from({ length: seats }, (_, i) => (
                          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: t.status === 'occupied' ? sc : `${sc}44`, border: `1px solid ${sc}66`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 6, color: t.status === 'occupied' ? '#010101' : sc, fontWeight: 700 }}>{i + 1}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 12, background: `${sc}18`, border: `1px solid ${sc}44`, fontFamily: '"JetBrains Mono",monospace', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: sc }}>
                        {t.status}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Table detail expand */}
              <AnimatePresence>
                {selectedTable && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}>
                    <div style={{ marginTop: 12, padding: '16px', borderRadius: 10, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                        {selectedTable.tableNumber} · {selectedTable.zone} · {TABLE_SEATS[(selectedTable.tableId || '').replace(/[^A-Za-z0-9]/g, '')] || 4} seats
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {Array.from({ length: TABLE_SEATS[(selectedTable.tableId || '').replace(/[^A-Za-z0-9]/g, '')] || 4 }, (_, i) => (
                          <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', fontWeight: 700 }}>
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {selectedTable.status === 'available' && (
                          <button style={{ flex: 1, height: 38, borderRadius: 10, cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
                            + Open Check
                          </button>
                        )}
                        {selectedTable.status === 'occupied' && (
                          <button style={{ flex: 1, height: 38, borderRadius: 10, cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, background: 'rgba(224,123,57,0.1)', border: '1px solid rgba(224,123,57,0.3)', color: '#E07B39' }}>
                            View Check
                          </button>
                        )}
                        <button onClick={() => setSelectedTable(null)} style={{ height: 38, padding: '0 14px', borderRadius: 10, cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, background: 'rgba(122,122,122,0.1)', border: '1px solid rgba(122,122,122,0.2)', color: '#7A7A7A' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}

      {/* Inventory Signals (Manager+) */}
      {isManager && (
        <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: lowStockItems.length > 0 ? '#E07B39' : '#D4AF37', fontSize: 18 }}>inventory_2</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Inventory Signals</span>
              </div>
              {lowStockItems.length > 0 && (
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E07B39', background: 'rgba(224,123,57,0.12)', padding: '2px 10px', borderRadius: 12, border: '1px solid rgba(224,123,57,0.3)' }}>
                  {lowStockItems.length} LOW STOCK
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lowStockItems.length === 0 && !loadingMgmt && (
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A9A5A' }}>All inventory levels adequate</div>
              )}
              {lowStockItems.map(item => (
                <div key={item.providerItemId} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(224,123,57,0.06)', border: '1px solid rgba(224,123,57,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 13, color: '#E5E2E1', marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>{item.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 20, color: item.currentStock <= 2 ? '#E05A5A' : '#E07B39' }}>{item.currentStock}</div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A' }}>/ {item.lowStockThreshold} min</div>
                  </div>
                </div>
              ))}
              {isManager && inventory.filter(i => !i.reorderRecommended).slice(0, 3).map(item => (
                <div key={item.providerItemId} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(90,154,90,0.05)', border: '1px solid rgba(90,154,90,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 12, color: '#9A9A9A' }}>{item.name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 14, color: '#5A9A5A' }}>{item.currentStock}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Staff Activity Feed (Manager+) */}
      {isManager && (
        <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 18 }}>badge</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Staff on Floor</span>
            </div>
            {loadingMgmt && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A' }}>Loading staff…</div>}
            {!loadingMgmt && staffList.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5A5A5A' }}>person_off</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A5A5A' }}>Staff data temporarily unavailable</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {staffList.map(s => (
                <div key={s.staffId} style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 14, color: '#E5E2E1' }}>{s.displayName}</div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', marginTop: 2 }}>{s.role} · {s.assignedZone}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.active ? '#5A9A5A' : '#7A7A7A', boxShadow: s.active ? '0 0 6px #5A9A5A' : 'none' }} />
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: s.active ? '#5A9A5A' : '#7A7A7A', textTransform: 'uppercase' }}>{s.active ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Provider Config (Admin+) */}
      {isAdmin && (
        <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 18 }}>settings_ethernet</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Provider Configuration</span>
            </div>
            {loadingMgmt && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A' }}>Loading providers…</div>}
            {!loadingMgmt && providers.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5A5A5A' }}>hub</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A5A5A' }}>Provider data temporarily unavailable</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {providers.map(p => (
                <div key={p.key} style={{ padding: '14px 16px', borderRadius: 8, background: p.liveReady ? 'rgba(90,154,90,0.06)' : 'rgba(122,122,122,0.06)', border: `1px solid ${p.liveReady ? 'rgba(90,154,90,0.2)' : 'rgba(122,122,122,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 14, color: '#E5E2E1', marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>
                      {p.credentialStatus?.missingKeys?.length > 0 ? `Missing: ${p.credentialStatus.missingKeys.slice(0, 2).join(', ')}` : 'Credentials configured'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 12, background: p.liveReady ? 'rgba(90,154,90,0.15)' : 'rgba(122,122,122,0.12)', color: p.liveReady ? '#5A9A5A' : '#7A7A7A', border: `1px solid ${p.liveReady ? 'rgba(90,154,90,0.3)' : 'rgba(122,122,122,0.2)'}` }}>
                      {p.liveReady ? 'LIVE READY' : 'NOT CONFIGURED'}
                    </span>
                    {isManager && (
                      <button onClick={() => setPayloadDrawer(p)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.06)', color: '#D4AF37', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>data_object</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Founder Panel */}
      {isFounder && (
        <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
          <div className="glass-card-gold" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 18 }}>lock</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Founder · License & Revenue Controls</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'License Mode',   value: 'PROTOTYPE', color: '#D4AF37' },
                { label: 'Revenue',        value: 'DISABLED',  color: '#7A7A7A' },
                { label: 'Billing Linked', value: 'NO',        color: '#7A7A7A' },
                { label: 'Live Providers', value: '1 / 8',     color: '#5A9A5A' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 14, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#5A5A5A', lineHeight: 1.6, letterSpacing: '0.04em' }}>
              Phase 9 — Provider integrations prepared. Activate providers individually once credentials are configured.
            </div>
          </div>
        </motion.div>
      )}

      {/* Payload Drawer */}
      <AnimatePresence>
        {payloadDrawer && (
          <motion.div key="drawer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPayloadDrawer(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxHeight: '70vh', overflowY: 'auto', background: '#0E0E0E', borderTop: '1px solid rgba(212,175,55,0.2)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Payload Preview</div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 20, color: '#E5E2E1' }}>{payloadDrawer.name}</div>
                </div>
                <button onClick={() => setPayloadDrawer(null)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(122,122,122,0.3)', background: 'rgba(122,122,122,0.1)', color: '#7A7A7A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
              <pre style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF3799', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                {JSON.stringify({ provider: payloadDrawer.key, name: payloadDrawer.name, mode: payloadDrawer.mode, liveReady: payloadDrawer.liveReady, supportsOrders: payloadDrawer.supportsOrders, supportsInventory: payloadDrawer.supportsInventory, supportsTables: payloadDrawer.supportsTables, credentialsRequired: payloadDrawer.credentialsRequired, credentialStatus: payloadDrawer.credentialStatus }, null, 2)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ height: 32 }} />
    </motion.div>
  )
}
