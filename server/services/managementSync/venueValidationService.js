/**
 * SmokeCraft Management Sync — venue existence/status validation.
 * Uses ONLY the authoritative `venues` table (System 1), never
 * novee_os_venues, per SMOKECRAFT_MANAGEMENT_SYNC_VENUE_MODEL_AUDIT.md.
 */
import { query, isDbAvailable } from '../../db/connection.js'

/**
 * @returns {{ ok: boolean, error?: string, venue?: object }}
 */
export async function validateVenue(venueId) {
  if (!venueId || typeof venueId !== 'string' || venueId.length > 200) {
    return { ok: false, error: 'invalid_venue_identifier' }
  }
  if (!isDbAvailable()) {
    return { ok: false, error: 'venue_unavailable' }
  }
  const result = await query(
    `SELECT venue_id, name, status FROM venues WHERE venue_id = $1`,
    [venueId]
  )
  if (result.rows.length === 0) {
    return { ok: false, error: 'venue_not_found' }
  }
  const venue = result.rows[0]
  if (venue.status !== 'active') {
    return { ok: false, error: 'venue_inactive', venue }
  }
  return { ok: true, venue }
}

/**
 * Express middleware: reads venueId from params/body/query (in that
 * priority order), validates it, and attaches req.validatedVenue.
 * Rejects with an honest error if invalid/not found/inactive.
 */
export function requireValidVenue(paramName = 'venueId') {
  return async (req, res, next) => {
    try {
      const venueId = req.params[paramName] || req.body?.venueId || req.query?.venueId
      const result = await validateVenue(venueId)
      if (!result.ok) {
        const status = result.error === 'invalid_venue_identifier' ? 400
          : result.error === 'venue_not_found' ? 404
          : 403
        return res.status(status).json({ success: false, error: result.error })
      }
      req.validatedVenue = result.venue
      return next()
    } catch (err) {
      return res.status(500).json({ success: false, error: 'internal_error' })
    }
  }
}
