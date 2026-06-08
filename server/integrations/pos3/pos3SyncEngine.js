/**
 * POS 3 Sync Engine — Phase 9
 * Orchestrates fetching data from a provider and optionally persisting to DB.
 * In prototype mode, data is fetched from the prototype provider directly.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { getProvider }          from '../../services/pos3IntegrationService.js'

/**
 * Syncs all active orders from the provider to pos3_normalized_orders.
 */
export async function syncActiveOrders(providerKey) {
  const provider = getProvider(providerKey)
  if (!provider) return { success: false, message: `Unknown provider: ${providerKey}` }

  const result = provider.fetchActiveOrders()
  if (!result.success) return result

  if (isDbAvailable()) {
    for (const order of result.orders) {
      try {
        await query(
          `INSERT INTO pos3_normalized_orders
             (provider, provider_order_id, venue_id, location_id, table_number, seat_number,
              staff_id, staff_name, guest_session_id, status, items, subtotal, tax, total,
              currency, opened_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           ON CONFLICT (provider, provider_order_id) DO UPDATE SET
             status      = EXCLUDED.status,
             items       = EXCLUDED.items,
             subtotal    = EXCLUDED.subtotal,
             tax         = EXCLUDED.tax,
             total       = EXCLUDED.total,
             updated_at  = EXCLUDED.updated_at`,
          [
            order.provider, order.providerOrderId, order.venueId, order.locationId,
            order.tableNumber, order.seatNumber, order.staffId, order.staffName,
            order.guestSessionId, order.status, JSON.stringify(order.items),
            order.subtotal, order.tax, order.total, order.currency,
            order.openedAt, order.updatedAt,
          ]
        )
      } catch (err) {
        console.warn('[syncEngine] syncActiveOrders upsert:', err.message)
      }
    }
  }

  return { ...result, synced: true, syncedAt: new Date().toISOString() }
}

/**
 * Syncs inventory from the provider to pos3_normalized_inventory.
 */
export async function syncInventory(providerKey) {
  const provider = getProvider(providerKey)
  if (!provider) return { success: false, message: `Unknown provider: ${providerKey}` }

  const result = provider.fetchInventory()
  if (!result.success) return result

  if (isDbAvailable()) {
    for (const item of result.inventory) {
      try {
        await query(
          `INSERT INTO pos3_normalized_inventory
             (provider, provider_item_id, name, category, subcategory,
              current_stock, low_stock_threshold, reorder_recommended, location_id, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (provider, provider_item_id) DO UPDATE SET
             current_stock       = EXCLUDED.current_stock,
             reorder_recommended = EXCLUDED.reorder_recommended,
             updated_at          = EXCLUDED.updated_at`,
          [
            item.provider, item.providerItemId, item.name, item.category, item.subcategory,
            item.currentStock, item.lowStockThreshold, item.reorderRecommended,
            item.locationId, item.updatedAt,
          ]
        )
      } catch (err) {
        console.warn('[syncEngine] syncInventory upsert:', err.message)
      }
    }
  }

  return { ...result, synced: true, syncedAt: new Date().toISOString() }
}

/**
 * Syncs table mapping to pos3_table_mapping.
 */
export async function syncTableMapping(providerKey) {
  const provider = getProvider(providerKey)
  if (!provider) return { success: false, message: `Unknown provider: ${providerKey}` }

  const result = provider.fetchTables()
  if (!result.success) return result

  if (isDbAvailable()) {
    const venueId = process.env.VENUE_ID || 'novee-grand-lounge'
    for (const t of result.tables) {
      try {
        await query(
          `INSERT INTO pos3_table_mapping
             (venue_id, provider, table_id, table_number, zone, seats,
              assigned_staff_id, active_order_id, status, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
           ON CONFLICT (provider, table_id, venue_id) DO UPDATE SET
             status            = EXCLUDED.status,
             assigned_staff_id = EXCLUDED.assigned_staff_id,
             active_order_id   = EXCLUDED.active_order_id,
             updated_at        = NOW()`,
          [venueId, t.provider, t.tableId, t.tableNumber, t.zone, t.seats,
           t.assignedStaffId, t.activeOrderId, t.status]
        )
      } catch (err) {
        console.warn('[syncEngine] syncTableMapping upsert:', err.message)
      }
    }
  }

  return { ...result, synced: true, syncedAt: new Date().toISOString() }
}

/**
 * Full sync: orders + inventory + tables.
 */
export async function syncAll(providerKey) {
  const [orders, inventory, tables] = await Promise.all([
    syncActiveOrders(providerKey),
    syncInventory(providerKey),
    syncTableMapping(providerKey),
  ])
  return {
    success:    orders.success && inventory.success && tables.success,
    provider:   providerKey,
    syncedAt:   new Date().toISOString(),
    orders:     { count: orders.orders?.length || 0 },
    inventory:  { count: inventory.inventory?.length || 0, lowStock: inventory.lowStockCount || 0 },
    tables:     { count: tables.tables?.length || 0, occupied: tables.occupiedCount || 0 },
  }
}
