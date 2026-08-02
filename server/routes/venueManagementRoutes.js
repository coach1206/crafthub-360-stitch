/**
 * Package 6B — Venue Management Command Hub: Profile, Branding, Media.
 * Mounted at /api/venue-management in server/index.js.
 * Reuses the exact requireAuth/requireValidVenue/requireVenueMembership/
 * requireVenuePermission/auditAction chain proven in Management Sync
 * (Packages B-E) — no new middleware family invented.
 */
import { Router, json } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireValidVenue } from '../services/managementSync/venueValidationService.js'
import { requireVenueMembership, requireVenuePermission } from '../services/managementSync/venueAuthorizationService.js'
import { auditAction } from '../middleware/roleMiddleware.js'
import { VENUE_MANAGEMENT_PERMISSIONS } from '../services/venueManagement/venueManagementRoles.js'
import * as ctrl from '../controllers/venueManagementController.js'

const router = Router()
const IS_PROD = process.env.NODE_ENV === 'production'

const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, skip: () => !IS_PROD })
const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, skip: () => !IS_PROD })

// Every route: requireAuth (401 if missing) -> requireValidVenue (404/403
// for missing/inactive venue) -> attach smokecraftIdentity-shaped user ->
// requireVenueMembership (403 if no active manager/admin/owner membership,
// with platform-admin bypass) -> optional requireVenuePermission for
// higher-privilege actions -> auditAction -> controller.
const attachIdentity = (req, _res, next) => {
  req.smokecraftIdentity = req.smokecraftIdentity || { type: 'user', id: req.user.id, role: req.user.role }
  req.actorId = req.user.id
  next()
}

const baseChain = [requireAuth, requireValidVenue('venueId'), attachIdentity, requireVenueMembership()]

// ── Profile ──────────────────────────────────────────────────────
router.get('/venues/:venueId/profile', readLimiter, ...baseChain, ctrl.handleGetProfile)

router.post(
  '/venues/:venueId/profile', writeLimiter, ...baseChain,
  auditAction('VENUE', 'profile_created', 'post'), ctrl.handleCreateProfile
)

router.patch(
  '/venues/:venueId/profile', writeLimiter, ...baseChain,
  auditAction('VENUE', 'profile_updated', 'post'), ctrl.handleUpdateProfile
)

router.post(
  '/venues/:venueId/profile/submit', writeLimiter, ...baseChain,
  auditAction('VENUE', 'profile_submitted', 'post'), ctrl.handleSubmitForApproval
)

router.post(
  '/venues/:venueId/profile/approve', writeLimiter, ...baseChain,
  requireVenuePermission(VENUE_MANAGEMENT_PERMISSIONS.CONTENT_APPROVE),
  auditAction('VENUE', 'profile_approved', 'post'), ctrl.handleApprove
)

router.post(
  '/venues/:venueId/profile/reject', writeLimiter, ...baseChain,
  requireVenuePermission(VENUE_MANAGEMENT_PERMISSIONS.CONTENT_APPROVE),
  auditAction('VENUE', 'profile_rejected', 'post'), ctrl.handleReject
)

router.post(
  '/venues/:venueId/profile/publish', writeLimiter, ...baseChain,
  requireVenuePermission(VENUE_MANAGEMENT_PERMISSIONS.CONTENT_PUBLISH),
  auditAction('VENUE', 'profile_published', 'post'), ctrl.handlePublish
)

router.post(
  '/venues/:venueId/profile/unpublish', writeLimiter, ...baseChain,
  requireVenuePermission(VENUE_MANAGEMENT_PERMISSIONS.CONTENT_PUBLISH),
  auditAction('VENUE', 'profile_unpublished', 'post'), ctrl.handleUnpublish
)

router.get('/venues/:venueId/profile/versions', readLimiter, ...baseChain, ctrl.handleGetVersionHistory)

router.post(
  '/venues/:venueId/profile/versions/:versionNumber/restore', writeLimiter, ...baseChain,
  auditAction('VENUE', 'profile_version_restored', 'post'), ctrl.handleRestoreVersion
)

// ── Media ────────────────────────────────────────────────────────
router.get('/venues/:venueId/media', readLimiter, ...baseChain, ctrl.handleListMedia)

// Larger body limit than the app-wide 1MB default (server/index.js), since
// this endpoint carries base64-encoded image data (up to ~5MB raw ~= 6.9MB
// base64). Scoped to this one route only.
router.post(
  '/venues/:venueId/media', json({ limit: '8mb' }), uploadLimiter, ...baseChain,
  auditAction('VENUE', 'media_uploaded', 'post'), ctrl.handleUploadMedia
)

router.get('/venues/:venueId/media/:mediaId', readLimiter, ...baseChain, ctrl.handleGetMedia)
router.get('/venues/:venueId/media/:mediaId/file', readLimiter, ...baseChain, ctrl.handleGetMediaFile)

router.patch(
  '/venues/:venueId/media/:mediaId', writeLimiter, ...baseChain,
  auditAction('VENUE', 'media_metadata_updated', 'post'), ctrl.handleUpdateMediaMetadata
)

router.post(
  '/venues/:venueId/media/:mediaId/archive', writeLimiter, ...baseChain,
  auditAction('VENUE', 'media_archived', 'post'), ctrl.handleArchiveMedia
)

router.post(
  '/venues/:venueId/media/:mediaId/restore', writeLimiter, ...baseChain,
  auditAction('VENUE', 'media_restored', 'post'), ctrl.handleRestoreMedia
)

// ── Branding assignments ────────────────────────────────────────
router.post(
  '/venues/:venueId/branding', writeLimiter, ...baseChain,
  auditAction('VENUE', 'branding_assigned', 'post'), ctrl.handleAssignBranding
)

router.delete(
  '/venues/:venueId/branding/:slot', writeLimiter, ...baseChain,
  auditAction('VENUE', 'branding_removed', 'post'), ctrl.handleRemoveBranding
)

router.post(
  '/venues/:venueId/branding/gallery/reorder', writeLimiter, ...baseChain,
  auditAction('VENUE', 'gallery_reordered', 'post'), ctrl.handleReorderGallery
)

export default router
