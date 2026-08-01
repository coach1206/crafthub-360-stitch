/**
 * Venue Humidor 1A — backend foundation routes.
 * Mounted at /api/smokecraft/venue-humidor in server/index.js.
 * Reuses the existing requireAuth/requireRole middleware and the
 * venues/venue_memberships tables (migration 010) for venue identity —
 * no new identity or authorization primitive invented.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/authMiddleware.js'
import { getDb } from '../db/connection.js'
import * as ctrl from '../controllers/venueHumidorController.js'
import * as checkoutCtrl from '../controllers/venueHumidorCheckoutController.js'
import * as adminCtrl from '../controllers/venueHumidorAdminController.js'
import * as fulfillmentCtrl from '../controllers/venueHumidorFulfillmentController.js'
import * as assistedSellingCtrl from '../controllers/venueHumidorAssistedSellingController.js'
import * as mediaCtrl from '../controllers/venueHumidorMediaController.js'
import * as paymentCtrl from '../controllers/venueHumidorPaymentController.js'

const router = Router()

const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, skip: () => !IS_PROD })

// A client-supplied venueId is never trusted on its own: a platform
// admin bypasses the membership check; every other authenticated user
// must have a real, active venue_memberships row (staff/manager/admin/
// owner) for the EXACT venue in the route path.
async function requireVenueStaff(req, res, next) {
  try {
    if (req.user?.role === 'admin' || req.user?.role === 'founder_level_0') return next()
    const db = getDb()
    const { rows } = await db.query(
      `SELECT membership_type FROM venue_memberships WHERE user_id = $1 AND venue_id = $2 AND status = 'active'`,
      [req.user?.id, req.params.venueId]
    )
    const membership = rows[0]
    if (!membership || !['staff', 'manager', 'admin', 'owner'].includes(membership.membership_type)) {
      return res.status(403).json({ success: false, error: 'venue_staff_required' })
    }
    next()
  } catch (err) { res.status(500).json({ success: false, error: 'internal_error' }) }
}

// Defense-in-depth: even once requireVenueStaff confirms the caller
// belongs to :venueId, the RESOURCE itself (product/hold/reservation/
// order) must actually belong to that same venue — a staff member of
// venue A must never be able to act on venue B's product by pairing
// A's real venueId with B's real productId in the URL.
function requireResourceVenueMatch(table, idColumn, paramName) {
  return async (req, res, next) => {
    try {
      const db = getDb()
      const { rows } = await db.query(`SELECT venue_id FROM ${table} WHERE ${idColumn} = $1`, [req.params[paramName]])
      if (!rows[0] || rows[0].venue_id !== req.params.venueId) {
        return res.status(404).json({ success: false, error: 'not_found' })
      }
      next()
    } catch (err) { res.status(500).json({ success: false, error: 'internal_error' }) }
  }
}

// 1B-2B-1 RBAC tiers. venue_memberships.membership_type is the real,
// existing enum (member/staff/mentor/manager/admin/owner, migration
// 010) — no parallel role table invented. Mapped onto the mandate's
// named roles: owner/general-manager -> owner/admin/manager (full
// access); inventory manager -> staff (products + inventory
// mutations); tobacconist -> mentor (read-only + staff-notes only,
// enforced in handleUpdateAdminProduct); bartender/server/cashier/
// analyst have no dedicated membership_type in this schema. 'member'
// represents a venue's customer/club membership, not a staff role, so
// it is intentionally excluded from read access (customer/non-member
// denied per mandate); no membership row at all is denied.
const FULL_ACCESS_TYPES = ['owner', 'admin', 'manager']
const WRITE_ACCESS_TYPES = [...FULL_ACCESS_TYPES, 'staff']
const READ_ACCESS_TYPES = [...WRITE_ACCESS_TYPES, 'mentor']

function requireVenueRole(allowedTypes) {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'admin' || req.user?.role === 'founder_level_0') { req.venueMembershipType = 'owner'; return next() }
      const db = getDb()
      const { rows } = await db.query(
        `SELECT membership_type FROM venue_memberships WHERE user_id = $1 AND venue_id = $2 AND status = 'active'`,
        [req.user?.id, req.params.venueId]
      )
      const membership = rows[0]
      if (!membership || !allowedTypes.includes(membership.membership_type)) {
        return res.status(403).json({ success: false, error: 'venue_role_required' })
      }
      req.venueMembershipType = membership.membership_type
      next()
    } catch (err) { res.status(500).json({ success: false, error: 'internal_error' }) }
  }
}

const requireVenueRead = requireVenueRole(READ_ACCESS_TYPES)
const requireVenueWrite = requireVenueRole(WRITE_ACCESS_TYPES)

const productVenueMatch = requireResourceVenueMatch('venue_cigar_products', 'product_id', 'productId')
const holdVenueMatch = requireResourceVenueMatch('venue_cigar_inventory_holds', 'hold_id', 'holdId')
const reservationVenueMatch = requireResourceVenueMatch('venue_cigar_reservations', 'reservation_id', 'reservationId')
const orderVenueMatch = requireResourceVenueMatch('venue_cigar_orders', 'order_id', 'orderId')

// ── Products ─────────────────────────────────────────────────────────
router.post('/venues/:venueId/products', writeLimiter, requireAuth, requireVenueStaff, ctrl.handleCreateProduct)
router.get('/venues/:venueId/products', readLimiter, requireAuth, requireVenueStaff, ctrl.handleListProducts)
router.get('/venues/:venueId/products/:productId', readLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleGetProduct)
router.get('/venues/:venueId/products/:productId/availability', readLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleGetAvailability)

// ── Inventory events ─────────────────────────────────────────────────
router.post('/venues/:venueId/products/:productId/inventory-events', writeLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleApplyInventoryEvent)

// ── Holds ────────────────────────────────────────────────────────────
router.post('/venues/:venueId/products/:productId/holds', writeLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleCreateHold)
router.post('/venues/:venueId/holds/:holdId/release', writeLimiter, requireAuth, requireVenueStaff, holdVenueMatch, ctrl.handleReleaseHold)
router.post('/venues/:venueId/holds/:holdId/expire', writeLimiter, requireAuth, requireVenueStaff, holdVenueMatch, ctrl.handleExpireHold)

// ── Reservations (staff-created) ─────────────────────────────────────
router.post('/venues/:venueId/products/:productId/reservations', writeLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleCreateReservation)
router.post('/venues/:venueId/reservations/:reservationId/cancel', writeLimiter, requireAuth, requireVenueStaff, reservationVenueMatch, ctrl.handleCancelReservation)
router.post('/venues/:venueId/reservations/:reservationId/fulfill', writeLimiter, requireAuth, requireVenueStaff, reservationVenueMatch, ctrl.handleFulfillReservation)

// ── Orders ───────────────────────────────────────────────────────────
router.post('/venues/:venueId/orders', writeLimiter, requireAuth, requireVenueStaff, ctrl.handleCreateOrder)
router.post('/venues/:venueId/orders/:orderId/items', writeLimiter, requireAuth, requireVenueStaff, orderVenueMatch, ctrl.handleAddOrderItem)
// Holistic 1B-2A: completion/cancellation now route through
// checkoutService.js (a strict superset of the 1A orderService logic
// that also correctly handles hold-linked checkout orders) — one
// completion/cancellation code path for every venue_cigar_orders row,
// never two divergent ones.
router.post('/venues/:venueId/orders/:orderId/complete', writeLimiter, requireAuth, requireVenueStaff, orderVenueMatch, checkoutCtrl.handleStaffCompleteOrder)
router.post('/venues/:venueId/orders/:orderId/cancel', writeLimiter, requireAuth, requireVenueStaff, orderVenueMatch, checkoutCtrl.handleStaffCancelOrder)

// ── 1B-2B-1: Staff inventory administration ─────────────────────────
router.get('/venues/:venueId/admin/products', readLimiter, requireAuth, requireVenueRead, adminCtrl.handleListAdminProducts)
router.get('/venues/:venueId/admin/products/:productId', readLimiter, requireAuth, requireVenueRead, productVenueMatch, adminCtrl.handleGetAdminProduct)
router.post('/venues/:venueId/admin/products', writeLimiter, requireAuth, requireVenueWrite, adminCtrl.handleCreateAdminProduct)
router.patch('/venues/:venueId/admin/products/:productId', writeLimiter, requireAuth, requireVenueRead, productVenueMatch, adminCtrl.handleUpdateAdminProduct)
router.patch('/venues/:venueId/admin/products/:productId/classification', writeLimiter, requireAuth, requireVenueWrite, productVenueMatch, adminCtrl.handleUpdateClassification)
router.post('/venues/:venueId/admin/products/:productId/inventory-mutations', writeLimiter, requireAuth, requireVenueWrite, productVenueMatch, adminCtrl.handleInventoryMutation)
router.get('/venues/:venueId/admin/inventory-events', readLimiter, requireAuth, requireVenueRead, adminCtrl.handleListInventoryEvents)

// ── 1B-2B-2: Staff order and fulfillment queue ──────────────────────
// Same requireVenueRole tiers as 1B-2B-1 — read tier (owner/admin/
// manager/staff/mentor) may view the queue and history; write tier
// (owner/admin/manager/staff) may claim/transition/complete/cancel;
// only full-access (owner/admin/manager) may reassign a claimed order
// to a different staff member. Mentor never reaches any mutation
// route — read-only, matching the mandate's "must not complete,
// cancel, reassign, or mutate fulfillment status" requirement.
const fulfillmentOrderVenueMatch = requireResourceVenueMatch('venue_cigar_orders', 'order_id', 'orderId')

router.get('/venues/:venueId/admin/orders', readLimiter, requireAuth, requireVenueRead, fulfillmentCtrl.handleListQueue)
router.get('/venues/:venueId/admin/orders/history', readLimiter, requireAuth, requireVenueRead, fulfillmentCtrl.handleListHistory)
router.get('/venues/:venueId/admin/orders/:orderId', readLimiter, requireAuth, requireVenueRead, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleGetOrderDetail)
router.post('/venues/:venueId/admin/orders/:orderId/claim', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleClaimOrder)
router.post('/venues/:venueId/admin/orders/:orderId/assign', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), fulfillmentOrderVenueMatch, fulfillmentCtrl.handleAssignOrder)
router.post('/venues/:venueId/admin/orders/:orderId/confirm', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleConfirmOrder)
router.post('/venues/:venueId/admin/orders/:orderId/prepare', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleStartPreparation)
router.post('/venues/:venueId/admin/orders/:orderId/items/:orderItemId/pick', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleMarkItemPicked)
router.post('/venues/:venueId/admin/orders/:orderId/ready', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleMarkReady)
router.post('/venues/:venueId/admin/orders/:orderId/block', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleBlockOrder)
// Unblock requires full access (owner/admin/manager) per mandate —
// staff may block but not resolve/unblock.
router.post('/venues/:venueId/admin/orders/:orderId/unblock', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), fulfillmentOrderVenueMatch, fulfillmentCtrl.handleUnblockOrder)
router.post('/venues/:venueId/admin/orders/:orderId/notes', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleAddNote)
router.post('/venues/:venueId/admin/orders/:orderId/complete', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleCompleteOrder)
router.post('/venues/:venueId/admin/orders/:orderId/cancel', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleCancelOrder)

// ── 1B-2B-3: pickup verification, handoff, no-show, expiration ───────
router.post('/venues/:venueId/admin/orders/:orderId/verification-code', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleGenerateVerificationCode)
router.post('/venues/:venueId/admin/orders/:orderId/verify', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleVerifyCode)
router.post('/venues/:venueId/admin/orders/:orderId/handoff', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleConfirmHandoff)
router.post('/venues/:venueId/admin/orders/:orderId/no-show', writeLimiter, requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl.handleMarkNoShow)
// Pickup-window extension and expiration require full access
// (owner/admin/manager) per mandate.
router.post('/venues/:venueId/admin/orders/:orderId/extend-pickup-window', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), fulfillmentOrderVenueMatch, fulfillmentCtrl.handleExtendPickupWindow)
router.post('/venues/:venueId/admin/orders/:orderId/expire', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), fulfillmentOrderVenueMatch, fulfillmentCtrl.handleExpireOrder)

// ── 1B-2B-5: assisted selling / staff & tobacconist recommendations ──
// Read tier (owner/admin/manager/staff/mentor) may view inventory-aware
// recommendations and alternatives — mentor (tobacconist) is
// read-only here, same as every other Venue Humidor admin surface.
// Only write tier (owner/admin/manager/staff) may record an
// accepted/declined/modified assisted-selling outcome; mentor never
// reaches this route.
router.post('/venues/:venueId/admin/assisted-selling/recommendations', readLimiter, requireAuth, requireVenueRead, assistedSellingCtrl.handleAssistedRecommendations)
router.get('/venues/:venueId/admin/assisted-selling/alternatives/:productId', readLimiter, requireAuth, requireVenueRead, assistedSellingCtrl.handleAssistedAlternatives)
router.post('/venues/:venueId/admin/assisted-selling/outcome', writeLimiter, requireAuth, requireVenueWrite, assistedSellingCtrl.handleRecordOutcome)

// ── Media and Product Image Management — Production Package 1 of 7 ──
// Write tier (owner/admin/manager/staff) may upload/import/assign/
// reorder/edit own-venue media; mentor is read-only (never reaches a
// write route below). Approve/reject/activate/retire/master-catalog
// publishing require full access (owner/admin/manager) per mandate —
// staff may not self-approve their own uploads.
router.post('/venues/:venueId/media/upload-authorization', writeLimiter, requireAuth, requireVenueWrite, mediaCtrl.handleUploadAsset)
router.get('/venues/:venueId/media', readLimiter, requireAuth, requireVenueRead, mediaCtrl.handleListVenueMedia)
router.get('/venues/:venueId/media/products/:productId/gallery', readLimiter, requireAuth, requireVenueRead, productVenueMatch, mediaCtrl.handleListProductGallery)
router.post('/venues/:venueId/media/:assetId/assign', writeLimiter, requireAuth, requireVenueWrite, mediaCtrl.handleAssignToProduct)
router.patch('/venues/:venueId/media/:assetId/metadata', writeLimiter, requireAuth, requireVenueWrite, mediaCtrl.handleEditMetadata)
router.post('/venues/:venueId/media/products/:productId/set-primary', writeLimiter, requireAuth, requireVenueWrite, productVenueMatch, mediaCtrl.handleSetPrimary)
router.post('/venues/:venueId/media/products/:productId/reorder', writeLimiter, requireAuth, requireVenueWrite, productVenueMatch, mediaCtrl.handleReorderGallery)
router.post('/venues/:venueId/media/:assetId/approve', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), mediaCtrl.handleApprove)
router.post('/venues/:venueId/media/:assetId/reject', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), mediaCtrl.handleReject)
router.post('/venues/:venueId/media/:assetId/activate', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), mediaCtrl.handleActivate)
router.post('/venues/:venueId/media/:assetId/retire', writeLimiter, requireAuth, requireVenueWrite, mediaCtrl.handleRetire)
router.post('/venues/:venueId/media/products/:productId/import-url', writeLimiter, requireAuth, requireVenueWrite, productVenueMatch, mediaCtrl.handleImportUrl)
router.post('/venues/:venueId/media/csv/dry-run', writeLimiter, requireAuth, requireVenueWrite, mediaCtrl.handleCsvDryRun)
router.post('/venues/:venueId/media/csv/import', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), mediaCtrl.handleCsvImport)
router.get('/venues/:venueId/media/missing-image-report', readLimiter, requireAuth, requireVenueRead, mediaCtrl.handleMissingImageReport)
router.get('/venues/:venueId/media/master-catalog', readLimiter, requireAuth, requireVenueRead, mediaCtrl.handleListMasterCatalog)
router.post('/venues/:venueId/media/products/:productId/assign-master', writeLimiter, requireAuth, requireVenueWrite, productVenueMatch, mediaCtrl.handleAssignMaster)
router.get('/venues/:venueId/media/asset/:assetId/file', readLimiter, requireAuth, requireVenueRead, mediaCtrl.handleGetAssetFile)

// ── Real Payment Gateway Integration (Production Package 2 of 7) —
// staff/admin payment views, refunds, webhook-event audit trail,
// dispute records, and manual reconciliation. Reuses the same
// venue-staff RBAC tiers already established above — no parallel
// authorization scheme. requireVenueRole(FULL_ACCESS_TYPES) on
// refund/reconciliation: real-money reversal and state-repair actions
// require manager/owner/admin, never plain 'staff'.
router.get('/venues/:venueId/admin/payments', readLimiter, requireAuth, requireVenueRead, paymentCtrl.handleAdminListPayments)
router.get('/venues/:venueId/admin/orders/:orderId/payment', readLimiter, requireAuth, requireVenueRead, fulfillmentOrderVenueMatch, paymentCtrl.handleAdminGetOrderPayment)
router.post('/venues/:venueId/admin/orders/:orderId/refund', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), fulfillmentOrderVenueMatch, paymentCtrl.handleAdminRefund)
router.get('/venues/:venueId/admin/payments/webhook-events', readLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), paymentCtrl.handleAdminListWebhookEvents)
router.get('/venues/:venueId/admin/payments/disputes', readLimiter, requireAuth, requireVenueRead, paymentCtrl.handleAdminListDisputes)
router.post('/venues/:venueId/admin/payments/reconcile', writeLimiter, requireAuth, requireVenueRole(FULL_ACCESS_TYPES), paymentCtrl.handleAdminRunReconciliation)

export default router
