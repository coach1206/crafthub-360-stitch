// contains_secrets: false, stores_secrets: false — feature flags only

export const DEFAULT_PHASE_D_PAYMENT_PROVIDER_FLAGS = {
  // Master gate — disabled until real credentials are configured and verified
  phaseDPaymentProviderActivationEnabled: false,

  // Per-provider enablement
  stripeProviderEnabled: false,
  squareProviderEnabled: false,
  manualInvoiceProviderEnabled: false,
  cashOfflineProviderEnabled: false,

  // Credential presence tracking — never stores actual secrets
  stripeCredentialsPresent: false,
  squareCredentialsPresent: false,
  manualInvoiceConfigPresent: false,

  // Test mode — no real charges
  stripeTestModeEnabled: false,
  squareTestModeEnabled: false,

  // Live mode — all disabled; require explicit approval gate
  stripeLiveModeEnabled: false,
  squareLiveModeEnabled: false,
  manualInvoiceLiveModeEnabled: false,
  cashOfflineLiveModeEnabled: false,

  // Live payment processing — never enabled until real approval
  stripePaymentProcessingEnabled: false,
  squarePaymentProcessingEnabled: false,
  manualInvoicePaymentProcessingEnabled: false,
  cashOfflinePaymentProcessingEnabled: false,

  // Webhook endpoints
  stripeWebhookEnabled: false,
  squareWebhookEnabled: false,

  // Refund processing
  stripeRefundsEnabled: false,
  squareRefundsEnabled: false,

  // Payout management
  stripePayoutsEnabled: false,
  squarePayoutsEnabled: false,

  // Connect / multi-party
  stripeConnectEnabled: false,
  squareMultiLocationEnabled: false,

  // Compliance and tax
  taxCollectionEnabled: false,
  taxRemittanceEnabled: false,
  pciComplianceCheckEnabled: false,

  // Reporting
  paymentReportingEnabled: false,
  paymentAuditLogEnabled: false,
  paymentReconciliationEnabled: false,

  // Environment lock — must be explicitly unlocked before live mode
  environmentLockEnforced: true,

  // Enforcement flags — always TRUE; never override to false in production
  noFakePaymentProcessingEnforced: true,
  noRawCardDataStorageEnforced: true,
  noSecretsInDatabaseEnforced: true,
  noFakeProviderConnectionEnforced: true,
  noFakeInvoiceCompletionEnforced: true,
  liveModeApprovalGateRequired: true,
  credentialValidationRequired: true,
  platformAdminGuardRequired: true,
  auditTrailRequired: true,
  idempotencyEnforced: true,
};

export function getPhaseDPaymentProviderFlags(overrides = {}) {
  return { ...DEFAULT_PHASE_D_PAYMENT_PROVIDER_FLAGS, ...overrides };
}
