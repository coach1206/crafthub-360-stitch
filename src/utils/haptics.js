/**
 * Haptic feedback utility — uses navigator.vibrate where available.
 * Fails silently on unsupported devices (desktop, iOS Safari).
 *
 * Usage:
 *   import { triggerHaptic } from '../utils/haptics.js'
 *   triggerHaptic('success')
 */

const PATTERNS = {
  light:   [8],
  medium:  [15],
  success: [15, 30, 25],
  warning: [25, 20, 25],
}

/**
 * @param {'light' | 'medium' | 'success' | 'warning'} type
 */
export function triggerHaptic(type = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  const pattern = PATTERNS[type] ?? PATTERNS.light
  try {
    navigator.vibrate(pattern)
  } catch {
    // silently ignore on unsupported platforms
  }
}
