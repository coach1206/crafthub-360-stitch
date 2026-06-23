import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, GOLD, useToast } from '../../components/eat/ui.jsx'
import {
  LightShell, LightCard, StaffBand, LightTouchButton, CategoryTile, LightBottomNav, L_NAVY, L_GOLD,
} from '../../components/eat/lightTheme.jsx'
import { MENU_CATEGORIES, getCatalogByCategory } from '../../data/pos3/menuCatalog.js'
import {
  createTicket, getOpenTickets, addItem, removeItem, changeQuantity, sendTicket,
} from '../../services/pos3/orderService.js'
import { calcTotals } from '../../services/pos3/paymentService.js'
import { getTables } from '../../services/pos3/pos3Service.js'
import { EAT_INVENTORY } from '../../data/eat/seedData.js'
import { POS3_STAFF } from '../../data/pos3/seedData.js'
import TouchCard from '../../components/pos3/TouchCard.jsx'
import TouchButton from '../../components/pos3/TouchButton.jsx'
import QuantityStepper from '../../components/pos3/QuantityStepper.jsx'
import ModifierSheet from '../../components/pos3/ModifierSheet.jsx'
import CheckoutDrawer from '../../components/pos3/CheckoutDrawer.jsx'
import OrderReadinessPanel from '../../components/pos3/stations/OrderReadinessPanel.jsx'
import DestinationRouter from '../../components/pos3/stations/DestinationRouter.jsx'
import { checkReadiness } from '../../services/pos3/orderReadinessService.js'
import { groupByDestination } from '../../services/pos3/orderService.js'
import { successTap, warningTap } from '../../services/shared/haptics.js'

const TABS = [...MENU_CATEGORIES, 'Cart']
const CATEGORY_ICONS = { Cigars: 'spa', Food: 'restaurant', Bar: 'local_bar', 'Non-Alcohol Drinks': 'local_cafe', 'Lounge Services': 'room_service', Retail: 'shopping_bag', Cart: 'shopping_cart' }

