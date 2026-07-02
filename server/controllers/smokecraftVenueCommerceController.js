/**
 * SmokeCraft Venue Commerce Controller
 * Handles venue profile, menu, orders, partner attribution, Money Bridge, revenue reports.
 */
import { isDbAvailable, query } from '../db/connection.js'

const TAX_RATE = 0.085

function roundMoney(n) { return Math.round((n + Number.EPSILON) * 100) / 100 }

function calculateMoneyBridge(items) {
  const venueItems = items.filter(i => !i.isPartnerItem)
  const partnerItems = items.filter(i => i.isPartnerItem)
  const venueSubtotal = venueItems.reduce((s, i) => s + (parseFloat(i.unitPrice || i.price) * (i.quantity || 1)), 0)
  const partnerSubtotal = partnerItems.reduce((s, i) => s + (parseFloat(i.unitPrice || i.price) * (i.quantity || 1)), 0)
  const hasPartnerItems = partnerItems.length > 0
  const deliveryFee = hasPartnerItems ? 4.50 : 0

  const taxableBase = venueSubtotal + partnerSubtotal + deliveryFee
  const tax = roundMoney(taxableBase * TAX_RATE)
  const total = roundMoney(venueSubtotal + partnerSubtotal + deliveryFee + tax)

  const partnerBreakdown = []
  const partnerMap = {}
  for (const item of partnerItems) {
    const pid = item.partnerId
    if (!partnerMap[pid]) partnerMap[pid] = { partnerId: pid, subtotal: 0 }
    partnerMap[pid].subtotal += parseFloat(item.unitPrice || item.price) * (item.quantity || 1)
  }
  for (const pid of Object.keys(partnerMap)) {
    const p = partnerMap[pid]
    partnerBreakdown.push({
      partnerId: pid,
      subtotal: roundMoney(p.subtotal),
      smokeCraftCommission: roundMoney(p.subtotal * 0.10),
      venueReferral: roundMoney(p.subtotal * 0.05),
      partnerPayout: roundMoney(p.subtotal * 0.85),
      settlementStatus: 'pending',
    })
  }

  return {
    venueSubtotal: roundMoney(venueSubtotal),
    partnerSubtotal: roundMoney(partnerSubtotal),
    deliveryFee: roundMoney(deliveryFee),
    tax,
    total,
    hasPartnerItems,
    moneyBridgeActive: hasPartnerItems,
    smokeCraftTotalCommission: roundMoney(partnerBreakdown.reduce((s, p) => s + p.smokeCraftCommission, 0)),
    venueTotalReferral: roundMoney(partnerBreakdown.reduce((s, p) => s + p.venueReferral, 0)),
    partnerTotalPayout: roundMoney(partnerBreakdown.reduce((s, p) => s + p.partnerPayout, 0)),
    partnerBreakdown,
  }
}

// GET /api/smokecraft/venue-commerce/profile/:venueId
export async function getVenueProfile(req, res) {
  const { venueId } = req.params
  if (isDbAvailable()) {
    try {
      const { rows } = await query(`SELECT * FROM venues WHERE venue_id = $1`, [venueId])
      if (rows[0]) {
        return res.json({ ok: true, profile: rows[0], storageMode: 'postgres' })
      }
    } catch (err) {
      console.error('[smokecraftVenueCommerce] getVenueProfile DB error:', err.message)
    }
  }
  res.json({
    ok: true,
    localPreview: true,
    storageMode: 'memory_fallback',
    profile: {
      venueId,
      venueName: 'SmokeCraft 360',
      address: '360 Cigar Lounge Blvd, Suite 1',
      taxRate: TAX_RATE,
      paymentNote: 'Cash / Tab at end of service. Card payment processor not currently configured.',
    },
  })
}

