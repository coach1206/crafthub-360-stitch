/**
 * Phase D.5 — Communication Activation Contracts
 * contains_secrets: false — no credentials, no API keys, no secrets
 * STATUS: BUILD ONLY. DO NOT ENABLE REAL MESSAGE DELIVERY.
 */

export const COMMUNICATION_PROVIDER_KEYS = [
  'sendgrid',
  'mailgun',
  'twilio',
  'firebase_cloud_messaging',
  'onesignal',
  'manual_email',
  'manual_sms',
  'in_app_notification',
  'staff_alert_center',
  'future_communication_provider',
]

export const COMMUNICATION_CHANNEL_KEYS = [
  'email',
  'sms',
  'push',
  'in_app',
  'staff_alert',
  'manager_alert',
  'guest_message',
  'vendor_message',
  'system_alert',
  'security_alert',
]

export const COMMUNICATION_AREA_KEYS = [
  'staff_operations',
  'manager_alerts',
  'guest_messaging',
  'vendor_messaging',
  'inventory_alerts',
  'payment_alerts',
  'pos_order_alerts',
  'reservation_alerts',
  'loyalty_rewards',
  'passport_360_messages',
  'smokecraft_messages',
  'crafthub_messages',
  'eat_command_alerts',
  'security_alerts',
  'system_health_alerts',
  'marketplace_messages',
  'campaign_messages',
  'manual_messages',
  'template_library',
  'readiness_summary',
]

export const COMMUNICATION_ACTIVATION_STATUSES = [
  'not_started',
  'setup_required',
  'credentials_required',
  'credentials_present_unverified',
  'template_required',
  'template_ready',
  'approval_required',
  'queue_preview_ready',
  'delivery_locked',
  'delivery_test_mode_locked',
  'provider_verification_required',
  'provider_verified_test_mode',
  'live_delivery_locked',
  'live_delivery_requested',
  'live_delivery_approved',
  'live_delivery_enabled',
  'disabled',
  'blocked',
  'failed',
]

export const COMMUNICATION_CREDENTIAL_PRESENCE_STATUSES = [
  'absent',
  'present_unverified',
  'present_verified_test',
  'present_verified_live',
  'expired',
  'revoked',
]

export const COMMUNICATION_TEMPLATE_TYPES = [
  'transactional', 'marketing', 'alert', 'system', 'manual',
]

export const COMMUNICATION_OPT_IN_STATUSES = [
  'unknown', 'opted_in', 'opted_out', 'pending_confirmation',
]

export const COMMUNICATION_AUDIT_EVENT_TYPES = [
  'provider_registered', 'provider_status_updated', 'credential_presence_recorded',
  'channel_registered', 'area_status_updated', 'template_created', 'template_updated',
  'template_version_created', 'template_locale_created', 'template_approval_requested',
  'template_approved', 'message_preview_created', 'queue_preview_created',
  'delivery_attempt_recorded', 'delivery_status_recorded', 'recipient_group_created',
  'opt_in_recorded', 'opt_out_recorded', 'rate_limit_set', 'quiet_hours_set',
  'webhook_registered', 'live_delivery_request_submitted', 'live_delivery_preview_approved',
  'compliance_check_updated', 'risk_flag_created',
]

export const FORBIDDEN_COMMUNICATION_FIELDS = [
  'api_key', 'secret_key', 'api_secret', 'private_key', 'access_token',
  'client_secret', 'auth_token', 'bearer_token', 'webhook_secret',
  'sendgrid_api_key', 'mailgun_api_key', 'twilio_auth_token', 'twilio_account_sid',
  'firebase_server_key', 'onesignal_api_key', 'smtp_password', 'smtp_user',
  'password', 'refresh_token', 'encryption_key', 'signing_secret',
]

// ── Validators ───────────────────────────────────────────────────

export function validateCommunicationProviderKey(key) {
  if (!COMMUNICATION_PROVIDER_KEYS.includes(key)) throw new Error(`Invalid communication provider key: ${key}`)
  return true
}

export function validateCommunicationChannelKey(key) {
  if (!COMMUNICATION_CHANNEL_KEYS.includes(key)) throw new Error(`Invalid communication channel key: ${key}`)
  return true
}

export function validateCommunicationAreaKey(key) {
  if (!COMMUNICATION_AREA_KEYS.includes(key)) throw new Error(`Invalid communication area key: ${key}`)
  return true
}

export function validateCommunicationActivationStatus(status) {
  if (!COMMUNICATION_ACTIVATION_STATUSES.includes(status)) throw new Error(`Invalid communication activation status: ${status}`)
  return true
}

