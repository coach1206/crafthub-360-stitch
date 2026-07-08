/**
 * Phase D.5 — Communication Activation Service
 * contains_secrets: false
 * stores_secrets: false
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * STATUS: BUILD ONLY. DO NOT ENABLE REAL MESSAGE DELIVERY.
 */

import { isDbAvailable } from '../../db/connection.js'
import {
  COMMUNICATION_PROVIDER_KEYS,
  COMMUNICATION_CHANNEL_KEYS,
  COMMUNICATION_AREA_KEYS,
  COMMUNICATION_ACTIVATION_STATUSES,
  assertNoCommunicationSecretsInPayload,
  assertNoFakeCommunicationDeliveryClaim,
  assertNoFakeCommunicationProviderConnection,
  assertNoUnauthorizedAutoSendClaim,
  validateCommunicationProviderKey,
  validateCommunicationChannelKey,
  validateCommunicationAreaKey,
} from './phaseDCommunicationActivationContracts.js'

const AREA = 'phase_d_communication_activation'

const localFallback = (area = AREA) => ({
  ok: false,
  localPreview: true,
  error: 'database_not_configured',
  area,
})

function makeCommListCreate(tableName) {
  return {
    list: async (filters = {}) => {
      if (!isDbAvailable()) return { ...localFallback(), rows: [] }
      const db = (await import('../../db/connection.js')).default
      const rows = await db(tableName).select('*').orderBy('created_at', 'desc').limit(200)
      return { ok: true, rows }
    },
    create: async (payload, actorId, ikey) => {
      assertNoCommunicationSecretsInPayload(payload)
      assertNoFakeCommunicationDeliveryClaim(payload)
      assertNoFakeCommunicationProviderConnection(payload)
      assertNoUnauthorizedAutoSendClaim(payload)
      if (!isDbAvailable()) return { ...localFallback(), payload }
      const db = (await import('../../db/connection.js')).default
      const [row] = await db(tableName)
        .insert({ ...payload, actor_id: actorId, idempotency_key: ikey })
        .onConflict('idempotency_key').ignore()
        .returning('*')
      return { ok: true, row: row || null }
    },
  }
}

// Provider registry
export async function listCommunicationProviders() {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, rows: [] }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('communication_provider_registry').select('*').orderBy('provider_key')
  return { ok: true, rows }
}

export async function getCommunicationProvider(providerKey) {
  validateCommunicationProviderKey(providerKey)
  if (!isDbAvailable()) return { ...localFallback(), provider_key: providerKey, connected: false }
  const db = (await import('../../db/connection.js')).default
  const row = await db('communication_provider_registry').where({ provider_key: providerKey }).first()
  return { ok: true, row: row || null }
}

export async function getCommunicationProviderStatus(providerKey) {
  validateCommunicationProviderKey(providerKey)
  if (!isDbAvailable()) return { ok: false, localPreview: true, provider_key: providerKey, connected: false, real_delivery_enabled: false }
  const db = (await import('../../db/connection.js')).default
  const row = await db('communication_provider_registry').where({ provider_key: providerKey }).first()
  return { ok: true, provider_key: providerKey, connected: false, real_delivery_enabled: false, row: row || null }
}

export async function updateCommunicationProviderStatus(providerKey, payload, actorId, ikey) {
  validateCommunicationProviderKey(providerKey)
  assertNoCommunicationSecretsInPayload(payload)
  assertNoFakeCommunicationProviderConnection(payload)
  if (!isDbAvailable()) return { ...localFallback(), provider_key: providerKey }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_provider_registry')
    .where({ provider_key: providerKey })
    .update({ ...payload, updated_at: new Date(), actor_id: actorId })
    .returning('*')
  return { ok: true, row: row || null }
}

export async function getCommunicationCredentialPresenceStatus(providerKey) {
  validateCommunicationProviderKey(providerKey)
  return {
    ok: true,
    provider_key: providerKey,
    credentials_present: false,
    credentials_verified: false,
    note: 'Credential presence check only — no secrets stored or read by this system',
    stores_secrets: false,
  }
}

