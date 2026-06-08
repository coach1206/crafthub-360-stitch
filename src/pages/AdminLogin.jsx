/**
 * Admin Login — email + PIN for manager and admin roles.
 * Prototype credentials: admin@novee.dev / 9999 (admin), manager@novee.dev / 5678 (manager)
 */

import { useState } from 'react'
import { useAuth }  from '../context/AuthContext.jsx'
import PinPad       from '../components/ui/PinPad.jsx'

const GOLD   = '#C9A84C'
const DARK   = '#060402'
const DIM    = 'rgba(201,168,76,0.45)'
const CARD   = 'rgba(14,9,3,0.98)'
const BORDER = 'rgba(201,168,76,0.18)'

const INPUT_STYLE = {
  width:           '100%',
  background:      'rgba(255,255,255,0.03)',
  border:          `1px solid rgba(201,168,76,0.2)`,
  borderRadius:    '4px',
  color:           GOLD,
  fontFamily:      'Georgia, serif',
  fontSize:        '14px',
  letterSpacing:   '0.06em',
  outline:         'none',
  padding:         '0.85rem 1rem',
  boxSizing:       'border-box',
}

export default function AdminLogin() {
  const { loginAdmin } = useAuth()
  const [email,   setEmail]   = useState('')
  const [pin,     setPin]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const redirectAfterLogin = (role) => {
    if (role === 'founder_level_0') window.location.href = '/founder-demo'
    else if (role === 'manager') window.location.href = '/eat'
    else if (role === 'admin') window.location.href = '/admin'
    else window.location.href = '/'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    if (!pin.trim())   { setError('PIN is required');   return }

    setLoading(true)
    setError('')
    const result = await loginAdmin(email.trim(), pin.trim())
    if (result.success) {
      redirectAfterLogin(result.user?.role)
    } else {
      setError(result.error || 'Invalid credentials. Please try again.')
    }
    setLoading(false)
  }

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
          margin:        '0 0 0.25rem',
          textTransform: 'uppercase',
        }}>
          Manager / Admin Access
        </h1>
        <div style={{ color: 'rgba(201,168,76,0.25)', fontSize: '11px', letterSpacing: '0.1em' }}>
          Email and PIN required
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background:   CARD,
          border:       `1px solid ${BORDER}`,
          borderRadius: '12px',
          padding:      'clamp(1.5rem, 4vw, 2.5rem)',
          width:        '100%',
          maxWidth:     '380px',
        }}
      >
        {/* Email */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display:       'block',
            color:         'rgba(201,168,76,0.4)',
            fontSize:      '10px',
            letterSpacing: '0.18em',
            marginBottom:  '0.5rem',
            textTransform: 'uppercase',
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            autoComplete="email"
            autoFocus
            placeholder="your@email.com"
            style={{
              ...INPUT_STYLE,
              '::placeholder': { color: 'rgba(201,168,76,0.2)' },
            }}
          />
        </div>

        {/* PIN */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{
            display:       'block',
            color:         'rgba(201,168,76,0.4)',
            fontSize:      '10px',
            letterSpacing: '0.18em',
            marginBottom:  '0.75rem',
            textTransform: 'uppercase',
          }}>
            PIN
          </label>
          <PinPad
            value={pin}
            onChange={(v) => { setPin(v); setError('') }}
            maxLength={8}
            disabled={loading}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:    'rgba(204,51,51,0.08)',
            border:        '1px solid rgba(204,51,51,0.25)',
            borderRadius:  '4px',
            color:         'rgba(220,80,80,0.9)',
            fontSize:      '12px',
            letterSpacing: '0.05em',
            padding:       '8px 12px',
            marginBottom:  '1.25rem',
            lineHeight:    1.6,
          }}>
            {error.includes('Founder Level 0') ? (
              <>
                Founder Level 0 accounts use a separate login.{' '}
                <a href="/founder-login" style={{ color: '#C9A84C', fontWeight: 600 }}>
                  Sign in here →
                </a>
              </>
            ) : error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width:         '100%',
            background:    loading ? 'rgba(201,168,76,0.05)' : GOLD,
            border:        'none',
            borderRadius:  '4px',
            color:         loading ? GOLD : '#060402',
            cursor:        loading ? 'not-allowed' : 'pointer',
            fontFamily:    'Georgia, serif',
            fontSize:      '13px',
            fontWeight:    600,
            letterSpacing: '0.14em',
            padding:       '0.9rem',
            textTransform: 'uppercase',
            transition:    'all 0.2s',
          }}
        >
          {loading ? 'Verifying…' : 'Login'}
        </button>
      </form>

      {/* Founder link */}
      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <a href="/founder-login" style={{
          color:          'rgba(201,168,76,0.30)',
          fontSize:       '11px',
          letterSpacing:  '0.1em',
          textDecoration: 'none',
          textTransform:  'uppercase',
        }}>
          Founder Level 0? Sign in here →
        </a>
      </div>

      {/* Dev hint */}
      {import.meta.env.DEV && (
        <div style={{
          marginTop:  '1rem',
          color:      '#2a2218',
          fontSize:   '10px',
          letterSpacing: '0.1em',
          textAlign:  'center',
          lineHeight: 1.9,
        }}>
          DEV: admin@novee.dev / 9999<br />
          DEV: manager@novee.dev / 5678
        </div>
      )}
    </div>
  )
}
