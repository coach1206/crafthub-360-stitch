/**
 * Passport Entry Config — constants for QR/kiosk guest entry.
 * Import these wherever entry parameters are read, validated, or displayed.
 */

export const DEFAULT_VENUE_ID    = 'demo-lounge'
export const DEFAULT_DEVICE_ID   = 'kiosk-01'
export const DEFAULT_ENTRY_SOURCE = 'direct'

export const PASSPORT_ENTRY_TYPES = {
  QR:     'qr',
  KIOSK:  'kiosk',
  STAFF:  'staff',
  DIRECT: 'direct',
  TABLET: 'tablet',
}

/** Fields required to consider a guest profile "complete" for Passport. */
export const REQUIRED_GUEST_PROFILE_FIELDS = [
  'firstName',
  'ageConfirmed',
]

/**
 * Optional fields — captured during enrollment or profile updates.
 * Useful for venue analytics and SmokeCraft personalization.
 */
export const OPTIONAL_GUEST_PROFILE_FIELDS = [
  'lastName', 'nickname', 'email', 'phone',
  'city', 'state', 'zip',
  'profession', 'industry', 'interests',
  'goals', 'expertise', 'preferredCraft',
]

/** Display names for known venue IDs. */
export const VENUE_DISPLAY_NAMES = {
  'demo-lounge':   'Demo Lounge',
  'grand-lounge':  'Grand Lounge',
  'reserve-room':  'Reserve Room',
  'private-club':  'Private Club',
  'cigar-bar':     'Cigar Bar',
}

/** Display labels for known entry sources. */
export const ENTRY_SOURCE_LABELS = {
  qr:     'QR Code',
  kiosk:  'Kiosk',
  staff:  'Staff',
  direct: 'Direct',
  tablet: 'Tablet',
}