export async function recordCommunicationCredentialPresenceStatus(providerKey, payload, actorId, ikey) {
  validateCommunicationProviderKey(providerKey)
  assertNoCommunicationSecretsInPayload(payload)
  if (!isDbAvailable()) return { ...localFallback(), provider_key: providerKey }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_credential_presence_log')
    .insert({ provider_key: providerKey, ...payload, actor_id: actorId, idempotency_key: ikey })
    .onConflict('idempotency_key').ignore()
    .returning('*')
  return { ok: true, row: row || null }
}

// Channel registry
export async function listCommunicationChannels() {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, rows: [] }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('communication_channel_registry').select('*').orderBy('channel_key')
  return { ok: true, rows }
}

export async function getCommunicationChannel(channelKey) {
  validateCommunicationChannelKey(channelKey)
  if (!isDbAvailable()) return { ...localFallback(), channel_key: channelKey }
  const db = (await import('../../db/connection.js')).default
  const row = await db('communication_channel_registry').where({ channel_key: channelKey }).first()
  return { ok: true, row: row || null }
}

export async function updateCommunicationChannelStatus(channelKey, payload, actorId) {
  validateCommunicationChannelKey(channelKey)
  assertNoCommunicationSecretsInPayload(payload)
  assertNoFakeCommunicationDeliveryClaim(payload)
  if (!isDbAvailable()) return { ...localFallback(), channel_key: channelKey }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_channel_registry')
    .where({ channel_key: channelKey })
    .update({ ...payload, updated_at: new Date(), actor_id: actorId })
    .returning('*')
  return { ok: true, row: row || null }
}

// Area registry
export async function listCommunicationAreas() {
  if (!isDbAvailable()) {
    return {
      ok: false, localPreview: true, error: 'database_not_configured', area: AREA,
      rows: COMMUNICATION_AREA_KEYS.map(k => ({ area_key: k, real_delivery_enabled: false, auto_send: false })),
    }
  }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('communication_area_registry').select('*').orderBy('area_key')
  return { ok: true, rows }
}

export async function getCommunicationArea(areaKey) {
  validateCommunicationAreaKey(areaKey)
  if (!isDbAvailable()) return { ...localFallback(), area_key: areaKey, real_delivery_enabled: false }
  const db = (await import('../../db/connection.js')).default
  const row = await db('communication_area_registry').where({ area_key: areaKey }).first()
  return { ok: true, row: row || null }
}

export async function updateCommunicationAreaStatus(areaKey, payload, actorId) {
  validateCommunicationAreaKey(areaKey)
  assertNoCommunicationSecretsInPayload(payload)
  assertNoFakeCommunicationDeliveryClaim(payload)
  assertNoUnauthorizedAutoSendClaim(payload)
  if (!isDbAvailable()) return { ...localFallback(), area_key: areaKey }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_area_registry')
    .where({ area_key: areaKey })
    .update({ ...payload, updated_at: new Date(), actor_id: actorId })
    .returning('*')
  return { ok: true, row: row || null }
}

// SendGrid
const sendgridOps = makeCommListCreate('communication_sendgrid_contracts')
export const listSendgridContracts = () => sendgridOps.list()
export const createSendgridContract = (payload, actorId, ikey) => sendgridOps.create(payload, actorId, ikey)

// Mailgun
const mailgunOps = makeCommListCreate('communication_mailgun_contracts')
export const listMailgunContracts = () => mailgunOps.list()
export const createMailgunContract = (payload, actorId, ikey) => mailgunOps.create(payload, actorId, ikey)

// Twilio
const twilioOps = makeCommListCreate('communication_twilio_contracts')
export const listTwilioContracts = () => twilioOps.list()
export const createTwilioContract = (payload, actorId, ikey) => twilioOps.create(payload, actorId, ikey)

// Firebase
const firebaseOps = makeCommListCreate('communication_firebase_contracts')
export const listFirebaseContracts = () => firebaseOps.list()
export const createFirebaseContract = (payload, actorId, ikey) => firebaseOps.create(payload, actorId, ikey)

