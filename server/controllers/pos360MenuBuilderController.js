/**
 * POS360 Venue Menu Builder Controller — Phase B.2
 *
 * All venue-scoped routes enforce venueTenantGuard.
 * Write routes additionally require canAccessPOS3 (staff+).
 */
import * as svc from '../services/pos360/pos360MenuBuilderService.js'

function actor(req) { return { actorId: req.user?.id ?? null, actorRole: req.user?.role ?? null } }
function vid(req)   { return req.tenantVenueId ?? req.params.venueId ?? req.body?.venueId ?? req.query?.venueId }
function ok500(fn)  {
  return async (req, res) => {
    try { const r = await fn(req, res); if (r !== undefined) res.json(r) }
    catch (err) { res.status(500).json({ ok: false, error: err.message }) }
  }
}

// ── Menus ──────────────────────────────────────────────────────────────────────
export const createMenu      = ok500(async req => svc.createMenu({ venueId: vid(req), tenantId: req.body.tenantId, locationId: req.body.locationId, menuName: req.body.menuName, menuDescription: req.body.menuDescription, createdBy: actor(req).actorId, metadata: req.body.metadata, featureFlags: req.body.featureFlags }))
export const updateMenu      = ok500(async req => svc.updateMenu({ menuId: req.params.menuId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const listMenus       = ok500(async req => svc.listMenus({ venueId: vid(req), includeArchived: req.query.includeArchived === 'true' }))
export const getMenu         = ok500(async req => svc.getMenu({ menuId: req.params.menuId, venueId: vid(req) }))
export const archiveMenu     = ok500(async req => svc.archiveMenu({ menuId: req.params.menuId, venueId: vid(req), archivedBy: actor(req).actorId }))
export const restoreMenu     = ok500(async req => svc.restoreMenu({ menuId: req.params.menuId, venueId: vid(req), restoredBy: actor(req).actorId }))
export const duplicateMenu   = ok500(async req => svc.duplicateMenu({ menuId: req.params.menuId, venueId: vid(req), targetVenueId: req.body.targetVenueId, targetLocationId: req.body.targetLocationId, newMenuName: req.body.newMenuName, duplicatedBy: actor(req).actorId }))
export const scheduleMenu    = ok500(async req => svc.scheduleMenu({ menuId: req.params.menuId, venueId: vid(req), ...req.body, scheduledBy: actor(req).actorId }))
export const setMenuState    = ok500(async req => svc.setMenuActiveState({ menuId: req.params.menuId, venueId: vid(req), isActive: req.body.isActive, isActiveHandheld: req.body.isActiveHandheld, updatedBy: actor(req).actorId }))

// ── Categories ────────────────────────────────────────────────────────────────
export const createCategory  = ok500(async req => svc.createCategory({ venueId: vid(req), ...req.body, createdBy: actor(req).actorId }))
export const updateCategory  = ok500(async req => svc.updateCategory({ categoryId: req.params.categoryId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const listCategories  = ok500(async req => svc.listCategories({ venueId: vid(req), menuId: req.query.menuId, includeInactive: req.query.includeInactive === 'true' }))
export const reorderCategories = ok500(async req => svc.reorderCategories({ venueId: vid(req), menuId: req.body.menuId, orderedIds: req.body.orderedIds, updatedBy: actor(req).actorId }))
export const archiveCategory = ok500(async req => svc.archiveCategory({ categoryId: req.params.categoryId, venueId: vid(req), archivedBy: actor(req).actorId }))

// ── Subcategories ─────────────────────────────────────────────────────────────
export const createSubcategory  = ok500(async req => svc.createSubcategory({ venueId: vid(req), ...req.body, createdBy: actor(req).actorId }))
export const updateSubcategory  = ok500(async req => svc.updateSubcategory({ subcategoryId: req.params.subcategoryId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const listSubcategories  = ok500(async req => svc.listSubcategories({ venueId: vid(req), categoryId: req.query.categoryId, menuId: req.query.menuId, includeInactive: req.query.includeInactive === 'true' }))
export const reorderSubcategories = ok500(async req => svc.reorderSubcategories({ venueId: vid(req), categoryId: req.body.categoryId, orderedIds: req.body.orderedIds, updatedBy: actor(req).actorId }))

// ── Items ─────────────────────────────────────────────────────────────────────
export const createItem        = ok500(async req => svc.createItem({ venueId: vid(req), ...req.body, createdBy: actor(req).actorId }))
export const updateItem        = ok500(async req => svc.updateItem({ itemId: req.params.itemId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const listItems         = ok500(async req => svc.listItems({ venueId: vid(req), menuId: req.query.menuId, categoryId: req.query.categoryId, subcategoryId: req.query.subcategoryId, status: req.query.status, includeInactive: req.query.includeInactive === 'true' }))
export const getItem           = ok500(async req => svc.getItem({ itemId: req.params.itemId, venueId: vid(req) }))
export const getItemDetail     = ok500(async req => svc.getItemDetail({ itemId: req.params.itemId, venueId: vid(req) }))
export const reorderItems      = ok500(async req => svc.reorderItems({ venueId: vid(req), categoryId: req.body.categoryId, orderedIds: req.body.orderedIds, updatedBy: actor(req).actorId }))
export const archiveItem       = ok500(async req => svc.archiveItem({ itemId: req.params.itemId, venueId: vid(req), archivedBy: actor(req).actorId }))
export const restoreItem       = ok500(async req => svc.restoreItem({ itemId: req.params.itemId, venueId: vid(req), restoredBy: actor(req).actorId }))
export const setOutOfStock     = ok500(async req => svc.setItemOutOfStock({ itemId: req.params.itemId, venueId: vid(req), outOfStock: req.body.outOfStock, updatedBy: actor(req).actorId }))
export const setLimitedAvail   = ok500(async req => svc.setItemLimitedAvailability({ itemId: req.params.itemId, venueId: vid(req), updatedBy: actor(req).actorId }))
export const addItemPhoto      = ok500(async req => svc.addItemPhoto({ venueId: vid(req), itemId: req.params.itemId, ...req.body, createdBy: actor(req).actorId }))
export const removeItemPhoto   = ok500(async req => svc.removeItemPhoto({ photoId: req.params.photoId, venueId: vid(req), removedBy: actor(req).actorId }))

// ── Modifiers ─────────────────────────────────────────────────────────────────
export const createModifierGroup  = ok500(async req => svc.createModifierGroup({ venueId: vid(req), ...req.body, createdBy: actor(req).actorId }))
export const updateModifierGroup  = ok500(async req => svc.updateModifierGroup({ groupId: req.params.groupId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const listModifierGroups   = ok500(async req => svc.listModifierGroups({ venueId: vid(req), includeInactive: req.query.includeInactive === 'true' }))
export const createModifier       = ok500(async req => svc.createModifier({ venueId: vid(req), groupId: req.params.groupId, ...req.body, createdBy: actor(req).actorId }))
export const listModifiers        = ok500(async req => svc.listModifiers({ venueId: vid(req), groupId: req.params.groupId }))
export const attachModifierGroup  = ok500(async req => svc.attachModifierGroup({ itemId: req.params.itemId, groupId: req.body.groupId, venueId: vid(req), displayOrder: req.body.displayOrder }))
export const detachModifierGroup  = ok500(async req => svc.detachModifierGroup({ itemId: req.params.itemId, groupId: req.params.groupId, venueId: vid(req) }))

// ── Add-ons ───────────────────────────────────────────────────────────────────
export const createAddon   = ok500(async req => svc.createAddon({ venueId: vid(req), itemId: req.params.itemId, ...req.body, createdBy: actor(req).actorId }))
export const updateAddon   = ok500(async req => svc.updateAddon({ addonId: req.params.addonId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const listAddons    = ok500(async req => svc.listAddons({ venueId: vid(req), itemId: req.params.itemId }))

// ── Bundles ───────────────────────────────────────────────────────────────────
export const createBundle        = ok500(async req => svc.createBundle({ venueId: vid(req), ...req.body, createdBy: actor(req).actorId }))
export const updateBundle        = ok500(async req => svc.updateBundle({ bundleId: req.params.bundleId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const listBundles         = ok500(async req => svc.listBundles({ venueId: vid(req), menuId: req.query.menuId }))
export const addItemToBundle     = ok500(async req => svc.addItemToBundle({ bundleId: req.params.bundleId, ...req.body }))
export const removeItemFromBundle = ok500(async req => svc.removeItemFromBundle({ bundleId: req.params.bundleId, itemId: req.params.itemId }))

// ── Pricing ───────────────────────────────────────────────────────────────────
export const createPricingRule  = ok500(async req => svc.createPricingRule({ venueId: vid(req), ...req.body, createdBy: actor(req).actorId }))
export const updatePricingRule  = ok500(async req => svc.updatePricingRule({ ruleId: req.params.ruleId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const listPricingRules   = ok500(async req => svc.listPricingRules({ venueId: vid(req), itemId: req.query.itemId, ruleType: req.query.ruleType }))
export const archivePricingRule = ok500(async req => svc.archivePricingRule({ ruleId: req.params.ruleId, venueId: vid(req), archivedBy: actor(req).actorId }))
export const resolvePrice       = ok500(async req => svc.resolveActivePrice({ itemId: req.params.itemId, venueId: vid(req), ruleContext: req.body?.ruleContext ?? {} }))

// ── Tax ───────────────────────────────────────────────────────────────────────
export const createTaxRule = ok500(async req => svc.createTaxRule({ venueId: vid(req), ...req.body, createdBy: actor(req).actorId }))
export const listTaxRules  = ok500(async req => svc.listTaxRules({ venueId: vid(req), itemId: req.query.itemId }))
export const resolveTax    = ok500(async req => svc.resolveTaxForItem({ itemId: req.params.itemId, venueId: vid(req) }))

// ── Routing ───────────────────────────────────────────────────────────────────
export const createRoutingStation = ok500(async req => svc.createRoutingStation({ venueId: vid(req), ...req.body, createdBy: actor(req).actorId }))
export const updateRoutingStation = ok500(async req => svc.updateRoutingStation({ stationId: req.params.stationId, venueId: vid(req), updates: req.body, updatedBy: actor(req).actorId }))
export const listRoutingStations  = ok500(async req => svc.listRoutingStations({ venueId: vid(req) }))
export const attachRouting        = ok500(async req => svc.attachItemRouting({ venueId: vid(req), itemId: req.params.itemId, ...req.body, createdBy: actor(req).actorId }))
export const removeRouting        = ok500(async req => svc.removeItemRouting({ routingId: req.params.routingId, venueId: vid(req) }))
export const resolveRouting       = ok500(async req => svc.resolveItemRouting({ itemId: req.params.itemId, venueId: vid(req) }))

// ── Import / Export ───────────────────────────────────────────────────────────
export const exportMenu    = ok500(async req => svc.exportMenuJson({ menuId: req.params.menuId, venueId: vid(req), requestedBy: actor(req).actorId }))
export const importMenu    = ok500(async req => svc.importMenuJson({ venueId: vid(req), targetLocationId: req.body.targetLocationId, importData: req.body.importData, importedBy: actor(req).actorId }))

// ── Handheld / POS consumption ────────────────────────────────────────────────
export const getActiveMenuHandheld    = ok500(async req => svc.getActiveMenuForHandheld({ venueId: vid(req), locationId: req.query.locationId }))
export const getHandheldCategories    = ok500(async req => svc.getHandheldCategories({ venueId: vid(req), menuId: req.query.menuId }))
export const getHandheldItemsByCategory = ok500(async req => svc.getHandheldItemsByCategory({ venueId: vid(req), menuId: req.query.menuId, categoryId: req.params.categoryId }))
export const searchItems              = ok500(async req => svc.searchMenuItems({ venueId: vid(req), query: req.query.q, menuId: req.query.menuId }))
export const resolveItemFull          = ok500(async req => svc.resolveItemPriceAndTax({ itemId: req.params.itemId, venueId: vid(req), ruleContext: {} }))
