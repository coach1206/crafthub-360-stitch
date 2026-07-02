/**
 * Tax Config Service
 * Manages venue and partner tax profiles, jurisdictions, categories, and rules.
 * Preview mode — does not guarantee tax compliance.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const taxProfileStore = new Map()
const taxJurisdictionStore = new Map()
const taxCategoryStore = new Map()
const taxRuleStore = new Map()
const partnerTaxProfileStore = new Map()

// ── Venue Tax Profile ─────────────────────────────────────────────────────

export async function getVenueTaxProfile(venueId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query('SELECT * FROM venue_tax_profiles WHERE venue_id=$1 LIMIT 1', [venueId])
      if (rows[0]) return { ok: true, profile: rows[0], taxProfileStatus: rows[0].profile_status, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const profile = taxProfileStore.get(venueId) ?? null
  return {
    ok: true,
    profile,
    taxProfileStatus: profile?.profile_status ?? 'tax_profile_required',
    storageMode: 'memory_fallback',
  }
}

export async function createOrUpdateVenueTaxProfile(venueId, payload) {
  const existing = (await getVenueTaxProfile(venueId)).profile ?? { venue_id: venueId }
  const updated = {
    ...existing,
    ...payload,
    venue_id: venueId,
    profile_status: payload.profileStatus ?? existing.profile_status ?? 'tax_config_required',
    tax_collection_status: payload.taxCollectionStatus ?? existing.tax_collection_status ?? 'tax_collection_pending',
    business_tax_id_status: payload.businessTaxIdStatus ?? existing.business_tax_id_status ?? 'tax_id_not_verified',
    compliance_review_status: payload.complianceReviewStatus ?? existing.compliance_review_status ?? 'compliance_review_required',
    updated_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO venue_tax_profiles
           (venue_id, profile_status, tax_collection_status, default_state, default_city, default_county,
            business_tax_id_status, compliance_review_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (venue_id) DO UPDATE SET
           profile_status=EXCLUDED.profile_status,
           tax_collection_status=EXCLUDED.tax_collection_status,
           updated_at=NOW()`,
        [venueId, updated.profile_status, updated.tax_collection_status,
         updated.default_state ?? null, updated.default_city ?? null, updated.default_county ?? null,
         updated.business_tax_id_status, updated.compliance_review_status]
      )
      return { ok: true, profile: updated, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  taxProfileStore.set(venueId, updated)
  return { ok: true, profile: updated, storageMode: 'memory_fallback', persistenceStatus: 'preview_fallback' }
}

// ── Venue Tax Jurisdictions ───────────────────────────────────────────────

export async function getVenueTaxJurisdictions(venueId) {
  const stored = taxJurisdictionStore.get(venueId) ?? []
  return {
    ok: true,
    venueId,
    jurisdictions: stored,
    jurisdictionStatus: stored.length > 0 ? 'jurisdiction_configured' : 'jurisdiction_required',
    storageMode: 'memory_fallback',
  }
}

export async function createOrUpdateVenueTaxJurisdiction(venueId, payload) {
  const existing = taxJurisdictionStore.get(venueId) ?? []
  const record = {
    id: payload.id ?? `jur-${venueId}-${Date.now()}`,
    venue_id: venueId,
    country: payload.country ?? 'US',
    state: payload.state ?? null,
    county: payload.county ?? null,
    city: payload.city ?? null,
    postal_code: payload.postalCode ?? null,
    jurisdiction_status: payload.jurisdictionStatus ?? 'jurisdiction_configured',
    source_status: payload.sourceStatus ?? 'manual_configured',
    updated_at: new Date().toISOString(),
  }

  const idx = existing.findIndex(j => j.id === record.id)
  if (idx >= 0) existing[idx] = record
  else existing.push(record)
  taxJurisdictionStore.set(venueId, existing)
  return { ok: true, venueId, jurisdiction: record, storageMode: 'memory_fallback', persistenceStatus: 'preview_fallback' }
}

// ── Venue Tax Categories ──────────────────────────────────────────────────

export async function getVenueTaxCategories(venueId) {
  const stored = taxCategoryStore.get(venueId) ?? []
  return {
    ok: true,
    venueId,
    categories: stored,
    categoryStatus: stored.length > 0 ? 'tax_category_configured' : 'tax_category_required',
    storageMode: 'memory_fallback',
  }
}

export async function createOrUpdateVenueTaxCategory(venueId, payload) {
  const existing = taxCategoryStore.get(venueId) ?? []
  const record = {
    id: payload.id ?? `cat-${venueId}-${payload.categoryCode ?? Date.now()}`,
    venue_id: venueId,
    category_code: payload.categoryCode,
    category_name: payload.categoryName ?? payload.categoryCode,
    applies_to: payload.appliesTo ?? null,
    category_status: payload.categoryStatus ?? 'tax_category_configured',
    updated_at: new Date().toISOString(),
  }

  const idx = existing.findIndex(c => c.category_code === record.category_code)
  if (idx >= 0) existing[idx] = record
  else existing.push(record)
  taxCategoryStore.set(venueId, existing)
  return { ok: true, venueId, category: record, storageMode: 'memory_fallback', persistenceStatus: 'preview_fallback' }
}

// ── Venue Tax Rules ───────────────────────────────────────────────────────

export async function getVenueTaxRules(venueId) {
  const stored = taxRuleStore.get(venueId) ?? []
  return {
    ok: true,
    venueId,
    rules: stored,
    ruleStatus: stored.length > 0 ? 'tax_rule_configured' : 'tax_rule_missing',
    storageMode: 'memory_fallback',
  }
}

export async function createOrUpdateVenueTaxRule(venueId, payload) {
  const existing = taxRuleStore.get(venueId) ?? []
  const record = {
    id: payload.id ?? `rule-${venueId}-${payload.categoryCode ?? Date.now()}`,
    venue_id: venueId,
    jurisdiction_id: payload.jurisdictionId ?? null,
    category_code: payload.categoryCode ?? 'general',
    rate_basis: payload.rateBasis ?? 'percentage',
    tax_rate: payload.taxRate ?? null,
    fixed_fee: payload.fixedFee ?? 0,
    compound_tax: payload.compoundTax ?? false,
    included_in_price: payload.includedInPrice ?? false,
    rule_status: payload.ruleStatus ?? 'tax_rule_configured',
    effective_start: payload.effectiveStart ?? null,
    effective_end: payload.effectiveEnd ?? null,
    updated_at: new Date().toISOString(),
  }

  const idx = existing.findIndex(r => r.id === record.id || r.category_code === record.category_code)
  if (idx >= 0) existing[idx] = record
  else existing.push(record)
  taxRuleStore.set(venueId, existing)
  return { ok: true, venueId, rule: record, storageMode: 'memory_fallback', persistenceStatus: 'preview_fallback' }
}

// ── Partner Vendor Tax Profiles ───────────────────────────────────────────

export async function getPartnerVendorTaxProfile(partnerId, venueId = null) {
  const k = `${partnerId}::${venueId ?? 'global'}`
  const profile = partnerTaxProfileStore.get(k) ?? null
  return {
    ok: true,
    profile,
    partnerTaxProfileStatus: profile?.profile_status ?? 'partner_tax_profile_required',
    merchantOfRecordStatus: profile?.merchant_of_record_status ?? 'merchant_of_record_required',
    storageMode: 'memory_fallback',
  }
}

export async function createOrUpdatePartnerVendorTaxProfile(partnerId, venueId = null, payload) {
  const k = `${partnerId}::${venueId ?? 'global'}`
  const existing = partnerTaxProfileStore.get(k) ?? { partner_id: partnerId, venue_id: venueId }
  const updated = {
    ...existing,
    ...payload,
    partner_id: partnerId,
    venue_id: venueId,
    profile_status: payload.profileStatus ?? existing.profile_status ?? 'partner_tax_profile_configured',
    tax_collection_status: payload.taxCollectionStatus ?? existing.tax_collection_status ?? 'tax_collection_pending',
    merchant_of_record_status: payload.merchantOfRecordStatus ?? existing.merchant_of_record_status ?? 'merchant_of_record_required',
    updated_at: new Date().toISOString(),
  }
  partnerTaxProfileStore.set(k, updated)
  return { ok: true, profile: updated, storageMode: 'memory_fallback', persistenceStatus: 'preview_fallback' }
}

// ── Tax Readiness ─────────────────────────────────────────────────────────

export async function getTaxReadiness(venueId, partnerId = null) {
  const [profile, jurisdictions, categories, rules] = await Promise.all([
    getVenueTaxProfile(venueId),
    getVenueTaxJurisdictions(venueId),
    getVenueTaxCategories(venueId),
    getVenueTaxRules(venueId),
  ])

  const partnerProfile = partnerId ? await getPartnerVendorTaxProfile(partnerId, venueId) : null

  const readiness = {
    taxProfileStatus: profile.taxProfileStatus,
    jurisdictionStatus: jurisdictions.jurisdictionStatus,
    categoryStatus: categories.categoryStatus,
    ruleStatus: rules.ruleStatus,
    partnerTaxProfileStatus: partnerProfile?.partnerTaxProfileStatus ?? null,
    merchantOfRecordStatus: partnerProfile?.merchantOfRecordStatus ?? null,
  }

  const blockers = []
  if (!profile.profile) blockers.push('tax_profile_required')
  if (jurisdictions.jurisdictions.length === 0) blockers.push('jurisdiction_required')
  if (categories.categories.length === 0) blockers.push('tax_category_required')
  if (rules.rules.length === 0) blockers.push('tax_rule_missing')
  if (partnerId && !partnerProfile?.profile) blockers.push('partner_tax_profile_required')

  const ready = blockers.length === 0
  return {
    venueId,
    partnerId,
    taxReadinessStatus: ready ? 'tax_calculation_ready' : 'tax_preview',
    ready,
    blockers,
    readiness,
    storageMode: 'memory_fallback',
  }
}
