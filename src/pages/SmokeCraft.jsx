import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../constants/smokecraftAssets.js'

const NAT_W = 1189
const NAT_H = 667

// Read a guest session step from novee_guest_session.completedSteps
function guestStepDone(stepId) {
  try {
    const s = JSON.parse(localStorage.getItem('novee_guest_session') || 'null')
    return Array.isArray(s?.completedSteps) && s.completedSteps.includes(stepId)
  } catch { return false }
}

// Root-cause fix: this Launch screen previously computed its own private,
// stale resume sequence (old route ids, wrong order vs. the authoritative
// 27-session registry) and jumped straight into a mid-journey route,
// entirely bypassing the real Entry Layer (Sign In/Guest → Venue Selection →
// Personal Dashboard → Resume-or-Start, ENTRY_LAYER_SCREENS in session.js).
// The correct behavior is to hand off to that already-built chain and let
// each screen's own guard/logic decide what's next — never to silently
// resume mid-journey from the Launch screen itself.
function getEntryRoute() {
  if (!guestStepDone('enroll')) return '/smokecraft/enroll'
  try {
    const raw = localStorage.getItem('sc_journey_v1')
    const j = raw ? JSON.parse(raw) : null
    if (!j?.selectedVenue && !j?.venueSelectionCompleted) return '/smokecraft/venue-select'
  } catch {
    return '/smokecraft/venue-select'
  }
  // Identity + venue are set — hand off to Resume/Start New, which requires
  // the visitor to deliberately choose (never auto-resumes on its own).
  return '/smokecraft/resume'
}

// Screen-reader-only text — visible to Playwright hasText, invisible on screen
const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
}

// Transparent hotspot overlay aligned to a printed image region
function Hotspot({ label, onClick, style }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        position: 'absolute',
        background: 'transparent',
        border: '2px solid transparent',
        borderRadius: 4,
        padding: 0,
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',
        ...style,
      }}
    >
      <span style={srOnly}>{label}</span>
    </button>
  )
}

export default function SmokeCraft() {
  const navigate = useNavigate()

  function go(to) {
    triggerHaptic('light')
    navigate(to)
  }

  function handleStartSmokeCraft() {
    triggerHaptic('medium')
    navigate(getEntryRoute())
  }

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.landing}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 — The Guided Cigar Experience"
    >
      {/* Printed: START SMOKECRAFT button (gold bordered, left side) */}
      <Hotspot
        label="Start SmokeCraft"
        onClick={handleStartSmokeCraft}
        style={{ left: '2.9%', top: '54.3%', width: '27.4%', height: '9.9%' }}
      />

      {/* Printed: HOW IT WORKS button (outlined, next to Start) */}
      <Hotspot
        label="How It Works"
        onClick={() => go('/smokecraft/how-it-works')}
        style={{ left: '30.7%', top: '54.3%', width: '21.5%', height: '9.9%' }}
      />

      {/* Printed: VIEW PASSPORT link in the 360 Passport card (top-right) */}
      <Hotspot
        label="View Passport"
        onClick={() => go('/smokecraft/passport-stamp')}
        style={{ left: '58.2%', top: '39.6%', width: '39.8%', height: '6.9%' }}
      />

      {/* Printed: VIEW PAIRING link in the Recommended Pairing card (right) */}
      <Hotspot
        label="View Pairing"
        onClick={() => go('/smokecraft/pairing-lab')}
        style={{ left: '58.2%', top: '69%', width: '39.8%', height: '7.5%' }}
      />

      {/* Bottom bar: REWARDS → Browse Humidor */}
      <Hotspot
        label="Browse Humidor"
        onClick={() => go('/smokecraft/humidor-match')}
        style={{ left: '0%', top: '83.5%', width: '25%', height: '16.5%' }}
      />

      {/* Bottom bar: RANKINGS */}
      <Hotspot
        label="Rankings"
        onClick={() => go('/smokecraft/leaderboard')}
        style={{ left: '25%', top: '83.5%', width: '25%', height: '16.5%' }}
      />

      {/* Bottom bar: PASSPORT → My Passport */}
      <Hotspot
        label="My Passport"
        onClick={() => go('/smokecraft/passport-stamp')}
        style={{ left: '50%', top: '83.5%', width: '25%', height: '16.5%' }}
      />

      {/* Bottom bar: CRAFTHUB → Enter Challenge */}
      <Hotspot
        label="Enter Challenge"
        onClick={() => go('/smokecraft/smokecraft-challenge')}
        style={{ left: '75%', top: '83.5%', width: '25%', height: '16.5%' }}
      />
    </SmokeCraftImageBoundsOverlay>
  )
}
