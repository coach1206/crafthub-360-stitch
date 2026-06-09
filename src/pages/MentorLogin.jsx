/**
 * Human Mentor Login — T014
 * Email + PIN authentication for NOVEE OS Human Mentor role.
 * Sidecar role — permission-gated, not hierarchy-gated.
 */

import { useState } from 'react'
import { useAuth }  from '../context/AuthContext.jsx'

const GOLD   = '#C9A84C'
const DARK   = '#060402'
const DIM    = 'rgba(201,168,76,0.45)'
const CARD   = 'rgba(14,9,3,0.98)'
const BORDER = 'rgba(201,168,76,0.18)'
const MAX_DIGITS = 6

export default function MentorLogin() {
  const { loginMentor } = useAuth()
  const [email,   setEmail]   = useState('')
  const [pin,     setPin]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const append = (d) => {
    if (pin.length >= MAX_DIGITS) return
    setPin(p => p + d)
    setError('')
  }

  const submit = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address.'); return }
    if (pin.length < 4)       { setError('PIN must be at least 4 digits.'); return }
    setLoading(true)
    setError('')
    const result = await loginMentor(email.trim().toLowerCase(), pin)
    if (result.success) {
      window.location.href = '/mentor-console'
    } else {
      setError(result.error || 'Invalid credentials or access not granted.')
      setPin('')
    }
    setLoading(false)
  }

  const KEYS = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['←','0','✓'],
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
      <a href="/" style={{
        position:       'absolute', top: '1.5rem', left: '1.5rem',
        color:          'rgba(201,168,76,0.35)', textDecoration: 'none',
        fontSize:       '12px', letterSpacing: '0.1em',
        display:        'flex', alignItems: 'center', gap: '4px',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
        HOME
      </a>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width:  48, height: 48, borderRadius: '50%',
          background: 'rgba(201,168,76,0.08)', border: `1px solid ${GOLD}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: GOLD }}>school</span>
        </div>
        <div style={{ color: DIM, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '0.4rem' }}>
          NOVEE OS
        </div>
        <h1 style={{
          color: GOLD, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
          fontWeight: 400, letterSpacing: '0.12em',
          margin: 0, textTransform: 'uppercase',
        }}>
          Human Mentor Access
        </h1>
        <div style={{ color: 'rgba(201,168,76,0.25)', fontSize: '11px', marginTop: '0.4rem', letterSpacing: '0.1em' }}>
          Enter your email and mentor PIN
        </div>
      </div>

      <div style={{
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: '12px', padding: 'clamp(1.5rem, 4vw, 2.25rem)',
        width: '100%', maxWidth: '320px',
      }}>
        {/* Email field */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block', color: 'rgba(201,168,76,0.35)',
            fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
            marginBottom: '6px', fontFamily: '"JetBrains Mono", monospace',
          }}>
            Mentor Email
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="mentor@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${email ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.12)'}`,
              borderRadius: '6px', color: GOLD, fontSize: '13px',
              fontFamily: 'Georgia, serif', padding: '10px 12px',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
            onBlur={e  => e.target.style.borderColor = email ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.12)'}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(201,168,76,0.08)', margin: '0 0 1.25rem' }} />

        {/* PIN dots */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '0.75rem',
          marginBottom: '1.25rem', minHeight: '24px', alignItems: 'center',
        }}>
          {Array.from({ length: MAX_DIGITS }).map((_, i) => (
            <div key={i} style={{
              width: '14px', height: '14px', borderRadius: '50%',
              background:   i < pin.length ? GOLD : 'transparent',
              border:       `2px solid ${i < pin.length ? GOLD : 'rgba(201,168,76,0.2)'}`,
              transition:   'all 0.15s',
            }} />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(204,51,51,0.08)', border: '1px solid rgba(204,51,51,0.25)',
            borderRadius: '4px', color: 'rgba(220,80,80,0.9)',
            fontSize: '12px', letterSpacing: '0.05em',
            padding: '8px 12px', textAlign: 'center', marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {/* PIN pad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem' }}>
          {KEYS.flat().map((k) => {
            const isBack   = k === '←'
            const isSubmit = k === '✓'
            const disabled = loading || (isSubmit && (pin.length < 4 || !email.includes('@')))
            return (
              <button
                key={k}
                onClick={() => {
                  if (disabled) return
                  if (isBack)   { setPin(p => p.slice(0,-1)); setError(''); return }
                  if (isSubmit) { submit(); return }
                  append(k)
                }}
                style={{
                  height:      '72px',
                  background:  isSubmit ? (disabled ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.12)')
                               : 'rgba(255,255,255,0.04)',
                  border:      `1px solid ${isSubmit && !disabled ? GOLD + '66' : 'rgba(201,168,76,0.12)'}`,
                  borderRadius:'8px',
                  color:       isSubmit ? (disabled ? 'rgba(201,168,76,0.2)' : GOLD)
                               : isBack ? DIM : 'rgba(201,168,76,0.75)',
                  fontSize:    (isBack || isSubmit) ? '18px' : '22px',
                  cursor:      disabled ? 'not-allowed' : 'pointer',
                  fontFamily:  'Georgia, serif',
                  transition:  'all 0.15s',
                }}
              >
                {loading && isSubmit ? '…' : k}
              </button>
            )
          })}
        </div>

        {pin.length > 0 && (
          <button
            onClick={() => { setPin(''); setError('') }}
            style={{
              display: 'block', width: '100%', marginTop: '0.75rem',
              background: 'transparent', border: 'none',
              color: 'rgba(201,168,76,0.2)', fontSize: '11px',
              letterSpacing: '0.12em', cursor: 'pointer',
              textTransform: 'uppercase', padding: '4px',
            }}
          >
            Clear PIN
          </button>
        )}
      </div>

      {/* Mentor request link */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <span style={{ color: 'rgba(201,168,76,0.2)', fontSize: '11px', letterSpacing: '0.08em' }}>
          Not a registered mentor?{' '}
        </span>
        <a href="/" style={{ color: 'rgba(201,168,76,0.4)', fontSize: '11px', letterSpacing: '0.08em' }}>
          Contact an administrator
        </a>
      </div>

      {import.meta.env.DEV && (
        <div style={{ marginTop: '1rem', color: '#2a2218', fontSize: '10px', letterSpacing: '0.1em', textAlign: 'center' }}>
          DEV: seed mentor credentials in server/db/seeds/seedMentorUsers.js
        </div>
      )}
    </div>
  )
}
