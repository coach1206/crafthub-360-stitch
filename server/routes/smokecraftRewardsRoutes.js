/**
 * SmokeCraft Rewards Routes
 * Mounted at /api/modules/smokecraft/rewards
 */

import { Router } from 'express'
import {
  getRewardsStatus,
  getUserRewards,
  evaluateRewards,
  awardReward,
  evaluatePassportReward,
  awardPassportReward,
  evaluateOrderReward,
  evaluatePairingReward,
  getMonetizationHandler,
  evaluateMonetizationHandler,
  getRewardAudit,
} from '../controllers/smokecraftRewardsController.js'

const router = Router()

router.get('/status',                          getRewardsStatus)
router.get('/user/:userId',                    getUserRewards)
router.post('/evaluate',                       evaluateRewards)
router.post('/award',                          awardReward)
router.post('/passport/evaluate',              evaluatePassportReward)
router.post('/passport/award',                 awardPassportReward)
router.post('/order/evaluate',                 evaluateOrderReward)
router.post('/pairing/evaluate',               evaluatePairingReward)
router.get('/monetization/:venueId',           getMonetizationHandler)
router.post('/monetization/evaluate',          evaluateMonetizationHandler)
router.get('/audit/:rewardId',                 getRewardAudit)

export default router
