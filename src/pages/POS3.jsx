import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Wine, Beer, GlassWater, UtensilsCrossed, Plus, Minus, CheckCircle2 } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
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

export default function POS3() {
  const [cart, setCart] = useState([])
  const [cat, setCat] = useState('All')
  const [charged, setCharged] = useState(false)

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

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* Hero */}
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

      {/* Category filter — large touch tabs */}
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

      {/* Menu grid — large tap targets */}
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
                  {/* +/- control */}
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

      {/* Checkout panel */}
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

    </motion.div>
  )
}
