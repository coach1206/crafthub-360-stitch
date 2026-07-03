/**
 * SmokeCraft Environment Contract
 * Defines expected env vars, their criticality, and validation shape.
 * Never exposes actual values — only presence/absence.
 */

export const ENV_VARS = {
  // Database
  DATABASE_URL:                  { critical: true,  category: 'database',         secret: true },
  // POS360
  POS360_ENDPOINT:               { critical: false, category: 'pos360',           secret: false },
  POS360_API_KEY:                { critical: false, category: 'pos360',           secret: true },
  // E.A.T.
  EAT_SYSTEM_ENDPOINT:           { critical: false, category: 'eat',              secret: false },
  EAT_SYSTEM_API_KEY:            { critical: false, category: 'eat',              secret: true },
  // Pairing Provider
  SMOKECRAFT_PAIRING_PROVIDER:   { critical: false, category: 'pairing_provider', secret: false },
  SMOKECRAFT_PAIRING_ENDPOINT:   { critical: false, category: 'pairing_provider', secret: false },
  SMOKECRAFT_PAIRING_API_KEY:    { critical: false, category: 'pairing_provider', secret: true },
  // Passport Connections
  PASSPORT_CONNECTIONS_ENDPOINT: { critical: false, category: 'passport',         secret: false },
  PASSPORT_CONNECTIONS_API_KEY:  { critical: false, category: 'passport',         secret: true },
  // Billing
  BILLING_PROVIDER_KEY:          { critical: false, category: 'billing',          secret: true },
  // Marketplace
  MARKETPLACE_PROVIDER_KEY:      { critical: false, category: 'marketplace',      secret: true },
  // License
  LICENSE_PROVIDER_KEY:          { critical: false, category: 'license',          secret: true },
  // Sync
  SMOKECRAFT_SYNC_QUEUE_ENABLED: { critical: false, category: 'sync',             secret: false },
  SMOKECRAFT_PRODUCTION_MODE:    { critical: false, category: 'sync',             secret: false },
  SMOKECRAFT_ALLOWED_ORIGINS:    { critical: false, category: 'sync',             secret: false },
}

export const ENVIRONMENT_CONTRACT_VERSION = '0.1.0'

export function createEnvVarStatus(name, meta) {
  return {
    name,
    category:  meta.category,
    critical:  meta.critical,
    secret:    meta.secret,
    present:   false,
    value:     meta.secret ? '[REDACTED]' : null,
  }
}
