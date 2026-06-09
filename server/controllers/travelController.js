/**
 * Travel Controller
 * DayOne360 Travel — trips, concierge requests, and passport stamps.
 */
import { v4 as uuidv4 } from 'uuid'

const TRIPS = [
  {
    id: 'dr',
    name: 'Dominican Republic',
    subtitle: 'Cigar Country Experience',
    region: 'Caribbean',
    desc: 'An immersive farm-to-lounge journey through the Cibao Valley — birthplace of the world\'s finest cigars. Private plantation tours, master blender sessions, and reserve tastings.',
    tags: ['Cigars', 'Culture', 'Passport Stamps'],
    xpReward: 500,
    duration: '7 nights',
    seats: 8,
    status: 'available',
  },
  {
    id: 'co',
    name: 'Colombia',
    subtitle: 'Cultural Immersion',
    region: 'South America',
    desc: 'Coffee highlands, artisan culture, and premium tobacco. A Brotherhood journey through Medellín and the coffee-growing regions with exclusive cigar lounge experiences.',
    tags: ['Coffee', 'Cigars', 'Nightlife'],
    xpReward: 400,
    duration: '6 nights',
    seats: 10,
    status: 'available',
  },
  {
    id: 'atl',
    name: 'Atlanta Departure',
    subtitle: 'Local Concierge Experience',
    region: 'USA',
    desc: 'Premium pre-departure concierge from Atlanta. VIP lounge access, curated pairing kits, and Brotherhood 360 passport activation for international members.',
    tags: ['VIP', 'Concierge', 'Departure'],
    xpReward: 100,
    duration: '1 day',
    seats: 20,
    status: 'available',
  },
]

// In-memory stores
const conciergeRequests = []
const userStamps        = new Map() // userId → [{ tripId, ts, xpAwarded }]

function getOrCreate(userId) {
  if (!userStamps.has(userId)) userStamps.set(userId, [])
  return userStamps.get(userId)
}

export function getTrips(_req, res) {
  res.json({ success: true, trips: TRIPS })
}

export function getTripById(req, res) {
  const trip = TRIPS.find(t => t.id === req.params.tripId)
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })
  res.json({ success: true, trip })
}

export function submitConcierge(req, res) {
  const { userId, tripId, name, contact, notes } = req.body
  if (!userId || !tripId) return res.status(400).json({ success: false, message: 'userId and tripId required' })
  const trip = TRIPS.find(t => t.id === tripId)
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })
  const request = { id: uuidv4(), userId, tripId, tripName: trip.name, name, contact, notes, status: 'pending', submittedAt: new Date().toISOString() }
  conciergeRequests.push(request)
  res.json({ success: true, message: 'Concierge request submitted — expect contact within 24 hours.', requestId: request.id })
}

export function getUserStamps(req, res) {
  const stamps = getOrCreate(req.params.userId)
  const enriched = stamps.map(s => ({ ...s, trip: TRIPS.find(t => t.id === s.tripId) }))
  res.json({ success: true, stamps: enriched, totalXp: stamps.reduce((acc, s) => acc + s.xpAwarded, 0) })
}

export function claimStamp(req, res) {
  const { userId, tripId } = req.body
  if (!userId || !tripId) return res.status(400).json({ success: false, message: 'userId and tripId required' })
  const trip   = TRIPS.find(t => t.id === tripId)
  if (!trip)   return res.status(404).json({ success: false, message: 'Trip not found' })
  const stamps = getOrCreate(userId)
  if (stamps.find(s => s.tripId === tripId)) return res.json({ success: true, alreadyClaimed: true, trip })
  const stamp  = { id: uuidv4(), tripId, xpAwarded: trip.xpReward, ts: new Date().toISOString() }
  stamps.push(stamp)
  res.json({ success: true, alreadyClaimed: false, stamp, trip, xpAwarded: trip.xpReward })
}

export function getConciergeRequests(_req, res) {
  res.json({ success: true, requests: conciergeRequests })
}
