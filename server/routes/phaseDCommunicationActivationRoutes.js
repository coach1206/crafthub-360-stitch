/**
 * Phase D.5 — Communication Activation Routes
 * contains_secrets: false
 * Mounted at: /api/phase-d/communication-activation
 */

import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/phaseDCommunicationActivationController.js'

const router = Router()

// Provider registry
router.get('/providers',                                    ctrl.listCommunicationProviders)
router.get('/providers/:providerKey',                       ctrl.getCommunicationProvider)
router.get('/providers/:providerKey/status',                ctrl.getCommunicationProviderStatus)
router.patch('/providers/:providerKey/status',              canAccessPOS3, ctrl.updateCommunicationProviderStatus)
router.get('/providers/:providerKey/credential-presence',   ctrl.getCommunicationCredentialPresenceStatus)
router.post('/providers/:providerKey/credential-presence',  canAccessPOS3, ctrl.recordCommunicationCredentialPresenceStatus)

// Channel registry
router.get('/channels',                         ctrl.listCommunicationChannels)
router.get('/channels/:channelKey',             ctrl.getCommunicationChannel)
router.patch('/channels/:channelKey/status',    canAccessPOS3, ctrl.updateCommunicationChannelStatus)

// Area registry
router.get('/areas',                        ctrl.listCommunicationAreas)
router.get('/areas/:areaKey',               ctrl.getCommunicationArea)
router.patch('/areas/:areaKey/status',      canAccessPOS3, ctrl.updateCommunicationAreaStatus)

// SendGrid contracts
router.get('/sendgrid/contracts',           ctrl.listSendgridContracts)
router.post('/sendgrid/contracts',          canAccessPOS3, ctrl.createSendgridContract)

// Mailgun contracts
router.get('/mailgun/contracts',            ctrl.listMailgunContracts)
router.post('/mailgun/contracts',           canAccessPOS3, ctrl.createMailgunContract)

// Twilio contracts
router.get('/twilio/contracts',             ctrl.listTwilioContracts)
router.post('/twilio/contracts',            canAccessPOS3, ctrl.createTwilioContract)

// Firebase contracts
router.get('/firebase/contracts',           ctrl.listFirebaseContracts)
router.post('/firebase/contracts',          canAccessPOS3, ctrl.createFirebaseContract)

// OneSignal contracts
router.get('/onesignal/contracts',          ctrl.listOnesignalContracts)
router.post('/onesignal/contracts',         canAccessPOS3, ctrl.createOnesignalContract)

// Manual email / SMS records
router.get('/manual-email/records',         ctrl.listManualEmailRecords)
router.post('/manual-email/records',        canAccessPOS3, ctrl.createManualEmailRecord)
router.get('/manual-sms/records',           ctrl.listManualSmsRecords)
router.post('/manual-sms/records',          canAccessPOS3, ctrl.createManualSmsRecord)

// Templates
router.get('/templates',                    ctrl.listCommunicationTemplates)
router.post('/templates',                   canAccessPOS3, ctrl.createCommunicationTemplate)
router.get('/templates/versions',           ctrl.listCommunicationTemplateVersions)
router.post('/templates/versions',          canAccessPOS3, ctrl.createCommunicationTemplateVersion)
router.get('/templates/approvals',          ctrl.listCommunicationTemplateApprovals)
router.post('/templates/approvals',         canAccessPOS3, ctrl.createCommunicationTemplateApproval)

// Message & queue previews
router.get('/message-previews',             ctrl.listMessagePreviews)
router.post('/message-previews',            canAccessPOS3, ctrl.createMessagePreview)
router.get('/queue-previews',               ctrl.listQueuePreviews)
router.post('/queue-previews',              canAccessPOS3, ctrl.createQueuePreview)

// Delivery records
router.get('/delivery-attempt-records',     ctrl.listDeliveryAttemptRecords)
router.post('/delivery-attempt-records',    canAccessPOS3, ctrl.createDeliveryAttemptRecord)
router.get('/delivery-status-records',      ctrl.listDeliveryStatusRecords)
router.post('/delivery-status-records',     canAccessPOS3, ctrl.createDeliveryStatusRecord)

// Recipient groups & opt-in/out
router.get('/recipient-groups',             ctrl.listRecipientGroups)
router.post('/recipient-groups',            canAccessPOS3, ctrl.createRecipientGroup)
router.get('/opt-in-profiles',              ctrl.listOptInProfiles)
router.post('/opt-in-profiles',             canAccessPOS3, ctrl.createOptInProfile)
router.get('/opt-out-records',              ctrl.listOptOutRecords)
router.post('/opt-out-records',             canAccessPOS3, ctrl.createOptOutRecord)

// Rate limits & quiet hours
router.get('/rate-limit-profiles',          ctrl.listRateLimitProfiles)
router.post('/rate-limit-profiles',         canAccessPOS3, ctrl.createRateLimitProfile)
router.get('/quiet-hour-profiles',          ctrl.listQuietHourProfiles)
router.post('/quiet-hour-profiles',         canAccessPOS3, ctrl.createQuietHourProfile)

