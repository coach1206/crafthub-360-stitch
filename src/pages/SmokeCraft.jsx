import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../utils/haptics.js'
import SmokeCraftEntryHeaderBand from '../components/smokecraft/SmokeCraftEntryHeaderBand.jsx'
import { SC_ASSETS } from '../constants/smokecraftAssets.js'

const GOLD      = '#E9C176'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

// Landing photo (SC_ASSETS.landing) is a full composite screenshot with baked
// marketing copy — the only genuinely clean sub-region (no baked text/UI) is
// the Padrón cigar + glass close-up in the Recommended Pairing card.
const LANDING_CROP = { x: 733, y: 392, w: 170, h: 140 }
const landingBgSize = `${(1189 / LANDING_CROP.w) * 100}% ${(667 / LANDING_CROP.h) * 100}%`
const landingBgPos = `${(LANDING_CROP.x / (1189 - LANDING_CROP.w)) * 100}% ${(LANDING_CROP.y / (667 - LANDING_CROP.h)) * 100}%`

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

const DESTINATIONS = [
  { label: 'How It Works',    route: '/smokecraft/how-it-works' },
  { label: 'View Passport',   route: '/smokecraft/passport-stamp' },
  { label: 'View Pairing',    route: '/smokecraft/pairing-lab' },
  { label: 'Browse Humidor',  route: '/smokecraft/humidor-match' },
  { label: 'Rankings',        route: '/smokecraft/leaderboard' },
  { label: 'Enter Challenge', route: '/smokecraft/smokecraft-challenge' },
]

export default function SmokeCraft() {
  const navigate = useNavigate()
  const [entryRoute] = useState(getEntryRoute)
  const isReturning = entryRoute === '/smokecraft/resume'

  function go(to) {
    triggerHaptic('light')
    navigate(to)
  }

  function handleStart() {
    triggerHaptic('medium')
    navigate(entryRoute)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)
      `,
      fontFamily: 'Georgia, serif',
    }}>
      <SmokeCraftEntryHeaderBand
        eyebrow="SmokeCraft 360"
        title="The Guided Cigar Experience"
        subtitle="Explore. Learn. Pair. Track every step of your journey."
        image={SC_ASSETS.landing}
        imagePosition={landingBgPos}
        imageSize={landingBgSize}
        overlayStrength={0.85}
      />

      <main style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '20px clamp(16px,4vw,40px) clamp(150px,20vh,190px)',
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <button
            type="button"
            onClick={handleStart}
            style={{
              display: 'block', width: '100%', background: GOLD, color: '#0a0603',
              border: 'none', borderRadius: 28, padding: '18px 24px', fontSize: 16,
              fontWeight: 700, fontFamily: 'Georgia, serif', letterSpacing: '0.06em',
              textTransform: 'uppercase', cursor: 'pointer', minHeight: 56,
              boxShadow: '0 4px 24px rgba(233,193,118,0.4)', touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isReturning ? 'Resume Journey →' : 'Start Journey →'}
          </button>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(233,193,118,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Explore SmokeCraft 360
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {DESTINATIONS.map(d => (
                <button
                  key={d.route}
                  type="button"
                  onClick={() => go(d.route)}
                  style={{
                    background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 14,
                    color: CREAM, fontFamily: 'Georgia, serif', fontSize: 14,
                    padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
                    minHeight: 56, touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GOLD }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = BORDER }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
