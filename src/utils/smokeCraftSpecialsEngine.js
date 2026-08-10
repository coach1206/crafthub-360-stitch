/**
 * SmokeCraft Specials Engine
 * Core logic for Ticket Tapper Real-Time Specials.
 * Real-Time Ready — attach WebSocket/Supabase realtime here when available.
 */

// ── Approval role constants ───────────────────────────────────────────────────

export const SPECIAL_APPROVAL_ROLES = ['manager', 'owner', 'admin']

export const SPECIAL_SUGGESTION_ROLES = ['bartender', 'chef', 'cook', 'server']

export function canCreateSpecial(role) {
  return ['manager', 'owner', 'admin', 'bartender', 'chef', 'cook', 'server'].includes(role)
}

export function canApproveSpecial(role) {
  return SPECIAL_APPROVAL_ROLES.includes(role)
}

export function canPublishSpecial(role) {
  return SPECIAL_APPROVAL_ROLES.includes(role)
}

export function getInitialSpecialStatusForRole(role) {
  if (canApproveSpecial(role)) return 'approved'
  return 'pending_approval'
}

export function canShowSpecialToCustomer(special) {
  return special?.status === 'active'
}

export function buildApprovalBlock(staff) {
  const now = new Date().toISOString()
  const requiresApproval = SPECIAL_SUGGESTION_ROLES.includes(staff.role)
  return {
    required: requiresApproval,
    status: requiresApproval ? 'pending_approval' : 'approved',
    submittedBy: { staffId: staff.staffId, name: staff.name, role: staff.role },
    submittedAt: now,
    reviewedBy: requiresApproval ? null : { staffId: staff.staffId, name: staff.name, role: staff.role },
    reviewedAt: requiresApproval ? null : now,
    approvalNote: requiresApproval ? '' : 'Manager-created special approved.',
    rejectionReason: '',
  }
}

// ── Inventory helpers ─────────────────────────────────────────────────────────

function resolveInventoryForSpecial(special, inventoryItems) {
  if (!special.inventory?.inventoryItemIds?.length) return special.inventory || {}
  const ids = special.inventory.inventoryItemIds
  // Find the binding item (lowest available across all items in the special)
  const relevant = inventoryItems.filter(i => ids.includes(i.id))
  if (relevant.length === 0) return special.inventory

  const minQty = Math.min(...relevant.map(i => i.quantityAvailable ?? special.inventory.quantityAvailable))
  const anySoldOut = relevant.some(i => i.quantityAvailable <= 0 && !i.allowOversell)
  const anyPaused = relevant.some(i => i.status === 'paused' || i.status === 'hidden')
  const lowThreshold = special.inventory.lowInventoryThreshold ?? 3

  let inventoryStatus = 'available'
  if (anyPaused) inventoryStatus = 'paused'
  else if (anySoldOut || minQty <= 0) inventoryStatus = 'sold_out'
  else if (minQty <= lowThreshold) inventoryStatus = 'low_stock'

  return {
    ...special.inventory,
    quantityAvailable: minQty,
    inventoryStatus,
  }
}

