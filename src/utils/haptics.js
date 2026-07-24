/**
 * Haptic feedback utility — uses navigator.vibrate where available.
 * Fails silently on unsupported devices (desktop, iOS Safari).
 *
 * Tactile/Haptic Completion pass — this is the canonical haptic utility
 * used by all 51 SmokeCraft page files (unchanged call signature, so no
 * consumer needed to change). It now also respects:
 *   - prefers-reduced-motion (haptic feedback is a motion/sensory effect;
 *     users who have asked the OS to reduce motion get it suppressed)
 *   - the account-level `hapticsEnabled` preference already persisted on
 *     GuestSessionContext (`novee_guest_session.hapticsEnabled` /
 *     `.preferences.hapticsEnabled`, toggled via updateProfile/setPreference
 *     elsewhere) — read directly from localStorage here rather than via a
 *     React hook, since triggerHaptic is called from plain event handlers
 *     across the whole SmokeCraft codebase, not only inside components.
 *
 * Never required for an interaction to function — every call site already
 * treats this as fire-and-forget feedback, not a gate on the action itself.
 *
 * Usage:
 *   import { triggerHaptic } from '../utils/haptics.js'
 *   triggerHaptic('success')
 */

const PATTERNS = {
  light:   [30],
  medium:  [60],
  heavy:   [80],
  success: [30, 40, 80],
  warning: [100, 40, 100],
}

const GUEST_SESSION_KEY = 'novee_guest_session'

function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Account-level haptic preference — defaults to enabled (matches sessionStorageService's own default) when unset or unreadable. */
function hapticsEnabledPreference() {
  try {
    const raw = localStorage.getItem(GUEST_SESSION_KEY)
    if (!raw) return true
    const session = JSON.parse(raw)
    const pref = session?.preferences?.hapticsEnabled ?? session?.hapticsEnabled
    return pref !== false
  } catch {
    return true
  }
}

/**
 * @param {'light' | 'medium' | 'heavy' | 'success' | 'warning'} type
 */
export function triggerHaptic(type = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  if (prefersReducedMotion()) return
  if (!hapticsEnabledPreference()) return
  const pattern = PATTERNS[type] ?? PATTERNS.light
  try {
    navigator.vibrate(pattern)
  } catch {
    // silently ignore on unsupported platforms
  }
}
