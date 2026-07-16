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
import { useNavigate } from 'react-router-dom'
import LockedSmokeCraftScreen from './LockedSmokeCraftScreen.jsx'
import SmokeCraftProgressHeader from './SmokeCraftProgressHeader.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'

export default function SmokeCraftSessionGuard({ sessionNumber, requires, children, hideHeader = false }) {
  const { isSessionUnlocked, isDemoMode, currentAllowed } = useSmokeCraftProgress()
  const { session } = useGuestSession()
  const navigate = useNavigate()

  if (requires) {
    const unlocked = isDemoMode || requires === 'entry' || session.completedSteps.includes(requires)
    if (!unlocked) {
      const resumeRoute = currentAllowed?.route || '/smokecraft'
      // Supporting modules/entry-layer screens are not numbered sessions —
      // no locked-screen art exists for them, so redirect to the guest's
      // actual current position rather than fabricating a lock screen.
      navigate(resumeRoute, { replace: true })
      return null
    }
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
