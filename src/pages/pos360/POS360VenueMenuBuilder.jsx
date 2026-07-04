/**
 * POS360 Venue Menu Builder — Phase B.2
 *
 * Fully dynamic. No hardcoded categories, items, or venue types.
 * Visual anchor: /smokecraft-pos360.png
 *
 * Supports: restaurants, cigar lounges, bars, coffee shops, breweries,
 * wineries, distilleries, retail, golf clubs, hotels, casinos, food trucks,
 * stadiums, entertainment venues, and any future business model.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Design tokens ─────────────────────────────────────────────────────────────
const DARK_BG   = '#080604'
const DARK_CARD = 'rgba(20,15,8,0.92)'
const DARK_LINE = 'rgba(201,149,44,0.18)'
const DARK_MUTE = 'rgba(243,238,225,0.45)'
const DARK_TEXT = '#f3eee1'
const GOLD      = '#c9952c'
const GOLD_DIM  = 'rgba(201,149,44,0.22)'
const GREEN     = '#2e7d32'
const RED_DIM   = 'rgba(183,28,28,0.3)'

const ITEM_STATUS_COLORS = {
  draft: DARK_MUTE, active: GREEN, inactive: '#546e7a',
  out_of_stock: '#b71c1c', limited: '#e65100', seasonal: '#6a1b9a', archived: '#4e342e',
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts })
    return res.json()
  } catch { return { ok: false, localPreview: true } }
}

// ── SyncStatusIndicator ───────────────────────────────────────────────────────
function SyncStatus({ localPreview, loading }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: localPreview ? '#e65100' : loading ? GOLD : GREEN, display: 'inline-block' }} />
      <span style={{ fontSize: 10, color: DARK_MUTE, fontFamily: 'JetBrains Mono, monospace' }}>
        {localPreview ? 'Local Preview' : loading ? 'Loading…' : 'Live'}
      </span>
    </div>
  )
}

// ── Menu List Panel ───────────────────────────────────────────────────────────
function MenuListPanel({ venueId, selectedMenuId, onSelect, onMenuCreated }) {
  const [menus, setMenus] = useState([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch(`/api/pos360/menu/venues/${venueId}/menus`).then(r => setMenus(r.menus || []))
  }, [venueId])

  async function handleCreate() {
    if (!newName.trim()) return
    setLoading(true)
    const r = await apiFetch(`/api/pos360/menu/venues/${venueId}/menus`, { method: 'POST', body: JSON.stringify({ menuName: newName.trim() }) })
    setLoading(false)
    if (r.ok) { setNewName(''); setCreating(false); setMenus(m => [...m, r.menu]); onMenuCreated?.(r.menu) }
  }

  const STATUS_COLOR = { active: GREEN, draft: DARK_MUTE, archived: '#4e342e', disabled: '#b71c1c', scheduled: GOLD }

  return (
    <div style={S.leftPanel}>
      <div style={S.panelHeader}>
        <span style={S.panelHeaderTitle}>MENUS</span>
        <button onClick={() => setCreating(c => !c)} style={S.miniBtn}>{creating ? '✕' : '+'}</button>
      </div>
      {creating && (
        <div style={{ padding: '0 10px 10px', display: 'flex', gap: 6 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Menu name…" style={{ ...S.input, flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} disabled={loading} style={S.miniBtn}>{loading ? '…' : '✓'}</button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {menus.length === 0 ? (
          <div style={{ padding: '16px 12px', color: DARK_MUTE, fontSize: 12, fontStyle: 'italic' }}>No menus yet.</div>
        ) : menus.map(m => (
          <div key={m.menu_id} onClick={() => onSelect(m)}
            style={{ ...S.listItem, ...(selectedMenuId === m.menu_id ? S.listItemActive : {}) }}>
            <span style={{ flex: 1, fontSize: 13 }}>{m.menu_name}</span>
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: STATUS_COLOR[m.status] || DARK_MUTE }}>{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Category Manager ──────────────────────────────────────────────────────────
function CategoryManager({ venueId, menuId, selectedCatId, onSelect }) {
  const [cats, setCats] = useState([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!menuId) { setCats([]); return }
    apiFetch(`/api/pos360/menu/venues/${venueId}/categories?menuId=${menuId}`).then(r => setCats(r.categories || []))
  }, [venueId, menuId])

  async function handleCreate() {
    if (!newName.trim() || !menuId) return
    setLoading(true)
    const r = await apiFetch(`/api/pos360/menu/venues/${venueId}/categories`, { method: 'POST', body: JSON.stringify({ menuId, categoryName: newName.trim() }) })
    setLoading(false)
    if (r.ok) { setNewName(''); setCreating(false); setCats(c => [...c, r.category]); onSelect?.(r.category) }
  }

  if (!menuId) return <div style={{ ...S.categoryPanel, justifyContent: 'center', alignItems: 'center' }}><div style={{ color: DARK_MUTE, fontSize: 12, fontStyle: 'italic' }}>Select a menu first.</div></div>

  return (
    <div style={S.categoryPanel}>
      <div style={S.panelHeader}>
        <span style={S.panelHeaderTitle}>CATEGORIES</span>
        <button onClick={() => setCreating(c => !c)} style={S.miniBtn}>{creating ? '✕' : '+'}</button>
      </div>
      {creating && (
        <div style={{ padding: '0 10px 10px', display: 'flex', gap: 6 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name…" style={{ ...S.input, flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} disabled={loading} style={S.miniBtn}>{loading ? '…' : '✓'}</button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cats.length === 0 ? (
          <div style={{ padding: '12px', color: DARK_MUTE, fontSize: 12, fontStyle: 'italic' }}>No categories configured.</div>
        ) : cats.map(c => (
          <div key={c.category_id} onClick={() => onSelect?.(c)}
            style={{ ...S.listItem, ...(selectedCatId === c.category_id ? S.listItemActive : {}) }}>
            <span style={{ flex: 1, fontSize: 13 }}>{c.category_name}</span>
            {c.age_gated && <span style={{ fontSize: 9, color: '#f9a825' }}>21+</span>}
            {!c.is_active && <span style={{ fontSize: 9, color: DARK_MUTE }}>off</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Item Manager ──────────────────────────────────────────────────────────────
function ItemManager({ venueId, menuId, categoryId, onItemSelect }) {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm]     = useState({ itemName: '', basePrice: '' })

  useEffect(() => {
    if (!menuId) { setItems([]); return }
    setLoading(true)
    const params = new URLSearchParams({ menuId })
    if (categoryId) params.set('categoryId', categoryId)
    apiFetch(`/api/pos360/menu/venues/${venueId}/items?${params}`).then(r => { setItems(r.items || []); setLoading(false) })
  }, [venueId, menuId, categoryId])

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.itemName.trim() || !menuId) return
    setLoading(true)
    const r = await apiFetch(`/api/pos360/menu/venues/${venueId}/items`, {
      method: 'POST',
      body: JSON.stringify({ menuId, categoryId: categoryId || null, itemName: form.itemName.trim(), basePrice: parseFloat(form.basePrice) || 0 }),
    })
    setLoading(false)
    if (r.ok) { setForm({ itemName: '', basePrice: '' }); setCreating(false); setItems(i => [...i, r.item]) }
  }

  async function toggleOutOfStock(item) {
    const outOfStock = item.status !== 'out_of_stock'
    const r = await apiFetch(`/api/pos360/menu/venues/${venueId}/items/${item.item_id}/out-of-stock`, { method: 'POST', body: JSON.stringify({ outOfStock }) })
    if (r.ok) setItems(prev => prev.map(i => i.item_id === item.item_id ? { ...i, status: r.status } : i))
  }

  if (!menuId) return <div style={{ ...S.itemArea, justifyContent: 'center', alignItems: 'center' }}><div style={{ color: DARK_MUTE, fontSize: 12, fontStyle: 'italic' }}>Select a menu to manage items.</div></div>

  return (
    <div style={S.itemArea}>
      <div style={S.panelHeader}>
        <span style={S.panelHeaderTitle}>ITEMS {categoryId ? '' : '(all categories)'}</span>
        <button onClick={() => setCreating(c => !c)} style={S.miniBtn}>{creating ? '✕' : '+ Item'}</button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} style={{ padding: '0 14px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} placeholder="Item name" required style={{ ...S.input, flex: '1 1 180px' }} />
          <input value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} placeholder="Price (0.00)" type="number" min="0" step="0.01" style={{ ...S.input, width: 100 }} />
          <button type="submit" disabled={loading} style={S.miniBtn}>{loading ? '…' : 'Add'}</button>
        </form>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 14px' }}>
        {loading && items.length === 0 ? (
          <div style={{ color: DARK_MUTE, fontSize: 12, fontStyle: 'italic', paddingTop: 16 }}>Loading items…</div>
        ) : items.length === 0 ? (
          <div style={{ color: DARK_MUTE, fontSize: 12, fontStyle: 'italic', paddingTop: 16 }}>No items in this {categoryId ? 'category' : 'menu'} yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map(item => (
              <div key={item.item_id} style={S.itemRow} onClick={() => onItemSelect?.(item)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: DARK_TEXT }}>{item.item_name}</div>
                  {item.item_description && <div style={{ fontSize: 11, color: DARK_MUTE, marginTop: 2 }}>{item.item_description.slice(0, 80)}{item.item_description.length > 80 ? '…' : ''}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: GOLD }}>${Number(item.base_price).toFixed(2)}</span>
                    <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: ITEM_STATUS_COLORS[item.status] || DARK_MUTE }}>{item.status}</span>
                    {item.is_age_gated && <span style={{ fontSize: 10, color: '#f9a825' }}>21+</span>}
                    {item.is_featured && <span style={{ fontSize: 10, color: GOLD }}>★</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); toggleOutOfStock(item) }} style={{ ...S.microBtn, background: item.status === 'out_of_stock' ? GREEN : RED_DIM }}>
                    {item.status === 'out_of_stock' ? 'Back In' : '86'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Item Detail Drawer ────────────────────────────────────────────────────────
function ItemDetailDrawer({ item, venueId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [pricing, setPricing] = useState(null)

  useEffect(() => {
    if (!item) return
    setDetail(null); setPricing(null)
    Promise.all([
      apiFetch(`/api/pos360/menu/venues/${venueId}/items/${item.item_id}/detail`),
      apiFetch(`/api/pos360/menu/venues/${venueId}/items/${item.item_id}/resolve`),
    ]).then(([d, p]) => { setDetail(d); setPricing(p) })
  }, [item, venueId])

  if (!item) return null

  return (
    <div style={S.drawer}>
      <div style={S.drawerHeader}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: GOLD }}>{item.item_name}</div>
          <div style={{ fontSize: 11, color: DARK_MUTE, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{item.item_id?.slice(-8)}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: DARK_MUTE, cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      {/* Price & Tax */}
      <div style={S.drawerSection}>
        <div style={S.drawerSectionTitle}>PRICING & TAX</div>
        <div style={S.infoGrid}>
          <div style={S.infoCell}><div style={S.infoCellLabel}>Base Price</div><div style={S.infoCellVal}>${Number(item.base_price).toFixed(2)}</div></div>
          <div style={S.infoCell}><div style={S.infoCellLabel}>Active Price</div><div style={S.infoCellVal}>{pricing ? `$${Number(pricing.price).toFixed(2)}` : '…'}</div></div>
          <div style={S.infoCell}><div style={S.infoCellLabel}>Tax Rate</div><div style={S.infoCellVal}>{pricing ? `${(Number(pricing.taxRate || 0) * 100).toFixed(2)}%` : '…'}</div></div>
          <div style={S.infoCell}><div style={S.infoCellLabel}>Rule</div><div style={S.infoCellVal}>{pricing?.ruleType || 'base_price'}</div></div>
        </div>
      </div>

      {/* Routing */}
      <div style={S.drawerSection}>
        <div style={S.drawerSectionTitle}>ROUTING STATIONS</div>
        {detail?.routing?.length ? (
          detail.routing.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: DARK_TEXT }}>{r.station_name}</span>
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: GOLD }}>{r.is_primary ? 'primary' : 'secondary'}</span>
            </div>
          ))
        ) : <div style={{ fontSize: 12, color: DARK_MUTE, fontStyle: 'italic' }}>No routing assigned yet.</div>}
      </div>

      {/* Modifiers */}
      <div style={S.drawerSection}>
        <div style={S.drawerSectionTitle}>MODIFIER GROUPS</div>
        {detail?.modifierGroups?.length ? (
          detail.modifierGroups.map(g => (
            <div key={g.group_id} style={{ fontSize: 12, color: DARK_TEXT, marginBottom: 4 }}>
              {g.group_name} <span style={{ color: DARK_MUTE, fontSize: 10 }}>({g.selection_type})</span>
            </div>
          ))
        ) : <div style={{ fontSize: 12, color: DARK_MUTE, fontStyle: 'italic' }}>No modifier groups attached.</div>}
      </div>

      {/* Add-ons */}
      <div style={S.drawerSection}>
        <div style={S.drawerSectionTitle}>ADD-ONS</div>
        {detail?.addons?.length ? (
          detail.addons.map(a => (
            <div key={a.addon_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: DARK_TEXT }}>{a.addon_name}</span>
              <span style={{ fontSize: 12, color: GOLD }}>+${Number(a.price).toFixed(2)}</span>
            </div>
          ))
        ) : <div style={{ fontSize: 12, color: DARK_MUTE, fontStyle: 'italic' }}>No add-ons configured.</div>}
      </div>

      {/* SmokeCraft / EAT hooks */}
      <div style={S.drawerSection}>
        <div style={S.drawerSectionTitle}>SMOKECRAFT / E.A.T. HOOKS</div>
        <div style={{ fontSize: 11, color: DARK_MUTE, fontStyle: 'italic' }}>
          {item.smokecraft_meta && Object.keys(item.smokecraft_meta).length > 0
            ? 'SmokeCraft metadata configured.'
            : 'No SmokeCraft metadata. Add cigar pairing profile, flavor notes, origin, etc. via item update.'}
        </div>
        <div style={{ fontSize: 11, color: DARK_MUTE, fontStyle: 'italic', marginTop: 4 }}>
          {item.eat_meta && Object.keys(item.eat_meta).length > 0
            ? 'E.A.T. metadata configured.'
            : 'No E.A.T. metadata. Provider-agnostic hook ready for Phase B.3+.'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 10, background: item.loyalty_eligible ? 'rgba(46,125,50,0.2)' : RED_DIM, color: item.loyalty_eligible ? '#81c784' : '#ef9a9a', borderRadius: 4, padding: '2px 6px' }}>Loyalty: {item.loyalty_eligible ? 'Yes' : 'No'}</span>
          <span style={{ fontSize: 10, background: item.vip_eligible ? GOLD_DIM : RED_DIM, color: item.vip_eligible ? GOLD : '#ef9a9a', borderRadius: 4, padding: '2px 6px' }}>VIP: {item.vip_eligible ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  )
}

