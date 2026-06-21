/**
 * HapticToggle — settings toggle to enable/disable POS3 haptics app-wide.
 * Persisted to localStorage `pos3:hapticsEnabled`.
 */
import { useState } from 'react'
import { GOLD, PANEL2, LINE } from '../eat/ui.jsx'
import { isHapticsEnabled, setHapticsEnabled, selectionTap } from '../../services/shared/haptics.js'

export default function HapticToggle() {
  const [enabled, setEnabled] = useState(isHapticsEnabled())

  function toggle() {
    const next = !enabled
    setHapticsEnabled(next)
    setEnabled(next)
    if (next) { try { selectionTap() } catch {} }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      style={{
        minHeight: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '10px 16px', borderRadius: 12, border: `1px solid ${LINE}`,
        background: PANEL2, color: '#e8eef5', cursor: 'pointer', width: '100%', touchAction: 'manipulation',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 14 }}>Haptic Feedback</span>
      <span style={{
        display: 'inline-flex', width: 44, height: 26, borderRadius: 999, padding: 3,
        background: enabled ? GOLD : '#3a4250', transition: 'background 0.2s ease',
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: '50%', background: '#0f1419',
          transform: enabled ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s ease',
        }} />
      </span>
    </button>
  )
}
