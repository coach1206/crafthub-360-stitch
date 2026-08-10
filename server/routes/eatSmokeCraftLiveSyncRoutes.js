/**
 * E.A.T. SmokeCraft Live Sync Routes — Phase F.7
 * Base: /api/eat-360/smokecraft
 */

import { Router } from 'express'
import {
  getHealth,
  syncSession,
  recordGuestActivity,
  createHandoff,
  createManagerAlert,
  createInventorySignal,
  getSessionSyncStatus,
  getGuestActivity,
  getHandoffQueue,
  getManagerAlerts,
  getInventorySignals,
  getAuditLog,
  writeSyncAuditEvent,
} from '../controllers/eatSmokeCraftLiveSyncController.js'

const router = Router()

router.get('/health', getHealth)

router.post('/session/sync', syncSession)

router.post('/guest-activity', recordGuestActivity)

router.post('/handoff', createHandoff)

router.post('/manager-alert', createManagerAlert)

router.post('/inventory-signal', createInventorySignal)

router.get('/session/:sessionId/status', getSessionSyncStatus)

router.get('/guest/:guestId/activity', getGuestActivity)

router.get('/handoff-queue', getHandoffQueue)

router.get('/manager-alerts', getManagerAlerts)

router.get('/inventory-signals', getInventorySignals)

router.get('/audit-log', getAuditLog)

router.post('/audit/event', writeSyncAuditEvent)

export default router
