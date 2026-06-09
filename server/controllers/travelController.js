/**
 * Travel Controller — DayOne360 Travel
 */
import { v4 as uuidv4 } from 'uuid'
import { success, error } from '../utils/responseHelpers.js'

const TRIPS = [
  {
    id: 'dr', name: 'Dominican Republic', subtitle: 'Cigar Country Experience', region: 'Caribbean',
    desc: "An immersive farm-to-lounge journey through the Cibao Valley — birthplace of the world's finest cigars. Private plantation tours, master blender sessions, and reserve tastings.",
    tags: ['Cigars', 'Culture', 'Passport Stamps'], xpReward: 500, duration: '7 nights', seats: 8, status: 'available',
  },
  {
    id: 'co', name: 'Colombia', subtitle: 'Cultural Immersion', region: 'South America',
    desc: 'Coffee highlands, artisan culture, and premium tobacco. A Brotherhood journey through Medellín and the coffee-growing regions with exclusive cigar lounge experiences.',
    tags: ['Coffee', 'Cigars', 'Nightlife'], xpReward: 400, duration: '6 nights', seats: 10, status: 'available',
  },
  {
    id: 'atl', name: 'Atlanta Departure', subtitle: 'Local Concierge Experience', region: 'USA',
    desc: 'Premium pre-departure concierge from Atlanta. VIP lounge access, curated pairing kits, and Brotherhood 360 passport activation for international members.',
    tags: ['VIP', 'Concierge', 'Departure'], xpReward: 100, duration: '1 day', seats: 20, status: 'available',
  },
]

const conciergeRequests = []
const userStamps        = new Map() // userId → stamp[]

function getStamps(userId) {
  if (!userStamps.has(userId)) userStamps.set(userId, [])
  return userStamps.get(userId)
}

export function getTrips(_req, res) {
  success(res, { trips: TRIPS, total: TRIPS.length })
}

export function getTripById(req, res) {
  const trip = TRIPS.find(t => t.id === req.params.tripId)
  if (!trip) return error(res, 'Trip not found', 404)
  success(res, { trip })
}

export function submitConcierge(req, res) {
  const { userId, tripId, name, contact, notes } = req.body
  if (!userId || !tripId) return error(res, 'userId and tripId are required')
  const trip = TRIPS.find(t => t.id === tripId)
  if (!trip) return error(res, 'Trip not found', 404)
  const request = { id: uuidv4(), userId, tripId, tripName: trip.name, name, contact, notes, status: 'pending', submittedAt: new Date().toISOString() }
  conciergeRequests.push(request)
  success(res, { requestId: request.id }, 'Concierge request submitted — expect contact within 24 hours.')
}

export function getUserStamps(req, res) {
  const stamps   = getStamps(req.params.userId)
  const enriched = stamps.map(s => ({ ...s, trip: TRIPS.find(t => t.id === s.tripId) }))
  success(res, { stamps: enriched, totalXp: stamps.reduce((a, s) => a + s.xpAwarded, 0), count: stamps.length })
}

export function claimStamp(req, res) {
  const { userId, tripId } = req.body
  if (!userId || !tripId) return error(res, 'userId and tripId are required')
  const trip = TRIPS.find(t => t.id === tripId)
  if (!trip)  return error(res, 'Trip not found', 404)
  const stamps = getStamps(userId)
  if (stamps.find(s => s.tripId === tripId)) return success(res, { alreadyClaimed: true, trip }, 'Stamp already claimed')
  const stamp = { id: uuidv4(), tripId, xpAwarded: trip.xpReward, ts: new Date().toISOString() }
  stamps.push(stamp)
  success(res, { stamp, trip, alreadyClaimed: false }, `+${trip.xpReward} XP — ${trip.name} stamp claimed`)
}

export function getConciergeRequests(_req, res) {
  success(res, { requests: conciergeRequests, total: conciergeRequests.length })
}
