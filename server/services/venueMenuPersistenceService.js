/**
 * venueMenuPersistenceService — dual-mode venue menu management.
 *
 * Tries PostgreSQL first. Falls back to in-memory seed data from
 * menuCatalog if DB unavailable (dev/offline mode).
 *
 * storageMode field in every response: 'postgres' | 'memory_fallback'
 */

import { isDbAvailable, query } from '../db/connection.js'

const TAX_RATE = 0.085

// ── In-memory fallback ────────────────────────────────────────
// Seeded on first call; keys are item_id strings.
const memMenu = new Map()
let memSeeded = false

function seedMemoryFromCatalog(venueId) {
  if (memSeeded) return
  memSeeded = true
  // Build a minimal POS3-compatible menu from the canonical catalog shape.
  // This is intentionally static; real data lives in the DB.
  const SEED = [
    { item_id:'vm-cig-1', sku:'SKU-CIG-PAD64MAD', item_name:'Padrón 1964 Anniversary Maduro', display_category:'Cigars', destination_station:'humidor', price:32, age_restricted:true, available:true, prep_time_minutes:2, modifier_schema:[{id:'mod_torpedo',label:'Torpedo',price_delta:0},{id:'mod_robusto',label:'Robusto',price_delta:-3}] },
    { item_id:'vm-cig-2', sku:'SKU-CIG-OPUSXROB', item_name:'Arturo Fuente OpusX Robusto', display_category:'Cigars', destination_station:'humidor', price:45, age_restricted:true, available:true, prep_time_minutes:2, modifier_schema:[] },
    { item_id:'vm-cig-3', sku:'SKU-CIG-CHRRES', item_name:'Hand-Rolled Churchill Reserve', display_category:'Cigars', destination_station:'humidor', price:24, age_restricted:true, available:true, prep_time_minutes:3, modifier_schema:[{id:'mod_natural',label:'Natural Wrapper',price_delta:0},{id:'mod_maduro',label:'Maduro Wrapper',price_delta:2}] },
    { item_id:'vm-cig-4', sku:'SKU-CIG-COHIBA', item_name:'Cohiba Siglo VI', display_category:'Cigars', destination_station:'humidor', price:55, age_restricted:true, available:true, prep_time_minutes:2, modifier_schema:[] },
    { item_id:'vm-bar-1', sku:'SKU-BAR-BOUR18', item_name:'Eagle Rare 18yr Neat', display_category:'Bar', destination_station:'bar', price:28, age_restricted:true, available:true, prep_time_minutes:2, modifier_schema:[{id:'mod_rocks',label:'On the Rocks',price_delta:0},{id:'mod_splash',label:'Splash of Water',price_delta:0}] },
    { item_id:'vm-bar-2', sku:'SKU-BAR-SCOTCH25', item_name:'Macallan 25yr Single Malt', display_category:'Bar', destination_station:'bar', price:85, age_restricted:true, available:true, prep_time_minutes:2, modifier_schema:[] },
    { item_id:'vm-bar-3', sku:'SKU-BAR-CIGSOUR', item_name:'Cigar Lounge Sour', display_category:'Bar', destination_station:'bar', price:18, age_restricted:true, available:true, prep_time_minutes:5, modifier_schema:[{id:'mod_extra_sour',label:'Extra Sour',price_delta:0}] },
    { item_id:'vm-bar-4', sku:'SKU-BAR-SMOKSNEG', item_name:'Smoke & Serenade Negroni', display_category:'Bar', destination_station:'bar', price:22, age_restricted:true, available:true, prep_time_minutes:5, modifier_schema:[] },
    { item_id:'vm-na-1', sku:'SKU-NAD-SPARKLING', item_name:'San Pellegrino Sparkling', display_category:'Non-Alcohol Drinks', destination_station:'bar', price:8, age_restricted:false, available:true, prep_time_minutes:1, modifier_schema:[] },
    { item_id:'vm-na-2', sku:'SKU-NAD-ESPRESSO', item_name:'Double Espresso', display_category:'Non-Alcohol Drinks', destination_station:'bar', price:6, age_restricted:false, available:true, prep_time_minutes:3, modifier_schema:[] },
    { item_id:'vm-food-1', sku:'SKU-FOOD-CHARCUTERIE', item_name:'Artisan Charcuterie Board', display_category:'Food', destination_station:'kitchen', price:36, age_restricted:false, available:true, prep_time_minutes:12, modifier_schema:[] },
    { item_id:'vm-food-2', sku:'SKU-FOOD-CAESAR', item_name:'House Caesar Salad', display_category:'Food', destination_station:'kitchen', price:18, age_restricted:false, available:true, prep_time_minutes:8, modifier_schema:[{id:'mod_noanch',label:'No Anchovies',price_delta:0},{id:'mod_gf',label:'Gluten-Free Croutons',price_delta:2}] },
    { item_id:'vm-food-3', sku:'SKU-FOOD-KOBE', item_name:'Kobe Beef Slider Trio', display_category:'Food', destination_station:'kitchen', price:42, age_restricted:false, available:true, prep_time_minutes:15, modifier_schema:[] },
    { item_id:'vm-svc-1', sku:'SKU-SVC-CUTLIGHT', item_name:'Cigar Cut & Light Service', display_category:'Lounge Services', destination_station:'staff', price:10, age_restricted:false, available:true, prep_time_minutes:3, modifier_schema:[] },
    { item_id:'vm-svc-2', sku:'SKU-SVC-TOBACCOCLEAN', item_name:'Tobacco Palate Cleanser Set', display_category:'Lounge Services', destination_station:'staff', price:15, age_restricted:false, available:true, prep_time_minutes:2, modifier_schema:[] },
    { item_id:'vm-ret-1', sku:'SKU-RET-CUTTER', item_name:'Xikar Xi3 Cutter (Gold)', display_category:'Retail', destination_station:'retail', price:95, age_restricted:false, available:true, prep_time_minutes:1, modifier_schema:[] },
    { item_id:'vm-ret-2', sku:'SKU-RET-LIGHTER', item_name:'S.T. Dupont Ligne 2 Lighter', display_category:'Retail', destination_station:'retail', price:385, age_restricted:false, available:true, prep_time_minutes:1, modifier_schema:[] },
  ].map(i => ({ ...i, venue_id: venueId, is_active: true, taxable: true, description: null }))

  SEED.forEach(item => memMenu.set(item.item_id, item))
}

