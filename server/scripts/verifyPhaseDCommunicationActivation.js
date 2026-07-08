/**
 * Phase D.5 — Communication Activation Verification Script
 * Run: node server/scripts/verifyPhaseDCommunicationActivation.js
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())
const pass = []
const fail = []

function check(label, value) {
  if (value) { pass.push(label) } else { fail.push(label) }
}

// Load files
const sql     = readFileSync(resolve(root, 'server/db/migrations/059_phase_d_communication_activation.sql'), 'utf8')
const flags   = readFileSync(resolve(root, 'server/config/phaseDCommunicationActivationFeatureFlags.js'), 'utf8')
const contracts = readFileSync(resolve(root, 'server/services/phaseD/phaseDCommunicationActivationContracts.js'), 'utf8')
const service = readFileSync(resolve(root, 'server/services/phaseD/phaseDCommunicationActivationService.js'), 'utf8')
const ctrl    = readFileSync(resolve(root, 'server/controllers/phaseDCommunicationActivationController.js'), 'utf8')
const routes  = readFileSync(resolve(root, 'server/routes/phaseDCommunicationActivationRoutes.js'), 'utf8')
const page    = readFileSync(resolve(root, 'src/pages/phaseD/PhaseDCommunicationActivation.jsx'), 'utf8')
const locales = readFileSync(resolve(root, 'src/locales/phaseDCommunicationActivation.js'), 'utf8')
const serverIndex = readFileSync(resolve(root, 'server/index.js'), 'utf8')
const appJsx  = readFileSync(resolve(root, 'src/App.jsx'), 'utf8')
const pkgJson = readFileSync(resolve(root, 'package.json'), 'utf8')

// Helper for boolean columns with possible whitespace
const sqlHas = col => new RegExp(col + '\\s+BOOLEAN NOT NULL DEFAULT FALSE').test(sql)
const sqlHasTrue = col => new RegExp(col + '\\s+BOOLEAN NOT NULL DEFAULT TRUE').test(sql)

// ─── SQL MIGRATION ───────────────────────────────────────────────────────────

// Required tables
const tables = [
  'communication_provider_registry',
  'communication_credential_presence_log',
  'communication_channel_registry',
  'communication_area_registry',
  'communication_sendgrid_contracts',
  'communication_mailgun_contracts',
  'communication_twilio_contracts',
  'communication_firebase_contracts',
  'communication_onesignal_contracts',
  'communication_manual_email_records',
  'communication_manual_sms_records',
  'communication_template_registry',
  'communication_template_versions',
  'communication_template_approvals',
  'communication_message_previews',
  'communication_queue_previews',
  'communication_delivery_attempt_records',
  'communication_delivery_status_records',
  'communication_recipient_groups',
  'communication_opt_in_profiles',
  'communication_opt_out_records',
  'communication_rate_limit_profiles',
  'communication_quiet_hour_profiles',
  'communication_webhook_registry',
  'communication_webhook_health',
  'communication_live_delivery_lock',
  'communication_tenant_mappings',
  'communication_module_mappings',
  'communication_compliance_checklist',
  'communication_risk_flags',
  'communication_activation_audit',
  'communication_staff_alert_profiles',
  'communication_manager_alert_profiles',
  'communication_guest_message_profiles',
  'communication_vendor_message_profiles',
  'communication_inventory_alert_profiles',
  'communication_payment_alert_profiles',
  'communication_pos_order_alert_profiles',
  'communication_reservation_alert_profiles',
  'communication_loyalty_message_profiles',
  'communication_passport_message_profiles',
  'communication_smokecraft_message_profiles',
  'communication_crafthub_message_profiles',
  'communication_eat_command_alert_profiles',
  'communication_security_alert_profiles',
  'communication_system_health_alert_profiles',
  'communication_marketplace_message_profiles',
  'communication_campaign_message_profiles',
  'communication_manual_message_profiles',
]

for (const t of tables) {
  check(`SQL: table ${t} exists`, sql.includes(`CREATE TABLE IF NOT EXISTS ${t}`))
}

// Safety boolean columns
check('SQL: connected DEFAULT FALSE',               sqlHas('connected'))
check('SQL: real_delivery_enabled DEFAULT FALSE',   sqlHas('real_delivery_enabled'))
check('SQL: live_mode_enabled DEFAULT FALSE',       sqlHas('live_mode_enabled'))
check('SQL: webhook_enabled DEFAULT FALSE',         sqlHas('webhook_enabled'))
check('SQL: auto_send DEFAULT FALSE',               sqlHas('auto_send'))
check('SQL: real_delivery DEFAULT FALSE',           sqlHas('real_delivery'))
check('SQL: is_real_message DEFAULT FALSE',         sqlHas('is_real_message'))
check('SQL: delivery_attempted DEFAULT FALSE',      sqlHas('delivery_attempted'))
check('SQL: real_delivery_attempted DEFAULT FALSE', sqlHas('real_delivery_attempted'))
check('SQL: delivered DEFAULT FALSE',               sqlHas('delivered'))
check('SQL: real_delivery_confirmed DEFAULT FALSE', sqlHas('real_delivery_confirmed'))
check('SQL: is_real_queue DEFAULT FALSE',           sqlHas('is_real_queue'))
check('SQL: delivery_enabled DEFAULT FALSE',        sqlHas('delivery_enabled'))
check('SQL: queued_for_send DEFAULT FALSE',         sqlHas('queued_for_send'))
check('SQL: preview_only DEFAULT TRUE',             sqlHasTrue('preview_only'))
check('SQL: live_delivery_gated DEFAULT TRUE',      sqlHasTrue('live_delivery_gated'))
check('SQL: requires_opt_in DEFAULT TRUE',          sqlHasTrue('requires_opt_in'))
check('SQL: contains_secrets DEFAULT FALSE',        sqlHas('contains_secrets'))
check('SQL: stores_secrets DEFAULT FALSE',          sqlHas('stores_secrets'))
check('SQL: environment lock present',              sql.includes('Phase D.5 activation required before live message delivery'))
check('SQL: contains_secrets: false comment',       sql.includes('contains_secrets: false'))
check('SQL: stores_secrets: false comment',         sql.includes('stores_secrets: false'))
check('SQL: idempotency_key present',               sql.includes('idempotency_key'))
check('SQL: safe migration comment',                sql.includes('Safe migration'))

// ─── FEATURE FLAGS ────────────────────────────────────────────────────────────

// Real delivery flags must be FALSE
const realDeliveryFlags = [
  'COMMUNICATION_REAL_EMAIL_DELIVERY_ENABLED',
  'COMMUNICATION_REAL_SMS_DELIVERY_ENABLED',
  'COMMUNICATION_REAL_PUSH_DELIVERY_ENABLED',
  'COMMUNICATION_REAL_VENDOR_MESSAGE_DELIVERY_ENABLED',
  'COMMUNICATION_REAL_GUEST_MESSAGE_DELIVERY_ENABLED',
  'COMMUNICATION_REAL_STAFF_ALERT_DELIVERY_ENABLED',
  'COMMUNICATION_AUTO_SEND_ENABLED',
  'COMMUNICATION_EXTERNAL_PROVIDER_WEBHOOK_PROCESSING_ENABLED',
  'COMMUNICATION_SENDGRID_CONNECTED',
  'COMMUNICATION_MAILGUN_CONNECTED',
  'COMMUNICATION_TWILIO_CONNECTED',
  'COMMUNICATION_FIREBASE_CONNECTED',
  'COMMUNICATION_ONESIGNAL_CONNECTED',
]

for (const flag of realDeliveryFlags) {
  check(`FLAGS: ${flag} is false`, new RegExp(flag + '\\s*:\\s*false').test(flags))
}

// Enforcement flags must be TRUE
const enforcementFlags = [
  'COMMUNICATION_NO_SECRET_STORAGE_ENFORCED',
  'COMMUNICATION_NO_FAKE_DELIVERY_ENFORCED',
  'COMMUNICATION_NO_FAKE_PROVIDER_CONNECTION_ENFORCED',
  'COMMUNICATION_NO_UNAUTHORIZED_AUTO_SEND_ENFORCED',
  'COMMUNICATION_CAN_ACCESS_POS3_WRITE_REQUIRED',
  'COMMUNICATION_ADMIN_ONLY_LIVE_REQUEST_REQUIRED',
  'COMMUNICATION_IDEMPOTENCY_ENFORCED',
  'COMMUNICATION_AUDIT_TRAIL_ENFORCED',
  'COMMUNICATION_TEMPLATE_APPROVAL_GATE_REQUIRED',
  'COMMUNICATION_OPT_IN_REQUIRED_FOR_GUEST_MESSAGES',
]

for (const flag of enforcementFlags) {
  check(`FLAGS: ${flag} is true`, new RegExp(flag + '\\s*:\\s*true').test(flags))
}

check('FLAGS: getPhaseDCommunicationActivationFlags exported', flags.includes('export function getPhaseDCommunicationActivationFlags'))
check('FLAGS: overrides spread', flags.includes('...overrides'))
check('FLAGS: export default', flags.includes('export default PHASE_D_COMMUNICATION_ACTIVATION_FLAGS'))

// ─── CONTRACTS ───────────────────────────────────────────────────────────────

check('CONTRACTS: COMMUNICATION_PROVIDER_KEYS', contracts.includes('COMMUNICATION_PROVIDER_KEYS'))
check('CONTRACTS: COMMUNICATION_CHANNEL_KEYS',  contracts.includes('COMMUNICATION_CHANNEL_KEYS'))
check('CONTRACTS: COMMUNICATION_AREA_KEYS',     contracts.includes('COMMUNICATION_AREA_KEYS'))
check('CONTRACTS: COMMUNICATION_ACTIVATION_STATUSES', contracts.includes('COMMUNICATION_ACTIVATION_STATUSES'))
check('CONTRACTS: FORBIDDEN_COMMUNICATION_FIELDS', contracts.includes('FORBIDDEN_COMMUNICATION_FIELDS'))
check('CONTRACTS: sendgrid_api_key in FORBIDDEN', contracts.includes('sendgrid_api_key'))
check('CONTRACTS: twilio_auth_token in FORBIDDEN', contracts.includes('twilio_auth_token'))
check('CONTRACTS: smtp_password in FORBIDDEN',  contracts.includes('smtp_password'))
check('CONTRACTS: assertNoCommunicationSecretsInPayload', contracts.includes('assertNoCommunicationSecretsInPayload'))
check('CONTRACTS: assertNoFakeCommunicationDeliveryClaim', contracts.includes('assertNoFakeCommunicationDeliveryClaim'))
check('CONTRACTS: assertNoFakeCommunicationProviderConnection', contracts.includes('assertNoFakeCommunicationProviderConnection'))
check('CONTRACTS: assertNoUnauthorizedAutoSendClaim', contracts.includes('assertNoUnauthorizedAutoSendClaim'))
check('CONTRACTS: validateCommunicationProviderKey', contracts.includes('validateCommunicationProviderKey'))
check('CONTRACTS: validateCommunicationChannelKey', contracts.includes('validateCommunicationChannelKey'))
check('CONTRACTS: validateCommunicationAreaKey',   contracts.includes('validateCommunicationAreaKey'))
check('CONTRACTS: export default',                 contracts.includes('export default'))

// ─── SERVICE ─────────────────────────────────────────────────────────────────

check('SERVICE: AREA constant',                service.includes("const AREA = 'phase_d_communication_activation'"))
check('SERVICE: localFallback',                service.includes('localFallback'))
check('SERVICE: makeCommListCreate factory',   service.includes('makeCommListCreate'))
check('SERVICE: isDbAvailable import',         service.includes('isDbAvailable'))
check('SERVICE: assertNoCommunicationSecretsInPayload used', service.includes('assertNoCommunicationSecretsInPayload'))
check('SERVICE: assertNoFakeCommunicationDeliveryClaim used', service.includes('assertNoFakeCommunicationDeliveryClaim'))
check('SERVICE: assertNoFakeCommunicationProviderConnection used', service.includes('assertNoFakeCommunicationProviderConnection'))
check('SERVICE: assertNoUnauthorizedAutoSendClaim used', service.includes('assertNoUnauthorizedAutoSendClaim'))
check('SERVICE: listCommunicationProviders',   service.includes('listCommunicationProviders'))
check('SERVICE: getCommunicationProvider',     service.includes('getCommunicationProvider'))
check('SERVICE: getCommunicationProviderStatus', service.includes('getCommunicationProviderStatus'))
check('SERVICE: updateCommunicationProviderStatus', service.includes('updateCommunicationProviderStatus'))
check('SERVICE: getCommunicationCredentialPresenceStatus', service.includes('getCommunicationCredentialPresenceStatus'))
check('SERVICE: recordCommunicationCredentialPresenceStatus', service.includes('recordCommunicationCredentialPresenceStatus'))
check('SERVICE: listCommunicationChannels',    service.includes('listCommunicationChannels'))
check('SERVICE: getCommunicationChannel',      service.includes('getCommunicationChannel'))
check('SERVICE: updateCommunicationChannelStatus', service.includes('updateCommunicationChannelStatus'))
check('SERVICE: listCommunicationAreas',       service.includes('listCommunicationAreas'))
check('SERVICE: getCommunicationArea',         service.includes('getCommunicationArea'))
check('SERVICE: updateCommunicationAreaStatus', service.includes('updateCommunicationAreaStatus'))
check('SERVICE: listSendgridContracts',        service.includes('listSendgridContracts'))
check('SERVICE: listMailgunContracts',         service.includes('listMailgunContracts'))
check('SERVICE: listTwilioContracts',          service.includes('listTwilioContracts'))
check('SERVICE: listFirebaseContracts',        service.includes('listFirebaseContracts'))
check('SERVICE: listOnesignalContracts',       service.includes('listOnesignalContracts'))
check('SERVICE: listManualEmailRecords',       service.includes('listManualEmailRecords'))
check('SERVICE: listManualSmsRecords',         service.includes('listManualSmsRecords'))
check('SERVICE: listCommunicationTemplates',   service.includes('listCommunicationTemplates'))
check('SERVICE: listCommunicationTemplateVersions', service.includes('listCommunicationTemplateVersions'))
check('SERVICE: listCommunicationTemplateApprovals', service.includes('listCommunicationTemplateApprovals'))
check('SERVICE: listMessagePreviews',          service.includes('listMessagePreviews'))
check('SERVICE: createMessagePreview forces preview_only true', service.includes('preview_only: true'))
check('SERVICE: createMessagePreview forces is_real_message false', service.includes('is_real_message: false'))
check('SERVICE: listQueuePreviews',            service.includes('listQueuePreviews'))
check('SERVICE: createQueuePreview forces is_real_queue false', service.includes('is_real_queue: false'))
check('SERVICE: createQueuePreview forces queued_for_send false', service.includes('queued_for_send: false'))
check('SERVICE: listDeliveryAttemptRecords',   service.includes('listDeliveryAttemptRecords'))
check('SERVICE: createDeliveryAttemptRecord forces real_delivery_attempted false', service.includes('real_delivery_attempted: false'))
check('SERVICE: listDeliveryStatusRecords',    service.includes('listDeliveryStatusRecords'))
check('SERVICE: createDeliveryStatusRecord forces delivered false', service.includes('delivered: false'))
check('SERVICE: listRecipientGroups',          service.includes('listRecipientGroups'))
check('SERVICE: listOptInProfiles',            service.includes('listOptInProfiles'))
check('SERVICE: listOptOutRecords',            service.includes('listOptOutRecords'))
check('SERVICE: listRateLimitProfiles',        service.includes('listRateLimitProfiles'))
check('SERVICE: listQuietHourProfiles',        service.includes('listQuietHourProfiles'))
check('SERVICE: listWebhookRegistry',          service.includes('listWebhookRegistry'))
check('SERVICE: listWebhookHealth',            service.includes('listWebhookHealth'))
check('SERVICE: approveLiveDeliveryRequestPreviewOnly', service.includes('approveLiveDeliveryRequestPreviewOnly'))
check('SERVICE: approveLiveDeliveryRequestPreviewOnly does not enable live delivery', service.includes('approved_for_live: false'))
check('SERVICE: getLiveDeliveryLockStatus',    service.includes('getLiveDeliveryLockStatus'))
check('SERVICE: getLiveDeliveryLockStatus returns real_delivery_enabled false', service.includes('real_delivery_enabled: false'))
check('SERVICE: listTenantMappings',           service.includes('listTenantMappings'))
check('SERVICE: listModuleMappings',           service.includes('listModuleMappings'))
check('SERVICE: listComplianceChecklist',      service.includes('listComplianceChecklist'))
check('SERVICE: listRiskFlags',                service.includes('listRiskFlags'))
check('SERVICE: listCommunicationAuditLog',    service.includes('listCommunicationAuditLog'))
check('SERVICE: listStaffAlertProfiles',       service.includes('listStaffAlertProfiles'))
check('SERVICE: listManagerAlertProfiles',     service.includes('listManagerAlertProfiles'))
check('SERVICE: listGuestMessageProfiles',     service.includes('listGuestMessageProfiles'))
check('SERVICE: listVendorMessageProfiles',    service.includes('listVendorMessageProfiles'))
check('SERVICE: listInventoryAlertProfiles',   service.includes('listInventoryAlertProfiles'))
check('SERVICE: listPaymentAlertProfiles',     service.includes('listPaymentAlertProfiles'))
check('SERVICE: listPosOrderAlertProfiles',    service.includes('listPosOrderAlertProfiles'))
check('SERVICE: listReservationAlertProfiles', service.includes('listReservationAlertProfiles'))
check('SERVICE: listLoyaltyMessageProfiles',   service.includes('listLoyaltyMessageProfiles'))
check('SERVICE: listPassportMessageProfiles',  service.includes('listPassportMessageProfiles'))
check('SERVICE: listSmokecraftMessageProfiles',service.includes('listSmokecraftMessageProfiles'))
check('SERVICE: listCrafthubMessageProfiles',  service.includes('listCrafthubMessageProfiles'))
check('SERVICE: listEatCommandAlertProfiles',  service.includes('listEatCommandAlertProfiles'))
check('SERVICE: listSecurityAlertProfiles',    service.includes('listSecurityAlertProfiles'))
check('SERVICE: listSystemHealthAlertProfiles',service.includes('listSystemHealthAlertProfiles'))
check('SERVICE: listMarketplaceMessageProfiles',service.includes('listMarketplaceMessageProfiles'))
check('SERVICE: listCampaignMessageProfiles',  service.includes('listCampaignMessageProfiles'))
check('SERVICE: listManualMessageProfiles',    service.includes('listManualMessageProfiles'))
check('SERVICE: getCommunicationReadinessSummary', service.includes('getCommunicationReadinessSummary'))
check('SERVICE: readiness returns BUILD_ONLY_NO_REAL_DELIVERY', service.includes('BUILD_ONLY_NO_REAL_DELIVERY'))
check('SERVICE: readiness returns real_email_delivery false',   service.includes('real_email_delivery: false'))
check('SERVICE: readiness returns real_sms_delivery false',     service.includes('real_sms_delivery: false'))
check('SERVICE: readiness returns auto_send_enabled false',     service.includes('auto_send_enabled: false'))
check('SERVICE: readiness returns sendgrid_connected false',    service.includes('sendgrid_connected: false'))
check('SERVICE: readiness returns no_secret_storage true',      service.includes('no_secret_storage: true'))
check('SERVICE: credential presence stores_secrets false',      service.includes('stores_secrets: false'))
check('SERVICE: stores_secrets: false comment',                 service.includes('stores_secrets: false'))

// ─── CONTROLLER ──────────────────────────────────────────────────────────────

check('CTRL: ok500 pattern',                   ctrl.includes('const ok500 = (res, fn) => fn().catch'))
check('CTRL: actorId pattern',                 ctrl.includes("const actorId = req => req.user?.id || req.headers['x-actor-id']"))
check('CTRL: ikey pattern',                    ctrl.includes("const ikey = req => req.headers['x-idempotency-key']"))
check('CTRL: listCommunicationProviders',      ctrl.includes('listCommunicationProviders'))
check('CTRL: updateCommunicationProviderStatus', ctrl.includes('updateCommunicationProviderStatus'))
check('CTRL: listCommunicationChannels',       ctrl.includes('listCommunicationChannels'))
check('CTRL: listCommunicationAreas',          ctrl.includes('listCommunicationAreas'))
check('CTRL: listMessagePreviews',             ctrl.includes('listMessagePreviews'))
check('CTRL: createMessagePreview',            ctrl.includes('createMessagePreview'))
check('CTRL: listQueuePreviews',               ctrl.includes('listQueuePreviews'))
check('CTRL: listDeliveryAttemptRecords',      ctrl.includes('listDeliveryAttemptRecords'))
check('CTRL: listDeliveryStatusRecords',       ctrl.includes('listDeliveryStatusRecords'))
check('CTRL: approveLiveDeliveryRequestPreviewOnly', ctrl.includes('approveLiveDeliveryRequestPreviewOnly'))
check('CTRL: getLiveDeliveryLockStatus',       ctrl.includes('getLiveDeliveryLockStatus'))
check('CTRL: getCommunicationReadinessSummary', ctrl.includes('getCommunicationReadinessSummary'))
check('CTRL: listStaffAlertProfiles',          ctrl.includes('listStaffAlertProfiles'))
check('CTRL: listSecurityAlertProfiles',       ctrl.includes('listSecurityAlertProfiles'))
check('CTRL: listCommunicationAuditLog',       ctrl.includes('listCommunicationAuditLog'))
check('CTRL: listComplianceChecklist',         ctrl.includes('listComplianceChecklist'))
check('CTRL: listRiskFlags',                   ctrl.includes('listRiskFlags'))

// ─── ROUTES ──────────────────────────────────────────────────────────────────

check('ROUTES: canAccessPOS3 imported', routes.includes('canAccessPOS3'))
check('ROUTES: GET /providers',         routes.includes("router.get('/providers'"))
check('ROUTES: PATCH /providers/:providerKey/status requires canAccessPOS3', /patch\(['"]\/providers\/:providerKey\/status['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: GET /channels',          routes.includes("router.get('/channels'"))
check('ROUTES: PATCH /channels/:channelKey/status requires canAccessPOS3', /patch\(['"]\/channels\/:channelKey\/status['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: GET /areas',             routes.includes("router.get('/areas'"))
check('ROUTES: PATCH /areas/:areaKey/status requires canAccessPOS3', /patch\(['"]\/areas\/:areaKey\/status['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /sendgrid/contracts requires canAccessPOS3', /post\(['"]\/sendgrid\/contracts['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /mailgun/contracts requires canAccessPOS3',  /post\(['"]\/mailgun\/contracts['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /twilio/contracts requires canAccessPOS3',   /post\(['"]\/twilio\/contracts['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /firebase/contracts requires canAccessPOS3', /post\(['"]\/firebase\/contracts['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /onesignal/contracts requires canAccessPOS3',/post\(['"]\/onesignal\/contracts['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /message-previews requires canAccessPOS3',   /post\(['"]\/message-previews['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /queue-previews requires canAccessPOS3',     /post\(['"]\/queue-previews['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /delivery-attempt-records requires canAccessPOS3', /post\(['"]\/delivery-attempt-records['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /delivery-status-records requires canAccessPOS3',  /post\(['"]\/delivery-status-records['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /live-delivery-lock/approve requires canAccessPOS3', /post\(['"]\/live-delivery-lock\/approve['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /compliance-checklist requires canAccessPOS3', /post\(['"]\/compliance-checklist['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /risk-flags requires canAccessPOS3',           /post\(['"]\/risk-flags['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /audit-log requires canAccessPOS3',            /post\(['"]\/audit-log['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /profiles/staff-alert requires canAccessPOS3', /post\(['"]\/profiles\/staff-alert['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /profiles/security-alert requires canAccessPOS3', /post\(['"]\/profiles\/security-alert['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /opt-in-profiles requires canAccessPOS3',      /post\(['"]\/opt-in-profiles['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: POST /opt-out-records requires canAccessPOS3',      /post\(['"]\/opt-out-records['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: GET /readiness-summary',  routes.includes("router.get('/readiness-summary'"))
check('ROUTES: export default router',   routes.includes('export default router'))

// ─── UI PAGE ─────────────────────────────────────────────────────────────────

check('PAGE: contains_secrets: false comment',     page.includes('contains_secrets: false'))
check('PAGE: SafetyBanner component',              page.includes('SafetyBanner'))
check('PAGE: PHASE D.5 BUILD ONLY in banner',      page.includes('PHASE D.5'))
check('PAGE: Do NOT send real emails',             page.includes('Do NOT send real emails'))
check('PAGE: Do NOT send real SMS',                page.includes('Do NOT send real SMS'))
check('PAGE: Do NOT send real push notifications', page.includes('Do NOT send real push notifications'))
check('PAGE: Do NOT store provider API keys',      page.includes('Do NOT store provider API keys'))
check('PAGE: LiveDeliveryLockPanel component',     page.includes('LiveDeliveryLockPanel'))
check('PAGE: ProviderRegistryPanel component',     page.includes('ProviderRegistryPanel'))
check('PAGE: ChannelRegistryPanel component',      page.includes('ChannelRegistryPanel'))
check('PAGE: AreaRegistryPanel component',         page.includes('AreaRegistryPanel'))
check('PAGE: TemplateRegistryPanel component',     page.includes('TemplateRegistryPanel'))
check('PAGE: MessagePreviewPanel component',       page.includes('MessagePreviewPanel'))
check('PAGE: DeliveryRecordsPanel component',      page.includes('DeliveryRecordsPanel'))
check('PAGE: RecipientOptPanel component',         page.includes('RecipientOptPanel'))
check('PAGE: RateLimitsPanel component',           page.includes('RateLimitsPanel'))
check('PAGE: WebhookPanel component',              page.includes('WebhookPanel'))
check('PAGE: TenantModulePanel component',         page.includes('TenantModulePanel'))
check('PAGE: ComplianceRiskPanel component',       page.includes('ComplianceRiskPanel'))
check('PAGE: ReadinessSummaryPanel component',     page.includes('ReadinessSummaryPanel'))
check('PAGE: DEVICE_LINE present',                 page.includes('DEVICE_LINE'))
check('PAGE: BUILD_ONLY_NO_REAL_DELIVERY in page', page.includes('BUILD_ONLY_NO_REAL_DELIVERY'))
check('PAGE: function PhaseDCommunicationActivation', page.includes('function PhaseDCommunicationActivation'))
check('PAGE: export default PhaseDCommunicationActivation', page.includes('export default PhaseDCommunicationActivation'))
check('PAGE: D.4 COMPLETE shown in readiness',     page.includes('D.4 — Inventory Activation: COMPLETE') || page.includes("D.4"))
check('PAGE: D.5 IN PROGRESS shown in readiness',  page.includes('D.5 — Communication Activation: IN PROGRESS') || page.includes("D.5"))
check('PAGE: NOT CONNECTED badge in providers',    page.includes('NOT CONNECTED'))
check('PAGE: NO SECRETS STORED badge',             page.includes('NO SECRETS STORED'))
check('PAGE: preview_only: true — NOT sent messages', page.includes('NOT sent messages'))
check('PAGE: is_real_queue: false — NOT live delivery queues', page.includes('NOT live delivery queues'))
check('PAGE: NOVEE NAVY color token',              page.includes('#0a0d14'))
check('PAGE: NOVEE GOLD color token',              page.includes('#c9952c'))
check('PAGE: 10 providers listed',                 page.includes('10 providers'))
check('PAGE: 10 channels listed',                  page.includes('10 channels'))
check('PAGE: 20 areas listed',                     page.includes('20 areas'))

// ─── LOCALES ─────────────────────────────────────────────────────────────────

check('LOCALES: en-US locale',            locales.includes("'en-US'"))
check('LOCALES: es-DO locale',            locales.includes("'es-DO'"))
check('LOCALES: es locale',              locales.includes('es:') || locales.includes("'es'"))
check('LOCALES: ht locale',              locales.includes('ht:') || locales.includes("'ht'"))
check('LOCALES: de locale',              locales.includes('de:') || locales.includes("'de'"))
check('LOCALES: pt locale',              locales.includes('pt:') || locales.includes("'pt'"))
check('LOCALES: communicationActivation key', locales.includes('communicationActivation'))
check('LOCALES: email key',              locales.includes('email'))
check('LOCALES: sms key',               locales.includes('sms'))
check('LOCALES: sendgrid key',          locales.includes('sendgrid'))
check('LOCALES: twilio key',            locales.includes('twilio'))
check('LOCALES: webhookHealth key',     locales.includes('webhookHealth'))
check('LOCALES: auditLog key',          locales.includes('auditLog'))
check('LOCALES: readinessSummary key',  locales.includes('readinessSummary'))
check('LOCALES: tPhaseDCommunicationActivation exported', locales.includes('export function tPhaseDCommunicationActivation'))
check('LOCALES: getSupportedPhaseDCommunicationActivationLanguages exported', locales.includes('export function getSupportedPhaseDCommunicationActivationLanguages'))
check('LOCALES: export default',        locales.includes('export default PHASE_D_COMMUNICATION_ACTIVATION_LOCALES'))

// ─── SERVER INDEX ─────────────────────────────────────────────────────────────

check('SERVER INDEX: phaseDCommunicationActivationRoutes imported', serverIndex.includes('phaseDCommunicationActivationRoutes'))
check('SERVER INDEX: /api/phase-d/communication-activation mounted',  serverIndex.includes('/api/phase-d/communication-activation'))

// ─── APP JSX ──────────────────────────────────────────────────────────────────

check('APP JSX: PhaseDCommunicationActivation imported', appJsx.includes('PhaseDCommunicationActivation'))
check('APP JSX: phase-d/communication-activation route', appJsx.includes('phase-d/communication-activation'))

// ─── PACKAGE JSON ─────────────────────────────────────────────────────────────

check('PKG: verify:phase-d-communication-activation script', pkgJson.includes('verify:phase-d-communication-activation'))

// ─── REPORT ──────────────────────────────────────────────────────────────────

console.log(`\nPhase D.5 Communication Activation Verification`)
console.log('='.repeat(56))
console.log(`PASS: ${pass.length}`)
console.log(`FAIL: ${fail.length}`)

if (fail.length > 0) {
  console.log('\nFAILED CHECKS:')
  fail.forEach(f => console.log(`  ✗ ${f}`))
}

console.log('\n' + (fail.length === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${fail.length} check(s) failed`))
process.exit(fail.length > 0 ? 1 : 0)
