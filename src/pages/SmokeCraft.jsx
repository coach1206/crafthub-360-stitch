import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../constants/smokecraftAssets.js'
// Approved-Asset Control Plane pass: this screen no longer re-derives journey
// state or carries destination strings. It reads state once via
// getSmokeCraftLandingJourneyState() and resolves EVERY control through the one
// canonical resolveSmokeCraftLandingAction(). No handler below contains a route
// string, a fallback route, or its own CTA-label logic.
import {
  resolveSmokeCraftLandingAction,
  getSmokeCraftLandingJourneyState,
  getPrimaryActionId,
  SMOKECRAFT_LANDING_ACTIONS as ACTIONS,
} from '../constants/smokecraftLandingActions.js'
import { useStartNewSmokeCraftJourney } from '../hooks/useStartNewSmokeCraftJourney.js'

const NAT_W = 1189
const NAT_H = 667
const GOLD = '#E9C176'

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

// Landing-page journey controls pass — premium gold-outline secondary
// button (visually distinct from the solid-gold PrimaryHotspot), used for
// START NEW JOURNEY whenever an active journey exists alongside
// RESUME SMOKECRAFT JOURNEY / VIEW COMPLETED JOURNEY. Minimum 72px touch
// target, visible keyboard focus ring, pointer-down tactile feedback, large
// legible type — no default browser highlight.
function SecondaryHotspot({ label, onClick, style }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        position: 'absolute',
        background: pressed ? 'rgba(233,193,118,0.16)' : 'rgba(8,10,16,0.55)',
        color: GOLD,
        border: `2px solid ${GOLD}`,
        borderRadius: 999,
        fontFamily: 'Georgia, serif',
        fontWeight: 700,
        fontSize: 'clamp(13px, 1.5vw, 17px)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        transition: 'background 0.12s ease, transform 0.08s ease',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        minHeight: 72,
        ...style,
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px rgba(233,193,118,0.5)` }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
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
  // ONE journey-state read for the whole render. Every control below resolves
  // against this same snapshot, so a single render can never mix two readings.
  const [journeyState] = useState(getSmokeCraftLandingJourneyState)
  const isReturning = journeyState.isReturning
  const { startNewSmokeCraftJourney } = useStartNewSmokeCraftJourney()
  const [confirmingStartNew, setConfirmingStartNew] = useState(false)

  // The single navigation entry point for every Landing control. A control
  // names an ACTION; the resolver decides the route and whether a clean
  // journey must be created first. Controls never navigate directly.
  function runAction(actionId) {
    const action = resolveSmokeCraftLandingAction(actionId, journeyState)
    triggerHaptic(action.startsNewJourney ? 'medium' : 'light')
    if (action.startsNewJourney) {
      // The one canonical journey reset (Clean Start remediation pass).
      // Its return value is authoritative for where a clean journey begins.
      navigate(startNewSmokeCraftJourney({ firstRoute: action.route }))
      return
    }
    navigate(action.route)
  }

  // Primary CTA: label and destination both come from the resolver, so they
  // can never drift apart the way two separate implementations did before.
  const primary = resolveSmokeCraftLandingAction(getPrimaryActionId(journeyState), journeyState)

  function handleStartNewClick() {
    triggerHaptic('light')
    setConfirmingStartNew(true)
  }

  function handleCancelStartNew() {
    triggerHaptic('light')
    setConfirmingStartNew(false)
  }

  function handleConfirmStartNew() {
    setConfirmingStartNew(false)
    // Resolver decides the clean-start destination (Enrollment) and flags
    // startsNewJourney, so runAction performs the one canonical reset. No
    // route string and no second reset implementation live here.
    runAction(ACTIONS.START_NEW)
  }

  function handleStart() {
    // START vs RESUME is the resolver's decision, not this component's.
    runAction(getPrimaryActionId(journeyState))
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
        label={primary.label}
        onClick={handleStart}
        style={{ left: '3.4%', top: '56.4%', width: '21.5%', height: '6.4%' }}
      />

      {/* Landing-page journey controls pass — secondary START NEW JOURNEY
          control, shown only when an active (incomplete or completed)
          journey exists, so the user always has an explicit way to
          intentionally discard/archive it and begin clean. Placed directly
          below the primary CTA — same left/width, does not cover the
          approved background or any other hotspot (How It Works sits at
          the same vertical band but further right). */}
      {isReturning && (
        <SecondaryHotspot
          label="Start New Journey"
          onClick={handleStartNewClick}
          style={{ left: '3.4%', top: '64.0%', width: '21.5%', height: '5.2%' }}
        />
      )}

      {/* Baked: HOW IT WORKS button */}
      <StaticHotspot
        label="How It Works"
        onClick={() => runAction(ACTIONS.HOW_IT_WORKS)}
        style={{ left: '26.7%', top: '56.4%', width: '17.7%', height: '6.4%' }}
        shape="pill"
      />

      {/* Baked: VIEW PASSPORT link in the 360 Passport card */}
      <StaticHotspot
        label="View Passport"
        onClick={() => runAction(ACTIONS.PASSPORT)}
        style={{ left: '80.7%', top: '40.5%', width: '16.0%', height: '6.0%' }}
      />

      {/* Baked: VIEW PAIRING link in the Recommended Pairing card */}
      <StaticHotspot
        label="View Pairing"
        onClick={() => runAction(ACTIONS.PAIRING)}
        style={{ left: '78.6%', top: '73.2%', width: '17.7%', height: '6.3%' }}
      />

      {/* Bottom bar: REWARDS → Reward Center (approved Reward Center.png).
          Root-cause fix: previously routed to /smokecraft/humidor-match, a
          session-2-guarded screen that bounced every real user to enroll and
          never showed the approved Reward Center visual. */}
      <StaticHotspot
        label="Rewards"
        onClick={() => runAction(ACTIONS.REWARDS)}
        style={{ left: '1.35%', top: '82.2%', width: '24.3%', height: '17.7%' }}
      />

      {/* Bottom bar: RANKINGS */}
      <StaticHotspot
        label="Rankings"
        onClick={() => runAction(ACTIONS.RANKINGS)}
        style={{ left: '25.65%', top: '82.2%', width: '24.3%', height: '17.7%' }}
      />

      {/* Bottom bar: PASSPORT → View Passport */}
      <StaticHotspot
        label="View Passport (bottom bar)"
        onClick={() => runAction(ACTIONS.PASSPORT)}
        style={{ left: '49.96%', top: '82.2%', width: '24.3%', height: '17.7%' }}
      />

      {/* Bottom bar: CRAFTHUB → Enter Challenge */}
      <StaticHotspot
        label="CraftHub"
        onClick={() => runAction(ACTIONS.CRAFTHUB)}
        style={{ left: '74.3%', top: '82.2%', width: '24.3%', height: '17.7%' }}
      />

      {confirmingStartNew && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Start a new SmokeCraft journey?"
          style={{
            position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(6,8,16,0.78)', padding: 'clamp(16px,4vw,40px)',
          }}
        >
          <div style={{
            background: '#0b0f18', border: `1.5px solid ${GOLD}`, borderRadius: 14,
            padding: 'clamp(20px,3vw,32px)', maxWidth: 440, width: '100%',
            boxShadow: '0 12px 48px rgba(0,0,0,0.6)', fontFamily: 'Georgia, serif',
          }}>
            <p style={{ margin: '0 0 20px', fontSize: 'clamp(15px,1.8vw,18px)', lineHeight: 1.6, color: '#e5e2e1' }}>
              Start a new SmokeCraft journey? Your current journey will be archived and a clean journey will begin.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button" onClick={handleCancelStartNew}
                style={{
                  flex: '1 1 120px', minHeight: 52, background: 'transparent',
                  border: '1.5px solid rgba(233,193,118,0.4)', borderRadius: 999,
                  color: 'rgba(229,226,225,0.85)', fontFamily: 'Georgia, serif', fontWeight: 700,
                  fontSize: 'clamp(13px,1.5vw,16px)', letterSpacing: '0.04em', textTransform: 'uppercase',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                Cancel
              </button>
              <button
                type="button" onClick={handleConfirmStartNew}
                style={{
                  flex: '1 1 160px', minHeight: 52, background: `linear-gradient(180deg, #F3D48E, ${GOLD})`,
                  border: 'none', borderRadius: 999, color: '#241605', fontFamily: 'Georgia, serif', fontWeight: 700,
                  fontSize: 'clamp(13px,1.5vw,16px)', letterSpacing: '0.04em', textTransform: 'uppercase',
                  cursor: 'pointer', outline: 'none', boxShadow: '0 4px 18px rgba(233,193,118,0.45)',
                }}
              >
                Start New Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </SmokeCraftImageBoundsOverlay>
  )
}
