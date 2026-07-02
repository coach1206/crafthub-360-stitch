/**
 * SmokeCraft Ticket Tapper Specials Controller
 * Handles real-time specials, inventory, staff actions, Money Bridge tracking.
 * Real-Time Ready — wire WebSocket/Supabase realtime to push updates here.
 */
import { isDbAvailable, query } from '../db/connection.js'

const APPROVAL_ROLES = ['manager', 'owner', 'admin']
const SUGGESTION_ROLES = ['bartender', 'chef', 'cook', 'server']

function canApprove(role) { return APPROVAL_ROLES.includes(role) }
function canSuggest(role) { return SUGGESTION_ROLES.includes(role) || canApprove(role) }

function getInitialStatus(role) {
  return canApprove(role) ? 'approved' : 'pending_approval'
}

function makeTrackEvent(venueId, specialId, action, actor) {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    venueId,
    specialId,
    action,
    actor: { staffId: actor.staffId, name: actor.name, role: actor.role },
    approvalStatus: null,
    sourceScreen: 'staff_specials_control_panel',
    timestamp: new Date().toISOString(),
  }
}

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
  if (!canSuggest(staff.role)) return res.status(403).json({ ok: false, error: 'UNAUTHORIZED_ROLE', message: 'This role cannot create specials.' })

  const initialStatus = getInitialStatus(staff.role)
  const now = new Date().toISOString()
  const specialId = `sp-${Date.now()}`
  const approvalBlock = {
    required: !canApprove(staff.role),
    status: initialStatus,
    submittedBy: { staffId: staff.staffId, name: staff.name, role: staff.role },
    submittedAt: now,
    reviewedBy: canApprove(staff.role) ? { staffId: staff.staffId, name: staff.name, role: staff.role } : null,
    reviewedAt: canApprove(staff.role) ? now : null,
    approvalNote: canApprove(staff.role) ? 'Manager-created special approved.' : '',
    rejectionReason: '',
  }

  const trackAction = canApprove(staff.role) ? 'special_draft_created' : 'special_submitted_for_approval'
  const trackEvent = makeTrackEvent(venueId, specialId, trackAction, staff)
  trackEvent.approvalStatus = initialStatus

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO ticket_tapper_specials
           (venue_id, title, subtitle, description, special_type, source, promoted_by_role,
            status, priority, starts_at, ends_at, inventory_json, pricing_json, items_json,
            media_json, money_bridge_json, cta_json, created_by_json, approval_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         RETURNING *`,
        [
          venueId, special.title, special.subtitle, special.description,
          special.specialType, special.source, special.promotedByRole,
          initialStatus,
          special.priority || 99,
          special.startsAt || now,
          special.endsAt || null,
          JSON.stringify(special.inventory || {}),
          JSON.stringify(special.pricing || {}),
          JSON.stringify(special.items || []),
          JSON.stringify(special.media || {}),
          JSON.stringify(special.moneyBridge || {}),
          JSON.stringify(special.callToAction || {}),
          JSON.stringify({ staffId: staff.staffId, name: staff.name, role: staff.role }),
          JSON.stringify(approvalBlock),
        ]
      )
      await query(
        `INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, staff_id, staff_role, approval_status, source_screen, event_timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [trackEvent.id, venueId, rows[0].special_id, trackAction, staff.staffId, staff.role, initialStatus, 'staff_specials_control_panel', now]
      )
      return res.status(201).json({ ok: true, special: rows[0], status: initialStatus, approvalRequired: approvalBlock.required, trackEvent, storageMode: 'postgres' })
    } catch (err) {
      console.error('[ticketTapperSpecials] createSpecial DB error:', err.message)
    }
  }
  res.json({ ok: true, localPreview: true, specialId, status: initialStatus, approvalRequired: approvalBlock.required, trackEvent, message: `Special created locally (${initialStatus}) — backend unavailable.` })
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
      approvalReport: {
        pendingCount: 0, approvedCount: 0, rejectedCount: 0, publishedCount: 0,
        pendingByRole: { bartender: 0, chef: 0, cook: 0, server: 0 },
        approvedByManager: [],
      },
    },
    message: 'Report unavailable — backend not connected. Showing local-preview placeholder.',
  })
}

// ── Approval workflow endpoints ───────────────────────────────────────────────

