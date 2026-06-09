/**
 * Passport Scan API — routes QR/NFC payloads to the correct mock source.
 * Real backend endpoints: POST /api/passport/scan, GET /api/venues/:id, etc.
 * Replace each function body with a fetch() call when the backend is ready.
 *
 * Real OpenAI image generation must happen on the backend.
 * Never expose API keys in browser code.
 */

import { findVenue } from '../data/venues.js'
import { findStamp } from '../data/stamps.js'
import { findBenefit } from '../data/benefits.js'
import { findMember } from '../data/members.js'

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

export function validateQrPayload(qrPayload) {
  if (!qrPayload || typeof qrPayload !== 'object') return null
  const valid = ['venue', 'event', 'member', 'stamp', 'benefit']
  if (!valid.includes(qrPayload.sourceType)) return null
  if (qrPayload.issuedBy !== '360-passport-connections') return null
  return qrPayload
}

export async function getVenueById(id) {
  await delay(600)
  const v = findVenue(id)
  if (!v) return { success: false, error: 'Venue not found' }
  return { success: true, sourceType: 'venue', data: v }
}

export async function getEventById(id) {
  await delay(600)
  const EVENT_MAP = {
    'event-cigar-cognac': {
      id: 'event-cigar-cognac',
      name: 'Cigar & Cognac Collectors Night',
      venue: 'Grand Lounge',
      venueId: 'venue-grand-lounge',
      date: 'Jun 14',
      time: '7:00 PM',
      stampId: 'stamp-collector-night',
      stampName: 'Collector Night Stamp',
      attendeeCount: 48,
      capacity: 60,
      city: 'New York, NY',
      description: 'An intimate evening celebrating rare cigars and aged cognacs.',
    },
    'event-capital-culture': {
      id: 'event-capital-culture',
      name: 'Capital & Culture Private Dinner',
      venue: 'The Bottle House',
      venueId: 'venue-bottle-house',
      date: 'Jun 22',
      time: '6:30 PM',
      stampId: 'stamp-vip-dinner',
      stampName: 'VIP Dinner Stamp',
      attendeeCount: 32,
      capacity: 40,
      city: 'Atlanta, GA',
      description: 'An exclusive business roundtable built around curated tastings.',
    },
  }
  const ev = EVENT_MAP[id]
  if (!ev) return { success: false, error: 'Event not found' }
  return { success: true, sourceType: 'event', data: ev }
}

export async function getMemberById(id) {
  await delay(700)
  const m = findMember(id)
  if (!m) return { success: false, error: 'Member not found' }
  return { success: true, sourceType: 'member', data: m }
}

export async function getStampById(id) {
  await delay(500)
  const s = findStamp(id)
  if (!s) return { success: false, error: 'Stamp not found' }
  return { success: true, sourceType: 'stamp', data: s }
}

export async function getBenefitById(id) {
  await delay(500)
  const b = findBenefit(id)
  if (!b) return { success: false, error: 'Benefit not found' }
  return { success: true, sourceType: 'benefit', data: b }
}

export async function scanPassportSource(qrPayload) {
  await delay(300)
  const parsed = validateQrPayload(qrPayload)
  if (!parsed) return { success: false, sourceType: 'invalid', error: 'Invalid Passport Code' }
  switch (parsed.sourceType) {
    case 'venue':   return getVenueById(parsed.sourceId)
    case 'event':   return getEventById(parsed.sourceId)
    case 'member':  return getMemberById(parsed.sourceId)
    case 'stamp':   return getStampById(parsed.sourceId)
    case 'benefit': return getBenefitById(parsed.sourceId)
    default: return { success: false, sourceType: 'invalid', error: 'Invalid Passport Code' }
  }
}

export async function claimStamp(stampId, memberId) {
  await delay(1200)
  return { success: true, stampId, memberId, claimedAt: new Date().toISOString(), passportUpdated: true }
}

export async function verifyConnection(memberId) {
  await delay(1400)
  const m = findMember(memberId)
  return { success: true, member: m, verifiedAt: new Date().toISOString(), passportUpdated: true }
}

export async function checkInToVenue(venueId) {
  await delay(800)
  const v = findVenue(venueId)
  return { success: true, venue: v, checkedInAt: new Date().toISOString() }
}

export async function checkInToEvent(eventId) {
  await delay(900)
  const res = await getEventById(eventId)
  return { success: true, event: res.data, checkedInAt: new Date().toISOString() }
}

export async function redeemBenefit(benefitId) {
  await delay(900)
  const b = findBenefit(benefitId)
  return { success: true, benefit: b, redeemedAt: new Date().toISOString() }
}

export async function requestOpenAIImageReplacement(assetId, prompt) {
  await delay(400)
  // Real OpenAI image generation must happen on the backend. Never expose API keys in browser code.
  return {
    success: true,
    status: 'queued',
    assetId,
    prompt,
    message: 'Image replacement request queued for secure backend generation.',
  }
}
