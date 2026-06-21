/**
 * QuantityStepper — large tap-target +/- stepper for cart line quantities.
 * Fires selectionTap haptic on each change.
 */
import { GOLD, PANEL2 } from '../eat/ui.jsx'
import { selectionTap } from '../../services/shared/haptics.js'

export default function QuantityStepper({ value, onChange, min = 0, max = 99 }) {
  function step(delta) {
    const next = Math.min(max, Math.max(min, value + delta))
    if (next === value) return
    try { selectionTap() } catch {}
    onChange && onChange(next)
  }

  const btnStyle = {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 12,
    border: `1px solid rgba(212,168,67,0.3)`,
    background: PANEL2,
    color: GOLD,
    fontSize: 20,
    fontWeight: 700,
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" onClick={() => step(-1)} style={btnStyle} aria-label="Decrease quantity">−</button>
      <span style={{ minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>{value}</span>
      <button type="button" onClick={() => step(1)} style={btnStyle} aria-label="Increase quantity">+</button>
    </div>
  )
}
