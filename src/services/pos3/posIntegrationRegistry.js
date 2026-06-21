/**
 * POS 3 Integration Registry — lists providers + connection state enum.
 * Connection state is derived from saved config in localStorage
 * (see posIntegrationService.js) — not maintained separately here.
 */

import { POS_PROVIDERS, getPosProviders, getPosProvider } from '../../data/pos3/posProviders.js'

export { getPosProviders, getPosProvider }

export const CONNECTION_STATES = {
  NOT_CONNECTED: 'not_connected',
  NEEDS_CREDENTIALS: 'needs_credentials',
  CONNECTED: 'connected',
  SYNC_ACTIVE: 'sync_active',
  ERROR: 'error',
  DISABLED: 'disabled',
}

export function listProviders() { return POS_PROVIDERS }
