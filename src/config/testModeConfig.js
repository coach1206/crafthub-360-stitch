/**
 * Test Mode Config — Phase 12 (Frontend)
 * Mirror of server/config/testModeConfig.js — no secrets, no imports from server.
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

export const PARTICIPANT_TYPES = [
  { value: 'guest',    label: 'Guest' },
  { value: 'staff',    label: 'Staff' },
  { value: 'manager',  label: 'Manager' },
  { value: 'founder',  label: 'Founder' },
  { value: 'observer', label: 'Observer' },
]

export const SEVERITY_LEVELS = [
  { value: 'low',     label: 'Low',     color: '#4ade80' },
  { value: 'medium',  label: 'Medium',  color: '#fbbf24' },
  { value: 'high',    label: 'High',    color: '#f97316' },
  { value: 'blocker', label: 'Blocker', color: '#f87171' },
]

export const ISSUE_TYPES = [
  { value: 'navigation',  label: 'Navigation' },
  { value: 'visual',      label: 'Visual' },
  { value: 'performance', label: 'Performance' },
  { value: 'audio',       label: 'Audio' },
  { value: 'passport',    label: 'Passport' },
  { value: 'pos3',        label: 'POS 3' },
  { value: 'eat',         label: 'E.A.T. Command' },
  { value: 'auth',        label: 'Auth' },
  { value: 'kiosk',       label: 'Kiosk' },
  { value: 'offline',     label: 'Offline' },
  { value: 'touchscreen', label: 'Touchscreen' },
  { value: 'content',     label: 'Content' },
  { value: 'other',       label: 'Other' },
]

export const READINESS_LABEL = (score) => {
  if (score >= 90) return { label: 'Pilot-Ready',              color: '#4ade80' }
  if (score >= 75) return { label: 'Pilot-Ready with Caution', color: '#a3e635' }
  if (score >= 60) return { label: 'Needs Fixes Before Pilot', color: '#fbbf24' }
  return                   { label: 'Not Ready',               color: '#f87171' }
}
