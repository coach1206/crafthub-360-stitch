/**
 * ReturnToGuestButton — fixed button inside POS360 / E.A.T. staff views.
 * When tapped:
 *  1. Triggers ripple dissolve transition
 *  2. Navigates back to saved SmokeCraft guest route
 *  3. Clears handoff metadata
 *
 * Guest progress is never reset — only navigate() is called.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RippleDissolveTransition from '../transitions/RippleDissolveTransition.jsx'
import { loadGuestResumeState, clearGuestResumeState, clearHandoffMeta } from '../../services/staffHandoffResumeService.js'
import { returnFromHandoff } from '../../services/smokecraftHandoffService.js'
import { loadHandoffMeta } from '../../services/staffHandoffResumeService.js'
import { triggerHaptic } from '../../utils/haptics.js'

export default function ReturnToGuestButton({ compact = false }) {
  const navigate = useNavigate()
  const [transitioning, setTransitioning] = useState(false)

  function handleReturn() {
    triggerHaptic('medium')
    setTransitioning(true)

    // Best-effort: notify backend the handoff ended
    const meta = loadHandoffMeta()
    if (meta?.handoffId) {
      returnFromHandoff(meta.handoffId).catch(() => {})
    }
  }

  function onTransitionComplete() {
    const resumeState = loadGuestResumeState()
    const returnRoute = resumeState?.currentRoute || '/smokecraft'
    clearGuestResumeState()
    clearHandoffMeta()
    navigate(returnRoute)
  }

  return (
    <>
      {transitioning && (
        <RippleDissolveTransition active target="smokecraft" onComplete={onTransitionComplete} />
      )}
      <button
        onClick={handleReturn}
        style={compact ? styles.compact : styles.full}
        aria-label="Return to Guest"
      >
        ← Return to Guest
      </button>
    </>
  )
}

const styles = {
  full: {
    position: 'fixed', bottom: 16, right: 16, zIndex: 200,
    background: 'rgba(233,193,118,0.12)', border: '1px solid rgba(233,193,118,0.35)',
    color: '#E9C176', padding: '10px 18px', borderRadius: 22,
    fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
    letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  },
  compact: {
    background: 'rgba(233,193,118,0.08)', border: '1px solid rgba(233,193,118,0.2)',
    color: '#E9C176', padding: '8px 14px', borderRadius: 8,
    fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
  },
}
