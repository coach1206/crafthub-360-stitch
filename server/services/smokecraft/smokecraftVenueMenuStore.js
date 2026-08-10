/**
 * SmokeCraft Venue Menu Store
 * Returns venue menu items for SmokeCraft ordering.
 * When no live POS360/E.A.T. menu source is available, returns a local fallback menu
 * clearly marked as local_fallback with syncStatus: not_connected.
 */

const _menuCache = new Map()

const LOCAL_FALLBACK_MENU = {
  menuId: 'local-fallback-menu',
  menuSource: 'local_fallback',
  syncStatus: 'not_connected',
  pos360Connected: false,
  eatConnected: false,
  productionReady: false,
  lastSyncedAt: null,
  categories: ['cigars', 'drinks', 'pairings'],
  menuItems: [
    {
      menuItemId: 'lf-cigar-01',
      name: 'House Selection Cigar',
      description: 'Venue signature cigar — ask your SmokeCraft mentor for details.',
      categories: ['cigars'],
      price: null,
      availability: 'ask_staff',
      pairingTags: ['medium-bodied', 'smooth'],
      cigarPairingTags: ['medium', 'cedar', 'earth'],
      drinkPairingTags: ['bourbon', 'coffee', 'aged-rum'],
      foodPairingTags: ['dark-chocolate', 'charcuterie'],
      staffRequired: true,
      customerOrderAllowed: false,
      posItemId: null,
      eatItemId: null,
    },
    {
      menuItemId: 'lf-drink-01',
      name: 'Signature Bourbon',
      description: 'House bourbon — pairs with medium to full-bodied cigars.',
      categories: ['drinks'],
      price: null,
      availability: 'ask_staff',
      pairingTags: ['bourbon', 'vanilla', 'oak'],
      cigarPairingTags: ['medium-full', 'full'],
      drinkPairingTags: [],
      foodPairingTags: ['dark-chocolate'],
      staffRequired: true,
      customerOrderAllowed: false,
      posItemId: null,
      eatItemId: null,
    },
  ],
  fallbackNote: 'This menu is local_fallback. Connect POS360 or E.A.T. for live venue menu data.',
}

/**
 * Returns the venue menu for a given venueId.
 * Returns local fallback when no live source is connected.
 */
export function getVenueMenu(venueId) {
  if (_menuCache.has(venueId)) return _menuCache.get(venueId)
  return { ...LOCAL_FALLBACK_MENU, venueId }
}

/**
 * Stores a synced venue menu (called when a live menu source provides data).
 */
export function storeVenueMenu(venueId, menuData) {
  const record = {
    ...menuData,
    venueId,
    lastSyncedAt: new Date().toISOString(),
  }
  _menuCache.set(venueId, record)
  return record
}

export function buildVenueMenuStoreReport() {
  return {
    cachedVenues: _menuCache.size,
    fallbackAvailable: true,
    pos360Connected: false,
    eatConnected: false,
    syncStatus: 'not_connected',
  }
}
