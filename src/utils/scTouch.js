/**
 * SmokeCraft Touch Feedback Utility
 *
 * Provides:
 *   useScPress()        — hook returning pointerdown/up/leave props for press animation
 *   injectScTouchStyles() — one-time global CSS injection (keyframes + .sc-press class)
 *   playClickSound()    — optional safe soft click (off by default, no autoplay violation)
 *   hapticTap(ms)       — navigator.vibrate wrapper, fails silently on unsupported devices
 *
 * Use patterns:
 *   const { pressProps, pressed } = useScPress({ onTap, disabled })
 *   <button {...pressProps} style={{ ...baseStyle, ...(pressed ? pressedStyle : {}) }}>
 *
 * All animations respect prefers-reduced-motion.
 */

import { useState, useCallback, useRef } from 'react'
import { triggerHaptic } from './haptics.js'

// ── CSS injection ──────────────────────────────────────────────────────────────

const STYLE_ID = 'sc-touch-global'

export function injectScTouchStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes sc-press-in  { from { transform: scale(1) } to { transform: scale(0.93) } }
    @keyframes sc-press-out { from { transform: scale(0.93) } to { transform: scale(1.02) } }
    @keyframes sc-spring    {
      0%   { transform: scale(0.93); }
      55%  { transform: scale(1.04); }
      80%  { transform: scale(0.98); }
      100% { transform: scale(1); }
    }
    @keyframes sc-glow-ring {
      0%,100% { box-shadow: 0 0 0 0 rgba(233,193,118,0); }
      50%     { box-shadow: 0 0 0 4px rgba(233,193,118,0.35), 0 0 14px 2px rgba(233,193,118,0.2); }
    }
    @keyframes sc-ripple-once {
      0%   { transform: scale(0.7); opacity: 0.8; }
      70%  { transform: scale(1.3); opacity: 0.2; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* Chip/button pressed state — applied via JS on pointerdown */
    .sc-btn-pressed {
      transform: scale(0.93) !important;
      box-shadow: 0 0 0 3px rgba(233,193,118,0.32), 0 0 12px rgba(233,193,118,0.18) !important;
      transition: transform 0.06s ease, box-shadow 0.06s ease !important;
    }

    /* Spring release */
    .sc-btn-released {
      animation: sc-spring 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards !important;
    }

    /* Focus ring */
    .sc-focus-ring:focus-visible {
      outline: 2px solid rgba(233,193,118,0.65) !important;
      outline-offset: 3px !important;
    }

    @media (prefers-reduced-motion: reduce) {
      .sc-btn-pressed  { transform: none !important; box-shadow: 0 0 0 3px rgba(233,193,118,0.4) !important; }
      .sc-btn-released { animation: none !important; }
    }
  `
  document.head.appendChild(el)
}

// ── Audio click ────────────────────────────────────────────────────────────────

let audioCtx = null
let soundEnabled = false // off by default — no autoplay violation

export function setClickSoundEnabled(enabled) {
  soundEnabled = enabled
}

export function playClickSound(freq = 880, duration = 0.055, gain = 0.06) {
  if (!soundEnabled) return
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const osc = audioCtx.createOscillator()
    const vol = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, audioCtx.currentTime + duration)
    vol.gain.setValueAtTime(gain, audioCtx.currentTime)
    vol.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration)
    osc.connect(vol)
    vol.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  } catch (_) { /* browser blocked audio — silent fail */ }
}

// ── Haptic tap ─────────────────────────────────────────────────────────────────

export function hapticTap(type = 'light') {
  triggerHaptic(type)
}

// ── useScPress hook ────────────────────────────────────────────────────────────

/**
 * Returns event props for immediate press-down visual feedback.
 *
 * @param {{ onTap?: () => void, disabled?: boolean, haptic?: string, sound?: boolean }} options
 * @returns {{ pressProps: object, pressed: boolean }}
 */
export function useScPress({ onTap, disabled = false, haptic = 'light', sound = true } = {}) {
  const [pressed, setPressed] = useState(false)
  const elRef = useRef(null)
  const timerRef = useRef(null)

  const applyClass = useCallback((el, cls) => {
    if (!el) return
    el.classList.remove('sc-btn-pressed', 'sc-btn-released')
    void el.offsetWidth // force reflow so animation restarts
    el.classList.add(cls)
  }, [])

  const handlePointerDown = useCallback((e) => {
    if (disabled) return
    if (e.button !== undefined && e.button > 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    elRef.current = e.currentTarget
    clearTimeout(timerRef.current)
    setPressed(true)
    applyClass(e.currentTarget, 'sc-btn-pressed')
    hapticTap(haptic)
    if (sound) playClickSound()
  }, [disabled, haptic, sound, applyClass])

  const handleRelease = useCallback((e) => {
    const el = elRef.current || e?.currentTarget
    setPressed(false)
    applyClass(el, 'sc-btn-released')
    timerRef.current = setTimeout(() => {
      el?.classList.remove('sc-btn-released')
    }, 350)
  }, [applyClass])

  const handleClick = useCallback(() => {
    if (disabled) {
      hapticTap('warning')
      return
    }
    onTap?.()
  }, [disabled, onTap])

  const pressProps = {
    onPointerDown: handlePointerDown,
    onPointerUp: handleRelease,
    onPointerLeave: handleRelease,
    onPointerCancel: handleRelease,
    onClick: handleClick,
    className: 'sc-focus-ring',
    style: { WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', outline: 'none' },
  }

  return { pressProps, pressed }
}
