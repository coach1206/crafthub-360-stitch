/**
 * SmokeCraft POS360 Bridge Service
 * Bridges SmokeCraft orders to POS360 when connected.
 * Returns honest not_connected status when POS360 is unavailable.
 * Never invents POS360 success.
 */

const _lastSyncResults = new Map()

/**
 * Returns the current POS360 connection status.
 * POS360 is not connected unless a live adapter confirms it.
 */
export function getPos360Status() {
  return {
    connected: false,
    syncStatus: 'not_connected',
    adapterVersion: '0.1.0',
    message: 'POS360 is not connected in this environment. Order remains in SmokeCraft staff queue.',
    preview_only: true,
  }
}

/**
 * Returns whether orders can currently be sent to POS360.
 */
export function canSendToPOS() {
  return false
}

/**
 * Maps a SmokeCraft order to a POS360 payload shape.
 * Safe to call even when POS360 is not connected — returns the mapped shape only.
 */
export function mapSmokeCraftOrderToPOSPayload(order) {
  return {
    posOrderId: null,
    externalOrderId: order.orderId,
    venueId: order.venueId,
    tableId: order.tableId,
    serverId: order.serverId,
    items: (order.items ?? []).map(item => ({
      posItemId: item.posItemId ?? null,
      name: item.name,
      quantity: item.quantity ?? 1,
      unitPrice: item.price ?? null,
      notes: item.notes ?? '',
    })),
    orderNotes: order.customerNotes ?? '',
    staffNotes: order.staffNotes ?? '',
    sourceModule: 'smokecraft-experience',
    mappedAt: new Date().toISOString(),
  }
}

/**
 * Attempts to send an order to POS360.
 * Returns not_connected honestly when POS360 is unavailable.
 * Only records sent_to_pos status if the bridge actually confirms success.
 */
export async function sendSmokeCraftOrderToPOS(order) {
  const result = {
    orderId: order.orderId,
    sent: false,
    posSyncStatus: 'not_connected',
    posOrderId: null,
    message: 'POS360 is not connected. Order was not sent to POS.',
    preview_only: true,
    attemptedAt: new Date().toISOString(),
  }
  _lastSyncResults.set(order.orderId, result)
  return result
}

/**
 * Returns the last POS sync result for an order.
 */
export function getLastPOSSyncResult(orderId) {
  return _lastSyncResults.get(orderId) ?? {
    orderId,
    sent: false,
    posSyncStatus: 'no_attempt',
    message: 'No POS sync attempt found for this order.',
  }
}

export function buildPosBridgeReport() {
  return {
    pos360Connected: false,
    canSendToPOS: false,
    syncStatus: 'not_connected',
    preview_only: true,
    message: 'POS360 bridge is placeholder. Live connection requires Module Build 3 POS360 adapter.',
  }
}
