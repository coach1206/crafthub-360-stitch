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
  sourceType: 'craft_stamp',
  sourceId:   'stamp-collector-night',
  xpValue:    100,
  venueId:    'grand-lounge',
  issuedBy:   'smokecraft-360',
  signature:  'mock-signature',
}

export const vipStampPayload = {
  sourceType: 'vip_stamp',
  sourceId:   'stamp-vip-grand-lounge',
  xpValue:    150,
  venueId:    'grand-lounge',
  issuedBy:   'smokecraft-360',
  signature:  'mock-signature',
}

export const ALL_SCAN_PAYLOADS = {
  sessionCheckIn:      sessionCheckInPayload,
  eventEntry:          eventEntryPayload,
  connectionVerified:  connectionVerifiedPayload,
  craftStamp:          craftStampPayload,
  vipStamp:            vipStampPayload,
}
