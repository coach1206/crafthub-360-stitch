// Tactile/Haptic Completion pass — one shared, reusable interaction
// primitive for future SmokeCraft screens (educational selectable cards,
// mentor portraits, quiz answers, flavor-wheel segments, Golden Box
// material/finish choices, etc.), consolidating the pressed/selected/
// disabled/haptic/keyboard/focus/touch-target behavior every existing
// per-screen selectable card already implements ad hoc (aria-pressed
// buttons, role="tab" sections) into one component new screens (and
// future retrofits of existing ones) can adopt without re-deriving this
// logic per file.
//
// Deliberately does NOT replace any existing working per-screen
// implementation in this pass — see 01-INTERACTION-AUDIT.md for why a
// blanket retrofit of already-functioning, already-tested screens was
// judged out of this pass's safe scope.
import { useState, useRef } from 'react'
import { triggerHaptic } from '../../utils/haptics.js'

const GOLD = '#E9C176'

/**
 * @param {object} props
 * @param {string} props.label - accessible label, must describe the specific object (e.g. "Select Toro vitola"), never generic "Button"/"Hotspot"
 * @param {boolean} [props.selected] - selected state, only ever true after real user action (never a default)
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loading]
 * @param {() => void} props.onActivate - fires on click, Enter, or Space
 * @param {'light'|'medium'|'heavy'|'success'|'warning'|null} [props.haptic] - pass null to suppress haptic for this instance
 * @param {React.ReactNode} props.children
 * @param {object} [props.style]
 */
export default function SmokeCraftTactileCard({
  label, selected = false, disabled = false, loading = false,
  onActivate, haptic = 'light', children, style = {},
}) {
  const [pressed, setPressed] = useState(false)
  const firedRef = useRef(false)

  function activate() {
    if (disabled || loading) return
    if (haptic) triggerHaptic(haptic)
    onActivate?.()
  }

  function onPointerDown() {
    if (disabled || loading) return
    setPressed(true)
    firedRef.current = false
  }
  function clearPressed() { setPressed(false) }

  function onKeyDown(e) {
    if (disabled || loading) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!firedRef.current) { firedRef.current = true; activate() }
    }
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      disabled={disabled}
      onClick={() => { if (!firedRef.current) activate(); firedRef.current = false }}
      onPointerDown={onPointerDown}
      onPointerUp={clearPressed}
      onPointerCancel={clearPressed}
      onPointerLeave={clearPressed}
      onKeyDown={onKeyDown}
      style={{
        position: 'relative',
        minWidth: 72, minHeight: 72,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: 12,
        borderRadius: 14,
        border: `1.5px solid ${selected ? GOLD : 'rgba(233,193,118,0.25)'}`,
        background: selected ? 'rgba(233,193,118,0.14)' : 'rgba(8,10,16,0.7)',
        color: selected ? GOLD : 'rgba(229,226,225,0.85)',
        fontFamily: 'Georgia, serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        outline: 'none',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        boxShadow: pressed
          ? 'inset 0 2px 6px rgba(0,0,0,0.4)'
          : selected
            ? '0 0 0 3px rgba(233,193,118,0.18)'
            : 'none',
        transition: 'transform 0.08s ease, box-shadow 0.12s ease, background 0.12s ease, border-color 0.12s ease',
        ...style,
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px rgba(233,193,118,0.5)` }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = pressed ? 'inset 0 2px 6px rgba(0,0,0,0.4)' : selected ? '0 0 0 3px rgba(233,193,118,0.18)' : 'none' }}
    >
      {loading ? <span aria-hidden="true">…</span> : children}
    </button>
  )
}
