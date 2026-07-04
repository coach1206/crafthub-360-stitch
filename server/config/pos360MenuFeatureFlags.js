/**
 * POS360 Venue Menu Builder — Feature Flags (Phase B.2)
 *
 * Global defaults. Venues override per-record via feature_flags JSONB.
 */
export const POS360_MENU_FLAGS = {
  'pos360.menu_builder.enabled':                        process.env.POS360_MENU_BUILDER           !== 'false',
  'pos360.menu_builder.drag_drop_enabled':              process.env.POS360_MENU_DRAG_DROP         === 'true',
  'pos360.menu_builder.item_photos_enabled':            process.env.POS360_MENU_PHOTOS             !== 'false',
  'pos360.menu_builder.modifiers_enabled':              process.env.POS360_MENU_MODIFIERS          !== 'false',
  'pos360.menu_builder.addons_enabled':                 process.env.POS360_MENU_ADDONS             !== 'false',
  'pos360.menu_builder.bundles_enabled':                process.env.POS360_MENU_BUNDLES            !== 'false',
  'pos360.menu_builder.dynamic_pricing_enabled':        process.env.POS360_MENU_DYN_PRICING        !== 'false',
  'pos360.menu_builder.tax_rules_enabled':              process.env.POS360_MENU_TAX_RULES          !== 'false',
  'pos360.menu_builder.routing_enabled':                process.env.POS360_MENU_ROUTING            !== 'false',
  'pos360.menu_builder.import_export_enabled':          process.env.POS360_MENU_IMPORT_EXPORT      === 'true',
  'pos360.menu_builder.scheduling_enabled':             process.env.POS360_MENU_SCHEDULING         !== 'false',
  'pos360.menu_builder.multi_location_duplication_enabled': process.env.POS360_MENU_MULTI_LOC     === 'true',
  'pos360.menu_builder.handheld_dynamic_categories_enabled': process.env.POS360_HANDHELD_CATS     !== 'false',
  'pos360.menu_builder.audit_enabled':                  process.env.POS360_MENU_AUDIT              !== 'false',
}

export function getMenuFlags(venueOverrides = {}) {
  return { ...POS360_MENU_FLAGS, ...venueOverrides }
}
