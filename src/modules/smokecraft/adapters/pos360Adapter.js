/**
 * SmokeCraft → POS360 Adapter
 * Placeholder adapter for POS360 integration.
 * Returns honest not_connected status until Module Build 3 connects the real adapter.
 * No fake success. No fake POS sync.
 */

const ADAPTER_STATUS = {
  connected: false,
  adapterVersion: '0.1.0',
  target: 'pos360',
  note: 'POS360 adapter is placeholder_only. Full connection requires Module Build 3.',
}

export function isConnected() {
  return false
}

export function getStatus() {
  return {
    ...ADAPTER_STATUS,
    status: 'not_connected',
    preview_only: true,
  }
}

export function sendOrder(orderPayload) {
  return {
    sent: false,
    status: 'not_connected',
    orderId: orderPayload?.orderId ?? null,
    message: 'POS360 adapter is not connected. Order was not sent to POS.',
    preview_only: true,
  }
}

export function syncManagement(payload) {
  return {
    synced: false,
    status: 'not_connected',
    message: 'POS360 management sync is not available. Adapter is placeholder_only.',
    preview_only: true,
  }
}

export function sendPassportStamp(stampPayload) {
  return {
    sent: false,
    status: 'not_connected',
    message: 'POS360 passport stamp sync is not available in this adapter version.',
    preview_only: true,
  }
}