// GET /api/smokecraft/venue-commerce/menu/:venueId
export async function getVenueMenu(req, res) {
  const { venueId } = req.params
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT * FROM venue_menu_items WHERE venue_id = $1 AND (is_active = true OR is_active IS NULL) ORDER BY sort_order, item_name`,
        [venueId]
      )
      if (rows.length > 0) {
        const cigars = rows.filter(r => ['house_cigar','featured_cigar','cigar','humidor_match'].includes(r.item_category))
        const drinks = rows.filter(r => ['liquor','cocktail','wine','beer'].includes(r.item_category))
        const food   = rows.filter(r => r.item_category === 'food' && !r.is_partner_item)
        return res.json({ ok: true, cigars, drinks, food, partnerFoods: [], storageMode: 'postgres' })
      }
    } catch (err) {
      console.error('[smokecraftVenueCommerce] getVenueMenu DB error:', err.message)
    }
  }
  res.json({
    ok: true,
    localPreview: true,
    storageMode: 'memory_fallback',
    message: 'Backend unavailable. Showing local-preview menu data.',
  })
}

// POST /api/smokecraft/venue-commerce/orders
export async function createOrder(req, res) {
  const { venueId, tableLabel, guestSessionId, orderSource, items, staffPin } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'items array required' })
  }

  // Backend recalculates — never trust frontend totals
  const bridge = calculateMoneyBridge(items)

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO orders (venue_id, table_label, guest_session_id, order_source, status, subtotal, tax, total, money_bridge_data, items_json)
         VALUES ($1,$2,$3,$4,'submitted',$5,$6,$7,$8,$9)
         RETURNING order_id, status, created_at`,
        [
          venueId || 'smokecraft-360-main',
          tableLabel || 'Table',
          guestSessionId || null,
          orderSource || 'customer_self_order',
          bridge.venueSubtotal + bridge.partnerSubtotal,
          bridge.tax,
          bridge.total,
          JSON.stringify(bridge),
          JSON.stringify(items),
        ]
      )
      return res.json({
        ok: true,
        orderId: rows[0].order_id,
        status: rows[0].status,
        createdAt: rows[0].created_at,
        moneyBridge: bridge,
        paymentNote: 'Cash / Tab at end of service. Card payment processor not currently configured.',
        storageMode: 'postgres',
      })
    } catch (err) {
      console.error('[smokecraftVenueCommerce] createOrder DB error:', err.message)
    }
  }

  res.json({
    ok: true,
    localPreview: true,
    storageMode: 'memory_fallback',
    orderId: `local-${Date.now()}`,
    status: 'local_preview_only',
    moneyBridge: bridge,
    paymentNote: 'Cash / Tab at end of service. Card payment processor not currently configured.',
    message: 'Order recorded locally. Not synced to backend — backend unavailable.',
  })
}

