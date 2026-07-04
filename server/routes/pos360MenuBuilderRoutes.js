/**
 * POS360 Venue Menu Builder Routes — Phase B.2
 * Mounted at /api/pos360/menu
 *
 * All routes: venueTenantGuard.
 * Write routes: canAccessPOS3 (staff+).
 * No open unauthenticated write routes.
 */
import { Router } from 'express'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360MenuBuilderController.js'

const router = Router()

// ── Menus ──────────────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/menus',                    venueTenantGuard, ctrl.listMenus)
router.post(  '/venues/:venueId/menus',                    venueTenantGuard, canAccessPOS3, ctrl.createMenu)
router.get(   '/venues/:venueId/menus/:menuId',            venueTenantGuard, ctrl.getMenu)
router.patch( '/venues/:venueId/menus/:menuId',            venueTenantGuard, canAccessPOS3, ctrl.updateMenu)
router.delete('/venues/:venueId/menus/:menuId',            venueTenantGuard, canAccessPOS3, ctrl.archiveMenu)
router.post(  '/venues/:venueId/menus/:menuId/restore',    venueTenantGuard, canAccessPOS3, ctrl.restoreMenu)
router.post(  '/venues/:venueId/menus/:menuId/duplicate',  venueTenantGuard, canAccessPOS3, ctrl.duplicateMenu)
router.post(  '/venues/:venueId/menus/:menuId/schedule',   venueTenantGuard, canAccessPOS3, ctrl.scheduleMenu)
router.post(  '/venues/:venueId/menus/:menuId/state',      venueTenantGuard, canAccessPOS3, ctrl.setMenuState)
router.post(  '/venues/:venueId/menus/:menuId/export',     venueTenantGuard, canAccessPOS3, ctrl.exportMenu)
router.post(  '/venues/:venueId/menus/import',             venueTenantGuard, canAccessPOS3, ctrl.importMenu)

// ── Categories ────────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/categories',                       venueTenantGuard, ctrl.listCategories)
router.post(  '/venues/:venueId/categories',                       venueTenantGuard, canAccessPOS3, ctrl.createCategory)
router.patch( '/venues/:venueId/categories/:categoryId',           venueTenantGuard, canAccessPOS3, ctrl.updateCategory)
router.delete('/venues/:venueId/categories/:categoryId',           venueTenantGuard, canAccessPOS3, ctrl.archiveCategory)
router.post(  '/venues/:venueId/categories/reorder',               venueTenantGuard, canAccessPOS3, ctrl.reorderCategories)

// ── Subcategories ─────────────────────────────────────────────────────────────
router.get(  '/venues/:venueId/subcategories',                     venueTenantGuard, ctrl.listSubcategories)
router.post( '/venues/:venueId/subcategories',                     venueTenantGuard, canAccessPOS3, ctrl.createSubcategory)
router.patch('/venues/:venueId/subcategories/:subcategoryId',      venueTenantGuard, canAccessPOS3, ctrl.updateSubcategory)
router.post( '/venues/:venueId/subcategories/reorder',             venueTenantGuard, canAccessPOS3, ctrl.reorderSubcategories)

// ── Items ─────────────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/items',                            venueTenantGuard, ctrl.listItems)
router.post(  '/venues/:venueId/items',                            venueTenantGuard, canAccessPOS3, ctrl.createItem)
router.get(   '/venues/:venueId/items/search',                     venueTenantGuard, ctrl.searchItems)
router.get(   '/venues/:venueId/items/:itemId',                    venueTenantGuard, ctrl.getItem)
router.get(   '/venues/:venueId/items/:itemId/detail',             venueTenantGuard, ctrl.getItemDetail)
router.patch( '/venues/:venueId/items/:itemId',                    venueTenantGuard, canAccessPOS3, ctrl.updateItem)
router.delete('/venues/:venueId/items/:itemId',                    venueTenantGuard, canAccessPOS3, ctrl.archiveItem)
router.post(  '/venues/:venueId/items/:itemId/restore',            venueTenantGuard, canAccessPOS3, ctrl.restoreItem)
router.post(  '/venues/:venueId/items/reorder',                    venueTenantGuard, canAccessPOS3, ctrl.reorderItems)
router.post(  '/venues/:venueId/items/:itemId/out-of-stock',       venueTenantGuard, canAccessPOS3, ctrl.setOutOfStock)
router.post(  '/venues/:venueId/items/:itemId/limited',            venueTenantGuard, canAccessPOS3, ctrl.setLimitedAvail)
router.post(  '/venues/:venueId/items/:itemId/photos',             venueTenantGuard, canAccessPOS3, ctrl.addItemPhoto)
router.delete('/venues/:venueId/items/:itemId/photos/:photoId',    venueTenantGuard, canAccessPOS3, ctrl.removeItemPhoto)
router.post(  '/venues/:venueId/items/:itemId/modifier-groups',    venueTenantGuard, canAccessPOS3, ctrl.attachModifierGroup)
router.delete('/venues/:venueId/items/:itemId/modifier-groups/:groupId', venueTenantGuard, canAccessPOS3, ctrl.detachModifierGroup)
router.post(  '/venues/:venueId/items/:itemId/addons',             venueTenantGuard, canAccessPOS3, ctrl.createAddon)
router.patch( '/venues/:venueId/items/:itemId/addons/:addonId',    venueTenantGuard, canAccessPOS3, ctrl.updateAddon)
router.get(   '/venues/:venueId/items/:itemId/addons',             venueTenantGuard, ctrl.listAddons)
router.get(   '/venues/:venueId/items/:itemId/price',              venueTenantGuard, ctrl.resolvePrice)
router.post(  '/venues/:venueId/items/:itemId/price',              venueTenantGuard, ctrl.resolvePrice)
router.get(   '/venues/:venueId/items/:itemId/tax',                venueTenantGuard, ctrl.resolveTax)
router.get(   '/venues/:venueId/items/:itemId/routing',            venueTenantGuard, ctrl.resolveRouting)
router.post(  '/venues/:venueId/items/:itemId/routing',            venueTenantGuard, canAccessPOS3, ctrl.attachRouting)
router.delete('/venues/:venueId/items/:itemId/routing/:routingId', venueTenantGuard, canAccessPOS3, ctrl.removeRouting)
router.get(   '/venues/:venueId/items/:itemId/resolve',            venueTenantGuard, ctrl.resolveItemFull)

