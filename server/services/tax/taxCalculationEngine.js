/**
 * Tax Calculation Engine
 * Calculates order tax previews and estimates.
 * Does not guarantee tax compliance or legal accuracy.
 */

import { getVenueTaxRules, getVenueTaxJurisdictions, getVenueTaxCategories } from './taxConfigService.js'

const FALLBACK_TAX_RATE = 0.085 // 8.5% preview fallback — NOT a legal default

const CATEGORY_MAP = {
  cigar: 'cigar',
  tobacco: 'tobacco',
  cigarettes: 'tobacco',
  alcohol: 'alcohol',
  beer: 'alcohol',
  wine: 'alcohol',
  spirits: 'alcohol',
  food: 'food',
  sandwich: 'food',
  snack: 'food',
  beverage: 'beverage',
  drink: 'beverage',
  coffee: 'beverage',
  merchandise: 'merchandise',
  merch: 'merchandise',
  apparel: 'merchandise',
  ticket: 'ticket',
  event: 'event_admission',
  event_admission: 'event_admission',
  service: 'service_fee',
  delivery: 'delivery_fee',
  membership: 'membership',
  tasting: 'tasting_flight',
}

export function getTaxCategoryForItem(item) {
  const type = (item.productType ?? item.product_type ?? item.category ?? item.type ?? '').toLowerCase()
  for (const [key, code] of Object.entries(CATEGORY_MAP)) {
    if (type.includes(key)) return code
  }
  return 'general'
}

export function validateTaxCalculationInput(orderPayload) {
  const errors = []
  if (!orderPayload) { errors.push('orderPayload is required'); return { valid: false, errors } }
  if (!orderPayload.venueId) errors.push('venueId is required')

  const allItems = [...(orderPayload.venueItems ?? []), ...(orderPayload.partnerItems ?? [])]
  for (const item of allItems) {
    if (item.price !== undefined && item.price < 0) errors.push(`Negative price on item: ${item.name ?? item.id}`)
    if (item.quantity !== undefined && item.quantity < 0) errors.push(`Negative quantity on item: ${item.name ?? item.id}`)
  }

  return { valid: errors.length === 0, errors }
}

function toCents(val) { return Math.round((val ?? 0) * 100) }

export async function calculateLineItemTax(lineItem, taxRules) {
  const categoryCode = getTaxCategoryForItem(lineItem)
  const priceCents = lineItem.priceCents ?? toCents(lineItem.price ?? 0)
  const quantity = lineItem.quantity ?? 1
  const subtotalCents = priceCents * quantity

  if (!taxRules || taxRules.length === 0) {
    return {
      categoryCode,
      subtotalCents,
      taxableAmountCents: subtotalCents,
      taxAmountCents: Math.round(subtotalCents * FALLBACK_TAX_RATE),
      taxRate: FALLBACK_TAX_RATE,
      taxStatus: 'tax_preview',
      taxNote: 'No tax rules found. Preview rate applied.',
    }
  }

  const rule = taxRules.find(r => r.category_code === categoryCode)
    ?? taxRules.find(r => r.category_code === 'general')

  if (!rule) {
    return {
      categoryCode,
      subtotalCents,
      taxableAmountCents: subtotalCents,
      taxAmountCents: Math.round(subtotalCents * FALLBACK_TAX_RATE),
      taxRate: FALLBACK_TAX_RATE,
      taxStatus: 'tax_rule_missing',
      taxNote: `No rule for category ${categoryCode}. Preview rate applied.`,
    }
  }

  if (rule.included_in_price) {
    return {
      categoryCode,
      subtotalCents,
      taxableAmountCents: subtotalCents,
      taxAmountCents: 0,
      taxRate: rule.tax_rate ?? 0,
      taxStatus: 'tax_calculation_ready',
      taxNote: 'Tax included in price.',
    }
  }

  const rate = rule.tax_rate ?? FALLBACK_TAX_RATE
  const taxAmountCents = rule.rate_basis === 'fixed'
    ? (rule.fixed_fee ?? 0) * quantity
    : Math.round(subtotalCents * rate)

  return {
    categoryCode,
    subtotalCents,
    taxableAmountCents: subtotalCents,
    taxAmountCents,
    taxRate: rate,
    taxStatus: 'tax_calculation_ready',
    taxNote: 'Tax rule applied.',
  }
}

