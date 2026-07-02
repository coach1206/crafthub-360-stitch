/**
 * KDS Routing Routes
 * Mounted at /api/kds
 */

import { Router } from 'express'
import {
  handleGetVenueStations, handleCreateOrUpdateStation, handleGetStationProfile,
  handleGetStationMappings, handleCreateOrUpdateMapping,
  handleGetRoutingRules, handleCreateOrUpdateRule, handleGetStationConfigReadiness,
  handleRouteOrder, handleDispatchPreview, handleFulfillmentPlan, handleHandoffPlan,
  handleGetVenueHealth, handleUpdateStationHealthPreview,
  handleGetKdsAudit,
} from '../controllers/kdsRoutingController.js'

const router = Router()

// Station config
router.get('/venues/:venueId/stations',                             handleGetVenueStations)
router.post('/venues/:venueId/stations',                            handleCreateOrUpdateStation)
router.get('/venues/:venueId/stations/:stationId',                  handleGetStationProfile)
router.get('/venues/:venueId/mappings',                             handleGetStationMappings)
router.post('/venues/:venueId/mappings',                            handleCreateOrUpdateMapping)
router.get('/venues/:venueId/rules',                                handleGetRoutingRules)
router.post('/venues/:venueId/rules',                               handleCreateOrUpdateRule)
router.get('/venues/:venueId/readiness',                            handleGetStationConfigReadiness)

// Routing and dispatch
router.post('/route-order',       handleRouteOrder)
router.post('/dispatch-preview',  handleDispatchPreview)
router.post('/fulfillment-plan',  handleFulfillmentPlan)
router.post('/handoff-plan',      handleHandoffPlan)

// Health
router.get('/venues/:venueId/health',                                    handleGetVenueHealth)
router.post('/venues/:venueId/stations/:stationId/health-preview',       handleUpdateStationHealthPreview)

// Audit
router.get('/audit/:entityType/:entityId', handleGetKdsAudit)

export default router