// ── Handheld Preview ──────────────────────────────────────────────────────────
function HandheldPreview({ venueId }) {
  const [data, setData]   = useState(null)
  const [selCat, setSelCat] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    apiFetch(`/api/pos360/menu/venues/${venueId}/handheld/active-menu`).then(r => { setData(r); setSelCat(null) })
  }, [venueId])

  useEffect(() => {
    if (!selCat || !data?.activeMenu) return
    apiFetch(`/api/pos360/menu/venues/${venueId}/handheld/categories/${selCat.category_id}/items?menuId=${data.activeMenu.menu_id}`)
      .then(r => setItems(r.items || []))
  }, [selCat, venueId, data])

  return (
    <div style={S.previewPane}>
      <div style={{ fontSize: 10, color: GOLD, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 10 }}>HANDHELD PREVIEW</div>
      {!data?.activeMenu ? (
        <div style={{ textAlign: 'center' }}>
          <img src="/smokecraft-pos360.png" alt="POS360 SmokeCraft visual reference" style={{ width: '100%', borderRadius: 10, border: `1px solid ${DARK_LINE}`, maxHeight: 200, objectFit: 'cover', objectPosition: 'top' }} />
          <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
            {data?.message || 'No active menu configured for this venue.'}
          </div>
          <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 6 }}>Set a menu to Active + Handheld to preview here.</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: DARK_TEXT, marginBottom: 8 }}>{data.activeMenu.menu_name}</div>
          {/* Dynamic category buttons — generated from venue data, no hardcoding */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            <button onClick={() => { setSelCat(null); setItems([]) }} style={{ ...S.catPill, ...(selCat === null ? S.catPillActive : {}) }}>All</button>
            {(data.categories || []).map(c => (
              <button key={c.category_id} onClick={() => setSelCat(c)} style={{ ...S.catPill, ...(selCat?.category_id === c.category_id ? S.catPillActive : {}) }}>
                {c.category_name}
              </button>
            ))}
          </div>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', maxHeight: 260 }}>
            {(selCat ? items : data.items || []).map(item => (
              <div key={item.item_id} style={S.previewItem}>
                <span style={{ flex: 1, fontSize: 12, color: DARK_TEXT }}>{item.item_name}</span>
                <span style={{ fontSize: 12, color: GOLD }}>${Number(item.base_price).toFixed(2)}</span>
              </div>
            ))}
            {(selCat ? items : data.items || []).length === 0 && (
              <div style={{ color: DARK_MUTE, fontSize: 11, fontStyle: 'italic' }}>No items.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Routing Station Manager ───────────────────────────────────────────────────
function RoutingStationManager({ venueId }) {
  const [stations, setStations] = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ stationName: '', stationType: 'custom' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch(`/api/pos360/menu/venues/${venueId}/routing-stations`).then(r => setStations(r.stations || []))
  }, [venueId])

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)
    const r = await apiFetch(`/api/pos360/menu/venues/${venueId}/routing-stations`, { method: 'POST', body: JSON.stringify(form) })
    setLoading(false)
    if (r.ok) { setCreating(false); setForm({ stationName: '', stationType: 'custom' }); setStations(s => [...s, r.station]) }
  }

  return (
    <div style={S.stationPanel}>
      <div style={S.panelHeader}>
        <span style={S.panelHeaderTitle}>PREP STATIONS</span>
        <button onClick={() => setCreating(c => !c)} style={S.miniBtn}>{creating ? '✕' : '+'}</button>
      </div>
      {creating && (
        <form onSubmit={handleCreate} style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input value={form.stationName} onChange={e => setForm(f => ({ ...f, stationName: e.target.value }))} placeholder="Station name (e.g. Bar, Kitchen, Humidor)" required style={S.input} />
          <input value={form.stationType} onChange={e => setForm(f => ({ ...f, stationType: e.target.value }))} placeholder="Type (kitchen, bar, humidor, custom…)" style={S.input} />
          <button type="submit" disabled={loading} style={S.miniBtn}>{loading ? '…' : 'Add Station'}</button>
        </form>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {stations.length === 0 ? (
          <div style={{ padding: '12px', color: DARK_MUTE, fontSize: 12, fontStyle: 'italic' }}>No stations configured.<br />Create Kitchen, Bar, Humidor, etc.</div>
        ) : stations.map(st => (
          <div key={st.station_id} style={S.listItem}>
            <span style={{ flex: 1, fontSize: 12, color: DARK_TEXT }}>{st.station_name}</span>
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: DARK_MUTE }}>{st.station_type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const VENUE_ID = 'novee-grand-lounge'

export default function POS360VenueMenuBuilder() {
  const navigate    = useNavigate()
  const [selectedMenu, setSelectedMenu]   = useState(null)
  const [selectedCat, setSelectedCat]     = useState(null)
  const [selectedItem, setSelectedItem]   = useState(null)
  const [localPreview, setLocalPreview]   = useState(false)
  const [activeTab, setActiveTab]         = useState('builder')

  const TABS = [
    { id: 'builder',  label: 'Menu Builder' },
    { id: 'pricing',  label: 'Pricing Rules' },
    { id: 'routing',  label: 'Routing Stations' },
    { id: 'preview',  label: 'Handheld Preview' },
  ]

  // Test connectivity on mount
  useEffect(() => {
    apiFetch(`/api/pos360/menu/venues/${VENUE_ID}/menus`).then(r => setLocalPreview(!!r.localPreview))
  }, [])

  return (
    <div style={S.wrap}>
      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <div style={S.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, color: GOLD }}>♛</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, lineHeight: 1 }}>POS360</div>
            <div style={{ fontSize: 10, color: DARK_MUTE, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>NOVEE OS · Venue Menu Builder</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SyncStatus localPreview={localPreview} />
          <button onClick={() => navigate('/pos3')} style={S.iconBtn}>←</button>
        </div>
      </div>

      {localPreview && (
        <div style={{ background: 'rgba(230,81,0,0.12)', borderBottom: '1px solid rgba(230,81,0,0.3)', color: '#ff8f00', padding: '6px 20px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
          Local Preview Mode — Menu data is not persisted. DATABASE_URL not configured.
        </div>
      )}

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ ...S.tab, ...(activeTab === t.id ? S.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {activeTab === 'builder' && (
        <div style={S.builderBody}>
          <MenuListPanel
            venueId={VENUE_ID}
            selectedMenuId={selectedMenu?.menu_id}
            onSelect={m => { setSelectedMenu(m); setSelectedCat(null); setSelectedItem(null) }}
            onMenuCreated={m => setSelectedMenu(m)}
          />
          <CategoryManager
            venueId={VENUE_ID}
            menuId={selectedMenu?.menu_id}
            selectedCatId={selectedCat?.category_id}
            onSelect={c => { setSelectedCat(c); setSelectedItem(null) }}
          />
          <ItemManager
            venueId={VENUE_ID}
            menuId={selectedMenu?.menu_id}
            categoryId={selectedCat?.category_id}
            onItemSelect={item => setSelectedItem(item)}
          />
          {selectedItem ? (
            <ItemDetailDrawer item={selectedItem} venueId={VENUE_ID} onClose={() => setSelectedItem(null)} />
          ) : (
            <div style={S.rightEmpty}>
              <img src="/smokecraft-pos360.png" alt="POS360 SmokeCraft reference" style={{ width: '100%', borderRadius: 12, border: `1px solid ${DARK_LINE}`, objectFit: 'cover', maxHeight: 340, objectPosition: 'top' }} />
              <div style={{ color: DARK_MUTE, fontSize: 12, textAlign: 'center', paddingTop: 10 }}>Select a menu → category → item to view details.</div>
              {!selectedMenu && <div style={{ color: DARK_MUTE, fontSize: 11, textAlign: 'center' }}>Create a new menu to get started.</div>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pricing' && (
        <PricingRulesPanel venueId={VENUE_ID} />
      )}

      {activeTab === 'routing' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <RoutingStationManager venueId={VENUE_ID} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DARK_MUTE, fontSize: 13, fontStyle: 'italic', padding: 40, textAlign: 'center' }}>
            Select an item from Menu Builder to assign routing stations. Kitchen, Bar, Humidor, Coffee Station, Retail — configure any prep station for your venue type.
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', justifyContent: 'center', alignItems: 'flex-start', padding: 24 }}>
          <div style={{ width: 320 }}>
            <HandheldPreview venueId={VENUE_ID} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pricing Rules Panel ───────────────────────────────────────────────────────
function PricingRulesPanel({ venueId }) {
  const [rules, setRules]   = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm]     = useState({ ruleName: '', ruleType: 'happy_hour', priceValue: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch(`/api/pos360/menu/venues/${venueId}/pricing-rules`).then(r => setRules(r.rules || []))
  }, [venueId])

  const RULE_TYPES = ['base_price','happy_hour','time_based','date_based','location_based','vip','member','loyalty','promotional','override','bundle','combo']

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)
    const r = await apiFetch(`/api/pos360/menu/venues/${venueId}/pricing-rules`, {
      method: 'POST',
      body: JSON.stringify({ ...form, priceValue: parseFloat(form.priceValue) || null }),
    })
    setLoading(false)
    if (r.ok) { setCreating(false); setForm({ ruleName: '', ruleType: 'happy_hour', priceValue: '' }); setRules(rs => [...rs, r.pricingRule]) }
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ ...S.panelHeader, margin: '0 14px' }}>
        <span style={S.panelHeaderTitle}>PRICING RULES</span>
        <button onClick={() => setCreating(c => !c)} style={S.miniBtn}>{creating ? '✕' : '+ Rule'}</button>
      </div>
      {creating && (
        <form onSubmit={handleCreate} style={{ padding: '0 14px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={form.ruleName} onChange={e => setForm(f => ({ ...f, ruleName: e.target.value }))} placeholder="Rule name" required style={{ ...S.input, flex: '1 1 180px' }} />
          <select value={form.ruleType} onChange={e => setForm(f => ({ ...f, ruleType: e.target.value }))} style={{ ...S.input, flex: '1 1 140px' }}>
            {RULE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <input value={form.priceValue} onChange={e => setForm(f => ({ ...f, priceValue: e.target.value }))} placeholder="Price ($)" type="number" step="0.01" style={{ ...S.input, width: 90 }} />
          <button type="submit" disabled={loading} style={S.miniBtn}>{loading ? '…' : 'Add Rule'}</button>
        </form>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px' }}>
        {rules.length === 0 ? (
          <div style={{ color: DARK_MUTE, fontSize: 12, fontStyle: 'italic', paddingTop: 16 }}>
            No pricing rules configured. Add Happy Hour, VIP pricing, Member discounts, Time-based rules, and more.
          </div>
        ) : rules.map(r => (
          <div key={r.rule_id} style={{ ...S.itemRow, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: DARK_TEXT }}>{r.rule_name}</div>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: GOLD, marginTop: 2 }}>{r.rule_type}</div>
            </div>
            {r.price_value !== null && <span style={{ fontSize: 13, color: GOLD }}>${Number(r.price_value).toFixed(2)}</span>}
            {r.price_percent !== null && r.price_value === null && <span style={{ fontSize: 13, color: GOLD }}>{(Number(r.price_percent) * 100).toFixed(0)}% off</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  wrap:         { minHeight: '100vh', background: DARK_BG, color: DARK_TEXT, fontFamily: '"Georgia", serif', display: 'flex', flexDirection: 'column' },
  nav:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(10,8,4,0.96)', borderBottom: `1px solid ${DARK_LINE}` },
  iconBtn:      { background: 'none', border: `1px solid ${DARK_LINE}`, color: DARK_MUTE, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 },
  tabBar:       { display: 'flex', borderBottom: `1px solid ${DARK_LINE}`, background: 'rgba(10,8,4,0.7)' },
  tab:          { background: 'none', border: 'none', borderBottom: '2px solid transparent', color: DARK_MUTE, padding: '10px 18px', cursor: 'pointer', fontSize: 12, fontFamily: '"JetBrains Mono", monospace' },
  tabActive:    { color: GOLD, borderBottomColor: GOLD },
  builderBody:  { flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 },

  // Left / Category panels
  leftPanel:    { width: 200, background: DARK_CARD, borderRight: `1px solid ${DARK_LINE}`, display: 'flex', flexDirection: 'column', flexShrink: 0 },
  categoryPanel:{ width: 200, background: DARK_CARD, borderRight: `1px solid ${DARK_LINE}`, display: 'flex', flexDirection: 'column', flexShrink: 0 },
  stationPanel: { width: 260, background: DARK_CARD, borderRight: `1px solid ${DARK_LINE}`, display: 'flex', flexDirection: 'column', flexShrink: 0 },
  panelHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px 8px', borderBottom: `1px solid ${DARK_LINE}` },
  panelHeaderTitle: { fontSize: 10, color: GOLD, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' },
  listItem:     { padding: '9px 12px', cursor: 'pointer', fontSize: 13, color: DARK_MUTE, display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${DARK_LINE}22` },
  listItemActive:{ color: GOLD, background: GOLD_DIM },
  miniBtn:      { background: 'none', border: `1px solid ${DARK_LINE}`, color: GOLD, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' },
  input:        { background: 'rgba(20,15,8,0.95)', border: `1px solid ${DARK_LINE}`, color: DARK_TEXT, borderRadius: 6, padding: '6px 8px', fontSize: 12, outline: 'none' },

  // Item area
  itemArea:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  itemRow:      { display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(201,149,44,0.04)', border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer' },
  microBtn:     { border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: DARK_TEXT },

  // Drawer
  drawer:       { width: 280, flexShrink: 0, borderLeft: `1px solid ${DARK_LINE}`, background: DARK_CARD, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 14px', borderBottom: `1px solid ${DARK_LINE}` },
  drawerSection:{ padding: '10px 14px', borderBottom: `1px solid ${DARK_LINE}` },
  drawerSectionTitle: { fontSize: 9, color: GOLD, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 },
  infoGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 },
  infoCell:     { background: GOLD_DIM, padding: '6px 8px', borderRadius: 4 },
  infoCellLabel:{ fontSize: 9, color: DARK_MUTE, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', marginBottom: 2 },
  infoCellVal:  { fontSize: 12, color: DARK_TEXT },

  // Right empty panel
  rightEmpty:   { width: 240, flexShrink: 0, borderLeft: `1px solid ${DARK_LINE}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 },

  // Handheld preview
  previewPane:  { background: 'rgba(15,12,7,0.96)', border: `1px solid ${DARK_LINE}`, borderRadius: 14, padding: 16, width: '100%' },
  catPill:      { background: 'none', border: `1px solid ${DARK_LINE}`, color: DARK_MUTE, borderRadius: 14, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' },
  catPillActive:{ background: GOLD_DIM, color: GOLD, borderColor: GOLD },
  previewItem:  { display: 'flex', justifyContent: 'space-between', background: 'rgba(201,149,44,0.04)', border: `1px solid ${DARK_LINE}`, borderRadius: 6, padding: '7px 10px' },
}
