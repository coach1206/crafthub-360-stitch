/**
 * Partner Special Eligibility Engine
 * Determines if a partner product can become a customer-facing special.
 */

import { getPartnerProfile, getPartnerCommerceReadiness } from './partnerVendorOnboardingEngine.js'
import { canPartnerSellAtVenue } from './partnerVenueRelationshipService.js'
import { getPartnerProduct } from './partnerProductMenuService.js'
import { isProductAvailableNow } from './partnerAvailabilityService.js'
import { validatePartnerFulfillmentReadiness } from './partnerFulfillmentRuleService.js'
import { getActiveCommissionAgreement } from './partnerCommissionAgreementService.js'
import { getVenuePartnerSpecialsSettings } from '../venue/venueSettingsService.js'

export async function canPartnerProductBecomeSpecial(partnerId, productId, venueId) {
  const reasons = await getPartnerSpecialEligibilityReasons(partnerId, productId, venueId)
  const eligible = reasons.blockers.length === 0
  return {
    partnerId,
    productId,
    venueId,
    eligible,
    eligibilityStatus: eligible ? 'partner_special_eligible' : 'partner_special_not_eligible',
    blockers: reasons.blockers,
    warnings: reasons.warnings,
  }
}

export async function getPartnerSpecialEligibilityReasons(partnerId, productId, venueId) {
  const blockers = []
  const warnings = []

  const [
    profileResult,
    venueApproval,
    productResult,
    availability,
    fulfillment,
    agreement,
    venueSettings,
  ] = await Promise.all([
    getPartnerProfile(partnerId),
    canPartnerSellAtVenue(partnerId, venueId),
    getPartnerProduct(partnerId, productId),
    isProductAvailableNow(partnerId, productId, venueId),
    validatePartnerFulfillmentReadiness(partnerId, venueId),
    getActiveCommissionAgreement(partnerId, venueId),
    getVenuePartnerSpecialsSettings(venueId),
  ])

  if (!profileResult.profile) {
    blockers.push({ type: 'partner_profile_required', message: 'Partner profile does not exist.' })
  }

  if (!venueApproval.canSell) {
    blockers.push({ type: 'venue_approval_required', message: `Partner not approved for venue ${venueId}.` })
  }

  if (!productResult.product) {
    blockers.push({ type: 'product_setup_required', message: `Product ${productId} not found.` })
  } else if (productResult.product.status !== 'active') {
    blockers.push({ type: 'product_not_approved', message: `Product status is ${productResult.product.status}. Must be active.` })
  }

  if (!availability.available) {
    blockers.push({ type: `availability_${availability.reason}`, message: `Product not available: ${availability.reason}.` })
  }

  if (!fulfillment.ready) {
    blockers.push({ type: 'fulfillment_rules_required', message: 'Fulfillment rules not configured.' })
  }

  if (!agreement.ok) {
    blockers.push({ type: 'agreement_required', message: 'No active commission agreement found.' })
  }

  const partnerSpecialsEnabled = venueSettings.data?.partner_specials_enabled ?? false
  if (!partnerSpecialsEnabled) {
    blockers.push({ type: 'venue_partner_specials_disabled', message: `Partner specials not enabled at venue ${venueId}.` })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push({ type: 'stripe_keys_missing', severity: 'critical', message: 'Stripe Connect not configured. Payout will not be settled.' })
  }

  return { partnerId, productId, venueId, blockers, warnings }
}

export async function buildPartnerSpecialCandidate(partnerId, productId, venueId) {
  const eligibility = await canPartnerProductBecomeSpecial(partnerId, productId, venueId)
  if (!eligibility.eligible) {
    return { ok: false, eligibilityStatus: 'partner_special_not_eligible', blockers: eligibility.blockers }
  }

  const [product, agreement] = await Promise.all([
    getPartnerProduct(partnerId, productId),
    getActiveCommissionAgreement(partnerId, venueId),
  ])

  return {
    ok: true,
    eligibilityStatus: 'partner_special_eligible',
    candidate: {
      partnerId,
      productId,
      venueId,
      productName: product.product?.product_name,
      productType: product.product?.product_type,
      basePrice: product.product?.base_price,
      agreementId: agreement.agreement?.agreement_id,
      smokecraftCommissionRate: agreement.agreement?.smokecraft_commission_rate ?? 0.10,
      venueReferralRate: agreement.agreement?.venue_referral_rate ?? 0.05,
      partnerPayoutRate: agreement.agreement?.partner_payout_rate ?? 0.85,
      routingFee: agreement.agreement?.routing_fee ?? 450,
      settlementStatus: 'settlement_pending_preview',
      publishStatus: 'pending_approval',
    },
  }
}

export async function validatePartnerSpecialBeforePublish(payload) {
  const { partnerId, productId, venueId } = payload
  if (!partnerId || !productId || !venueId) {
    return { ok: false, valid: false, message: 'partnerId, productId, and venueId are required.' }
  }

  const eligibility = await canPartnerProductBecomeSpecial(partnerId, productId, venueId)
  return {
    ok: true,
    valid: eligibility.eligible,
    eligibilityStatus: eligibility.eligibilityStatus,
    blockers: eligibility.blockers,
    warnings: eligibility.warnings,
    publishAllowed: eligibility.eligible,
    publishBlockReason: eligibility.eligible ? null : 'eligibility_check_failed',
  }
}
