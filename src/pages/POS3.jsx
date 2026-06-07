import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Wine, Beer, GlassWater, UtensilsCrossed, Plus, X, Receipt } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const menuItems = [
  { id: 1, name: 'Robusto Selection',      cat: 'SmokeCraft', price: 42, Icon: Flame          },
  { id: 2, name: 'Old Fashioned',          cat: 'PourCraft',  price: 18, Icon: GlassWater     },
  { id: 3, name: 'Barrel Stout Draft',     cat: 'BeerCraft',  price: 12, Icon: Beer           },
  { id: 4, name: 'Opus One Pour',          cat: 'WineCraft',  price: 65, Icon: Wine           },
  { id: 5, name: 'Tasting Flight',         cat: 'E.A.T.',     price: 34, Icon: UtensilsCrossed},
  { id: 6, name: 'Churchill Reserve',      cat: 'SmokeCraft', price: 78, Icon: Flame          },
]

export default function POS3() {
  const [cart, setCart] = useState([])
  const add = (item) => setCart(c => {
    const ex = c.find(i => i.id === item.id)
    return ex ? c.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...item, qty: 1 }]
  })
  const remove = (id) => setCart(c => c.filter(i => i.id !== id))
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div variants={FADE} style={{ marginBottom: 40 }}>
        <div className="status-pill"><span className="status-dot" />POS3 Live — {count} item{count !== 1 ? 's' : ''} in order</div>
      </motion.div>

      <motion.div variants={FADE} style={{ width: '100%', marginBottom: 32 }}>
        <img src="/pos3.jpg" alt="POS3" className="hero-banner" style={{ height: 320, objectPosition: 'center 50%' }} />
      </motion.div>

      <motion.div variants={FADE} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#D4AF37', marginBottom: 12 }}>
          POS 3 TERMINAL
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 16, color: '#7A7A7A', maxWidth: 520, margin: '0 auto' }}>
          Unified transaction layer across all CraftHub modules. Compose the order and charge with precision.
        </p>
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, width: '100%', marginBottom: 24 }}>
        {[['$0','Revenue Today'],[String(count),'Items in Cart'],['$'+total,'Order Total'],['14','POS Screens']].map(([v,l]) => (
          <div key={l} className="glass-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 32, fontWeight: 600, color: '#D4AF37', lineHeight: 1, marginBottom: 8 }}>{v}</div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7A7A' }}>{l}</div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24, width: '100%' }}>
        {/* Menu */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div className="section-label">Menu</div>
          {menuItems.map(item => (
            <div key={item.id} className="data-row" style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <item.Icon size={20} style={{ color: '#D4AF37', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 15, color: '#E5E2E1' }}>{item.name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.cat}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37' }}>${item.price}</span>
                <button onClick={() => add(item)} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)',
                  color: '#D4AF37', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart */}
        <div className="glass-card-gold" style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
          <div className="section-label">Current Order</div>

          {cart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.4, padding: '40px 0' }}>
              <Receipt size={40} style={{ color: '#D4AF37' }} />
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', letterSpacing: '0.08em' }}>No items added</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ flex: 1, marginBottom: 20 }}>
                {cart.map(item => (
                  <div key={item.id} className="data-row" style={{ alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Inter', fontSize: 14, color: '#E5E2E1' }}>{item.qty}× {item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 16, color: '#D4AF37' }}>${item.price * item.qty}</span>
                      <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(122,122,122,0.5)', transition: 'color 0.15s' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(122,122,122,0.15)', paddingTop: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</span>
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 36, color: '#D4AF37', lineHeight: 1 }}>${total}</span>
                </div>
              </div>
              <button className="btn-gold" style={{ width: '100%' }}>Charge ${total}</button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
