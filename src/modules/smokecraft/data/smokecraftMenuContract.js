/**
 * SmokeCraft Venue Menu Contract
 * Defines the shape of venue menu items usable within the SmokeCraft journey.
 * This contract allows SmokeCraft to integrate with POS360 and E.A.T. menus
 * without locking into one vendor.
 */

export const MENU_SYNC_STATUSES = {
  NOT_CONNECTED: 'not_connected',
  SYNCED: 'synced',
  PENDING: 'pending',
  FAILED: 'failed',
  DEMO_ONLY: 'demo_only',
}

/**
 * Creates an empty venue menu item contract with safe defaults.
 */
export function createVenueMenuItem(overrides = {}) {
  return {
    venueId: null,
    menuId: null,
    menuSource: null,
    menuItemId: null,
    name: null,
    description: null,
    categories: [],
    price: null,
    availability: 'unknown',
    pairingTags: [],
    cigarPairingTags: [],
    drinkPairingTags: [],
    foodPairingTags: [],
    staffRequired: false,
    customerOrderAllowed: false,
    posItemId: null,
    eatItemId: null,
    lastSyncedAt: null,
    syncStatus: MENU_SYNC_STATUSES.NOT_CONNECTED,
    ...overrides,
  }
}

/**
 * Creates an empty venue menu contract.
 */
export function createVenueMenuContract(overrides = {}) {
  return {
    venueId: null,
    menuId: null,
    menuSource: 'unknown',
    menuItems: [],
    lastSyncedAt: null,
    syncStatus: MENU_SYNC_STATUSES.NOT_CONNECTED,
    pos360Connected: false,
    eatConnected: false,
    preview_only: true,
    ...overrides,
  }
}

export const MENU_CONTRACT_VERSION = '0.1.0'
