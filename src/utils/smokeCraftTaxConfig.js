/**
 * Tax Config Contract — SmokeCraft / Ticket Tapper
 *
 * If a real venue/state tax profile exists → calculate from it.
 * If not → use fallback preview rate and label taxStatus: "preview_only".
 * Never claim final tax compliance.
 */

const FALLBACK_PREVIEW_RATE = 0.085

// Known state base rates (approximations only — not for final tax compliance)
const STATE_PREVIEW_RATES = {
  TX: 0.0625,
  CA: 0.0725,
  NY: 0.04,
  FL: 0.06,
  IL: 0.0625,
  WA: 0.065,
  NV: 0.0685,
  CO: 0.029,
}

/**
 * Resolve tax config for a venue.
 * @param {object} venueConfig — from venue_tax_config table or null
 * @returns {object} resolved tax config with taxStatus
 */
export function resolveTaxConfig(venueConfig = null) {
  if (!venueConfig) {
    return {
      taxRate: FALLBACK_PREVIEW_RATE,
      taxStatus: 'preview_only',
      partnerFoodTaxable: true,
      deliveryFeeTaxable: false,
      taxableBaseRules: null,
      note: 'No venue tax config found. Preview rate applied. Not tax-compliant.',
    }
  }

  const rate = venueConfig.combined_tax_rate
    ?? venueConfig.local_tax_rate
    ?? (venueConfig.state ? STATE_PREVIEW_RATES[venueConfig.state] : null)
    ?? venueConfig.fallback_preview_rate
    ?? FALLBACK_PREVIEW_RATE

  const isVerified = venueConfig.is_verified === true

  return {
    taxRate: rate,
    taxStatus: isVerified ? 'venue_config' : 'preview_only',
    partnerFoodTaxable: venueConfig.partner_food_taxable ?? true,
    deliveryFeeTaxable: venueConfig.delivery_fee_taxable ?? false,
    taxableBaseRules: venueConfig.taxable_base_rules ?? null,
    state: venueConfig.state ?? null,
    note: isVerified
      ? `Verified venue tax config (${venueConfig.state ?? 'unknown state'}).`
      : 'Unverified venue config. Preview rate applied. Not tax-compliant.',
  }
}

/**
 * Calculate tax amount given a base and config.
 */
export function calculateTax({ taxableBase, taxConfig }) {
  const { taxRate, taxStatus, partnerFoodTaxable, deliveryFeeTaxable, note } = taxConfig
  const base = typeof taxableBase === 'number' ? taxableBase : 0
  const taxAmount = Math.round(base * taxRate * 100) / 100

  return {
    taxableBase: base,
    taxRate,
    taxAmount,
    taxStatus,
    partnerFoodTaxable,
    deliveryFeeTaxable,
    taxConfigNote: note,
  }
}

export { FALLBACK_PREVIEW_RATE }
