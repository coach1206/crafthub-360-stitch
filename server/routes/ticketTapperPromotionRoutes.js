import { Router } from 'express'
import {
  getHealth,
  createPromotionHandler,
  listPromotionsHandler,
  getPromotionHandler,
  updatePromotionHandler,
  activatePromotionHandler,
  deactivatePromotionHandler,
  getSmokeCraftActiveHandler,
  recordRedemptionHandler,
  writeAuditEventHandler,
  getAuditLogHandler,
} from '../controllers/ticketTapperPromotionController.js'

const router = Router()

router.get('/health',                    getHealth)
router.get('/',                          listPromotionsHandler)
router.post('/',                         createPromotionHandler)
router.get('/smokecraft/active',         getSmokeCraftActiveHandler)
router.get('/audit-log',                 getAuditLogHandler)
router.post('/redemption',               recordRedemptionHandler)
router.post('/audit/event',              writeAuditEventHandler)
router.get('/:promotionId',              getPromotionHandler)
router.patch('/:promotionId',            updatePromotionHandler)
router.post('/:promotionId/activate',    activatePromotionHandler)
router.post('/:promotionId/deactivate',  deactivatePromotionHandler)

export default router