// POST /api/smokecraft/ticket-tapper/specials/:specialId/submit-approval
export async function submitForApproval(req, res) {
  const { specialId } = req.params
  const { venueId, submittedBy, approval, special } = req.body
  if (!submittedBy?.role) return res.status(400).json({ ok: false, error: 'submittedBy required' })
  if (canApprove(submittedBy.role)) return res.status(400).json({ ok: false, error: 'Managers can publish directly — use publish endpoint.' })

  const now = new Date().toISOString()
  const approvalBlock = { required: true, status: 'pending_approval', submittedBy, submittedAt: now, reviewedBy: null, reviewedAt: null, approvalNote: '', rejectionReason: '' }
  const trackEvent = makeTrackEvent(venueId, specialId, 'special_submitted_for_approval', submittedBy)
  trackEvent.approvalStatus = 'pending_approval'

  if (isDbAvailable()) {
    try {
      await query(`UPDATE ticket_tapper_specials SET status = 'pending_approval', approval_json = $1 WHERE special_id = $2`, [JSON.stringify(approvalBlock), specialId])
      await query(`INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, staff_id, staff_role, approval_status, source_screen, event_timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [trackEvent.id, venueId, specialId, 'special_submitted_for_approval', submittedBy.staffId, submittedBy.role, 'pending_approval', 'staff_specials_control_panel', now])
      return res.json({ ok: true, specialId, status: 'pending_approval', approval: approvalBlock, trackEvent, storageMode: 'postgres' })
    } catch (err) { console.error('[ticketTapperSpecials] submitForApproval DB error:', err.message) }
  }
  res.json({ ok: true, localPreview: true, specialId, status: 'pending_approval', approval: approvalBlock, trackEvent })
}

// POST /api/smokecraft/ticket-tapper/specials/:specialId/approve
export async function approveSpecial(req, res) {
  const { specialId } = req.params
  const { venueId, reviewedBy, approval } = req.body
  if (!reviewedBy?.role) return res.status(400).json({ ok: false, error: 'reviewedBy required' })
  if (!canApprove(reviewedBy.role)) {
    return res.status(403).json({ ok: false, error: 'SPECIAL_APPROVAL_REQUIRED', message: 'This role can submit specials for management approval but cannot publish them live.' })
  }

  const now = new Date().toISOString()
  const approvalBlock = { required: true, status: 'approved', reviewedBy, reviewedAt: now, approvalNote: approval?.approvalNote || 'Approved for Ticket Tapper.', rejectionReason: '' }
  const trackEvent = makeTrackEvent(venueId, specialId, 'special_approved', reviewedBy)
  trackEvent.approvalStatus = 'approved'

  if (isDbAvailable()) {
    try {
      await query(`UPDATE ticket_tapper_specials SET status = 'approved', approval_json = jsonb_set(COALESCE(approval_json,'{}'), '{status}', '"approved"') WHERE special_id = $1`, [specialId])
      await query(`INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, staff_id, staff_role, approval_status, source_screen, event_timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [trackEvent.id, venueId, specialId, 'special_approved', reviewedBy.staffId, reviewedBy.role, 'approved', 'staff_specials_control_panel', now])
      return res.json({ ok: true, specialId, status: 'approved', approval: approvalBlock, trackEvent, storageMode: 'postgres' })
    } catch (err) { console.error('[ticketTapperSpecials] approveSpecial DB error:', err.message) }
  }
  res.json({ ok: true, localPreview: true, specialId, status: 'approved', approval: approvalBlock, trackEvent })
}