// ── Helpers ───────────────────────────────────────────────────
function normalizeDbRow(row) {
  return {
    item_id:                row.item_id,
    venue_id:               row.venue_id,
    pos_item_id:            row.pos_item_id || row.sku,
    sku:                    row.sku,
    item_name:              row.item_name,
    item_category:          row.item_category || row.display_category,
    sub_category:           row.sub_category || null,
    display_category:       row.display_category || row.item_category,
    description:            row.description,
    price:                  parseFloat(row.price) || 0,
    destination_station:    row.destination_station || 'staff',
    prep_time_minutes:      row.prep_time_minutes || 5,
    modifier_schema:        row.modifier_schema || [],
    age_restricted:         row.age_restricted || false,
    available:              row.available !== false && row.is_active !== false,
    is_active:              row.is_active !== false,
    taxable:                row.taxable !== false,
    stock_quantity:         row.stock_quantity ?? 99,
    low_stock_threshold:    row.low_stock_threshold ?? 3,
    is_house_item:          row.is_house_item || false,
    is_featured:            row.is_featured || false,
    is_recommended_pairing: row.is_recommended_pairing || false,
    is_special:             row.is_special || false,
    special_label:          row.special_label || null,
    pairing_tags:           row.pairing_tags || [],
    pairing_type:           row.pairing_type || null,
    loyalty_action_type:    row.loyalty_action_type || null,
    image_url:              row.image_url || null,
    promo_image_url:        row.promo_image_url || null,
    gallery_images:         row.gallery_images || [],
  }
}

// ── Public API ────────────────────────────────────────────────

export async function getVenueMenuItems(venueId, { category, search } = {}) {
  if (isDbAvailable()) {
    try {
      const conditions = ['venue_id = $1', '(is_active = true OR is_active IS NULL)', 'available = true']
      const params = [venueId]
      let i = 2

      if (category) { conditions.push(`display_category ILIKE $${i++}`); params.push(category) }
      if (search)   { conditions.push(`item_name ILIKE $${i++}`); params.push(`%${search}%`) }

      const { rows } = await query(
        `SELECT * FROM venue_menu_items WHERE ${conditions.join(' AND ')} ORDER BY sort_order, item_name`,
        params
      )

      let items = rows.map(normalizeDbRow)

      // If DB returned nothing, seed from catalog and return memory data
      if (items.length === 0) {
        await seedDatabaseFromCatalog(venueId)
        const seeded = await query(
          `SELECT * FROM venue_menu_items WHERE venue_id = $1 AND available = true ORDER BY sort_order, item_name`,
          [venueId]
        )
        items = seeded.rows.map(normalizeDbRow)
        return { ok: true, items, storageMode: 'postgres', seededDevData: true }
      }

      return { ok: true, items, storageMode: 'postgres', seededDevData: false }
    } catch (err) {
      console.error('[venueMenuPersistence] DB error, falling back:', err.message)
    }
  }

  // Memory fallback
  seedMemoryFromCatalog(venueId)
  let items = [...memMenu.values()].filter(i => i.venue_id === venueId)
  if (category) items = items.filter(i => i.display_category?.toLowerCase() === category.toLowerCase())
  if (search)   items = items.filter(i => i.item_name?.toLowerCase().includes(search.toLowerCase()))

  return { ok: true, items, storageMode: 'memory_fallback', seededDevData: true, localPreview: true }
}

