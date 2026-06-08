/**
 * Haptic feedback utility — uses navigator.vibrate where available.
 * Fails silently on unsupported devices (desktop, iOS Safari).
 *
 * Usage:
 *   import { triggerHaptic } from '../utils/haptics.js'
 *   triggerHaptic('success')
 */

const PATTERNS = {
  light:   [30],
  medium:  [60],
  success: [30, 40, 80],
  warning: [100, 40, 100],
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
