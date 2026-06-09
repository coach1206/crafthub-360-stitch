export const venueQrPayload = {
  sourceType: 'venue',
  sourceId: 'venue-grand-lounge',
  sessionId: 'session-demo-001',
  issuedBy: '360-passport-connections',
  signature: 'mock-signature',
}

export const eventQrPayload = {
  sourceType: 'event',
  sourceId: 'event-cigar-cognac',
  sessionId: 'session-demo-001',
  issuedBy: '360-passport-connections',
  signature: 'mock-signature',
}

export const memberQrPayload = {
  sourceType: 'member',
  sourceId: 'member-david-harper',
  sessionId: 'session-demo-001',
  issuedBy: '360-passport-connections',
  signature: 'mock-signature',
}

export const stampQrPayload = {
  sourceType: 'stamp',
  sourceId: 'stamp-collector-night',
  sessionId: 'session-demo-001',
  issuedBy: '360-passport-connections',
  signature: 'mock-signature',
}

export const benefitQrPayload = {
  sourceType: 'benefit',
  sourceId: 'benefit-vip-lounge',
  sessionId: 'session-demo-001',
  issuedBy: '360-passport-connections',
  signature: 'mock-signature',
}

export const ALL_PAYLOADS = {
  venue: venueQrPayload,
  event: eventQrPayload,
  member: memberQrPayload,
  stamp: stampQrPayload,
  benefit: benefitQrPayload,
}
