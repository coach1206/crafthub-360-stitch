/**
 * SmokeCraft Ticket Tapper Specials Controller
 * Handles real-time specials, inventory, staff actions, Money Bridge tracking.
 * Real-Time Ready — wire WebSocket/Supabase realtime to push updates here.
 */
import { isDbAvailable, query } from '../db/connection.js'

const TAX_RATE = 0.085
function roundMoney(n) { return Math.round((n + Number.EPSILON) * 100) / 100 }

function calcMoneyBridge(special) {
  const partnerItems = (special.items || []).filter(i => i.commissionEligible && i.partnerId)
  const partnerSubtotal = partnerItems.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (i.quantity || 1), 0)
  const sc = roundMoney(partnerSubtotal * ((special.moneyBridge?.smokeCraftCommissionPercent || 10) / 100))
  const vr = roundMoney(partnerSubtotal * ((special.moneyBridge?.venueReferralPercent || 5) / 100))
  const pp = roundMoney(partnerSubtotal - sc - vr)
  return { partnerSubtotal: roundMoney(partnerSubtotal), smokeCraftCommission: sc, venueReferral: vr, partnerPayout: pp }
}

// GET /api/smokecraft/ticket-tapper/specials/:venueId
export async function getSpecials(req, res) {
  const { venueId } = req.params
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT * FROM ticket_tapper_specials WHERE venue_id = $1 AND status = 'active' ORDER BY priority ASC, created_at DESC`,
        [venueId]
      )
      return res.json({ ok: true, specials: rows, storageMode: 'postgres' })
    } catch (err) {
      console.error('[ticketTapperSpecials] getSpecials DB error:', err.message)
    }
  }
  // Local preview seed
  const { smokeCraftTicketTapperSpecialsSeed: seed } = await import('../data/smokecraftSpecialsSeed.js').catch(() => ({ smokeCraftTicketTapperSpecialsSeed: { specials: [] } }))
  res.json({ ok: true, specials: seed.specials || [], localPreview: true, storageMode: 'memory_fallback' })
}

// POST /api/smokecraft/ticket-tapper/specials
export async function createSpecial(req, res) {
  const { venueId, special, staff } = req.body
  if (!venueId || !special || !staff) return res.status(400).json({ ok: false, error: 'venueId, special, and staff required' })

  const trackEvent = {
    id: `evt-${Date.now()}`,
    venueId,
    specialId: special.id || `sp-${Date.now()}`,
    action: 'create',
    staffId: staff.staffId,
    staffRole: staff.role,
    sourceScreen: 'staff_specials_control_panel',
    timestamp: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO ticket_tapper_specials
           (venue_id, title, subtitle, description, special_type, source, promoted_by_role,
            status, priority, starts_at, ends_at, inventory_json, pricing_json, items_json,
            media_json, money_bridge_json, cta_json, created_by_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
          venueId, special.title, special.subtitle, special.description,
          special.specialType, special.source, special.promotedByRole,
          special.priority || 99,
          special.startsAt || new Date().toISOString(),
          special.endsAt || null,
          JSON.stringify(special.inventory || {}),
          JSON.stringify(special.pricing || {}),
          JSON.stringify(special.items || []),
          JSON.stringify(special.media || {}),
          JSON.stringify(special.moneyBridge || {}),
          JSON.stringify(special.callToAction || {}),
          JSON.stringify({ staffId: staff.staffId, name: staff.name, role: staff.role }),
        ]
      )
      await query(
        `INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, staff_id, staff_role, source_screen, event_timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [trackEvent.id, venueId, rows[0].special_id, 'create', staff.staffId, staff.role, 'staff_specials_control_panel', trackEvent.timestamp]
      )
      return res.status(201).json({ ok: true, special: rows[0], trackEvent, storageMode: 'postgres' })
    } catch (err) {
      console.error('[ticketTapperSpecials] createSpecial DB error:', err.message)
    }
  }
  res.json({ ok: true, localPreview: true, specialId: trackEvent.specialId, status: 'active', trackEvent, message: 'Special created locally — backend unavailable.' })
}

