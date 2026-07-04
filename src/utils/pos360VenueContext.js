/**
 * POS360 Venue Context Resolver (Phase B.3)
 *
 * Resolves { tenantId, venueId, locationId, staffUserId, role, deviceId }
 * for any handheld/POS screen without hardcoding production identities.
 *
 * Priority:
 *  1. Auth context from AuthContext (real JWT session)
 *  2. Kiosk context (venue-provisioned device session)
 *  3. Local development fallback — clearly marked, never used in production
 */

import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

const IS_PROD = import.meta.env.PROD === true

export const LOCAL_DEV_FALLBACK = {
  tenantId:        'local-dev-tenant',
  venueId:         'local-dev-venue',
  locationId:      'local-dev-location',
  staffUserId:     null,
  role:            'staff',
  deviceId:        'local-dev-device',
  isLocalFallback: true,
}

/**
 * Resolves venue context from the auth user object returned by AuthContext.
 */
export function resolveVenueContextFromAuth(authUser) {
  if (!authUser?.authenticated) return null
  return {
    tenantId:        authUser.tenantId    || authUser.tenant_id    || null,
    venueId:         authUser.venueId     || authUser.venue_id     || null,
    locationId:      authUser.locationId  || authUser.location_id  || null,
    staffUserId:     authUser.staffId     || authUser.id           || null,
    role:            authUser.role        || 'staff',
    deviceId:        authUser.deviceId    || null,
    isLocalFallback: false,
  }
}

/**
 * Resolves venue context from a kiosk/device session object.
 */
export function resolveVenueContextFromKiosk(kioskCtx) {
  if (!kioskCtx?.venueId) return null
  return {
    tenantId:        kioskCtx.tenantId    || null,
    venueId:         kioskCtx.venueId,
    locationId:      kioskCtx.locationId  || null,
    staffUserId:     kioskCtx.staffUserId || null,
    role:            kioskCtx.role        || 'staff',
    deviceId:        kioskCtx.deviceId    || null,
    isLocalFallback: false,
  }
}

/**
 * Top-level resolver. Returns the best available context.
 * In production with no resolvable context returns null — callers must handle.
 */
export function resolveVenueContext({ authUser = null, kioskCtx = null } = {}) {
  const fromAuth = resolveVenueContextFromAuth(authUser)
  if (fromAuth?.venueId) return fromAuth

  const fromKiosk = resolveVenueContextFromKiosk(kioskCtx)
  if (fromKiosk?.venueId) return fromKiosk

  if (IS_PROD) return null

  return LOCAL_DEV_FALLBACK
}

/**
 * React hook — resolves venue context using live AuthContext.
 *
 * Usage:
 *   const ctx = usePOS360VenueContext()
 *   if (!ctx) return <NoVenueState />
 *   // ctx.venueId, ctx.tenantId, ctx.role, ctx.staffUserId, ctx.deviceId
 */
export function usePOS360VenueContext() {
  const authCtx  = useContext(AuthContext)
  const authUser = authCtx?.authUser ?? null
  return resolveVenueContext({ authUser })
}

// Alias — some callers import the longer form
export const usePOS360VenueContextHook = usePOS360VenueContext
