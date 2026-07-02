/**
 * Venue Feature Settings Contract — Ticket Tapper Partner Specials
 *
 * Partner food specials are opt-in per venue.
 * Default: disabled.
 * 30-day trial window on first enable.
 * Honest status labels only.
 */

export const FEATURE_STATUSES = {
  DISABLED: 'disabled',
  TRIAL_ACTIVE: 'trial_active',
  CANCELLATION_PENDING: 'cancellation_pending',
  ACTIVE_RENEWING: 'active_renewing',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
}

const TRIAL_DAYS = 30

/**
 * Compute the current status of a venue feature settings record.
 * Handles trial expiry, cancellation windows, and active/cancelled states.
 */
export function resolveFeatureStatus(settings) {
  if (!settings || !settings.ticket_tapper_partner_specials_enabled) {
    return { ...settings, computedStatus: FEATURE_STATUSES.DISABLED, partnerSpecialsAllowed: false }
  }

  if (settings.cancelled_at) {
    return { ...settings, computedStatus: FEATURE_STATUSES.CANCELLED, partnerSpecialsAllowed: false }
  }

  const now = new Date()
  const trialExpires = settings.trial_expires_at ? new Date(settings.trial_expires_at) : null

  if (trialExpires && now < trialExpires) {
    const msLeft = trialExpires - now
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
    const computedStatus = settings.cancellation_requested_at
      ? FEATURE_STATUSES.CANCELLATION_PENDING
      : FEATURE_STATUSES.TRIAL_ACTIVE
    return {
      ...settings,
      computedStatus,
      partnerSpecialsAllowed: true,
      trialDaysRemaining: daysLeft,
    }
  }

  if (trialExpires && now >= trialExpires) {
    if (settings.cancellation_requested_at) {
      return { ...settings, computedStatus: FEATURE_STATUSES.CANCELLED, partnerSpecialsAllowed: false }
    }
    return { ...settings, computedStatus: FEATURE_STATUSES.ACTIVE_RENEWING, partnerSpecialsAllowed: true, trialDaysRemaining: 0 }
  }

  return { ...settings, computedStatus: FEATURE_STATUSES.ACTIVE_RENEWING, partnerSpecialsAllowed: true }
}

/**
 * Build a new feature settings record when a venue enables partner specials.
 */
export function buildEnablePayload({ venueId, enabledBy }) {
  const now = new Date()
  const trialExpires = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
  return {
    venue_id: venueId,
    ticket_tapper_partner_specials_enabled: true,
    enabled_at: now.toISOString(),
    trial_expires_at: trialExpires.toISOString(),
    auto_renew_enabled: true,
    cancellation_requested_at: null,
    cancelled_at: null,
    status: FEATURE_STATUSES.TRIAL_ACTIVE,
    enabled_by: enabledBy ?? null,
  }
}

/**
 * Default disabled settings for venues with no record.
 */
export function defaultFeatureSettings(venueId) {
  return {
    venue_id: venueId,
    ticket_tapper_partner_specials_enabled: false,
    enabled_at: null,
    trial_expires_at: null,
    auto_renew_enabled: true,
    cancellation_requested_at: null,
    cancelled_at: null,
    status: FEATURE_STATUSES.DISABLED,
    computedStatus: FEATURE_STATUSES.DISABLED,
    partnerSpecialsAllowed: false,
  }
}

/**
 * Filter a specials list to remove partner specials when venue hasn't opted in.
 */
export function filterSpecialsByVenueFeature(specials, featureSettings) {
  const resolved = featureSettings ? resolveFeatureStatus(featureSettings) : null
  const partnerAllowed = resolved?.partnerSpecialsAllowed === true
  return specials.filter(s => {
    if (s.isPartnerSpecial || s.source === 'partner_network') return partnerAllowed
    return true
  })
}
