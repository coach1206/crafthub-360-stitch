/**
 * pos360EventPackageMonetizationRoutes.js — Phase B.10 Prompt W
 * Mounted at /api/pos360/event-packages
 * No fake payment routes. No fake contract signing routes. No fake Stripe/DocuSign/Square routes.
 */

import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360EventPackageMonetizationController.js'

const router = Router()

// ── Package categories ────────────────────────────────────────────────────────
router.post('/categories',                        canAccessPOS3, ctrl.createPackageCategory)
router.get('/categories',                         ctrl.listPackageCategories)
router.patch('/categories/:categoryId',           canAccessPOS3, ctrl.updatePackageCategory)

// ── Packages ──────────────────────────────────────────────────────────────────
router.post('/packages',                          canAccessPOS3, ctrl.createEventPackage)
router.get('/packages',                           ctrl.listEventPackages)
router.get('/packages/:packageId',                ctrl.getEventPackage)
router.patch('/packages/:packageId',              canAccessPOS3, ctrl.updateEventPackage)
router.post('/packages/:packageId/archive',       canAccessPOS3, ctrl.archiveEventPackage)

// ── Package items ─────────────────────────────────────────────────────────────
router.post('/packages/:packageId/items',         canAccessPOS3, ctrl.addPackageItem)
router.get('/packages/:packageId/items',          ctrl.listPackageItems)
router.patch('/items/:packageItemId',             canAccessPOS3, ctrl.updatePackageItem)

// ── Pricing rules ─────────────────────────────────────────────────────────────
router.post('/packages/:packageId/pricing-rules', canAccessPOS3, ctrl.createPricingRule)
router.get('/packages/:packageId/pricing-rules',  ctrl.listPricingRules)
router.post('/packages/:packageId/quote',         ctrl.calculatePackageQuote)

// ── Private event package selections ─────────────────────────────────────────
router.post('/private-events/:privateEventId/selections/:packageId', canAccessPOS3, ctrl.selectPackageForPrivateEvent)
router.get('/private-events/:privateEventId/selections',             ctrl.listPrivateEventPackageSelections)
router.patch('/selections/:packageSelectionId/status',               canAccessPOS3, ctrl.updatePackageSelectionStatus)
router.post('/selections/:packageSelectionId/approve',               canAccessPOS3, ctrl.approvePackageSelection)

// ── Deposits ──────────────────────────────────────────────────────────────────
router.post('/deposit-policies',                                     canAccessPOS3, ctrl.createDepositPolicy)
router.get('/deposit-policies',                                      ctrl.listDepositPolicies)
router.post('/private-events/:privateEventId/deposits',              canAccessPOS3, ctrl.createDepositRecord)
router.patch('/deposits/:depositRecordId/status',                    canAccessPOS3, ctrl.updateDepositStatus)
router.post('/deposits/:depositRecordId/approve-waiver',             canAccessPOS3, ctrl.approveDepositWaiver)
router.post('/deposits/:depositRecordId/approve-refund',             canAccessPOS3, ctrl.approveDepositRefund)

// ── Minimum spend ─────────────────────────────────────────────────────────────
router.post('/private-events/:privateEventId/minimum-spend',                         canAccessPOS3, ctrl.createMinimumSpendRule)
router.get('/private-events/:privateEventId/minimum-spend',                          ctrl.getMinimumSpendProgress)
router.patch('/private-events/:privateEventId/minimum-spend/manual-credit',          canAccessPOS3, ctrl.updateMinimumSpendManualCredit)
router.post('/private-events/:privateEventId/minimum-spend/approve-override',        canAccessPOS3, ctrl.approveMinimumSpendOverride)

// ── Contracts ─────────────────────────────────────────────────────────────────
router.post('/contract-templates',                                   canAccessPOS3, ctrl.createContractTemplate)
router.get('/contract-templates',                                    ctrl.listContractTemplates)
router.post('/private-events/:privateEventId/contract-snapshots',    canAccessPOS3, ctrl.createContractSnapshot)
router.patch('/contract-snapshots/:contractSnapshotId/status',       canAccessPOS3, ctrl.updateContractStatus)

// ── Cancellation policies ─────────────────────────────────────────────────────
router.post('/cancellation-policies',             canAccessPOS3, ctrl.createCancellationPolicy)
router.get('/cancellation-policies',              ctrl.listCancellationPolicies)

// ── Approvals (manager-level operations) ──────────────────────────────────────
router.post('/approvals',                         canAccessPOS3, ctrl.createApprovalRequest)
router.get('/approvals',                          ctrl.listApprovalRequests)
router.post('/approvals/:approvalRequestId/decision', canAccessPOS3, ctrl.decideApprovalRequest)

// ── Inventory forecasting ─────────────────────────────────────────────────────
router.post('/private-events/:privateEventId/inventory-forecasts',   canAccessPOS3, ctrl.createInventoryForecast)
router.get('/private-events/:privateEventId/inventory-forecasts',    ctrl.listInventoryForecasts)
router.post('/inventory-forecasts/:forecastId/reviewed',             canAccessPOS3, ctrl.markForecastReviewed)

// ── POS order links ───────────────────────────────────────────────────────────
router.post('/private-events/:privateEventId/pos-order-links',       canAccessPOS3, ctrl.createPOSOrderLink)
router.get('/private-events/:privateEventId/pos-order-links',        ctrl.listPOSOrderLinks)
router.post('/pos-order-links/:orderLinkId/remove',                  canAccessPOS3, ctrl.removePOSOrderLink)

// ── Monetization insights ─────────────────────────────────────────────────────
router.post('/insights',                          canAccessPOS3, ctrl.createMonetizationInsightPlaceholder)
router.get('/insights',                           ctrl.listMonetizationInsights)
router.get('/private-events/:privateEventId/monetization-summary',   ctrl.getPrivateEventMonetizationSummary)

// ── Offline queue ─────────────────────────────────────────────────────────────
router.post('/offline-queue',                     canAccessPOS3, ctrl.queueOfflineEventPackageAction)
router.get('/offline-queue',                      ctrl.listOfflineEventPackageQueue)
router.post('/offline-queue/:offlineActionId/synced', canAccessPOS3, ctrl.markOfflineEventPackageActionSynced)

export default router