function isExpired(special) {
  if (!special.endsAt) return false
  return new Date(special.endsAt) < new Date()
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getActiveTicketTapperSpecials({ specials = [], inventoryItems = [] }) {
  return specials
    .filter(s => {
      // Only status === 'active' reaches the customer
      if (s.status !== 'active') return false
      if (isExpired(s)) return false
      // Must also have approval cleared (approved or manager-created with required: false)
      if (!canShowSpecialToCustomer(s)) return false
      const approvalOk = !s.approval?.required || s.approval?.status === 'approved'
      if (!approvalOk) return false
      return true
    })
    .map(s => enrichSpecialWithInventory({ special: s, inventoryItems }))
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
}

export function enrichSpecialWithInventory({ special, inventoryItems = [] }) {
  const resolvedInventory = resolveInventoryForSpecial(special, inventoryItems)
  return { ...special, inventory: resolvedInventory }
}

export function canOneTapOrderSpecial({ special, inventoryItems = [] }) {
  const enriched = enrichSpecialWithInventory({ special, inventoryItems })
  const inv = enriched.inventory
  if (!inv) return { allowed: true, reason: null }
  if (inv.inventoryStatus === 'sold_out') return { allowed: false, reason: 'sold_out' }
  if (inv.inventoryStatus === 'paused') return { allowed: false, reason: 'paused' }
  if (inv.inventoryStatus === 'hidden') return { allowed: false, reason: 'hidden' }
  if (inv.quantityAvailable <= 0 && !inv.allowOversell) return { allowed: false, reason: 'sold_out' }
  return { allowed: true, reason: inv.inventoryStatus === 'low_stock' ? 'low_stock' : null }
}

export function buildOneTapSpecialOrderItems({ special }) {
  return (special.items || []).map(item => ({
    item_id: item.id,
    item_name: item.name,
    price: item.unitPrice,
    quantity: item.quantity || 1,
    type: item.type,
    partnerId: item.partnerId || null,
    partnerName: item.partnerName || null,
    source: item.source || 'venue',
    commissionEligible: item.commissionEligible || false,
    isPartnerItem: item.type === 'partner_food',
    fromSpecial: true,
    specialId: special.id,
    specialTitle: special.title,
    specialPrice: special.pricing?.specialPrice,
  }))
}

export function buildSpecialTrackingEvent({ special, action, venueId, tableLabel, orderMode }) {
  const hasPartner = special.moneyBridge?.active && (special.moneyBridge?.partnerIds?.length > 0)
  const partnerItems = (special.items || []).filter(i => i.commissionEligible && i.partnerId)
  const partnerSubtotal = partnerItems.reduce((s, i) => s + (i.unitPrice || 0) * (i.quantity || 1), 0)
  const scCommission = partnerSubtotal * ((special.moneyBridge?.smokeCraftCommissionPercent || 0) / 100)
  const venueReferral = partnerSubtotal * ((special.moneyBridge?.venueReferralPercent || 0) / 100)
  const partnerPayout = partnerSubtotal - scCommission - venueReferral

  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}`,
    eventType: 'special_tracking',
    action,
    venueId,
    tableLabel,
    specialId: special.id,
    specialTitle: special.title,
    specialType: special.specialType,
    promotedByRole: special.promotedByRole,
    staffId: special.createdBy?.staffId,
    staffRole: special.createdBy?.role,
    orderMode: orderMode || 'customer_self_order',
    source: special.source,
    hasPartnerItems: hasPartner,
    partnerIds: special.moneyBridge?.partnerIds || [],
    partnerSubtotal: Math.round(partnerSubtotal * 100) / 100,
    smokeCraftCommission: Math.round(scCommission * 100) / 100,
    venueReferralCommission: Math.round(venueReferral * 100) / 100,
    partnerEstimatedPayout: Math.round(partnerPayout * 100) / 100,
    settlementStatus: hasPartner ? 'pending_preview' : 'not_partner_related',
    inventoryStatus: special.inventory?.inventoryStatus || 'available',
    timestamp: new Date().toISOString(),
  }
}

export function updateInventoryAfterSpecialAdd({ inventoryItems = [], special }) {
  if (!special.inventory?.inventoryItemIds?.length) return inventoryItems
  const ids = special.inventory.inventoryItemIds
  const totalQty = (special.items || []).reduce((s, i) => s + (i.quantity || 1), 0)

  return inventoryItems.map(item => {
    if (!ids.includes(item.id)) return item
    const newQty = Math.max(0, (item.quantityAvailable ?? 0) - totalQty)
    let newStatus = item.status
    if (newQty <= 0 && !item.allowOversell) newStatus = 'sold_out'
    else if (newQty <= (item.lowInventoryThreshold ?? 3)) newStatus = 'low_stock'
    return { ...item, quantityAvailable: newQty, quantitySold: (item.quantitySold || 0) + totalQty, status: newStatus }
  })
}
