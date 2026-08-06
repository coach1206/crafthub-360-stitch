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

// Browser vibration policy (Chrome et al.) blocks navigator.vibrate() until
// the document has received a real user gesture (pointerdown/keydown/click),
// logging "Blocked call to navigator.vibrate…" on every call before that —
// including calls fired from a mount-time useEffect, which is exactly what
// produced that console warning on SessionComplete's completion effect.
// Track the first real gesture globally so triggerHaptic can silently no-op
// (not warn, not throw) before one has happened, satisfying the same
// fire-and-forget contract every existing call site already relies on.
let hasUserGesture = false
if (typeof document !== 'undefined') {
  const markGesture = () => { hasUserGesture = true }
  const opts = { capture: true, passive: true }
  document.addEventListener('pointerdown', markGesture, opts)
  document.addEventListener('keydown', markGesture, opts)
  document.addEventListener('click', markGesture, opts)
}

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
 * @returns {boolean} whether vibration actually fired — never throws, never
 *   blocks the caller, safe to ignore at every existing fire-and-forget
 *   call site.
 */
export function triggerHaptic(type = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return false
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return false
  if (!hasUserGesture) return false
  if (prefersReducedMotion()) return false
  if (!hapticsEnabledPreference()) return false
  const pattern = PATTERNS[type] ?? PATTERNS.light
  try {
    return navigator.vibrate(pattern) === true
  } catch {
    // silently ignore on unsupported platforms — never throws, never blocks gameplay
    return false
  }
}
