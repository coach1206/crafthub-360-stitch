/**
 * Venue Onboarding Engine
 * Creates/reads venue profiles and tracks onboarding checklist completion.
 * Falls back to memory when database unavailable.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const venueProfileStore = new Map()
const venueOnboardingStore = new Map()
const onboardingAuditLogs = []

export async function createVenueProfile(payload) {
  const { venueId, venueName, venueType = 'cigar_lounge', ...rest } = payload
  if (!venueId || !venueName) {
    return { ok: false, status: 'venue_profile_required', message: 'venueId and venueName are required.' }
  }

  const profile = {
    venue_id: venueId,
    venue_name: venueName,
    venue_type: venueType,
    status: 'onboarding_in_progress',
    country: rest.country ?? 'US',
    ...rest,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO venue_profiles (venue_id, venue_name, venue_type, region, market, timezone,
           address_line_1, city, state, postal_code, country, phone, website_url, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (venue_id) DO UPDATE SET venue_name=EXCLUDED.venue_name, updated_at=NOW()
         RETURNING *`,
        [venueId, venueName, venueType, rest.region ?? null, rest.market ?? null,
         rest.timezone ?? null, rest.address ?? null, rest.city ?? null, rest.state ?? null,
         rest.postalCode ?? null, rest.country ?? 'US', rest.phone ?? null,
         rest.websiteUrl ?? null, 'onboarding_in_progress', rest.createdBy ?? 'system']
      )
      return { ok: true, profile: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  venueProfileStore.set(venueId, profile)
  return {
    ok: true,
    profile,
    storageMode: 'memory_fallback',
    persistenceStatus: 'preview_fallback',
    message: 'Venue profile stored in memory. Not persisted — database unavailable.',
  }
}

export async function updateVenueProfile(venueId, payload) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'UPDATE venue_profiles SET venue_name=$1, updated_at=NOW() WHERE venue_id=$2 RETURNING *',
        [payload.venueName ?? payload.venue_name, venueId]
      )
      if (rows[0]) return { ok: true, profile: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const existing = venueProfileStore.get(venueId) ?? { venue_id: venueId }
  const updated = { ...existing, ...payload, venue_id: venueId, updated_at: new Date().toISOString() }
  venueProfileStore.set(venueId, updated)
  return { ok: true, profile: updated, storageMode: 'memory_fallback' }
}

export async function getVenueProfile(venueId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM venue_profiles WHERE venue_id=$1 LIMIT 1', [venueId]
      )
      if (rows[0]) return { ok: true, profile: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const profile = venueProfileStore.get(venueId) ?? null
  return {
    ok: true,
    profile,
    profileStatus: profile ? 'onboarding_in_progress' : 'venue_profile_required',
    storageMode: 'memory_fallback',
  }
}

export async function getVenueOnboardingStatus(venueId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM venue_onboarding_status WHERE venue_id=$1 LIMIT 1', [venueId]
      )
      if (rows[0]) return { ok: true, status: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const stored = venueOnboardingStore.get(venueId)
  return {
    ok: true,
    venueId,
    status: stored ?? defaultOnboardingStatus(venueId),
    storageMode: 'memory_fallback',
  }
}

function defaultOnboardingStatus(venueId) {
  return {
    venue_id: venueId,
    profile_status: 'venue_profile_required',
    pos_status: 'pos_provider_required',
    payment_status: 'payment_onboarding_required',
    tax_status: 'tax_profile_required',
    staff_status: 'staff_rules_required',
    partner_specials_status: 'partner_specials_disabled',
    manual_pos360_status: 'manual_mode_available',
    ticket_tapper_status: 'preview_fallback',
    money_bridge_status: 'settlement_pending_preview',
    eat_command_hub_status: 'contract_only',
    overall_status: 'onboarding_required',
    readiness_score: 0,
  }
}

export async function calculateVenueReadinessScore(venueId) {
  const profile = await getVenueProfile(venueId)
  const onboarding = await getVenueOnboardingStatus(venueId)
  const s = onboarding.status

  let score = 0
  const checks = [
    { key: 'profile', pass: !!profile.profile, points: 15 },
    { key: 'manual_pos360', pass: s.manual_pos360_status === 'manual_mode_available', points: 20 },
    { key: 'staff_policy', pass: s.staff_status !== 'staff_rules_required', points: 15 },
    { key: 'partner_specials', pass: s.partner_specials_status !== 'partner_specials_disabled', points: 10 },
    { key: 'payment', pass: s.payment_status !== 'payment_onboarding_required', points: 20 },
    { key: 'tax', pass: s.tax_status !== 'tax_profile_required', points: 10 },
    { key: 'pos', pass: s.pos_status !== 'pos_provider_required', points: 10 },
  ]

  for (const c of checks) {
    if (c.pass) score += c.points
  }

  return { venueId, readinessScore: score, maxScore: 100, checks }
}

export async function getVenueReadinessWarnings(venueId) {
  const score = await calculateVenueReadinessScore(venueId)
  const warnings = []

  for (const c of score.checks) {
    if (!c.pass) {
      warnings.push({
        type: `${c.key}_incomplete`,
        severity: c.points >= 20 ? 'critical' : 'warning',
        message: `${c.key} setup incomplete.`,
      })
    }
  }

  return { venueId, warnings, readinessScore: score.readinessScore }
}

export async function markOnboardingStepComplete(venueId, stepName) {
  const stepMap = {
    profile: 'profile_status',
    pos: 'pos_status',
    payment: 'payment_status',
    tax: 'tax_status',
    staff: 'staff_status',
    partner_specials: 'partner_specials_status',
  }

  const field = stepMap[stepName]
  if (!field) return { ok: false, message: `Unknown step: ${stepName}` }

  const statusMap = {
    profile_status: 'onboarding_in_progress',
    pos_status: 'manual_mode_available',
    payment_status: 'payment_onboarding_required',
    tax_status: 'tax_profile_required',
    staff_status: 'staff_rules_configured',
    partner_specials_status: 'partner_specials_disabled',
  }

  const existing = venueOnboardingStore.get(venueId) ?? defaultOnboardingStatus(venueId)
  existing[field] = statusMap[field] ?? 'onboarding_in_progress'
  venueOnboardingStore.set(venueId, existing)

  return { ok: true, venueId, stepName, newStatus: existing[field], storageMode: 'memory_fallback' }
}

export function getRequiredOnboardingSteps(venueId) {
  return [
    { step: 'profile', description: 'Create venue profile', required: true },
    { step: 'manual_pos360', description: 'Manual POS360 fallback is always available', required: false, default: 'manual_mode_available' },
    { step: 'staff', description: 'Configure staff approval policy', required: true },
    { step: 'pos', description: 'Select POS provider (or use manual_pos360)', required: false },
    { step: 'payment', description: 'Stripe Connect onboarding for venue payout', required: false },
    { step: 'tax', description: 'Configure venue/state tax profile', required: false },
    { step: 'partner_specials', description: 'Opt-in to partner specials (optional)', required: false },
  ]
}

export async function getVenueOperatingMode(venueId) {
  // Default: manual_pos360 until provider is connected
  return {
    venueId,
    operatingMode: 'manual_pos360',
    manualModeEnabled: true,
    posProviderStatus: 'pos_provider_required',
    routingMode: 'routing_preview',
    storageMode: 'memory_fallback',
  }
}

export async function getVenueCommerceReadiness(venueId) {
  const warnings = await getVenueReadinessWarnings(venueId)
  return {
    venueId,
    ticketTapperStatus: 'preview_fallback',
    moneyBridgeStatus: 'settlement_pending_preview',
    posStatus: 'pos_provider_required',
    paymentStatus: 'payment_onboarding_required',
    taxStatus: 'tax_profile_required',
    partnerSpecialsStatus: 'partner_specials_disabled',
    readinessScore: warnings.readinessScore,
    warnings: warnings.warnings,
    overallStatus: 'onboarding_required',
    message: 'Venue onboarding is the control layer that decides which commerce features a venue can safely use.',
  }
}

export async function logVenueOnboardingAction(payload) {
  const entry = { ...payload, status: 'audit_logged', id: `vo-audit-${Date.now()}`, created_at: new Date().toISOString() }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO venue_onboarding_audit_logs
           (venue_id, actor_id, actor_role, action_type, target_type, target_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [payload.venueId, payload.actorId ?? 'system', payload.actorRole ?? 'system',
         payload.actionType, payload.targetType ?? null, payload.targetId ?? null, 'audit_logged']
      )
      return { ok: true, storageMode: 'postgres', status: 'audit_logged' }
    } catch { /* fallback */ }
  }

  onboardingAuditLogs.push(entry)
  return {
    ok: true,
    id: entry.id,
    status: 'audit_logged',
    storageMode: 'memory_fallback',
    persistenceStatus: 'not_persisted',
    message: 'Audit log stored in memory only. Not persisted — database unavailable.',
  }
}
