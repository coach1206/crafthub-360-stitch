import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../constants/smokecraftAssets.js'
import { PRESERVED_COMPLETED_STEP_IDS } from './smokecraft/ResumeJourney.jsx'

const NAT_W = 1189
const NAT_H = 667
const GOLD = '#E9C176'

// Read a guest session step from novee_guest_session.completedSteps
function guestStepDone(stepId) {
  try {
    const s = JSON.parse(localStorage.getItem('novee_guest_session') || 'null')
    return Array.isArray(s?.completedSteps) && s.completedSteps.includes(stepId)
  } catch { return false }
}

// Root-cause fix: the Landing CTA previously labeled itself "Resume Journey"
// merely because the visitor had completed Entry-layer state (enroll +
// venue selection) — i.e. whenever getEntryRoute() below would hand off to
// /smokecraft/resume. That is not real resumable progress; it only means
// the visitor is ready to see the Resume/Start-New decision screen. The one
// canonical definition of "real journey progress" already exists on that
// screen (ResumeJourney.jsx's hasProgress check) — reused here verbatim so
// the two screens can never disagree about what counts as resumable.
function hasRealJourneyProgress() {
  try {
    const s = JSON.parse(localStorage.getItem('novee_guest_session') || 'null')
    const completedSteps = Array.isArray(s?.completedSteps) ? s.completedSteps : []
    return completedSteps.some(id => !PRESERVED_COMPLETED_STEP_IDS.includes(id))
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

// Real, visible button rendered opaque over the baked "START SMOKECRAFT"
// zone — its label is dynamic (Start vs Resume), so the baked pixel text
// underneath must be fully covered, never left visible alongside live text.
function PrimaryHotspot({ label, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'absolute',
        background: `linear-gradient(180deg, #F3D48E, ${GOLD})`,
        color: '#241605',
        border: 'none',
        borderRadius: 999,
        fontFamily: 'Georgia, serif',
        fontWeight: 700,
        fontSize: 'clamp(13px, 1.6vw, 18px)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        pointerEvents: 'auto',
        boxShadow: '0 4px 18px rgba(233,193,118,0.45)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {label}
    </button>
  )
}

// Transparent-at-rest control over a static baked button/link whose label
// never changes — the approved artwork already renders it correctly, so we
// preserve that pixel-perfect look at idle and add a real, visible
// interactive affordance (gold focus/hover ring) rather than an invisible
// hotspot with no discoverable state.
function StaticHotspot({ label, onClick, style, shape = 'rect' }) {
  const [active, setActive] = useState(false)
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={{
        position: 'absolute',
        background: active ? 'rgba(233,193,118,0.10)' : 'transparent',
        border: active ? `1.5px solid ${GOLD}` : '1.5px solid transparent',
        borderRadius: shape === 'pill' ? 999 : 8,
        boxShadow: active ? '0 0 0 3px rgba(233,193,118,0.18)' : 'none',
        padding: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
    >
      <span style={{
        position: 'absolute', width: 1, height: 1, overflow: 'hidden',
        clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
      }}>{label}</span>
    </button>
  )
}

export default function SmokeCraft() {
  const navigate = useNavigate()
  const [entryRoute] = useState(getEntryRoute)
  // "Resume Journey" must require real progress beyond Entry-layer state —
  // never shown merely because entryRoute happens to be the Resume screen.
  const [isReturning] = useState(() => entryRoute === '/smokecraft/resume' && hasRealJourneyProgress())

  function go(to) {
    triggerHaptic('light')
    navigate(to)
  }

  function handleStart() {
    triggerHaptic('medium')
    navigate(entryRoute)
  }

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.landing}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 — The Guided Cigar Experience"
      bottomOffset={0}
    >
      {/* Baked: START SMOKECRAFT button — dynamic label, must fully occlude baked text */}
      <PrimaryHotspot
        label={isReturning ? 'Resume Journey →' : 'Start Journey →'}
        onClick={handleStart}
        style={{ left: '3.4%', top: '56.4%', width: '21.5%', height: '6.4%' }}
      />

      {/* Baked: HOW IT WORKS button */}
      <StaticHotspot
        label="How It Works"
        onClick={() => go('/smokecraft/how-it-works')}
        style={{ left: '26.7%', top: '56.4%', width: '17.7%', height: '6.4%' }}
        shape="pill"
      />

      {/* Baked: VIEW PASSPORT link in the 360 Passport card */}
      <StaticHotspot
        label="View Passport"
        onClick={() => go('/smokecraft/passport-stamp')}
        style={{ left: '80.7%', top: '40.5%', width: '16.0%', height: '6.0%' }}
      />

      {/* Baked: VIEW PAIRING link in the Recommended Pairing card */}
      <StaticHotspot
        label="View Pairing"
        onClick={() => go('/smokecraft/pairing-lab')}
        style={{ left: '78.6%', top: '73.2%', width: '17.7%', height: '6.3%' }}
      />

      {/* Bottom bar: REWARDS → Browse Humidor */}
      <StaticHotspot
        label="Browse Humidor"
        onClick={() => go('/smokecraft/humidor-match')}
        style={{ left: '1.35%', top: '82.2%', width: '24.3%', height: '17.7%' }}
      />

      {/* Bottom bar: RANKINGS */}
      <StaticHotspot
        label="Rankings"
        onClick={() => go('/smokecraft/leaderboard')}
        style={{ left: '25.65%', top: '82.2%', width: '24.3%', height: '17.7%' }}
      />

      {/* Bottom bar: PASSPORT → View Passport */}
      <StaticHotspot
        label="View Passport (bottom bar)"
        onClick={() => go('/smokecraft/passport-stamp')}
        style={{ left: '49.96%', top: '82.2%', width: '24.3%', height: '17.7%' }}
      />

      {/* Bottom bar: CRAFTHUB → Enter Challenge */}
      <StaticHotspot
        label="Enter Challenge"
        onClick={() => go('/smokecraft/smokecraft-challenge')}
        style={{ left: '74.3%', top: '82.2%', width: '24.3%', height: '17.7%' }}
      />
    </SmokeCraftImageBoundsOverlay>
  )
}
