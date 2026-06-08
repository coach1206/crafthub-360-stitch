/**
 * KioskExitGate — Phase 11
 * Modal that appears when a staff/admin/founder wants to exit kiosk mode.
 * Requires PIN authentication via the existing /api/auth/staff-pin-login endpoint.
 */

import { useState } from 'react'

const GOLD  = '#C9A84C'
const DARK  = '#050505'
const CARD  = 'rgba(18,12,5,0.98)'

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function KioskExitGate({ onSuccess, onCancel }) {
  const [pin,     setPin]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  function press(d) {
    if (d === '⌫') { setPin(p => p.slice(0, -1)); setError(null); return }
    if (!d) return
    if (pin.length >= 8) return
    setPin(p => p + d)
    setError(null)
  }

  async function submit() {
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return }
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/auth/staff-pin-login', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ pin }),
      })
      const d = await r.json()
      if (d?.success) {
        setPin('')
        onSuccess(d?.data?.role || 'staff')
      } else {
        setError('PIN not recognised. Try staff, manager, or admin PIN.')
        setPin('')
      }
    } catch {
      setError('Cannot reach server. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position:        'fixed',
      inset:           0,
      background:      'rgba(5,5,5,0.94)',
      zIndex:          9999,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontFamily:      'Georgia, serif',
    }}>
      <div style={{
        background:   CARD,
        border:       `1px solid ${GOLD}33`,
        borderRadius: '12px',
        padding:      '2.5rem 2rem',
        width:        '100%',
        maxWidth:     '360px',
        textAlign:    'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '40px', color: GOLD, opacity: 0.6, display: 'block', marginBottom: '1rem' }}>
          lock_open
        </span>

        <div style={{ color: GOLD, fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.5 }}>
          NOVEE OS · STAFF UNLOCK
        </div>
        <h2 style={{ color: GOLD, fontSize: '1.2rem', fontWeight: 400, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          Enter Staff PIN
        </h2>
        <p style={{ color: 'rgba(201,168,76,0.4)', fontSize: '0.8rem', marginBottom: '1.75rem' }}>
          Staff, manager, or admin PIN required
        </p>

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              width:        '14px',
              height:       '14px',
              borderRadius: '50%',
              border:       `2px solid ${i < pin.length ? GOLD : `${GOLD}30`}`,
              background:   i < pin.length ? GOLD : 'transparent',
              transition:   'all 0.15s',
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
          {DIGITS.map((d, i) => (
            <button
              key={i}
              onClick={() => press(d)}
              disabled={loading}
              style={{
                background:   d ? `${GOLD}12` : 'transparent',
                border:       d ? `1px solid ${GOLD}25` : 'none',
                borderRadius: '8px',
                color:        d === '⌫' ? `${GOLD}88` : GOLD,
                fontFamily:   'Georgia, serif',
                fontSize:     d === '⌫' ? '1.1rem' : '1.4rem',
                padding:      '1rem 0',
                cursor:       d ? 'pointer' : 'default',
                minHeight:    '56px',
                transition:   'background 0.15s',
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: '#e05555', fontSize: '0.78rem', marginBottom: '1rem', lineHeight: 1.4 }}>
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={loading || pin.length < 4}
          style={{
            display:       'block',
            width:         '100%',
            background:    pin.length >= 4 && !loading ? GOLD : `${GOLD}30`,
            color:         pin.length >= 4 && !loading ? DARK : `${GOLD}50`,
            border:        'none',
            padding:       '1rem',
            borderRadius:  '6px',
            fontFamily:    'Georgia, serif',
            fontSize:      '0.9rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor:        pin.length >= 4 && !loading ? 'pointer' : 'not-allowed',
            fontWeight:    600,
            minHeight:     '52px',
            marginBottom:  '0.75rem',
            transition:    'background 0.2s',
          }}
        >
          {loading ? 'Verifying…' : 'Unlock'}
        </button>

        <button
          onClick={onCancel}
          style={{
            display:       'block',
            width:         '100%',
            background:    'transparent',
            color:         `${GOLD}44`,
            border:        `1px solid ${GOLD}15`,
            padding:       '0.875rem',
            borderRadius:  '6px',
            fontFamily:    'Georgia, serif',
            fontSize:      '0.8rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor:        'pointer',
            minHeight:     '48px',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
