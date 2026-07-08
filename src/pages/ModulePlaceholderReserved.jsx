/**
 * ModulePlaceholderReserved — shown when a route exists but the feature is not yet built.
 * contains_secrets: false
 */

import { useNavigate, useLocation } from 'react-router-dom'

const NAVY  = '#0a0d14'
const LINE  = '#252d3f'
const GOLD  = '#c9952c'
const TEXT  = '#e8e4d8'
const MUTE  = '#7a8299'
const RED   = '#c0392b'

export default function ModulePlaceholderReserved() {
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <div style={{ minHeight: '100dvh', background: NAVY, color: TEXT, fontFamily: '"Hanken Grotesk", sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: RED, marginBottom: 16 }}>
          NOT BUILT
        </div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: GOLD, margin: '0 0 16px' }}>
          Feature Not Yet Built
        </h1>
        <p style={{ fontSize: 14, color: MUTE, lineHeight: 1.7, margin: '0 0 12px' }}>
          This platform feature is on the roadmap but has not been implemented yet.
        </p>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: LINE, marginBottom: 32 }}>
          {location.pathname}
        </div>
        <button
          onClick={() => navigate('/novee-os/command-center')}
          style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: GOLD, background: 'transparent', border: `1px solid ${GOLD}55`,
            borderRadius: 20, padding: '10px 22px', cursor: 'pointer',
          }}
        >
          ← Back to Command Center
        </button>
      </div>
    </div>
  )
}
