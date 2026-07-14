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

// Ordered resume steps starting from identity (enroll is handled separately as
// the no-key-in-storage default). Each entry: route to send the user to when
// that step has NOT yet been completed.
const RESUME_SEQUENCE = [
  { route: '/smokecraft/identity',         done: j => !!(j.identity?.preferredName || j.identity?.fullName) },
  { route: '/smokecraft/golden-box',       done: j => !!j.selectedCigar },
  { route: '/smokecraft/mentor-selection', done: j => !!j.mentor },
  { route: '/smokecraft/format',           done: j => !!j.format },
  { route: '/smokecraft/seed-soil',        done: j => !!j.pairing },
  { route: '/smokecraft/pairing-lab',      done: j => !!j.pairing?.primary },
  { route: '/smokecraft/humidor-match',    done: j => !!j.selectedCigar?.name },
  { route: '/smokecraft/request-purchase', done: j => !!j.requestPurchase },
  { route: '/smokecraft/cut-toast-light',  done: j => !!j.cutToastLight },
  { route: '/smokecraft/first-third',      done: j => !!j.flavorMemory },
  { route: '/smokecraft/second-third',     done: j => Array.isArray(j.flavorMemory?.selectedFlavors) && j.flavorMemory.selectedFlavors.length >= 2 },
  { route: '/smokecraft/flavor-memory',    done: j => Array.isArray(j.flavorMemory?.selectedFlavors) && j.flavorMemory.selectedFlavors.length >= 3 },
  { route: '/smokecraft/final-third',      done: j => !!j.flavorMemory?.intensity },
  { route: '/smokecraft/scorecard',        done: j => !!j.flavorMemory?.body },
  { route: '/smokecraft/final-review',     done: j => !!j.flavorMemory?.strength },
  { route: '/smokecraft/passport-stamp',   done: j => !!j.flavorMemory?.notes },
  { route: '/smokecraft/connections',      done: () => { try { const c = JSON.parse(localStorage.getItem('sc_connections_v1') || '[]'); return Array.isArray(c) && c.length > 0 } catch { return false } } },
  { route: '/smokecraft/management-sync',  done: () => guestStepDone('management-sync') },
  { route: '/smokecraft/session-complete', done: () => guestStepDone('session-complete') },
]

function getResumeRoute() {
  try {
    const raw = localStorage.getItem('sc_journey_v1')
    // No stored journey key → brand new session → enroll
    if (!raw) return '/smokecraft/enroll'
    const j = JSON.parse(raw)
    // Missing or corrupt stateVersion → enroll
    if (!j || !j.stateVersion) return '/smokecraft/enroll'
    // Find the first step not yet completed
    for (const step of RESUME_SEQUENCE) {
      if (!step.done(j)) return step.route
    }
    // All 20 steps complete → fresh start
    return '/smokecraft/enroll'
  } catch {
    return '/smokecraft/enroll'
  }
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
    navigate(getResumeRoute())
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
