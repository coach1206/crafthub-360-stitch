import { Router } from 'express'
import {
  getPaymentReadiness,
  getAccountStatus,
  createAccount,
  createOnboardingLink,
  refreshAccountStatus,
  getPaymentPreview,
  createPaymentIntentHandler,
  createCheckoutSessionHandler,
  getOrderPaymentStatus,
  getRefundPreview,
  createRefundHandler,
  receiveWebhookHandler,
  getAuditLogsHandler,
} from '../controllers/paymentMoneyBridgeController.js'

const router = Router()

router.get('/readiness',                               getPaymentReadiness)
router.get('/accounts/:ownerType/:ownerId',            getAccountStatus)
router.post('/accounts/:ownerType/:ownerId',           createAccount)
router.post('/accounts/:ownerType/:ownerId/onboarding-link', createOnboardingLink)
router.post('/accounts/:ownerType/:ownerId/refresh',   refreshAccountStatus)
router.post('/payment-preview',                        getPaymentPreview)
router.post('/create-payment-intent',                  createPaymentIntentHandler)
router.post('/checkout-session',                       createCheckoutSessionHandler)
router.get('/orders/:orderId/status',                  getOrderPaymentStatus)
router.post('/orders/:orderId/refund-preview',         getRefundPreview)
router.post('/orders/:orderId/refund',                 createRefundHandler)
router.post('/webhooks/:providerName',                 receiveWebhookHandler)
router.get('/audit-logs',                              getAuditLogsHandler)

export default router
