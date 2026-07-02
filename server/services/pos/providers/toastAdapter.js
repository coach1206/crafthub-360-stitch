/**
 * ToastAdapter — POS provider adapter for Toast.
 *
 * Toast requires partner program approval before any integration.
 * All live operations reflect this requirement.
 */

import BasePosProviderAdapter from './basePosProviderAdapter.js';

export default class ToastAdapter extends BasePosProviderAdapter {
  constructor() {
    super('toast');
  }

  getConnectionRequirements() {
    return {
      providerName: this.providerName,
      requiredEnvVars: [
        'TOAST_CLIENT_ID',
        'TOAST_CLIENT_SECRET',
        'TOAST_ENVIRONMENT',
        'TOAST_PARTNER_STATUS',
      ],
      oauthRequired: true,
      partnerApprovalRequired: true,
      message:
        'Toast integration requires Toast Partner Program approval. Contact Toast before proceeding.',
    };
  }

  beginOAuth() {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      message:
        'Toast requires Toast partner program approval. Contact Toast before OAuth.',
    };
  }

  completeOAuth(oauthPayload) {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      message: 'Toast partner approval required before completing OAuth.',
    };
  }

  refreshToken(tokenData) {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      message: 'Toast partner approval required before token refresh.',
    };
  }

  validateConnection() {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      message: 'Toast partner approval required before connection validation.',
    };
  }

  syncMenu() {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      message: 'Toast partner approval required before menu sync.',
    };
  }

  syncInventory() {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      message: 'Toast partner approval required before inventory sync.',
    };
  }

  createOrder(orderPayload) {
    return {
      status: 'integration_required',
      provider: this.providerName,
      note: 'Toast partner approval required before integration.',
      fallback: 'manual_pos360',
    };
  }

  getOrderStatus(orderId) {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      orderId,
      message: 'Toast partner approval required.',
    };
  }

  cancelOrder(orderId) {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      orderId,
      message: 'Toast partner approval required.',
    };
  }

  verifyWebhookSignature(payload, headers) {
    return {
      verified: false,
      status: 'partner_approval_required',
      message: 'Toast webhook verification not available without partner approval.',
    };
  }

  handleWebhook(payload, headers) {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      processed: false,
      message: 'Toast webhook handling not available without partner approval.',
    };
  }

  normalizeMenuItem(item) {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      message: 'Toast menu normalization not available without partner approval.',
    };
  }

  normalizeInventoryItem(item) {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      message: 'Toast inventory normalization not available without partner approval.',
    };
  }

  normalizeOrderPayload(order) {
    return {
      status: 'partner_approval_required',
      providerName: this.providerName,
      message: 'Toast order normalization not available without partner approval.',
    };
  }

  getRateLimitStatus() {
    return {
      providerName: this.providerName,
      rateLimited: false,
      status: 'partner_approval_required',
      message: 'Toast partner approval required before checking rate limits.',
    };
  }

  handleProviderError(error) {
    return {
      status: 'provider_error',
      providerName: this.providerName,
      safeMessage: 'A Toast error occurred. Check server logs for details.',
    };
  }
}