export async function calculateFeeTax(fee, taxRules) {
  const feeType = fee.feeType ?? 'delivery_fee'
  const amountCents = fee.amountCents ?? toCents(fee.amount ?? 0)
  const rule = taxRules?.find(r => r.category_code === feeType || r.category_code === 'service_fee')

  if (!rule) {
    return {
      feeType,
      feeAmountCents: amountCents,
      taxAmountCents: 0,
      taxStatus: 'tax_rule_missing',
      taxNote: `No rule for fee type ${feeType}. Fee tax not applied.`,
    }
  }

  const rate = rule.tax_rate ?? 0
  const taxAmountCents = rule.included_in_price ? 0 : Math.round(amountCents * rate)
  return {
    feeType,
    feeAmountCents: amountCents,
    taxAmountCents,
    taxStatus: 'tax_calculation_ready',
    taxNote: 'Fee tax rule applied.',
  }
}

export async function calculateOrderTax(orderPayload, taxContext = {}) {
  const validation = validateTaxCalculationInput(orderPayload)
  if (!validation.valid) {
    return { ok: false, errors: validation.errors, taxStatus: 'tax_config_required' }
  }

  const { venueId } = orderPayload
  const taxRules = taxContext.rules ?? (await getVenueTaxRules(venueId)).rules
  const jurisdictions = taxContext.jurisdictions ?? (await getVenueTaxJurisdictions(venueId)).jurisdictions

  const venueItems = orderPayload.venueItems ?? []
  const partnerItems = orderPayload.partnerItems ?? []
  const fees = orderPayload.fees ?? []

  let totalSubtotalCents = 0
  let totalTaxableAmountCents = 0
  let totalItemTaxCents = 0
  const lineResults = []
  let overallTaxStatus = 'tax_calculation_ready'

  for (const item of [...venueItems, ...partnerItems]) {
    const result = await calculateLineItemTax(item, taxRules)
    lineResults.push({ ...item, tax: result })
    totalSubtotalCents += result.subtotalCents
    totalTaxableAmountCents += result.taxableAmountCents
    totalItemTaxCents += result.taxAmountCents
    if (result.taxStatus !== 'tax_calculation_ready') overallTaxStatus = result.taxStatus
  }

  let totalFeeTaxCents = 0
  const feeResults = []
  for (const fee of fees) {
    const result = await calculateFeeTax(fee, taxRules)
    feeResults.push({ ...fee, tax: result })
    totalFeeTaxCents += result.taxAmountCents
  }

  if (jurisdictions.length === 0) overallTaxStatus = 'jurisdiction_required'
  if (!taxRules || taxRules.length === 0) overallTaxStatus = 'tax_preview'

  const totalTaxCents = totalItemTaxCents + totalFeeTaxCents
  const totalAmountCents = totalSubtotalCents + totalTaxCents

  return {
    ok: true,
    venueId,
    taxStatus: overallTaxStatus,
    subtotalCents: totalSubtotalCents,
    taxableAmountCents: totalTaxableAmountCents,
    itemTaxCents: totalItemTaxCents,
    feeTaxCents: totalFeeTaxCents,
    totalTaxCents,
    totalAmountCents,
    lineResults,
    feeResults,
    jurisdictionCount: jurisdictions.length,
    ruleCount: taxRules.length,
    taxNote: overallTaxStatus === 'tax_calculation_ready'
      ? 'Tax calculated from venue rules. Not legally certified.'
      : 'Tax preview only. Rules or jurisdiction missing.',
  }
}

export async function buildTaxPreview(orderPayload, taxContext = {}) {
  const result = await calculateOrderTax(orderPayload, taxContext)
  return {
    ...result,
    taxPreviewMode: true,
    taxStatus: result.taxStatus === 'tax_calculation_ready' ? 'tax_estimate' : result.taxStatus,
    taxNote: 'This is a tax preview only. It does not guarantee tax compliance or legal accuracy.',
    complianceStatus: 'compliance_review_required',
  }
}

export function buildTaxCalculationSnapshot(orderPayload, taxContext, result) {
  return {
    snapshotAt: new Date().toISOString(),
    venueId: orderPayload.venueId,
    taxStatus: result.taxStatus,
    subtotalCents: result.subtotalCents,
    totalTaxCents: result.totalTaxCents,
    totalAmountCents: result.totalAmountCents,
    jurisdictionSnapshot: taxContext.jurisdictions ?? [],
    ruleSnapshot: taxContext.rules ?? [],
    lineItemSnapshot: result.lineResults ?? [],
  }
}
