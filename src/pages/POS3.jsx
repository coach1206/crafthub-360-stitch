import { useState } from 'react'
import Card, { SectionDivider, StatusBadge } from '../components/Card.jsx'

const items = [
  { id: 1, name: 'Robusto Selection',  category: 'SmokeCraft', price: 42 },
  { id: 2, name: 'Old Fashioned',      category: 'PourCraft',  price: 18 },
  { id: 3, name: 'Barrel Stout Draft', category: 'BeerCraft',  price: 12 },
  { id: 4, name: 'Opus One Pour',      category: 'WineCraft',  price: 65 },
  { id: 5, name: 'Tasting Flight',     category: 'EAT',        price: 34 },
]

export default function POS3() {
  const [cart, setCart] = useState([])

  function addItem(item) {
    setCart(c => {
      const ex = c.find(i => i.id === item.id)
      if (ex) return c.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...c, { ...item, qty: 1 }]
    })
  }

  function removeItem(id) {
    setCart(c => c.filter(i => i.id !== id))
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge label="POS Live" />
      </div>
      <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, marginBottom: 4 }}>
        <span className="gold-text">POS</span>
        <span style={{ color: '#fff' }}>3</span>
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
        Unified point of sale across all CraftHub modules.
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[['$0', 'Today'], [String(cart.length), 'In Cart'], ['14', 'Screens']].map(([v, l]) => (
          <Card key={l} style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#00bcd4', fontFamily: 'Space Grotesk, sans-serif' }}>{v}</div>
            <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Item list */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px' }}>
          <SectionDivider label="Menu" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{item.name}</div>
                  <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.category}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f2ca50' }}>${item.price}</span>
                  <button
                    onClick={() => addItem(item)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#f2ca50', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Cart */}
      {cart.length > 0 && (
        <Card topAccent>
          <div style={{ padding: '16px 20px' }}>
            <SectionDivider label="Order" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{item.qty}× {item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#f2ca50' }}>${item.price * item.qty}</span>
                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>×</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span className="font-caps" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#f2ca50' }}>${total}</span>
            </div>
            <button className="gold-btn" style={{ borderRadius: 14, padding: '12px 0', width: '100%', fontSize: 13, fontWeight: 700, color: '#000', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              CHARGE ${total}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
