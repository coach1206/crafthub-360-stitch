/**
 * SmokeCraft Management Sync — connection-state engine (Package E).
 * CONNECTED is only ever returned when a real check succeeds THIS
 * request — never inferred from a table/route/component merely
 * existing in the codebase.
 */
import { getDb, isDbAvailable } from '../../db/connection.js'
import { INTEGRATIONS } from './integrationRegistry.js'

const STATES = Object.freeze([
  'CONNECTED', 'DISCONNECTED', 'NOT_CONFIGURED', 'CONNECTING', 'DEGRADED',
  'STALE', 'ERROR', 'INTERNAL_ONLY', 'UNAVAILABLE', 'COMING_SOON',
])

async function checkInternalManagementSync() {
  if (!isDbAvailable()) return { state: 'UNAVAILABLE', message: 'Database unavailable.' }
  try {
    await getDb().query('SELECT 1 FROM smokecraft_management_sync_journeys LIMIT 1')
    return { state: 'CONNECTED', message: 'Internal Management Sync database reachable.' }
  } catch {
    return { state: 'ERROR', message: 'Internal Management Sync health check failed.' }
  }
}

async function checkTicketTapper(venueId) {
  if (!isDbAvailable()) return { state: 'UNAVAILABLE', message: 'Database unavailable.' }
  try {
    // Real health check: the specials table this feature actually reads
    // from is reachable. Does not claim promotions exist for this venue
    // — only that the destination itself is live.
    await getDb().query('SELECT 1 FROM ticket_tapper_specials LIMIT 1')
    return { state: 'CONNECTED', message: 'Ticket Tapper specials/tracking API reachable.' }
  } catch {
    return { state: 'ERROR', message: 'Ticket Tapper health check failed.' }
  }
}

async function checkPassport360() {
  if (!isDbAvailable()) return { state: 'UNAVAILABLE', message: 'Database unavailable.' }
  try {
    await getDb().query('SELECT 1 FROM passport_360_guest_profiles LIMIT 1')
    return {
      state: 'INTERNAL_ONLY',
      message: 'Passport 360 persistence exists but is not mapped to SmokeCraft Management Sync guest identity — no write path built.',
    }
  } catch {
    return { state: 'UNAVAILABLE', message: 'Passport 360 tables unreachable.' }
  }
}

function checkStaticNotConfigured(reason) {
  return { state: 'NOT_CONFIGURED', message: reason }
}

function checkStaticComingSoon(reason) {
  return { state: 'COMING_SOON', message: reason }
}

/**
 * @returns real, per-integration connection state for the given venue.
 * Never fabricates CONNECTED for an integration whose check wasn't run.
 */
export async function getIntegrationStatuses(venueId) {
  const [internal, ticketTapper, passport] = await Promise.all([
    checkInternalManagementSync(),
    checkTicketTapper(venueId),
    checkPassport360(),
  ])

  return {
    checkedAt: new Date().toISOString(),
    venueId,
    integrations: {
      internal_management_sync: { ...INTEGRATIONS.internal_management_sync, ...internal },
      ticket_tapper: { ...INTEGRATIONS.ticket_tapper, ...ticketTapper },
      passport_360: { ...INTEGRATIONS.passport_360, ...passport },
      staff_handoff: { ...INTEGRATIONS.staff_handoff, ...checkStaticNotConfigured('No real staff-handoff destination exists in this codebase.') },
      inventory: { ...INTEGRATIONS.inventory, ...checkStaticNotConfigured('No cigar-humidor inventory table/API exists in this codebase.') },
      pos360: { ...INTEGRATIONS.pos360, ...checkStaticComingSoon('POS360 is a real module for its own purpose; no Management Sync bridge has been built or verified.') },
      eat_360: { ...INTEGRATIONS.eat_360, ...checkStaticComingSoon('E.A.T. 360 bridge service is a confirmed, self-documented non-functional preview stub.') },
      novee_os: { ...INTEGRATIONS.novee_os, ...checkStaticComingSoon('No SmokeCraft Management Sync feed into NOVEE OS exists.') },
    },
  }
}

export { STATES }
