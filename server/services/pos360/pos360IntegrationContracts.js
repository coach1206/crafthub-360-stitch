// POS360 External Integrations — contracts, constants, validators

export const PROVIDER_TYPES = ['pos_system', 'payment_processor', 'accounting', 'payroll', 'marketing', 'communication', 'reservations', 'analytics', 'eat', 'smokecraft', 'other'];
export const PROVIDER_KEYS = ['toast', 'clover', 'square', 'lightspeed', 'shopify_pos', 'oracle_micros', 'ncr', 'revel', 'touchbistro', 'stripe', 'adyen', 'quickbooks', 'xero', 'gusto', 'adp', 'mailchimp', 'twilio', 'sendgrid', 'opentable_style', 'looker', 'powerbi', 'tableau', 'manual_csv', 'eat', 'smokecraft', 'other'];
export const PROVIDER_STATUSES = ['pending', 'ready', 'active', 'paused', 'error', 'disconnected', 'deprecated'];
export const CONNECTOR_TYPES = ['overlay', 'native', 'webhook', 'file_sync', 'api_bridge', 'manual'];
export const OVERLAY_MODES = ['read_only', 'write_through', 'bidirectional', 'manual'];
export const CONNECTOR_STATUSES = ['pending', 'configured', 'active', 'paused', 'error', 'disconnected'];
export const CAPABILITY_GROUPS = ['orders', 'payments', 'menu', 'inventory', 'customers', 'staff', 'reservations', 'reports', 'loyalty', 'kds', 'webhooks', 'sync', 'export', 'import'];
export const SUPPORTED_STATUSES = ['supported', 'partial', 'unsupported', 'deprecated'];
export const CREDENTIAL_TYPES = ['api_key_ref', 'oauth_token_ref', 'webhook_secret_ref', 'certificate_ref', 'service_account_ref'];
export const CREDENTIAL_STATUSES = ['pending', 'configured', 'active', 'expired', 'revoked', 'error'];
export const WEBHOOK_TYPES = ['inbound', 'outbound', 'bidirectional'];
export const WEBHOOK_ENDPOINT_STATUSES = ['pending', 'active', 'paused', 'error', 'deleted'];
export const WEBHOOK_EVENT_STATUSES = ['received', 'processing', 'processed', 'failed', 'retrying', 'dropped'];
export const SYNC_TYPES = ['full', 'incremental', 'delta', 'manual', 'scheduled'];
export const SYNC_STATUSES = ['pending', 'active', 'paused', 'error', 'disabled'];
export const SYNC_RUN_STATUSES = ['queued', 'running', 'completed', 'failed', 'cancelled', 'timed_out'];
export const RETRY_STRATEGIES = ['fixed', 'exponential', 'linear', 'none'];
export const CONFLICT_TYPES = ['duplicate_record', 'schema_mismatch', 'value_conflict', 'missing_reference', 'validation_error'];
export const CONFLICT_STATUSES = ['open', 'resolved_local', 'resolved_remote', 'skipped', 'escalated'];
export const RECONCILIATION_TYPES = ['order', 'payment', 'inventory', 'customer', 'staff', 'menu', 'loyalty', 'manual'];
export const RECONCILIATION_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'];
export const MAPPING_ENTITY_TYPES = ['order', 'payment', 'menu_item', 'modifier', 'category', 'customer', 'staff', 'table', 'inventory', 'loyalty', 'voucher'];
export const MAPPING_STATUSES = ['draft', 'active', 'inactive', 'deprecated'];
export const TRANSFORM_TYPES = ['direct', 'lookup', 'formula', 'template', 'conditional', 'aggregate'];
export const IMPORT_TYPES = ['order', 'menu', 'inventory', 'customer', 'staff', 'loyalty', 'voucher', 'manual_csv'];
export const IMPORT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'partial'];
export const EXPORT_TYPES = ['order', 'payment', 'menu', 'inventory', 'customer', 'staff', 'loyalty', 'audit', 'report', 'manual_csv'];
export const EXPORT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'partial'];
export const LINEAGE_STATUSES = ['tracked', 'untracked', 'partial', 'error'];
export const VISIBILITY_TYPES = ['eat_module', 'smokecraft_module', 'pos360_dashboard', 'external_report'];

export function isValidProviderType(v) { return PROVIDER_TYPES.includes(v); }
export function isValidProviderKey(v) { return PROVIDER_KEYS.includes(v); }
export function isValidProviderStatus(v) { return PROVIDER_STATUSES.includes(v); }
export function isValidConnectorType(v) { return CONNECTOR_TYPES.includes(v); }
export function isValidOverlayMode(v) { return OVERLAY_MODES.includes(v); }
export function isValidConnectorStatus(v) { return CONNECTOR_STATUSES.includes(v); }
export function isValidCapabilityGroup(v) { return CAPABILITY_GROUPS.includes(v); }
export function isValidSupportedStatus(v) { return SUPPORTED_STATUSES.includes(v); }
export function isValidCredentialType(v) { return CREDENTIAL_TYPES.includes(v); }
export function isValidCredentialStatus(v) { return CREDENTIAL_STATUSES.includes(v); }
export function isValidWebhookType(v) { return WEBHOOK_TYPES.includes(v); }
export function isValidWebhookEndpointStatus(v) { return WEBHOOK_ENDPOINT_STATUSES.includes(v); }
export function isValidWebhookEventStatus(v) { return WEBHOOK_EVENT_STATUSES.includes(v); }
export function isValidSyncType(v) { return SYNC_TYPES.includes(v); }
export function isValidSyncStatus(v) { return SYNC_STATUSES.includes(v); }
export function isValidSyncRunStatus(v) { return SYNC_RUN_STATUSES.includes(v); }
export function isValidRetryStrategy(v) { return RETRY_STRATEGIES.includes(v); }
export function isValidConflictType(v) { return CONFLICT_TYPES.includes(v); }
export function isValidConflictStatus(v) { return CONFLICT_STATUSES.includes(v); }
export function isValidReconciliationType(v) { return RECONCILIATION_TYPES.includes(v); }
export function isValidReconciliationStatus(v) { return RECONCILIATION_STATUSES.includes(v); }
export function isValidMappingEntityType(v) { return MAPPING_ENTITY_TYPES.includes(v); }
export function isValidMappingStatus(v) { return MAPPING_STATUSES.includes(v); }
export function isValidTransformType(v) { return TRANSFORM_TYPES.includes(v); }
export function isValidImportType(v) { return IMPORT_TYPES.includes(v); }
export function isValidImportStatus(v) { return IMPORT_STATUSES.includes(v); }
export function isValidExportType(v) { return EXPORT_TYPES.includes(v); }
export function isValidExportStatus(v) { return EXPORT_STATUSES.includes(v); }
export function isValidLineageStatus(v) { return LINEAGE_STATUSES.includes(v); }
export function isValidVisibilityType(v) { return VISIBILITY_TYPES.includes(v); }
