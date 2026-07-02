/**
 * BasePosProviderAdapter
 *
 * Base class / contract for all POS provider adapters in CraftHub 360 Stitch.
 * All methods return a standard "not implemented" response by default.
 * Subclasses must override every method they support.
 */

export default class BasePosProviderAdapter {
  /**
   * @param {string} providerName  Unique identifier for this provider.
   */
  constructor(providerName) {
    this.providerName = providerName || 'base';
  }

  _notImplemented(methodName = '') {
    return {
      status: 'integration_required',
      providerName: this.providerName,
      method: methodName,
      message: 'Not implemented',
    };
  }

  /**
   * Return the list of credentials / env vars needed to connect.
   */
  getConnectionRequirements() {
    return this._notImplemented('getConnectionRequirements');
  }

  /**
   * Initiate the OAuth flow — return redirect URL or instructions.
   */
  beginOAuth() {
    return this._notImplemented('beginOAuth');
  }

  /**
   * Complete the OAuth flow with the callback payload.
   * @param {object} oauthPayload
   */
  completeOAuth(oauthPayload) {
    return this._notImplemented('completeOAuth');
  }

  /**
   * Refresh an existing OAuth token.
   * @param {object} tokenData
   */
  refreshToken(tokenData) {
    return this._notImplemented('refreshToken');
  }

  /**
   * Validate that the stored connection is still live.
   */
  validateConnection() {
    return this._notImplemented('validateConnection');
  }

  /**
   * Sync the menu / catalog from the provider into SmokeCraft.
   */
  syncMenu() {
    return this._notImplemented('syncMenu');
  }

  /**
   * Sync inventory levels from the provider.
   */
  syncInventory() {
    return this._notImplemented('syncInventory');
  }

  /**
   * Push an order payload to the provider's POS.
   * @param {object} orderPayload
   */
  createOrder(orderPayload) {
    return this._notImplemented('createOrder');
  }

  /**
   * Retrieve the status of a previously created order.
   * @param {string} orderId
   */
  getOrderStatus(orderId) {
    return this._notImplemented('getOrderStatus');
  }

  /**
   * Cancel an order in the provider's POS.
   * @param {string} orderId
   */
  cancelOrder(orderId) {
    return this._notImplemented('cancelOrder');
  }

  /**
   * Handle an inbound webhook from the provider.
   * @param {object} payload
   * @param {object} headers
   */
  handleWebhook(payload, headers) {
    return this._notImplemented('handleWebhook');
  }

  /**
   * Normalize a provider menu item to the SmokeCraft schema.
   * @param {object} item
   */
  normalizeMenuItem(item) {
    return this._notImplemented('normalizeMenuItem');
  }

  /**
   * Normalize a provider inventory item to the SmokeCraft schema.
   * @param {object} item
   */
  normalizeInventoryItem(item) {
    return this._notImplemented('normalizeInventoryItem');
  }

  /**
   * Normalize a SmokeCraft order payload to the provider's order schema.
   * @param {object} order
   */
  normalizeOrderPayload(order) {
    return this._notImplemented('normalizeOrderPayload');
  }

  /**
   * Verify the HMAC / signature of an inbound webhook.
   * @param {object} payload
   * @param {object} headers
   */
  verifyWebhookSignature(payload, headers) {
    return this._notImplemented('verifyWebhookSignature');
  }

  /**
   * Return current rate-limit state for this provider.
   */
  getRateLimitStatus() {
    return this._notImplemented('getRateLimitStatus');
  }

  /**
   * Normalize a raw provider error to a safe POS360 status object.
   * @param {Error|object} error
   */
  handleProviderError(error) {
    return this._notImplemented('handleProviderError');
  }
}
