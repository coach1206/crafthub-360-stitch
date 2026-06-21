import { useState } from 'react'
import { Shell, Card, Pill, GOLD, NAVY, PANEL, PANEL2, EatBadge, useToast } from '../../components/eat/ui.jsx'
import { MENU_CATEGORIES, getCatalogByCategory } from '../../data/pos3/menuCatalog.js'
import {
  createTicket, getOpenTickets, addItem, removeItem, changeQuantity, sendTicket,
} from '../../services/pos3/orderService.js'
import { calcTotals } from '../../services/pos3/paymentService.js'
import TouchCard from '../../components/pos3/TouchCard.jsx'
import TouchButton from '../../components/pos3/TouchButton.jsx'
import QuantityStepper from '../../components/pos3/QuantityStepper.jsx'
import ModifierSheet from '../../components/pos3/ModifierSheet.jsx'
import TicketRail from '../../components/pos3/TicketRail.jsx'
import CheckoutDrawer from '../../components/pos3/CheckoutDrawer.jsx'
import { successTap, warningTap } from '../../services/shared/haptics.js'

const TABS = [...MENU_CATEGORIES, 'Cart']

export default function POS3Handheld() {
  const [tab, setTab] = useState('Cigars')
  const [tickets, setTickets] = useState(() => getOpenTickets())
  const [activeId, setActiveId] = useState(() => getOpenTickets()[0]?.id || null)
  const [pendingItem, setPendingItem] = useState(null)
  const [pulseCardId, setPulseCardId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const toast = useToast()

  const ticket = tickets.find((t) => t.id === activeId) || null

  function refresh(newActiveId = activeId) {
    const open = getOpenTickets()
    setTickets(open)
    if (newActiveId !== undefined) setActiveId(newActiveId)
  }

  function ensureTicket() {
    if (ticket) return ticket
    const t = createTicket({ tableId: 'T2', sectionId: 'Lounge', staffId: 'stf_jordan', server: 'Jordan Smith', guests: 2 })
    refresh(t.id)
    return t
  }

  function newTicket() {
    const t = createTicket({ tableId: 'T2', sectionId: 'Lounge', staffId: 'stf_jordan', server: 'Jordan Smith', guests: 2 })
    refresh(t.id)
    toast(`${t.id} created`)
  }

  function handleAddCard(item) {
    const t = ensureTicket()
    if (item.modifiers && item.modifiers.length) {
      setPendingItem(item)
      return
    }
    addItem(t.id, item, 1, [])
    refresh(t.id)
    setPulseCardId(item.id)
    setTimeout(() => setPulseCardId(null), 400)
  }

  function confirmModifiers(selectedMods) {
    if (!pendingItem) return
    const t = ensureTicket()
    addItem(t.id, pendingItem, 1, selectedMods)
    refresh(t.id)
    setPulseCardId(pendingItem.id)
    setTimeout(() => setPulseCardId(null), 400)
    setPendingItem(null)
  }

  function step(itemId, qty) {
    if (!ticket) return
    if (qty <= 0) {
      removeItem(ticket.id, itemId)
    } else {
      changeQuantity(ticket.id, itemId, qty)
    }
    refresh(ticket.id)
  }

  function handleSend() {
    if (!ticket || !ticket.items.length) {
      try { warningTap() } catch {}
      toast('Add items before sending')
      return
    }
    sendTicket(ticket.id)
    try { successTap() } catch {}
    toast(`${ticket.id} sent to kitchen/bar/humidor/retail`)
    setDrawerOpen(false)
    refresh(null)
    setActiveId(null)
  }

  const totals = calcTotals(ticket)
  const catalogItems = tab === 'Cart' ? [] : getCatalogByCategory(tab)
  const cartCount = (ticket?.items || []).reduce((s, i) => s + i.qty, 0)

  return (
    <Shell style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: PANEL, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontWeight: 700, color: GOLD }}>POS 3 Handheld</div><div style={{ fontSize: 11, color: '#8b95a3' }}>System Online</div></div>
        <EatBadge />
      </div>

      <div style={{ padding: '10px 16px', background: PANEL2 }}>
        <TicketRail tickets={tickets} activeId={activeId} onSelect={(id) => refresh(id)} onNewTicket={newTicket} />
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 12, overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flexShrink: 0, minHeight: 44, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            background: tab === t ? GOLD : PANEL2, color: tab === t ? NAVY : '#aab3bf', touchAction: 'manipulation',
          }}>{t}{t === 'Cart' && cartCount ? ` (${cartCount})` : ''}</button>
        ))}
      </div>

      <div style={{ padding: '0 12px 160px' }}>
        {tab !== 'Cart' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {catalogItems.map((m) => (
              <TouchCard key={m.id} onClick={() => handleAddCard(m)} pulse={pulseCardId === m.id} style={{ padding: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#8b95a3', minHeight: 14 }}>
                  {m.modifiers?.length ? `${m.modifiers.length} options` : ' '}
                  {m.ageRestricted ? ' · 21+' : ''}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>${m.price.toFixed(2)}</span>
                  <TouchButton tone="primary" onClick={(e) => { e.stopPropagation(); handleAddCard(m) }} style={{ padding: '8px 14px', fontSize: 12, minHeight: 40 }}>+ Add</TouchButton>
                </div>
              </TouchCard>
            ))}
          </div>
        )}

        {tab === 'Cart' && (
          <Card>
            {!ticket || !ticket.items.length ? (
              <div style={{ color: '#8b95a3', textAlign: 'center', padding: 20 }}>Cart is empty</div>
            ) : (
              ticket.items.map((i) => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{i.name}</div>
                    <Pill label={i.destination} tone={i.destination} />
                    {i.modifiers?.length > 0 && <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>{i.modifiers.map((m) => m.label).join(', ')}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <QuantityStepper value={i.qty} onChange={(q) => step(i.id, q)} />
                    <span style={{ color: GOLD, width: 56, textAlign: 'right', fontWeight: 700 }}>${(i.price * i.qty).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </Card>
        )}
      </div>

      <ModifierSheet item={pendingItem} open={!!pendingItem} onConfirm={confirmModifiers} onClose={() => setPendingItem(null)} />
      <CheckoutDrawer
        open={drawerOpen}
        ticket={ticket}
        totals={totals}
        onClose={() => setDrawerOpen(false)}
        onPrimaryAction={handleSend}
        primaryLabel="Send Ticket"
      />

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: PANEL, borderTop: '1px solid rgba(212,168,67,0.18)', padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: '#8b95a3' }}>Subtotal ${totals.subtotal.toFixed(2)} · Tax ${totals.tax.toFixed(2)}</span>
          <span style={{ color: GOLD, fontWeight: 700 }}>Total ${totals.total.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <TouchButton tone="neutral" onClick={() => setDrawerOpen(true)} style={{ flex: 1 }}>View Ticket</TouchButton>
          <TouchButton tone="success" onClick={handleSend} style={{ flex: 2 }}>Send Ticket</TouchButton>
        </div>
      </div>
    </Shell>
  )
}
