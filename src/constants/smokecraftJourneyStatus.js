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
import { VISIT_STRUCTURE, TOTAL_SESSIONS } from './session.js'

export function computeCompletedSessionNumbers(completedSteps) {
  const nums = []
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (completedSteps.includes(s.id) && !nums.includes(s.session)) nums.push(s.session)
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
  // 27 required sessions has actually been completed — never derived from
  // a single terminal-screen flag in isolation, which is what allowed the
  // contradictory "Journey Completed" + "63%" state to occur.
  const isComplete = completedSessionCount === TOTAL_SESSIONS
  const hasStarted = completedSessionCount > 0
  return { completedSessionNumbers, completedSessionCount, completionPercent, isComplete, hasStarted }
}