// Webhook
router.get('/webhook-registry',             ctrl.listWebhookRegistry)
router.post('/webhook-registry',            canAccessPOS3, ctrl.createWebhookEntry)
router.get('/webhook-health',               ctrl.listWebhookHealth)
router.post('/webhook-health',              canAccessPOS3, ctrl.createWebhookHealthRecord)

// Live delivery lock
router.get('/live-delivery-lock',           ctrl.getLiveDeliveryLockStatus)
router.post('/live-delivery-lock/approve',  canAccessPOS3, ctrl.approveLiveDeliveryRequestPreviewOnly)

// Tenant & module mappings
router.get('/tenant-mappings',              ctrl.listTenantMappings)
router.post('/tenant-mappings',             canAccessPOS3, ctrl.createTenantMapping)
router.get('/module-mappings',              ctrl.listModuleMappings)
router.post('/module-mappings',             canAccessPOS3, ctrl.createModuleMapping)

// Compliance & risk
router.get('/compliance-checklist',         ctrl.listComplianceChecklist)
router.post('/compliance-checklist',        canAccessPOS3, ctrl.createComplianceChecklistItem)
router.get('/risk-flags',                   ctrl.listRiskFlags)
router.post('/risk-flags',                  canAccessPOS3, ctrl.createRiskFlag)

// Audit log
router.get('/audit-log',                    ctrl.listCommunicationAuditLog)
router.post('/audit-log',                   canAccessPOS3, ctrl.createCommunicationAuditEntry)

// Message area profiles
router.get('/profiles/staff-alert',             ctrl.listStaffAlertProfiles)
router.post('/profiles/staff-alert',            canAccessPOS3, ctrl.createStaffAlertProfile)
router.get('/profiles/manager-alert',           ctrl.listManagerAlertProfiles)
router.post('/profiles/manager-alert',          canAccessPOS3, ctrl.createManagerAlertProfile)
router.get('/profiles/guest-message',           ctrl.listGuestMessageProfiles)
router.post('/profiles/guest-message',          canAccessPOS3, ctrl.createGuestMessageProfile)
router.get('/profiles/vendor-message',          ctrl.listVendorMessageProfiles)
router.post('/profiles/vendor-message',         canAccessPOS3, ctrl.createVendorMessageProfile)
router.get('/profiles/inventory-alert',         ctrl.listInventoryAlertProfiles)
router.post('/profiles/inventory-alert',        canAccessPOS3, ctrl.createInventoryAlertProfile)
router.get('/profiles/payment-alert',           ctrl.listPaymentAlertProfiles)
router.post('/profiles/payment-alert',          canAccessPOS3, ctrl.createPaymentAlertProfile)
router.get('/profiles/pos-order-alert',         ctrl.listPosOrderAlertProfiles)
router.post('/profiles/pos-order-alert',        canAccessPOS3, ctrl.createPosOrderAlertProfile)
router.get('/profiles/reservation-alert',       ctrl.listReservationAlertProfiles)
router.post('/profiles/reservation-alert',      canAccessPOS3, ctrl.createReservationAlertProfile)
router.get('/profiles/loyalty-message',         ctrl.listLoyaltyMessageProfiles)
router.post('/profiles/loyalty-message',        canAccessPOS3, ctrl.createLoyaltyMessageProfile)
router.get('/profiles/passport-message',        ctrl.listPassportMessageProfiles)
router.post('/profiles/passport-message',       canAccessPOS3, ctrl.createPassportMessageProfile)
router.get('/profiles/smokecraft-message',      ctrl.listSmokecraftMessageProfiles)
router.post('/profiles/smokecraft-message',     canAccessPOS3, ctrl.createSmokecraftMessageProfile)
router.get('/profiles/crafthub-message',        ctrl.listCrafthubMessageProfiles)
router.post('/profiles/crafthub-message',       canAccessPOS3, ctrl.createCrafthubMessageProfile)
router.get('/profiles/eat-command-alert',       ctrl.listEatCommandAlertProfiles)
router.post('/profiles/eat-command-alert',      canAccessPOS3, ctrl.createEatCommandAlertProfile)
router.get('/profiles/security-alert',          ctrl.listSecurityAlertProfiles)
router.post('/profiles/security-alert',         canAccessPOS3, ctrl.createSecurityAlertProfile)
router.get('/profiles/system-health-alert',     ctrl.listSystemHealthAlertProfiles)
router.post('/profiles/system-health-alert',    canAccessPOS3, ctrl.createSystemHealthAlertProfile)
router.get('/profiles/marketplace-message',     ctrl.listMarketplaceMessageProfiles)
router.post('/profiles/marketplace-message',    canAccessPOS3, ctrl.createMarketplaceMessageProfile)
router.get('/profiles/campaign-message',        ctrl.listCampaignMessageProfiles)
router.post('/profiles/campaign-message',       canAccessPOS3, ctrl.createCampaignMessageProfile)
router.get('/profiles/manual-message',          ctrl.listManualMessageProfiles)
router.post('/profiles/manual-message',         canAccessPOS3, ctrl.createManualMessageProfile)

// Readiness summary
router.get('/readiness-summary',            ctrl.getCommunicationReadinessSummary)

export default router