// OneSignal
const onesignalOps = makeCommListCreate('communication_onesignal_contracts')
export const listOnesignalContracts = () => onesignalOps.list()
export const createOnesignalContract = (payload, actorId, ikey) => onesignalOps.create(payload, actorId, ikey)

// Manual email
const manualEmailOps = makeCommListCreate('communication_manual_email_records')
export const listManualEmailRecords = () => manualEmailOps.list()
export const createManualEmailRecord = (payload, actorId, ikey) => manualEmailOps.create(payload, actorId, ikey)

// Manual SMS
const manualSmsOps = makeCommListCreate('communication_manual_sms_records')
export const listManualSmsRecords = () => manualSmsOps.list()
export const createManualSmsRecord = (payload, actorId, ikey) => manualSmsOps.create(payload, actorId, ikey)

// Template registry
const templateOps = makeCommListCreate('communication_template_registry')
export const listCommunicationTemplates = () => templateOps.list()
export const createCommunicationTemplate = (payload, actorId, ikey) => templateOps.create(payload, actorId, ikey)

// Template versions
const templateVersionOps = makeCommListCreate('communication_template_versions')
export const listCommunicationTemplateVersions = () => templateVersionOps.list()
export const createCommunicationTemplateVersion = (payload, actorId, ikey) => templateVersionOps.create(payload, actorId, ikey)

// Template approvals
const templateApprovalOps = makeCommListCreate('communication_template_approvals')
export const listCommunicationTemplateApprovals = () => templateApprovalOps.list()
export const createCommunicationTemplateApproval = (payload, actorId, ikey) => templateApprovalOps.create(payload, actorId, ikey)

// Message previews — NOT sent messages
export async function listMessagePreviews() {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, rows: [] }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('communication_message_previews').select('*').orderBy('created_at', 'desc').limit(200)
  return { ok: true, rows }
}

export async function createMessagePreview(payload, actorId, ikey) {
  assertNoCommunicationSecretsInPayload(payload)
  assertNoFakeCommunicationDeliveryClaim(payload)
  assertNoUnauthorizedAutoSendClaim(payload)
  const safePayload = {
    ...payload,
    preview_only: true,
    is_real_message: false,
    delivery_attempted: false,
  }
  if (!isDbAvailable()) return { ...localFallback(), payload: safePayload }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_message_previews')
    .insert({ ...safePayload, actor_id: actorId, idempotency_key: ikey })
    .onConflict('idempotency_key').ignore()
    .returning('*')
  return { ok: true, row: row || null, warning: 'Message preview created — this is NOT a sent message' }
}

// Queue previews — NOT live delivery queues
export async function listQueuePreviews() {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, rows: [] }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('communication_queue_previews').select('*').orderBy('created_at', 'desc').limit(200)
  return { ok: true, rows }
}

export async function createQueuePreview(payload, actorId, ikey) {
  assertNoCommunicationSecretsInPayload(payload)
  assertNoFakeCommunicationDeliveryClaim(payload)
  assertNoUnauthorizedAutoSendClaim(payload)
  const safePayload = {
    ...payload,
    is_real_queue: false,
    queued_for_send: false,
    delivery_enabled: false,
    auto_send: false,
  }
  if (!isDbAvailable()) return { ...localFallback(), payload: safePayload }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_queue_previews')
    .insert({ ...safePayload, actor_id: actorId, idempotency_key: ikey })
    .onConflict('idempotency_key').ignore()
    .returning('*')
  return { ok: true, row: row || null, warning: 'Queue preview created — this is NOT a live delivery queue' }
}

// Delivery attempt records
export async function listDeliveryAttemptRecords() {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, rows: [] }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('communication_delivery_attempt_records').select('*').orderBy('created_at', 'desc').limit(200)
  return { ok: true, rows }
}

