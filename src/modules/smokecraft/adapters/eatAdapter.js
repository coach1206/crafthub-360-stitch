/**
 * SmokeCraft → E.A.T. Command Hub Adapter
 * Placeholder adapter for E.A.T. integration.
 * Returns honest not_connected status until Module Build 4 connects the real adapter.
 * No fake success. No fake E.A.T. sync.
 */

const ADAPTER_STATUS = {
  connected: false,
  adapterVersion: '0.1.0',
  target: 'eat-command-hub',
  note: 'E.A.T. adapter is placeholder_only. Full connection requires Module Build 4.',
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
    message: 'E.A.T. adapter is not connected. Order was not sent to E.A.T.',
    preview_only: true,
  }
}

export function syncManagement(payload) {
  return {
    synced: false,
    status: 'not_connected',
    message: 'E.A.T. management sync is not available. Adapter is placeholder_only.',
    preview_only: true,
  }
}

export function sendPassportStamp(stampPayload) {
  return {
    sent: false,
    status: 'not_connected',
    message: 'E.A.T. passport stamp sync is not available in this adapter version.',
    preview_only: true,
  }
}
