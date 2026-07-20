/**
 * SmokeCraft Management Sync — venue-scoped authorization.
 *
 * requireRole/requirePermission (roleMiddleware.js) only check a global
 * req.user.role string — confirmed by direct read to have NO venue-scope
 * check at all (SMOKECRAFT_MANAGEMENT_SYNC_ROLE_MODEL_AUDIT.md finding
 * #13). This module is the new, explicit venue-membership check that was
 * identified as missing and required.
 */
import { query, isDbAvailable } from '../../db/connection.js'

const MANAGER_TYPES = new Set(['manager', 'admin', 'owner'])

/**
 * @returns {{ ok: boolean, membership?: object, error?: string }}
 */
export async function getActiveVenueMembership(userId, venueId) {
  if (!userId || !venueId || !isDbAvailable()) {
    return { ok: false, error: 'membership_unavailable' }
  }
  const result = await query(
    `SELECT membership_id, membership_type, status
       FROM venue_memberships
      WHERE user_id = $1 AND venue_id = $2 AND status = 'active'`,
    [userId, venueId]
  )
  if (result.rows.length === 0) return { ok: false, error: 'no_active_membership' }
  return { ok: true, membership: result.rows[0] }
}

async function hasVenuePermission(venueId, role, permissionKey) {
  if (!isDbAvailable()) return false
  const result = await query(
    `SELECT 1 FROM venue_permissions
      WHERE venue_id = $1 AND role = $2 AND permission_key = $3 AND enabled = TRUE`,
    [venueId, role, permissionKey]
  )
  return result.rows.length > 0
}

/**
 * Express middleware: requires the authenticated user (never a guest) to
 * have an ACTIVE membership of manager/admin/owner type for the venue
 * already resolved by requireValidVenue (req.validatedVenue).
 * Platform admins (global req.user.role) bypass the venue-membership
 * check per the existing, unmodified platform-admin policy — not a new
 * bypass, reuses the same requireRole hierarchy already in this codebase.
 */
export function requireVenueMembership({ allowPlatformAdmin = true } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.smokecraftIdentity || req.smokecraftIdentity.type !== 'user') {
        return res.status(403).json({ success: false, error: 'venue_management_requires_authenticated_user' })
      }
      if (allowPlatformAdmin && (req.user?.role === 'admin' || req.user?.role === 'founder_level_0')) {
        req.venueMembership = { membership_type: req.user.role, viaPlatformAdmin: true }
        return next()
      }
      if (!req.validatedVenue) {
        return res.status(400).json({ success: false, error: 'venue_not_validated' })
      }
      const result = await getActiveVenueMembership(req.smokecraftIdentity.id, req.validatedVenue.venue_id)
      if (!result.ok || !MANAGER_TYPES.has(result.membership.membership_type)) {
        return res.status(403).json({ success: false, error: 'venue_membership_required' })
      }
      req.venueMembership = result.membership
      return next()
    } catch (err) {
      return res.status(500).json({ success: false, error: 'internal_error' })
    }
  }
}

/**
 * Express middleware factory: requires a specific venue_permissions key
 * for the caller's membership role at the validated venue.
 */
export function requireVenuePermission(permissionKey) {
  return async (req, res, next) => {
    try {
      if (req.venueMembership?.viaPlatformAdmin) return next()
      if (!req.venueMembership || !req.validatedVenue) {
        return res.status(403).json({ success: false, error: 'venue_permission_denied' })
      }
      const allowed = await hasVenuePermission(
        req.validatedVenue.venue_id,
        req.venueMembership.membership_type,
        permissionKey
      )
      if (!allowed) {
        return res.status(403).json({ success: false, error: 'venue_permission_denied', permission: permissionKey })
      }
      return next()
    } catch (err) {
      return res.status(500).json({ success: false, error: 'internal_error' })
    }
  }
}

/**
 * Express middleware: requires the resolved smokecraftIdentity to own
 * the journey referenced by req.params.journeyId. Venue managers do NOT
 * automatically get journey access through this check — ownership is
 * strictly per-guest/per-user, matching the mandate's "guests cannot
 * view another guest's journey" and "user cannot access another user's
 * journey" rules.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function requireJourneyOwnership(getJourneyById) {
  return async (req, res, next) => {
    // Any DB/lookup error here must never crash the process — an
    // unhandled rejection in Express async middleware takes the whole
    // server down, not just the request (found and fixed this package).
    try {
      const journeyId = req.params.journeyId
      if (!journeyId || !UUID_RE.test(journeyId)) {
        return res.status(400).json({ success: false, error: 'invalid_journey_identifier' })
      }
      const journey = await getJourneyById(journeyId)
      if (!journey) {
        return res.status(404).json({ success: false, error: 'journey_not_found' })
      }
      const identity = req.smokecraftIdentity
      const owns = identity?.type === 'user'
        ? journey.user_id === identity.id
        : journey.guest_reference === identity?.id
      if (!owns) {
        return res.status(403).json({ success: false, error: 'journey_access_denied' })
      }
      req.journeyRecord = journey
      return next()
    } catch (err) {
      return res.status(500).json({ success: false, error: 'internal_error' })
    }
  }
}
