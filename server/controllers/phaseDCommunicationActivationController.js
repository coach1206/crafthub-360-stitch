/**
 * Phase D.5 — Communication Activation Controller
 * contains_secrets: false
 */

import * as svc from '../services/phaseD/phaseDCommunicationActivationService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system'
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey

// Provider registry
export const listCommunicationProviders         = (req, res) => ok500(res, async () => res.json(await svc.listCommunicationProviders()))
export const getCommunicationProvider           = (req, res) => ok500(res, async () => res.json(await svc.getCommunicationProvider(req.params.providerKey)))
export const getCommunicationProviderStatus     = (req, res) => ok500(res, async () => res.json(await svc.getCommunicationProviderStatus(req.params.providerKey)))
export const updateCommunicationProviderStatus  = (req, res) => ok500(res, async () => res.json(await svc.updateCommunicationProviderStatus(req.params.providerKey, req.body, actorId(req), ikey(req))))
export const getCommunicationCredentialPresenceStatus    = (req, res) => ok500(res, async () => res.json(await svc.getCommunicationCredentialPresenceStatus(req.params.providerKey)))
export const recordCommunicationCredentialPresenceStatus = (req, res) => ok500(res, async () => res.json(await svc.recordCommunicationCredentialPresenceStatus(req.params.providerKey, req.body, actorId(req), ikey(req))))

// Channel registry
export const listCommunicationChannels         = (req, res) => ok500(res, async () => res.json(await svc.listCommunicationChannels()))
export const getCommunicationChannel           = (req, res) => ok500(res, async () => res.json(await svc.getCommunicationChannel(req.params.channelKey)))
export const updateCommunicationChannelStatus  = (req, res) => ok500(res, async () => res.json(await svc.updateCommunicationChannelStatus(req.params.channelKey, req.body, actorId(req))))

// Area registry
export const listCommunicationAreas         = (req, res) => ok500(res, async () => res.json(await svc.listCommunicationAreas()))
export const getCommunicationArea           = (req, res) => ok500(res, async () => res.json(await svc.getCommunicationArea(req.params.areaKey)))
export const updateCommunicationAreaStatus  = (req, res) => ok500(res, async () => res.json(await svc.updateCommunicationAreaStatus(req.params.areaKey, req.body, actorId(req))))

// Provider contracts
export const listSendgridContracts    = (req, res) => ok500(res, async () => res.json(await svc.listSendgridContracts()))
export const createSendgridContract   = (req, res) => ok500(res, async () => res.json(await svc.createSendgridContract(req.body, actorId(req), ikey(req))))
export const listMailgunContracts     = (req, res) => ok500(res, async () => res.json(await svc.listMailgunContracts()))
export const createMailgunContract    = (req, res) => ok500(res, async () => res.json(await svc.createMailgunContract(req.body, actorId(req), ikey(req))))
export const listTwilioContracts      = (req, res) => ok500(res, async () => res.json(await svc.listTwilioContracts()))
export const createTwilioContract     = (req, res) => ok500(res, async () => res.json(await svc.createTwilioContract(req.body, actorId(req), ikey(req))))
export const listFirebaseContracts    = (req, res) => ok500(res, async () => res.json(await svc.listFirebaseContracts()))
export const createFirebaseContract   = (req, res) => ok500(res, async () => res.json(await svc.createFirebaseContract(req.body, actorId(req), ikey(req))))
export const listOnesignalContracts   = (req, res) => ok500(res, async () => res.json(await svc.listOnesignalContracts()))
export const createOnesignalContract  = (req, res) => ok500(res, async () => res.json(await svc.createOnesignalContract(req.body, actorId(req), ikey(req))))
export const listManualEmailRecords   = (req, res) => ok500(res, async () => res.json(await svc.listManualEmailRecords()))
export const createManualEmailRecord  = (req, res) => ok500(res, async () => res.json(await svc.createManualEmailRecord(req.body, actorId(req), ikey(req))))
export const listManualSmsRecords     = (req, res) => ok500(res, async () => res.json(await svc.listManualSmsRecords()))
export const createManualSmsRecord    = (req, res) => ok500(res, async () => res.json(await svc.createManualSmsRecord(req.body, actorId(req), ikey(req))))

