/**
 * POS360 Floor Management Routes — Phase B.1
 * Mounted at /api/pos360/floor
 *
 * All venue-scoped routes use venueTenantGuard.
 * Write routes additionally require canAccessPOS3 (staff+).
 */
import { Router } from 'express'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360FloorController.js'

const router = Router()

// ── Sections ──────────────────────────────────────────────────────────────────
router.get( '/venues/:venueId/sections',                  venueTenantGuard, ctrl.listSections)
router.post('/venues/:venueId/sections',                  venueTenantGuard, canAccessPOS3, ctrl.createSection)
router.patch('/venues/:venueId/sections/:sectionId',      venueTenantGuard, canAccessPOS3, ctrl.updateSection)
router.delete('/venues/:venueId/sections/:sectionId',     venueTenantGuard, canAccessPOS3, ctrl.archiveSection)

// ── Floor Maps ────────────────────────────────────────────────────────────────
router.get( '/venues/:venueId/maps',                      venueTenantGuard, ctrl.listFloorMaps)
router.post('/venues/:venueId/maps',                      venueTenantGuard, canAccessPOS3, ctrl.createFloorMap)
router.patch('/venues/:venueId/maps/:mapId',              venueTenantGuard, canAccessPOS3, ctrl.updateFloorMap)

// ── Tables ────────────────────────────────────────────────────────────────────
router.get( '/venues/:venueId/tables',                    venueTenantGuard, ctrl.listTables)
router.post('/venues/:venueId/tables',                    venueTenantGuard, canAccessPOS3, ctrl.createTable)
router.get( '/venues/:venueId/tables/:tableId',           venueTenantGuard, ctrl.getTable)
router.patch('/venues/:venueId/tables/:tableId',          venueTenantGuard, canAccessPOS3, ctrl.updateTable)
router.post('/venues/:venueId/tables/:tableId/move',      venueTenantGuard, canAccessPOS3, ctrl.moveTable)
router.post('/venues/:venueId/tables/:tableId/status',    venueTenantGuard, canAccessPOS3, ctrl.changeTableStatus)
router.post('/venues/:venueId/tables/:tableId/transfer',  venueTenantGuard, canAccessPOS3, ctrl.transferTable)

// ── Server Assignment ─────────────────────────────────────────────────────────
router.get( '/venues/:venueId/server-assignments',        venueTenantGuard, ctrl.getServerAssignments)
router.post('/venues/:venueId/server-assignments',        venueTenantGuard, canAccessPOS3, ctrl.assignServer)

// ── Merge / Split ─────────────────────────────────────────────────────────────
router.post('/venues/:venueId/tables/merge',              venueTenantGuard, canAccessPOS3, ctrl.mergeTables)
router.post('/venues/:venueId/tables/:tableId/split',     venueTenantGuard, canAccessPOS3, ctrl.splitTable)

// ── Guest Links ───────────────────────────────────────────────────────────────
router.post('/venues/:venueId/guest-links',                       venueTenantGuard, canAccessPOS3, ctrl.linkGuest)
router.delete('/venues/:venueId/guest-links/:linkId',             venueTenantGuard, canAccessPOS3, ctrl.unlinkGuest)
router.post('/venues/:venueId/tables/:tableId/link-reservation',  venueTenantGuard, canAccessPOS3, ctrl.linkReservation)
router.post('/venues/:venueId/tables/:tableId/link-waitlist',     venueTenantGuard, canAccessPOS3, ctrl.linkWaitlist)

// ── Intelligence ──────────────────────────────────────────────────────────────
router.get('/venues/:venueId/tables/:tableId/intelligence', venueTenantGuard, ctrl.getTableIntelligence)

// ── Floor State & Sync ────────────────────────────────────────────────────────
router.get( '/venues/:venueId/floor-state',               venueTenantGuard, ctrl.getFloorState)
router.post('/venues/:venueId/floor-state/sync',          venueTenantGuard, canAccessPOS3, ctrl.syncFloorState)

export default router
