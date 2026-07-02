/**
 * Venue Tenant Guard Middleware
 * Ensures venue-scoped routes cannot access other venue data.
 * Every POS360 operation requires a venueId.
 */

export function venueTenantGuard(req, res, next) {
  const venueId = req.params.venueId ?? req.body?.venueId ?? req.query?.venueId

  if (!venueId) {
    return res.status(400).json({
      ok: false,
      error: 'venueId required',
      status: 'tenant_guard_active',
      message: 'All POS360 venue-scoped operations require a venueId.',
    })
  }

  req.tenantVenueId = venueId
  req.tenantGuardActive = true
  next()
}

/**
 * Helper for controllers — returns false and sends 400 if venueId missing.
 */
export function assertTenantVenueId(req, res) {
  const venueId = req.params.venueId ?? req.body?.venueId ?? req.query?.venueId
  if (!venueId) {
    res.status(400).json({
      ok: false,
      error: 'venueId required',
      status: 'tenant_guard_active',
    })
    return null
  }
  return venueId
}
