/**
 * Demo Mode Config — Phase 13
 * Shared source of truth for founder demo / investor / pilot configuration.
 * Frontend mirror: src/config/demoModeConfig.js
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
  { value: 'founder_demo',              label: 'Founder Demo',               description: 'Single device, founder-led, no data commitment' },
  { value: 'single_tablet',             label: 'Single Tablet Pilot',         description: 'One tablet, full guest journey, SmokeCraft + Passport' },
  { value: 'kiosk_experience',          label: 'Kiosk Experience Pilot',      description: 'Dedicated kiosk station, locked display, kiosk mode active' },
  { value: 'staff_pos3',                label: 'Staff + POS 3 Pilot',         description: 'Staff devices + POS 3 feed, manager E.A.T. access' },
  { value: 'full_venue_intelligence',   label: 'Full Venue Intelligence Pilot', description: 'All modules, full data capture, analytics, venue testing' },
]

export const PILOT_STATUSES = [
  { value: 'prospect',        label: 'Prospect' },
  { value: 'contacted',       label: 'Contacted' },
  { value: 'agreement_sent',  label: 'Agreement Sent' },
  { value: 'active_pilot',    label: 'Active Pilot' },
  { value: 'completed',       label: 'Completed' },
  { value: 'declined',        label: 'Declined' },
]

export const DEMO_MODULES = [
  'SmokeCraft 360',
  '360 Passport Connection',
  'POS 3',
  'E.A.T. Command',
  'Mentor Voice',
  'Kiosk Mode',
  'Venue Testing',
  'System Overview',
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
