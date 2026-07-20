/**
 * SmokeCraft Management Sync — API routes (Package B).
 * Mounted at /api/smokecraft/management-sync in server/index.js.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js'
import {
  attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity,
} from '../middleware/smokecraftGuestIdentity.js'
import { requireValidVenue } from '../services/managementSync/venueValidationService.js'
import { requireVenueMembership, requireJourneyOwnership } from '../services/managementSync/venueAuthorizationService.js'
import { auditAction } from '../middleware/roleMiddleware.js'
import { getJourneyById } from '../services/managementSync/journeyService.js'
import * as ctrl from '../controllers/managementSyncController.js'

const router = Router()

// Every route resolves an identity first: optionalAuth (real users, never
// rejects), then attachSmokeCraftIdentity (guest cookie or user), so a
// guest is never confused with an authenticated user's identity.
router.use(optionalAuth, attachSmokeCraftIdentity)

// Rate limiting for identity issuance and write-heavy endpoints — uses
// the existing express-rate-limit dependency already in package.json
// (used elsewhere in this repo), not a new library.
const guestSessionLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 })
const statusPollLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 })

// ── Guest identity ──────────────────────────────────────────────
router.post('/guest-session', guestSessionLimiter, ensureSmokeCraftGuestIdentity, ctrl.getGuestSession)

// ── Journey ──────────────────────────────────────────────────────
router.post(
  '/venues/:venueId/journeys',
  writeLimiter, requireSmokeCraftIdentity, requireValidVenue('venueId'),
  auditAction('VENUE', 'journey_created', 'post'),
  ctrl.handleCreateJourney
)

router.get(
  '/journeys/:journeyId',
  statusPollLimiter, requireSmokeCraftIdentity,
  requireJourneyOwnership(getJourneyById),
  ctrl.handleGetJourney
)

router.post(
  '/journeys/:journeyId/complete',
  writeLimiter, requireSmokeCraftIdentity,
  requireJourneyOwnership(getJourneyById),
  auditAction('VENUE', 'journey_completed', 'post'),
  ctrl.handleCompleteJourney
)

// ── Snapshot ─────────────────────────────────────────────────────
router.post(
  '/journeys/:journeyId/snapshots',
  writeLimiter, requireSmokeCraftIdentity,
  requireJourneyOwnership(getJourneyById),
  auditAction('VENUE', 'snapshot_created', 'post'),
  ctrl.handleCreateSnapshot
)

router.get(
  '/journeys/:journeyId/snapshots/latest',
  statusPollLimiter, requireSmokeCraftIdentity,
  requireJourneyOwnership(getJourneyById),
  ctrl.handleGetLatestSnapshot
)

// ── Management Sync ────────────────────────────────────────────
router.post(
  '/journeys/:journeyId/sync',
  writeLimiter, requireSmokeCraftIdentity,
  requireJourneyOwnership(getJourneyById),
  auditAction('VENUE', 'sync_requested', 'post'),
  ctrl.handleRequestSync
)

router.get(
  '/journeys/:journeyId/sync/status',
  statusPollLimiter, requireSmokeCraftIdentity,
  requireJourneyOwnership(getJourneyById),
  ctrl.handleGetSyncStatus
)

// ── Management actions (venue-manager scope) ───────────────────
router.post(
  '/venues/:venueId/actions',
  writeLimiter, requireAuth, requireValidVenue('venueId'),
  (req, _res, next) => { req.smokecraftIdentity = req.smokecraftIdentity || { type: 'user', id: req.user.id, role: req.user.role }; next() },
  requireVenueMembership(),
  auditAction('VENUE', 'action_created', 'post'),
  ctrl.handleCreateAction
)

router.get(
  '/venues/:venueId/actions',
  statusPollLimiter, requireAuth, requireValidVenue('venueId'),
  (req, _res, next) => { req.smokecraftIdentity = req.smokecraftIdentity || { type: 'user', id: req.user.id, role: req.user.role }; next() },
  requireVenueMembership(),
  ctrl.handleListActions
)

// ── Venue analytics (venue-manager scope, Package D) ────────────────
router.get(
  '/venues/:venueId/insights',
  statusPollLimiter, requireAuth, requireValidVenue('venueId'),
  (req, _res, next) => { req.smokecraftIdentity = req.smokecraftIdentity || { type: 'user', id: req.user.id, role: req.user.role }; next() },
  requireVenueMembership(),
  auditAction('VENUE', 'analytics_viewed', 'post'),
  ctrl.handleGetVenueAnalytics
)

// ── Integration connection status (venue-manager scope, Package E) ──
// Guest-facing status display was not built this package (disclosed
// limitation — see SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_E_IMPLEMENTATION.md);
// this endpoint is manager-only, same middleware chain as /insights.
// Package 6 closed the disclosed gap: privileged integration-status
// access is now audited (VENUE / integrations_viewed), same pattern as
// /insights and /actions.
router.get(
  '/venues/:venueId/integrations',
  statusPollLimiter, requireAuth, requireValidVenue('venueId'),
  (req, _res, next) => { req.smokecraftIdentity = req.smokecraftIdentity || { type: 'user', id: req.user.id, role: req.user.role }; next() },
  requireVenueMembership(),
  auditAction('VENUE', 'integrations_viewed', 'post'),
  ctrl.handleGetIntegrationStatuses
)

export default router
