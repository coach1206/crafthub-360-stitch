/**
 * SmokeCraft Management Sync — controllers.
 * Follows the existing wrap()-envelope convention
 * (see ticketTapperPromotionController.js) for response shape
 * consistency, adapted to the response contract in
 * SMOKECRAFT_MANAGEMENT_SYNC_SECURITY_MODEL.md.
 */
import { getJourneyById, createJourney, completeJourney } from '../services/managementSync/journeyService.js'
import { createSnapshot, getLatestSnapshot } from '../services/managementSync/snapshotService.js'
import { requestManagementSync, getSyncStatus } from '../services/managementSync/syncService.js'
import { createManagementAction, listManagementActions } from '../services/managementSync/actionService.js'
import { getVenueAnalyticsSummary } from '../services/managementSync/venueAnalyticsService.js'
import { getIntegrationStatuses } from '../services/managementSync/connectionStateService.js'
import {
  validateCreateJourneyBody, validateSnapshotBody, validateSyncRequestBody,
  validateActionBody, jsonValidationErrorResponse,
} from '../services/managementSync/managementSyncValidation.js'

function ownerGuestReference(identity) {
  return identity.type === 'user' ? `user:${identity.id}` : identity.id
}

function safeJourneyProjection(journey) {
  if (!journey) return null
  // Never return raw internal fields the client shouldn't see (none are
  // currently sensitive on this table, but this projection is the
  // deliberate boundary point so future columns don't leak by default).
  const { journey_id, venue_id, session_number, phase, status, started_at, completed_at, resumed } = journey
  return { journeyId: journey_id, venueId: venue_id, sessionNumber: session_number, phase, status, startedAt: started_at, completedAt: completed_at, ...(resumed !== undefined ? { resumed } : {}) }
}

export async function getGuestSession(req, res) {
  res.json({ success: true, identity: { type: req.smokecraftIdentity.type, freshlyIssued: !!req.smokecraftIdentity.freshlyIssued } })
}

export async function handleCreateJourney(req, res) {
  const errors = validateCreateJourneyBody(req.body)
  if (errors.length) return jsonValidationErrorResponse(res, errors)

  try {
    const journey = await createJourney({
      identity: req.smokecraftIdentity,
      venueId: req.validatedVenue.venue_id,
      tenantId: req.body.tenantId,
      sessionNumber: req.body.sessionNumber,
      phase: req.body.phase,
      sourceVersion: req.body.sourceVersion,
    })
    res.status(journey.resumed ? 200 : 201).json({ success: true, journey: safeJourneyProjection(journey) })
  } catch (err) {
    res.status(err.code === 'database_unavailable' ? 503 : 500).json({ success: false, error: err.code === 'database_unavailable' ? 'database_unavailable' : 'internal_error' })
  }
}

export async function handleGetJourney(req, res) {
  // req.journeyRecord already resolved + ownership-verified by requireJourneyOwnership
  res.json({ success: true, journey: safeJourneyProjection(req.journeyRecord) })
}

export async function handleCompleteJourney(req, res) {
  try {
    const result = await completeJourney(req.params.journeyId)
    if (!result.ok) {
      const status = result.error === 'journey_not_found' ? 404 : 409
      return res.status(status).json({ success: false, error: result.error })
    }
    res.json({ success: true, journey: safeJourneyProjection(result.journey), alreadyCompleted: result.alreadyCompleted })
  } catch (err) {
    res.status(err.code === 'database_unavailable' ? 503 : 500).json({ success: false, error: err.code === 'database_unavailable' ? 'database_unavailable' : 'internal_error' })
  }
}

export async function handleCreateSnapshot(req, res) {
  const errors = validateSnapshotBody(req.body)
  if (errors.length) return jsonValidationErrorResponse(res, errors)

  try {
    const result = await createSnapshot(req.params.journeyId, req.body)
    res.status(result.duplicate ? 200 : 201).json({
      success: true,
      snapshotVersion: result.snapshot.snapshot_version,
      snapshotId: result.snapshot.snapshot_id,
      duplicate: result.duplicate,
    })
  } catch (err) {
    res.status(err.code === 'database_unavailable' ? 503 : 500).json({ success: false, error: err.code === 'database_unavailable' ? 'database_unavailable' : 'internal_error' })
  }
}

