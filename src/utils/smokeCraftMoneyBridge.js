import { MONEY_BRIDGE_RATES } from '../data/smokeCraftVenueCommerce.js'

export function roundMoney(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Calculate the full Money Bridge breakdown for a cart.
 * partnerItems: array of { item_id, partnerId, item_name, price, quantity }
 * venueItems: array of { item_id, item_name, price, quantity } (cigars, bar, etc.)
 */
export function calculateSmokeCraftMoneyBridge({ venueItems = [], partnerItems = [] } = {}) {
  const r = MONEY_BRIDGE_RATES

  const venueSubtotal = venueItems.reduce((s, i) => s + i.price * (i.quantity || 1), 0)
  const partnerSubtotal = partnerItems.reduce((s, i) => s + i.price * (i.quantity || 1), 0)

  const hasPartnerItems = partnerItems.length > 0

  const deliveryFee = hasPartnerItems ? r.deliveryExpenseFee : 0

  const partnerServiceFee = roundMoney(partnerSubtotal * (r.serviceFeePercent / 100))
  const partnerVenueRoutingFee = roundMoney(partnerSubtotal * (r.venueRoutingFeePercent / 100))

  const taxableBase = venueSubtotal + partnerSubtotal + deliveryFee
  const tax = roundMoney(taxableBase * r.taxRate)

  const total = roundMoney(venueSubtotal + partnerSubtotal + deliveryFee + tax)

  // Per-partner breakdown
  const partnerBreakdown = []
  const partnerMap = {}
  for (const item of partnerItems) {
    if (!partnerMap[item.partnerId]) partnerMap[item.partnerId] = { partnerId: item.partnerId, items: [], subtotal: 0 }
    partnerMap[item.partnerId].items.push(item)
    partnerMap[item.partnerId].subtotal += item.price * (item.quantity || 1)
  }
  for (const pid of Object.keys(partnerMap)) {
    const p = partnerMap[pid]
    const sc = roundMoney(p.subtotal * (r.smokeCraftCommissionPercent / 100))
    const vr = roundMoney(p.subtotal * (r.venueReferralPercent / 100))
    const payout = roundMoney(p.subtotal * (r.partnerPayoutPercent / 100))
    partnerBreakdown.push({
      partnerId: p.partnerId,
      subtotal: roundMoney(p.subtotal),
      smokeCraftCommission: sc,
      venueReferral: vr,
      partnerPayout: payout,
      settlementStatus: 'pending',
    })
  }

  const smokeCraftTotalCommission = roundMoney(partnerBreakdown.reduce((s, p) => s + p.smokeCraftCommission, 0))
  const venueTotalReferral = roundMoney(partnerBreakdown.reduce((s, p) => s + p.venueReferral, 0))
  const partnerTotalPayout = roundMoney(partnerBreakdown.reduce((s, p) => s + p.partnerPayout, 0))

  return {
    venueSubtotal: roundMoney(venueSubtotal),
    partnerSubtotal: roundMoney(partnerSubtotal),
    deliveryFee: roundMoney(deliveryFee),
    partnerServiceFee,
    partnerVenueRoutingFee,
    tax,
    total,
    hasPartnerItems,
    moneyBridgeActive: hasPartnerItems,
    smokeCraftTotalCommission,
    venueTotalReferral,
    partnerTotalPayout,
    partnerBreakdown,
    rates: {
      smokeCraftCommissionPercent: r.smokeCraftCommissionPercent,
      venueReferralPercent: r.venueReferralPercent,
      partnerPayoutPercent: r.partnerPayoutPercent,
      taxRate: r.taxRate,
    },
  }
}
