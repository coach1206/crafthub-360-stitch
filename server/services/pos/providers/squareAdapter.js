/**
 * SquareAdapter — POS provider adapter for Square.
 *
 * All live operations return oauth_required or provider_not_connected
 * until Square OAuth is implemented and credentials are stored.
 */

import BasePosProviderAdapter from './basePosProviderAdapter.js';
import { getProviderReadiness } from '../../../config/posProviderConfig.js';

export default class SquareAdapter extends BasePosProviderAdapter {
  constructor() {
    super('square');
  }

  getConnectionRequirements() {
    const readiness = getProviderReadiness(this.providerName);
    return {
      providerName: this.providerName,
      requiredEnvVars: [
        'SQUARE_APP_ID',
        'SQUARE_APP_SECRET',
        'SQUARE_ENVIRONMENT',
        'SQUARE_WEBHOOK_SIGNATURE_KEY',
      ],
      readinessStatus: readiness.readinessStatus,
      missingVars: readiness.missingVars,
      oauthRequired: true,
      message:
        'Square requires OAuth 2.0. Configure all SQUARE_* env vars then initiate OAuth.',
    };
  }

  beginOAuth() {
    const readiness = getProviderReadiness(this.providerName);
    if (readiness.readinessStatus === 'credentials_missing') {
      return {
        status: 'credentials_missing',
        providerName: this.providerName,
        missingVars: readiness.missingVars,
        message: `Cannot begin OAuth — missing env vars: ${readiness.missingVars.join(', ')}`,
      };
    }
    return {
      status: 'oauth_required',
      providerName: this.providerName,
      message:
        'Square OAuth not implemented. Configure SQUARE_APP_ID and SQUARE_APP_SECRET.',
    };
  }

  completeOAuth(oauthPayload) {
    return {
      status: 'oauth_required',
      providerName: this.providerName,
      message: 'Square OAuth completion not implemented.',
    };
  }

  refreshToken(tokenData) {
    return {
      status: 'oauth_required',
      providerName: this.providerName,
      message: 'Square token refresh not implemented.',
    };
  }

  validateConnection() {
    return {
      status: 'oauth_required',
      providerName: this.providerName,
      message: 'No active Square connection to validate.',
    };
  }

  syncMenu() {
    return {
      status: 'provider_not_connected',
      providerName: this.providerName,
      message: 'Square not connected. Complete OAuth before syncing menu.',
    };
  }

  syncInventory() {
    return {
      status: 'provider_not_connected',
      providerName: this.providerName,
      message: 'Square not connected. Complete OAuth before syncing inventory.',
    };
  }

  createOrder(orderPayload) {
    return {
      status: 'provider_not_connected',
      providerName: this.providerName,
      message: 'Square not connected. Use manual_pos360 fallback.',
      fallback: 'manual_pos360',
    };
  }

  getOrderStatus(orderId) {
    return {
      status: 'provider_not_connected',
      providerName: this.providerName,
      orderId,
      message: 'Square not connected. Cannot retrieve order status.',
    };
  }

  cancelOrder(orderId) {
    return {
      status: 'provider_not_connected',
      providerName: this.providerName,
      orderId,
      message: 'Square not connected. Cannot cancel order.',
    };
  }

  verifyWebhookSignature(payload, headers) {
    const webhookKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!webhookKey) {
      return {
        verified: false,
        status: 'credentials_missing',
        message: 'SQUARE_WEBHOOK_SIGNATURE_KEY not configured.',
      };
    }
    return {
      verified: false,
      status: 'webhook_pending',
      message: 'Square webhook signature verification not implemented.',
    };
  }

  handleWebhook(payload, headers) {
    const sigResult = this.verifyWebhookSignature(payload, headers);
    if (!sigResult.verified) {
      return { ...sigResult, processed: false };
    }
    return {
      status: 'webhook_pending',
      providerName: this.providerName,
      message: 'Square webhook handling not implemented.',
    };
  }

  normalizeMenuItem(item) {
    return {
      status: 'integration_required',
      providerName: this.providerName,
      message: 'Square menu item normalization not implemented.',
    };
  }

  normalizeInventoryItem(item) {
    return {
      status: 'integration_required',
      providerName: this.providerName,
      message: 'Square inventory item normalization not implemented.',
    };
  }

  normalizeOrderPayload(order) {
    return {
      status: 'integration_required',
      providerName: this.providerName,
      message: 'Square order payload normalization not implemented.',
    };
  }

  getRateLimitStatus() {
    return {
      providerName: this.providerName,
      rateLimited: false,
      status: 'provider_not_connected',
      message: 'No active Square connection — cannot check rate limits.',
    };
  }

  handleProviderError(error) {
    return {
      status: 'provider_error',
      providerName: this.providerName,
      safeMessage: 'A Square error occurred. Check server logs for details.',
    };
  }
}
