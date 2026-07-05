// contains_secrets: false, stores_secrets: false — hardcoded constants only

export const EXTERNAL_POS_PROVIDER_KEYS = [
  'toast',
  'clover',
  'square_pos',
  'lightspeed',
  'shopify_pos',
  'spoton',
  'touchbistro',
  'revel',
  'generic_csv',
  'manual_pos_companion',
  'future_pos_provider',
];

export const EXTERNAL_POS_MODE_KEYS = [
  'companion_mode',
  'export_import_mode',
  'api_contract_mode',
  'manual_mapping_mode',
  'hybrid_mode',
];

export const EXTERNAL_POS_STATUSES = [
  'not_started',
  'credentials_required',
  'credentials_present_unverified',
  'mapping_required',
  'mapping_in_progress',
  'import_ready',
  'import_tested',
  'api_contract_ready',
  'api_verification_required',
  'api_verified_test_mode',
  'api_live_mode_locked',
  'live_mode_requested',
  'live_mode_approved',
  'live_mode_enabled',
  'disabled',
  'blocked',
  'failed',
];

export const EXTERNAL_POS_CREDENTIAL_PRESENCE_STATUSES = [
  'absent',
  'present_unverified',
  'present_verified_test',
  'present_verified_live',
  'expired',
  'revoked',
];

export const EXTERNAL_POS_CAPABILITIES = [
  'companion_mode',
  'csv_export_import',
  'api_sync',
  'menu_import',
  'inventory_import',
  'sales_import',
  'closeout_import',
  'report_import',
  'manual_mapping',
  'webhook_support',
];

export const EXTERNAL_POS_MAPPING_TYPES = [
  'menu_category',
  'menu_item',
  'modifier',
  'tax',
  'tip',
  'payment_type',
  'staff_role',
  'table_section',
  'revenue_center',
  'department',
  'inventory_signal',
  'humidor',
  'bar',
  'kitchen',
  'order_flow',
  'ticket_flow',
  'closeout',
  'report',
];

export const EXTERNAL_POS_IMPORT_FORMATS = [
  'csv',
  'xlsx',
  'json',
  'xml',
  'txt',
  'pdf',
  'manual',
];

export const EXTERNAL_POS_AUDIT_EVENT_TYPES = [
  'provider_registered',
  'mode_activated',
  'credential_status_updated',
  'companion_profile_created',
  'import_profile_created',
  'import_batch_created',
  'mapping_created',
  'api_contract_registered',
  'webhook_registered',
  'live_mode_requested',
  'live_mode_approved',
  'live_mode_denied',
  'compliance_item_updated',
  'risk_flag_created',
  'environment_lock_changed',
];

// --- Validators ---

export const validateExternalPOSProviderKey      = v => EXTERNAL_POS_PROVIDER_KEYS.includes(v);
export const validateExternalPOSModeKey          = v => EXTERNAL_POS_MODE_KEYS.includes(v);
export const validateExternalPOSStatus           = v => EXTERNAL_POS_STATUSES.includes(v);
export const validateCredentialPresenceStatus    = v => EXTERNAL_POS_CREDENTIAL_PRESENCE_STATUSES.includes(v);
export const validateCapability                  = v => EXTERNAL_POS_CAPABILITIES.includes(v);
export const validateMappingType                 = v => EXTERNAL_POS_MAPPING_TYPES.includes(v);
export const validateImportFormat                = v => EXTERNAL_POS_IMPORT_FORMATS.includes(v);
export const validateAuditEventType              = v => EXTERNAL_POS_AUDIT_EVENT_TYPES.includes(v);

const isStr  = v => typeof v === 'string' && v.trim().length > 0;
const isObj  = v => v !== null && typeof v === 'object' && !Array.isArray(v);

export function validateExternalPOSCredentialPresencePayload(p) {
  if (!isObj(p)) return 'payload must be an object';
  if (!validateExternalPOSProviderKey(p.provider_key)) return `invalid provider_key: ${p.provider_key}`;
  if (p.presence_status && !validateCredentialPresenceStatus(p.presence_status)) return `invalid presence_status: ${p.presence_status}`;
  return null;
}

export function validateCompanionModeProfile(p) {
  if (!isObj(p)) return 'payload must be an object';
  if (!validateExternalPOSProviderKey(p.provider_key)) return `invalid provider_key: ${p.provider_key}`;
  return null;
}

export function validateImportProfile(p) {
  if (!isObj(p)) return 'payload must be an object';
  if (!validateExternalPOSProviderKey(p.provider_key)) return `invalid provider_key: ${p.provider_key}`;
  if (p.import_format && !validateImportFormat(p.import_format)) return `invalid import_format: ${p.import_format}`;
  return null;
}

export function validateCSVImportTemplate(p) {
  if (!isObj(p)) return 'payload must be an object';
  if (!isStr(p.template_name)) return 'template_name required';
  return null;
}

