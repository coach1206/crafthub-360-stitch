/**
 * SmokeCraft → Passport Connections Adapter
 * Placeholder adapter for Passport Connections integration.
 * Returns honest not_connected status.
 * Passport stamp lock rules and connections lock rules are not weakened.
 */

const ADAPTER_STATUS = {
  connected: false,
  adapterVersion: '0.1.0',
  target: 'passport-connections',
  note: 'Passport adapter is placeholder_only. Full connection requires Module Build 13.',
}

export function isConnected() {
  return false
}

export function getStatus() {
  return {
    ...ADAPTER_STATUS,
    status: 'not_connected',
    passportStampLockActive: true,
    connectionsLockActive: true,
    preview_only: true,
  }
}

export function sendPassportStamp(stampPayload) {
  return {
    sent: false,
    status: 'not_connected',
    message: 'Passport adapter is not connected. Stamp was recorded locally only.',
    passportStampLockActive: true,
    preview_only: true,
  }
}

export function syncManagement(payload) {
  return {
    synced: false,
    status: 'not_connected',
    message: 'Passport management sync is not available. Adapter is placeholder_only.',
    preview_only: true,
  }
}