// POST /api/smokecraft/ticket-tapper/specials/:specialId/reject
export async function rejectSpecial(req, res) {
  const { specialId } = req.params
  const { venueId, reviewedBy, approval } = req.body
  if (!reviewedBy?.role) return res.status(400).json({ ok: false, error: 'reviewedBy required' })
  if (!canApprove(reviewedBy.role)) {
    return res.status(403).json({ ok: false, error: 'SPECIAL_APPROVAL_REQUIRED', message: 'This role cannot reject specials.' })
  }

  const now = new Date().toISOString()
  const rejectionReason = approval?.rejectionReason || 'Rejected by management.'
  const trackEvent = makeTrackEvent(venueId, specialId, 'special_rejected', reviewedBy)
  trackEvent.approvalStatus = 'rejected'

  if (isDbAvailable()) {
    try {
      await query(`UPDATE ticket_tapper_specials SET status = 'rejected', approval_json = jsonb_set(COALESCE(approval_json,'{}'), '{status}', '"rejected"') WHERE special_id = $1`, [specialId])
      await query(`INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, staff_id, staff_role, approval_status, source_screen, event_timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [trackEvent.id, venueId, specialId, 'special_rejected', reviewedBy.staffId, reviewedBy.role, 'rejected', 'staff_specials_control_panel', now])
      return res.json({ ok: true, specialId, status: 'rejected', rejectionReason, trackEvent, storageMode: 'postgres' })
    } catch (err) { console.error('[ticketTapperSpecials] rejectSpecial DB error:', err.message) }
  }
  res.json({ ok: true, localPreview: true, specialId, status: 'rejected', rejectionReason, trackEvent })
}

// POST /api/smokecraft/ticket-tapper/specials/:specialId/publish
export async function publishSpecial(req, res) {
  const { specialId } = req.params
  const { venueId, publishedBy } = req.body
  if (!publishedBy?.role) return res.status(400).json({ ok: false, error: 'publishedBy required' })
  if (!canApprove(publishedBy.role)) {
    return res.status(403).json({ ok: false, error: 'SPECIAL_APPROVAL_REQUIRED', message: 'This role can submit specials for management approval but cannot publish them live.' })
  }

  const now = new Date().toISOString()
  const trackEvent = makeTrackEvent(venueId, specialId, 'special_published_live', publishedBy)
  trackEvent.approvalStatus = 'approved'

  if (isDbAvailable()) {
    try {
      // Verify the special is approved before allowing publish
      const { rows } = await query(`SELECT status, approval_json FROM ticket_tapper_specials WHERE special_id = $1`, [specialId])
      if (!rows[0]) return res.status(404).json({ ok: false, error: 'Special not found' })
      const currentStatus = rows[0].status
      const approval = typeof rows[0].approval_json === 'string' ? JSON.parse(rows[0].approval_json) : rows[0].approval_json
      if (currentStatus !== 'approved' && approval?.status !== 'approved' && !canApprove(publishedBy.role)) {
        return res.status(409).json({ ok: false, error: 'SPECIAL_NOT_APPROVED', message: 'This special must be approved by management before it can go live.' })
      }
      await query(`UPDATE ticket_tapper_specials SET status = 'active', approval_json = jsonb_set(COALESCE(approval_json,'{}'), '{status}', '"approved"') WHERE special_id = $1`, [specialId])
      await query(`INSERT INTO ticket_tapper_special_events (event_id, venue_id, special_id, action, staff_id, staff_role, approval_status, source_screen, event_timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [trackEvent.id, venueId, specialId, 'special_published_live', publishedBy.staffId, publishedBy.role, 'approved', 'staff_specials_control_panel', now])
      return res.json({ ok: true, specialId, status: 'active', publishedAt: now, trackEvent, storageMode: 'postgres' })
    } catch (err) { console.error('[ticketTapperSpecials] publishSpecial DB error:', err.message) }
  }
  res.json({ ok: true, localPreview: true, specialId, status: 'active', publishedAt: now, trackEvent })
}

// GET /api/smokecraft/ticket-tapper/specials-approval-queue/:venueId
export async function getApprovalQueue(req, res) {
  const { venueId } = req.params

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT * FROM ticket_tapper_specials WHERE venue_id = $1 AND status IN ('pending_approval','approved') ORDER BY created_at ASC`,
        [venueId]
      )
      return res.json({ ok: true, queue: rows, storageMode: 'postgres' })
    } catch (err) { console.error('[ticketTapperSpecials] getApprovalQueue DB error:', err.message) }
  }
  res.json({ ok: true, localPreview: true, storageMode: 'memory_fallback', queue: [], message: 'Approval queue unavailable — backend not connected.' })
}

// POST /api/smokecraft/ticket-tapper/specials/:specialId/add-to-cart
export async function addToCart(req, res) {
  const { specialId } = req.params
  const { venueId, cartId, quantity = 1, customerSessionId } = req.body
  if (!venueId || !specialId) return res.status(400).json({ ok: false, error: 'venueId and specialId required' })

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT * FROM ticket_tapper_specials WHERE special_id = $1 AND venue_id = $2 LIMIT 1`,
        [specialId, venueId]
      )
      const special = rows[0]
      if (!special) return res.status(404).json({ ok: false, error: 'Special not found' })
      if (special.status !== 'active') return res.status(409).json({ ok: false, error: 'Special is not active', status: special.status })
      if (special.active_quantity !== null && special.active_quantity <= 0) {
        return res.status(409).json({ ok: false, error: 'sold_out', message: 'This special is sold out.' })
      }
      return res.json({
        ok: true,
        specialId,
        cartId,
        quantity,
        addedToCart: true,
        storageMode: 'postgres',
        routingStatus: 'route_pending',
        settlementStatus: 'pending_preview',
      })
    } catch (err) {
      console.error('[ticketTapperSpecials] addToCart DB error:', err.message)
    }
  }

  res.json({
    ok: true,
    specialId,
    cartId,
    quantity,
    addedToCart: true,
    localPreview: true,
    storageMode: 'memory_fallback',
    persistenceStatus: 'not_persisted',
    routingStatus: 'routing_preview',
    settlementStatus: 'pending_preview',
    message: 'Added to cart locally. Not persisted — backend unavailable.',
  })
}

