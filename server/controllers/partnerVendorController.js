/**
 * Partner Vendor Controller
 * Handles HTTP requests for partner vendor onboarding and management.
 */

import {
  createPartnerProfile, updatePartnerProfile, getPartnerProfile,
  getPartnerOnboardingStatus, calculatePartnerReadinessScore,
  getPartnerCommerceReadiness,
} from '../services/partner/partnerVendorOnboardingEngine.js'
import {
  requestVenueApproval, approvePartnerForVenue, rejectPartnerForVenue,
  pausePartnerForVenue, blockPartnerForVenue, getPartnerVenueRelationship,
  listPartnersForVenue, canPartnerSellAtVenue,
} from '../services/partner/partnerVenueRelationshipService.js'
import {
  createPartnerProduct, updatePartnerProduct, getPartnerProduct,
  listPartnerProducts, listVenueEligiblePartnerProducts,
  submitProductForApproval, approvePartnerProduct, rejectPartnerProduct, pausePartnerProduct,
} from '../services/partner/partnerProductMenuService.js'
import {
  setProductAvailability, getProductAvailability,
} from '../services/partner/partnerAvailabilityService.js'
import {
  createFulfillmentRules, updateFulfillmentRules, getFulfillmentRules,
} from '../services/partner/partnerFulfillmentRuleService.js'
import {
  createCommissionAgreement, getCommissionAgreement,
} from '../services/partner/partnerCommissionAgreementService.js'
import { getPartnerPayoutReadiness } from '../services/partner/partnerPayoutReadinessService.js'
import { canPartnerProductBecomeSpecial } from '../services/partner/partnerSpecialEligibilityEngine.js'
import { getPartnerAuditLogs } from '../services/partner/partnerAuditLogService.js'

function partnerId(req) {
  return req.params.partnerId ?? req.body?.partnerId
}

export async function handleCreatePartnerProfile(req, res) {
  try {
    const result = await createPartnerProfile(req.body)
    if (!result.ok) return res.status(400).json(result)
    return res.status(201).json(result)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetPartnerProfile(req, res) {
  try {
    return res.json(await getPartnerProfile(partnerId(req)))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleUpdatePartnerProfile(req, res) {
  try {
    return res.json(await updatePartnerProfile(partnerId(req), req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetOnboardingStatus(req, res) {
  try {
    return res.json(await getPartnerOnboardingStatus(partnerId(req)))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetReadiness(req, res) {
  try {
    const [score, commerce] = await Promise.all([
      calculatePartnerReadinessScore(partnerId(req)),
      getPartnerCommerceReadiness(partnerId(req)),
    ])
    return res.json({ ...score, commerceReadiness: commerce })
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleRequestVenueApproval(req, res) {
  try {
    const result = await requestVenueApproval(partnerId(req), req.params.venueId, req.body)
    if (!result.ok) return res.status(400).json(result)
    return res.json(result)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleApprovePartner(req, res) {
  try {
    return res.json(await approvePartnerForVenue(partnerId(req), req.params.venueId, req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleRejectPartner(req, res) {
  try {
    return res.json(await rejectPartnerForVenue(partnerId(req), req.params.venueId, req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handlePausePartner(req, res) {
  try {
    return res.json(await pausePartnerForVenue(partnerId(req), req.params.venueId, req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleBlockPartner(req, res) {
  try {
    return res.json(await blockPartnerForVenue(partnerId(req), req.params.venueId, req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleListPartnersForVenue(req, res) {
  try {
    return res.json(await listPartnersForVenue(req.params.venueId))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateProduct(req, res) {
  try {
    const result = await createPartnerProduct(partnerId(req), req.body)
    if (!result.ok) return res.status(400).json(result)
    return res.status(201).json(result)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleListProducts(req, res) {
  try {
    return res.json(await listPartnerProducts(partnerId(req), req.query))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetProduct(req, res) {
  try {
    return res.json(await getPartnerProduct(partnerId(req), req.params.productId))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleUpdateProduct(req, res) {
  try {
    return res.json(await updatePartnerProduct(partnerId(req), req.params.productId, req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleSubmitProductForApproval(req, res) {
  try {
    return res.json(await submitProductForApproval(partnerId(req), req.params.productId))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleApproveProduct(req, res) {
  try {
    return res.json(await approvePartnerProduct(partnerId(req), req.params.productId, req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleRejectProduct(req, res) {
  try {
    return res.json(await rejectPartnerProduct(partnerId(req), req.params.productId, req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handlePauseProduct(req, res) {
  try {
    return res.json(await pausePartnerProduct(partnerId(req), req.params.productId, req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleListVenueEligibleProducts(req, res) {
  try {
    return res.json(await listVenueEligiblePartnerProducts(req.params.venueId, req.query))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleSetProductAvailability(req, res) {
  try {
    return res.json(await setProductAvailability(partnerId(req), req.params.productId, req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetProductAvailability(req, res) {
  try {
    return res.json(await getProductAvailability(partnerId(req), req.params.productId, req.query.venueId))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleUpdateFulfillmentRules(req, res) {
  try {
    return res.json(await updateFulfillmentRules(partnerId(req), req.body))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetFulfillmentRules(req, res) {
  try {
    return res.json(await getFulfillmentRules(partnerId(req), req.query.venueId))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateCommissionAgreement(req, res) {
  try {
    const result = await createCommissionAgreement(partnerId(req), req.body)
    return res.status(201).json(result)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleListCommissionAgreements(req, res) {
  try {
    return res.json(await getCommissionAgreement(partnerId(req), req.query.venueId))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetPayoutReadiness(req, res) {
  try {
    return res.json(await getPartnerPayoutReadiness(partnerId(req)))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetSpecialEligibility(req, res) {
  try {
    return res.json(await canPartnerProductBecomeSpecial(
      partnerId(req), req.params.productId, req.params.venueId
    ))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetAuditLogs(req, res) {
  try {
    return res.json(await getPartnerAuditLogs(partnerId(req)))
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}