// Templates
export const listCommunicationTemplates         = (req, res) => ok500(res, async () => res.json(await svc.listCommunicationTemplates()))
export const createCommunicationTemplate        = (req, res) => ok500(res, async () => res.json(await svc.createCommunicationTemplate(req.body, actorId(req), ikey(req))))
export const listCommunicationTemplateVersions  = (req, res) => ok500(res, async () => res.json(await svc.listCommunicationTemplateVersions()))
export const createCommunicationTemplateVersion = (req, res) => ok500(res, async () => res.json(await svc.createCommunicationTemplateVersion(req.body, actorId(req), ikey(req))))
export const listCommunicationTemplateApprovals = (req, res) => ok500(res, async () => res.json(await svc.listCommunicationTemplateApprovals()))
export const createCommunicationTemplateApproval= (req, res) => ok500(res, async () => res.json(await svc.createCommunicationTemplateApproval(req.body, actorId(req), ikey(req))))

// Message & queue previews
export const listMessagePreviews  = (req, res) => ok500(res, async () => res.json(await svc.listMessagePreviews()))
export const createMessagePreview = (req, res) => ok500(res, async () => res.json(await svc.createMessagePreview(req.body, actorId(req), ikey(req))))
export const listQueuePreviews    = (req, res) => ok500(res, async () => res.json(await svc.listQueuePreviews()))
export const createQueuePreview   = (req, res) => ok500(res, async () => res.json(await svc.createQueuePreview(req.body, actorId(req), ikey(req))))

// Delivery records
export const listDeliveryAttemptRecords  = (req, res) => ok500(res, async () => res.json(await svc.listDeliveryAttemptRecords()))
export const createDeliveryAttemptRecord = (req, res) => ok500(res, async () => res.json(await svc.createDeliveryAttemptRecord(req.body, actorId(req), ikey(req))))
export const listDeliveryStatusRecords   = (req, res) => ok500(res, async () => res.json(await svc.listDeliveryStatusRecords()))
export const createDeliveryStatusRecord  = (req, res) => ok500(res, async () => res.json(await svc.createDeliveryStatusRecord(req.body, actorId(req), ikey(req))))

// Recipient & opt-in/out
export const listRecipientGroups  = (req, res) => ok500(res, async () => res.json(await svc.listRecipientGroups()))
export const createRecipientGroup = (req, res) => ok500(res, async () => res.json(await svc.createRecipientGroup(req.body, actorId(req), ikey(req))))
export const listOptInProfiles    = (req, res) => ok500(res, async () => res.json(await svc.listOptInProfiles()))
export const createOptInProfile   = (req, res) => ok500(res, async () => res.json(await svc.createOptInProfile(req.body, actorId(req), ikey(req))))
export const listOptOutRecords    = (req, res) => ok500(res, async () => res.json(await svc.listOptOutRecords()))
export const createOptOutRecord   = (req, res) => ok500(res, async () => res.json(await svc.createOptOutRecord(req.body, actorId(req), ikey(req))))

// Rate limits & quiet hours
export const listRateLimitProfiles  = (req, res) => ok500(res, async () => res.json(await svc.listRateLimitProfiles()))
export const createRateLimitProfile = (req, res) => ok500(res, async () => res.json(await svc.createRateLimitProfile(req.body, actorId(req), ikey(req))))
export const listQuietHourProfiles  = (req, res) => ok500(res, async () => res.json(await svc.listQuietHourProfiles()))
export const createQuietHourProfile = (req, res) => ok500(res, async () => res.json(await svc.createQuietHourProfile(req.body, actorId(req), ikey(req))))