export async function getMenuItem(itemId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(`SELECT * FROM venue_menu_items WHERE item_id = $1`, [itemId])
      if (rows[0]) return { ok: true, item: normalizeDbRow(rows[0]), storageMode: 'postgres' }
    } catch {}
  }
  const mem = memMenu.get(itemId)
  return mem
    ? { ok: true, item: mem, storageMode: 'memory_fallback', localPreview: true }
    : { ok: false, error: 'Item not found' }
}

export async function createMenuItem(venueId, data) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO venue_menu_items
           (venue_id, sku, item_name, display_category, item_category, description, price,
            destination_station, prep_time_minutes, modifier_schema, age_restricted,
            available, taxable, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          venueId,
          data.sku || null,
          data.item_name,
          data.display_category || data.category,
          mapDisplayToSchema(data.display_category || data.category),
          data.description || null,
          data.price || 0,
          data.destination_station || 'staff',
          data.prep_time_minutes || 5,
          JSON.stringify(data.modifier_schema || []),
          data.age_restricted || false,
          data.available !== false,
          data.taxable !== false,
          true,
        ]
      )
      return { ok: true, item: normalizeDbRow(rows[0]), storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }
  return { ok: false, error: 'Database not available', localPreview: true }
}

export async function updateMenuItem(itemId, data) {
  if (isDbAvailable()) {
    try {
      const setClauses = []
      const params = []
      let i = 1
      const fields = ['item_name','description','price','destination_station','prep_time_minutes',
                      'modifier_schema','age_restricted','available','taxable','is_active','display_category']
      for (const f of fields) {
        if (data[f] !== undefined) {
          setClauses.push(`${f} = $${i++}`)
          params.push(f === 'modifier_schema' ? JSON.stringify(data[f]) : data[f])
        }
      }
      if (setClauses.length === 0) return { ok: false, error: 'No fields to update' }
      setClauses.push(`updated_at = NOW()`)
      params.push(itemId)
      const { rows } = await query(
        `UPDATE venue_menu_items SET ${setClauses.join(', ')} WHERE item_id = $${i} RETURNING *`,
        params
      )
      if (!rows[0]) return { ok: false, error: 'Item not found' }
      return { ok: true, item: normalizeDbRow(rows[0]), storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }
  return { ok: false, error: 'Database not available', localPreview: true }
}

// ── Seed DB from static catalog (dev-only) ────────────────────
async function seedDatabaseFromCatalog(venueId) {
  // Seed minimal items from the in-memory catalog so the DB has something to return
  seedMemoryFromCatalog(venueId)
  const items = [...memMenu.values()].filter(i => i.venue_id === venueId)

  for (const item of items) {
    try {
      await query(
        `INSERT INTO venue_menu_items
           (item_id, venue_id, sku, item_name, display_category, item_category, description,
            price, destination_station, prep_time_minutes, modifier_schema, age_restricted,
            available, taxable, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (item_id) DO NOTHING`,
        [
          item.item_id, item.venue_id, item.sku, item.item_name,
          item.display_category,
          mapDisplayToSchema(item.display_category),
          item.description,
          item.price,
          item.destination_station,
          item.prep_time_minutes,
          JSON.stringify(item.modifier_schema),
          item.age_restricted,
          item.available,
          item.taxable,
          item.is_active,
        ]
      )
    } catch { /* ignore individual seed failures */ }
  }
}

function mapDisplayToSchema(displayCat) {
  const map = {
    'Cigars': 'cigar',
    'Bar': 'liquor',
    'Non-Alcohol Drinks': 'drink',
    'Food': 'food',
    'Lounge Services': 'food',
    'Retail': 'food',
  }
  return map[displayCat] || 'food'
}
