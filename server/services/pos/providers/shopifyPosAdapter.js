/**
 * ShopifyPosAdapter — POS provider adapter for Shopify POS.
 *
 * Returns oauth_required for all live operations until Shopify OAuth is implemented.
 */

import BasePosProviderAdapter from './basePosProviderAdapter.js';
import { getProviderReadiness } from '../../../config/posProviderConfig.js';

export default class ShopifyPosAdapter extends BasePosProviderAdapter {
  constructor() {
    super('shopify_pos');
  }

  getConnectionRequirements() {
    const readiness = getProviderReadiness(this.providerName);
    return {
      providerName: this.providerName,
      requiredEnvVars: [
        'SHOPIFY_API_KEY',
        'SHOPIFY_API_SECRET',
        'SHOPIFY_APP_URL',
        'SHOPIFY_WEBHOOK_SECRET',
      ],
      readinessStatus: readiness.readinessStatus,
      missingVars: readiness.missingVars,
      oauthRequired: true,
      message:
        'Shopify POS requires OAuth 2.0. Configure all SHOPIFY_* env vars then initiate OAuth.',
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
        'Shopify POS OAuth not implemented. Configure SHOPIFY_API_KEY and SHOPIFY_API_SECRET.',
    };
  }

  completeOAuth(oauthPayload) {
    return { status: 'oauth_required', providerName: this.providerName, message: 'Shopify POS OAuth completion not implemented.' };
  }

  refreshToken(tokenData) {
    return { status: 'oauth_required', providerName: this.providerName, message: 'Shopify POS token refresh not implemented.' };
  }

  validateConnection() {
    return { status: 'oauth_required', providerName: this.providerName, message: 'No active Shopify POS connection to validate.' };
  }

  syncMenu() {
    return { status: 'provider_not_connected', providerName: this.providerName, message: 'Shopify POS not connected. Complete OAuth before syncing menu.' };
  }

  syncInventory() {
    return { status: 'provider_not_connected', providerName: this.providerName, message: 'Shopify POS not connected. Complete OAuth before syncing inventory.' };
  }

  createOrder(orderPayload) {
    return { status: 'provider_not_connected', providerName: this.providerName, message: 'Shopify POS not connected. Use manual_pos360 fallback.', fallback: 'manual_pos360' };
  }

  getOrderStatus(orderId) {
    return { status: 'provider_not_connected', providerName: this.providerName, orderId, message: 'Shopify POS not connected.' };
  }

  cancelOrder(orderId) {
    return { status: 'provider_not_connected', providerName: this.providerName, orderId, message: 'Shopify POS not connected.' };
  }

  verifyWebhookSignature(payload, headers) {
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return {
        verified: false,
        status: 'credentials_missing',
        message: 'SHOPIFY_WEBHOOK_SECRET not configured.',
      };
    }
    return { verified: false, status: 'webhook_pending', message: 'Shopify POS webhook verification not implemented.' };
  }

  handleWebhook(payload, headers) {
    const sigResult = this.verifyWebhookSignature(payload, headers);
    if (!sigResult.verified) {
      return { ...sigResult, processed: false };
    }
    return { status: 'webhook_pending', providerName: this.providerName, processed: false, message: 'Shopify POS webhook handling not implemented.' };
  }

  normalizeMenuItem(item) {
    return { status: 'integration_required', providerName: this.providerName, message: 'Shopify POS menu normalization not implemented.' };
  }

  normalizeInventoryItem(item) {
    return { status: 'integration_required', providerName: this.providerName, message: 'Shopify POS inventory normalization not implemented.' };
  }

  normalizeOrderPayload(order) {
    return { status: 'integration_required', providerName: this.providerName, message: 'Shopify POS order normalization not implemented.' };
  }

  getRateLimitStatus() {
    return { providerName: this.providerName, rateLimited: false, status: 'provider_not_connected', message: 'No active Shopify POS connection.' };
  }

  handleProviderError(error) {
    return { status: 'provider_error', providerName: this.providerName, safeMessage: 'A Shopify POS error occurred. Check server logs.' };
  }
}
