/**
 * SmokeCraft Menu Service (module layer)
 * Returns venue menu data for SmokeCraft ordering.
 * Returns not_connected status when POS360 or E.A.T. is not synced.
 */

import { createVenueMenuContract, MENU_SYNC_STATUSES } from '../data/smokecraftMenuContract.js'

/**
 * Returns venue menu for SmokeCraft ordering.
 * Returns empty contract with not_connected status when no live source is available.
 */
export function getVenueMenu(venueId) {
  return createVenueMenuContract({
    venueId,
    syncStatus: MENU_SYNC_STATUSES.NOT_CONNECTED,
    pos360Connected: false,
    eatConnected: false,
  })
}

/**
 * Returns cigar-specific menu items for pairing.
 */
export function getCigarMenuItems(venueId) {
  return {
    venueId,
    cigarItems: [],
    syncStatus: MENU_SYNC_STATUSES.NOT_CONNECTED,
    message: 'Cigar menu items require POS360 or E.A.T. connection.',
    preview_only: true,
  }
}

export function buildMenuServiceReport() {
  return {
    moduleId: 'smokecraft-experience',
    pos360Connected: false,
    eatConnected: false,
    syncStatus: MENU_SYNC_STATUSES.NOT_CONNECTED,
    preview_only: true,
    message: 'Venue menu service is not_connected. POS360 or E.A.T. required for live menu data.',
  }
}
