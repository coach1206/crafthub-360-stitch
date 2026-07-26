import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { computeJourneyStatus } from '../../constants/smokecraftJourneyStatus.js'
import { TOTAL_SESSIONS } from '../../constants/session.js'
import { SMOKECRAFT_PASSPORT_MODULE_DESTINATIONS as PASSPORT_MODULE } from '../../constants/smokecraftNavigationRegistry.js'

const NAT_W = 1672
const NAT_H = 941
const GOLD = '#E9C176'
const CREAM = '#e5e2e1'

// System Audit Prompt 3D (SC-D011), corrected Prompt 3E-1 — the real,
// existing top-level `/passport/*` module (src/pages/passport/*.jsx, a
// separate, substantial app — Scan 265 lines, Directory 336, Events 775,
// Benefits 275, HowItWorks 479 — the same module this file's own docstring
// already identifies as "the unrelated top-level /passport module") was
// missed in the original SC-D011 pass, which incorrectly routed some cards
// generically and disabled "Explore Directory" as unsupported. It IS
// supported — corrected here to route to the real pages (NOT nested under
// /smokecraft — confirmed via browser test that /smokecraft/passport/* does
// not resolve, since App.jsx registers `path="passport"` as a sibling of
// the /smokecraft route group, not a child of it). "View Matches" still has
// no real destination anywhere in this codebase (confirmed: no "matches"
// route exists) — remains honestly disabled.
// Holistic Fix 2 — migrated off local hardcoded route literals onto the
// one shared smokecraftNavigationRegistry's real /passport/* module
// destinations. Routes unchanged from the SC-D011/SC-D012 fix; only the
// source of truth moved.
const PASSPORT_ACTION_CARDS = [
  { key: 'scan',      label: 'Scan to Connect',  route: PASSPORT_MODULE.SCAN,      left: '17.0%' },
  { key: 'directory', label: 'Explore Directory', route: PASSPORT_MODULE.DIRECTORY, left: '30.5%' },
  { key: 'matches',   label: 'View Matches (not yet available)', route: null, left: '44.0%', disabled: true },
  { key: 'event',     label: 'Join an Event',    route: PASSPORT_MODULE.EVENTS,    left: '57.4%' },
  { key: 'benefits',  label: 'Explore Benefits', route: PASSPORT_MODULE.BENEFITS,  left: '70.9%' },
]

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

  // ENTRY-SEQUENCE & CRAFTHUB PASS — the one Back control on this screen.
  // Returns to the EXACT prior route when one exists (the established
  // `window.history.length > 1 ? navigate(-1) : fallback` pattern already used
  // by VenueOwnerDemo/EATCommand/KioskSetup), otherwise the SmokeCraft
  // landing. It mutates no journey or Passport state at all, so it cannot
  // reset progress, and it never targets Guest Pass.
  function back() {
    triggerHaptic('light')
    if (window.history.length > 1) navigate(-1)
    else navigate('/smokecraft')
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

      {/* System Audit Prompt 3D (SC-D011) — the approved image's 5 "START
          HERE / YOUR NEXT ACTIONS" cards (Scan to Connect, Explore
          Directory, View Matches, Join an Event, Explore Benefits) looked
          clickable but had no live control. Only the two with a real,
          existing destination are wired live; the two with no backing
          feature anywhere in this codebase (a member directory, a
          matching system) are honestly disabled rather than fabricated.
          Pixel positions calibrated via PIL crop of the 1672x941 image. */}
      {/* SC-D012, corrected — a real, existing top-level `/passport/*`
          module exists (src/pages/passport/*.jsx: PassportHowItWorks 479
          lines, PassportDirectory 336 lines — both substantial, real
          implementations, not stubs) and was missed in the original
          audit. "FULL GUIDE" and the "Directory" row now route to their
          real destinations. */}
      <button
        type="button" aria-label="Full Guide" data-testid="passport-full-guide"
        onClick={() => { triggerHaptic('light'); navigate(PASSPORT_MODULE.HOW_IT_WORKS) }}
        style={{ position: 'absolute', left: '74%', top: '30%', width: '9%', height: '4%', background: 'transparent', border: 'none', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation' }}
      />
      <button
        type="button" aria-label="Directory — Verified members, brands and more" data-testid="passport-directory-row"
        onClick={() => { triggerHaptic('light'); navigate(PASSPORT_MODULE.DIRECTORY) }}
        style={{ position: 'absolute', left: '4.8%', top: '88.7%', width: '89.7%', height: '10.6%', background: 'transparent', border: 'none', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation' }}
      />

      {PASSPORT_ACTION_CARDS.map(card => (
        <button
          key={card.key} type="button" aria-label={card.label} data-testid={`passport-action-${card.key}`}
          disabled={card.disabled}
          onClick={card.disabled ? undefined : () => { triggerHaptic('light'); navigate(card.route) }}
          style={{
            position: 'absolute', left: card.left, top: '64.3%', width: '13.2%', height: '18.6%',
            background: 'transparent', border: 'none', cursor: card.disabled ? 'default' : 'pointer',
            pointerEvents: 'auto', touchAction: 'manipulation',
          }}
        />
      ))}

      {/* THE one Back control. Visible premium gold-outline pill in the
          artwork's empty top-left margin — the approved image and layout are
          otherwise untouched by this pass. A real <button> so Enter and Space
          activate it natively; focus draws an explicit gold ring. */}
      <button
        type="button"
        data-testid="passport-back"
        aria-label="Back"
        onClick={back}
        style={{
          position: 'absolute', left: '2.4%', top: '2.6%',
          minWidth: '9.5%', minHeight: '5.0%',
          padding: '0.6% 1.6%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4em',
          background: 'linear-gradient(180deg, rgba(12,16,26,0.92), rgba(8,10,16,0.92))',
          border: `1.5px solid ${GOLD}`, borderRadius: 999,
          color: GOLD, fontFamily: 'Georgia, serif', fontWeight: 700,
          fontSize: 'clamp(10px,1.05vw,15px)', letterSpacing: '0.06em',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
          boxShadow: '0 3px 14px rgba(0,0,0,0.45)',
          cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', outline: 'none',
          transition: 'background 0.15s ease, box-shadow 0.15s ease, transform 0.08s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,193,118,0.16)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(180deg, rgba(12,16,26,0.92), rgba(8,10,16,0.92))' }}
        onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(233,193,118,0.55)' }}
        onBlur={e => { e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,0,0,0.45)' }}
        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        ← Back
      </button>
    </SmokeCraftImageBoundsOverlay>
  )
}