export function validateImportBatch(p) {
  if (!isObj(p)) return 'payload must be an object';
  if (!validateExternalPOSProviderKey(p.provider_key)) return `invalid provider_key: ${p.provider_key}`;
  return null;
}

export function validateManualMappingProfile(p) {
  if (!isObj(p)) return 'payload must be an object';
  if (!validateExternalPOSProviderKey(p.provider_key)) return `invalid provider_key: ${p.provider_key}`;
  return null;
}

export function validateMenuCategoryMapping(p)    { return isObj(p) ? null : 'payload must be an object'; }
export function validateMenuItemMapping(p)         { return isObj(p) ? null : 'payload must be an object'; }
export function validateModifierMapping(p)         { return isObj(p) ? null : 'payload must be an object'; }
export function validateTaxMapping(p)              { return isObj(p) ? null : 'payload must be an object'; }
export function validateTipMapping(p)              { return isObj(p) ? null : 'payload must be an object'; }
export function validatePaymentTypeMapping(p)      { return isObj(p) ? null : 'payload must be an object'; }
export function validateStaffRoleMapping(p)        { return isObj(p) ? null : 'payload must be an object'; }
export function validateTableSectionMapping(p)     { return isObj(p) ? null : 'payload must be an object'; }
export function validateRevenueCenterMapping(p)    { return isObj(p) ? null : 'payload must be an object'; }
export function validateDepartmentMapping(p)       { return isObj(p) ? null : 'payload must be an object'; }
export function validateInventorySignalMapping(p)  { return isObj(p) ? null : 'payload must be an object'; }
export function validateHumidorMapping(p)          { return isObj(p) ? null : 'payload must be an object'; }
export function validateBarMapping(p)              { return isObj(p) ? null : 'payload must be an object'; }
export function validateKitchenMapping(p)          { return isObj(p) ? null : 'payload must be an object'; }
export function validateOrderFlowMapping(p)        { return isObj(p) ? null : 'payload must be an object'; }
export function validateTicketFlowMapping(p)       { return isObj(p) ? null : 'payload must be an object'; }
export function validateCloseoutMapping(p)         { return isObj(p) ? null : 'payload must be an object'; }
export function validateReportMapping(p)           { return isObj(p) ? null : 'payload must be an object'; }
export function validateAPIContractRegistry(p)     { return isObj(p) ? null : 'payload must be an object'; }
export function validateWebhookRegistry(p)         { return isObj(p) ? null : 'payload must be an object'; }
export function validateLiveModeRequest(p)         { return isObj(p) && validateExternalPOSProviderKey(p.provider_key) ? null : 'invalid live mode request'; }
export function validateTenantExternalPOSMapping(p){ return isObj(p) ? null : 'payload must be an object'; }
export function validateModuleExternalPOSMapping(p){ return isObj(p) ? null : 'payload must be an object'; }
export function validateComplianceChecklistItem(p) { return isObj(p) ? null : 'payload must be an object'; }
export function validateRiskFlag(p)                { return isObj(p) ? null : 'payload must be an object'; }

// Rejects payloads containing raw API credentials
export function assertNoExternalPOSSecretsInPayload(payload) {
  const forbidden = [
    'api_key', 'secret_key', 'api_secret', 'private_key', 'access_token',
    'client_secret', 'auth_token', 'bearer_token', 'webhook_secret',
    'toast_api_key', 'clover_api_key', 'square_access_token', 'lightspeed_api_key',
    'shopify_access_token', 'spoton_api_key', 'touchbistro_api_key', 'revel_api_key',
    'encryption_key', 'signing_secret', 'password', 'refresh_token',
  ];
  for (const field of forbidden) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      throw new Error(`assertNoExternalPOSSecretsInPayload: forbidden field '${field}' in payload`);
    }
  }
}

// Prevents marking any provider as connected without real verification
export function assertNoFakeExternalPOSConnectedStatus(payload) {
  if (payload.connected === true || payload.api_sync_enabled === true || payload.live_mode_enabled === true) {
    throw new Error('assertNoFakeExternalPOSConnectedStatus: cannot set connected/api_sync_enabled/live_mode_enabled to true without verified credentials and admin approval');
  }
}

// Prevents fake sync claim in text fields
export function assertNoFakeExternalPOSSyncClaim(payload) {
  const fakePhrases = ['sync_live', 'live_sync', 'pos_connected', 'pos_synced', 'inventory_synced', 'menu_synced', 'ticket_synced'];
  const str = JSON.stringify(payload).toLowerCase();
  for (const phrase of fakePhrases) {
    if (str.includes(phrase)) {
      throw new Error(`assertNoFakeExternalPOSSyncClaim: forbidden sync claim phrase '${phrase}' in payload`);
    }
  }
}