// PATCH /api/smokecraft/ticket-tapper/specials/:specialId
export async function updateSpecial(req, res) {
  const { specialId } = req.params
  const { action, staff, inventory, pricing, status } = req.body

  if (isDbAvailable()) {
    try {
      const setClauses = []
      const params = []
      let i = 1
      if (status) { setClauses.push(`status = $${i++}`); params.push(status) }
      if (inventory) { setClauses.push(`inventory_json = $${i++}`); params.push(JSON.stringify(inventory)) }
      if (pricing) { setClauses.push(`pricing_json = $${i++}`); params.push(JSON.stringify(pricing)) }
      if (action === 'end') { setClauses.push(`ends_at = $${i++}`); params.push(new Date().toISOString()) }
      setClauses.push(`updated_at = NOW()`)
      params.push(specialId)
      const { rows } = await query(
        `UPDATE ticket_tapper_specials SET ${setClauses.join(', ')} WHERE special_id = $${i} RETURNING *`,
        params
      )
      if (staff) {
        await query(
          `INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, staff_id, staff_role, source_screen, event_timestamp)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [`evt-${Date.now()}`, rows[0]?.venue_id, specialId, action || 'update', staff.staffId, staff.role, 'staff_specials_control_panel', new Date().toISOString()]
        )
      }
      return res.json({ ok: true, special: rows[0], storageMode: 'postgres' })
    } catch (err) {
      console.error('[ticketTapperSpecials] updateSpecial DB error:', err.message)
    }
  }
  res.json({ ok: true, localPreview: true, specialId, message: 'Special updated locally — backend unavailable.' })
}

// POST /api/smokecraft/ticket-tapper/specials/:specialId/tap
export async function trackTap(req, res) {
  const { specialId } = req.params
  const { venueId, tableLabel, guestSessionId, specialData } = req.body

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, table_label, guest_session_id, event_timestamp)
         VALUES ($1,$2,$3,'special_tap',$4,$5,$6)`,
        [`evt-${Date.now()}`, venueId, specialId, tableLabel, guestSessionId || null, new Date().toISOString()]
      )
      return res.json({ ok: true, tracked: true, action: 'special_tap', storageMode: 'postgres' })
    } catch (err) {
      console.error('[ticketTapperSpecials] trackTap DB error:', err.message)
    }
  }
  res.json({ ok: true, tracked: false, localPreview: true, action: 'special_tap' })
}

// POST /api/smokecraft/ticket-tapper/specials/:specialId/add
export async function trackAdd(req, res) {
  const { specialId } = req.params
  const { venueId, tableLabel, guestSessionId, specialData } = req.body

  const hasPartner = specialData?.moneyBridge?.active
  const bridge = hasPartner ? calcMoneyBridge(specialData) : null

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, table_label, guest_session_id, money_bridge_json, event_timestamp)
         VALUES ($1,$2,$3,'special_added',$4,$5,$6,$7)`,
        [`evt-${Date.now()}`, venueId, specialId, tableLabel, guestSessionId || null, JSON.stringify(bridge), new Date().toISOString()]
      )
      // Decrement inventory
      if (specialData?.inventory?.inventoryItemIds?.length) {
        for (const itemId of specialData.inventory.inventoryItemIds) {
          await query(
            `UPDATE ticket_tapper_inventory SET quantity_available = GREATEST(0, quantity_available - 1), quantity_sold = quantity_sold + 1 WHERE item_id = $1 AND venue_id = $2`,
            [itemId, venueId]
          ).catch(() => {})
        }
      }
      return res.json({ ok: true, tracked: true, action: 'special_added', moneyBridge: bridge, storageMode: 'postgres' })
    } catch (err) {
      console.error('[ticketTapperSpecials] trackAdd DB error:', err.message)
    }
  }
  res.json({ ok: true, tracked: false, localPreview: true, action: 'special_added', moneyBridge: bridge })
}

// POST /api/smokecraft/ticket-tapper/specials/:specialId/end
export async function endSpecial(req, res) {
  const { specialId } = req.params
  const { venueId, staff } = req.body

  if (isDbAvailable()) {
    try {
      await query(
        `UPDATE ticket_tapper_specials SET status = 'ended', ends_at = NOW() WHERE special_id = $1`,
        [specialId]
      )
      if (staff) {
        await query(
          `INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, staff_id, staff_role, source_screen, event_timestamp)
           VALUES ($1,$2,$3,'end',$4,$5,$6,$7)`,
          [`evt-${Date.now()}`, venueId, specialId, staff.staffId, staff.role, 'staff_specials_control_panel', new Date().toISOString()]
        )
      }
      return res.json({ ok: true, specialId, status: 'ended', storageMode: 'postgres' })
    } catch (err) {
      console.error('[ticketTapperSpecials] endSpecial DB error:', err.message)
    }
  }
  res.json({ ok: true, localPreview: true, specialId, status: 'ended', message: 'Special ended locally — backend unavailable.' })
}

// GET /api/smokecraft/ticket-tapper/inventory/:venueId
export async function getInventory(req, res) {
  const { venueId } = req.params
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT * FROM ticket_tapper_inventory WHERE venue_id = $1 ORDER BY item_name`,
        [venueId]
      )
      return res.json({ ok: true, items: rows, storageMode: 'postgres' })
    } catch (err) {
      console.error('[ticketTapperSpecials] getInventory DB error:', err.message)
    }
  }
  const { smokeCraftInventorySeed } = await import('../data/smokecraftInventorySeedServer.js').catch(() => ({ smokeCraftInventorySeed: { items: [] } }))
  res.json({ ok: true, items: smokeCraftInventorySeed?.items || [], localPreview: true, storageMode: 'memory_fallback' })
}

