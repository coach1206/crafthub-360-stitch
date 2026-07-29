/**
 * Holistic Fix 5C-1A — canonical Challenge Hub scoring events, shared
 * by every challenge type (Daily/Weekly progress challenges via
 * challengeHubService.js, Blend Fault Identification via
 * blendFaultService.js) so all challenge activity produces the same
 * auditable event vocabulary regardless of its own domain-specific
 * event types. Thin wrapper over the existing, already-idempotent
 * progressionEventService.recordEvent() — not a second, competing
 * event log.
 */
import { recordEvent } from './progressionEventService.js'

export const CANONICAL_CHALLENGE_EVENT_TYPES = [
  'challenge_started', 'challenge_submitted', 'challenge_scored', 'challenge_completed',
]

/**
 * Records one canonical challenge event. Every event carries: learner
 * identity (guestReference), challenge ID, attempt ID, evidence
 * reference, rule ID/version, score result, reward result, an
 * idempotency key (caller-supplied, unique per real occurrence — a
 * duplicate call is a silent no-op via recordEvent's own UNIQUE
 * constraint), an audit ID (the real event row id), and a server
 * timestamp (the real DB-assigned created_at, never client-supplied).
 */
export async function recordChallengeEvent({
  guestReference, sourceScreen, sourceRoute, eventType,
  challengeId, attemptId, evidenceReference, ruleId, ruleVersion,
  scoreResult, rewardResult, idempotencyKey,
}) {
  if (!CANONICAL_CHALLENGE_EVENT_TYPES.includes(eventType)) {
    throw new Error(`non_canonical_challenge_event_type:${eventType}`)
  }
  const { event, deduplicated } = await recordEvent({
    guestReference, sourceScreen, sourceRoute, eventType,
    payload: {
      challengeId, attemptId, evidenceReference: evidenceReference ?? null,
      ruleId: ruleId ?? null, ruleVersion: ruleVersion ?? null,
      scoreResult: scoreResult ?? null, rewardResult: rewardResult ?? null,
    },
    idempotencyKey,
  })
  return { auditId: event.id, serverTimestamp: event.created_at, deduplicated }
}
