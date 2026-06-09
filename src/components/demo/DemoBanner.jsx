/**
 * Demo Banner — NOVEE OS
 * Persistent label shown whenever Demo Mode is active.
 * Fixed top-right, non-blocking, with an exit button.
 */

import { useState } from 'react'
import { useDemoMode } from '../../context/DemoModeContext.jsx'

export default function DemoBanner() {
  const { isDemoMode, exitDemoMode } = useDemoMode()
  const [exiting, setExiting] = useState(false)

  if (!isDemoMode) return null

  function handleExit() {
    setExiting(true)
    setTimeout(() => {
      exitDemoMode()
      window.location.href = '/'
    }, 250)
  }

  return (
    <div
      style={{
        position:    'fixed',
        top:         12,
        right:       12,
        zIndex:      9999,
        display:     'flex',
        alignItems:  'center',
        gap:         8,
        padding:     '5px 10px 5px 12px',
        borderRadius: 20,
        background:  'rgba(12,10,7,0.92)',
        border:      '1px solid rgba(201,168,76,0.45)',
        boxShadow:   '0 2px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.08)',
        backdropFilter: 'blur(12px)',
        opacity:     exiting ? 0 : 1,
        transition:  'opacity 0.2s ease',
        pointerEvents: 'auto',
      }}
    >
      {/* Pulse dot */}
      <span style={{
        display:      'inline-block',
        width:        6,
        height:       6,
        borderRadius: '50%',
        background:   '#C9A84C',
        boxShadow:    '0 0 6px #C9A84C',
        animation:    'demoPulse 2s ease-in-out infinite',
        flexShrink:   0,
      }} />

      <span style={{
        fontFamily:    '"JetBrains Mono", monospace',
        fontSize:      9,
        fontWeight:    700,
        letterSpacing: '0.18em',
        color:         '#C9A84C',
        textTransform: 'uppercase',
        whiteSpace:    'nowrap',
      }}>
        DEMO MODE ACTIVE
      </span>

      {/* Divider */}
      <span style={{
        width:      1,
        height:     14,
        background: 'rgba(201,168,76,0.25)',
        flexShrink: 0,
      }} />

      {/* Exit button */}
      <button
        onClick={handleExit}
        title="Exit Demo Mode"
        style={{
          background:  'none',
          border:      'none',
          cursor:      'pointer',
          padding:     '2px 2px 2px 4px',
          display:     'flex',
          alignItems:  'center',
          color:       'rgba(201,168,76,0.5)',
          flexShrink:  0,
          lineHeight:  1,
          transition:  'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,168,76,0.5)'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
      </button>

      <style>{`
        @keyframes demoPulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
