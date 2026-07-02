/**
 * Partner Vendor Onboarding Engine
 * Creates/reads partner profiles and tracks onboarding checklist completion.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const partnerProfileStore = new Map()
const partnerOnboardingStore = new Map()
const partnerAuditMemory = []

function defaultOnboardingStatus(partnerId) {
  return {
    partner_id: partnerId,
    profile_status: 'partner_profile_required',
    payout_status: 'payout_onboarding_required',
    menu_status: 'menu_required',
    product_status: 'product_setup_required',
    availability_status: 'availability_required',
    fulfillment_status: 'fulfillment_rules_required',
    agreement_status: 'agreement_required',
    venue_approval_status: 'venue_approval_required',
    overall_status: 'partner_onboarding_required',
    readiness_score: 0,
  }
}

export async function createPartnerProfile(payload) {
  const { partnerId, partnerName, partnerType = 'outside_food_vendor', ...rest } = payload
  if (!partnerId || !partnerName) {
    return { ok: false, status: 'partner_profile_required', message: 'partnerId and partnerName are required.' }
  }

  const validTypes = ['outside_food_vendor','cigar_distributor','cigar_manufacturer',
    'beverage_distributor','merch_vendor','event_partner','service_partner','demo_partner']
  if (!validTypes.includes(partnerType)) {
    return { ok: false, status: 'partner_profile_required', message: `Invalid partnerType: ${partnerType}` }
  }

  const profile = {
    partner_id: partnerId,
    partner_name: partnerName,
    partner_type: partnerType,
    status: 'partner_profile_required',
    onboarding_status: 'partner_onboarding_required',
    country: rest.country ?? 'US',
    ...rest,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO partner_vendor_profiles
           (partner_id, partner_name, partner_type, legal_business_name, business_email,
            business_phone, website_url, city, state, country, status, onboarding_status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'partner_profile_required','partner_onboarding_required',$11)
         ON CONFLICT (partner_id) DO UPDATE SET partner_name=EXCLUDED.partner_name, updated_at=NOW()
         RETURNING *`,
        [partnerId, partnerName, partnerType, rest.legalBusinessName ?? null,
         rest.businessEmail ?? null, rest.businessPhone ?? null, rest.websiteUrl ?? null,
         rest.city ?? null, rest.state ?? null, rest.country ?? 'US', rest.createdBy ?? 'system']
      )
      return { ok: true, profile: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  partnerProfileStore.set(partnerId, profile)
  return {
    ok: true,
    profile,
    storageMode: 'memory_fallback',
    persistenceStatus: 'preview_fallback',
    message: 'Partner profile stored in memory. Not persisted — database unavailable.',
  }
}

export async function updatePartnerProfile(partnerId, payload) {
  const existing = partnerProfileStore.get(partnerId) ?? { partner_id: partnerId }
  const updated = { ...existing, ...payload, partner_id: partnerId, updated_at: new Date().toISOString() }
  partnerProfileStore.set(partnerId, updated)
  return { ok: true, profile: updated, storageMode: 'memory_fallback' }
}

export async function getPartnerProfile(partnerId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query('SELECT * FROM partner_vendor_profiles WHERE partner_id=$1 LIMIT 1', [partnerId])
      if (rows[0]) return { ok: true, profile: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const profile = partnerProfileStore.get(partnerId) ?? null
  return {
    ok: true,
    profile,
    profileStatus: profile ? 'partner_onboarding_in_progress' : 'partner_profile_required',
    storageMode: 'memory_fallback',
  }
}

export async function getPartnerOnboardingStatus(partnerId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query('SELECT * FROM partner_vendor_onboarding_status WHERE partner_id=$1 LIMIT 1', [partnerId])
      if (rows[0]) return { ok: true, status: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const stored = partnerOnboardingStore.get(partnerId)
  return {
    ok: true,
    partnerId,
    status: stored ?? defaultOnboardingStatus(partnerId),
    storageMode: 'memory_fallback',
  }
}

export async function calculatePartnerReadinessScore(partnerId) {
  const profile = await getPartnerProfile(partnerId)
  const onboarding = await getPartnerOnboardingStatus(partnerId)
  const s = onboarding.status

  const checks = [
    { key: 'profile', pass: !!profile.profile, points: 20 },
    { key: 'payout', pass: s.payout_status !== 'payout_onboarding_required', points: 15 },
    { key: 'menu_products', pass: s.product_status !== 'product_setup_required', points: 15 },
    { key: 'availability', pass: s.availability_status !== 'availability_required', points: 10 },
    { key: 'fulfillment', pass: s.fulfillment_status !== 'fulfillment_rules_required', points: 10 },
    { key: 'agreement', pass: s.agreement_status !== 'agreement_required', points: 15 },
    { key: 'venue_approval', pass: s.venue_approval_status !== 'venue_approval_required', points: 15 },
  ]

  let score = 0
  for (const c of checks) { if (c.pass) score += c.points }

  return { partnerId, readinessScore: score, maxScore: 100, checks }
}

export async function getPartnerReadinessWarnings(partnerId) {
  const score = await calculatePartnerReadinessScore(partnerId)
  const warnings = score.checks
    .filter(c => !c.pass)
    .map(c => ({
      type: `${c.key}_incomplete`,
      severity: c.points >= 15 ? 'critical' : 'warning',
      message: `${c.key} setup incomplete.`,
    }))

  return { partnerId, warnings, readinessScore: score.readinessScore }
}

export async function markPartnerOnboardingStepComplete(partnerId, stepName) {
  const stepMap = {
    profile: 'profile_status',
    payout: 'payout_status',
    menu: 'menu_status',
    products: 'product_status',
    availability: 'availability_status',
    fulfillment: 'fulfillment_status',
    agreement: 'agreement_status',
    venue_approval: 'venue_approval_status',
  }

  const field = stepMap[stepName]
  if (!field) return { ok: false, message: `Unknown step: ${stepName}` }

  const completedValues = {
    profile_status: 'partner_onboarding_in_progress',
    payout_status: 'payout_onboarding_required',
    menu_status: 'menu_configured',
    product_status: 'products_configured',
    availability_status: 'availability_configured',
    fulfillment_status: 'fulfillment_configured',
    agreement_status: 'agreement_active',
    venue_approval_status: 'partner_approved',
  }

  const existing = partnerOnboardingStore.get(partnerId) ?? defaultOnboardingStatus(partnerId)
  existing[field] = completedValues[field] ?? 'onboarding_in_progress'
  partnerOnboardingStore.set(partnerId, existing)

  return { ok: true, partnerId, stepName, newStatus: existing[field], storageMode: 'memory_fallback' }
}

export function getRequiredPartnerOnboardingSteps(partnerId) {
  return [
    { step: 'profile', description: 'Create partner vendor profile', required: true },
    { step: 'venue_approval', description: 'Request and receive venue approval', required: true },
    { step: 'products', description: 'Set up at least one approved product/menu item', required: true },
    { step: 'fulfillment', description: 'Configure fulfillment/delivery rules', required: true },
    { step: 'agreement', description: 'Activate commission agreement', required: true },
    { step: 'availability', description: 'Set product availability schedule', required: false },
    { step: 'payout', description: 'Complete payout/Stripe Connect onboarding', required: false },
    { step: 'menu', description: 'Full menu/catalog setup', required: false },
  ]
}

export async function getPartnerCommerceReadiness(partnerId) {
  const warnings = await getPartnerReadinessWarnings(partnerId)
  return {
    partnerId,
    ticketTapperStatus: 'preview_fallback',
    moneyBridgeStatus: 'settlement_pending_preview',
    posStatus: 'integration_required',
    payoutStatus: 'payout_onboarding_required',
    partnerSpecialsStatus: 'partner_onboarding_required',
    readinessScore: warnings.readinessScore,
    warnings: warnings.warnings,
    overallStatus: 'partner_onboarding_required',
    message: 'Partner vendors should never become customer-facing until venue approval, product approval, availability, fulfillment rules, and commission rules are in place.',
  }
}
