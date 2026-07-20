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

export default function SmokeCraftSessionGuard({ sessionNumber, requires, children, hideHeader = false }) {
  const { isSessionUnlocked, isDemoMode, currentAllowed } = useSmokeCraftProgress()
  const { session } = useGuestSession()
  const navigate = useNavigate()

  const requiresUnlocked = requires
    ? (isDemoMode || requires === 'entry' || session.completedSteps.includes(requires))
    : true
  const resumeRoute = currentAllowed?.route || '/smokecraft'

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

  if (requires) {
    if (!requiresUnlocked) return null
    return <>{children}</>
  }

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