// POST /api/smokecraft/ticket-tapper/inventory/sync-request
export async function requestInventorySync(req, res) {
  const { venueId } = req.body
  if (!venueId) return res.status(400).json({ ok: false, error: 'venueId required' })

  const { requestInventorySync: doSync } = await import('../services/posInventoryAdapter.js')
  const result = await doSync(venueId)
  res.json(result)
}

// GET /api/smokecraft/ticket-tapper/venue-feature-settings
export async function getVenueFeatureSettings(req, res) {
  const { venueId } = req.query
  if (!venueId) return res.status(400).json({ ok: false, error: 'venueId required' })

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM venue_feature_settings WHERE venue_id = $1 LIMIT 1',
        [venueId]
      )
      if (rows[0]) {
        const { resolveFeatureStatus } = await import('../../src/utils/venueFeatureSettings.js')
        return res.json({ ok: true, settings: resolveFeatureStatus(rows[0]), storageMode: 'postgres' })
      }
    } catch (err) {
      console.error('[ticketTapperSpecials] getVenueFeatureSettings DB error:', err.message)
    }
  }

  const { defaultFeatureSettings } = await import('../../src/utils/venueFeatureSettings.js')
  res.json({
    ok: true,
    settings: defaultFeatureSettings(venueId),
    storageMode: 'memory_fallback',
    syncMode: 'preview_fallback',
    message: 'Venue feature settings not found. Returning defaults.',
  })
}

// PATCH /api/smokecraft/ticket-tapper/venue-feature-settings
export async function updateVenueFeatureSettings(req, res) {
  const { venueId, action, enabledBy, cancelledBy } = req.body
  if (!venueId || !action) return res.status(400).json({ ok: false, error: 'venueId and action required' })

  const { enableVenuePartnerSpecials, requestCancellation } = await import('../services/eatCommandHubContract.js')
  const db = isDbAvailable() ? { query } : null

  if (action === 'enable') {
    const result = await enableVenuePartnerSpecials(venueId, enabledBy, db)
    return res.json(result)
  }
  if (action === 'cancel') {
    const result = await requestCancellation(venueId, cancelledBy, db)
    return res.json(result)
  }

  res.status(400).json({ ok: false, error: 'Unknown action. Use enable or cancel.' })
}

// GET /api/smokecraft/ticket-tapper/money-bridge/preview
export async function getMoneyBridgePreview(req, res) {
  const { venueId, partnerFoodSubtotal = 0, deliveryFee = 4.50 } = req.query

  const subtotal = parseFloat(partnerFoodSubtotal) || 0
  const delivery = parseFloat(deliveryFee) || 4.50
  const TAX_PREVIEW = 0.085

  const sc = roundMoney(subtotal * 0.10)
  const vr = roundMoney(subtotal * 0.05)
  const pp = roundMoney(subtotal * 0.85)
  const taxableBase = roundMoney(subtotal)
  const tax = roundMoney(taxableBase * TAX_PREVIEW)
  const total = roundMoney(subtotal + delivery + tax)

  res.json({
    ok: true,
    venueId,
    partnerFoodSubtotal: subtotal,
    smokeCraftCommissionRate: 0.10,
    smokeCraftCommissionAmount: sc,
    venueReferralRate: 0.05,
    venueReferralAmount: vr,
    partnerPayoutRate: 0.85,
    partnerPayoutAmount: pp,
    deliveryRoutingFee: delivery,
    taxableBase,
    taxRate: TAX_PREVIEW,
    taxAmount: tax,
    taxStatus: 'preview_only',
    totalCustomerCharge: total,
    settlementStatus: 'pending_preview',
    settlementProcessorStatus: 'integration_required',
    note: 'Preview calculation only. Tax, settlement, and commission not finalized.',
  })
}

// POST /api/smokecraft/ticket-tapper/kitchen-routing/preview
export async function getKitchenRoutingPreview(req, res) {
  const { orderId, items = [], venueId, staffId } = req.body
  if (!orderId) return res.status(400).json({ ok: false, error: 'orderId required' })

  const { createRoutingTicket } = await import('../services/kitchenRoutingAdapter.js')
  const result = await createRoutingTicket({ orderId, items, venueId, staffId })
  res.json(result)
}
