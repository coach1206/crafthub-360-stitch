/**
 * Partner Vendor Routes
 * Mounted at /api/partners
 */

import { Router } from 'express'
import {
  handleCreatePartnerProfile, handleGetPartnerProfile, handleUpdatePartnerProfile,
  handleGetOnboardingStatus, handleGetReadiness,
  handleRequestVenueApproval, handleApprovePartner, handleRejectPartner,
  handlePausePartner, handleBlockPartner, handleListPartnersForVenue,
  handleCreateProduct, handleListProducts, handleGetProduct, handleUpdateProduct,
  handleSubmitProductForApproval, handleApproveProduct, handleRejectProduct, handlePauseProduct,
  handleListVenueEligibleProducts,
  handleSetProductAvailability, handleGetProductAvailability,
  handleUpdateFulfillmentRules, handleGetFulfillmentRules,
  handleCreateCommissionAgreement, handleListCommissionAgreements,
  handleGetPayoutReadiness,
  handleGetSpecialEligibility,
  handleGetAuditLogs,
} from '../controllers/partnerVendorController.js'

const router = Router()

// Partner profiles
router.post('/', handleCreatePartnerProfile)
router.get('/:partnerId', handleGetPartnerProfile)
router.patch('/:partnerId', handleUpdatePartnerProfile)
router.get('/:partnerId/onboarding-status', handleGetOnboardingStatus)
router.get('/:partnerId/readiness', handleGetReadiness)

// Venue relationships
router.post('/:partnerId/venues/:venueId/request-approval', handleRequestVenueApproval)
router.post('/:partnerId/venues/:venueId/approve', handleApprovePartner)
router.post('/:partnerId/venues/:venueId/reject', handleRejectPartner)
router.post('/:partnerId/venues/:venueId/pause', handlePausePartner)
router.post('/:partnerId/venues/:venueId/block', handleBlockPartner)
router.get('/venues/:venueId', handleListPartnersForVenue)

// Products
router.post('/:partnerId/products', handleCreateProduct)
router.get('/:partnerId/products', handleListProducts)
router.get('/:partnerId/products/:productId', handleGetProduct)
router.patch('/:partnerId/products/:productId', handleUpdateProduct)
router.post('/:partnerId/products/:productId/submit', handleSubmitProductForApproval)
router.post('/:partnerId/products/:productId/approve', handleApproveProduct)
router.post('/:partnerId/products/:productId/reject', handleRejectProduct)
router.post('/:partnerId/products/:productId/pause', handlePauseProduct)
router.get('/venues/:venueId/products/eligible', handleListVenueEligibleProducts)

// Availability
router.patch('/:partnerId/products/:productId/availability', handleSetProductAvailability)
router.get('/:partnerId/products/:productId/availability', handleGetProductAvailability)

// Fulfillment rules
router.patch('/:partnerId/fulfillment-rules', handleUpdateFulfillmentRules)
router.get('/:partnerId/fulfillment-rules', handleGetFulfillmentRules)

// Commission agreements
router.post('/:partnerId/commission-agreements', handleCreateCommissionAgreement)
router.get('/:partnerId/commission-agreements', handleListCommissionAgreements)

// Payout readiness
router.get('/:partnerId/payout-readiness', handleGetPayoutReadiness)

// Special eligibility
router.get('/:partnerId/products/:productId/venues/:venueId/special-eligibility', handleGetSpecialEligibility)

// Audit logs
router.get('/:partnerId/audit-logs', handleGetAuditLogs)

export default router
