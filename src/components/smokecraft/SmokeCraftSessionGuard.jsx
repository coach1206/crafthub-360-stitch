/**
 * SmokeCraftSessionGuard
 *
 * Wraps a SmokeCraft page. If locked, renders LockedSmokeCraftScreen. If
 * unlocked, renders children with SmokeCraftProgressHeader overlaid (unless
 * hideHeader/requires is set).
 *
 * In demo mode all locks are bypassed (isDemoMode → always render children).
 *
 * Props (exactly one of sessionNumber / requires should be given):
 *   sessionNumber — 1–27 numbered main-journey spine position (Package J).
 *                   Unlocked once every earlier spine session is complete.
 *   requires      — a specific prerequisite completedStep id, for supporting
 *                   modules and entry-layer screens that sit outside the
 *                   numbered spine (Package J) — unlocked once that one id
 *                   is present in completedSteps. No progress header is
 *                   shown for these (they are not numbered sessions).
 *   children      — the page content
 *   hideHeader    — set true to suppress the progress header (e.g. for S1)
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LockedSmokeCraftScreen from './LockedSmokeCraftScreen.jsx'
import SmokeCraftProgressHeader from './SmokeCraftProgressHeader.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { getSmokeCraftEntryReadiness } from '../../constants/smokecraftEntryReadiness.js'

export default function SmokeCraftSessionGuard({ sessionNumber, requires, children, hideHeader = false, enforceEntryReadiness = true }) {
  const { isSessionUnlocked, isDemoMode, currentAllowed } = useSmokeCraftProgress()
  const { session } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const requiresUnlocked = requires
    ? (isDemoMode || requires === 'entry' || session.completedSteps.includes(requires))
    : true
  const resumeRoute = currentAllowed?.route || '/smokecraft'

  // Emergency Remediation Continuation: Entry-Prerequisite Guard pass — the
  // canonical numbered spine's own guard (sessionNumber, below) enforces
  // "session N requires session N-1 complete," which is trivially satisfied
  // for session 1 (nothing earlier to require). This meant a fresh, direct
  // deep link to a sessionNumber=1 route (Welcome) could render without
  // ever passing through Enrollment/Venue Selection. Every sessionNumber
  // guard now also checks the shared entry-readiness contract — real
  // account-level prerequisites (enrollment, venue) that sit entirely
  // outside the numbered spine's own "prior session" logic, so they were
  // never covered by isSessionUnlocked() at all. See
  // src/constants/smokecraftEntryReadiness.js for the full contract and
  // docs/audits/smokecraft-final-completion/entry-prerequisite-remediation/
  // for the disclosed scope decisions.
  const entryReadiness = getSmokeCraftEntryReadiness(session, journey)
  const entryBlocked = !!sessionNumber && enforceEntryReadiness && !isDemoMode && !entryReadiness.readyForWelcome

  // Production-readiness pass — navigate() was previously called directly
  // during render (inside the `if (requires)` branch below), which is the
  // exact cause of React's real "Cannot update a component while rendering
  // a different component" warning (confirmed by the route crawler on
  // every single route). Navigation during render is deferred to an
  // effect instead — same redirect behavior, no render-phase side effect,
  // and the hook is called unconditionally per the Rules of Hooks.
  useEffect(() => {
    if (requires && !requiresUnlocked) navigate(resumeRoute, { replace: true })
  }, [requires, requiresUnlocked, resumeRoute]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (entryBlocked && entryReadiness.redirectRoute) navigate(entryReadiness.redirectRoute, { replace: true })
  }, [entryBlocked, entryReadiness.redirectRoute]) // eslint-disable-line react-hooks/exhaustive-deps

  if (requires) {
    if (!requiresUnlocked) return null
    return <>{children}</>
  }

  // Render nothing (never a flash of protected content) while the
  // entry-prerequisite redirect above is in flight.
  if (entryBlocked) return null

  const unlocked = isDemoMode || isSessionUnlocked(sessionNumber)

  if (!unlocked) {
    return <LockedSmokeCraftScreen sessionNumber={sessionNumber} />
  }

  return (
    <>
      {!hideHeader && <SmokeCraftProgressHeader sessionNumber={sessionNumber} />}
      {children}
    </>
  )
}
