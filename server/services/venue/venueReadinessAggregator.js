/**
 * Venue Readiness Aggregator
 * Aggregates readiness checks across POS, payment, tax, partner specials, staff, and manual fallback.
 */

import { getVenueProfile, getVenueOnboardingStatus, calculateVenueReadinessScore, getVenueReadinessWarnings } from './venueOnboardingEngine.js'
import { getVenueOperatingSettings, getVenuePOSPreferences, getVenuePartnerSpecialsSettings, getVenueStaffPolicySettings } from './venueSettingsService.js'

export async function getFullVenueReadiness(venueId) {
  const [
    profile,
    onboarding,
    score,
    pos,
    payment,
    tax,
    partner,
    staff,
    manual,
  ] = await Promise.all([
    getVenueProfile(venueId),
    getVenueOnboardingStatus(venueId),
    calculateVenueReadinessScore(venueId),
    getVenuePOSReadiness(venueId),
    getVenuePaymentReadiness(venueId),
    getVenueTaxReadiness(venueId),
    getVenuePartnerReadiness(venueId),
    getVenueStaffReadiness(venueId),
    getVenueManualFallbackReadiness(venueId),
  ])

  const warnings = await getVenueWarningsForEAT(venueId)

  return {
    venueId,
    profileStatus: profile.profileStatus ?? (profile.profile ? 'onboarding_in_progress' : 'venue_profile_required'),
    overallStatus: onboarding.status?.overall_status ?? 'onboarding_required',
    readinessScore: score.readinessScore,
    maxScore: score.maxScore,
    pos,
    payment,
    tax,
    partner,
    staff,
    manual,
    warnings: warnings.warnings,
    storageMode: 'memory_fallback',
  }
}

export async function getVenuePOSReadiness(venueId) {
  const [prefs, onboarding] = await Promise.all([
    getVenuePOSPreferences(venueId),
    getVenueOnboardingStatus(venueId),
  ])
  const posStatus = onboarding.status?.pos_status ?? 'pos_provider_required'
  const isManual = prefs.data.preferred_provider_name === 'manual_pos360'

  return {
    venueId,
    posStatus,
    preferredProvider: prefs.data.preferred_provider_name,
    fallbackProvider: prefs.data.fallback_provider_name,
    posConnectionRequired: prefs.data.pos_connection_required,
    manualFallbackAllowed: prefs.data.allow_manual_fallback,
    posReady: isManual || posStatus === 'manual_mode_available',
    posReadinessNote: isManual
      ? 'Manual POS360 is the active provider. No external POS connection required.'
      : 'POS provider not yet connected. Manual POS360 fallback available.',
  }
}

export async function getVenuePaymentReadiness(venueId) {
  const onboarding = await getVenueOnboardingStatus(venueId)
  const paymentStatus = onboarding.status?.payment_status ?? 'payment_onboarding_required'
  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CONNECT_CLIENT_ID)

  return {
    venueId,
    paymentStatus,
    stripeConfigured,
    stripeStatus: stripeConfigured ? 'stripe_keys_present' : 'stripe_keys_missing',
    canReceiveReferralPayout: false,
    paymentReadinessNote: stripeConfigured
      ? 'Stripe keys present. Venue Stripe Connect account required to receive payouts.'
      : 'Stripe Connect not configured. Payment settlement not available.',
  }
}

export async function getVenueTaxReadiness(venueId) {
  const onboarding = await getVenueOnboardingStatus(venueId)
  const taxStatus = onboarding.status?.tax_status ?? 'tax_profile_required'

  return {
    venueId,
    taxStatus,
    taxReady: taxStatus === 'tax_profile_configured',
    taxReadinessNote: taxStatus === 'tax_profile_configured'
      ? 'Tax profile configured.'
      : 'Tax profile not configured. Preview tax rate (8.5%) applied — not tax-compliant.',
  }
}

