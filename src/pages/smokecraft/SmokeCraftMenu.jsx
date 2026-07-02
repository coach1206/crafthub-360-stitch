/**
 * SmokeCraftMenu — guest-facing venue menu with approved visual shell.
 *
 * Visual shell: /smokecraft-explore-venue-menu-2.png (fixed background)
 * Menu data: dynamic from venue menu/inventory service (backend → local-preview fallback)
 * Category priority: Humidor → Liquor → Food → Pairings → Specials
 * Default category: Humidor/Cigars
 *
 * Does NOT modify SmokeCraftAssetScreen, SmokeCraftHotspotLayer, SmokeCraftAssetRoute.
 * Does NOT hardcode permanent menu items — all item data comes from venue services.
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'

const GOLD = '#E9C176'
const DARK = 'rgba(5,2,1,0.97)'

// ── Category groups ───────────────────────────────────────────
// Categories are ordered: Humidor first, Liquor second, Food third, Pairings, Specials
const CIGAR_CATS   = new Set(['house_cigar','featured_cigar','humidor_match','cigar'])
const BAR_CATS     = new Set(['liquor','cocktail','wine','beer'])
const FOOD_CATS    = new Set(['food','dinner','dessert'])
const PAIRING_CATS = new Set(['pairing_bundle','full_pairing_bundle'])

const CHIP_DEFS = [
  { key: 'humidor',        label: 'Humidor',         match: i => CIGAR_CATS.has(i.item_category) },
  { key: 'house_cigars',   label: 'House Cigars',    match: i => i.item_category === 'house_cigar' },
  { key: 'featured_cigars',label: 'Featured Cigars', match: i => i.item_category === 'featured_cigar' },
  { key: 'liquor',         label: 'Liquor',          match: i => i.item_category === 'liquor' },
  { key: 'cocktails',      label: 'Cocktails',       match: i => i.item_category === 'cocktail' },
  { key: 'food',           label: 'Food',            match: i => FOOD_CATS.has(i.item_category) },
  { key: 'pairings',       label: 'Pairings',        match: i => PAIRING_CATS.has(i.item_category) },
  { key: 'specials',       label: 'Specials',        match: i => i.is_featured || i.is_special },
]

// Category sort priority for the "All" view — Humidor first
function sortPriority(item) {
  if (CIGAR_CATS.has(item.item_category))   return 0
  if (BAR_CATS.has(item.item_category))     return 1
  if (FOOD_CATS.has(item.item_category))    return 2
  if (PAIRING_CATS.has(item.item_category)) return 3
  return 4
}

// ── Category fallback images ──────────────────────────────────
const FALLBACK_IMAGES = {
  cigar:   '/assets/smokecraft/cropped/humidor-match-hero.jpg',
  bar:     '/assets/smokecraft/cropped/intake-whiskey-bg.jpg',
  food:    '/assets/smokecraft/cropped/pairing-lab-hero.jpg',
  pairing: '/assets/smokecraft/cropped/pairing-lab-hero.jpg',
  default: '/assets/smokecraft/cropped/humidor-match-hero.jpg',
}

function getFallbackImage(item) {
  if (CIGAR_CATS.has(item.item_category))   return FALLBACK_IMAGES.cigar
  if (BAR_CATS.has(item.item_category))     return FALLBACK_IMAGES.bar
  if (FOOD_CATS.has(item.item_category))    return FALLBACK_IMAGES.food
  if (PAIRING_CATS.has(item.item_category)) return FALLBACK_IMAGES.pairing
  return FALLBACK_IMAGES.default
}

// ── Zone labels for the visual menu zones ─────────────────────
const ZONE_LABELS = {
  humidor: 'Humidor Feature',
  bar:     'Bar Feature',
  food:    'Kitchen Feature',
  pairing: 'Perfect Pairing',
}

export default function SmokeCraftMenu() {
  const navigate = useNavigate()
  const { menuItems, menuLoading, menuLocalPreview, menuNotice, loadMenu, addToCart, cartItemCount, getResumeRoute } = useSmokeCraftOrder()
  const { session } = useGuestSession()

  // Default to humidor (cigars first)
  const [activeChip, setActiveChip] = useState('humidor')
  const [search, setSearch] = useState('')
  const [addingId, setAddingId] = useState(null)
  const [addedId, setAddedId] = useState(null)
  const [staffRequest, setStaffRequest] = useState(null) // null | 'requested' | 'confirmed'
  const searchRef = useRef(null)

  // Load all items once; filter client-side for fast category switching
  useEffect(() => { loadMenu(null) }, [loadMenu])

  // ── Filtering ─────────────────────────────────────────────────
  const chip = CHIP_DEFS.find(c => c.key === activeChip)
  const searchLower = search.trim().toLowerCase()

  const displayItems = [...menuItems]
    .filter(i => !chip || chip.match(i))
    .filter(i => !searchLower || (
      i.item_name?.toLowerCase().includes(searchLower) ||
      i.description?.toLowerCase().includes(searchLower) ||
      i.item_category?.toLowerCase().includes(searchLower) ||
      i.sub_category?.toLowerCase().includes(searchLower) ||
      i.special_label?.toLowerCase().includes(searchLower) ||
      (i.pairing_tags || []).some(t => t.toLowerCase().includes(searchLower))
    ))
    .sort((a, b) => {
      if (!chip) {
        const pa = sortPriority(a), pb = sortPriority(b)
        if (pa !== pb) return pa - pb
      }
      return (a.sort_order ?? 99) - (b.sort_order ?? 99)
    })

  // ── Featured zone items ────────────────────────────────────────
  const featuredHumidor = menuItems.find(i => CIGAR_CATS.has(i.item_category) && i.is_featured) || menuItems.find(i => CIGAR_CATS.has(i.item_category))
  const featuredBar     = menuItems.find(i => BAR_CATS.has(i.item_category) && i.is_featured)   || menuItems.find(i => BAR_CATS.has(i.item_category))
  const featuredFood    = menuItems.find(i => FOOD_CATS.has(i.item_category) && i.is_featured)  || menuItems.find(i => FOOD_CATS.has(i.item_category))
  const featuredPairing = menuItems.find(i => PAIRING_CATS.has(i.item_category) && i.is_recommended_pairing) || menuItems.find(i => PAIRING_CATS.has(i.item_category))

  async function handleAdd(item) {
    if (!item.available || item.stock_quantity === 0) return
    setAddingId(item.item_id)
    await addToCart(item, 1)
    setAddingId(null)
    setAddedId(item.item_id)
    setTimeout(() => setAddedId(null), 1600)
  }

  function handleRequestAssistance() {
    setStaffRequest('requested')
    setTimeout(() => setStaffRequest('confirmed'), 1200)
  }

  return (
    <div className="smokecraft-menu-asset-screen" style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Visual shell — approved image ── */}
      <img
        src="/smokecraft-explore-venue-menu-2.png"
        alt="SmokeCraft Explore Venue Menu"
        className="smokecraft-menu-asset-image"
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'top center',
          zIndex: 0, pointerEvents: 'none',
        }}
      />
      {/* Legibility overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,2,1,0.82)', zIndex: 1, pointerEvents: 'none' }} />

      {/* ── Hotspot layer — all dynamic content ── */}
      <div className="smokecraft-menu-hotspot-layer" style={{ position: 'relative', zIndex: 2, minHeight: '100vh', paddingBottom: 96 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(233,193,118,0.15)', backdropFilter: 'blur(4px)', background: 'rgba(5,2,1,0.6)', position: 'sticky', top: 0, zIndex: 10 }}>
          <button
            type="button"
            onClick={() => navigate(getResumeRoute())}
            style={{ background: 'none', border: '1px solid rgba(233,193,118,0.35)', color: GOLD, padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Georgia,serif' }}
          >
            ← Back
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.5)' }}>SmokeCraft 360 / Legacy Lounge</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: GOLD, letterSpacing: '0.08em' }}>Explore Our Menu</div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/smokecraft/cart')}
            style={{ background: cartItemCount > 0 ? GOLD : 'rgba(233,193,118,0.1)', border: `1px solid ${GOLD}`, color: cartItemCount > 0 ? '#0a0603' : GOLD, padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Georgia,serif' }}
          >
            My Order {cartItemCount > 0 ? `(${cartItemCount})` : ''}
          </button>
        </div>

        {/* Local preview notice */}
        {menuLocalPreview && (
          <div style={{ background: 'rgba(233,193,118,0.08)', border: '1px solid rgba(233,193,118,0.22)', color: 'rgba(233,193,118,0.7)', padding: '8px 16px', fontSize: 11, textAlign: 'center', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em' }}>
            {menuNotice || 'Local Preview Mode: venue menu images and inventory are sample data only.'}
          </div>
        )}

        {/* Search */}
        <div style={{ padding: '12px 16px 4px' }}>
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu — items, flavors, pairings…"
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(233,193,118,0.2)', borderRadius: 8, color: '#E5E2E1', padding: '9px 14px', fontSize: 13, fontFamily: 'Georgia,serif', outline: 'none' }}
          />
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 16px', scrollbarWidth: 'none' }}>
          <ChipBtn active={activeChip === null} onClick={() => setActiveChip(null)}>All</ChipBtn>
          {CHIP_DEFS.map(c => (
            <ChipBtn key={c.key} active={activeChip === c.key} onClick={() => setActiveChip(c.key)}>
              {c.label}
            </ChipBtn>
          ))}
        </div>

        {/* ── Featured zones (shown when not searching and showing all or humidor) ── */}
        {!searchLower && !activeChip && !menuLoading && (
          <FeaturedZones
            zones={[
              { label: ZONE_LABELS.humidor, item: featuredHumidor, onAdd: handleAdd, isAdding: addingId, justAdded: addedId },
              { label: ZONE_LABELS.bar,     item: featuredBar,     onAdd: handleAdd, isAdding: addingId, justAdded: addedId },
              { label: ZONE_LABELS.food,    item: featuredFood,    onAdd: handleAdd, isAdding: addingId, justAdded: addedId },
              { label: ZONE_LABELS.pairing, item: featuredPairing, onAdd: handleAdd, isAdding: addingId, justAdded: addedId },
            ]}
          />
        )}

        {/* ── Dynamic items grid ── */}
        {menuLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(233,193,118,0.5)', fontFamily: 'Georgia,serif', fontSize: 15 }}>
            Loading venue menu…
          </div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(233,193,118,0.35)', fontFamily: 'Georgia,serif' }}>
            {search ? 'No items match your search.' : 'No items in this category.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, padding: '14px 16px' }}>
            {displayItems.map(item => (
              <MenuItemCard
                key={item.item_id}
                item={item}
                onAdd={handleAdd}
                isAdding={addingId === item.item_id}
                justAdded={addedId === item.item_id}
              />
            ))}
          </div>
        )}

        {/* ── Quick action bar ── */}
        <div style={{ margin: '8px 16px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <ActionBtn icon="🥃" label="View Humidor" onClick={() => setActiveChip('humidor')} />
          <ActionBtn icon="🍸" label="View Liquor"  onClick={() => setActiveChip('liquor')} />
          <ActionBtn icon="🍽️" label="View Food"    onClick={() => setActiveChip('food')} />
          <ActionBtn icon="🤝" label="Pairings"     onClick={() => setActiveChip('pairings')} />
        </div>

        {/* ── Staff request / call staff ── */}
        <div style={{ margin: '14px 16px', display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleRequestAssistance}
            style={{ flex: 1, padding: '13px 0', background: staffRequest === 'confirmed' ? 'rgba(125,220,160,0.15)' : 'rgba(233,193,118,0.1)', border: `1px solid ${staffRequest === 'confirmed' ? '#7ddca0' : GOLD}`, borderRadius: 10, color: staffRequest === 'confirmed' ? '#7ddca0' : GOLD, fontFamily: 'Georgia,serif', fontSize: 14, cursor: 'pointer', transition: 'all 0.3s' }}
          >
            {staffRequest === 'confirmed' ? '✓ Staff Notified' : staffRequest === 'requested' ? '…notifying' : '🔔 Request Assistance'}
          </button>
          <button
            type="button"
            onClick={handleRequestAssistance}
            style={{ flex: 1, padding: '13px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(233,193,118,0.2)', borderRadius: 10, color: 'rgba(233,193,118,0.7)', fontFamily: 'Georgia,serif', fontSize: 14, cursor: 'pointer' }}
          >
            📞 Call Staff
          </button>
        </div>
      </div>

      {/* ── Fixed bottom nav ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'rgba(5,2,1,0.96)', borderTop: '1px solid rgba(233,193,118,0.15)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 12px' }}>
        <NavBtn icon="🏠" label="Home"    onClick={() => navigate('/smokecraft')} />
        <NavBtn icon="📋" label="Menu"    onClick={() => setActiveChip(null)} active />
        <NavBtn icon="🛒" label="Order"   onClick={() => navigate('/smokecraft/cart')} />
        <NavBtn icon="🥃" label="Pairings" onClick={() => setActiveChip('pairings')} />
        <NavBtn icon="👤" label="Account" onClick={() => navigate('/passport')} />
      </nav>
    </div>
  )
}

// ── Zone card showing featured item per category ──────────────
function FeaturedZones({ zones }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, padding: '14px 16px 4px' }}>
      {zones.map(({ label, item, onAdd, isAdding, justAdded }) => item ? (
        <div key={label} style={{ background: 'rgba(20,14,6,0.85)', border: '1px solid rgba(233,193,118,0.2)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: 90, overflow: 'hidden', background: '#0f0a04' }}>
            <img
              src={item.image_url || getFallbackImage(item)}
              alt={item.item_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
              onError={e => { e.target.src = getFallbackImage(item) }}
            />
            <div style={{ position: 'absolute', top: 6, left: 6, fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, background: 'rgba(5,2,1,0.75)', padding: '3px 7px', borderRadius: 4 }}>{label}</div>
          </div>
          <div style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#E5E2E1', fontFamily: 'Georgia,serif', marginBottom: 2 }}>{item.item_name}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif' }}>${Number(item.price).toFixed(2)}</div>
          </div>
        </div>
      ) : null)}
    </div>
  )
}

// ── Dynamic menu item card ────────────────────────────────────
function MenuItemCard({ item, onAdd, isAdding, justAdded }) {
  const [imgError, setImgError] = useState(false)
  const imgSrc = (!imgError && item.image_url) ? item.image_url : getFallbackImage(item)
  const outOfStock = !item.available || item.stock_quantity === 0
  const lowStock   = item.available && item.stock_quantity > 0 && item.stock_quantity <= (item.low_stock_threshold ?? 3)

  return (
    <div style={{ background: 'rgba(14,10,6,0.93)', border: '1px solid rgba(233,193,118,0.18)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Item image */}
      <div style={{ position: 'relative', height: 100, background: '#0a0603', overflow: 'hidden' }}>
        <img
          src={imgSrc}
          alt={item.item_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: outOfStock ? 0.4 : 0.8 }}
          onError={() => setImgError(true)}
        />
        {/* Badges */}
        <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {item.age_restricted && <span style={badge('#3a1010','#d04040')}>21+</span>}
          {item.is_house_item   && <span style={badge('#1a3a1a','#7ddca0')}>House</span>}
          {item.is_featured     && <span style={badge('#3a2800',GOLD)}>Featured</span>}
          {item.special_label   && <span style={badge('#1a1a3a','#90a8e0')}>{item.special_label}</span>}
        </div>
        {outOfStock && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <span style={{ color: '#d04040', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif' }}>Out of Stock</span>
          </div>
        )}
        {item.promo_image_url && (
          <img src={item.promo_image_url} alt="promo" style={{ position: 'absolute', bottom: 4, right: 4, width: 36, height: 36, borderRadius: 4, objectFit: 'cover', border: `1px solid ${GOLD}` }} />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '11px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0e6d3', fontFamily: 'Georgia,serif', lineHeight: 1.3 }}>{item.item_name}</div>
        <div style={{ fontSize: 10, color: 'rgba(233,193,118,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"JetBrains Mono",monospace' }}>
          {(item.item_category || item.display_category || '').replace(/_/g, ' ')}
          {item.sub_category ? ` · ${item.sub_category.replace(/_/g, ' ')}` : ''}
        </div>
        {item.description && <div style={{ fontSize: 12, color: 'rgba(229,218,190,0.6)', lineHeight: 1.5, marginTop: 2 }}>{item.description}</div>}

        {/* Flavor/pairing tags */}
        {(item.cigar_flavor_notes?.length > 0 || item.flavor_profile?.length > 0 || item.pairing_tags?.length > 0) && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
            {(item.cigar_flavor_notes || item.flavor_profile || item.pairing_tags || []).slice(0, 3).map(t => (
              <span key={t} style={{ background: 'rgba(233,193,118,0.08)', color: 'rgba(233,193,118,0.55)', padding: '2px 7px', borderRadius: 10, fontSize: 10, fontFamily: '"JetBrains Mono",monospace' }}>{t}</span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif' }}>${Number(item.price).toFixed(2)}</div>
          {lowStock && !outOfStock && <span style={{ fontSize: 10, color: '#d08040', fontFamily: '"JetBrains Mono",monospace' }}>Low Stock ({item.stock_quantity})</span>}
        </div>

        <button
          type="button"
          onClick={() => onAdd(item)}
          disabled={outOfStock || isAdding}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: outOfStock ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
            background: justAdded ? 'rgba(125,220,160,0.2)' : outOfStock ? 'rgba(60,40,20,0.4)' : GOLD,
            color:      justAdded ? '#7ddca0'                : outOfStock ? 'rgba(233,193,118,0.3)' : '#0a0603',
            transition: 'background 0.25s, color 0.25s',
          }}
        >
          {justAdded ? '✓ Added!' : isAdding ? 'Adding…' : outOfStock ? 'Out of Stock' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────

function ChipBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0, padding: '7px 14px', borderRadius: 20, border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.2)'}`,
        background: active ? 'rgba(233,193,118,0.18)' : 'transparent',
        color: active ? GOLD : 'rgba(233,193,118,0.55)',
        fontFamily: 'Georgia,serif', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
        fontWeight: active ? 700 : 400, transition: 'all 0.18s',
      }}
    >{children}</button>
  )
}

function ActionBtn({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ padding: '8px 14px', background: 'rgba(233,193,118,0.07)', border: '1px solid rgba(233,193,118,0.18)', borderRadius: 8, color: 'rgba(233,193,118,0.7)', fontFamily: 'Georgia,serif', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
    >
      <span>{icon}</span> {label}
    </button>
  )
}

function NavBtn({ icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '0 12px', color: active ? GOLD : 'rgba(233,193,118,0.4)', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  )
}

function badge(bg, color) {
  return { background: bg, color, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em' }
}
