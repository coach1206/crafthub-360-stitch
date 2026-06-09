/**
 * Canonical scan payloads for POST /api/ranking/scan.
 * sourceType uses camelCase to match server XP_MAP keys (session/event/connection/craftStamp/vipStamp).
 * xpValue is always explicit — never rely on server-side fallback.
 */

export const sessionCheckInPayload = {
  sourceType: 'session',
  sourceId:   'session-grand-lounge-tonight',
  xpValue:    25,
  venueId:    'grand-lounge',
  issuedBy:   'smokecraft-360',
  signature:  'mock-signature',
}

export const eventEntryPayload = {
  sourceType: 'event',
  sourceId:   'event-cigar-cognac',
  xpValue:    50,
  venueId:    'grand-lounge',
  issuedBy:   'smokecraft-360',
  signature:  'mock-signature',
}

export const connectionVerifiedPayload = {
  sourceType: 'connection',
  sourceId:   'member-david-harper',
  xpValue:    75,
  venueId:    'grand-lounge',
  issuedBy:   'smokecraft-360',
  signature:  'mock-signature',
}

export const craftStampPayload = {
  sourceType: 'craftStamp',
  sourceId:   'stamp-collector-night',
  xpValue:    100,
  venueId:    'grand-lounge',
  issuedBy:   'smokecraft-360',
  signature:  'mock-signature',
}

export const vipStampPayload = {
  sourceType: 'vipStamp',
  sourceId:   'stamp-vip-grand-lounge',
  xpValue:    150,
  venueId:    'grand-lounge',
  issuedBy:   'smokecraft-360',
  signature:  'mock-signature',
}

export const ALL_SCAN_PAYLOADS = [
  sessionCheckInPayload,
  eventEntryPayload,
  connectionVerifiedPayload,
  craftStampPayload,
  vipStampPayload,
]
