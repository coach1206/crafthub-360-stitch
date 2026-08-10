import { MONEY_BRIDGE_RATES } from '../data/smokeCraftVenueCommerce.js'
import { resolveTaxConfig, calculateTax } from './smokeCraftTaxConfig.js'

export function roundMoney(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Calculate the full Money Bridge breakdown for a cart.
 * partnerItems: array of { item_id, partnerId, item_name, price, quantity }
 * venueItems: array of { item_id, item_name, price, quantity } (cigars, bar, etc.)
 */
export function calculateSmokeCraftMoneyBridge({ venueItems = [], partnerItems = [], venueTaxConfig = null } = {}) {
  const r = MONEY_BRIDGE_RATES

  const venueSubtotal = venueItems.reduce((s, i) => s + i.price * (i.quantity || 1), 0)
  const partnerSubtotal = partnerItems.reduce((s, i) => s + i.price * (i.quantity || 1), 0)

  const hasPartnerItems = partnerItems.length > 0

  const deliveryFee = hasPartnerItems ? r.deliveryExpenseFee : 0

  const partnerServiceFee = roundMoney(partnerSubtotal * (r.serviceFeePercent / 100))
  const partnerVenueRoutingFee = roundMoney(partnerSubtotal * (r.venueRoutingFeePercent / 100))

  // Tax via config contract
  const taxConfig = resolveTaxConfig(venueTaxConfig ?? null)
  const taxableBase = venueSubtotal + partnerSubtotal
    + (taxConfig.deliveryFeeTaxable ? deliveryFee : 0)
  const taxCalc = calculateTax({ taxableBase, taxConfig })
  const tax = taxCalc.taxAmount
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
      smokeCraftCommissionRate: r.smokeCraftCommissionPercent / 100,
      smokeCraftCommissionAmount: sc,
      venueReferralRate: r.venueReferralPercent / 100,
      venueReferralAmount: vr,
      partnerPayoutRate: r.partnerPayoutPercent / 100,
      partnerPayoutAmount: payout,
      settlementStatus: 'pending_preview',
      settlementProcessorStatus: 'integration_required',
    })
  }

  const smokeCraftTotalCommission = roundMoney(partnerBreakdown.reduce((s, p) => s + p.smokeCraftCommissionAmount, 0))
  const venueTotalReferral = roundMoney(partnerBreakdown.reduce((s, p) => s + p.venueReferralAmount, 0))
  const partnerTotalPayout = roundMoney(partnerBreakdown.reduce((s, p) => s + p.partnerPayoutAmount, 0))

  return {
    venueSubtotal: roundMoney(venueSubtotal),
    partnerFoodSubtotal: roundMoney(partnerSubtotal),
    partnerSubtotal: roundMoney(partnerSubtotal),
    deliveryRoutingFee: roundMoney(deliveryFee),
    deliveryFee: roundMoney(deliveryFee),
    partnerServiceFee,
    partnerVenueRoutingFee,
    taxableBase: taxCalc.taxableBase,
    taxRate: taxCalc.taxRate,
    taxAmount: tax,
    tax,
    taxStatus: taxCalc.taxStatus,
    taxConfigNote: taxCalc.taxConfigNote,
    totalCustomerCharge: total,
    total,
    hasPartnerItems,
    moneyBridgeActive: hasPartnerItems,
    smokeCraftCommissionRate: r.smokeCraftCommissionPercent / 100,
    smokeCraftTotalCommission,
    smokeCraftCommissionAmount: smokeCraftTotalCommission,
    venueReferralRate: r.venueReferralPercent / 100,
    venueTotalReferral,
    venueReferralAmount: venueTotalReferral,
    partnerPayoutRate: r.partnerPayoutPercent / 100,
    partnerTotalPayout,
    partnerPayoutAmount: partnerTotalPayout,
    settlementStatus: 'pending_preview',
    settlementProcessorStatus: 'integration_required',
    partnerBreakdown,
    rates: {
      smokeCraftCommissionPercent: r.smokeCraftCommissionPercent,
      venueReferralPercent: r.venueReferralPercent,
      partnerPayoutPercent: r.partnerPayoutPercent,
      taxRate: taxCalc.taxRate,
      taxStatus: taxCalc.taxStatus,
    },
  }
}
