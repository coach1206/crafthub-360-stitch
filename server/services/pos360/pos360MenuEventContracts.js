/**
 * POS360 Venue Menu Builder — Event Contracts (Phase B.2)
 *
 * Canonical registry for all menu.* events.
 */

export const MENU_EVENTS = Object.freeze({
  // ── Menu lifecycle ──────────────────────────────────────────────────────────
  MENU_CREATED:                'menu.created',
  MENU_UPDATED:                'menu.updated',
  MENU_ARCHIVED:               'menu.archived',
  MENU_RESTORED:               'menu.restored',
  MENU_DUPLICATED:             'menu.duplicated',
  MENU_SCHEDULED:              'menu.scheduled',
  MENU_ACTIVATED:              'menu.activated',
  MENU_DISABLED:               'menu.disabled',

  // ── Categories ──────────────────────────────────────────────────────────────
  CATEGORY_CREATED:            'menu.category.created',
  CATEGORY_UPDATED:            'menu.category.updated',
  CATEGORY_REORDERED:          'menu.category.reordered',
  CATEGORY_ARCHIVED:           'menu.category.archived',

  // ── Subcategories ───────────────────────────────────────────────────────────
  SUBCATEGORY_CREATED:         'menu.subcategory.created',
  SUBCATEGORY_UPDATED:         'menu.subcategory.updated',
  SUBCATEGORY_REORDERED:       'menu.subcategory.reordered',

  // ── Items ───────────────────────────────────────────────────────────────────
  ITEM_CREATED:                'menu.item.created',
  ITEM_UPDATED:                'menu.item.updated',
  ITEM_REORDERED:              'menu.item.reordered',
  ITEM_ARCHIVED:               'menu.item.archived',
  ITEM_RESTORED:               'menu.item.restored',
  ITEM_OUT_OF_STOCK:           'menu.item.out_of_stock',
  ITEM_BACK_IN_STOCK:          'menu.item.back_in_stock',
  ITEM_PHOTO_ADDED:            'menu.item.photo.added',
  ITEM_PHOTO_REMOVED:          'menu.item.photo.removed',

  // ── Modifiers ───────────────────────────────────────────────────────────────
  MODIFIER_GROUP_CREATED:      'menu.modifier_group.created',
  MODIFIER_CREATED:            'menu.modifier.created',

  // ── Add-ons / Bundles ───────────────────────────────────────────────────────
  ADDON_CREATED:               'menu.addon.created',
  BUNDLE_CREATED:              'menu.bundle.created',

  // ── Pricing / Tax ───────────────────────────────────────────────────────────
  PRICING_RULE_CREATED:        'menu.pricing_rule.created',
  TAX_RULE_CREATED:            'menu.tax_rule.created',

  // ── Routing ─────────────────────────────────────────────────────────────────
  ROUTING_STATION_CREATED:     'menu.routing_station.created',
  ITEM_ROUTING_UPDATED:        'menu.item.routing_updated',

  // ── Import / Export ─────────────────────────────────────────────────────────
  IMPORT_STARTED:              'menu.import.started',
  IMPORT_COMPLETED:            'menu.import.completed',
  IMPORT_FAILED:               'menu.import.failed',
  EXPORT_COMPLETED:            'menu.export.completed',

  // ── Sync ────────────────────────────────────────────────────────────────────
  SYNC_COMPLETED:              'menu.sync.completed',
  SYNC_FAILED:                 'menu.sync.failed',
})

export const MENU_STATUSES = Object.freeze({
  DRAFT:      'draft',
  ACTIVE:     'active',
  SCHEDULED:  'scheduled',
  ARCHIVED:   'archived',
  DISABLED:   'disabled',
})

export const ITEM_STATUSES = Object.freeze({
  DRAFT:      'draft',
  ACTIVE:     'active',
  INACTIVE:   'inactive',
  OUT_OF_STOCK: 'out_of_stock',
  LIMITED:    'limited',
  SEASONAL:   'seasonal',
  ARCHIVED:   'archived',
})

export const PRICING_RULE_TYPES = Object.freeze([
  'base_price', 'happy_hour', 'time_based', 'date_based',
  'location_based', 'vip', 'member', 'loyalty', 'promotional',
  'override', 'bundle', 'combo',
])

export const BUNDLE_TYPES = Object.freeze(['combo', 'meal_bundle', 'happy_hour', 'event', 'custom'])

/**
 * Station type registry — venues create their own, these are example defaults.
 * Nothing is hardcoded as required.
 */
export const STATION_TYPE_EXAMPLES = Object.freeze([
  'kitchen', 'bar', 'humidor', 'dessert_station', 'coffee_station',
  'retail', 'merchandise', 'gift_shop', 'prep_station', 'expo',
  'custom',
])
