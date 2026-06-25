import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useDemoMode } from '../../context/DemoModeContext.jsx'
import { getVisitForStepId, isVisitUnlocked, VISIT_STRUCTURE } from '../../constants/session.js'
import LockedVisit from '../../pages/smokecraft/LockedVisit.jsx'
import DemoModeBanner from './DemoModeBanner.jsx'

function isSessionComplete(completedSteps, sessionId) {
  return sessionId === 'entry' ? true : completedSteps.includes(sessionId)
}

/**
 * Returns true if every session earlier than `stepId` (by global session
 * number across all 24 sessions) has been completed. This enforces ordering
 * *within* an already-unlocked visit, since isVisitUnlocked() alone only
 * checks that the previous visit finished — it does not stop a guest from
 * jumping straight to, say, 'connections' before 'passport-stamp' within
 * the same unlocked visit.
 */
function arePriorSessionsComplete(completedSteps, stepId) {
  const target = getVisitForStepId(stepId)
  if (!target) return true
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (s.session >= target.session) continue
      if (!isSessionComplete(completedSteps, s.id)) return false
    }
  }
  return true
}

/**
 * Wraps a SmokeCraft session page and locks it until the visit containing
 * `stepId` is unlocked AND all earlier sessions (by global order) are done.
 * In demo mode, the lock is bypassed entirely so reviewers can preview any
 * page, but a small banner makes clear progression isn't being saved.
 */
export default function VisitLockGuard({ stepId, children }) {
  const { session } = useGuestSession()
  const { isDemoMode } = useDemoMode()
  const completedSteps = session?.completedSteps || []

  const visitInfo = getVisitForStepId(stepId)
  const unlocked = visitInfo
    ? isVisitUnlocked(completedSteps, visitInfo.visit) && arePriorSessionsComplete(completedSteps, stepId)
    : true

  if (unlocked) return children

  if (isDemoMode) {
    return (
      <>
        <DemoModeBanner />
        {children}
      </>
    )
  }

  return <LockedVisit stepId={stepId} />
}
