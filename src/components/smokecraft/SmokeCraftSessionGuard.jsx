/**
 * SmokeCraftSessionGuard
 *
 * Wraps a SmokeCraft session page. If the session is locked (prior sessions
 * not complete or visit not yet unlocked), renders LockedSmokeCraftScreen.
 * If unlocked, renders children with SmokeCraftProgressHeader overlaid.
 *
 * In demo mode all locks are bypassed (isDemoMode → always render children).
 *
 * Props:
 *   sessionNumber   — 1–24 global session number (required)
 *   children        — the session page content
 *   hideHeader      — set true to suppress the progress header (e.g. for S1)
 */
import LockedSmokeCraftScreen from './LockedSmokeCraftScreen.jsx'
import SmokeCraftProgressHeader from './SmokeCraftProgressHeader.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'

export default function SmokeCraftSessionGuard({ sessionNumber, children, hideHeader = false }) {
  const { isSessionUnlocked, isDemoMode } = useSmokeCraftProgress()

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
