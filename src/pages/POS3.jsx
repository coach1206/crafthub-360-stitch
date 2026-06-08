import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Wine, Beer, GlassWater, UtensilsCrossed, Plus, Minus, CheckCircle2 } from 'lucide-react'
import { useSecurity } from '../context/SecurityContext.jsx'
import {
  getActiveOrders,
  getTables,
  getProviderInventory,
  getProviderStatus,
  getPOS3Providers,
  sendRecommendation,
  getStaff,
} from '../services/pos3IntegrationApiService.js'

const FADE    = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.07 } } }

const categories = ['All', 'Smoke', 'Pour', 'Beer', 'Wine', 'Food']

const items = [
  { id: 1, name: 'Robusto Select',    cat: 'Smoke', price: 42,  Icon: Flame,          emoji: '🔥', desc: 'Nicaragua · Ring 50 · 2021' },
  { id: 2, name: 'Old Fashioned',     cat: 'Pour',  price: 18,  Icon: GlassWater,     emoji: '🥃', desc: 'Bourbon · Stirred · 38% ABV' },
  { id: 3, name: 'Barrel Stout',      cat: 'Beer',  price: 12,  Icon: Beer,           emoji: '🖤', desc: 'Imperial Stout · 11.2%' },
  { id: 4, name: 'Opus One Pour',     cat: 'Wine',  price: 65,  Icon: Wine,           emoji: '🍷', desc: 'Napa Valley · 2018 · 98pts' },
  { id: 5, name: 'Tasting Flight',    cat: 'Food',  price: 34,  Icon: UtensilsCrossed,emoji: '🍽️', desc: "5-course · Chef's selection" },
  { id: 6, name: 'Churchill Reserve', cat: 'Smoke', price: 78,  Icon: Flame,          emoji: '🔥', desc: 'Dominican · Ring 47 · 96pts' },
  { id: 7, name: 'Negroni',           cat: 'Pour',  price: 17,  Icon: GlassWater,     emoji: '🍊', desc: 'Gin · Campari · Vermouth' },
  { id: 8, name: 'Gold Haze IPA',     cat: 'Beer',  price: 11,  Icon: Beer,           emoji: '🌟', desc: 'NEIPA · 6.8% · 42 IBU' },
]

const PROVIDER = 'prototype'

const statusColor = {
  occupied:  '#D4AF37',
  available: '#5A9A5A',
  reserved:  '#7A7A7A',
  closed:    '#3A3A3A',
}

