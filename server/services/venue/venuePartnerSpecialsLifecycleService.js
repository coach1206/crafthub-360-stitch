/**
 * Venue Partner Specials Lifecycle Service
 * Manages 30-day trial, activation, cancellation, and expiry of partner specials.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { getVenuePartnerSpecialsSettings, updateVenuePartnerSpecialsSettings } from './venueSettingsService.js'

const TRIAL_DURATION_DAYS = 30

function trialExpiresAt(startDate = new Date()) {
  const d = new Date(startDate)
  d.setDate(d.getDate() + TRIAL_DURATION_DAYS)
  return d.toISOString()
}

export async function enablePartnerSpecialsTrial(venueId, actorId = 'system') {
  const existing = (await getVenuePartnerSpecialsSettings(venueId)).data

  if (existing.status === 'partner_specials_trial_active') {
    return { ok: false, status: existing.status, message: 'Trial already active.' }
  }
  if (existing.status === 'partner_specials_active') {
    return { ok: false, status: existing.status, message: 'Partner specials already active.' }
  }

  const now = new Date().toISOString()
  const expires = trialExpiresAt()

  const patch = {
    partner_specials_enabled: true,
    status: 'partner_specials_trial_active',
    trial_started_at: now,
    trial_expires_at: expires,
    enabled_at: now,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO venue_partner_specials_settings
           (venue_id, partner_specials_enabled, status, trial_started_at, trial_expires_at, enabled_at)
         VALUES ($1, TRUE, 'partner_specials_trial_active', $2, $3, $2)
         ON CONFLICT (venue_id) DO UPDATE SET
           partner_specials_enabled=TRUE, status='partner_specials_trial_active',
           trial_started_at=$2, trial_expires_at=$3, enabled_at=$2, updated_at=NOW()`,
        [venueId, now, expires]
      )
      return { ok: true, venueId, status: 'partner_specials_trial_active', trialStartedAt: now, trialExpiresAt: expires, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const result = await updateVenuePartnerSpecialsSettings(venueId, patch)
  return {
    ok: true,
    venueId,
    status: 'partner_specials_trial_active',
    trialStartedAt: now,
    trialExpiresAt: expires,
    storageMode: result.storageMode,
    persistenceStatus: 'preview_fallback',
    message: 'Trial started. Not persisted — database unavailable.',
  }
}

export async function requestPartnerSpecialsCancellation(venueId, actorId = 'system') {
  const existing = (await getVenuePartnerSpecialsSettings(venueId)).data

  const cancellableStatuses = ['partner_specials_trial_active', 'partner_specials_active']
  if (!cancellableStatuses.includes(existing.status)) {
    return { ok: false, status: existing.status, message: `Cannot cancel from status: ${existing.status}` }
  }

  const now = new Date().toISOString()
  const patch = { status: 'cancellation_pending', cancellation_requested_at: now }

  if (isDbAvailable()) {
    try {
      await query(
        `UPDATE venue_partner_specials_settings
         SET status='cancellation_pending', cancellation_requested_at=$2, updated_at=NOW()
         WHERE venue_id=$1`,
        [venueId, now]
      )
      return { ok: true, venueId, status: 'cancellation_pending', cancellationRequestedAt: now, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const result = await updateVenuePartnerSpecialsSettings(venueId, patch)
  return { ok: true, venueId, status: 'cancellation_pending', cancellationRequestedAt: now, storageMode: result.storageMode }
}

export async function cancelPartnerSpecials(venueId, actorId = 'system') {
  const existing = (await getVenuePartnerSpecialsSettings(venueId)).data

  const cancellableStatuses = ['partner_specials_trial_active', 'partner_specials_active', 'cancellation_pending']
  if (!cancellableStatuses.includes(existing.status)) {
    return { ok: false, status: existing.status, message: `Cannot cancel from status: ${existing.status}` }
  }

  const now = new Date().toISOString()
  const patch = {
    partner_specials_enabled: false,
    status: 'cancelled',
    cancelled_at: now,
    cancellation_requested_at: existing.cancellation_requested_at ?? now,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `UPDATE venue_partner_specials_settings
         SET partner_specials_enabled=FALSE, status='cancelled', cancelled_at=$2, updated_at=NOW()
         WHERE venue_id=$1`,
        [venueId, now]
      )
      return { ok: true, venueId, status: 'cancelled', cancelledAt: now, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const result = await updateVenuePartnerSpecialsSettings(venueId, patch)
  return { ok: true, venueId, status: 'cancelled', cancelledAt: now, storageMode: result.storageMode }
}

export async function expirePartnerSpecialsTrial(venueId) {
  const existing = (await getVenuePartnerSpecialsSettings(venueId)).data

  if (existing.status !== 'partner_specials_trial_active') {
    return { ok: false, status: existing.status, message: 'No active trial to expire.' }
  }

  const now = new Date().toISOString()
  const patch = { partner_specials_enabled: false, status: 'expired' }

  if (isDbAvailable()) {
    try {
      await query(
        `UPDATE venue_partner_specials_settings
         SET partner_specials_enabled=FALSE, status='expired', updated_at=NOW()
         WHERE venue_id=$1`,
        [venueId]
      )
      return { ok: true, venueId, status: 'expired', expiredAt: now, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const result = await updateVenuePartnerSpecialsSettings(venueId, patch)
  return { ok: true, venueId, status: 'expired', expiredAt: now, storageMode: result.storageMode }
}

export async function activatePartnerSpecialsRenewing(venueId, actorId = 'system') {
  const existing = (await getVenuePartnerSpecialsSettings(venueId)).data

  const activatableStatuses = ['partner_specials_trial_active', 'cancellation_pending']
  if (!activatableStatuses.includes(existing.status)) {
    return { ok: false, status: existing.status, message: `Cannot activate from status: ${existing.status}` }
  }

  const now = new Date().toISOString()
  const patch = {
    partner_specials_enabled: true,
    status: 'partner_specials_active',
    auto_renew_enabled: true,
    cancellation_requested_at: null,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `UPDATE venue_partner_specials_settings
         SET partner_specials_enabled=TRUE, status='partner_specials_active',
             auto_renew_enabled=TRUE, cancellation_requested_at=NULL, updated_at=NOW()
         WHERE venue_id=$1`,
        [venueId]
      )
      return { ok: true, venueId, status: 'partner_specials_active', activatedAt: now, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const result = await updateVenuePartnerSpecialsSettings(venueId, patch)
  return { ok: true, venueId, status: 'partner_specials_active', activatedAt: now, storageMode: result.storageMode }
}

export async function canVenueDisplayPartnerSpecials(venueId) {
  const settings = (await getVenuePartnerSpecialsSettings(venueId)).data
  const activeStatuses = ['partner_specials_trial_active', 'partner_specials_active', 'cancellation_pending']
  const canDisplay = activeStatuses.includes(settings.status)
  return {
    venueId,
    canDisplay,
    partnerSpecialsStatus: settings.status,
    reason: canDisplay ? 'partner_specials_active_or_trial' : 'partner_specials_not_enabled',
  }
}

export async function canVenueAcceptPartnerVendorOrders(venueId) {
  const settings = (await getVenuePartnerSpecialsSettings(venueId)).data
  const acceptingStatuses = ['partner_specials_trial_active', 'partner_specials_active']
  const canAccept = acceptingStatuses.includes(settings.status) && settings.partner_specials_enabled
  return {
    venueId,
    canAcceptPartnerOrders: canAccept,
    partnerSpecialsStatus: settings.status,
    partnerSpecialsEnabled: settings.partner_specials_enabled,
    reason: canAccept ? 'partner_specials_accepting_orders' : 'partner_specials_not_enabled_or_expired',
  }
}
