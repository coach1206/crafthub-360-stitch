/**
 * CloverAdapter — POS provider adapter for Clover.
 *
 * Returns oauth_required for all live operations until Clover OAuth is implemented.
 */

import BasePosProviderAdapter from './basePosProviderAdapter.js';
import { getProviderReadiness } from '../../../config/posProviderConfig.js';

export default class CloverAdapter extends BasePosProviderAdapter {
  constructor() {
    super('clover');
  }

  getConnectionRequirements() {
    const readiness = getProviderReadiness(this.providerName);
    return {
      providerName: this.providerName,
      requiredEnvVars: ['CLOVER_APP_ID', 'CLOVER_APP_SECRET', 'CLOVER_ENVIRONMENT'],
      readinessStatus: readiness.readinessStatus,
      missingVars: readiness.missingVars,
      oauthRequired: true,
      message: 'Clover requires OAuth 2.0. Configure all CLOVER_* env vars then initiate OAuth.',
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
      message: 'Clover OAuth not implemented. Configure CLOVER_APP_ID and CLOVER_APP_SECRET.',
    };
  }

  completeOAuth(oauthPayload) {
    return { status: 'oauth_required', providerName: this.providerName, message: 'Clover OAuth completion not implemented.' };
  }

  refreshToken(tokenData) {
    return { status: 'oauth_required', providerName: this.providerName, message: 'Clover token refresh not implemented.' };
  }

  validateConnection() {
    return { status: 'oauth_required', providerName: this.providerName, message: 'No active Clover connection to validate.' };
  }

  syncMenu() {
    return { status: 'provider_not_connected', providerName: this.providerName, message: 'Clover not connected. Complete OAuth before syncing menu.' };
  }

  syncInventory() {
    return { status: 'provider_not_connected', providerName: this.providerName, message: 'Clover not connected. Complete OAuth before syncing inventory.' };
  }

  createOrder(orderPayload) {
    return { status: 'provider_not_connected', providerName: this.providerName, message: 'Clover not connected. Use manual_pos360 fallback.', fallback: 'manual_pos360' };
  }

  getOrderStatus(orderId) {
    return { status: 'provider_not_connected', providerName: this.providerName, orderId, message: 'Clover not connected.' };
  }

  cancelOrder(orderId) {
    return { status: 'provider_not_connected', providerName: this.providerName, orderId, message: 'Clover not connected.' };
  }

  verifyWebhookSignature(payload, headers) {
    return { verified: false, status: 'oauth_required', message: 'Clover webhook verification not implemented.' };
  }

  handleWebhook(payload, headers) {
    return { status: 'oauth_required', providerName: this.providerName, processed: false, message: 'Clover webhook handling not implemented.' };
  }

  normalizeMenuItem(item) {
    return { status: 'integration_required', providerName: this.providerName, message: 'Clover menu normalization not implemented.' };
  }

  normalizeInventoryItem(item) {
    return { status: 'integration_required', providerName: this.providerName, message: 'Clover inventory normalization not implemented.' };
  }

  normalizeOrderPayload(order) {
    return { status: 'integration_required', providerName: this.providerName, message: 'Clover order normalization not implemented.' };
  }

  getRateLimitStatus() {
    return { providerName: this.providerName, rateLimited: false, status: 'provider_not_connected', message: 'No active Clover connection.' };
  }

  handleProviderError(error) {
    return { status: 'provider_error', providerName: this.providerName, safeMessage: 'A Clover error occurred. Check server logs.' };
  }
}
