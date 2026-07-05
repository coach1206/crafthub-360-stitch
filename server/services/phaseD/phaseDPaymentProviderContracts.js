// contains_secrets: false, stores_secrets: false — hardcoded constants only; no credentials stored here

export const PAYMENT_PROVIDER_KEYS = [
  'stripe',
  'square',
  'manual_invoice',
  'cash_offline',
  'future_placeholder',
];

export const PAYMENT_PROVIDER_STATUSES = [
  'not_started',
  'credentials_required',
  'credentials_present_unverified',
  'verification_failed',
  'verified_test_mode',
  'verified_live_mode_locked',
  'live_mode_requested',
  'live_mode_approved',
  'live_mode_enabled',
];

export const CREDENTIAL_PRESENCE_STATUSES = [
  'absent',
  'present_unverified',
  'present_verified_test',
  'present_verified_live',
  'expired',
  'revoked',
];

export const ENVIRONMENT_LOCK_STATUSES = [
  'locked',
  'unlock_requested',
  'unlock_approved',
  'unlocked',
];

export const PAYMENT_AUDIT_EVENT_TYPES = [
  'provider_registered',
  'credentials_status_updated',
  'environment_lock_changed',
  'live_mode_requested',
  'live_mode_approved',
  'live_mode_denied',
  'live_mode_enabled',
  'live_mode_disabled',
  'verification_attempted',
  'verification_succeeded',
  'verification_failed',
  'provider_disabled',
  'provider_enabled',
];

export const isValidPaymentProviderKey     = v => PAYMENT_PROVIDER_KEYS.includes(v);
export const isValidPaymentProviderStatus  = v => PAYMENT_PROVIDER_STATUSES.includes(v);
export const isValidCredentialStatus       = v => CREDENTIAL_PRESENCE_STATUSES.includes(v);
export const isValidEnvironmentLockStatus  = v => ENVIRONMENT_LOCK_STATUSES.includes(v);
export const isValidPaymentAuditEventType  = v => PAYMENT_AUDIT_EVENT_TYPES.includes(v);

export const isNonEmpty = v => typeof v === 'string' && v.trim().length > 0;
export const isUuid     = v => typeof v === 'string' && /^[0-9a-f-]{36}$/.test(v);

// Rejects any payload that contains raw credential fields — enforced at the service layer
export function assertNoSecretsInPayload(payload) {
  const forbidden = [
    'secret_key', 'api_secret', 'private_key', 'access_token', 'refresh_token',
    'client_secret', 'webhook_secret', 'password', 'auth_token', 'bearer_token',
    'stripe_secret', 'square_secret', 'encryption_key', 'signing_secret',
  ];
  for (const field of forbidden) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      throw new Error(`assertNoSecretsInPayload: forbidden field '${field}' in payload`);
    }
  }
}

export function requireProviderKey(key) {
  if (!isValidPaymentProviderKey(key)) {
    throw new Error(`Invalid payment provider key: ${key}`);
  }
}

export function requireProviderStatus(status) {
  if (!isValidPaymentProviderStatus(status)) {
    throw new Error(`Invalid payment provider status: ${status}`);
  }
}
