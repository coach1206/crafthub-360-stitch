/**
 * Tax Compliance Routes
 * Mounted at /api/tax
 */

import { Router } from 'express'
import {
  handleGetVenueTaxProfile, handleCreateOrUpdateVenueTaxProfile,
  handleGetVenueTaxJurisdictions, handleCreateOrUpdateVenueTaxJurisdiction,
  handleGetVenueTaxCategories, handleCreateOrUpdateVenueTaxCategory,
  handleGetVenueTaxRules, handleCreateOrUpdateVenueTaxRule,
  handleGetVenueTaxReadiness,
  handleGetPartnerTaxProfile, handleCreateOrUpdatePartnerTaxProfile, handleGetPartnerTaxReadiness,
  handleCalculateTax, handleTaxPreview, handleValidateOrder,
  handleGetAuditTrail,
} from '../controllers/taxComplianceController.js'

const router = Router()

// Venue tax profile
router.get('/venues/:venueId/profile', handleGetVenueTaxProfile)
router.post('/venues/:venueId/profile', handleCreateOrUpdateVenueTaxProfile)

// Jurisdictions
router.get('/venues/:venueId/jurisdictions', handleGetVenueTaxJurisdictions)
router.post('/venues/:venueId/jurisdictions', handleCreateOrUpdateVenueTaxJurisdiction)

// Categories
router.get('/venues/:venueId/categories', handleGetVenueTaxCategories)
router.post('/venues/:venueId/categories', handleCreateOrUpdateVenueTaxCategory)

// Rules
router.get('/venues/:venueId/rules', handleGetVenueTaxRules)
router.post('/venues/:venueId/rules', handleCreateOrUpdateVenueTaxRule)

// Venue readiness
router.get('/venues/:venueId/readiness', handleGetVenueTaxReadiness)

// Partner tax
router.get('/venues/:venueId/partners/:partnerId/profile', handleGetPartnerTaxProfile)
router.post('/venues/:venueId/partners/:partnerId/profile', handleCreateOrUpdatePartnerTaxProfile)
router.get('/venues/:venueId/partners/:partnerId/readiness', handleGetPartnerTaxReadiness)

// Calculation
router.post('/calculate', handleCalculateTax)
router.post('/preview', handleTaxPreview)
router.post('/validate-order', handleValidateOrder)

// Audit
router.get('/audit/:entityType/:entityId', handleGetAuditTrail)

export default router
