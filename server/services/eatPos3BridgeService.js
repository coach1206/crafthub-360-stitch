/**
 * E.A.T. POS 3 Bridge Service — Phase 9
 * Syncs POS 3 provider data into E.A.T. Command feed format.
 * Feeds: Environment (venue state), Asset (inventory), Transaction (orders/revenue)
 *
 * Management-only. Guest access is blocked at route level.
 */

import { getProvider } from './pos3IntegrationService.js'

/**
 * Syncs all POS 3 data into E.A.T. feeds and returns the combined E.A.T. payload.
 */
export async function syncPOS3ToEAT(providerKey = 'prototype') {
  const [env, assets, transactions] = await Promise.all([
    prepareEnvironmentFeed(providerKey),
    prepareAssetFeed(providerKey),
    prepareTransactionFeed(providerKey),
  ])

  const opportunityScore = calculateVenueOpportunityScore(env, assets, transactions)

  return {
    success:           true,
    provider:          providerKey,
    syncedAt:          new Date().toISOString(),
    environment:       env,
    assets:            assets,
    transactions:      transactions,
    opportunityScore,
  }
}

/**
 * Environment feed — venue occupancy, zone density, service pacing.
 */
export async function prepareEnvironmentFeed(providerKey = 'prototype') {
  const provider = getProvider(providerKey)
  if (!provider) return { success: false, message: `Unknown provider: ${providerKey}` }

  const tablesResult = provider.fetchTables()
  const staffResult  = provider.fetchStaff()

  const tables   = tablesResult.tables   || []
  const staff    = staffResult.staff     || []
  const occupied = tables.filter(t => t.status === 'occupied').length
  const total    = tables.length

  const zoneBreakdown = {}
  for (const t of tables) {
    const z = t.zone || 'Unknown'
    if (!zoneBreakdown[z]) zoneBreakdown[z] = { total: 0, occupied: 0 }
    zoneBreakdown[z].total++
    if (t.status === 'occupied') zoneBreakdown[z].occupied++
  }

  return {
    success:          true,
    tableCount:       total,
    occupiedTables:   occupied,
    availableTables:  tables.filter(t => t.status === 'available').length,
    reservedTables:   tables.filter(t => t.status === 'reserved').length,
    occupancyPct:     total > 0 ? Math.round((occupied / total) * 100) : 0,
    activeStaff:      staff.filter(s => s.active).length,
    totalStaff:       staff.length,
    zoneBreakdown,
    venuePressure:    calcPressure(occupied, total),
    servicePace:      calcServicePace(occupied, staff.filter(s => s.active).length),
  }
}

/**
 * Asset feed — inventory levels, low stock, reorder flags, featured items.
 */
export async function prepareAssetFeed(providerKey = 'prototype') {
  const provider = getProvider(providerKey)
  if (!provider) return { success: false, message: `Unknown provider: ${providerKey}` }

  const result = provider.fetchInventory()
  const items  = result.inventory || []

  const lowStock    = items.filter(i => i.reorderRecommended)
  const featured    = items.filter(i => !i.reorderRecommended && ['VIP Pairings', 'Premium Cigars'].includes(i.category))
  const categories  = [...new Set(items.map(i => i.category))]

  const byCategory = {}
  for (const cat of categories) {
    const catItems = items.filter(i => i.category === cat)
    byCategory[cat] = {
      total:    catItems.length,
      lowStock: catItems.filter(i => i.reorderRecommended).length,
    }
  }

  return {
    success:             true,
    totalItems:          items.length,
    lowStockCount:       lowStock.length,
    reorderAlerts:       lowStock.map(i => ({ name: i.name, stock: i.currentStock, threshold: i.lowStockThreshold, category: i.category })),
    featuredItems:       featured.slice(0, 4),
    categoryBreakdown:   byCategory,
    overstockCategories: [],
  }
}

/**
 * Transaction feed — open checks, upsell signals, staff opportunities.
 */
export async function prepareTransactionFeed(providerKey = 'prototype') {
  const provider = getProvider(providerKey)
  if (!provider) return { success: false, message: `Unknown provider: ${providerKey}` }

  const result = provider.fetchActiveOrders()
  const orders = result.orders || []

  const totalValue      = orders.reduce((s, o) => s + (o.total || 0), 0)
  const avgCheck        = orders.length > 0 ? totalValue / orders.length : 0
  const highValueOrders = orders.filter(o => o.total >= 150)

  const upsellOpportunities = orders
    .filter(o => o.total < 80 && o.items?.length < 3)
    .map(o => ({
      orderId:     o.providerOrderId,
      table:       o.tableNumber,
      staffId:     o.staffId,
      currentTotal: o.total,
      signal:      'low_item_count_upsell_opportunity',
    }))

  return {
    success:              true,
    openCheckCount:       orders.length,
    totalOpenValue:       parseFloat(totalValue.toFixed(2)),
    averageCheckValue:    parseFloat(avgCheck.toFixed(2)),
    highValueOrders:      highValueOrders.length,
    upsellOpportunities:  upsellOpportunities.length,
    upsellDetails:        upsellOpportunities,
    staffOpportunities:   buildStaffOpportunities(orders),
    acceptedRecommendations: 0,   // placeholder until real feedback loop
  }
}

/**
 * Calculates a venue opportunity score (0–100) from environment + asset + transaction data.
 */
export function calculateVenueOpportunityScore(env, assets, transactions) {
  let score = 50

  // Occupancy contribution (higher occupancy = more opportunity)
  const occ = env.occupancyPct || 0
  if (occ >= 80) score += 20
  else if (occ >= 60) score += 12
  else if (occ >= 40) score += 6

  // Low stock creates urgency signals
  const lowStock = assets.lowStockCount || 0
  if (lowStock >= 5) score += 10
  else if (lowStock >= 2) score += 5

  // Upsell opportunities
  const upsell = transactions.upsellOpportunities || 0
  score += Math.min(15, upsell * 4)

  // High-value orders in play
  const hvOrders = transactions.highValueOrders || 0
  score += Math.min(5, hvOrders * 2)

  return Math.min(100, Math.round(score))
}

// ── Private helpers ───────────────────────────────────────────

function calcPressure(occupied, total) {
  if (total === 0) return 'LOW'
  const pct = occupied / total
  if (pct >= 0.85) return 'HIGH'
  if (pct >= 0.6)  return 'MEDIUM'
  return 'LOW'
}

function calcServicePace(occupied, activeStaff) {
  if (activeStaff === 0) return 'UNKNOWN'
  const ratio = occupied / activeStaff
  if (ratio >= 4) return 'STRETCHED'
  if (ratio >= 2.5) return 'BUSY'
  if (ratio >= 1) return 'NORMAL'
  return 'LIGHT'
}

function buildStaffOpportunities(orders) {
  const byStaff = {}
  for (const o of orders) {
    if (!o.staffId) continue
    if (!byStaff[o.staffId]) {
      byStaff[o.staffId] = { staffId: o.staffId, staffName: o.staffName, orderCount: 0, totalValue: 0 }
    }
    byStaff[o.staffId].orderCount++
    byStaff[o.staffId].totalValue += o.total || 0
  }
  return Object.values(byStaff).map(s => ({
    ...s,
    totalValue: parseFloat(s.totalValue.toFixed(2)),
    avgValue:   parseFloat((s.totalValue / s.orderCount).toFixed(2)),
  }))
}