export async function createDeliveryAttemptRecord(payload, actorId, ikey) {
  assertNoCommunicationSecretsInPayload(payload)
  assertNoFakeCommunicationDeliveryClaim(payload)
  const safePayload = {
    ...payload,
    real_delivery_attempted: false,
    preview_only: true,
  }
  if (!isDbAvailable()) return { ...localFallback(), payload: safePayload }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_delivery_attempt_records')
    .insert({ ...safePayload, actor_id: actorId, idempotency_key: ikey })
    .onConflict('idempotency_key').ignore()
    .returning('*')
  return { ok: true, row: row || null }
}

// Delivery status records
export async function listDeliveryStatusRecords() {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, rows: [] }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('communication_delivery_status_records').select('*').orderBy('created_at', 'desc').limit(200)
  return { ok: true, rows }
}

export async function createDeliveryStatusRecord(payload, actorId, ikey) {
  assertNoCommunicationSecretsInPayload(payload)
  assertNoFakeCommunicationDeliveryClaim(payload)
  const safePayload = {
    ...payload,
    real_delivery_confirmed: false,
    delivered: false,
  }
  if (!isDbAvailable()) return { ...localFallback(), payload: safePayload }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_delivery_status_records')
    .insert({ ...safePayload, actor_id: actorId, idempotency_key: ikey })
    .onConflict('idempotency_key').ignore()
    .returning('*')
  return { ok: true, row: row || null, note: 'Status does not indicate delivered unless real provider response exists' }
}

// Recipient groups
const recipientGroupOps = makeCommListCreate('communication_recipient_groups')
export const listRecipientGroups = () => recipientGroupOps.list()
export const createRecipientGroup = (payload, actorId, ikey) => recipientGroupOps.create(payload, actorId, ikey)

// Opt-in profiles
const optInOps = makeCommListCreate('communication_opt_in_profiles')
export const listOptInProfiles = () => optInOps.list()
export const createOptInProfile = (payload, actorId, ikey) => optInOps.create(payload, actorId, ikey)

// Opt-out records
const optOutOps = makeCommListCreate('communication_opt_out_records')
export const listOptOutRecords = () => optOutOps.list()
export const createOptOutRecord = (payload, actorId, ikey) => optOutOps.create(payload, actorId, ikey)

// Rate limit profiles
const rateLimitOps = makeCommListCreate('communication_rate_limit_profiles')
export const listRateLimitProfiles = () => rateLimitOps.list()
export const createRateLimitProfile = (payload, actorId, ikey) => rateLimitOps.create(payload, actorId, ikey)

// Quiet hour profiles
const quietHourOps = makeCommListCreate('communication_quiet_hour_profiles')
export const listQuietHourProfiles = () => quietHourOps.list()
export const createQuietHourProfile = (payload, actorId, ikey) => quietHourOps.create(payload, actorId, ikey)

// Webhook registry
const webhookOps = makeCommListCreate('communication_webhook_registry')
export const listWebhookRegistry = () => webhookOps.list()
export const createWebhookEntry = (payload, actorId, ikey) => webhookOps.create(payload, actorId, ikey)

// Webhook health
const webhookHealthOps = makeCommListCreate('communication_webhook_health')
export const listWebhookHealth = () => webhookHealthOps.list()
export const createWebhookHealthRecord = (payload, actorId, ikey) => webhookHealthOps.create(payload, actorId, ikey)

// Live delivery lock — approval does NOT enable live delivery
export async function approveLiveDeliveryRequestPreviewOnly(payload, actorId, ikey) {
  assertNoCommunicationSecretsInPayload(payload)
  assertNoFakeCommunicationDeliveryClaim(payload)
  const safePayload = {
    ...payload,
    real_delivery_enabled: false,
    live_mode_enabled: false,
    auto_send: false,
    approved_for_live: false,
    warning: 'Approval recorded but does NOT enable live message delivery — Phase D.5 BUILD ONLY',
  }
  if (!isDbAvailable()) return { ...localFallback(), payload: safePayload }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_live_delivery_lock')
    .insert({ ...safePayload, actor_id: actorId, idempotency_key: ikey })
    .onConflict('idempotency_key').ignore()
    .returning('*')
  return {
    ok: true,
    row: row || null,
    warning: 'Live delivery approval recorded — this does NOT enable real message sending',
    real_delivery_enabled: false,
    live_mode_enabled: false,
  }
}

