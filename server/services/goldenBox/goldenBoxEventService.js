/**
 * Holistic Fix 5C-1B — canonical Golden Box submission-lifecycle
 * events. Reuses the existing, already-idempotent
 * smokecraft_progression_events log (the same shared ledger every
 * SmokeCraft system already writes to — Filler Arrangement, Skill
 * Tree, Collections, Challenge Hub, Blend Fault) rather than creating
 * a second, competing event log. Golden Box's own
 * golden_box_activity_log (activityLogService.js) remains the
 * detailed, admin-facing audit trail; this is the smaller, canonical
 * event set the mandate specifically requires.
 */
import { recordEvent } from '../smokecraft/progressionEventService.js'

export const CANONICAL_GOLDEN_BOX_EVENT_TYPES = [
  'golden_box_draft_created', 'golden_box_draft_updated',
  'golden_box_submission_requested', 'golden_box_submitted',
]

/**
 * Records one canonical Golden Box event. Every event carries: learner
 * identity (guestReference), entry ID, draft/version ID, a rule
 * ID/version (currently the submission-validation rule, versioned as
 * the schema's requiredTypes list — see entryService.js), an
 * idempotency key (a duplicate call is a silent no-op via
 * recordEvent's own UNIQUE constraint), an audit ID (the real event
 * row id), and a server timestamp (the real DB-assigned created_at).
 */
export async function recordGoldenBoxEvent({
  guestReference, sourceScreen, sourceRoute, eventType,
  entryId, versionId, ruleVersion, result, idempotencyKey,
}) {
  if (!CANONICAL_GOLDEN_BOX_EVENT_TYPES.includes(eventType)) {
    throw new Error(`non_canonical_golden_box_event_type:${eventType}`)
  }
  const { event, deduplicated } = await recordEvent({
    guestReference, sourceScreen, sourceRoute, eventType,
    payload: { entryId, versionId: versionId ?? null, ruleVersion: ruleVersion ?? null, result: result ?? null },
    idempotencyKey,
  })
  return { auditId: event.id, serverTimestamp: event.created_at, deduplicated }
}
