/**
 * FutureProviderAdapter — Template / documentation adapter for new POS providers.
 *
 * Shows how to add a new provider to POS360.
 * All methods return integration_required with a guide message.
 *
 * HOW TO ADD A NEW PROVIDER:
 * 1. Copy this file to <providerName>Adapter.js
 * 2. Set providerName in the constructor.
 * 3. Add required env vars to server/config/posProviderConfig.js under PROVIDER_ENV_REQUIREMENTS.
 * 4. Implement every method that the provider supports.
 * 5. Register the new adapter in POS360IntegrationHub.getProviderAdapter().
 * 6. Add to SUPPORTED_PROVIDERS in posProviderConfig.js.
 */

import BasePosProviderAdapter from './basePosProviderAdapter.js';

const GUIDE =
  'Extend BasePosProviderAdapter, implement all methods, register in POS360IntegrationHub.getProviderAdapter()';

export default class FutureProviderAdapter extends BasePosProviderAdapter {
  constructor() {
    super('future_provider');
  }

  getConnectionRequirements() {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE, message: 'Implement getConnectionRequirements() for your provider.' };
  }

  beginOAuth() {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  completeOAuth(oauthPayload) {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  refreshToken(tokenData) {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  validateConnection() {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  syncMenu() {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  syncInventory() {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  createOrder(orderPayload) {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  getOrderStatus(orderId) {
    return { status: 'integration_required', providerName: this.providerName, orderId, guide: GUIDE };
  }

  cancelOrder(orderId) {
    return { status: 'integration_required', providerName: this.providerName, orderId, guide: GUIDE };
  }

  verifyWebhookSignature(payload, headers) {
    return { verified: false, status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  handleWebhook(payload, headers) {
    return { status: 'integration_required', providerName: this.providerName, processed: false, guide: GUIDE };
  }

  normalizeMenuItem(item) {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  normalizeInventoryItem(item) {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  normalizeOrderPayload(order) {
    return { status: 'integration_required', providerName: this.providerName, guide: GUIDE };
  }

  getRateLimitStatus() {
    return { providerName: this.providerName, rateLimited: false, status: 'integration_required', guide: GUIDE };
  }

  handleProviderError(error) {
    return { status: 'provider_error', providerName: this.providerName, safeMessage: 'Future provider encountered an error.', guide: GUIDE };
  }
}
