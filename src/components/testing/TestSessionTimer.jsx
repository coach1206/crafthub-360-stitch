/**
 * TestSessionTimer — Phase 12
 * Displays elapsed time since test session started.
 */

import { useState, useEffect, useRef } from 'react'

const GOLD = '#C9A84C'

function pad(n) { return String(n).padStart(2, '0') }

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export default function TestSessionTimer({ startTime, running = true, label = 'Session' }) {
  const [elapsed, setElapsed] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!running || !startTime) { setElapsed(0); return }
    const origin = typeof startTime === 'number' ? startTime : new Date(startTime).getTime()

    function tick() {
      setElapsed(Date.now() - origin)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [startTime, running])

  const display  = formatDuration(elapsed)
  const isLong   = elapsed > 20 * 60 * 1000
  const timerCol = isLong ? '#f97316' : GOLD

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{
        width:        '8px',
        height:       '8px',
        borderRadius: '50%',
        background:   running ? '#4ade80' : `${GOLD}44`,
        boxShadow:    running ? '0 0 6px #4ade80' : 'none',
        flexShrink:   0,
      }} />
      <div>
        <div style={{ fontSize: '0.55rem', letterSpacing: '0.2em', color: `${GOLD}55`, textTransform: 'uppercase', marginBottom: '0.15rem' }}>{label}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', color: timerCol, letterSpacing: '0.05em', lineHeight: 1 }}>
          {running ? display : '—'}
        </div>
      </div>
    </div>
  )
}
