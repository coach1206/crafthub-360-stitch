import { Router } from 'express'
import * as ctrl from '../controllers/badgeController.js'

const router = Router()

router.get(  '/',                 ctrl.getCatalog)        // GET  /api/badges
router.get(  '/eligible',        ctrl.checkEligible)     // GET  /api/badges/eligible?userId=&sourceType=&xp=
router.get(  '/user/:userId',    ctrl.getUserBadges)      // GET  /api/badges/user/:userId
router.post( '/unlock',          ctrl.unlockBadge)        // POST /api/badges/unlock

export default router
