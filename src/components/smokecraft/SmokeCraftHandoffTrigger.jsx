/**
 * SmokeCraftHandoffTrigger — discreet staff handoff button for SmokeCraft screens.
 *
 * Sits as a small fixed dot (hidden from guests). When tapped, shows choices:
 *   Switch to E.A.T. | Switch to POS360
 * Then saves guest resume state and navigates to /staff/pin?target=...
 *
 * Never exposes staff tools casually. Requires deliberate double-tap to reveal.
 * Does NOT modify sealed SmokeCraft asset screens.
 */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { saveGuestResumeState, saveHandoffMeta } from '../../services/staffHandoffResumeService.js'
import { startHandoff } from '../../services/smokecraftHandoffService.js'
import { triggerHaptic } from '../../utils/haptics.js'

export default function SmokeCraftHandoffTrigger({ allowEAT = true, allowPOS360 = true }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useGuestSession()
  const { currentVisit, currentSession } = useSmokeCraftProgress()

  const [revealed, setRevealed] = useState(false)

  async function triggerHandoff(target) {
    triggerHaptic('medium')
    setRevealed(false)

    // Save full guest resume state
    const resumeState = saveGuestResumeState(session, {
      currentRoute:      location.pathname,
      currentVisit,
      currentSession,
      venueId:           'novee-grand-lounge',
      handoffTarget:     target,
    })

    // Save handoff meta for PIN screen
    saveHandoffMeta({ target, startRoute: location.pathname })

    // Persist handoff event to backend (non-blocking, best-effort)
    startHandoff({
      guestSessionId: session?.sessionId || 'guest',
      venueId:        'novee-grand-lounge',
      target:         target === 'pos360' ? 'pos360' : 'eat',
      startRoute:     location.pathname,
      returnRoute:    location.pathname,
      currentVisit,
      currentSession,
    }).catch(() => {})

    navigate(`/staff/pin?target=${target}`)
  }

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        aria-label="Staff handoff"
        style={styles.dot}
      >
        ●
      </button>
    )
  }

  return (
    <div style={styles.panel}>
      <div style={styles.panelTitle}>Staff Access</div>
      {allowEAT && (
        <button onClick={() => triggerHandoff('eat')} style={styles.choice}>
          Switch to E.A.T.
        </button>
      )}
      {allowPOS360 && (
        <button onClick={() => triggerHandoff('pos360')} style={styles.choice}>
          Switch to POS360
        </button>
      )}
      <button onClick={() => setRevealed(false)} style={styles.cancel}>Cancel</button>
    </div>
  )
}

const G = '#E9C176'
const styles = {
  dot: {
    position: 'fixed', bottom: 14, left: 14, zIndex: 150,
    width: 30, height: 30, borderRadius: '50%',
    background: 'rgba(10,6,3,0.5)', border: '1px solid rgba(233,193,118,0.15)',
    color: 'rgba(233,193,118,0.3)', fontSize: 9, cursor: 'pointer',
    fontFamily: '"JetBrains Mono", monospace',
  },
  panel: {
    position: 'fixed', bottom: 14, left: 14, zIndex: 150,
    background: 'rgba(14,10,6,0.97)', border: `1px solid rgba(233,193,118,0.25)`,
    borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    minWidth: 180,
  },
  panelTitle: {
    fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
    letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.45)',
    marginBottom: 4,
  },
  choice: {
    padding: '10px 14px', background: 'rgba(233,193,118,0.08)',
    border: `1px solid rgba(233,193,118,0.25)`, borderRadius: 8,
    color: G, fontFamily: '"Georgia", serif', fontSize: 13,
    cursor: 'pointer', textAlign: 'left',
  },
  cancel: {
    padding: '8px 14px', background: 'none',
    border: '1px solid rgba(233,193,118,0.1)', borderRadius: 8,
    color: 'rgba(233,193,118,0.4)', fontFamily: '"JetBrains Mono", monospace',
    fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer',
  },
}
