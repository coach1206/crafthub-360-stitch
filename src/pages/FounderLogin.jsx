/**
 * Founder Login — email + PIN + founder challenge (all three required).
 * Founder challenge must match FOUNDER_CHALLENGE_SECRET on the backend.
 * No autocomplete on challenge field. No stored challenge in localStorage.
 */

import { useState } from 'react'
import { useAuth }  from '../context/AuthContext.jsx'

const GOLD   = '#C9A84C'
const RED    = '#cc3333'
const DARK   = '#040201'
const DIM    = 'rgba(201,168,76,0.45)'
const CARD   = 'rgba(10,6,1,0.99)'
const BORDER = 'rgba(201,168,76,0.15)'

const INPUT_STYLE = {
  width:         '100%',
  background:    'rgba(255,255,255,0.02)',
  border:        `1px solid rgba(201,168,76,0.15)`,
  borderRadius:  '4px',
  color:         GOLD,
  fontFamily:    'Georgia, serif',
  fontSize:      '14px',
  letterSpacing: '0.06em',
  outline:       'none',
  padding:       '0.85rem 1rem',
  boxSizing:     'border-box',
}

export default function FounderLogin() {
  const { loginFounder } = useAuth()
  const [email,     setEmail]     = useState('')
  const [pin,       setPin]       = useState('')
  const [challenge, setChallenge] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const clearError = () => setError('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim())     { setError('Email is required');            return }
    if (!pin.trim())       { setError('PIN is required');              return }
    if (!challenge.trim()) { setError('Founder challenge is required'); return }

    setLoading(true)
    setError('')
    const result = await loginFounder(email.trim(), pin.trim(), challenge.trim())
    if (result.success) {
      // Clear challenge from memory
      setChallenge('')
      window.location.href = '/founder'
    } else {
      setError(result.error || 'Authentication failed. All three factors required.')
      setPin('')
      setChallenge('')
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
        color:          'rgba(201,168,76,0.25)',
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
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ color: 'rgba(201,168,76,0.2)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '0.5rem' }}>
          NOVEE OS — RESTRICTED ACCESS
        </div>
        <h1 style={{
          color:         GOLD,
          fontSize:      'clamp(1.1rem, 2.5vw, 1.5rem)',
          fontWeight:    400,
          letterSpacing: '0.14em',
          margin:        '0 0 0.25rem',
          textTransform: 'uppercase',
        }}>
          Founder Level 0
        </h1>
      </div>

      {/* Warning banner */}
      <div style={{
        background:    'rgba(204,51,51,0.07)',
        border:        `1px solid ${RED}33`,
        borderRadius:  '6px',
        padding:       '10px 16px',
        marginBottom:  '1.5rem',
        maxWidth:      '400px',
        width:         '100%',
        display:       'flex',
        gap:           '10px',
        alignItems:    'flex-start',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: `${RED}aa`, flexShrink: 0, marginTop: '1px' }}>
          warning
        </span>
        <div style={{ color: `${RED}88`, fontSize: '11px', lineHeight: 1.7, letterSpacing: '0.04em' }}>
          This is the most privileged access level in NOVEE OS. All login
          attempts are logged. Three factors are required. Failed attempts will
          temporarily lock this account.
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
          maxWidth:     '400px',
        }}
      >
        {/* Email */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{
            display:       'block',
            color:         'rgba(201,168,76,0.3)',
            fontSize:      '10px',
            letterSpacing: '0.18em',
            marginBottom:  '0.45rem',
            textTransform: 'uppercase',
          }}>
            Founder Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); clearError() }}
            autoComplete="email"
            autoFocus
            placeholder="founder@domain.com"
            style={INPUT_STYLE}
          />
        </div>

        {/* PIN */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{
            display:       'block',
            color:         'rgba(201,168,76,0.3)',
            fontSize:      '10px',
            letterSpacing: '0.18em',
            marginBottom:  '0.45rem',
            textTransform: 'uppercase',
          }}>
            Founder PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); clearError() }}
            autoComplete="off"
            inputMode="numeric"
            maxLength={8}
            placeholder="••••"
            style={INPUT_STYLE}
          />
        </div>

        {/* Founder challenge */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{
            display:       'block',
            color:         'rgba(201,168,76,0.3)',
            fontSize:      '10px',
            letterSpacing: '0.18em',
            marginBottom:  '0.45rem',
            textTransform: 'uppercase',
          }}>
            Founder Challenge
          </label>
          <input
            type="password"
            value={challenge}
            onChange={e => { setChallenge(e.target.value); clearError() }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Enter your founder challenge"
            style={INPUT_STYLE}
          />
          <div style={{
            color:         'rgba(201,168,76,0.18)',
            fontSize:      '10px',
            letterSpacing: '0.08em',
            marginTop:     '0.4rem',
          }}>
            Set via FOUNDER_CHALLENGE_SECRET environment variable
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:    'rgba(204,51,51,0.08)',
            border:        `1px solid ${RED}33`,
            borderRadius:  '4px',
            color:         `${RED}cc`,
            fontSize:      '12px',
            letterSpacing: '0.04em',
            padding:       '8px 12px',
            marginBottom:  '1.25rem',
            lineHeight:    1.6,
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width:         '100%',
            background:    loading ? 'rgba(201,168,76,0.04)' : 'rgba(201,168,76,0.10)',
            border:        `1px solid ${loading ? GOLD + '22' : GOLD + '55'}`,
            borderRadius:  '4px',
            color:         loading ? 'rgba(201,168,76,0.3)' : GOLD,
            cursor:        loading ? 'not-allowed' : 'pointer',
            fontFamily:    'Georgia, serif',
            fontSize:      '12px',
            fontWeight:    500,
            letterSpacing: '0.16em',
            padding:       '0.9rem',
            textTransform: 'uppercase',
            transition:    'all 0.2s',
          }}
        >
          {loading ? 'Verifying All Factors…' : 'Access System'}
        </button>
      </form>

      {/* Dev hint */}
      {import.meta.env.DEV && (
        <div style={{
          marginTop:  '1.5rem',
          color:      '#1a1008',
          fontSize:   '10px',
          letterSpacing: '0.1em',
          textAlign:  'center',
          lineHeight: 1.9,
        }}>
          DEV: jccollins1206@yahoo.com / 2501<br />
          Challenge = value of FOUNDER_CHALLENGE_SECRET env var
        </div>
      )}
    </div>
  )
}
