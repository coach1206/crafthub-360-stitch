import { Router } from 'express'
import { requireAuth }  from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/rankingController.js'

const router = Router()

// ── Public / authenticated read routes ───────────────────────────────────────
router.get(  '/',              ctrl.getLeaderboard)   // GET  /api/ranking
router.get(  '/tiers',         ctrl.getTiers)          // GET  /api/ranking/tiers
router.get(  '/user/:userId',  ctrl.getUserRank)        // GET  /api/ranking/user/:userId
router.get(  '/activity',      ctrl.getActivity)        // GET  /api/ranking/activity?userId=&limit=
router.post( '/scan',          ctrl.processScan)        // POST /api/ranking/scan

// ── Admin-gated mutation routes ───────────────────────────────────────────────
router.post(  '/admin/xp',                 requireAuth, requireAdmin, ctrl.addXpAdmin)    // POST   /api/ranking/admin/xp
router.post(  '/admin/members',            requireAuth, requireAdmin, ctrl.addMember)     // POST   /api/ranking/admin/members
router.delete('/admin/members/:memberId',  requireAuth, requireAdmin, ctrl.removeMember)  // DELETE /api/ranking/admin/members/:memberId
router.patch( '/admin/members/:memberId',  requireAuth, requireAdmin, ctrl.updateMember)  // PATCH  /api/ranking/admin/members/:memberId

// ── Admin: data reset routes ───────────────────────────────────────────────────
router.delete('/admin/reset-xp',       requireAuth, requireAdmin, ctrl.resetXp)       // DELETE /api/ranking/admin/reset-xp
router.delete('/admin/reset-activity', requireAuth, requireAdmin, ctrl.resetActivity) // DELETE /api/ranking/admin/reset-activity
router.delete('/admin/reset-members',  requireAuth, requireAdmin, ctrl.resetMembers)  // DELETE /api/ranking/admin/reset-members

export default router