export async function getVenuePartnerReadiness(venueId) {
  const [partnerSettings, onboarding] = await Promise.all([
    getVenuePartnerSpecialsSettings(venueId),
    getVenueOnboardingStatus(venueId),
  ])
  const partnerStatus = onboarding.status?.partner_specials_status ?? 'partner_specials_disabled'
  const settings = partnerSettings.data

  return {
    venueId,
    partnerSpecialsStatus: partnerStatus,
    partnerSpecialsEnabled: settings.partner_specials_enabled,
    allowPartnerFood: settings.allow_partner_food,
    allowPartnerMerch: settings.allow_partner_merch,
    allowPartnerEvents: settings.allow_partner_events,
    requireManagerApproval: settings.require_manager_approval,
    partnerReadyToDisplay: ['partner_specials_trial_active', 'partner_specials_active', 'cancellation_pending'].includes(settings.status),
    partnerReadyToAcceptOrders: ['partner_specials_trial_active', 'partner_specials_active'].includes(settings.status) && settings.partner_specials_enabled,
  }
}

export async function getVenueStaffReadiness(venueId) {
  const [staffPolicy, onboarding] = await Promise.all([
    getVenueStaffPolicySettings(venueId),
    getVenueOnboardingStatus(venueId),
  ])
  const staffStatus = onboarding.status?.staff_status ?? 'staff_rules_required'
  const policy = staffPolicy.data

  return {
    venueId,
    staffStatus,
    staffConfigured: staffStatus !== 'staff_rules_required',
    managerCanPublish: policy.manager_can_publish,
    ownerCanPublish: policy.owner_can_publish,
    adminCanPublish: policy.admin_can_publish,
    bartenderCanSuggest: policy.bartender_can_suggest,
    cookCanSuggest: policy.cook_can_suggest,
    serverCanSuggest: policy.server_can_suggest,
    requireManagerApprovalForStaffSpecials: policy.require_manager_approval_for_staff_specials,
    staffReadinessNote: staffStatus !== 'staff_rules_required'
      ? 'Staff policy configured.'
      : 'Staff approval policy not yet configured.',
  }
}

export async function getVenueManualFallbackReadiness(venueId) {
  const [ops, prefs, onboarding] = await Promise.all([
    getVenueOperatingSettings(venueId),
    getVenuePOSPreferences(venueId),
    getVenueOnboardingStatus(venueId),
  ])

  const manualStatus = onboarding.status?.manual_pos360_status ?? 'manual_mode_available'

  return {
    venueId,
    manualPos360Status: manualStatus,
    manualModeEnabled: ops.data.manual_mode_enabled,
    manualFallbackAllowed: prefs.data.allow_manual_fallback,
    manualFallbackReady: manualStatus === 'manual_mode_available' && ops.data.manual_mode_enabled,
    manualFallbackNote: 'Manual POS360 is always available as the default fallback mode.',
  }
}

export async function getVenueWarningsForEAT(venueId) {
  const warnings = await getVenueReadinessWarnings(venueId)

  const enriched = warnings.warnings.map(w => ({
    ...w,
    source: 'venue_onboarding',
    venueId,
  }))

  const stripeWarnings = []
  if (!process.env.STRIPE_SECRET_KEY) {
    stripeWarnings.push({ type: 'stripe_keys_missing', severity: 'critical', message: 'Stripe secret key not configured. Payment settlement unavailable.', source: 'stripe_config', venueId })
  }
  if (!process.env.STRIPE_CONNECT_CLIENT_ID) {
    stripeWarnings.push({ type: 'stripe_connect_required', severity: 'critical', message: 'Stripe Connect client ID not configured. Venue payouts unavailable.', source: 'stripe_config', venueId })
  }

  return {
    venueId,
    warnings: [...enriched, ...stripeWarnings],
    readinessScore: warnings.readinessScore,
    warningCount: enriched.length + stripeWarnings.length,
    criticalCount: [...enriched, ...stripeWarnings].filter(w => w.severity === 'critical').length,
  }
}
