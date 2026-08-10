import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Renders percentage-based tap/click targets over a full-viewport asset screen.
 *
 * Each hotspot in `hotspots` accepts:
 *   x, y, width, height  — percentage of viewport (0–100)
 *   label                — aria-label and CTA pill text
 *   onClick              — optional callback (called first if provided)
 *   to                   — optional react-router navigate target
 *   disabled             — skip rendering this hotspot
 *
 * Interaction model (instant — no 300ms delay):
 *   pointerdown  → immediate pressed state + haptic vibration + "Starting..." label
 *   click        → navigate (debounced; pointerdown already gave feedback)
 *   pointerup/cancel/leave → release pressed state
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
    @keyframes sc-tap-flash {
      0%   { background: rgba(233,193,118,0.28); border-color: #e9c176; }
      100% { background: rgba(0,0,0,0.65);       border-color: rgba(233,193,118,0.65); }
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
      transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease, transform 0.1s ease, box-shadow 0.12s ease;
      will-change: transform;
    }

    /* Hover / focus */
    .sc-hotspot-btn:hover .sc-cta-pill,
    .sc-hotspot-btn:focus-visible .sc-cta-pill {
      background: rgba(233,193,118,0.12);
      border-color: rgba(233,193,118,0.9);
      color: rgba(233,193,118,1);
      animation: none;
      box-shadow: 0 0 0 4px rgba(233,193,118,0.2), 0 0 20px 4px rgba(233,193,118,0.25);
    }

    /* CSS :active fallback (desktop/mouse) */
    .sc-hotspot-btn:active .sc-cta-pill {
      transform: scale(0.965) translateY(2px);
      background: rgba(233,193,118,0.22);
      border-color: #e9c176;
      color: #e9c176;
      animation: none;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.4), 0 0 0 3px rgba(233,193,118,0.3);
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

    /* Release spring animation */
    .sc-hotspot-btn.sc-released .sc-cta-pill {
      animation: sc-ripple 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }

    /* Focus ring */
    .sc-hotspot-btn:focus-visible {
      outline: 2px solid rgba(233,193,118,0.6);
      outline-offset: 3px;
    }

    /* Reduced motion: disable heavy animations, keep instant color feedback */
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

// Guest-facing label from internal route label
function shortLabel(label = '') {
  if (!label) return 'Continue'
  const lower = label.toLowerCase()
  // Navigation labels (check specific combos first)
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
  if (lower.includes('golden box') || lower.includes('gold box') || lower === 'golden-box' || lower === 'open the box') return 'Open the Box'
  return 'Continue →'
}

// "Starting..." label for in-flight state
function loadingLabel(label = '') {
  const lower = label.toLowerCase()
  if (lower.includes('start') || lower.includes('begin') || lower.includes('session')) return 'Starting...'
  if (lower.includes('continue') || lower.includes('gold') || lower.includes('mentor')) return 'Opening...'
  if (lower.includes('accept') || lower.includes('challenge')) return 'Accepting...'
  return 'Loading...'
}

// Safe vibration — only from a direct user gesture, no throw
function hapticTap(ms = 12) {
  try { navigator.vibrate?.(ms) } catch (_) { /* unsupported */ }
}

// Per-button interaction hook
function useHotspotInteraction(h, navigate, interactionDebug) {
  const [phase, setPhase] = useState('idle') // idle | pressed | released | navigating
  const navigatedRef = useRef(false)
  const pointerDownTimeRef = useRef(0)

  const handlePointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button > 0) return // only primary button
    e.currentTarget.setPointerCapture?.(e.pointerId)
    navigatedRef.current = false
    pointerDownTimeRef.current = Date.now()
    setPhase('pressed')
    hapticTap(12)

    if (interactionDebug) {
      // eslint-disable-next-line no-console
      console.log('[SC Interaction] pointerdown', {
        label: h.label,
        target: h.to,
        ts: pointerDownTimeRef.current,
      })
    }
  }, [h.label, h.to, interactionDebug])

  const handlePointerUp = useCallback(() => {
    setPhase(prev => prev === 'pressed' ? 'released' : prev)
    // Auto-clear released state after spring animation
    setTimeout(() => setPhase('idle'), 260)
  }, [])

  const handlePointerCancel = useCallback(() => {
    setPhase('idle')
  }, [])

  const handleClick = useCallback((e) => {
    e.preventDefault()
    if (navigatedRef.current) return // double-tap guard
    navigatedRef.current = true

    const elapsed = Date.now() - pointerDownTimeRef.current

    if (interactionDebug) {
      // eslint-disable-next-line no-console
      console.log('[SC Interaction] click → navigate', {
        label: h.label,
        target: h.to,
        msSincePointerDown: elapsed,
      })
    }

    // Non-critical callbacks fire-and-forget — do NOT block navigation
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
      hapticTap(10)
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

// Single hotspot button — isolated so each has its own interaction state
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
      <span className="sc-cta-pill">
        {displayLabel}
      </span>
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

export default function SmokeCraftHotspotLayer({ hotspots = [], route = '' }) {
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
      // eslint-disable-next-line no-console
      console.log('[SmokeCraft Hotspot]', {
        route: route || window.location.pathname,
        label: h.label,
        x: h.x + '%',
        y: h.y + '%',
        width: h.width + '%',
        height: h.height + '%',
        target: h.to || '(callback only)',
      })
    })
  }

  return (
    <div
      aria-hidden={hotspots.every(h => h.disabled)}
      style={{
        /*
         * IMPORTANT: position:absolute (not fixed) so this layer is sized and
         * positioned relative to the parent image container inside
         * SmokeCraftAssetScreen. Hotspot x/y/width/height percentages are then
         * correctly image-relative, not viewport-relative. This fixes the
         * misplaced pill bug on portrait images shown on landscape viewports.
         */
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
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
