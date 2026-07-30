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
  // Holistic Fix 5C-2A — judge-assignment and scorecard-scoring events.
  // Keyed by the JUDGE's own identity (guestReference = `user:${judgeUserId}`),
  // not the entrant's — these describe judging activity, not learner
  // progress, but reuse the exact same canonical-event mechanism (never
  // a second, competing event log).
  'golden_box_judge_assigned', 'golden_box_scorecard_draft_saved',
  'golden_box_scorecard_submitted', 'golden_box_entry_scored',
  // Holistic Fix 5C-2B-1 — results aggregation and final ranking
  // events. Keyed by the ENTRANT's identity (guestReference — same
  // identity createEntry/submitEntry already use for this entry), since
  // these describe the entry's own results/ranking outcome.
  'golden_box_results_calculated', 'golden_box_ranking_finalized',
  // Holistic Fix 5C-2B-2 — award-issuance events. Also keyed by the
  // entrant's identity. golden_box_xp_awarded/_badge_unlocked/
  // _passport_stamp_awarded are only ever emitted when a real grant
  // actually happens through the canonical xpService/passport360
  // services — never fabricated for an unavailable (no approved rule)
  // reward type.
  'golden_box_awards_issued', 'golden_box_xp_awarded',
  'golden_box_badge_unlocked', 'golden_box_passport_stamp_awarded',
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