export async function getLiveDeliveryLockStatus() {
  return {
    ok: true,
    locked: true,
    real_delivery_enabled: false,
    live_mode_enabled: false,
    auto_send_enabled: false,
    note: 'Phase D.5 BUILD ONLY — live delivery requires explicit activation beyond this phase',
  }
}

// Tenant and module mappings
const tenantMappingOps = makeCommListCreate('communication_tenant_mappings')
export const listTenantMappings = () => tenantMappingOps.list()
export const createTenantMapping = (payload, actorId, ikey) => tenantMappingOps.create(payload, actorId, ikey)

const moduleMappingOps = makeCommListCreate('communication_module_mappings')
export const listModuleMappings = () => moduleMappingOps.list()
export const createModuleMapping = (payload, actorId, ikey) => moduleMappingOps.create(payload, actorId, ikey)

// Compliance checklist
const complianceOps = makeCommListCreate('communication_compliance_checklist')
export const listComplianceChecklist = () => complianceOps.list()
export const createComplianceChecklistItem = (payload, actorId, ikey) => complianceOps.create(payload, actorId, ikey)

// Risk flags
const riskFlagOps = makeCommListCreate('communication_risk_flags')
export const listRiskFlags = () => riskFlagOps.list()
export const createRiskFlag = (payload, actorId, ikey) => riskFlagOps.create(payload, actorId, ikey)

// Audit log
export async function listCommunicationAuditLog() {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, rows: [] }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('communication_activation_audit').select('*').orderBy('created_at', 'desc').limit(500)
  return { ok: true, rows }
}

export async function createCommunicationAuditEntry(payload, actorId, ikey) {
  assertNoCommunicationSecretsInPayload(payload)
  if (!isDbAvailable()) return { ...localFallback(), payload }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('communication_activation_audit')
    .insert({ ...payload, actor_id: actorId, idempotency_key: ikey })
    .onConflict('idempotency_key').ignore()
    .returning('*')
  return { ok: true, row: row || null }
}

// Message area profiles — one factory per area
const areaProfileTables = {
  staff_alert:    'communication_staff_alert_profiles',
  manager_alert:  'communication_manager_alert_profiles',
  guest_message:  'communication_guest_message_profiles',
  vendor_message: 'communication_vendor_message_profiles',
  inventory_alert:'communication_inventory_alert_profiles',
  payment_alert:  'communication_payment_alert_profiles',
  pos_order_alert:'communication_pos_order_alert_profiles',
  reservation_alert:'communication_reservation_alert_profiles',
  loyalty_message:'communication_loyalty_message_profiles',
  passport_message:'communication_passport_message_profiles',
  smokecraft_message:'communication_smokecraft_message_profiles',
  crafthub_message:'communication_crafthub_message_profiles',
  eat_command_alert:'communication_eat_command_alert_profiles',
  security_alert: 'communication_security_alert_profiles',
  system_health_alert:'communication_system_health_alert_profiles',
  marketplace_message:'communication_marketplace_message_profiles',
  campaign_message:'communication_campaign_message_profiles',
  manual_message: 'communication_manual_message_profiles',
}

const areaProfileOps = {}
for (const [key, table] of Object.entries(areaProfileTables)) {
  areaProfileOps[key] = makeCommListCreate(table)
}