export default function POS3() {
  const { role, hasPermission } = useSecurity()

  const isStaff   = ['staff','manager','admin','founder_level_0'].includes(role)
  const isManager = ['manager','admin','founder_level_0'].includes(role)
  const isAdmin   = ['admin','founder_level_0'].includes(role)
  const isFounder = role === 'founder_level_0'

  const [cart, setCart]       = useState([])
  const [cat, setCat]         = useState('All')
  const [charged, setCharged] = useState(false)

  // Management panel state
  const [orders,     setOrders]     = useState([])
  const [tables,     setTables]     = useState([])
  const [inventory,  setInventory]  = useState([])
  const [providers,  setProviders]  = useState([])
  const [staffList,  setStaffList]  = useState([])
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

  const add = (item) => setCart(c => {
    const ex = c.find(i => i.id === item.id)
    return ex ? c.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...item, qty: 1 }]
  })
  const dec = (id) => setCart(c =>
    c.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0)
  )
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)
  const filtered = cat === 'All' ? items : items.filter(i => i.cat === cat)

  function charge() {
    setCharged(true)
    setTimeout(() => { setCharged(false); setCart([]) }, 3000)
  }

  const lowStockItems = inventory.filter(i => i.reorderRecommended)

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* ── Hero (unchanged) ─────────────────────────────────────────── */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 220 }}>
        <img src="/pos3.jpg" alt="POS3"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 30%, rgba(1,1,1,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Unified Checkout</div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 34, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>POS 3 Terminal</div>
        </div>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)' }}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{count} items</span>
          </div>
        </div>
      </motion.div>

      {/* ── Category filter (unchanged) ──────────────────────────────── */}
      <motion.div variants={FADE} style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(c => (
            <motion.button key={c} whileTap={{ scale: 0.95 }}
              onClick={() => setCat(c)}
              style={{
                flexShrink: 0, height: 44, padding: '0 20px',
                borderRadius: 22, border: 'none', cursor: 'pointer',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 11,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                background: cat === c ? '#D4AF37' : 'rgba(122,122,122,0.12)',
                color: cat === c ? '#010101' : '#7A7A7A',
                fontWeight: cat === c ? 700 : 400,
                transition: 'all 0.15s',
                boxShadow: cat === c ? '0 0 16px rgba(212,175,55,0.4)' : 'none',
              }}>{c}</motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Menu grid (unchanged) ────────────────────────────────────── */}
      <motion.div variants={FADE} style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.map(item => {
            const inCart = cart.find(i => i.id === item.id)
            return (
              <motion.div key={item.id} whileTap={{ scale: 0.96 }}>
                <div className="glass-card" style={{
                  padding: '18px 16px', cursor: 'pointer',
                  border: inCart ? '1px solid rgba(212,175,55,0.45)' : '1px solid rgba(122,122,122,0.2)',
                  boxShadow: inCart ? '0 0 16px rgba(212,175,55,0.12)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{item.emoji}</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37' }}>${item.price}</span>
                  </div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 15, color: '#E5E2E1', marginBottom: 3, lineHeight: 1.2 }}>{item.name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.04em', marginBottom: 14, lineHeight: 1.4 }}>{item.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {inCart ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); dec(item.id) }}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(122,122,122,0.3)', background: 'rgba(122,122,122,0.1)', color: '#7A7A7A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 18, color: '#D4AF37', minWidth: 20, textAlign: 'center' }}>{inCart.qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); add(item) }}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.5)', background: 'rgba(212,175,55,0.12)', color: '#D4AF37', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(212,175,55,0.2)' }}>
                          <Plus size={14} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => add(item)}
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

      {/* ── Checkout panel (unchanged) ───────────────────────────────── */}
      <AnimatePresence>
        {cart.length > 0 && !charged && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: 'sticky', bottom: 88, zIndex: 40, margin: '16px 16px 0' }}
          >
            <div className="glass-card-gold" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{count} item{count > 1 ? 's' : ''} · Order Total</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 40, color: '#D4AF37', lineHeight: 1 }}>${total}</div>
                </div>
                <button className="btn-gold" style={{ height: 56, fontSize: 13, padding: '0 28px' }} onClick={charge}>
                  CHARGE ${total}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {charged && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'sticky', bottom: 88, zIndex: 40, margin: '16px 16px 0' }}
          >
            <div className="glass-card-gold" style={{ padding: '28px 24px', textAlign: 'center' }}>
              <CheckCircle2 size={48} style={{ color: '#D4AF37', marginBottom: 12, filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.6))' }} />
              <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 22, color: '#D4AF37', marginBottom: 6 }}>Payment Complete</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', letterSpacing: '0.08em' }}>Transaction processed · +{Math.floor(total * 2)} XP earned</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          PHASE 9 MANAGEMENT PANELS — role-gated, appended below existing UI
      ══════════════════════════════════════════════════════════════════ */}

      {isStaff && (
        <>
          {/* ── Active Orders Panel (Staff+) ─────────────────────────── */}
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
              {!loadingMgmt && orders.length === 0 && (
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A' }}>No active orders</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map(order => (
                  <div key={order.providerOrderId} style={{
                    padding: '14px 16px', borderRadius: 10,
                    background: 'rgba(212,175,55,0.05)',
                    border: '1px solid rgba(212,175,55,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 13, color: '#D4AF37' }}>
                          {order.tableNumber}
                        </span>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>
                          {order.items?.length || 0} items
                        </span>
                      </div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#5A5A5A', letterSpacing: '0.05em' }}>
                        {order.staffName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 18, color: '#D4AF37' }}>
                        ${order.total?.toFixed(2)}
                      </div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#5A9A5A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Table Mapping Panel (Staff+) ─────────────────────────── */}
          <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 18 }}>table_restaurant</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Table Status</span>
              </div>
              {loadingMgmt && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A' }}>Loading tables…</div>}
              {!loadingMgmt && tables.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5A5A5A' }}>table_restaurant</span>
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#5A5A5A' }}>Table data temporarily unavailable</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {tables.map(t => (
                  <div key={t.tableId} style={{
                    padding: '12px 8px', borderRadius: 8, textAlign: 'center',
                    border: `1px solid ${(statusColor[t.status] || '#7A7A7A')}33`,
                    background: `${(statusColor[t.status] || '#7A7A7A')}08`,
                  }}>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 12, color: statusColor[t.status] || '#7A7A7A', marginBottom: 4 }}>
                      {t.tableNumber}
                    </div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#5A5A5A', marginBottom: 4, letterSpacing: '0.05em' }}>
                      {t.zone}
                    </div>
                    <div style={{
                      display: 'inline-flex', padding: '2px 8px', borderRadius: 12,
                      background: `${(statusColor[t.status] || '#7A7A7A')}18`,
                      border: `1px solid ${(statusColor[t.status] || '#7A7A7A')}44`,
                      fontFamily: '"JetBrains Mono",monospace', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: statusColor[t.status] || '#7A7A7A',
                    }}>
                      {t.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ── Inventory Signal Panel (Manager+) ───────────────────────── */}
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
                <div key={item.providerItemId} style={{
                  padding: '12px 14px', borderRadius: 8,
                  background: 'rgba(224,123,57,0.06)', border: '1px solid rgba(224,123,57,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 13, color: '#E5E2E1', marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>{item.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 20, color: item.currentStock <= 2 ? '#E05A5A' : '#E07B39' }}>
                      {item.currentStock}
                    </div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A' }}>/ {item.lowStockThreshold} min</div>
                  </div>
                </div>
              ))}
              {isManager && inventory.filter(i => !i.reorderRecommended).slice(0, 3).map(item => (
                <div key={item.providerItemId} style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(90,154,90,0.05)', border: '1px solid rgba(90,154,90,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 12, color: '#9A9A9A' }}>{item.name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 14, color: '#5A9A5A' }}>{item.currentStock}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Staff Activity Feed (Manager+) ───────────────────────────── */}
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
                <div key={s.staffId} style={{
                  padding: '12px 16px', borderRadius: 8,
                  background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
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

      {/* ── Provider Config Placeholders (Admin+) ────────────────────── */}
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
                <div key={p.key} style={{
                  padding: '14px 16px', borderRadius: 8,
                  background: p.liveReady ? 'rgba(90,154,90,0.06)' : 'rgba(122,122,122,0.06)',
                  border: `1px solid ${p.liveReady ? 'rgba(90,154,90,0.2)' : 'rgba(122,122,122,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 14, color: '#E5E2E1', marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>
                      {p.credentialStatus?.missingKeys?.length > 0
                        ? `Missing: ${p.credentialStatus.missingKeys.slice(0, 2).join(', ')}`
                        : 'Credentials configured'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: '"JetBrains Mono",monospace', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '3px 10px', borderRadius: 12,
                      background: p.liveReady ? 'rgba(90,154,90,0.15)' : 'rgba(122,122,122,0.12)',
                      color: p.liveReady ? '#5A9A5A' : '#7A7A7A',
                      border: `1px solid ${p.liveReady ? 'rgba(90,154,90,0.3)' : 'rgba(122,122,122,0.2)'}`,
                    }}>{p.liveReady ? 'LIVE READY' : 'NOT CONFIGURED'}</span>
                    {isManager && (
                      <button
                        onClick={() => setPayloadDrawer(p)}
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.06)', color: '#D4AF37', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
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

      {/* ── Founder License / Revenue Lock Panel ─────────────────────── */}
      {isFounder && (
        <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
          <div className="glass-card-gold" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: '#D4AF37', fontSize: 18 }}>lock</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Founder · License & Revenue Controls</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'License Mode',    value: 'PROTOTYPE', color: '#D4AF37' },
                { label: 'Revenue',         value: 'DISABLED',  color: '#7A7A7A' },
                { label: 'Billing Linked',  value: 'NO',        color: '#7A7A7A' },
                { label: 'Live Providers',  value: '1 / 8',     color: '#5A9A5A' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: '12px 14px', borderRadius: 8,
                  background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)',
                }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 14, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#5A5A5A', lineHeight: 1.6, letterSpacing: '0.04em' }}>
              Phase 9 — Provider integrations prepared. License and revenue controls are placeholder.<br />
              No live billing is active. Activate providers individually once credentials are configured.
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Payload Preview Drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {payloadDrawer && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPayloadDrawer(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxHeight: '70vh', overflowY: 'auto', background: '#0E0E0E', borderTop: '1px solid rgba(212,175,55,0.2)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Payload Preview</div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 20, color: '#E5E2E1' }}>{payloadDrawer.name}</div>
                </div>
                <button onClick={() => setPayloadDrawer(null)}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(122,122,122,0.3)', background: 'rgba(122,122,122,0.1)', color: '#7A7A7A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>
              <pre style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF3799', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                {JSON.stringify({
                  provider:            payloadDrawer.key,
                  name:                payloadDrawer.name,
                  mode:                payloadDrawer.mode,
                  liveReady:           payloadDrawer.liveReady,
                  supportsOrders:      payloadDrawer.supportsOrders,
                  supportsInventory:   payloadDrawer.supportsInventory,
                  supportsTables:      payloadDrawer.supportsTables,
                  credentialsRequired: payloadDrawer.credentialsRequired,
                  credentialStatus:    payloadDrawer.credentialStatus,
                }, null, 2)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ height: 32 }} />
    </motion.div>
  )
}
