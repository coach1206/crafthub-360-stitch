/**
 * Demo Mode Config — Phase 13 (Frontend)
 * Mirror of server/config/demoModeConfig.js — no server imports.
 */

export const DEMO_TYPES = [
  { value: 'founder_walkthrough',   label: 'Founder Walkthrough' },
  { value: 'investor_pitch',        label: 'Investor Pitch' },
  { value: 'venue_owner_demo',      label: 'Venue Owner Demo' },
  { value: 'staff_training_demo',   label: 'Staff Training Demo' },
  { value: 'pilot_partner_demo',    label: 'Pilot Partner Demo' },
  { value: 'hardware_vendor_demo',  label: 'Hardware Vendor Demo' },
]

export const AUDIENCE_TYPES = [
  { value: 'investor',          label: 'Investor' },
  { value: 'venue_owner',       label: 'Venue Owner' },
  { value: 'manager',           label: 'Manager' },
  { value: 'staff',             label: 'Staff' },
  { value: 'technical_partner', label: 'Technical Partner' },
  { value: 'hardware_partner',  label: 'Hardware Partner' },
  { value: 'founder_only',      label: 'Founder Only' },
]

export const PILOT_TIERS = [
  { value: 'founder_demo',            label: 'Founder Demo',                  description: 'Single device, founder-led, no data commitment' },
  { value: 'single_tablet',           label: 'Single Tablet Pilot',           description: 'One tablet, full guest journey, SmokeCraft + Passport' },
  { value: 'kiosk_experience',        label: 'Kiosk Experience Pilot',        description: 'Dedicated kiosk station, locked display' },
  { value: 'staff_pos3',              label: 'Staff + POS 3 Pilot',           description: 'Staff devices + POS 3 feed, manager E.A.T. access' },
  { value: 'full_venue_intelligence', label: 'Full Venue Intelligence Pilot', description: 'All modules, full data capture, analytics' },
]

export const PILOT_STATUSES = [
  { value: 'prospect',       label: 'Prospect',        color: '#C9A84C' },
  { value: 'contacted',      label: 'Contacted',       color: '#60a5fa' },
  { value: 'agreement_sent', label: 'Agreement Sent',  color: '#c084fc' },
  { value: 'active_pilot',   label: 'Active Pilot',    color: '#4ade80' },
  { value: 'completed',      label: 'Completed',       color: '#a3e635' },
  { value: 'declined',       label: 'Declined',        color: '#f87171' },
]

export const DEMO_MODULES = [
  { key: 'smokecraft',   label: 'SmokeCraft 360',          route: '/smokecraft',    color: '#C9A84C' },
  { key: 'passport',     label: '360 Passport Connection', route: '/passport',      color: '#a3e635' },
  { key: 'pos3',         label: 'POS 3',                   route: '/pos',           color: '#60a5fa' },
  { key: 'eat',          label: 'E.A.T. Command',          route: '/eat',           color: '#c084fc' },
  { key: 'kiosk',        label: 'Kiosk Mode',              route: '/kiosk-setup',   color: '#fb923c' },
  { key: 'venue_test',   label: 'Venue Testing',           route: '/venue-test',    color: '#f87171' },
  { key: 'overview',     label: 'System Overview',         route: '/system-overview', color: '#fbbf24' },
]

export const PILOT_REQUIREMENTS = [
  { key: 'tablet_hardware',       label: 'Tablet / display hardware available' },
  { key: 'wifi_network',          label: 'Stable Wi-Fi network on premises' },
  { key: 'staff_availability',    label: 'Staff available for training session' },
  { key: 'manager_access',        label: 'Manager available for E.A.T. walkthrough' },
  { key: 'compliance_review',     label: 'Tobacco / alcohol compliance reviewed' },
  { key: 'pilot_agreement',       label: 'Pilot agreement signed (placeholder)' },
  { key: 'test_session_complete',  label: 'NOVEE OS venue test session completed' },
]

export const PROTOTYPE_DISCLOSURE_TEXT =
  'This demo uses prototype provider data unless live integrations are configured. ' +
  'No live payments or live POS credentials are active in this environment.'

export const DEMO_SECTIONS = [
  { id: 'what',         label: 'What NOVEE OS Is',            duration: '30s' },
  { id: 'guest',        label: 'Guest Journey',               duration: '45s' },
  { id: 'smokecraft',   label: 'SmokeCraft Experience',       duration: '60s' },
  { id: 'passport',     label: 'Passport Relationship Engine',duration: '30s' },
  { id: 'pos3',         label: 'POS 3 Intelligence Layer',    duration: '30s' },
  { id: 'eat',          label: 'E.A.T. Management Layer',     duration: '45s' },
  { id: 'kiosk',        label: 'Kiosk / Tablet Deployment',   duration: '30s' },
  { id: 'testing',      label: 'Venue Testing / Readiness',   duration: '30s' },
  { id: 'ask',          label: 'Pilot Ask',                   duration: '30s' },
]
