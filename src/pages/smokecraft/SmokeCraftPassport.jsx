import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { computeJourneyStatus } from '../../constants/smokecraftJourneyStatus.js'
import { TOTAL_SESSIONS } from '../../constants/session.js'

const NAT_W = 1672
const NAT_H = 941
const GOLD = '#E9C176'
const CREAM = '#e5e2e1'

/**
 * SmokeCraftPassport — /smokecraft/passport
 *
 * APPROVED-ASSET CONTROL PLANE PASS — new landing-accessible destination.
 *
 * Root cause this fixes
 * ---------------------
 * The Landing screen's PASSPORT control (both the card link and the bottom-bar
 * tile) pointed at `/smokecraft/passport-stamp`, which is the SESSION-23
 * curriculum screen behind `SmokeCraftSessionGuard sessionNumber={23}`. Any
 * guest or partially-progressed user who tapped Passport was bounced to
 * /smokecraft/enroll and never saw an approved Passport visual at all. (The
 * `/smokecraft/passport` path itself existed only as a `<Navigate>` alias out
 * to the unrelated top-level /passport module.) This is the same class of
 * defect as the Rewards -> humidor-match bounce found in an earlier pass; the
 * canonical landing resolver now prevents a repeat.
 *
 * Visual foundation
 * -----------------
 * The approved `360 PASSPORT  2.png` renders as-is at its true 1672x941
 * aspect ratio. It contains no fabricated learner data and no baked lock
 * artwork, so nothing needs occluding — React adds only live progress values
 * and hotspots over the artwork's own action tiles.
 *
 * Locked state
 * ------------
 * Per the mandate, a locked Passport must NOT swap in a replacement screen or
 * any "Future Visit Locked" / "Management Sync Locked" image. When the
 * prerequisite stamp session is not yet complete, a live prerequisite panel is
 * drawn OVER this approved visual and the approved visual stays on screen.
 */
export default function SmokeCraftPassport() {
  const navigate = useNavigate()
  const { session } = useGuestSession()

  const completedSteps = Array.isArray(session?.completedSteps) ? session.completedSteps : []
  const status = computeJourneyStatus(completedSteps)
  const stamps = session?.passportStampCount ?? 0
  const stampEarned = completedSteps.includes('passport-stamp')

  function back() {
    triggerHaptic('light')
    navigate('/smokecraft')
  }

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.passportHub}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 Passport"
      bottomOffset={0}
    >
      <h1 style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>SmokeCraft 360 Passport</h1>

      {/* Live progress, placed in the artwork's own empty header strip below
          the "YOUR JOURNEY. YOUR NETWORK. YOUR LEGACY." rule. */}
      <div
        data-testid="passport-progress"
        style={{
          position: 'absolute', left: '36.0%', top: '27.5%', width: '34.0%',
          textAlign: 'center', fontFamily: 'Georgia, serif',
          fontSize: 'clamp(8px,0.95vw,14px)', color: CREAM, pointerEvents: 'none',
        }}
      >
        <span data-testid="passport-sessions">{status.completedSessionCount}</span> of {TOTAL_SESSIONS} sessions complete
        {'  ·  '}
        <span data-testid="passport-stamps">{stamps}</span> {stamps === 1 ? 'stamp' : 'stamps'} earned
      </div>

      {/* Live prerequisite panel drawn OVER the approved visual — never a
          replacement screen, never baked lock artwork. */}
      {!stampEarned && (
        <div
          data-testid="passport-prereq"
          role="status"
          style={{
            position: 'absolute', left: '30.0%', top: '60.0%', width: '40.0%',
            background: '#0A1020', border: `1.5px solid ${GOLD}`, borderRadius: 10,
            padding: 'clamp(8px,1.1vw,16px)', textAlign: 'center',
            fontFamily: 'Georgia, serif', pointerEvents: 'auto',
          }}
        >
          <div style={{ fontSize: 'clamp(9px,1.05vw,15px)', color: GOLD, marginBottom: 4 }}>
            Passport stamping not unlocked yet
          </div>
          <div style={{ fontSize: 'clamp(8px,0.9vw,13px)', color: 'rgba(229,226,225,0.72)', lineHeight: 1.5 }}>
            Complete your journey through Final Review to earn your first Passport stamp.
            Your Passport stays visible here in the meantime.
          </div>
        </div>
      )}

      {/* Live control over the artwork's own "FULL GUIDE →" affordance. */}
      <button
        type="button"
        data-testid="passport-back"
        aria-label="Back to SmokeCraft landing"
        onClick={back}
        style={{
          position: 'absolute', left: '74.6%', top: '33.6%', width: '9.4%', height: '3.6%',
          background: 'transparent', border: '1.5px solid transparent', borderRadius: 6,
          cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
        onFocus={e => { e.currentTarget.style.borderColor = GOLD }}
        onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
      />
    </SmokeCraftImageBoundsOverlay>
  )
}
