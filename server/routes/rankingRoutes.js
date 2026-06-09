import { Router } from 'express'
import * as ctrl from '../controllers/rankingController.js'

const router = Router()

router.get(  '/',                 ctrl.getLeaderboard)   // GET  /api/ranking
router.get(  '/tiers',           ctrl.getTiers)          // GET  /api/ranking/tiers
router.get(  '/user/:userId',    ctrl.getUserRank)        // GET  /api/ranking/user/:userId
router.get(  '/activity',        ctrl.getActivity)        // GET  /api/ranking/activity?userId=&limit=
router.post( '/scan',            ctrl.processScan)        // POST /api/ranking/scan
router.post( '/admin/xp',        ctrl.addXpAdmin)         // POST /api/ranking/admin/xp

export default router