export function validateCommunicationCredentialPresencePayload(payload) {
  if (!payload || !payload.provider_key) throw new Error('provider_key required')
  if (!payload.credential_presence) throw new Error('credential_presence required')
  if (!COMMUNICATION_CREDENTIAL_PRESENCE_STATUSES.includes(payload.credential_presence)) throw new Error(`Invalid credential_presence: ${payload.credential_presence}`)
  return true
}

export function validateCommunicationTemplate(payload) {
  if (!payload || !payload.template_key) throw new Error('template_key required')
  if (!payload.template_label) throw new Error('template_label required')
  if (!payload.area_key) throw new Error('area_key required')
  if (!payload.channel_key) throw new Error('channel_key required')
  return true
}

export function validateCommunicationTemplateVersion(payload) {
  if (!payload || !payload.template_id) throw new Error('template_id required')
  return true
}

export function validateCommunicationTemplateLocaleVariant(payload) {
  if (!payload || !payload.template_id) throw new Error('template_id required')
  if (!payload.locale_key) throw new Error('locale_key required')
  return true
}

export function validateTemplateApprovalRequest(payload) {
  if (!payload || !payload.template_id) throw new Error('template_id required')
  return true
}

export function validateTemplateApprovalRecord(payload) {
  if (!payload || !payload.request_id) throw new Error('request_id required')
  if (!payload.template_id) throw new Error('template_id required')
  return true
}

export function validateMessagePreviewRecord(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.channel_key) throw new Error('channel_key required')
  if (payload.is_real_message === true) throw new Error('is_real_message must be false — message previews are not sent messages in Phase D.5')
  if (payload.delivery_attempted === true) throw new Error('delivery_attempted must be false in Phase D.5')
  return true
}

export function validateMessageQueuePreview(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.channel_key) throw new Error('channel_key required')
  if (payload.is_real_queue === true) throw new Error('is_real_queue must be false in Phase D.5')
  if (payload.delivery_enabled === true) throw new Error('delivery_enabled must be false in Phase D.5')
  if (payload.queued_for_send === true) throw new Error('queued_for_send must be false in Phase D.5')
  return true
}

export function validateDeliveryAttemptRecord(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.channel_key) throw new Error('channel_key required')
  if (payload.real_delivery_attempted === true) throw new Error('real_delivery_attempted must be false in Phase D.5')
  return true
}

export function validateDeliveryStatusRecord(payload) {
  if (!payload || !payload.channel_key) throw new Error('channel_key required')
  if (payload.delivered === true && !payload.real_delivery_confirmed) throw new Error('delivered cannot be true without real_delivery_confirmed in Phase D.5')
  if (payload.real_delivery_confirmed === true) throw new Error('real_delivery_confirmed must be false — no real message delivery in Phase D.5')
  return true
}

export function validateRecipientGroup(payload) {
  if (!payload || !payload.group_key) throw new Error('group_key required')
  if (!payload.group_label) throw new Error('group_label required')
  return true
}

export function validateRecipientGroupMember(payload) {
  if (!payload || !payload.group_id) throw new Error('group_id required')
  if (!payload.member_ref) throw new Error('member_ref required')
  return true
}

export function validateStaffAlertProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  if (payload.real_delivery === true) throw new Error('real_delivery must be false in Phase D.5')
  return true
}

export function validateManagerAlertProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  if (payload.real_delivery === true) throw new Error('real_delivery must be false in Phase D.5')
  return true
}

export function validateGuestMessageProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  if (payload.real_delivery === true) throw new Error('real_delivery must be false in Phase D.5')
  return true
}

export function validateVendorMessageProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  if (payload.real_delivery === true) throw new Error('real_delivery must be false in Phase D.5')
  return true
}

export function validateInventoryAlertProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  if (payload.real_delivery === true) throw new Error('real_delivery must be false in Phase D.5')
  return true
}

export function validatePaymentAlertProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validatePOSOrderAlertProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateReservationAlertProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateLoyaltyMessageProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validatePassportMessageProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateSmokeCraftMessageProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateCraftHubMessageProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateEATCommandAlertProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateSecurityAlertProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateSystemHealthAlertProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateMarketplaceMessageProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateCampaignMessageProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  if (payload.approved === true && !payload.approval_required) throw new Error('Campaign must require approval before approved=true')
  return true
}

export function validateManualMessageProfile(payload) {
  if (!payload || !payload.profile_key) throw new Error('profile_key required')
  if (payload.auto_send === true) throw new Error('auto_send must be false in Phase D.5')
  return true
}