export const listStaffAlertProfiles         = () => areaProfileOps.staff_alert.list()
export const createStaffAlertProfile        = (p, a, i) => areaProfileOps.staff_alert.create(p, a, i)
export const listManagerAlertProfiles       = () => areaProfileOps.manager_alert.list()
export const createManagerAlertProfile      = (p, a, i) => areaProfileOps.manager_alert.create(p, a, i)
export const listGuestMessageProfiles       = () => areaProfileOps.guest_message.list()
export const createGuestMessageProfile      = (p, a, i) => areaProfileOps.guest_message.create(p, a, i)
export const listVendorMessageProfiles      = () => areaProfileOps.vendor_message.list()
export const createVendorMessageProfile     = (p, a, i) => areaProfileOps.vendor_message.create(p, a, i)
export const listInventoryAlertProfiles     = () => areaProfileOps.inventory_alert.list()
export const createInventoryAlertProfile    = (p, a, i) => areaProfileOps.inventory_alert.create(p, a, i)
export const listPaymentAlertProfiles       = () => areaProfileOps.payment_alert.list()
export const createPaymentAlertProfile      = (p, a, i) => areaProfileOps.payment_alert.create(p, a, i)
export const listPosOrderAlertProfiles      = () => areaProfileOps.pos_order_alert.list()
export const createPosOrderAlertProfile     = (p, a, i) => areaProfileOps.pos_order_alert.create(p, a, i)
export const listReservationAlertProfiles   = () => areaProfileOps.reservation_alert.list()
export const createReservationAlertProfile  = (p, a, i) => areaProfileOps.reservation_alert.create(p, a, i)
export const listLoyaltyMessageProfiles     = () => areaProfileOps.loyalty_message.list()
export const createLoyaltyMessageProfile    = (p, a, i) => areaProfileOps.loyalty_message.create(p, a, i)
export const listPassportMessageProfiles    = () => areaProfileOps.passport_message.list()
export const createPassportMessageProfile   = (p, a, i) => areaProfileOps.passport_message.create(p, a, i)
export const listSmokecraftMessageProfiles  = () => areaProfileOps.smokecraft_message.list()
export const createSmokecraftMessageProfile = (p, a, i) => areaProfileOps.smokecraft_message.create(p, a, i)
export const listCrafthubMessageProfiles    = () => areaProfileOps.crafthub_message.list()
export const createCrafthubMessageProfile   = (p, a, i) => areaProfileOps.crafthub_message.create(p, a, i)
export const listEatCommandAlertProfiles    = () => areaProfileOps.eat_command_alert.list()
export const createEatCommandAlertProfile   = (p, a, i) => areaProfileOps.eat_command_alert.create(p, a, i)
export const listSecurityAlertProfiles      = () => areaProfileOps.security_alert.list()
export const createSecurityAlertProfile     = (p, a, i) => areaProfileOps.security_alert.create(p, a, i)
export const listSystemHealthAlertProfiles  = () => areaProfileOps.system_health_alert.list()
export const createSystemHealthAlertProfile = (p, a, i) => areaProfileOps.system_health_alert.create(p, a, i)
export const listMarketplaceMessageProfiles = () => areaProfileOps.marketplace_message.list()
export const createMarketplaceMessageProfile= (p, a, i) => areaProfileOps.marketplace_message.create(p, a, i)
export const listCampaignMessageProfiles    = () => areaProfileOps.campaign_message.list()
export const createCampaignMessageProfile   = (p, a, i) => areaProfileOps.campaign_message.create(p, a, i)
export const listManualMessageProfiles      = () => areaProfileOps.manual_message.list()
export const createManualMessageProfile     = (p, a, i) => areaProfileOps.manual_message.create(p, a, i)

// Readiness summary
export async function getCommunicationReadinessSummary() {
  return {
    ok: true,
    phase: 'D.5',
    label: 'Communication Activation',
    real_email_delivery: false,
    real_sms_delivery: false,
    real_push_delivery: false,
    real_vendor_message_delivery: false,
    real_guest_message_delivery: false,
    real_staff_alert_delivery: false,
    auto_send_enabled: false,
    sendgrid_connected: false,
    mailgun_connected: false,
    twilio_connected: false,
    firebase_connected: false,
    onesignal_connected: false,
    no_secret_storage: true,
    no_fake_delivery: true,
    no_fake_provider_connection: true,
    safety_status: 'BUILD_ONLY_NO_REAL_DELIVERY',
    providers_registered: COMMUNICATION_PROVIDER_KEYS.length,
    channels_registered: COMMUNICATION_CHANNEL_KEYS.length,
    areas_registered: COMMUNICATION_AREA_KEYS.length,
    note: 'Phase D.5 BUILD ONLY — no real message delivery is enabled or simulated',
  }
}
