/**
 * Venue Onboarding Routes
 * Mounted at /api/venues/onboarding
 */

import { Router } from 'express'
import {
  handleCreateVenueProfile, handleGetVenueProfile, handleUpdateVenueProfile,
  handleGetOnboardingStatus, handleGetReadinessScore, handleGetReadinessWarnings,
  handleMarkStepComplete, handleGetRequiredSteps, handleGetOperatingMode,
  handleGetCommerceReadiness, handleGetFullReadiness, handleGetFeatureMatrix,
  handleGetOperatingSettings, handleUpdateOperatingSettings,
  handleGetPOSPreferences, handleUpdatePOSPreferences,
  handleGetPartnerSpecialsSettings, handleEnablePartnerSpecialsTrial,
  handleRequestPartnerSpecialsCancellation, handleCancelPartnerSpecials,
  handleCanDisplayPartnerSpecials, handleCanAcceptPartnerOrders,
  handleGetStaffPolicy, handleUpdateStaffPolicy, handleValidateStaffAction,
  handleLogOnboardingAction,
} from '../controllers/venueOnboardingController.js'

const router = Router()

// Venue profile
router.post('/venues', handleCreateVenueProfile)
router.get('/venues/:venueId', handleGetVenueProfile)
router.patch('/venues/:venueId', handleUpdateVenueProfile)

// Onboarding status and readiness
router.get('/venues/:venueId/status', handleGetOnboardingStatus)
router.get('/venues/:venueId/readiness', handleGetReadinessScore)
router.get('/venues/:venueId/readiness/full', handleGetFullReadiness)
router.get('/venues/:venueId/readiness/warnings', handleGetReadinessWarnings)
router.get('/venues/:venueId/steps', handleGetRequiredSteps)
router.post('/venues/:venueId/steps/complete', handleMarkStepComplete)

// Operating mode and commerce readiness
router.get('/venues/:venueId/operating-mode', handleGetOperatingMode)
router.get('/venues/:venueId/commerce-readiness', handleGetCommerceReadiness)
router.get('/venues/:venueId/feature-matrix', handleGetFeatureMatrix)

// Operating settings
router.get('/venues/:venueId/settings/operating', handleGetOperatingSettings)
router.patch('/venues/:venueId/settings/operating', handleUpdateOperatingSettings)

// POS preferences
router.get('/venues/:venueId/settings/pos', handleGetPOSPreferences)
router.patch('/venues/:venueId/settings/pos', handleUpdatePOSPreferences)

// Partner specials
router.get('/venues/:venueId/partner-specials/settings', handleGetPartnerSpecialsSettings)
router.post('/venues/:venueId/partner-specials/trial', handleEnablePartnerSpecialsTrial)
router.post('/venues/:venueId/partner-specials/cancel-request', handleRequestPartnerSpecialsCancellation)
router.post('/venues/:venueId/partner-specials/cancel', handleCancelPartnerSpecials)
router.get('/venues/:venueId/partner-specials/can-display', handleCanDisplayPartnerSpecials)
router.get('/venues/:venueId/partner-specials/can-accept-orders', handleCanAcceptPartnerOrders)

// Staff policy
router.get('/venues/:venueId/staff-policy', handleGetStaffPolicy)
router.patch('/venues/:venueId/staff-policy', handleUpdateStaffPolicy)
router.post('/venues/:venueId/staff-policy/validate', handleValidateStaffAction)

// Audit log
router.post('/venues/:venueId/audit-log', handleLogOnboardingAction)

export default router