// Webhook
export const listWebhookRegistry      = (req, res) => ok500(res, async () => res.json(await svc.listWebhookRegistry()))
export const createWebhookEntry       = (req, res) => ok500(res, async () => res.json(await svc.createWebhookEntry(req.body, actorId(req), ikey(req))))
export const listWebhookHealth        = (req, res) => ok500(res, async () => res.json(await svc.listWebhookHealth()))
export const createWebhookHealthRecord= (req, res) => ok500(res, async () => res.json(await svc.createWebhookHealthRecord(req.body, actorId(req), ikey(req))))

// Live delivery lock
export const approveLiveDeliveryRequestPreviewOnly = (req, res) => ok500(res, async () => res.json(await svc.approveLiveDeliveryRequestPreviewOnly(req.body, actorId(req), ikey(req))))
export const getLiveDeliveryLockStatus             = (req, res) => ok500(res, async () => res.json(await svc.getLiveDeliveryLockStatus()))

// Tenant & module mappings
export const listTenantMappings  = (req, res) => ok500(res, async () => res.json(await svc.listTenantMappings()))
export const createTenantMapping = (req, res) => ok500(res, async () => res.json(await svc.createTenantMapping(req.body, actorId(req), ikey(req))))
export const listModuleMappings  = (req, res) => ok500(res, async () => res.json(await svc.listModuleMappings()))
export const createModuleMapping = (req, res) => ok500(res, async () => res.json(await svc.createModuleMapping(req.body, actorId(req), ikey(req))))

// Compliance & risk
export const listComplianceChecklist       = (req, res) => ok500(res, async () => res.json(await svc.listComplianceChecklist()))
export const createComplianceChecklistItem = (req, res) => ok500(res, async () => res.json(await svc.createComplianceChecklistItem(req.body, actorId(req), ikey(req))))
export const listRiskFlags                 = (req, res) => ok500(res, async () => res.json(await svc.listRiskFlags()))
export const createRiskFlag                = (req, res) => ok500(res, async () => res.json(await svc.createRiskFlag(req.body, actorId(req), ikey(req))))

// Audit log
export const listCommunicationAuditLog    = (req, res) => ok500(res, async () => res.json(await svc.listCommunicationAuditLog()))
export const createCommunicationAuditEntry= (req, res) => ok500(res, async () => res.json(await svc.createCommunicationAuditEntry(req.body, actorId(req), ikey(req))))

