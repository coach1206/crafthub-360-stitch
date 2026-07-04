/**
 * POS360 Order Lifecycle — UI Foundation (Phase B.5)
 * Connects: Floor (B.1) · Menu Builder (B.2) · Handheld (B.3) · Production Display (B.4)
 */

import { useState, useEffect, useCallback } from 'react'
import { usePOS360VenueContextHook } from '../../utils/pos360VenueContext.js'

// ── Design tokens ─────────────────────────────────────────────────────────────
const DARK_BG   = '#080604'
const GOLD      = '#c9952c'
const DARK_CARD = '#13110d'
const DARK_LINE = '#2a2520'
const DARK_TEXT = '#f0ead8'
const DARK_MUTE = '#8a7e6a'
const RED       = '#c0392b'
const GREEN     = '#27ae60'
const BLUE      = '#2980b9'
const AMBER     = '#e67e22'

const STATUS_COLORS = {
  draft:            DARK_MUTE,
  open:             BLUE,
  held:             AMBER,
  fired:            GOLD,
  partially_fired:  GOLD,
  in_production:    BLUE,
  partially_ready:  GREEN,
  ready:            GREEN,
  served:           GREEN,
  payment_pending:  AMBER,
  paid:             GREEN,
  closed:           DARK_MUTE,
  canceled:         RED,
  voided:           RED,
  refunded_hook:    AMBER,
  sync_pending:     DARK_MUTE,
}

function btnStyle(color, disabled = false) {
  return {
    background: disabled ? DARK_LINE : color + '25',
    border: `1px solid ${disabled ? DARK_LINE : color}`,
    color: disabled ? DARK_MUTE : color,
    borderRadius: 6, padding: '6px 14px', fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] ?? DARK_MUTE
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4,
      background: c + '30', color: c }}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

