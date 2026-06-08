/**
 * OfflineMode — Phase 11
 * Public route. Shown when backend is unreachable.
 * Route: /offline
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const GOLD = '#C9A84C'
const DARK = '#050505'

const CAPABILITIES = [
  { key: 'guest',    label: 'Guest Journey',        status: 'ok',  detail: 'Available' },
  { key: 'smoke',   label: 'SmokeCraft 360',        status: 'ok',  detail: 'Available' },
  { key: 'stamps',  label: 'Passport Stamps',       status: 'ok',  detail: 'Queued locally' },
  { key: 'voice',   label: 'Mentor Voice',          status: 'ok',  detail: 'Web Speech active' },
  { key: 'pos3',    label: 'POS 3 Management',      status: 'off', detail: 'Restricted offline' },
  { key: 'eat',     label: 'E.A.T. Command',        status: 'off', detail: 'Requires backend' },
  { key: 'leader',  label: 'Leaderboard',           status: 'off', detail: 'Submission queued' },
  { key: 'admin',   label: 'Admin / Founder',       status: 'off', detail: 'Requires backend' },
]

export default function OfflineMode() {
  const navigate         = useNavigate()
  const [retrying, setRetrying] = useState(false)
  const [online,   setOnline]   = useState(false)

  useEffect(() => {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const r = await fetch('/api/health', { cache: 'no-store', signal: AbortSignal.timeout(3000) })
        if (r.ok) { setOnline(true); clearInterval(interval) }
      } catch {}
      if (attempts >= 20) clearInterval(interval)
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  async function handleRetry() {
    setRetrying(true)
    try {
      const r = await fetch('/api/health', { cache: 'no-store', signal: AbortSignal.timeout(4000) })
      if (r.ok) {
        setOnline(true)
        setTimeout(() => navigate('/'), 800)
      }
    } catch {}
    finally { setRetrying(false) }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     DARK,
      color:          GOLD,
      fontFamily:     'Georgia, serif',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem',
      textAlign:      'center',
    }}>
      {online && (
        <div style={{
          position:     'fixed',
          top:          '1.5rem',
          left:         '50%',
          transform:    'translateX(-50%)',
          background:   '#4ade8022',
          border:       '1px solid #4ade8055',
          borderRadius: '20px',
          padding:      '8px 20px',
          color:        '#4ade80',
          fontSize:     '0.8rem',
          letterSpacing:'0.1em',
          zIndex:       999,
        }}>
          ✓ Connection restored — returning…
        </div>
      )}

      {/* Logo */}
      <div style={{
        fontSize:       'clamp(2rem, 5vw, 3rem)',
        letterSpacing:  '0.2em',
        background:     'linear-gradient(135deg, #E8D5A3 0%, #C9A84C 50%, #9A7A2E 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor:  'transparent',
        backgroundClip: 'text',
        marginBottom:   '0.4rem',
      }}>
        NOVEE OS
      </div>
      <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(201,168,76,0.35)', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
        Connection Paused
      </div>

      <div style={{
        background:    'rgba(201,168,76,0.06)',
        border:        '1px solid rgba(201,168,76,0.15)',
        borderRadius:  '12px',
        padding:       'clamp(1.5rem, 3vw, 2.5rem)',
        maxWidth:      '520px',
        width:         '100%',
        marginBottom:  '1.5rem',
      }}>
        <h1 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.6rem' }}>
          What Still Works
        </h1>
        <p style={{ color: 'rgba(201,168,76,0.45)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
          Your session is preserved. Some features are paused until the connection is restored.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem', textAlign: 'left' }}>
          {CAPABILITIES.map(c => (
            <div key={c.key} style={{
              background:   c.status === 'ok' ? 'rgba(74,222,128,0.06)' : 'rgba(201,168,76,0.04)',
              border:       `1px solid ${c.status === 'ok' ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.08)'}`,
              borderRadius: '8px',
              padding:      '0.75rem 1rem',
              fontSize:     '0.8rem',
            }}>
              <div style={{ color: c.status === 'ok' ? '#4ade80' : 'rgba(201,168,76,0.35)', marginBottom: '0.2rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {c.status === 'ok' ? '✓ Available' : '⏸ Paused'}
              </div>
              <div style={{ color: c.status === 'ok' ? GOLD : 'rgba(201,168,76,0.4)', fontWeight: 400 }}>
                {c.label}
              </div>
              <div style={{ color: 'rgba(201,168,76,0.35)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                {c.detail}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              flex:          '1 1 140px',
              background:    GOLD,
              color:         DARK,
              border:        'none',
              padding:       '1rem 1.5rem',
              borderRadius:  '6px',
              fontFamily:    'Georgia, serif',
              fontSize:      '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor:        'pointer',
              fontWeight:    600,
              minHeight:     '52px',
            }}
          >
            {retrying ? 'Checking…' : 'Retry Connection'}
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              flex:          '1 1 140px',
              background:    'transparent',
              color:         `${GOLD}66`,
              border:        `1px solid ${GOLD}25`,
              padding:       '1rem 1.5rem',
              borderRadius:  '6px',
              fontFamily:    'Georgia, serif',
              fontSize:      '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor:        'pointer',
              minHeight:     '52px',
            }}
          >
            Return to Experience
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.65rem', color: 'rgba(201,168,76,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        NOVEE OS · Auto-retry every 10 seconds
      </div>
    </div>
  )
}