// Message area profiles
export const listStaffAlertProfiles          = (req, res) => ok500(res, async () => res.json(await svc.listStaffAlertProfiles()))
export const createStaffAlertProfile         = (req, res) => ok500(res, async () => res.json(await svc.createStaffAlertProfile(req.body, actorId(req), ikey(req))))
export const listManagerAlertProfiles        = (req, res) => ok500(res, async () => res.json(await svc.listManagerAlertProfiles()))
export const createManagerAlertProfile       = (req, res) => ok500(res, async () => res.json(await svc.createManagerAlertProfile(req.body, actorId(req), ikey(req))))
export const listGuestMessageProfiles        = (req, res) => ok500(res, async () => res.json(await svc.listGuestMessageProfiles()))
export const createGuestMessageProfile       = (req, res) => ok500(res, async () => res.json(await svc.createGuestMessageProfile(req.body, actorId(req), ikey(req))))
export const listVendorMessageProfiles       = (req, res) => ok500(res, async () => res.json(await svc.listVendorMessageProfiles()))
export const createVendorMessageProfile      = (req, res) => ok500(res, async () => res.json(await svc.createVendorMessageProfile(req.body, actorId(req), ikey(req))))
export const listInventoryAlertProfiles      = (req, res) => ok500(res, async () => res.json(await svc.listInventoryAlertProfiles()))
export const createInventoryAlertProfile     = (req, res) => ok500(res, async () => res.json(await svc.createInventoryAlertProfile(req.body, actorId(req), ikey(req))))
export const listPaymentAlertProfiles        = (req, res) => ok500(res, async () => res.json(await svc.listPaymentAlertProfiles()))
export const createPaymentAlertProfile       = (req, res) => ok500(res, async () => res.json(await svc.createPaymentAlertProfile(req.body, actorId(req), ikey(req))))
export const listPosOrderAlertProfiles       = (req, res) => ok500(res, async () => res.json(await svc.listPosOrderAlertProfiles()))
export const createPosOrderAlertProfile      = (req, res) => ok500(res, async () => res.json(await svc.createPosOrderAlertProfile(req.body, actorId(req), ikey(req))))
export const listReservationAlertProfiles    = (req, res) => ok500(res, async () => res.json(await svc.listReservationAlertProfiles()))
export const createReservationAlertProfile   = (req, res) => ok500(res, async () => res.json(await svc.createReservationAlertProfile(req.body, actorId(req), ikey(req))))
export const listLoyaltyMessageProfiles      = (req, res) => ok500(res, async () => res.json(await svc.listLoyaltyMessageProfiles()))
export const createLoyaltyMessageProfile     = (req, res) => ok500(res, async () => res.json(await svc.createLoyaltyMessageProfile(req.body, actorId(req), ikey(req))))
export const listPassportMessageProfiles     = (req, res) => ok500(res, async () => res.json(await svc.listPassportMessageProfiles()))
export const createPassportMessageProfile    = (req, res) => ok500(res, async () => res.json(await svc.createPassportMessageProfile(req.body, actorId(req), ikey(req))))
export const listSmokecraftMessageProfiles   = (req, res) => ok500(res, async () => res.json(await svc.listSmokecraftMessageProfiles()))
export const createSmokecraftMessageProfile  = (req, res) => ok500(res, async () => res.json(await svc.createSmokecraftMessageProfile(req.body, actorId(req), ikey(req))))
export const listCrafthubMessageProfiles     = (req, res) => ok500(res, async () => res.json(await svc.listCrafthubMessageProfiles()))
export const createCrafthubMessageProfile    = (req, res) => ok500(res, async () => res.json(await svc.createCrafthubMessageProfile(req.body, actorId(req), ikey(req))))
export const listEatCommandAlertProfiles     = (req, res) => ok500(res, async () => res.json(await svc.listEatCommandAlertProfiles()))
export const createEatCommandAlertProfile    = (req, res) => ok500(res, async () => res.json(await svc.createEatCommandAlertProfile(req.body, actorId(req), ikey(req))))
export const listSecurityAlertProfiles       = (req, res) => ok500(res, async () => res.json(await svc.listSecurityAlertProfiles()))
export const createSecurityAlertProfile      = (req, res) => ok500(res, async () => res.json(await svc.createSecurityAlertProfile(req.body, actorId(req), ikey(req))))
export const listSystemHealthAlertProfiles   = (req, res) => ok500(res, async () => res.json(await svc.listSystemHealthAlertProfiles()))
export const createSystemHealthAlertProfile  = (req, res) => ok500(res, async () => res.json(await svc.createSystemHealthAlertProfile(req.body, actorId(req), ikey(req))))
export const listMarketplaceMessageProfiles  = (req, res) => ok500(res, async () => res.json(await svc.listMarketplaceMessageProfiles()))
export const createMarketplaceMessageProfile = (req, res) => ok500(res, async () => res.json(await svc.createMarketplaceMessageProfile(req.body, actorId(req), ikey(req))))
export const listCampaignMessageProfiles     = (req, res) => ok500(res, async () => res.json(await svc.listCampaignMessageProfiles()))
export const createCampaignMessageProfile    = (req, res) => ok500(res, async () => res.json(await svc.createCampaignMessageProfile(req.body, actorId(req), ikey(req))))
export const listManualMessageProfiles       = (req, res) => ok500(res, async () => res.json(await svc.listManualMessageProfiles()))
export const createManualMessageProfile      = (req, res) => ok500(res, async () => res.json(await svc.createManualMessageProfile(req.body, actorId(req), ikey(req))))

// Readiness summary
export const getCommunicationReadinessSummary = (req, res) => ok500(res, async () => res.json(await svc.getCommunicationReadinessSummary()))
