// Phase E.5 — NOVEE OS Live Pilot Readiness Routes
// Mounted at /api/phase-d/live-pilot-readiness

import express from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/noveeOSLivePilotReadinessController.js'

const router = express.Router()

// Pilot Venue Registry
router.get('/venues', ctrl.listPilotVenues)
router.get('/venues/:venueId', ctrl.getPilotVenue)
router.post('/venues', canAccessPOS3, ctrl.createPilotVenuePreview)

// Readiness Gates
router.get('/gates', ctrl.listPilotReadinessGates)
router.get('/gates/:gateKey', ctrl.getPilotReadinessGate)
router.patch('/gates/:gateKey', canAccessPOS3, ctrl.updatePilotReadinessGatePreview)

// Module Readiness
router.get('/modules', ctrl.listModuleReadiness)
router.get('/modules/:moduleKey', ctrl.getModuleReadiness)
router.patch('/modules/:moduleKey', canAccessPOS3, ctrl.updateModuleReadinessPreview)

// Checklist
router.get('/checklist', ctrl.listPilotChecklist)
router.patch('/checklist/:checklistKey', canAccessPOS3, ctrl.updatePilotChecklistItem)

// Evidence
router.get('/evidence', ctrl.listPilotEvidence)
router.post('/evidence', canAccessPOS3, ctrl.submitPilotEvidencePreview)

// Audit Log
router.get('/audit-log', ctrl.listPilotAuditLog)
router.post('/audit-log', canAccessPOS3, ctrl.logPilotAuditEvent)

// Acceptance Registry
router.get('/acceptance', ctrl.listAcceptanceRegistry)
router.post('/acceptance', canAccessPOS3, ctrl.createAcceptancePreview)

// Summary / Analytics
router.get('/score', ctrl.getPilotReadinessScore)
router.get('/blockers', ctrl.getPilotBlockers)
router.get('/safe-claims', ctrl.getSafePilotClaims)
router.get('/feature-flags', ctrl.getPilotFeatureFlagSnapshot)
router.get('/validate', ctrl.validateLivePilotReadiness)

export default router
