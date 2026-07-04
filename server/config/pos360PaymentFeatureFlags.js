/**
 * pos360PaymentFeatureFlags.js — Phase B.11 Prompt X
 * Feature flags for POS360 payments, tips, signatures, receipts, split tender, closeout.
 */

export const DEFAULT_POS360_PAYMENT_FLAGS = {
  paymentProviderProfilesEnabled: true,
  stripeProviderEnabled: false,
  squareProviderEnabled: false,
  cloverProviderEnabled: false,
  toastProviderEnabled: false,
  adyenProviderEnabled: false,
  authorizeNetProviderEnabled: false,
  worldpayProviderEnabled: false,
  manualPaymentEnabled: true,
  terminalProfilesEnabled: true,
  handheldTerminalEnabled: true,
  tabletTerminalEnabled: true,
  kioskTerminalEnabled: false,
  counterTerminalEnabled: true,
  externalTerminalEnabled: false,
  paymentIntentsEnabled: true,
  splitTenderEnabled: true,
  tipSelectionEnabled: true,
  tipPresetPercentsEnabled: true,
  tipCustomAmountEnabled: true,
  tipNoTipEnabled: true,
  tipAdjustmentEnabled: true,
  tipPoolEnabled: false,
  signatureMetadataEnabled: true,
  receiptGenerationEnabled: true,
  receiptPrintEnabled: true,
  receiptEmailEnabled: false,
  receiptSmsEnabled: false,
  receiptQrEnabled: false,
  refundWorkflowEnabled: true,
  voidWorkflowEnabled: true,
  managerApprovalForRefundsEnabled: true,
  managerApprovalForVoidsEnabled: true,
  cashDrawerEnabled: true,
  serverCloseoutEnabled: true,
  shiftCloseoutEnabled: true,
  dailyCloseoutEnabled: true,
  paymentRiskFlagsEnabled: true,
  eatRevenueInsightHooksEnabled: false,
  offlinePaymentQueueEnabled: true,
  multilingualPaymentsEnabled: true,
  honestProviderStatesEnabled: true,
}

export function getPaymentFlags(venueOverrides = {}) {
  return { ...DEFAULT_POS360_PAYMENT_FLAGS, ...venueOverrides }
}
