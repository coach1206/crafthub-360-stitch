#!/usr/bin/env node
/**
 * Venue Humidor 1A — development-only seed data. NEVER runs in
 * production (hard guard below, matching seedPrototypeUsers.js's
 * established pattern). Creates 2 venues, 8 cigars each (including a
 * low-stock item, a sold-out item, a featured item, and a limited
 * release), and distinct manager/staff accounts per venue with real
 * venue_memberships rows.
 */
import 'dotenv/config'
import { getDb } from '../connection.js'

if (process.env.NODE_ENV === 'production') {
  console.log('[seed] Skipping Venue Humidor prototype seed in production.')
  process.exit(0)
}

const db = getDb()

const VENUES = [
  { venue_id: 'vh-seed-venue-alpha', name: 'Alpha Lounge (Seed)' },
  { venue_id: 'vh-seed-venue-bravo', name: 'Bravo Lounge (Seed)' },
]

function cigarSet(prefix) {
  return [
    { sku: `${prefix}-001`, name: `${prefix} Robusto`, brand: 'Seed Leaf Co', vitola: 'robusto', wrapper: 'habano', strength: 'medium', price_cents: 1200, qty: 40 },
    { sku: `${prefix}-002`, name: `${prefix} Toro`, brand: 'Seed Leaf Co', vitola: 'toro', wrapper: 'maduro', strength: 'full', price_cents: 1400, qty: 30 },
    { sku: `${prefix}-003`, name: `${prefix} Churchill`, brand: 'Seed Leaf Co', vitola: 'churchill', wrapper: 'connecticut', strength: 'mild', price_cents: 1600, qty: 25 },
    { sku: `${prefix}-004`, name: `${prefix} Corona`, brand: 'Seed Leaf Co', vitola: 'corona', wrapper: 'habano', strength: 'medium_full', price_cents: 1000, qty: 50 },
    { sku: `${prefix}-005`, name: `${prefix} Low Stock`, brand: 'Seed Leaf Co', vitola: 'robusto', wrapper: 'maduro', strength: 'full', price_cents: 1300, qty: 3, reorderThreshold: 5 },
    { sku: `${prefix}-006`, name: `${prefix} Sold Out`, brand: 'Seed Leaf Co', vitola: 'toro', wrapper: 'habano', strength: 'medium', price_cents: 1500, qty: 0, status: 'sold_out' },
    { sku: `${prefix}-007`, name: `${prefix} Featured Reserve`, brand: 'Seed Leaf Co', vitola: 'toro', wrapper: 'oscuro', strength: 'full', price_cents: 2200, qty: 20, isFeatured: true },
    { sku: `${prefix}-008`, name: `${prefix} Limited Release`, brand: 'Seed Leaf Co', vitola: 'gordo', wrapper: 'maduro', strength: 'full', price_cents: 3500, qty: 10, isLimitedRelease: true },
  ]
}

async function main() {
  console.log('[seed] Seeding Venue Humidor prototype data (development only)...')

  for (const [i, v] of VENUES.entries()) {
    await db.query(
      `INSERT INTO venues (venue_id, name, venue_type, status) VALUES ($1,$2,'cigar_lounge','active')
       ON CONFLICT (venue_id) DO NOTHING`,
      [v.venue_id, v.name]
    )

    const managerId = `vh-seed-manager-${i + 1}`
    const staffId = `vh-seed-staff-${i + 1}`
    for (const [userId, role, displayName] of [[managerId, 'manager', `${v.name} Manager`], [staffId, 'staff', `${v.name} Staff`]]) {
      await db.query(
        `INSERT INTO system_users (user_id, display_name, role, status) VALUES ($1,$2,$3,'active')
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, displayName, role]
      )
      await db.query(
        `INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ($1,$2,$3,'active')
         ON CONFLICT DO NOTHING`,
        [userId, v.venue_id, role]
      )
    }

    const prefix = v.venue_id === VENUES[0].venue_id ? 'ALPHA' : 'BRAVO'
    for (const c of cigarSet(prefix)) {
      await db.query(
        `INSERT INTO venue_cigar_products (
           venue_id, sku, name, brand, vitola, wrapper, strength, price_cents,
           physical_quantity, reorder_threshold, status, is_featured, is_limited_release, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (venue_id, sku) DO NOTHING`,
        [
          v.venue_id, c.sku, c.name, c.brand, c.vitola, c.wrapper, c.strength, c.price_cents,
          c.qty, c.reorderThreshold ?? 5, c.status ?? 'active', !!c.isFeatured, !!c.isLimitedRelease, managerId,
        ]
      )
    }
    console.log(`[seed] Venue Humidor: ${v.name} — 8 cigars, manager ${managerId}, staff ${staffId}`)
  }

  console.log('[seed] Venue Humidor prototype data seeded (idempotent, safe to re-run).')
  process.exit(0)
}

main().catch(err => { console.error('[seed] Venue Humidor seed failed:', err); process.exit(1) })
