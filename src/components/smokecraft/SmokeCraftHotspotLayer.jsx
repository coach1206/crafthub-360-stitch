import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { hapticTap } from '../../utils/scTouch.js'

/**
 * Renders percentage-based tap/click targets over a full-viewport asset screen.
 *
 * Each hotspot in `hotspots` accepts:
 *   x, y, width, height  — percentage of image (0–100)
 *   label                — aria-label and CTA pill text
 *   onClick              — optional callback (called first if provided)
 *   to                   — optional react-router navigate target
 *   disabled             — skip rendering this hotspot
 *
 * Interaction model (instant — no 300ms delay):
 *   pointerdown  → immediate pressed state + haptic vibration
 *   click        → fire onClick callback (non-blocking) then navigate
 *   pointerup/cancel/leave → release pressed state with spring animation
 *
 * Debug mode: sessionStorage `smokecraft_hotspot_debug=1`
 * Interaction debug: sessionStorage `smokecraftInteractionDebug=1`
 */

const STYLE_ID = 'sc-hotspot-anim'

function ensureAnimStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes sc-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(233,193,118,0.0), 0 0 8px 0 rgba(233,193,118,0.15); }
      50%      { box-shadow: 0 0 0 4px rgba(233,193,118,0.18), 0 0 18px 2px rgba(233,193,118,0.28); }
    }
    @keyframes sc-ripple {
      0%   { transform: scale(0.92) translateY(2px); opacity: 1; }
      60%  { transform: scale(1.02) translateY(-1px); opacity: 0.9; }
      100% { transform: scale(1)   translateY(0);     opacity: 1; }
    }

    .sc-cta-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 22px;
      background: rgba(0,0,0,0.65);
      border: 1px solid rgba(233,193,118,0.65);
      border-radius: 40px;
      color: rgba(233,193,118,0.92);
      font-family: "JetBrains Mono", "Courier New", monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      min-width: 160px;
      max-width: 280px;
      min-height: 44px;
      animation: sc-pulse 2.4s ease-in-out infinite;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease, transform 0.1s ease;
      will-change: transform;
    }

    .sc-hotspot-btn:hover .sc-cta-pill,
    .sc-hotspot-btn:focus-visible .sc-cta-pill {
      background: rgba(233,193,118,0.12);
      border-color: rgba(233,193,118,0.9);
      color: rgba(233,193,118,1);
      animation: none;
      box-shadow: 0 0 0 4px rgba(233,193,118,0.2), 0 0 20px 4px rgba(233,193,118,0.25);
    }

    .sc-hotspot-btn:active .sc-cta-pill {
      transform: scale(0.965) translateY(2px);
      background: rgba(233,193,118,0.22);
      border-color: #e9c176;
      color: #e9c176;
      animation: none;
      transition: transform 0.06s ease, background 0.06s ease;
    }

    /* JS-driven pressed state — fires immediately on pointerdown */
    .sc-hotspot-btn.sc-pressed .sc-cta-pill {
      transform: scale(0.965) translateY(2px);
      background: rgba(233,193,118,0.22);
      border-color: #e9c176;
      color: #e9c176;
      animation: none;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.4), 0 0 0 3px rgba(233,193,118,0.3);
      transition: transform 0.06s ease, background 0.06s ease, color 0.06s ease;
    }

    .sc-hotspot-btn.sc-released .sc-cta-pill {
      animation: sc-ripple 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }

    .sc-hotspot-btn:focus-visible {
      outline: 2px solid rgba(233,193,118,0.6);
      outline-offset: 3px;
    }

    @media (prefers-reduced-motion: reduce) {
      .sc-cta-pill {
        animation: none !important;
        transition: background 0.08s ease, border-color 0.08s ease, color 0.08s ease !important;
      }
      .sc-hotspot-btn.sc-pressed .sc-cta-pill,
      .sc-hotspot-btn:active .sc-cta-pill {
        transform: none !important;
        background: rgba(233,193,118,0.28) !important;
        border-color: #e9c176 !important;
        color: #e9c176 !important;
      }
      .sc-hotspot-btn.sc-released .sc-cta-pill {
        animation: none !important;
      }
    }
  `
  document.head.appendChild(el)
}

// Guest-facing CTA label from internal hotspot label
function shortLabel(label = '') {
  if (!label) return 'Continue'
  const lower = label.toLowerCase()
  // Navigation labels — specific combos first
  if (lower.includes('start new') || lower.includes('new smokecraft') || lower.includes('new session')) return 'Start New Session →'
  if (lower.includes('continue previous') || lower.includes('previous session')) return 'Continue Session →'
  if (lower.includes('enter event') || lower.includes('event challenge')) return 'Enter Challenge →'
  if (lower.includes('browse humidor')) return 'Browse Humidor →'
  if (lower.includes('view my passport') || lower.includes('my passport')) return 'My Passport →'
  if (lower.includes('how it works')) return 'How It Works →'
  if (lower.includes('demo experience') || lower.includes('demo')) return 'Demo Experience →'
  if (lower.includes('view pairing')) return 'View Pairing →'
  // Journey labels
  if (lower.includes('accept')) return 'Accept the Challenge'
  if (lower.includes('complete') && lower.includes('session')) return 'Complete Journey'
  if (lower.includes('stamp')) return 'Claim Passport Stamp'
  if (lower.includes('scorecard')) return 'View Scorecard'
  if (lower.includes('purchase') || lower.includes('order')) return 'Request Purchase'
  if (lower.includes('handoff') || lower.includes('staff')) return 'Complete ↗'
  if (lower.includes('pairing')) return 'Enter Pairing Lab'
  if (lower.includes('humidor')) return 'Match Humidor'
  if (lower.includes('mentor')) return 'Meet Your Mentor'
  if (lower.includes('identity')) return 'Begin Journey'
  if (lower.includes('passport')) return 'Stamp Passport'
  if (lower.includes('management') || lower.includes('sync')) return 'Sync to E.A.T.'
  if (lower.includes('first third')) return 'First Third ↓'
  if (lower.includes('second third')) return 'Second Third ↓'
  if (lower.includes('final third')) return 'Final Third ↓'
  if (lower.includes('flavor')) return 'Flavor Memory'
  if (lower.includes('review')) return 'Final Review'
  if (lower.includes('connection')) return 'View Connections'
  if (lower.includes('seed') || lower.includes('soil')) return 'Seed & Soil'
  if (lower.includes('cut') || lower.includes('toast')) return 'Cut · Toast · Light'
  if (lower.includes('visit') && lower.includes('complete')) return 'Visit Complete →'
  if (lower.includes('return') && lower.includes('next')) return 'Return Next Visit →'
  // NARROW rule: only exact "golden box" or "gold box" phrase → "Open the Box"
  // This prevents any label containing "box" or "golden" alone from matching.
  if (lower.includes('golden box') || lower.includes('gold box')) return 'Open the Box'
  if (lower.includes('select mentor') || lower.includes('choose mentor') || lower.includes('your mentor')) return 'Select Mentor →'
  if (lower.includes('continue') || lower.includes('proceed')) return 'Continue →'
  return 'Continue →'
}

function loadingLabel(label = '') {
  const lower = label.toLowerCase()
  if (lower.includes('start') || lower.includes('begin') || lower.includes('new session')) return 'Starting...'
  if (lower.includes('continue') || lower.includes('mentor') || lower.includes('golden')) return 'Opening...'
  if (lower.includes('accept') || lower.includes('challenge')) return 'Accepting...'
  return 'Loading...'
}

// hapticTap is imported from scTouch.js (wraps triggerHaptic from haptics.js)

function useHotspotInteraction(h, navigate, interactionDebug) {
  const [phase, setPhase] = useState('idle')
  const navigatedRef = useRef(false)
  const pointerDownTimeRef = useRef(0)

  const handlePointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button > 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    navigatedRef.current = false
    pointerDownTimeRef.current = Date.now()
    setPhase('pressed')
    hapticTap('light')

    if (interactionDebug) {
      console.log('[SC Interaction] pointerdown', { label: h.label, target: h.to, ts: pointerDownTimeRef.current }) // eslint-disable-line no-console
    }
  }, [h.label, h.to, interactionDebug])

  const handlePointerUp = useCallback(() => {
    setPhase(prev => prev === 'pressed' ? 'released' : prev)
    setTimeout(() => setPhase('idle'), 260)
  }, [])

  const handlePointerCancel = useCallback(() => {
    setPhase('idle')
  }, [])

  const handleClick = useCallback((e) => {
    e.preventDefault()
    if (navigatedRef.current) return
    navigatedRef.current = true

    if (interactionDebug) {
      console.log('[SC Interaction] click → navigate', { label: h.label, target: h.to, msSincePointerDown: Date.now() - pointerDownTimeRef.current }) // eslint-disable-line no-console
    }

    if (h.onClick) {
      try { h.onClick() } catch (_) { /* never block nav */ }
    }

    setPhase('navigating')

    if (h.to) {
      navigate(h.to)
    }
  }, [h, navigate, interactionDebug])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setPhase('pressed')
      hapticTap('light')
    }
  }, [])

  const handleKeyUp = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setPhase('released')
      setTimeout(() => setPhase('idle'), 260)
    }
  }, [])

  return { phase, handlePointerDown, handlePointerUp, handlePointerCancel, handleClick, handleKeyDown, handleKeyUp }
}

function HotspotButton({ h, navigate, debug, interactionDebug }) {
  const {
    phase,
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
    handleClick,
    handleKeyDown,
    handleKeyUp,
  } = useHotspotInteraction(h, navigate, interactionDebug)

  const pill = shortLabel(h.label)
  const isNavigating = phase === 'navigating'
  const displayLabel = isNavigating ? loadingLabel(h.label) : pill

  const btnClass = [
    'sc-hotspot-btn',
    phase === 'pressed' ? 'sc-pressed' : '',
    phase === 'released' ? 'sc-released' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={btnClass}
      aria-label={h.label}
      aria-busy={isNavigating}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={isNavigating}
      style={{
        position: 'absolute',
        left: h.x + '%',
        top: h.y + '%',
        width: h.width + '%',
        height: h.height + '%',
        background: debug ? 'rgba(233,193,118,0.10)' : 'transparent',
        border: debug ? '1px dashed rgba(233,193,118,0.45)' : 'none',
        outline: 'none',
        cursor: isNavigating ? 'default' : 'pointer',
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        padding: 0,
        margin: 0,
        borderRadius: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '12%',
        userSelect: 'none',
      }}
    >
      {/* Pills are only visible in debug mode — production buttons are transparent zones */}
      {debug && (
        <span className="sc-cta-pill">
          {displayLabel}
        </span>
      )}
      {debug && (
        <span style={{
          position: 'absolute',
          top: 4,
          left: 6,
          fontSize: 8,
          color: 'rgba(233,193,118,0.5)',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}>
          {h.x},{h.y} {h.width}×{h.height} [{phase}]
        </span>
      )}
    </button>
  )
}

export default function SmokeCraftHotspotLayer({ hotspots = [], route = '', imageBounds = null }) {
  const navigate = useNavigate()

  if (typeof window !== 'undefined') ensureAnimStyles()

  const debug =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('smokecraft_hotspot_debug') === '1'

  const interactionDebug =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('smokecraftInteractionDebug') === '1'

  if (debug) {
    hotspots.forEach(h => {
      if (h.disabled) return
      console.log('[SmokeCraft Hotspot]', { // eslint-disable-line no-console
        route: route || window.location.pathname,
        label: h.label,
        x: h.x + '%', y: h.y + '%',
        width: h.width + '%', height: h.height + '%',
        target: h.to || '(callback only)',
      })
    })
  }

  // When imageBounds is provided (from ResizeObserver in SmokeCraftAssetRoute),
  // position the overlay exactly over the rendered image rect to keep hotspot
  // % coordinates aligned after object-fit:contain letterboxing.
  const overlayStyle = imageBounds
    ? {
        position: 'absolute',
        left: imageBounds.left,
        top: imageBounds.top,
        width: imageBounds.width,
        height: imageBounds.height,
        pointerEvents: 'none',
        zIndex: 10,
      }
    : {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }

  return (
    <div
      aria-hidden={hotspots.every(h => h.disabled)}
      style={overlayStyle}
    >
      {hotspots.map((h, i) => {
        if (h.disabled) return null
        return (
          <HotspotButton
            key={i}
            h={h}
            navigate={navigate}
            debug={debug}
            interactionDebug={interactionDebug}
          />
        )
      })}
    </div>
  )
}
