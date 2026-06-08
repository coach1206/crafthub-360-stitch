/**
 * Staff Login — PIN keypad for POS 3 staff access.
 * Large touchscreen-friendly buttons. No keyboard input required.
 * Prototype credentials: PIN 1234
 */

import { useState } from 'react'
import { useAuth }  from '../context/AuthContext.jsx'

const GOLD  = '#C9A84C'
const DARK  = '#060402'
const DIM   = 'rgba(201,168,76,0.45)'
const CARD  = 'rgba(14,9,3,0.98)'
const BORDER = 'rgba(201,168,76,0.18)'

const MAX_DIGITS = 6

export default function StaffLogin() {
  const { loginStaff } = useAuth()
  const [pin,     setPin]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const append = (d) => {
    if (pin.length >= MAX_DIGITS) return
    setPin(p => p + d)
    setError('')
  }

  const backspace = () => {
    setPin(p => p.slice(0, -1))
    setError('')
  }

  const submit = async () => {
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return }
    setLoading(true)
    setError('')
    const result = await loginStaff(pin)
    if (result.success) {
      const returnTo = sessionStorage.getItem('novee_boot_return') || '/pos'
      window.location.href = returnTo.startsWith('/pos') ? '/pos' : '/pos'
    } else {
      setError(result.error || 'Invalid PIN. Please try again.')
      setPin('')
    }
    setLoading(false)
  }

  const handleKey = (k) => {
    if (k === '←') { backspace(); return }
    if (k === '✓') { submit(); return }
    append(k)
  }

  const KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['←', '0', '✓'],
  ]

  return (
    <div style={{
      minHeight:      '100vh',
      background:     DARK,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem',
      fontFamily:     'Georgia, serif',
      userSelect:     'none',
    }}>
      {/* Back */}
      <a href="/" style={{
        position:       'absolute',
        top:            '1.5rem',
        left:           '1.5rem',
        color:          'rgba(201,168,76,0.35)',
        textDecoration: 'none',
        fontSize:       '12px',
        letterSpacing:  '0.1em',
        display:        'flex',
        alignItems:     'center',
        gap:            '4px',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
        HOME
      </a>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ color: DIM, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '0.5rem' }}>
          NOVEE OS
        </div>
        <h1 style={{
          color:         GOLD,
          fontSize:      'clamp(1.2rem, 3vw, 1.6rem)',
          fontWeight:    400,
          letterSpacing: '0.12em',
          margin:        0,
          textTransform: 'uppercase',
        }}>
          POS 3 Staff Access
        </h1>
        <div style={{ color: 'rgba(201,168,76,0.25)', fontSize: '11px', marginTop: '0.5rem', letterSpacing: '0.1em' }}>
          Enter your staff PIN
        </div>
      </div>

      <div style={{
        background:   CARD,
        border:       `1px solid ${BORDER}`,
        borderRadius: '12px',
        padding:      'clamp(1.5rem, 4vw, 2.5rem)',
        width:        '100%',
        maxWidth:     '320px',
      }}>
        {/* PIN dots display */}
        <div style={{
          display:        'flex',
          justifyContent: 'center',
          gap:            '0.75rem',
          marginBottom:   '2rem',
          minHeight:      '24px',
          alignItems:     'center',
        }}>
          {Array.from({ length: MAX_DIGITS }).map((_, i) => (
            <div key={i} style={{
              width:        '14px',
              height:       '14px',
              borderRadius: '50%',
              background:   i < pin.length ? GOLD : 'transparent',
              border:       `2px solid ${i < pin.length ? GOLD : 'rgba(201,168,76,0.2)'}`,
              transition:   'all 0.15s',
            }} />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background:    'rgba(204,51,51,0.08)',
            border:        '1px solid rgba(204,51,51,0.25)',
            borderRadius:  '4px',
            color:         'rgba(220,80,80,0.9)',
            fontSize:      '12px',
            letterSpacing: '0.05em',
            padding:       '8px 12px',
            textAlign:     'center',
            marginBottom:  '1.25rem',
          }}>
            {error}
          </div>
        )}

        {/* PIN pad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem' }}>
          {KEYS.flat().map((k) => {
            const isAction = k === '←' || k === '✓'
            const isSubmit = k === '✓'
            const disabled = loading || (isSubmit && pin.length < 4)
            return (
              <button
                key={k}
                onClick={() => !disabled && handleKey(k)}
                style={{
                  height:        '72px',
                  background:    isSubmit
                    ? (disabled ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.12)')
                    : isAction
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(255,255,255,0.04)',
                  border:        `1px solid ${
                    isSubmit && !disabled
                      ? GOLD + '66'
                      : 'rgba(201,168,76,0.12)'
                  }`,
                  borderRadius:  '8px',
                  color:         isSubmit
                    ? (disabled ? 'rgba(201,168,76,0.2)' : GOLD)
                    : isAction
                    ? DIM
                    : 'rgba(201,168,76,0.75)',
                  fontSize:      isAction ? '18px' : '22px',
                  cursor:        disabled ? 'not-allowed' : 'pointer',
                  fontFamily:    'Georgia, serif',
                  letterSpacing: '0.04em',
                  transition:    'all 0.15s',
                }}
              >
                {loading && isSubmit ? '…' : k}
              </button>
            )
          })}
        </div>

        {/* Clear */}
        {pin.length > 0 && (
          <button
            onClick={() => { setPin(''); setError('') }}
            style={{
              display:       'block',
              width:         '100%',
              marginTop:     '0.75rem',
              background:    'transparent',
              border:        'none',
              color:         'rgba(201,168,76,0.2)',
              fontSize:      '11px',
              letterSpacing: '0.12em',
              cursor:        'pointer',
              textTransform: 'uppercase',
              padding:       '4px',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Dev hint */}
      {import.meta.env.DEV && (
        <div style={{
          marginTop:     '1.5rem',
          color:         '#2a2218',
          fontSize:      '10px',
          letterSpacing: '0.1em',
          textAlign:     'center',
        }}>
          DEV: staff PIN is 1234
        </div>
      )}
    </div>
  )
}
