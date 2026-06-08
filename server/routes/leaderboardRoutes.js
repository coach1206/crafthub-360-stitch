import { Router } from 'express'
import * as ctrl from '../controllers/leaderboardController.js'

const router = Router()

router.get(  '/',                        ctrl.getLeaderboard)
router.post( '/',                        ctrl.submitScore)
router.get(  '/session/:sessionId',      ctrl.getSessionScore)

export default router