export default function POS3Handheld() {
  const [tab, setTab] = useState('Cigars')
  const [tickets, setTickets] = useState(() => getOpenTickets())
  const [activeId, setActiveId] = useState(() => getOpenTickets()[0]?.id || null)
  const [pendingItem, setPendingItem] = useState(null)
  const [pulseCardId, setPulseCardId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [readiness, setReadiness] = useState(null)
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
    const result = checkReadiness(ticket)
    setReadiness(result)
    if (result.overallStatus === 'ready') {
      doSend()
    }
  }

  function doSend(managerOverride = false) {
    sendTicket(ticket.id)
    try { successTap() } catch {}
    toast(`${ticket.id} sent to kitchen/bar/humidor/retail`)
    setDrawerOpen(false)
    setReadiness(null)
    refresh(null)
    setActiveId(null)
  }

  function handleManagerOverride() {
    if (!ticket) return
    const result = checkReadiness(ticket, { managerOverride: true })
    setReadiness(result)
    if (result.overallStatus !== 'blocked') {
      try { successTap() } catch {}
      toast('Manager override applied')
    }
  }

  const totals = calcTotals(ticket)
  const catalogItems = tab === 'Cart' ? [] : getCatalogByCategory(tab)
  const cartCount = (ticket?.items || []).reduce((s, i) => s + i.qty, 0)
  const navigate = useNavigate()
  const staff = POS3_STAFF[0]
  const occupiedTables = getTables().filter((t) => t.status === 'occupied')
  const lowStock = EAT_INVENTORY.filter((i) => i.onHand <= i.par * 0.5)

  return (
    <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 76 }}>
      <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#fff' }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, color: L_NAVY }}>EAT System</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: L_GOLD, letterSpacing: '0.06em' }}>POWERED BY NOVEE OS</div>
        </div>
        <button type="button" disabled title="Notification center is not yet built" style={{ background: 'none', border: 'none', color: L_NAVY, position: 'relative', cursor: 'not-allowed', opacity: 0.45 }}>
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
      <div style={{ padding: '4px 16px 12px', fontSize: 13, color: '#4a5266', background: '#fff', borderBottom: '1px solid rgba(19,41,75,0.08)' }}>
        Good Evening, {staff.name.split(' ')[0]}! 👋
      </div>

      <StaffBand
        staff={staff}
        right={[
          <LightTouchButton key="scan" tone="ghost" disabled title="Table QR scanning is not yet wired — coming soon">Scan Table</LightTouchButton>,
          <LightTouchButton key="qa" tone="ghost" onClick={newTicket}>Quick Actions</LightTouchButton>,
        ]}
      />

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: L_NAVY, letterSpacing: '0.04em' }}>MY TABLES</div>
          <button type="button" onClick={() => navigate('/pos3/tables')} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All</button>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {occupiedTables.length === 0 && <div style={{ color: '#8b95a3', fontSize: 12 }}>No occupied tables right now.</div>}
          {occupiedTables.map((t) => (
            <LightCard key={t.id} style={{ minWidth: 132, flexShrink: 0, padding: 10 }}>
              <div style={{ fontWeight: 800, color: L_NAVY, fontSize: 13 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#6b7385' }}>{t.guests} Guests · {t.section}</div>
              <div style={{ fontSize: 11, color: '#6b7385' }}>Server: {t.server}</div>
            </LightCard>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: L_NAVY, letterSpacing: '0.04em' }}>ACTIVE ORDERS</div>
          <button type="button" onClick={() => navigate('/pos3/orders')} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All</button>
        </div>
        <LightCard style={{ padding: 0 }}>
          {tickets.length === 0 && <div style={{ color: '#8b95a3', fontSize: 12, padding: 14 }}>No open tickets.</div>}
          {tickets.map((t) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(19,41,75,0.06)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: L_NAVY }}>{t.tableId} · {t.id}</div>
                <div style={{ fontSize: 11, color: '#8b95a3' }}>{t.items.length} item{t.items.length === 1 ? '' : 's'}</div>
              </div>
              <button type="button" onClick={() => refresh(t.id)} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Open</button>
            </div>
          ))}
          <button type="button" onClick={newTicket} style={{ display: 'block', width: '100%', padding: 12, background: L_NAVY, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderRadius: '0 0 14px 14px' }}>
            + New Order
          </button>
        </LightCard>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {TABS.filter((t) => t !== 'Cart').map((t) => (
            <CategoryTile key={t} label={t} icon={CATEGORY_ICONS[t] || 'category'} onClick={() => setTab(t)} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flexShrink: 0, minHeight: 38, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
            background: tab === t ? L_NAVY : '#eceae3', color: tab === t ? '#fff' : '#4a5266', touchAction: 'manipulation',
          }}>{t}{t === 'Cart' && cartCount ? ` (${cartCount})` : ''}</button>
        ))}
      </div>

      <div style={{ padding: '12px 16px 16px' }}>
        {tab !== 'Cart' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {catalogItems.map((m) => (
              <TouchCard key={m.id} onClick={() => handleAddCard(m)} pulse={pulseCardId === m.id} style={{ padding: 10, background: '#fff', border: '1px solid rgba(19,41,75,0.08)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: L_NAVY }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#8b95a3', minHeight: 14 }}>
                  {m.modifiers?.length ? `${m.modifiers.length} options` : ' '}
                  {m.ageRestricted ? ' · 21+' : ''}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ color: '#9c7320', fontWeight: 800 }}>${m.price.toFixed(2)}</span>
                  <TouchButton tone="primary" onClick={(e) => { e.stopPropagation(); handleAddCard(m) }} style={{ padding: '8px 14px', fontSize: 12, minHeight: 40 }}>+ Add</TouchButton>
                </div>
              </TouchCard>
            ))}
          </div>
        )}

        {tab === 'Cart' && (
          <LightCard style={{ padding: 14 }}>
            {!ticket || !ticket.items.length ? (
              <div style={{ color: '#8b95a3', textAlign: 'center', padding: 20 }}>Cart is empty</div>
            ) : (
              ticket.items.map((i) => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: L_NAVY }}>{i.name}</div>
                    <Pill label={i.destination} tone={i.destination} />
                    {i.modifiers?.length > 0 && <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>{i.modifiers.map((m) => m.label).join(', ')}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <QuantityStepper value={i.qty} onChange={(q) => step(i.id, q)} />
                    <span style={{ color: '#9c7320', width: 56, textAlign: 'right', fontWeight: 800 }}>${(i.price * i.qty).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </LightCard>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 16px' }}>
        <LightCard style={{ padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: L_NAVY, marginBottom: 6 }}>PAYMENT</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#9c7320', marginBottom: 8 }}>${totals.total.toFixed(2)}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <LightTouchButton tone="outline" onClick={() => setDrawerOpen(true)} style={{ flex: 1, fontSize: 11 }}>Card</LightTouchButton>
            <LightTouchButton tone="outline" onClick={() => setDrawerOpen(true)} style={{ flex: 1, fontSize: 11 }}>Cash</LightTouchButton>
          </div>
        </LightCard>
        <LightCard style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: L_NAVY }}>HUMIDOR</span>
            {lowStock.length > 0 && <Pill label={`Low Stock ${lowStock.length}`} tone="critical" />}
          </div>
          {lowStock[0] ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: L_NAVY }}>{lowStock[0].name}</div>
              <div style={{ fontSize: 11, color: '#b33b3b' }}>Only {lowStock[0].onHand} left</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#6b7385' }}>All par levels healthy.</div>
          )}
          <button type="button" onClick={() => navigate('/pos3/humidor')} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}>View Humidor →</button>
        </LightCard>
      </div>

      <ModifierSheet item={pendingItem} open={!!pendingItem} onConfirm={confirmModifiers} onClose={() => setPendingItem(null)} />
      {readiness && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <DestinationRouter groups={ticket ? groupByDestination(ticket) : {}} />
            <OrderReadinessPanel
              readiness={readiness}
              onConfirmSend={() => doSend()}
              onManagerOverride={handleManagerOverride}
              onCancel={() => setReadiness(null)}
            />
          </div>
        </div>
      )}
      <CheckoutDrawer
        open={drawerOpen}
        ticket={ticket}
        totals={totals}
        onClose={() => setDrawerOpen(false)}
        onPrimaryAction={handleSend}
        primaryLabel="Send Ticket"
      />

      <LightBottomNav items={[
        { label: 'Home', icon: 'home', active: true, onClick: () => navigate('/pos3') },
        { label: 'Tables', icon: 'table_restaurant', onClick: () => navigate('/pos3/tables') },
        { label: 'Orders', icon: 'receipt_long', badge: tickets.length || undefined, onClick: () => navigate('/pos3/orders') },
        { label: 'Messages', icon: 'chat', disabled: true, disabledReason: 'Staff messaging is not yet built' },
        { label: 'More', icon: 'more_horiz', onClick: () => navigate('/pos3/settings') },
      ]} />
    </LightShell>
  )
}
