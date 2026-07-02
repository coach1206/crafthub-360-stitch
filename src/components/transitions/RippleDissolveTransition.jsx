/**
 * RippleDissolveTransition — premium gold ripple + smoky dissolve overlay.
 *
 * Wraps and re-exports the existing RippleDissolve component with a consistent
 * API and an optional label prop for different handoff targets.
 *
 * Props:
 *   active     — boolean, mount this to trigger
 *   onComplete — called when animation finishes (navigate here)
 *   target     — 'pos360' | 'eat' | 'smokecraft' | string
 *   durationMs — default 1100
 */
import { useEffect, useState } from 'react'
import './rippleDissolve.css'

const TARGET_LABELS = {
  pos360:     'Opening POS 360…',
  pos3:       'Opening POS 3…',
  eat:        'Opening E.A.T.…',
  smokecraft: 'Returning to SmokeCraft…',
  guest:      'Returning to Guest…',
}

export default function RippleDissolveTransition({ active = true, onComplete, target = 'pos360', durationMs = 1100 }) {
  const [stage, setStage] = useState('ripple')

  useEffect(() => {
    if (!active) return
    const toDissolve = setTimeout(() => setStage('dissolve'), durationMs * 0.4)
    const done       = setTimeout(() => onComplete?.(), durationMs)
    return () => { clearTimeout(toDissolve); clearTimeout(done) }
  }, [active, durationMs, onComplete])

  if (!active) return null

  const label = TARGET_LABELS[target] || `Opening ${target}…`

  return (
    <div className="rdt-overlay">
      {/* Gold ripple */}
      <div className={`rdt-ripple ${stage === 'dissolve' ? 'rdt-ripple-expand' : ''}`} />
      {/* Smoke vignette */}
      <div className={`rdt-smoke ${stage === 'dissolve' ? 'rdt-smoke-in' : ''}`} />
      {/* Label */}
      <div className={`rdt-label ${stage === 'dissolve' ? 'rdt-label-in' : ''}`}>
        {label}
      </div>
    </div>
  )
}
