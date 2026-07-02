/**
 * SmokeCraftMenu — guest-facing venue menu.
 * Loads live inventory from /api/venues/:venueId/menu; falls back to local sample data.
 * Displays all categories with add-to-cart controls.
 * Does NOT modify SmokeCraftAssetScreen, SmokeCraftHotspotLayer, SmokeCraftAssetRoute.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'

const CATEGORIES = [
  { key: 'house_cigar',         label: 'House Cigars',          emoji: '🏠' },
  { key: 'featured_cigar',      label: 'Featured Cigars',       emoji: '⭐' },
  { key: 'humidor_match',       label: 'Humidor Match',         emoji: '🎯' },
  { key: 'liquor',              label: 'Liquor',                emoji: '🥃' },
  { key: 'cocktail',            label: 'Cocktails',             emoji: '🍸' },
  { key: 'wine',                label: 'Wine',                  emoji: '🍷' },
  { key: 'beer',                label: 'Beer',                  emoji: '🍺' },
  { key: 'food',                label: 'Food',                  emoji: '🍽️' },
  { key: 'dinner',              label: 'Dinner',                emoji: '🥩' },
  { key: 'dessert',             label: 'Dessert',               emoji: '🍫' },
  { key: 'pairing_bundle',      label: 'Pairing Bundles',       emoji: '🤝' },
  { key: 'full_pairing_bundle', label: 'Full Experience',       emoji: '✨' },
]

const AGE_RESTRICTED = new Set(['house_cigar','featured_cigar','humidor_match','cigar','liquor','cocktail','wine','beer','pairing_bundle','full_pairing_bundle'])

export default function SmokeCraftMenu() {
  const navigate = useNavigate()
  const { menuItems, menuLoading, menuLocalPreview, menuNotice, loadMenu, addToCart, cartItemCount, getResumeRoute } = useSmokeCraftOrder()
  const [activeCategory, setActiveCategory] = useState(null)
  const [addingId, setAddingId] = useState(null)
  const [addedId, setAddedId] = useState(null)

  useEffect(() => { loadMenu(activeCategory) }, [activeCategory, loadMenu])

  const displayItems = menuItems.filter(i => !activeCategory || i.item_category === activeCategory)

  async function handleAdd(item) {
    if (!item.available || item.stock_quantity === 0) return
    setAddingId(item.item_id)
    await addToCart(item, 1)
    setAddingId(null)
    setAddedId(item.item_id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(getResumeRoute())} style={styles.backBtn}>← Back to SmokeCraft</button>
        <h1 style={styles.title}>SmokeCraft Menu</h1>
        <button onClick={() => navigate('/smokecraft/cart')} style={styles.cartBtn}>
          Cart {cartItemCount > 0 ? `(${cartItemCount})` : ''}
        </button>
      </div>

      {/* Local preview notice */}
      {menuLocalPreview && (
        <div style={styles.notice}>
          {menuNotice || 'Local Preview Mode: venue menu and bar inventory are sample data only.'}
        </div>
      )}

      {/* Category tabs */}
      <div style={styles.tabs}>
        <button onClick={() => setActiveCategory(null)} style={{ ...styles.tab, ...(activeCategory === null ? styles.tabActive : {}) }}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setActiveCategory(c.key)}
            style={{ ...styles.tab, ...(activeCategory === c.key ? styles.tabActive : {}) }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {menuLoading ? (
        <div style={styles.loading}>Loading menu…</div>
      ) : displayItems.length === 0 ? (
        <div style={styles.empty}>No items in this category.</div>
      ) : (
        <div style={styles.grid}>
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
    </div>
  )
}

function MenuItemCard({ item, onAdd, isAdding, justAdded }) {
  const outOfStock = !item.available || item.stock_quantity === 0
  const lowStock = item.available && item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold

  return (
    <div style={styles.card}>
      {/* Badges */}
      <div style={styles.badges}>
        {item.is_house_item && <span style={styles.badgeHouse}>House</span>}
        {item.is_featured && <span style={styles.badgeFeatured}>Featured</span>}
        {item.is_recommended_pairing && <span style={styles.badgePairing}>Recommended Pairing</span>}
        {item.age_restricted && <span style={styles.badgeAge}>21+</span>}
      </div>

      {/* Name and price */}
      <div style={styles.cardName}>{item.item_name}</div>
      <div style={styles.cardCategory}>{item.item_category.replace(/_/g, ' ')}</div>
      {item.description && <div style={styles.cardDesc}>{item.description}</div>}
      <div style={styles.cardPrice}>${Number(item.price).toFixed(2)}</div>

      {/* Flavor notes */}
      {item.cigar_flavor_notes?.length > 0 && (
        <div style={styles.tags}>{item.cigar_flavor_notes.map(n => <span key={n} style={styles.tag}>{n}</span>)}</div>
      )}
      {item.flavor_profile?.length > 0 && (
        <div style={styles.tags}>{item.flavor_profile.map(n => <span key={n} style={styles.tag}>{n}</span>)}</div>
      )}

      {/* Stock status */}
      {outOfStock ? (
        <div style={styles.outOfStock}>Out of Stock</div>
      ) : lowStock ? (
        <div style={styles.lowStock}>Low Stock ({item.stock_quantity} left)</div>
      ) : null}

      {/* Add to cart */}
      <button
        onClick={() => onAdd(item)}
        disabled={outOfStock || isAdding}
        style={{ ...styles.addBtn, ...(outOfStock ? styles.addBtnDisabled : {}), ...(justAdded ? styles.addBtnAdded : {}) }}
      >
        {justAdded ? '✓ Added!' : isAdding ? 'Adding…' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#0f0f0f', color: '#f0e6d3', fontFamily: '"Georgia", serif', paddingBottom: 60 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#1a1208', borderBottom: '1px solid #3d2b10' },
  backBtn: { background: 'none', border: '1px solid #8b6914', color: '#d4a843', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  title: { fontSize: 20, fontWeight: 700, color: '#d4a843', margin: 0 },
  cartBtn: { background: '#8b1a1a', border: 'none', color: '#f0e6d3', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  notice: { background: '#2a1f04', border: '1px solid #8b6914', color: '#d4a843', padding: '10px 20px', fontSize: 12, textAlign: 'center' },
  tabs: { display: 'flex', overflowX: 'auto', gap: 8, padding: '12px 16px', background: '#161008', borderBottom: '1px solid #2a1a06' },
  tab: { background: 'none', border: '1px solid #3d2b10', color: '#a08040', padding: '6px 12px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12 },
  tabActive: { background: '#8b6914', color: '#f0e6d3', borderColor: '#8b6914' },
  loading: { textAlign: 'center', padding: 60, color: '#8b6914' },
  empty: { textAlign: 'center', padding: 60, color: '#5a4020' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, padding: 20 },
  card: { background: '#1a1208', border: '1px solid #3d2b10', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 },
  badges: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  badgeHouse: { background: '#1a3a1a', color: '#5cb85c', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 },
  badgeFeatured: { background: '#3a2a00', color: '#d4a843', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 },
  badgePairing: { background: '#1a1a3a', color: '#7090d0', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 },
  badgeAge: { background: '#3a1a1a', color: '#d04040', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 },
  cardName: { fontSize: 16, fontWeight: 700, color: '#f0e6d3' },
  cardCategory: { fontSize: 11, color: '#8b6914', textTransform: 'uppercase', letterSpacing: 1 },
  cardDesc: { fontSize: 13, color: '#a09070', lineHeight: 1.5, marginTop: 2 },
  cardPrice: { fontSize: 20, fontWeight: 700, color: '#d4a843', marginTop: 4 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  tag: { background: '#2a2010', color: '#8b8060', padding: '2px 8px', borderRadius: 10, fontSize: 11 },
  outOfStock: { color: '#d04040', fontSize: 12, fontWeight: 600 },
  lowStock: { color: '#d08040', fontSize: 12, fontWeight: 600 },
  addBtn: { marginTop: 'auto', padding: '10px 16px', background: '#8b6914', border: 'none', color: '#f0e6d3', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'background 0.2s' },
  addBtnDisabled: { background: '#3d3020', color: '#5a4a30', cursor: 'not-allowed' },
  addBtnAdded: { background: '#1a4a1a', color: '#5cb85c' },
}
