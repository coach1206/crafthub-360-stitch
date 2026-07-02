/**
 * LightspeedAdapter — POS provider adapter for Lightspeed.
 *
 * Returns oauth_required for all live operations until Lightspeed OAuth is implemented.
 */

import BasePosProviderAdapter from './basePosProviderAdapter.js';
import { getProviderReadiness } from '../../../config/posProviderConfig.js';

export default class LightspeedAdapter extends BasePosProviderAdapter {
  constructor() {
    super('lightspeed');
  }

  getConnectionRequirements() {
    const readiness = getProviderReadiness(this.providerName);
    return {
      providerName: this.providerName,
      requiredEnvVars: [
        'LIGHTSPEED_CLIENT_ID',
        'LIGHTSPEED_CLIENT_SECRET',
        'LIGHTSPEED_ENVIRONMENT',
      ],
      readinessStatus: readiness.readinessStatus,
      missingVars: readiness.missingVars,
      oauthRequired: true,
      message:
        'Lightspeed requires OAuth 2.0. Configure all LIGHTSPEED_* env vars then initiate OAuth.',
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
        'Lightspeed OAuth not implemented. Configure LIGHTSPEED_CLIENT_ID and LIGHTSPEED_CLIENT_SECRET.',
    };
  }

  completeOAuth(oauthPayload) {
    return { status: 'oauth_required', providerName: this.providerName, message: 'Lightspeed OAuth completion not implemented.' };
  }

  refreshToken(tokenData) {
    return { status: 'oauth_required', providerName: this.providerName, message: 'Lightspeed token refresh not implemented.' };
  }

  validateConnection() {
    return { status: 'oauth_required', providerName: this.providerName, message: 'No active Lightspeed connection to validate.' };
  }

  syncMenu() {
    return { status: 'provider_not_connected', providerName: this.providerName, message: 'Lightspeed not connected. Complete OAuth before syncing menu.' };
  }

  syncInventory() {
    return { status: 'provider_not_connected', providerName: this.providerName, message: 'Lightspeed not connected. Complete OAuth before syncing inventory.' };
  }

  createOrder(orderPayload) {
    return { status: 'provider_not_connected', providerName: this.providerName, message: 'Lightspeed not connected. Use manual_pos360 fallback.', fallback: 'manual_pos360' };
  }

  getOrderStatus(orderId) {
    return { status: 'provider_not_connected', providerName: this.providerName, orderId, message: 'Lightspeed not connected.' };
  }

  cancelOrder(orderId) {
    return { status: 'provider_not_connected', providerName: this.providerName, orderId, message: 'Lightspeed not connected.' };
  }

  verifyWebhookSignature(payload, headers) {
    return { verified: false, status: 'oauth_required', message: 'Lightspeed webhook verification not implemented.' };
  }

  handleWebhook(payload, headers) {
    return { status: 'oauth_required', providerName: this.providerName, processed: false, message: 'Lightspeed webhook handling not implemented.' };
  }

  normalizeMenuItem(item) {
    return { status: 'integration_required', providerName: this.providerName, message: 'Lightspeed menu normalization not implemented.' };
  }

  normalizeInventoryItem(item) {
    return { status: 'integration_required', providerName: this.providerName, message: 'Lightspeed inventory normalization not implemented.' };
  }

  normalizeOrderPayload(order) {
    return { status: 'integration_required', providerName: this.providerName, message: 'Lightspeed order normalization not implemented.' };
  }

  getRateLimitStatus() {
    return { providerName: this.providerName, rateLimited: false, status: 'provider_not_connected', message: 'No active Lightspeed connection.' };
  }

  handleProviderError(error) {
    return { status: 'provider_error', providerName: this.providerName, safeMessage: 'A Lightspeed error occurred. Check server logs.' };
  }
}
