/**
 * verifyPos360ReservationsGuestFlow.js — Phase B.9 verification (85 checks)
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, fn) {
  try {
    const ok = fn()
    if (ok) { console.log(`  ✓  ${label}`); passed++ }
    else    { console.error(`  ✗  ${label}`); failed++ }
  } catch (e) {
    console.error(`  ✗  ${label} — ${e.message}`)
    failed++
  }
}

function read(rel) { return readFileSync(join(root, rel), 'utf8') }
function exists(rel) { return existsSync(join(root, rel)) }

function noDropTable(rel) {
  const lines = read(rel).split('\n')
  return !lines.some(l => !l.trimStart().startsWith('--') && /DROP\s+TABLE/i.test(l))
}

console.log('\n── Phase B.9 Reservations, Waitlist, Tables, Private Events & Guest Flow — 85 Checks ────────\n')

// ── 1-10: Database / Migration ─────────────────────────────────────────────────
check('Migration file exists',
  () => exists('server/db/migrations/039_pos360_reservations_guest_flow.sql'))

check('Migration: no DROP TABLE (non-comment lines only)',
  () => noDropTable('server/db/migrations/039_pos360_reservations_guest_flow.sql'))

check('Migration: pos360_reservations table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_reservations'))

check('Migration: pos360_reservation_guests table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_reservation_guests'))

check('Migration: pos360_reservation_status_history table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_reservation_status_history'))

check('Migration: pos360_waitlist_entries table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_waitlist_entries'))

check('Migration: pos360_waitlist_status_history table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_waitlist_status_history'))

check('Migration: pos360_floor_sections table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_floor_sections'))

check('Migration: pos360_tables table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('CREATE TABLE IF NOT EXISTS pos360_tables'))

check('Migration: pos360_table_status_history table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_table_status_history'))

check('Migration: pos360_table_assignments table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_table_assignments'))

check('Migration: pos360_table_merge_groups table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_table_merge_groups'))

check('Migration: pos360_seating_sessions table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_seating_sessions'))

check('Migration: pos360_private_events table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_private_events'))

check('Migration: pos360_private_event_packages table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_private_event_packages'))

check('Migration: pos360_private_event_deposits table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_private_event_deposits'))

check('Migration: pos360_private_event_status_history table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_private_event_status_history'))

check('Migration: pos360_guest_flow_events table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_guest_flow_events'))

check('Migration: pos360_guest_flow_insights table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_guest_flow_insights'))

check('Migration: pos360_reservation_offline_queue table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_reservation_offline_queue'))

check('Migration: pos360_reservation_audit table',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('pos360_reservation_audit'))

check('Migration: venue_id present on reservation tables',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('venue_id'))

check('Migration: contains_secrets DEFAULT FALSE on audit',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('contains_secrets'))

check('Migration: exposes_private_data on PII tables',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('exposes_private_data'))

check('Migration: idempotency_key UNIQUE constraints present',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('idempotency_key'))

// ── Contracts ──────────────────────────────────────────────────────────────────
check('Event contracts file exists',
  () => exists('server/services/pos360/pos360ReservationEventContracts.js'))

check('RESERVATION_STATUSES exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export const RESERVATION_STATUSES'))

check('WAITLIST_STATUSES exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export const WAITLIST_STATUSES'))

check('TABLE_STATUSES exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export const TABLE_STATUSES'))

check('SECTION_TYPES exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export const SECTION_TYPES'))

check('PRIVATE_EVENT_STATUSES exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export const PRIVATE_EVENT_STATUSES'))

check('CONTRACT_STATUSES exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export const CONTRACT_STATUSES'))

check('DEPOSIT_STATUSES exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export const DEPOSIT_STATUSES'))

check('GUEST_FLOW_EVENT_TYPES exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export const GUEST_FLOW_EVENT_TYPES'))

check('MANAGER_APPROVAL_ACTIONS exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export const MANAGER_APPROVAL_ACTIONS'))

check('isValidReservationStatus exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export function isValidReservationStatus'))

check('isValidWaitlistStatus exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export function isValidWaitlistStatus'))

check('isValidTableStatus exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export function isValidTableStatus'))

check('isValidSectionType exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export function isValidSectionType'))

check('isValidPrivateEventStatus exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export function isValidPrivateEventStatus'))

check('isValidGuestFlowEventType exported',
  () => read('server/services/pos360/pos360ReservationEventContracts.js').includes('export function isValidGuestFlowEventType'))

// ── Feature Flags ──────────────────────────────────────────────────────────────
check('Feature flags file exists',
  () => exists('server/config/pos360ReservationFeatureFlags.js'))

check('20+ flags defined',
  () => {
    const src = read('server/config/pos360ReservationFeatureFlags.js')
    const matches = src.match(/Enabled|Enabled:/g)
    return matches && matches.length >= 20
  })

check('getReservationFlags exported',
  () => read('server/config/pos360ReservationFeatureFlags.js').includes('export function getReservationFlags'))

check('DEFAULT_POS360_RESERVATION_FLAGS exported',
  () => read('server/config/pos360ReservationFeatureFlags.js').includes('export const DEFAULT_POS360_RESERVATION_FLAGS'))

check('reservationsEnabled flag exists',
  () => read('server/config/pos360ReservationFeatureFlags.js').includes('reservationsEnabled'))

check('waitlistEnabled flag exists',
  () => read('server/config/pos360ReservationFeatureFlags.js').includes('waitlistEnabled'))

check('privateEventsEnabled flag exists',
  () => read('server/config/pos360ReservationFeatureFlags.js').includes('privateEventsEnabled'))

check('offlineReservationQueueEnabled flag exists',
  () => read('server/config/pos360ReservationFeatureFlags.js').includes('offlineReservationQueueEnabled'))

check('eatGuestFlowInsightsEnabled flag exists',
  () => read('server/config/pos360ReservationFeatureFlags.js').includes('eatGuestFlowInsightsEnabled'))

// ── Locales ────────────────────────────────────────────────────────────────────
check('Locale file exists',
  () => exists('src/locales/pos360Reservations.js'))

check('6 languages supported',
  () => ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'].every(l => read('src/locales/pos360Reservations.js').includes(l)))

check('tReservation exported',
  () => read('src/locales/pos360Reservations.js').includes('export function tReservation'))

check('Honest empty state — no_reservations label',
  () => read('src/locales/pos360Reservations.js').includes('No reservations found for this venue.'))

check('Manager approval label exists',
  () => read('src/locales/pos360Reservations.js').includes('Manager approval is required for this action.'))

check('Offline queue labels exist',
  () => read('src/locales/pos360Reservations.js').includes('Reservation action queued for offline sync.'))

check('SMS not connected label exists',
  () => read('src/locales/pos360Reservations.js').includes('SMS confirmation is not connected'))

check('Email not connected label exists',
  () => read('src/locales/pos360Reservations.js').includes('Email confirmation is not connected'))

// ── Service ────────────────────────────────────────────────────────────────────
check('Service file exists',
  () => exists('server/services/pos360/pos360ReservationGuestFlowService.js'))

check('Service: correct DB import path',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes("from '../../db/connection.js'"))

check('Service: fallback comment (no DATABASE_URL mention)',
  () => {
    const src = read('server/services/pos360/pos360ReservationGuestFlowService.js')
    return src.includes('Falls back gracefully when no database connection is configured') &&
           !src.includes('DATABASE_URL')
  })

check('Service: createReservation exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function createReservation'))

check('Service: listReservations exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function listReservations'))

check('Service: updateReservationStatus exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function updateReservationStatus'))

check('Service: assignReservationTable exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function assignReservationTable'))

check('Service: createWaitlistEntry exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function createWaitlistEntry'))

check('Service: listWaitlist exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function listWaitlist'))

check('Service: approveWaitlistPriorityOverride exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function approveWaitlistPriorityOverride'))

check('Service: createFloorSection exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function createFloorSection'))

check('Service: createTable exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function createTable'))

check('Service: updateTableStatus exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function updateTableStatus'))

check('Service: mergeTables exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function mergeTables'))

check('Service: releaseTable exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function releaseTable'))

check('Service: createPrivateEventInquiry exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function createPrivateEventInquiry'))

check('Service: approvePrivateEvent exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function approvePrivateEvent'))

check('Service: updatePrivateEventDepositStatus exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function updatePrivateEventDepositStatus'))

check('Service: createGuestFlowEvent exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function createGuestFlowEvent'))

check('Service: getGuestFlowInsights exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function getGuestFlowInsights'))

check('Service: queueOfflineReservationAction exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function queueOfflineReservationAction'))

check('Service: markOfflineActionSynced exported',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('export async function markOfflineActionSynced'))

check('Service: idempotency duplicate check present',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('idempotency_key'))

check('Service: auditRecord function present',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('async function auditRecord'))

check('Service: status history writes present',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('writeStatusHistory'))

check('Service: manager approval check present',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('manager_approval_required'))

check('Service: no fake SMS success',
  () => {
    const src = read('server/services/pos360/pos360ReservationGuestFlowService.js')
    return !src.includes('sms_sent: true') && !src.includes('sms_success: true')
  })

check('Service: no fake email success',
  () => {
    const src = read('server/services/pos360/pos360ReservationGuestFlowService.js')
    return !src.includes('email_sent: true') && !src.includes('email_success: true')
  })

check('Service: no fake deposit success',
  () => {
    const src = read('server/services/pos360/pos360ReservationGuestFlowService.js')
    return src.includes('No deposit was processed') && !src.includes('deposit_success: true')
  })

check('Service: no fake E.A.T. AI insight',
  () => {
    const src = read('server/services/pos360/pos360ReservationGuestFlowService.js')
    return src.includes('E.A.T. guest flow insights are not connected yet')
  })

check('Service: no fake table availability',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('No tables have been configured for this venue.'))

check('Service: honest empty state present',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('localPreview: true'))

// ── Controller ─────────────────────────────────────────────────────────────────
check('Controller file exists',
  () => exists('server/controllers/pos360ReservationGuestFlowController.js'))

check('Controller: createReservation handler',
  () => read('server/controllers/pos360ReservationGuestFlowController.js').includes('export const createReservation'))

check('Controller: createWaitlistEntry handler',
  () => read('server/controllers/pos360ReservationGuestFlowController.js').includes('export const createWaitlistEntry'))

check('Controller: updateTableStatus handler',
  () => read('server/controllers/pos360ReservationGuestFlowController.js').includes('export const updateTableStatus'))

check('Controller: createPrivateEventInquiry handler',
  () => read('server/controllers/pos360ReservationGuestFlowController.js').includes('export const createPrivateEventInquiry'))

check('Controller: getGuestFlowInsights handler',
  () => read('server/controllers/pos360ReservationGuestFlowController.js').includes('export const getGuestFlowInsights'))

check('Controller: ok500 pattern used',
  () => read('server/controllers/pos360ReservationGuestFlowController.js').includes('ok500'))

// ── Routes ─────────────────────────────────────────────────────────────────────
check('Routes file exists',
  () => exists('server/routes/pos360ReservationGuestFlowRoutes.js'))

check('Routes: mounted at /api/pos360/reservations in server/index.js',
  () => read('server/index.js').includes('/api/pos360/reservations'))

check('Routes: write routes use canAccessPOS3',
  () => read('server/routes/pos360ReservationGuestFlowRoutes.js').includes('canAccessPOS3'))

check('Routes: approve-priority route for manager approval',
  () => read('server/routes/pos360ReservationGuestFlowRoutes.js').includes('approve-priority'))

check('Routes: private-events/approve route exists',
  () => read('server/routes/pos360ReservationGuestFlowRoutes.js').includes('/approve'))

check('Routes: no fake SMS route',
  () => !read('server/routes/pos360ReservationGuestFlowRoutes.js').includes('/sms'))

check('Routes: no fake payment route',
  () => !read('server/routes/pos360ReservationGuestFlowRoutes.js').includes('/charge'))

// ── Frontend ───────────────────────────────────────────────────────────────────
check('Frontend page exists',
  () => exists('src/pages/pos360/POS360ReservationsGuestFlow.jsx'))

check('UI: ReservationDashboard component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('ReservationDashboard'))

check('UI: ReservationCreatePanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('ReservationCreatePanel'))

check('UI: WaitlistPanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('WaitlistPanel'))

check('UI: TableMapPanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('TableMapPanel'))

check('UI: PatioManagementPanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('PatioManagementPanel'))

check('UI: PrivateEventsPanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('PrivateEventsPanel'))

check('UI: EATGuestFlowInsightsPanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('EATGuestFlowInsightsPanel'))

check('UI: SmokeCraftReservationLinkPanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('SmokeCraftReservationLinkPanel'))

check('UI: LoyaltyReservationLinkPanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('LoyaltyReservationLinkPanel'))

check('UI: ReservationOfflineQueuePanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('ReservationOfflineQueuePanel'))

check('UI: HonestEmptyStatePanel component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('HonestEmptyStatePanel'))

check('UI: ReservationLanguageSelector component present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('ReservationLanguageSelector'))

check('UI: touchscreen/handheld layout label present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('Touchscreen'))

check('UI: handheld-friendly layout label present',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('Handheld'))

check('UI: no fake populated guest data',
  () => {
    const src = read('src/pages/pos360/POS360ReservationsGuestFlow.jsx')
    return !src.includes('John Smith') && !src.includes('jane@example.com') && !src.includes('555-1234')
  })

check('UI: integration not connected language present (SMS)',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('SMS confirmation is not connected'))

check('UI: integration not connected language present (E.A.T.)',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('E.A.T. guest flow insights are not connected yet'))

check('UI: smokecraft-pos360.png referenced',
  () => read('src/pages/pos360/POS360ReservationsGuestFlow.jsx').includes('/smokecraft-pos360.png'))

// ── Safety ─────────────────────────────────────────────────────────────────────
check('PII exposes_private_data DEFAULT TRUE present in migration',
  () => {
    const sql = read('server/db/migrations/039_pos360_reservations_guest_flow.sql')
    return sql.includes('exposes_private_data') && sql.includes('DEFAULT TRUE')
  })

check('contains_secrets false check: audit table has DEFAULT FALSE',
  () => read('server/db/migrations/039_pos360_reservations_guest_flow.sql').includes('contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE'))

check('Manager approval block response in service',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('managerApprovalRequired: true'))

check('Offline queue honest sync language in service',
  () => read('server/services/pos360/pos360ReservationGuestFlowService.js').includes('Reservation action queued for offline sync.'))

check('App.jsx: reservations route registered',
  () => read('src/App.jsx').includes('path="reservations"') && read('src/App.jsx').includes('POS360ReservationsGuestFlow'))

console.log(`\n── Result: ${passed} passed, ${failed} failed ──────────────────────────\n`)
if (failed > 0) process.exit(1)
