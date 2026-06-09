/**
 * Travel Controller — DayOne360 Travel
 * conciergeRequests and userStamps are persisted across server restarts.
 */
import { v4 as uuidv4 } from 'uuid'
import { success, error } from '../utils/responseHelpers.js'
import { TRIPS } from '../data/dayOneTravel.js'
import {
  loadJson, saveJson,
  serializeMapOfArrays, deserializeMapOfArrays,
} from '../utils/persist.js'

// ── Load persisted state ──────────────────────────────────────────────────────
const conciergeRequests = loadJson('travel_concierge.json', [])
const userStamps        = deserializeMapOfArrays(loadJson('travel_stamps.json', {}))

function saveState() {
  saveJson('travel_concierge.json', conciergeRequests)
  saveJson('travel_stamps.json', serializeMapOfArrays(userStamps))
}

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
  saveState()
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
  saveState()
  success(res, { stamp, trip, alreadyClaimed: false }, `+${trip.xpReward} XP — ${trip.name} stamp claimed`)
}

export function getConciergeRequests(_req, res) {
  success(res, { requests: conciergeRequests, total: conciergeRequests.length })
}
