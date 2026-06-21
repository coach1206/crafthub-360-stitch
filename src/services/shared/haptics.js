/**
 * Shared POS3 haptic taps — thin wrapper around navigator.vibrate for
 * touchscreen interaction feedback (button presses, selections, success,
 * warning, error). Fails silently on unsupported platforms.
 *
 * Distinct from src/utils/haptics.js (triggerHaptic), which remains the
 * canonical haptic utility for SmokeCraft pages and is left unchanged.
 * This module exists for POS3 components that need named, granular taps;
 * both wrap the same underlying navigator.vibrate API so there is no
 * conflicting vibration system — just two thin call-sites.
 *
 * Respects the `pos3:hapticsEnabled` localStorage toggle (see HapticToggle.jsx).
 */

const HAPTICS_ENABLED_KEY = 'pos3:hapticsEnabled'

export function isHapticsEnabled() {
  try {
    const raw = localStorage.getItem(HAPTICS_ENABLED_KEY)
    if (raw == null) return true // default on
    return JSON.parse(raw) !== false
  } catch {
    return true
  }
}

export function setHapticsEnabled(enabled) {
  try {
    localStorage.setItem(HAPTICS_ENABLED_KEY, JSON.stringify(!!enabled))
  } catch {}
}

function vibrate(pattern) {
  if (!isHapticsEnabled()) return
  try {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
    navigator.vibrate(pattern)
  } catch {
    // fail silently — unsupported platform
  }
}

export function lightTap()     { vibrate(10) }
export function selectionTap() { vibrate(15) }
export function successTap()   { vibrate([10, 40, 20]) }
export function warningTap()   { vibrate([30, 30, 30]) }
export function errorTap()     { vibrate([60, 40, 60]) }
