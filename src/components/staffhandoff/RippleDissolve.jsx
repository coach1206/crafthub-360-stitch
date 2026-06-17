import { useEffect, useState } from 'react'

/**
 * Premium gold ripple + smoky dissolve transition shown after a staff
 * member unlocks the handoff. Calls onComplete once the animation finishes
 * (900–1400ms total) so the caller can navigate to POS 3.
 */
export default function RippleDissolve({ onComplete, durationMs = 1100 }) {
  const [stage, setStage] = useState('ripple') // 'ripple' -> 'dissolve'

  useEffect(() => {
    const toDissolve = setTimeout(() => setStage('dissolve'), durationMs * 0.4)
    const done        = setTimeout(() => onComplete?.(), durationMs)
    return () => { clearTimeout(toDissolve); clearTimeout(done) }
  }, [durationMs, onComplete])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: '#050302',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: 24, height: 24, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(233,193,118,0.9) 0%, rgba(233,193,118,0.2) 45%, transparent 70%)',
        transform: stage === 'ripple' ? 'scale(1)' : 'scale(60)',
        opacity: stage === 'ripple' ? 1 : 0,
        transition: `transform ${durationMs * 0.7}ms cubic-bezier(0.2,0,0.2,1), opacity ${durationMs * 0.6}ms ease-out`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle, transparent 0%, rgba(5,3,2,0.4) 55%, rgba(5,3,2,0.97) 100%)',
        opacity: stage === 'dissolve' ? 1 : 0,
        transition: `opacity ${durationMs * 0.6}ms ease-in`,
      }} />
      <div style={{
        position: 'relative', zIndex: 1,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
        letterSpacing: '0.25em', textTransform: 'uppercase',
        color: 'rgba(233,193,118,0.7)',
        opacity: stage === 'dissolve' ? 1 : 0,
        transition: 'opacity 300ms ease-out',
      }}>
        Opening POS 3…
      </div>
    </div>
  )
}