// ── Modifier Groups ───────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/modifier-groups',                  venueTenantGuard, ctrl.listModifierGroups)
router.post(  '/venues/:venueId/modifier-groups',                  venueTenantGuard, canAccessPOS3, ctrl.createModifierGroup)
router.patch( '/venues/:venueId/modifier-groups/:groupId',         venueTenantGuard, canAccessPOS3, ctrl.updateModifierGroup)
router.get(   '/venues/:venueId/modifier-groups/:groupId/modifiers', venueTenantGuard, ctrl.listModifiers)
router.post(  '/venues/:venueId/modifier-groups/:groupId/modifiers', venueTenantGuard, canAccessPOS3, ctrl.createModifier)

// ── Bundles ───────────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/bundles',                          venueTenantGuard, ctrl.listBundles)
router.post(  '/venues/:venueId/bundles',                          venueTenantGuard, canAccessPOS3, ctrl.createBundle)
router.patch( '/venues/:venueId/bundles/:bundleId',                venueTenantGuard, canAccessPOS3, ctrl.updateBundle)
router.post(  '/venues/:venueId/bundles/:bundleId/items',          venueTenantGuard, canAccessPOS3, ctrl.addItemToBundle)
router.delete('/venues/:venueId/bundles/:bundleId/items/:itemId',  venueTenantGuard, canAccessPOS3, ctrl.removeItemFromBundle)

// ── Pricing Rules ─────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/pricing-rules',                    venueTenantGuard, ctrl.listPricingRules)
router.post(  '/venues/:venueId/pricing-rules',                    venueTenantGuard, canAccessPOS3, ctrl.createPricingRule)
router.patch( '/venues/:venueId/pricing-rules/:ruleId',            venueTenantGuard, canAccessPOS3, ctrl.updatePricingRule)
router.delete('/venues/:venueId/pricing-rules/:ruleId',            venueTenantGuard, canAccessPOS3, ctrl.archivePricingRule)

// ── Tax Rules ─────────────────────────────────────────────────────────────────
router.get(  '/venues/:venueId/tax-rules',                         venueTenantGuard, ctrl.listTaxRules)
router.post( '/venues/:venueId/tax-rules',                         venueTenantGuard, canAccessPOS3, ctrl.createTaxRule)

// ── Routing Stations ──────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/routing-stations',                 venueTenantGuard, ctrl.listRoutingStations)
router.post(  '/venues/:venueId/routing-stations',                 venueTenantGuard, canAccessPOS3, ctrl.createRoutingStation)
router.patch( '/venues/:venueId/routing-stations/:stationId',      venueTenantGuard, canAccessPOS3, ctrl.updateRoutingStation)

// ── Handheld POS consumption (dynamic — used by Prompt P) ────────────────────
router.get('/venues/:venueId/handheld/active-menu',                venueTenantGuard, ctrl.getActiveMenuHandheld)
router.get('/venues/:venueId/handheld/categories',                 venueTenantGuard, ctrl.getHandheldCategories)
router.get('/venues/:venueId/handheld/categories/:categoryId/items', venueTenantGuard, ctrl.getHandheldItemsByCategory)
router.get('/venues/:venueId/handheld/search',                     venueTenantGuard, ctrl.searchItems)

export default router