// POST /api/smokecraft/venue-commerce/staff-request
export async function createStaffRequest(req, res) {
  const { venueId, tableLabel, guestSessionId, items, staffNote } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'items array required' })
  }

  const bridge = calculateMoneyBridge(items)

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO orders (venue_id, table_label, guest_session_id, order_source, status, subtotal, tax, total, money_bridge_data, items_json, staff_note)
         VALUES ($1,$2,$3,'staff_assisted_order','pending_staff_confirmation',$4,$5,$6,$7,$8,$9)
         RETURNING order_id, status`,
        [
          venueId || 'smokecraft-360-main',
          tableLabel || 'Table',
          guestSessionId || null,
          bridge.venueSubtotal + bridge.partnerSubtotal,
          bridge.tax,
          bridge.total,
          JSON.stringify(bridge),
          JSON.stringify(items),
          staffNote || '',
        ]
      )
      return res.json({
        ok: true,
        requestId: rows[0].order_id,
        status: rows[0].status,
        moneyBridge: bridge,
        storageMode: 'postgres',
      })
    } catch (err) {
      console.error('[smokecraftVenueCommerce] createStaffRequest DB error:', err.message)
    }
  }

  res.json({
    ok: true,
    localPreview: true,
    requestId: `local-sr-${Date.now()}`,
    status: 'local_preview_only',
    moneyBridge: bridge,
    message: 'Staff request logged locally. Backend unavailable — staff will need to be flagged in person.',
  })
}

// POST /api/smokecraft/venue-commerce/partner-click
export async function trackPartnerClick(req, res) {
  const { eventType, action, venueId, tableLabel, partnerId, partnerName, timestamp } = req.body
  if (!partnerId) return res.status(400).json({ ok: false, error: 'partnerId required' })

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO partner_attribution_events (event_type, action, venue_id, table_label, partner_id, partner_name, event_timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [eventType || 'partner_attribution', action || 'logo_click', venueId, tableLabel, partnerId, partnerName, timestamp || new Date().toISOString()]
      )
      return res.json({ ok: true, tracked: true, storageMode: 'postgres' })
    } catch (err) {
      console.error('[smokecraftVenueCommerce] trackPartnerClick DB error:', err.message)
    }
  }

  res.json({ ok: true, tracked: false, localPreview: true, message: 'Attribution event not persisted — backend unavailable.' })
}

// POST /api/smokecraft/venue-commerce/money-bridge-event
export async function trackMoneyBridgeEvent(req, res) {
  const { eventType, action, venueId, tableLabel, partnerId, partnerName, itemId, itemName, unitPrice, smokeCraftCommission, venueReferral, timestamp } = req.body
  if (!partnerId || !itemId) return res.status(400).json({ ok: false, error: 'partnerId and itemId required' })

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO partner_attribution_events (event_type, action, venue_id, table_label, partner_id, partner_name, item_id, item_name, unit_price, smokecraft_commission, venue_referral, event_timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [eventType || 'partner_food_add', action || 'food_add', venueId, tableLabel, partnerId, partnerName, itemId, itemName, unitPrice || 0, smokeCraftCommission || 0, venueReferral || 0, timestamp || new Date().toISOString()]
      )
      return res.json({ ok: true, tracked: true, storageMode: 'postgres' })
    } catch (err) {
      console.error('[smokecraftVenueCommerce] trackMoneyBridgeEvent DB error:', err.message)
    }
  }

  res.json({ ok: true, tracked: false, localPreview: true, message: 'Money Bridge event not persisted — backend unavailable.' })
}

// GET /api/smokecraft/venue-commerce/revenue-report/:venueId
export async function getRevenueReport(req, res) {
  const { venueId } = req.params

  if (isDbAvailable()) {
    try {
      const { rows: orders } = await query(
        `SELECT money_bridge_data FROM orders WHERE venue_id = $1 AND status NOT IN ('cancelled')`,
        [venueId]
      )

      let totalVenueRevenue = 0, totalPartnerRevenue = 0
      let totalSmokeCraftCommission = 0, totalVenueReferral = 0, totalPartnerPayout = 0
      const partnerTotals = {}

      for (const row of orders) {
        const mb = typeof row.money_bridge_data === 'string' ? JSON.parse(row.money_bridge_data) : row.money_bridge_data
        if (!mb) continue
        totalVenueRevenue += mb.venueSubtotal || 0
        totalPartnerRevenue += mb.partnerSubtotal || 0
        totalSmokeCraftCommission += mb.smokeCraftTotalCommission || 0
        totalVenueReferral += mb.venueTotalReferral || 0
        totalPartnerPayout += mb.partnerTotalPayout || 0
        for (const p of (mb.partnerBreakdown || [])) {
          if (!partnerTotals[p.partnerId]) partnerTotals[p.partnerId] = { revenue: 0, sc: 0, vr: 0, pp: 0 }
          partnerTotals[p.partnerId].revenue += p.subtotal || 0
          partnerTotals[p.partnerId].sc += p.smokeCraftCommission || 0
          partnerTotals[p.partnerId].vr += p.venueReferral || 0
          partnerTotals[p.partnerId].pp += p.partnerPayout || 0
        }
      }

      const { rows: clicks } = await query(
        `SELECT partner_id, action, COUNT(*) as cnt FROM partner_attribution_events WHERE venue_id = $1 GROUP BY partner_id, action`,
        [venueId]
      )

      const clickMap = {}
      for (const c of clicks) {
        if (!clickMap[c.partner_id]) clickMap[c.partner_id] = {}
        clickMap[c.partner_id][c.action] = parseInt(c.cnt, 10)
      }

      const partnerBreakdown = Object.keys({ ...partnerTotals, ...clickMap }).map(pid => ({
        partnerId: pid,
        clicks: clickMap[pid]?.logo_click || 0,
        menuOpens: clickMap[pid]?.menu_open || 0,
        foodAdds: clickMap[pid]?.food_add || 0,
        checkouts: clickMap[pid]?.checkout || 0,
        revenue: roundMoney(partnerTotals[pid]?.revenue || 0),
        smokeCraftCommission: roundMoney(partnerTotals[pid]?.sc || 0),
        venueReferral: roundMoney(partnerTotals[pid]?.vr || 0),
        partnerPayout: roundMoney(partnerTotals[pid]?.pp || 0),
        settlementStatus: 'pending',
      }))

      return res.json({
        ok: true,
        storageMode: 'postgres',
        report: {
          venueId,
          generatedAt: new Date().toISOString(),
          totalVenueRevenue: roundMoney(totalVenueRevenue),
          totalPartnerRevenue: roundMoney(totalPartnerRevenue),
          totalSmokeCraftCommission: roundMoney(totalSmokeCraftCommission),
          totalVenueReferral: roundMoney(totalVenueReferral),
          totalPartnerPayout: roundMoney(totalPartnerPayout),
          partnerBreakdown,
        },
      })
    } catch (err) {
      console.error('[smokecraftVenueCommerce] getRevenueReport DB error:', err.message)
    }
  }

  res.json({
    ok: true,
    localPreview: true,
    storageMode: 'memory_fallback',
    report: {
      venueId,
      generatedAt: new Date().toISOString(),
      totalVenueRevenue: 0,
      totalPartnerRevenue: 0,
      totalSmokeCraftCommission: 0,
      totalVenueReferral: 0,
      totalPartnerPayout: 0,
      partnerBreakdown: [],
    },
    message: 'Revenue report unavailable — backend not connected. Showing local-preview placeholder.',
  })
}
