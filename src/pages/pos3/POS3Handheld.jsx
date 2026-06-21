import { useState } from 'react'
import { Shell, Card, Pill, Btn, GOLD, NAVY, PANEL, PANEL2, EatBadge, useToast } from '../../components/eat/ui.jsx'
import { getMenu, createTicket, sendOrder, ticketTotals } from '../../services/pos3/pos3Service.js'

const TABS = ['Food', 'Drinks', 'Cigars', 'Cart']

export default function POS3Handheld() {
  const menu = getMenu()
  const [tab, setTab] = useState('Food')
  const [cart, setCart] = useState([])
  const toast = useToast()

  function add(m) {
    setCart((c) => {
      const ex = c.find((i) => i.menuId === m.id)
      if (ex) return c.map((i) => i.menuId === m.id ? { ...i, qty: i.qty + 1 } : i)
      return [...c, { id: 'li_' + m.id, menuId: m.id, name: m.name, station: m.station, price: m.price, qty: 1, modifier: m.modifier }]
    })
  }
  function step(menuId, d) {
    setCart((c) => c.map((i) => i.menuId === menuId ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter((i) => i.qty > 0))
  }

  const totals = ticketTotals({ items: cart })
  const visible = tab === 'Cart' ? [] : menu.filter((m) => m.category === tab)

  function sendTo(station) {
    if (!cart.length) return toast('Cart is empty')
    const t = createTicket({ tableId: 'T2', server: 'Jordan Smith', guests: 2, items: cart })
    sendOrder(t.id)
    toast(`${t.id} sent to ${station}`)
    setCart([])
  }

  return (
    <Shell style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: PANEL, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontWeight: 700, color: GOLD }}>POS 3</div><div style={{ fontSize: 11, color: '#8b95a3' }}>System Online</div></div>
        <EatBadge />
      </div>
      <div style={{ padding: '10px 16px', background: PANEL2, display: 'flex', gap: 16, fontSize: 12, color: '#aab3bf' }}>
        <span>Table T2</span><span>2 Guests</span><span>Server: Jordan</span>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: 12 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            background: tab === t ? GOLD : PANEL2, color: tab === t ? NAVY : '#aab3bf',
          }}>{t}{t === 'Cart' && cart.length ? ` (${cart.reduce((s, i) => s + i.qty, 0)})` : ''}</button>
        ))}
      </div>

      <div style={{ padding: '0 12px 140px' }}>
        {tab !== 'Cart' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {visible.map((m) => (
              <Card key={m.id} style={{ padding: 10 }}>
                <img src={m.image} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#8b95a3' }}>{m.modifier}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>${m.price.toFixed(2)}</span>
                  <Btn onClick={() => add(m)} style={{ padding: '6px 12px', fontSize: 12 }}>+ Add</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab === 'Cart' && (
          <Card>
            {!cart.length && <div style={{ color: '#8b95a3', textAlign: 'center', padding: 20 }}>Cart is empty</div>}
            {cart.map((i) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>{i.name}</div><Pill label={i.station} tone={i.station} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => step(i.menuId, -1)} style={stepBtn}>−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => step(i.menuId, 1)} style={stepBtn}>+</button>
                  <span style={{ color: GOLD, width: 56, textAlign: 'right' }}>${(i.price * i.qty).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: PANEL, borderTop: '1px solid rgba(212,168,67,0.18)', padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: '#8b95a3' }}>Subtotal ${totals.subtotal.toFixed(2)} · Tax ${totals.tax.toFixed(2)}</span>
          <span style={{ color: GOLD, fontWeight: 700 }}>Total ${totals.total.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn tone="purple" onClick={() => sendTo('Bar')} style={{ flex: 1, fontSize: 12 }}>Send to Bar</Btn>
          <Btn tone="red" onClick={() => sendTo('Kitchen')} style={{ flex: 1, fontSize: 12 }}>Send to Kitchen</Btn>
          <Btn tone="purple" onClick={() => sendTo('Humidor')} style={{ flex: 1, fontSize: 12 }}>Send to Humidor</Btn>
        </div>
      </div>
    </Shell>
  )
}

const stepBtn = { width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(212,168,67,0.3)', background: 'transparent', color: '#d4a843', cursor: 'pointer', fontSize: 16, lineHeight: 1 }
