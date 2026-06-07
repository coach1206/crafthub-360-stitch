import { useState } from 'react'
import Card, { SectionLabel, StatusBadge, SectionDivider } from '../components/Card.jsx'

const menuItems = [
  { id: 1, name: 'Robusto Selection',      cat: 'SmokeCraft', price: 42, icon: 'local_fire_department' },
  { id: 2, name: 'Old Fashioned',          cat: 'PourCraft',  price: 18, icon: 'local_bar'             },
  { id: 3, name: 'Barrel Stout Draft',     cat: 'BeerCraft',  price: 12, icon: 'sports_bar'            },
  { id: 4, name: 'Opus One Pour',          cat: 'WineCraft',  price: 65, icon: 'wine_bar'              },
  { id: 5, name: 'Tasting Flight',         cat: 'EAT',        price: 34, icon: 'restaurant'            },
  { id: 6, name: 'Churchill Aged Reserve', cat: 'SmokeCraft', price: 78, icon: 'local_fire_department' },
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <StatusBadge label={`POS3 Live — ${count} item${count !== 1 ? 's' : ''} in order`} />

      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 className="text-display-tour gold-foil-text" style={{ marginBottom: 16 }}>
          POINT OF SALE 3
        </h1>
        <p className="text-body-intro text-on-surface-var" style={{ maxWidth: 640, margin: '0 auto' }}>
          Unified transaction layer across all CraftHub modules.
          Select items, compose the order, and charge with precision.
        </p>
      </div>

      <div className="bento-grid">

        {/* Summary stats */}
        {[['$0', 'Revenue Today'], [String(count), 'Items in Cart'], ['$' + total, 'Order Total'], ['14', 'POS Screens']].map(([v, l]) => (
          <div key={l} style={{ gridColumn: 'span 3' }}>
            <Card style={{ textAlign: 'center' }}>
              <div className="gold-foil-text" style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>{v}</div>
              <p className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</p>
            </Card>
          </div>
        ))}

        {/* Menu */}
        <div className="col-7">
          <Card accent>
            <SectionLabel>Menu</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.map(item => (
                <div key={item.id} className="manifest-row" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="material-symbols-outlined icon-fill text-primary" style={{ fontSize: 24 }}>{item.icon}</span>
                    <div>
                      <div className="text-body-md" style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{item.name}</div>
                      <div className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.cat}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>${item.price}</span>
                    <button
                      onClick={() => add(item)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(212,175,55,0.12)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: 'var(--primary)', fontSize: 22,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontFamily: 'var(--font-label)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.25)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,0.12)'}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Cart */}
        <div className="col-5">
          <Card accent style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SectionLabel>Current Order</SectionLabel>

            {cart.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: 0.4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--primary)' }}>receipt_long</span>
                <p className="text-body-md text-on-surface-var">No items added yet</p>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{item.qty}× {item.name}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>${item.price * item.qty}</span>
                        <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-label-caps text-on-surface-var">Total</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--primary)' }}>${total}</span>
                  </div>
                </div>

                <button className="btn-primary gold-shimmer" style={{ width: '100%', justifyContent: 'center' }}>
                  CHARGE ${total}
                </button>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