export function validateOptInProfile(payload) {
  if (!payload || !payload.channel_key) throw new Error('channel_key required')
  return true
}

export function validateOptOutRecord(payload) {
  if (!payload || !payload.channel_key) throw new Error('channel_key required')
  return true
}

export function validateRateLimitProfile(payload) {
  if (!payload || !payload.channel_key) throw new Error('channel_key required')
  return true
}

export function validateQuietHourProfile(payload) {
  if (!payload || !payload.channel_key) throw new Error('channel_key required')
  return true
}

export function validateCommunicationWebhookRegistry(payload) {
  if (!payload || !payload.provider_key) throw new Error('provider_key required')
  if (!payload.endpoint_label) throw new Error('endpoint_label required')
  if (payload.contains_secrets === true) throw new Error('contains_secrets must be false — no webhook secrets stored in database')
  if (payload.stores_secrets === true) throw new Error('stores_secrets must be false — no webhook secrets stored in database')
  return true
}

export function validateLiveDeliveryRequest(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  return true
}

export function validateTenantCommunicationMapping(payload) {
  if (!payload || !payload.tenant_id) throw new Error('tenant_id required')
  if (!payload.area_key) throw new Error('area_key required')
  return true
}

export function validateModuleCommunicationMapping(payload) {
  if (!payload || !payload.module_key) throw new Error('module_key required')
  if (!payload.area_key) throw new Error('area_key required')
  return true
}

export function validateComplianceChecklistItem(payload) {
  if (!payload || !payload.check_key) throw new Error('check_key required')
  return true
}

export function validateRiskFlag(payload) {
  if (!payload || !payload.flag_key) throw new Error('flag_key required')
  if (!payload.flag_label) throw new Error('flag_label required')
  return true
}

// ── Safety Assertions ────────────────────────────────────────────

export function assertNoCommunicationSecretsInPayload(payload) {
  if (!payload || typeof payload !== 'object') return true
  for (const field of FORBIDDEN_COMMUNICATION_FIELDS) {
    if (field in payload) throw new Error(`Forbidden field in communication payload: ${field}. Phase D.5 does not store provider API keys or messaging credentials.`)
  }
  return true
}

export function assertNoFakeCommunicationDeliveryClaim(payload) {
  if (!payload) return true
  if (payload.is_real_message === true) throw new Error('Fake delivery claim blocked: is_real_message cannot be true in Phase D.5')
  if (payload.delivery_attempted === true) throw new Error('Fake delivery claim blocked: delivery_attempted cannot be true in Phase D.5')
  if (payload.real_delivery_attempted === true) throw new Error('Fake delivery claim blocked: real_delivery_attempted cannot be true in Phase D.5')
  if (payload.real_delivery_confirmed === true) throw new Error('Fake delivery claim blocked: real_delivery_confirmed cannot be true in Phase D.5')
  if (payload.delivered === true) throw new Error('Fake delivery claim blocked: delivered cannot be true without real provider response in Phase D.5')
  if (payload.is_real_queue === true) throw new Error('Fake queue claim blocked: is_real_queue cannot be true in Phase D.5')
  if (payload.queued_for_send === true) throw new Error('Fake queue claim blocked: queued_for_send cannot be true in Phase D.5')
  if (payload.delivery_enabled === true) throw new Error('Fake delivery claim blocked: delivery_enabled cannot be true in Phase D.5')
  return true
}

export function assertNoFakeCommunicationProviderConnection(payload) {
  if (!payload) return true
  if (payload.connected === true) throw new Error('Fake provider connection blocked: connected cannot be true without verified credentials in Phase D.5')
  if (payload.real_delivery_enabled === true) throw new Error('Fake provider connection blocked: real_delivery_enabled cannot be true in Phase D.5')
  if (payload.live_mode_enabled === true) throw new Error('Fake provider connection blocked: live_mode_enabled cannot be true in Phase D.5')
  return true
}

export function assertNoUnauthorizedAutoSendClaim(payload) {
  if (!payload) return true
  if (payload.auto_send === true) throw new Error('Unauthorized auto-send claim blocked: auto_send must be false in Phase D.5')
  if (payload.auto_send_enabled === true) throw new Error('Unauthorized auto-send claim blocked: auto_send_enabled must be false in Phase D.5')
  return true
}

export default { COMMUNICATION_PROVIDER_KEYS, COMMUNICATION_CHANNEL_KEYS, COMMUNICATION_AREA_KEYS, COMMUNICATION_ACTIVATION_STATUSES, FORBIDDEN_COMMUNICATION_FIELDS }
