/**
 * Passport 360 SmokeCraft Routes — Phase F.5
 * Base: /api/passport-360/smokecraft
 */

import { Router } from 'express'
import {
  getHealth,
  resolveGuest,
  completeSmokeCraftSession,
  awardStamp,
  awardXP,
  saveFlavorMemory,
  getGuestProgress,
  getGuestStamps,
  getGuestBadgesHandler,
  getGuestReturnVisits,
  getAuditLog,
  writeSyncAuditEvent,
} from '../controllers/passport360SmokeCraftController.js'

const router = Router()

router.get('/health', getHealth)

router.post('/guest/resolve', resolveGuest)

router.post('/session/complete', completeSmokeCraftSession)

router.post('/stamp/award', awardStamp)

router.post('/xp/award', awardXP)

router.post('/flavor-memory/save', saveFlavorMemory)

router.get('/guest/:guestId/progress', getGuestProgress)

router.get('/guest/:guestId/stamps', getGuestStamps)

router.get('/guest/:guestId/badges', getGuestBadgesHandler)

router.get('/guest/:guestId/return-visits', getGuestReturnVisits)

router.get('/guest/:guestId/audit-log', getAuditLog)

router.post('/audit/event', writeSyncAuditEvent)

export default router