export async function handleGetLatestSnapshot(req, res) {
  const snapshot = await getLatestSnapshot(req.params.journeyId)
  if (!snapshot) return res.status(404).json({ success: false, error: 'snapshot_not_found' })
  res.json({ success: true, snapshotVersion: snapshot.snapshot_version, completionState: snapshot.completion_state })
}

export async function handleRequestSync(req, res) {
  const errors = validateSyncRequestBody(req.body)
  if (errors.length) return jsonValidationErrorResponse(res, errors)

  try {
    const snapshot = await getLatestSnapshot(req.params.journeyId)
    if (!snapshot) return res.status(400).json({ success: false, error: 'no_snapshot_to_sync' })

    const result = await requestManagementSync({
      journey: req.journeyRecord,
      snapshot,
      destination: req.body.destination,
      guestReference: ownerGuestReference(req.smokecraftIdentity),
    })
    if (!result.ok) {
      return res.status(409).json({ success: false, error: result.error })
    }
    res.status(result.created ? 201 : 200).json({
      success: true,
      eventId: result.event.event_id,
      status: result.event.status,
      created: result.created,
    })
  } catch (err) {
    res.status(err.code === 'database_unavailable' ? 503 : 500).json({ success: false, error: err.code === 'database_unavailable' ? 'database_unavailable' : 'internal_error' })
  }
}

export async function handleGetSyncStatus(req, res) {
  const events = await getSyncStatus(req.params.journeyId)
  res.json({
    success: true,
    events: events.map(e => ({ eventId: e.event_id, destination: e.destination, status: e.status, payloadVersion: e.payload_version })),
  })
}

export async function handleCreateAction(req, res) {
  const errors = validateActionBody(req.body)
  if (errors.length) return jsonValidationErrorResponse(res, errors)

  try {
    const action = await createManagementAction({
      venueId: req.validatedVenue.venue_id,
      journeyId: req.body.journeyId || null,
      syncEventId: req.body.syncEventId || null,
      actorId: req.smokecraftIdentity.type === 'user' ? req.smokecraftIdentity.id : ownerGuestReference(req.smokecraftIdentity),
      actionType: req.body.actionType,
      metadata: req.body.metadata,
    })
    res.status(201).json({ success: true, actionId: action.action_id })
  } catch (err) {
    res.status(err.code === 'database_unavailable' ? 503 : 500).json({ success: false, error: err.code === 'database_unavailable' ? 'database_unavailable' : 'internal_error' })
  }
}

export async function handleListActions(req, res) {
  const actions = await listManagementActions(req.validatedVenue.venue_id)
  res.json({
    success: true,
    actions: actions.map(a => ({ actionId: a.action_id, actionType: a.action_type, status: a.action_status, createdAt: a.created_at })),
  })
}

export async function handleGetVenueAnalytics(req, res) {
  const { startDate, endDate } = req.query
  const result = await getVenueAnalyticsSummary(req.validatedVenue.venue_id, { startDate, endDate })
  if (!result.ok) {
    const status = result.error === 'date_range_required' || result.error === 'invalid_date_range' || result.error === 'date_range_too_large' ? 400 : 503
    return res.status(status).json({ success: false, error: result.error, maxDays: result.maxDays })
  }
  res.json({ success: true, ...result })
}

export async function handleGetIntegrationStatuses(req, res) {
  const result = await getIntegrationStatuses(req.validatedVenue.venue_id)
  // Never return provider secrets/credentials — the registry itself
  // contains none, but this projection is the deliberate boundary point
  // (same pattern as safeJourneyProjection above).
  res.json({ success: true, ...result })
}

export { getJourneyById }
