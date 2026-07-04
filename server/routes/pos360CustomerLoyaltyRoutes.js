/**
 * pos360CustomerLoyaltyRoutes.js — Phase B.8
 * Mounted at /api/pos360/guests
 */

import { Router } from 'express'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360CustomerLoyaltyController.js'

const router = Router()
router.use(venueTenantGuard)

// Customers
router.get('/',                                          ctrl.searchCustomers)
router.post('/',                    canAccessPOS3,       ctrl.createCustomer)
router.get('/:customerId',                               ctrl.getCustomer)
router.patch('/:customerId',        canAccessPOS3,       ctrl.updateCustomer)

// Guest profile
router.get('/:customerId/profile',                       ctrl.getGuestProfile)
router.post('/:customerId/profile', canAccessPOS3,       ctrl.createGuestProfile)
router.post('/:customerId/visit',   canAccessPOS3,       ctrl.recordGuestVisit)

// Consent
router.post('/:customerId/consent', canAccessPOS3,       ctrl.recordConsent)

// Loyalty
router.get('/:customerId/loyalty',                       ctrl.getLoyaltyProfile)
router.post('/:customerId/loyalty/enroll', canAccessPOS3, ctrl.enrollLoyalty)
router.post('/:customerId/loyalty/earn',   canAccessPOS3, ctrl.earnPoints)
router.post('/:customerId/loyalty/redeem', canAccessPOS3, ctrl.redeemPoints)
router.post('/:customerId/loyalty/adjust', canAccessPOS3, ctrl.requestPointsAdjustment)
router.post('/loyalty/adjustments/:adjustmentId/approve', canAccessPOS3, ctrl.approvePointsAdjustment)

// Rewards
router.get('/rewards',                                   ctrl.listRewards)
router.post('/:customerId/rewards/redeem', canAccessPOS3, ctrl.redeemReward)
router.post('/redemptions/:redemptionId/reversal', canAccessPOS3, ctrl.requestRewardReversal)
router.post('/redemptions/:redemptionId/reversal/approve', canAccessPOS3, ctrl.approveRewardReversal)

// Tiers
router.get('/tiers',                                     ctrl.listLoyaltyTiers)
router.post('/tiers',               canAccessPOS3,       ctrl.createLoyaltyTier)

// E.A.T. Insights
router.get('/:customerId/eat-insights',                  ctrl.listEATInsights)

// Service Recovery
router.post('/:customerId/service-recovery', canAccessPOS3, ctrl.triggerServiceRecovery)

// Privacy
router.post('/:customerId/privacy/export', canAccessPOS3, ctrl.queuePrivacyExport)
router.post('/:customerId/privacy/delete', canAccessPOS3, ctrl.queuePrivacyDelete)

// Offline queue
router.post('/offline',             canAccessPOS3,       ctrl.queueOfflineGuestAction)

// Merge
router.post('/merge',               canAccessPOS3,       ctrl.requestCustomerMerge)

// SmokeCraft
router.get('/:customerId/smokecraft',                    ctrl.getSmokecraftLink)

export default router
