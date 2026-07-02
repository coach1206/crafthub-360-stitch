/**
 * Tax Compliance Readiness Engine
 * Scores tax readiness and reports blockers.
 * Does not provide legal tax advice or guarantee tax compliance.
 */

import { getTaxReadiness, getVenueTaxProfile, getVenueTaxJurisdictions,
  getVenueTaxCategories, getVenueTaxRules, getPartnerVendorTaxProfile } from './taxConfigService.js'

export async function getVenueTaxComplianceReadiness(venueId) {
  const [profile, jurisdictions, categories, rules] = await Promise.all([
    getVenueTaxProfile(venueId),
    getVenueTaxJurisdictions(venueId),
    getVenueTaxCategories(venueId),
    getVenueTaxRules(venueId),
  ])

  const blockers = []
  if (!profile.profile) blockers.push({ type: 'tax_profile_required', severity: 'critical' })
  if (jurisdictions.jurisdictions.length === 0) blockers.push({ type: 'jurisdiction_required', severity: 'critical' })
  if (categories.categories.length === 0) blockers.push({ type: 'tax_category_required', severity: 'warning' })
  if (rules.rules.length === 0) blockers.push({ type: 'tax_rule_missing', severity: 'warning' })
  if (!process.env.DATABASE_URL) blockers.push({ type: 'database_required', severity: 'warning' })
  if (!(process.env.STRIPE_SECRET_KEY)) blockers.push({ type: 'payment_processor_required', severity: 'info' })

  const alwaysBlocked = { type: 'compliance_review_required', severity: 'info',
    message: 'Tax compliance requires CPA/legal review before any live tax collection.' }

  return {
    venueId,
    taxReadinessStatus: blockers.length === 0 ? 'tax_estimate' : 'tax_preview',
    blockers: [...blockers, alwaysBlocked],
    profileStatus: profile.taxProfileStatus,
    jurisdictionStatus: jurisdictions.jurisdictionStatus,
    categoryStatus: categories.categoryStatus,
    ruleStatus: rules.ruleStatus,
    complianceNote: 'This engine supports tax calculation previews and readiness checks, but it does not provide legal tax advice or guarantee tax compliance.',
    storageMode: 'memory_fallback',
  }
}

export async function getPartnerTaxComplianceReadiness(partnerId, venueId = null) {
  const partnerProfile = await getPartnerVendorTaxProfile(partnerId, venueId)
  const venueReadiness = venueId ? await getVenueTaxComplianceReadiness(venueId) : null

  const blockers = []
  if (!partnerProfile.profile) blockers.push({ type: 'partner_tax_profile_required', severity: 'critical' })
  if (partnerProfile.merchantOfRecordStatus === 'merchant_of_record_required') {
    blockers.push({ type: 'merchant_of_record_required', severity: 'critical' })
  }

  return {
    partnerId,
    venueId,
    partnerTaxProfileStatus: partnerProfile.partnerTaxProfileStatus,
    merchantOfRecordStatus: partnerProfile.merchantOfRecordStatus,
    blockers,
    venueBlockers: venueReadiness?.blockers ?? [],
    taxReadinessStatus: blockers.length === 0 ? 'tax_estimate' : 'tax_preview',
    complianceNote: 'Partner tax compliance requires CPA/legal review before any live tax collection.',
  }
}

export async function getOrderTaxReadiness(orderPayload) {
  const venueId = orderPayload?.venueId
  if (!venueId) return { ready: false, taxStatus: 'tax_config_required', blockers: [{ type: 'tax_config_required', severity: 'critical' }] }

  const readiness = await getTaxReadiness(venueId)
  return {
    venueId,
    ready: readiness.ready,
    taxStatus: readiness.taxReadinessStatus,
    blockers: readiness.blockers,
    taxNote: readiness.ready
      ? 'Tax rules found. Order tax calculation available as estimate only.'
      : 'Tax preview mode. Rules or jurisdiction not fully configured.',
  }
}

export async function getTaxComplianceBlockers(venueId, partnerId = null) {
  const readiness = await getTaxReadiness(venueId, partnerId)
  return {
    venueId,
    partnerId,
    blockers: readiness.blockers,
    blockCount: readiness.blockers.length,
    criticalCount: 0,
    taxReadinessStatus: readiness.taxReadinessStatus,
  }
}

export async function buildTaxReadinessScore(venueId, partnerId = null) {
  const [profile, jurisdictions, categories, rules] = await Promise.all([
    getVenueTaxProfile(venueId),
    getVenueTaxJurisdictions(venueId),
    getVenueTaxCategories(venueId),
    getVenueTaxRules(venueId),
  ])

  const checks = [
    { key: 'tax_profile', pass: !!profile.profile, points: 25 },
    { key: 'jurisdiction', pass: jurisdictions.jurisdictions.length > 0, points: 25 },
    { key: 'tax_categories', pass: categories.categories.length > 0, points: 25 },
    { key: 'tax_rules', pass: rules.rules.length > 0, points: 25 },
  ]

  let score = 0
  for (const c of checks) { if (c.pass) score += c.points }

  return {
    venueId,
    partnerId,
    taxReadinessScore: score,
    maxScore: 100,
    checks,
    taxReadinessStatus: score === 100 ? 'tax_estimate' : 'tax_preview',
    complianceNote: 'Score of 100/100 does not imply legal compliance. CPA review is still required.',
  }
}
