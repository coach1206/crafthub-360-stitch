// Journey-visual-sequence-final pass — the single authoritative definition
// of "is this journey complete" and "what percent complete is it", derived
// once from the same completedSteps array VISIT_STRUCTURE already uses
// everywhere else. Landing (SmokeCraft.jsx) and Resume (ResumeJourney.jsx)
// previously computed contradictory answers: Resume derived "complete" from
// a single flag's presence (`completedSteps.includes('session-complete')`)
// while computing completion % from a separate count of real session ids —
// those two numbers could disagree (e.g. "Journey Completed" + "63%"), and
// Landing never checked completion at all, so it could show "Resume
// Journey" for an already-completed journey. Both screens now call this
// one function so they can never contradict each other or themselves.
//
// Live remediation pass — session-count PREFIX rule. `computeCompletedSessionNumbers`
// previously counted any session whose id appeared anywhere in completedSteps,
// with no requirement that earlier sessions were also complete. A legacy
// guest record created before S1 ('entry') became a real, evidence-required
// session (Package N) could have every later session's id recorded (from
// when 'entry' was auto-satisfied) but never 'entry' itself once the schema
// changed. getCurrentAllowedSession (smokecraftJourney.js) already used a
// strict first-gap scan and correctly reported "S1 current" for such a
// record — but this file's old scan-anywhere count still reported ~63%
// complete and Resume's own last-completed-session picker (which took the
// single MAX session number present, not the gated one) still reported
// "S27 last completed". Two contradictory numbers, same underlying record.
// The fix: only count the CONTIGUOUS PREFIX of sessions completed in order,
// stopping at the first gap — the exact same rule getCurrentAllowedSession
// already enforces for unlocking. This makes "last completed session",
// "completion percent", and "current session" three views of one single
// number (the prefix length) that can never disagree, and any later,
// out-of-order completedStep id left over from a legacy record is now
// correctly ignored rather than trusted.
import { VISIT_STRUCTURE, TOTAL_SESSIONS } from './session.js'

function isSessionSatisfied(completedSteps, session) {
  // A session with no built screen yet is treated as satisfied for unlock
  // purposes (see the matching rule in smokecraftJourney.js's isStepComplete)
  // — evidence can never be recorded for a session that does not exist.
  if (session.implemented === false) return true
  return completedSteps.includes(session.id)
}

/** Contiguous prefix only — stops at the first incomplete session, exactly like getCurrentAllowedSession. Any later id present in completedSteps despite an earlier gap is a legacy/impossible state and is ignored, not trusted. */
export function computeCompletedSessionNumbers(completedSteps) {
  const nums = []
  outer:
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (!isSessionSatisfied(completedSteps, s)) break outer
      if (!nums.includes(s.session)) nums.push(s.session)
    }
  }
  return nums
}

export function computeJourneyStatus(completedSteps) {
  const steps = Array.isArray(completedSteps) ? completedSteps : []
  const completedSessionNumbers = computeCompletedSessionNumbers(steps)
  const completedSessionCount = completedSessionNumbers.length
  const completionPercent = Math.round((completedSessionCount / TOTAL_SESSIONS) * 100)
  // Authoritative: a journey is only ever "complete" once every one of the
  // 27 required sessions has actually been completed, in order — never
  // derived from a single terminal-screen flag in isolation, which is what
  // allowed the contradictory "Journey Completed" + "63%" state to occur.
  const isComplete = completedSessionCount === TOTAL_SESSIONS
  const hasStarted = completedSessionCount > 0
  const lastCompletedSessionNumber = completedSessionNumbers.length
    ? completedSessionNumbers[completedSessionNumbers.length - 1]
    : null
  return { completedSessionNumbers, completedSessionCount, completionPercent, isComplete, hasStarted, lastCompletedSessionNumber }
}