// PATCH /api/smokecraft/ticket-tapper/inventory/:itemId
export async function updateInventory(req, res) {
  const { itemId } = req.params
  const { venueId, quantityAvailable, status } = req.body

  if (isDbAvailable()) {
    try {
      const setClauses = []
      const params = []
      let i = 1
      if (quantityAvailable !== undefined) { setClauses.push(`quantity_available = $${i++}`); params.push(quantityAvailable) }
      if (status) { setClauses.push(`status = $${i++}`); params.push(status) }
      setClauses.push('updated_at = NOW()')
      params.push(itemId)
      const { rows } = await query(
        `UPDATE ticket_tapper_inventory SET ${setClauses.join(', ')} WHERE item_id = $${i} RETURNING *`,
        params
      )
      return res.json({ ok: true, item: rows[0], storageMode: 'postgres' })
    } catch (err) {
      console.error('[ticketTapperSpecials] updateInventory DB error:', err.message)
    }
  }
  res.json({ ok: true, localPreview: true, itemId, message: 'Inventory updated locally — backend unavailable.' })
}

// GET /api/smokecraft/ticket-tapper/specials-report/:venueId
export async function getSpecialsReport(req, res) {
  const { venueId } = req.params

  if (isDbAvailable()) {
    try {
      const { rows: events } = await query(
        `SELECT action, special_id, staff_role, money_bridge_json FROM ticket_tapper_special_events WHERE venue_id = $1`,
        [venueId]
      )

      const counts = { special_view: 0, special_tap: 0, special_added: 0, special_checkout: 0, special_sold_out_blocked: 0 }
      const specialMap = {}
      const roleMap = { manager: { specialsCreated: 0, taps: 0, revenue: 0 }, bartender: { specialsCreated: 0, taps: 0, revenue: 0 }, cook: { specialsCreated: 0, taps: 0, revenue: 0 }, server: { specialsCreated: 0, taps: 0, revenue: 0 } }

      for (const evt of events) {
        if (counts[evt.action] !== undefined) counts[evt.action]++
        if (!specialMap[evt.special_id]) specialMap[evt.special_id] = { specialId: evt.special_id, views: 0, taps: 0, adds: 0, checkouts: 0, revenue: 0, smokeCraftCommission: 0, venueReferralCommission: 0 }
        if (evt.action === 'special_view') specialMap[evt.special_id].views++
        if (evt.action === 'special_tap') specialMap[evt.special_id].taps++
        if (evt.action === 'special_added') {
          specialMap[evt.special_id].adds++
          const mb = evt.money_bridge_json ? (typeof evt.money_bridge_json === 'string' ? JSON.parse(evt.money_bridge_json) : evt.money_bridge_json) : null
          if (mb) {
            specialMap[evt.special_id].revenue += mb.partnerSubtotal || 0
            specialMap[evt.special_id].smokeCraftCommission += mb.smokeCraftCommission || 0
            specialMap[evt.special_id].venueReferralCommission += mb.venueReferral || 0
          }
        }
        if (evt.action === 'special_checkout') specialMap[evt.special_id].checkouts++
        if (evt.action === 'create' && evt.staff_role && roleMap[evt.staff_role]) roleMap[evt.staff_role].specialsCreated++
        if (evt.action === 'special_tap' && evt.staff_role && roleMap[evt.staff_role]) roleMap[evt.staff_role].taps++
      }

      const { rows: inventoryRows } = await query(
        `SELECT * FROM ticket_tapper_inventory WHERE venue_id = $1 AND (quantity_available <= low_inventory_threshold OR status = 'sold_out')`,
        [venueId]
      ).catch(() => ({ rows: [] }))

      return res.json({
        ok: true,
        storageMode: 'postgres',
        report: {
          venueId,
          mode: 'live',
          generatedAt: new Date().toISOString(),
          totalSpecialsShown: counts.special_view,
          totalSpecialTaps: counts.special_tap,
          totalSpecialAdds: counts.special_added,
          totalSpecialCheckouts: counts.special_checkout,
          totalSoldOutBlocks: counts.special_sold_out_blocked,
          topSpecials: Object.values(specialMap).sort((a, b) => b.adds - a.adds),
          rolePerformance: roleMap,
          inventoryAlerts: inventoryRows.map(i => ({
            itemId: i.item_id,
            name: i.item_name,
            quantityAvailable: i.quantity_available,
            status: i.status,
            message: i.quantity_available <= 0 ? 'Sold out' : `Only ${i.quantity_available} remaining`,
          })),
        },
      })
    } catch (err) {
      console.error('[ticketTapperSpecials] getSpecialsReport DB error:', err.message)
    }
  }

  res.json({
    ok: true,
    localPreview: true,
    storageMode: 'memory_fallback',
    report: {
      venueId,
      mode: 'local_preview',
      generatedAt: new Date().toISOString(),
      totalSpecialsShown: 0,
      totalSpecialTaps: 0,
      totalSpecialAdds: 0,
      totalSpecialCheckouts: 0,
      totalSoldOutBlocks: 0,
      topSpecials: [],
      rolePerformance: { manager: { specialsCreated: 0, taps: 0, revenue: 0 }, bartender: { specialsCreated: 0, taps: 0, revenue: 0 }, cook: { specialsCreated: 0, taps: 0, revenue: 0 }, server: { specialsCreated: 0, taps: 0, revenue: 0 } },
      inventoryAlerts: [],
    },
    message: 'Report unavailable — backend not connected. Showing local-preview placeholder.',
  })
}