// ── Order item row ─────────────────────────────────────────────────────────────
function OrderItemRow({ item, onVoid, onHold, onFire, onRefire, readonly }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: `1px solid ${DARK_LINE}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: DARK_TEXT, fontSize: 14 }}>
          {item.quantity > 1 && <span style={{ color: GOLD, marginRight: 6 }}>×{item.quantity}</span>}
          {item.item_name}
        </div>
        {item.notes && <div style={{ color: AMBER, fontSize: 11 }}>{item.notes}</div>}
        {item.allergy_flags?.length > 0 && (
          <div style={{ color: RED, fontSize: 11 }}>⚠ {item.allergy_flags.join(', ')}</div>
        )}
        <StatusBadge status={item.status} />
      </div>
      <div style={{ color: DARK_MUTE, fontSize: 13, minWidth: 60, textAlign: 'right' }}>
        {item.unit_price_cents > 0 && `$${(item.total_cents / 100).toFixed(2)}`}
      </div>
      {!readonly && (
        <div style={{ display: 'flex', gap: 4, marginLeft: 10 }}>
          {['added','draft'].includes(item.status) && (
            <button onClick={() => onHold(item.id)} style={btnStyle(AMBER)}>Hold</button>
          )}
          {item.status === 'held' && (
            <button onClick={() => onFire(item.id)} style={btnStyle(BLUE)}>Fire</button>
          )}
          {['served','ready'].includes(item.status) && (
            <button onClick={() => onRefire(item.id)} style={btnStyle(GOLD)}>Refire</button>
          )}
          {!['canceled','voided'].includes(item.status) && (
            <button onClick={() => onVoid(item.id)} style={btnStyle(RED)}>Void</button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Modifier/addon panel ──────────────────────────────────────────────────────
function ModifierAddonPanel({ orderId, itemId, onClose }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const addMod = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch(`/api/pos360/orders/${orderId}/items/${itemId}/modifiers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modifierName: name }),
    })
    setSaving(false)
    setName('')
    onClose()
  }

  return (
    <div style={{ padding: 12, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, marginTop: 8 }}>
      <div style={{ color: DARK_TEXT, fontWeight: 600, marginBottom: 8 }}>Add Modifier</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Modifier name"
          style={{ flex: 1, background: DARK_BG, border: `1px solid ${DARK_LINE}`, color: DARK_TEXT,
            borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
        <button onClick={addMod} disabled={saving} style={btnStyle(GOLD, saving)}>Add</button>
        <button onClick={onClose} style={btnStyle(DARK_MUTE)}>Cancel</button>
      </div>
    </div>
  )
}

// ── Order cart ────────────────────────────────────────────────────────────────
function OrderCart({ orderId, onRefresh }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [modPanel, setModPanel] = useState(null)

  const fetchItems = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    const r = await fetch(`/api/pos360/orders/${orderId}`)
    const d = await r.json()
    setItems(d.items ?? [])
    setLoading(false)
  }, [orderId])

  useEffect(() => { fetchItems() }, [fetchItems])

  const act = async (endpoint, method = 'POST') => {
    await fetch(endpoint, { method })
    fetchItems()
    if (onRefresh) onRefresh()
  }

  const total = items.reduce((s, i) => s + (i.total_cents ?? 0), 0)

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: GOLD, fontWeight: 700, marginBottom: 12 }}>Order Cart</div>
      {loading && <div style={{ color: DARK_MUTE }}>Loading…</div>}
      {!loading && items.length === 0 && (
        <div style={{ color: DARK_MUTE, fontSize: 13, textAlign: 'center', padding: 20 }}>No items added yet.</div>
      )}
      {items.map(item => (
        <div key={item.id}>
          <OrderItemRow item={item} readonly={false}
            onVoid={id => act(`/api/pos360/orders/items/${id}/void`)}
            onHold={id => act(`/api/pos360/orders/items/${id}/hold`)}
            onFire={id => act(`/api/pos360/orders/items/${id}/fire`)}
            onRefire={id => act(`/api/pos360/orders/items/${id}/refire`)}
          />
          {modPanel === item.id && (
            <ModifierAddonPanel orderId={orderId} itemId={item.id} onClose={() => { setModPanel(null); fetchItems() }} />
          )}
        </div>
      ))}
      {items.length > 0 && (
        <div style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 12, paddingTop: 12,
          display: 'flex', justifyContent: 'space-between', color: DARK_TEXT, fontWeight: 700 }}>
          <span>Total</span>
          <span>${(total / 100).toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

// ── Course manager ────────────────────────────────────────────────────────────
function CourseManager({ orderId }) {
  const [courses, setCourses] = useState([])
  const [newName, setNewName] = useState('')

  const fetchCourses = useCallback(async () => {
    if (!orderId) return
    const r = await fetch(`/api/pos360/orders/${orderId}`)
    const d = await r.json()
    // Courses would be from a separate endpoint in full impl; use order detail
    setCourses([])
  }, [orderId])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const createCourse = async () => {
    if (!newName.trim()) return
    await fetch(`/api/pos360/orders/${orderId}/courses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseName: newName }),
    })
    setNewName('')
    fetchCourses()
  }

  const fireCourse = async (courseId) => {
    await fetch(`/api/pos360/orders/courses/${courseId}/fire`, { method: 'POST' })
    fetchCourses()
  }

  const holdCourse = async (courseId) => {
    await fetch(`/api/pos360/orders/courses/${courseId}/hold`, { method: 'POST' })
    fetchCourses()
  }

  const fireAll = async () => {
    await fetch(`/api/pos360/orders/${orderId}/courses/fire-all`, { method: 'POST' })
    fetchCourses()
  }

  const defaultCourses = ['Drinks', 'Appetizers', 'Cigars', 'Entrees', 'Dessert', 'Retail']

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: GOLD, fontWeight: 700 }}>Course Manager</div>
        <button onClick={fireAll} style={btnStyle(BLUE)}>Fire All</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Course name"
          style={{ flex: 1, background: DARK_BG, border: `1px solid ${DARK_LINE}`, color: DARK_TEXT,
            borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
        <button onClick={createCourse} style={btnStyle(GOLD)}>Add</button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {defaultCourses.map(c => (
          <button key={c} onClick={() => setNewName(c)}
            style={{ ...btnStyle(DARK_MUTE), fontSize: 11 }}>{c}</button>
        ))}
      </div>

      {courses.length === 0 && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>No courses created yet.</div>
      )}
      {courses.map(c => (
        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 0', borderBottom: `1px solid ${DARK_LINE}` }}>
          <div>
            <span style={{ color: DARK_TEXT, fontSize: 13 }}>{c.course_name}</span>
            <StatusBadge status={c.status} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => holdCourse(c.id)} style={btnStyle(AMBER)}>Hold</button>
            <button onClick={() => fireCourse(c.id)} style={btnStyle(BLUE)}>Fire</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab manager ───────────────────────────────────────────────────────────────
function TabManager({ venueId, onTabSelect }) {
  const [tabs, setTabs] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchTabs = useCallback(async () => {
    if (!venueId) return
    setLoading(true)
    const r = await fetch(`/api/pos360/orders/tabs?status=open`)
    const d = await r.json()
    setTabs(d.tabs ?? [])
    setLoading(false)
  }, [venueId])

  useEffect(() => { fetchTabs() }, [fetchTabs])

  const createTab = async () => {
    await fetch('/api/pos360/orders/tabs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tabType: 'table' }),
    })
    fetchTabs()
  }

  const paymentPending = async (tabId) => {
    await fetch(`/api/pos360/orders/tabs/${tabId}/payment-pending`, { method: 'POST' })
    fetchTabs()
  }

  const closeTab = async (tabId) => {
    await fetch(`/api/pos360/orders/tabs/${tabId}/close`, { method: 'POST' })
    fetchTabs()
  }

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: GOLD, fontWeight: 700 }}>Tab Manager</div>
        <button onClick={createTab} style={btnStyle(GOLD)}>+ New Tab</button>
      </div>
      {loading && <div style={{ color: DARK_MUTE }}>Loading…</div>}
      {tabs !== null && tabs.length === 0 && (
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No active tabs.</div>
      )}
      {tabs?.map(tab => (
        <div key={tab.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 0', borderBottom: `1px solid ${DARK_LINE}` }}>
          <div>
            <div style={{ color: DARK_TEXT, fontSize: 14 }}>
              Tab #{tab.tab_number} — {tab.tab_type}
            </div>
            <StatusBadge status={tab.status} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onTabSelect && onTabSelect(tab)} style={btnStyle(BLUE)}>View</button>
            <button onClick={() => paymentPending(tab.id)} style={btnStyle(AMBER)}>Payment</button>
            <button onClick={() => closeTab(tab.id)} style={btnStyle(DARK_MUTE)}>Close</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Table order panel ─────────────────────────────────────────────────────────
function TableOrderPanel({ venueId, tableId }) {
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    if (!tableId) return
    fetch(`/api/pos360/orders/tables/${tableId}/orders`)
      .then(r => r.json()).then(d => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
  }, [tableId])

  if (!tableId) return (
    <div style={{ padding: 20, color: DARK_MUTE, textAlign: 'center' }}>Select a table to view orders.</div>
  )

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: GOLD, fontWeight: 700, marginBottom: 12 }}>Table Orders</div>
      {orders === null && <div style={{ color: DARK_MUTE }}>Loading…</div>}
      {orders?.length === 0 && (
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No active orders found for this venue.</div>
      )}
      {orders?.map(o => (
        <div key={o.id} style={{ padding: '8px 0', borderBottom: `1px solid ${DARK_LINE}` }}>
          <span style={{ color: DARK_TEXT }}>#ORDER-{o.id?.slice(-6)}</span>
          <StatusBadge status={o.status} />
        </div>
      ))}
    </div>
  )
}

// ── Guest order panel ─────────────────────────────────────────────────────────
function GuestOrderPanel({ venueId, guestId }) {
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    if (!guestId) return
    fetch(`/api/pos360/orders/guests/${guestId}/orders`)
      .then(r => r.json()).then(d => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
  }, [guestId])

  if (!guestId) return null

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: GOLD, fontWeight: 700, marginBottom: 12 }}>Guest Orders</div>
      {orders === null && <div style={{ color: DARK_MUTE }}>Loading…</div>}
      {orders?.length === 0 && (
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No active orders found for this venue.</div>
      )}
      {orders?.map(o => (
        <div key={o.id} style={{ padding: '8px 0', borderBottom: `1px solid ${DARK_LINE}` }}>
          <span style={{ color: DARK_TEXT }}>#ORDER-{o.id?.slice(-6)}</span>
          <StatusBadge status={o.status} />
        </div>
      ))}
    </div>
  )
}

// ── SmokeCraft order context panel ────────────────────────────────────────────
function SmokeCraftOrderContextPanel({ orderId }) {
  const [ctx, setCtx] = useState(null)
  useEffect(() => {
    if (!orderId) return
    fetch(`/api/pos360/orders/${orderId}/smokecraft`)
      .then(r => r.json()).then(setCtx).catch(() => {})
  }, [orderId])

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <img src="/smokecraft-pos360.png" alt="SmokeCraft" style={{ height: 28, objectFit: 'contain' }} />
        <span style={{ color: GOLD, fontWeight: 600 }}>SmokeCraft Order Context</span>
      </div>
      {!ctx && <div style={{ color: DARK_MUTE, fontSize: 12 }}>Loading…</div>}
      {ctx?.localPreview && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>{ctx.message ?? 'SmokeCraft order context not connected.'}</div>
      )}
      {ctx && !ctx.localPreview && ctx.links?.length === 0 && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>No SmokeCraft sessions linked to this order.</div>
      )}
      {ctx?.links?.map(l => (
        <div key={l.id} style={{ color: DARK_TEXT, fontSize: 12, padding: '4px 0' }}>
          Session: {l.smokecraft_session_id ?? 'n/a'}
        </div>
      ))}
    </div>
  )
}

// ── Loyalty order context panel ───────────────────────────────────────────────
function LoyaltyOrderContextPanel({ orderId }) {
  const [ctx, setCtx] = useState(null)
  useEffect(() => {
    if (!orderId) return
    fetch(`/api/pos360/orders/${orderId}/loyalty`)
      .then(r => r.json()).then(setCtx).catch(() => {})
  }, [orderId])

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: GOLD, fontWeight: 700, marginBottom: 10 }}>Loyalty Context</div>
      {!ctx && <div style={{ color: DARK_MUTE, fontSize: 12 }}>Loading…</div>}
      {ctx?.localPreview && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>{ctx.message ?? 'Loyalty order context not connected.'}</div>
      )}
      {ctx && !ctx.localPreview && ctx.links?.length === 0 && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>No loyalty profile linked to this order.</div>
      )}
      {ctx?.links?.map(l => (
        <div key={l.id} style={{ color: DARK_TEXT, fontSize: 12, padding: '4px 0' }}>
          Profile: {l.loyalty_profile_id}
          {l.reward_applied && <span style={{ color: GREEN, marginLeft: 8 }}>✓ Reward Applied</span>}
        </div>
      ))}
    </div>
  )
}

// ── Routing status panel ──────────────────────────────────────────────────────
function RoutingStatusPanel({ orderId, onRoute }) {
  const [events, setEvents] = useState(null)
  const [routing, setRouting] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!orderId) return
    const r = await fetch(`/api/pos360/orders/${orderId}/routing/status`)
    const d = await r.json()
    setEvents(d.events ?? [])
  }, [orderId])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const routeNow = async () => {
    setRouting(true)
    await fetch(`/api/pos360/orders/${orderId}/route-to-production`, { method: 'POST' })
    setRouting(false)
    fetchStatus()
    if (onRoute) onRoute()
  }

  const retry = async () => {
    setRouting(true)
    await fetch(`/api/pos360/orders/${orderId}/routing/retry`, { method: 'POST' })
    setRouting(false)
    fetchStatus()
  }

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: GOLD, fontWeight: 700 }}>Routing Status</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={routeNow} disabled={routing} style={btnStyle(BLUE, routing)}>
            {routing ? 'Routing…' : 'Route to Production'}
          </button>
          <button onClick={retry} disabled={routing} style={btnStyle(AMBER, routing)}>Retry</button>
        </div>
      </div>
      {events === null && <div style={{ color: DARK_MUTE, fontSize: 12 }}>Loading…</div>}
      {events?.length === 0 && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>No routing events yet.</div>
      )}
      {events?.map(e => (
        <div key={e.id} style={{ padding: '6px 0', borderBottom: `1px solid ${DARK_LINE}`, fontSize: 12 }}>
          <span style={{ color: DARK_TEXT }}>{e.station_type}</span>
          <span style={{ color: e.routing_status === 'routed' ? GREEN : AMBER, marginLeft: 10 }}>
            {e.routing_status}
          </span>
          {e.failure_reason && (
            <div style={{ color: RED, fontSize: 11 }}>
              Routing could not be resolved for this item. {e.failure_reason}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Production ticket preview ─────────────────────────────────────────────────
function ProductionTicketPreview({ orderId }) {
  const [routing, setRouting] = useState(null)

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/pos360/orders/${orderId}/routing`)
      .then(r => r.json()).then(setRouting).catch(() => {})
  }, [orderId])

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: GOLD, fontWeight: 700, marginBottom: 12 }}>Production Ticket Preview</div>
      {!routing && <div style={{ color: DARK_MUTE, fontSize: 12 }}>Loading…</div>}
      {routing?.localPreview && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>
          Production ticket was not created. Check routing configuration.
        </div>
      )}
      {routing && !routing.localPreview && (
        <>
          {routing.items?.filter(i => i.resolved_station_type).map(i => (
            <div key={i.id} style={{ padding: '6px 0', borderBottom: `1px solid ${DARK_LINE}`, fontSize: 12 }}>
              <span style={{ color: DARK_TEXT }}>{i.item_name}</span>
              <span style={{ color: GOLD, marginLeft: 10 }}>→ {i.resolved_station_type}</span>
            </div>
          ))}
          {routing.unresolved?.length > 0 && (
            <div style={{ color: AMBER, fontSize: 11, marginTop: 8 }}>
              {routing.unresolved.length} item(s) unresolved — Routing could not be resolved for this item.
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Order audit timeline ──────────────────────────────────────────────────────
function OrderAuditTimeline({ orderId }) {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/pos360/orders/${orderId}/audit`)
      .then(r => r.json()).then(d => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
  }, [orderId])

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: GOLD, fontWeight: 700, marginBottom: 12 }}>Audit Timeline</div>
      {entries === null && <div style={{ color: DARK_MUTE, fontSize: 12 }}>Loading…</div>}
      {entries?.length === 0 && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>No audit entries yet.</div>
      )}
      {entries?.map(e => (
        <div key={e.id} style={{ padding: '6px 0', borderBottom: `1px solid ${DARK_LINE}`, fontSize: 12 }}>
          <div style={{ color: DARK_TEXT }}>{e.action}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>
            {e.actor_id ?? 'system'} · {new Date(e.created_at).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Hold/fire control panel ───────────────────────────────────────────────────
function HoldFireControlPanel({ orderId, onAction }) {
  const [status, setStatus] = useState(null)

  const act = async (endpoint) => {
    const r = await fetch(`/api/pos360/orders${endpoint}`, { method: 'POST' })
    const d = await r.json()
    setStatus(d.ok ? 'Done' : d.error ?? 'Failed')
    if (d.ok && onAction) onAction()
  }

  return (
    <div style={{ padding: 16, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: GOLD, fontWeight: 700, marginBottom: 12 }}>Hold / Fire</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => act(`/${orderId}/hold`)}  style={btnStyle(AMBER)}>Hold Order</button>
        <button onClick={() => act(`/${orderId}/fire`)}  style={btnStyle(BLUE)}>Fire Order</button>
        <button onClick={() => act(`/${orderId}/cancel-hold`)} style={btnStyle(DARK_MUTE)}>Cancel Hold</button>
      </div>
      {status && <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>{status}</div>}
    </div>
  )
}

// ── Order detail ──────────────────────────────────────────────────────────────
function OrderDetail({ orderId, onBack }) {
  const [order, setOrder] = useState(null)
  const [activeTab, setActiveTab] = useState('cart')

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    const r = await fetch(`/api/pos360/orders/${orderId}`)
    const d = await r.json()
    setOrder(d.order)
  }, [orderId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  const TABS = ['cart', 'courses', 'routing', 'ticket', 'smokecraft', 'loyalty', 'hold_fire', 'audit']

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={btnStyle(DARK_MUTE)}>← Back</button>
        <div>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>
            Order #{order?.id?.slice(-6) ?? orderId.slice(-6)}
          </div>
          {order && <StatusBadge status={order.status} />}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ ...btnStyle(t === activeTab ? GOLD : DARK_MUTE), fontWeight: t === activeTab ? 700 : 400 }}>
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'cart'       && <OrderCart orderId={orderId} onRefresh={fetchOrder} />}
      {activeTab === 'courses'    && <CourseManager orderId={orderId} />}
      {activeTab === 'routing'    && <RoutingStatusPanel orderId={orderId} onRoute={fetchOrder} />}
      {activeTab === 'ticket'     && <ProductionTicketPreview orderId={orderId} />}
      {activeTab === 'smokecraft' && <SmokeCraftOrderContextPanel orderId={orderId} />}
      {activeTab === 'loyalty'    && <LoyaltyOrderContextPanel orderId={orderId} />}
      {activeTab === 'hold_fire'  && <HoldFireControlPanel orderId={orderId} onAction={fetchOrder} />}
      {activeTab === 'audit'      && <OrderAuditTimeline orderId={orderId} />}
    </div>
  )
}

// ── Order list ────────────────────────────────────────────────────────────────
function OrderList({ venueId, onSelectOrder }) {
  const [orders, setOrders] = useState(null)
  const [statusFilter, setStatusFilter] = useState('open')

  const fetchOrders = useCallback(async () => {
    if (!venueId) return
    const params = statusFilter ? `?status=${statusFilter}` : ''
    const r = await fetch(`/api/pos360/orders${params}`)
    const d = await r.json()
    setOrders(d.orders ?? [])
  }, [venueId, statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const statuses = ['open', 'fired', 'in_production', 'ready', 'payment_pending', '']
  const createOrder = async () => {
    const r = await fetch('/api/pos360/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderType: 'dine_in' }),
    })
    const d = await r.json()
    if (d.order?.id) onSelectOrder(d.order.id)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>Orders</div>
        <button onClick={createOrder} style={btnStyle(GOLD)}>+ New Order</button>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ ...btnStyle(s === statusFilter ? GOLD : DARK_MUTE), fontSize: 11 }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {orders === null && <div style={{ color: DARK_MUTE, padding: 20 }}>Loading…</div>}
      {orders?.length === 0 && (
        <div style={{ color: DARK_MUTE, textAlign: 'center', padding: 40 }}>
          No active orders found for this venue.
        </div>
      )}
      {orders?.map(o => (
        <div key={o.id} onClick={() => onSelectOrder(o.id)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 14, marginBottom: 8, background: DARK_CARD, border: `1px solid ${DARK_LINE}`,
            borderRadius: 8, cursor: 'pointer' }}>
          <div>
            <div style={{ color: DARK_TEXT, fontWeight: 600 }}>
              #ORDER-{o.id?.slice(-6)}
              {o.rush_flag && <span style={{ color: RED, marginLeft: 8, fontSize: 11 }}>RUSH</span>}
            </div>
            <div style={{ color: DARK_MUTE, fontSize: 12 }}>
              {o.order_type} · {o.item_count} items · ${(o.total_cents / 100).toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StatusBadge status={o.status} />
            <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 4 }}>
              {new Date(o.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Order lifecycle home ──────────────────────────────────────────────────────
function OrderLifecycleHome({ venueId, onNavigate }) {
  const quickStats = [
    { label: 'New Order', icon: '➕', action: 'new_order', color: GOLD },
    { label: 'Open Orders', icon: '📋', action: 'orders', color: BLUE },
    { label: 'Tabs', icon: '📑', action: 'tabs', color: AMBER },
    { label: 'Table View', icon: '🪑', action: 'tables', color: GREEN },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <img src="/smokecraft-pos360.png" alt="POS360" style={{ height: 36, objectFit: 'contain' }} />
        <div>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 18 }}>Order Lifecycle</div>
          <div style={{ color: DARK_MUTE, fontSize: 12 }}>B.5 — Orders · Tabs · Courses · Routing</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {quickStats.map(s => (
          <button key={s.action} onClick={() => onNavigate(s.action)}
            style={{ background: DARK_CARD, border: `1px solid ${s.color}30`,
              borderRadius: 10, padding: 20, cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ color: s.color, fontWeight: 600, fontSize: 14 }}>{s.label}</div>
          </button>
        ))}
      </div>

      <div style={{ padding: 14, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
        <div style={{ color: DARK_MUTE, fontSize: 12, lineHeight: 1.6 }}>
          Connected to: Floor Management (B.1) · Menu Builder (B.2) · Handheld POS (B.3) · Production Display (B.4)
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────
const VIEWS = ['home', 'orders', 'tabs', 'tables']

export default function POS360OrderLifecycle() {
  const venueCtx    = usePOS360VenueContextHook()
  const venueId     = venueCtx?.venueId
  const [view, setView] = useState('home')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const navigate = (action) => {
    if (action === 'new_order') {
      setView('orders')
    } else {
      setView(action)
    }
  }

  if (!venueId) {
    return (
      <div style={{ background: DARK_BG, minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: DARK_MUTE }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
          <div>No venue context. Please log in with a venue-assigned account.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: DARK_BG, minHeight: '100vh', color: DARK_TEXT, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${DARK_LINE}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: GOLD, fontWeight: 700 }}>POS360 Order Lifecycle</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {VIEWS.map(v => (
            <button key={v} onClick={() => { setView(v); setSelectedOrder(null) }}
              style={{ ...btnStyle(v === view ? GOLD : DARK_MUTE), fontWeight: v === view ? 700 : 400 }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {view === 'home' && !selectedOrder && (
          <OrderLifecycleHome venueId={venueId} onNavigate={navigate} />
        )}

        {view === 'orders' && !selectedOrder && (
          <OrderList venueId={venueId} onSelectOrder={(id) => setSelectedOrder(id)} />
        )}

        {view === 'orders' && selectedOrder && (
          <OrderDetail orderId={selectedOrder} onBack={() => setSelectedOrder(null)} />
        )}

        {view === 'tabs' && (
          <TabManager venueId={venueId} onTabSelect={tab => {}} />
        )}

        {view === 'tables' && (
          <TableOrderPanel venueId={venueId} tableId={null} />
        )}
      </div>
    </div>
  )
}
