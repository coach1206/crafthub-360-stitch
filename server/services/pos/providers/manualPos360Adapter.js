/**
 * ManualPos360Adapter — Manual POS fallback adapter for CraftHub 360 Stitch.
 *
 * No OAuth or external provider required.
 * Creates printable manual tickets and manages inventory locally.
 */

import crypto from 'crypto';
import BasePosProviderAdapter from './basePosProviderAdapter.js';

export default class ManualPos360Adapter extends BasePosProviderAdapter {
  constructor() {
    super('manual_pos360');
  }

  getConnectionRequirements() {
    return {
      providerName: this.providerName,
      requiredEnvVars: [],
      oauthRequired: false,
      readinessStatus: 'manual_mode',
      message: 'Manual POS360 requires no credentials or OAuth — always ready.',
    };
  }

  beginOAuth() {
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      message: 'Manual POS360 does not require OAuth.',
    };
  }

  completeOAuth(oauthPayload) {
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      message: 'Manual POS360 does not use OAuth.',
    };
  }

  refreshToken(tokenData) {
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      message: 'Manual POS360 does not use tokens.',
    };
  }

  validateConnection() {
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      connected: true,
      message: 'Manual POS360 is always connected — no external service required.',
    };
  }

  syncMenu() {
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      message: 'Manual mode: menu managed locally within SmokeCraft.',
    };
  }

  syncInventory() {
    return {
      status: 'preview_inventory',
      providerName: this.providerName,
      message: 'Manual mode: inventory managed locally.',
      storageMode: 'local',
    };
  }

  /**
   * Create a manual order ticket. Generates a local ticket ID.
   * @param {object} orderPayload
   */
  createOrder(orderPayload) {
    const ticketId = `MANUAL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const ticket = this.normalizeOrderPayload(orderPayload);

    return {
      status: 'manual_mode',
      providerName: this.providerName,
      ticketId,
      ticket: ticket.ticket || ticket,
      message: 'Manual ticket created. No POS provider required.',
      createdAt: new Date().toISOString(),
    };
  }

  getOrderStatus(orderId) {
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      orderId,
      message: 'Manual mode: order status tracked locally.',
    };
  }

  cancelOrder(orderId) {
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      orderId,
      message: 'Manual mode: order cancellation handled locally.',
    };
  }

  verifyWebhookSignature(payload, headers) {
    return {
      verified: false,
      status: 'manual_mode',
      message: 'Manual POS360 does not use webhooks.',
    };
  }

  handleWebhook(payload, headers) {
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      processed: false,
      message: 'Manual POS360 does not receive webhooks.',
    };
  }

  normalizeMenuItem(item) {
    if (!item) return { status: 'manual_mode', item: null };
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      item: {
        id: item.id || item.smokeCraftItemId || null,
        name: item.name || item.itemName || 'Unnamed Item',
        price: item.price ?? item.unitPrice ?? 0,
        category: item.category || 'General',
        description: item.description || '',
      },
    };
  }

  normalizeInventoryItem(item) {
    if (!item) return { status: 'manual_mode', item: null };
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      item: {
        id: item.id || null,
        name: item.name || 'Unnamed Item',
        quantity: item.quantity ?? 0,
        unit: item.unit || 'ea',
      },
    };
  }

  /**
   * Map a SmokeCraft order payload to a printable manual ticket format.
   * @param {object} order
   */
  normalizeOrderPayload(order) {
    if (!order) {
      return {
        status: 'manual_mode',
        ticket: null,
        message: 'No order payload provided.',
      };
    }

    const items = (order.items || []).map((item, idx) => ({
      lineNumber: idx + 1,
      itemId: item.itemId || item.id || null,
      name: item.name || item.itemName || 'Item',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice ?? item.price ?? 0,
      lineTotal: (item.quantity || 1) * (item.unitPrice ?? item.price ?? 0),
      notes: item.notes || item.modifiers || '',
    }));

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

    return {
      status: 'manual_mode',
      providerName: this.providerName,
      ticket: {
        venueName: order.venueName || 'SmokeCraft',
        venueId: order.venueId || null,
        orderId: order.orderId || order.id || null,
        customerName: order.customerName || order.guestName || 'Guest',
        tableNumber: order.tableNumber || order.table || null,
        orderType: order.orderType || 'dine-in',
        items,
        subtotal,
        tax: order.tax ?? 0,
        total: subtotal + (order.tax ?? 0),
        notes: order.notes || '',
        printedAt: new Date().toISOString(),
        format: 'manual_ticket_v1',
      },
    };
  }

  getRateLimitStatus() {
    return {
      providerName: this.providerName,
      rateLimited: false,
      status: 'manual_mode',
      message: 'Manual POS360 has no rate limits.',
    };
  }

  handleProviderError(error) {
    return {
      status: 'manual_mode',
      providerName: this.providerName,
      safeMessage: 'Manual POS360 encountered a local error. Check server logs.',
    };
  }
}
