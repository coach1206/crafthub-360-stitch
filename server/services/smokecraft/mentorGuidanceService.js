/**
 * Holistic Fix 5B-2A — server-authoritative, context-aware mentor
 * guidance service. Never accepts a client-submitted guidance message,
 * score, or "achievement" — every signal used (progress, quiz, tasting,
 * pairing, skill gaps) is independently re-derived from the guest's own
 * real server records. Never awards XP/badges/stamps and never changes
 * any score — this service is read-only guidance, nothing else.
 *
 * Mentor identity (the roster: id/name/country/bio/tags/greeting) is
 * dual-imported from src/modules/smokecraft/smokeCraftMentors.js — the
 * one existing, already-approved mentor roster — never a second,
 * competing mentor definition.
 */
import { getDb } from '../../db/connection.js'
import { getPlayerState } from './playerStateService.js'
import { recalculate as recalculateSkillTree } from './skillTreeService.js'
import { MENTORS, getMentorById } from '../../../src/modules/smokecraft/smokeCraftMentors.js'

export class MentorGuidanceError extends Error {
  constructor(code) { super(code); this.code = code }
}

// Bumped whenever the guidance-composition logic changes meaningfully —
// returned on every response so a caller/consumer can tell whether two
// guidance results came from the same rule version.
export const GUIDANCE_VERSION = 1

export function listMentors() {
  return MENTORS
}

/**
 * Composes one guidance response for a given mentor + screen, using
 * ONLY real, independently-fetched signals for this guest — never a
 * client-submitted quiz/tasting/pairing result. `screenContext` is a
 * plain routing/display label (e.g. 'skill-tree', 'mentor-commentary'),
 * not evidence, and never changes the guidance's underlying facts.
 */
export async function getGuidance({ guestReference, mentorId, screenContext }) {
  const mentor = getMentorById(mentorId)
  if (!mentor) throw new MentorGuidanceError('mentor_not_selected')

  const db = getDb()
  const [playerState, skillTreeResults, pairingRow, quizRow, tastingRow] = await Promise.all([
    getPlayerState(guestReference),
    recalculateSkillTree(guestReference).catch(() => []),
    db.query(`SELECT pairing_type, compat_score, updated_at FROM smokecraft_pairing_saves WHERE guest_reference = $1 ORDER BY updated_at DESC LIMIT 1`, [guestReference]).then(r => r.rows[0] || null),
    db.query(`SELECT activity_key, score, total, created_at FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'quiz' ORDER BY created_at DESC LIMIT 1`, [guestReference]).then(r => r.rows[0] || null),
    db.query(`SELECT activity_key, score, total, created_at FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'tasting' ORDER BY created_at DESC LIMIT 1`, [guestReference]).then(r => r.rows[0] || null),
  ])

  const completedNodes = skillTreeResults.filter(r => r.learnerState.state === 'completed')
  const nextGap = skillTreeResults.find(r => r.learnerState.state === 'available')

  const firstName = mentor.name.split(' ').slice(-1)[0]
  let message, reason, nextAction, sourceContext, confidence

  // Priority order for which real signal drives the message: the most
  // recent, most specific real evidence wins. Never fabricates any
  // signal that doesn't exist — falls through to the mentor's own real
  // roster bio/greeting (an honest "fallback" state) when nothing else
  // is available.
  if (pairingRow) {
    message = `${firstName} noticed your last pairing (${pairingRow.pairing_type}) scored ${pairingRow.compat_score}/100. ${pairingRow.compat_score >= 70 ? 'That is a genuinely strong match — trust that combination.' : 'There is real room to sharpen that pairing — try adjusting your flavor notes.'}`
    reason = `Based on your most recent real saved pairing (${pairingRow.pairing_type}, ${new Date(pairingRow.updated_at).toISOString()}).`
    nextAction = pairingRow.compat_score >= 70 ? 'Save this pairing as a favorite and try a contrasting one next.' : 'Revisit Pairing Recommendations and try a different beverage category.'
    sourceContext = 'pairing_result'
    confidence = 0.85
  } else if (quizRow) {
    const pct = quizRow.total > 0 ? Math.round((quizRow.score / quizRow.total) * 100) : null
    message = pct !== null
      ? `${firstName} reviewed your knowledge check on ${quizRow.activity_key}: ${quizRow.score}/${quizRow.total} correct. ${pct >= 80 ? 'Strong grasp of the material.' : 'A little more review here will help.'}`
      : `${firstName} sees you've attempted the ${quizRow.activity_key} knowledge check.`
    reason = `Based on your most recent real knowledge-check attempt (${quizRow.activity_key}).`
    nextAction = pct !== null && pct < 80 ? `Revisit the ${quizRow.activity_key} material before moving on.` : 'Continue to the next session.'
    sourceContext = 'quiz_result'
    confidence = 0.8
  } else if (tastingRow) {
    message = `${firstName} sees you completed a tasting session (${tastingRow.activity_key}).`
    reason = `Based on your most recent real tasting completion (${tastingRow.activity_key}).`
    nextAction = 'Compare this tasting against your Passport history for patterns.'
    sourceContext = 'tasting_result'
    confidence = 0.75
  } else if (nextGap) {
    message = `${firstName} suggests focusing on ${nextGap.node.display_title} next — ${nextGap.reason}`
    reason = `Based on your real Skill Tree progress (${completedNodes.length}/${skillTreeResults.length} nodes completed).`
    nextAction = `Open ${nextGap.node.display_title} in the Skill Tree.`
    sourceContext = 'skill_gap'
    confidence = 0.7
  } else if (playerState.xpTotal > 0) {
    message = `${firstName} sees you've earned ${playerState.xpTotal} XP so far${playerState.rankLabel ? ` as a ${playerState.rankLabel}` : ''}. Keep going.`
    reason = 'Based on your real total server-recorded XP and rank.'
    nextAction = 'Continue your journey to the next session.'
    sourceContext = 'progress_summary'
    confidence = 0.6
  } else {
    message = mentor.greeting
    reason = `${firstName} hasn't seen any real activity from you yet — this is their standing introduction.`
    nextAction = 'Begin your first real session to receive personalized guidance.'
    sourceContext = 'mentor_bio'
    confidence = 0.3
  }

  return {
    mentorId: mentor.id,
    mentorName: mentor.name,
    mentorCountry: mentor.country,
    mentorFlag: mentor.flag,
    screenContext: screenContext || null,
    message,
    reason,
    nextAction,
    sourceContext,
    confidence,
    messageVersion: GUIDANCE_VERSION,
    isFallback: sourceContext === 'mentor_bio',
  }
}
