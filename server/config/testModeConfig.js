/**
 * Test Mode Config — Phase 12
 * Shared source of truth for venue testing configuration.
 * Frontend mirror: src/config/testModeConfig.js
 */

export const TEST_TYPES = [
  { value: 'founder_demo',           label: 'Founder Demo' },
  { value: 'venue_walkthrough',      label: 'Venue Walkthrough' },
  { value: 'guest_usability_test',   label: 'Guest Usability Test' },
  { value: 'staff_training_test',    label: 'Staff Training Test' },
  { value: 'manager_dashboard_test', label: 'Manager Dashboard Test' },
  { value: 'full_pilot_rehearsal',   label: 'Full Pilot Rehearsal' },
]

export const ALLOWED_MODULES = [
  'SmokeCraft 360',
  '360 Passport Connection',
  'POS 3',
  'E.A.T. Command',
  'Mentor Voice',
  'Kiosk Mode',
  'Offline Mode',
]

export const PARTICIPANT_TYPES = ['guest', 'staff', 'manager', 'founder', 'observer']

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'blocker']

export const ISSUE_TYPES = [
  'navigation',
  'visual',
  'performance',
  'audio',
  'passport',
  'pos3',
  'eat',
  'auth',
  'kiosk',
  'offline',
  'touchscreen',
  'content',
  'other',
]

export const DEFAULT_TEST_CONFIG = {
  enabled:                false,
  venueTestId:            null,
  venueName:              '',
  testDate:               new Date().toISOString().slice(0, 10),
  testType:               'venue_walkthrough',
  resetBetweenGuests:     false,
  captureObserverNotes:   true,
  exportEnabled:          true,
  prototypeMode:          true,
  allowedModules:         ALLOWED_MODULES,
}

/** Readiness score thresholds */
export const READINESS = {
  notReady:        { min: 0,  max: 59,  label: 'Not Ready',               color: '#f87171' },
  needsFixes:      { min: 60, max: 74,  label: 'Needs Fixes Before Pilot', color: '#fbbf24' },
  pilotWithCaution:{ min: 75, max: 89,  label: 'Pilot-Ready with Caution', color: '#a3e635' },
  pilotReady:      { min: 90, max: 100, label: 'Pilot-Ready',              color: '#4ade80' },
}

export function getReadinessLabel(score) {
  if (score >= 90) return READINESS.pilotReady
  if (score >= 75) return READINESS.pilotWithCaution
  if (score >= 60) return READINESS.needsFixes
  return READINESS.notReady
}
