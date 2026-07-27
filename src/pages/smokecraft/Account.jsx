/**
 * SmokeCraft Account — Holistic Fix 4B.
 *
 * A single screen covering all required account surfaces (Create
 * Account, Sign In, Sign Out, Save Progress prompt, conversion success/
 * conflict, session expired, account unavailable/offline) via internal
 * view-state switching, using SmokeCraftScreenShell's mode="live"
 * (matches every other content screen in this module — same fonts,
 * colors, safe-area/scroll contract). No approved-visual redesign; this
 * is a net-new utility screen, not a migration of an existing one.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: `1.5px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)',
  color: CREAM, fontFamily: 'Georgia, serif', fontSize: 15, marginBottom: 12,
  boxSizing: 'border-box', minHeight: 44,
}
const buttonStyle = (primary) => ({
  padding: '12px 24px', borderRadius: 24, fontFamily: 'Georgia, serif',
  fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44,
  border: primary ? 'none' : `1.5px solid ${GOLD}`,
  background: primary ? GOLD : 'transparent',
  color: primary ? '#0a0603' : GOLD,
})

async function api(path, opts = {}) {
  const res = await fetch(`/api/smokecraft/account${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

export default function Account() {
  const navigate = useNavigate()
  const [view, setView] = useState('loading') // loading | signed-out | create | pin | signed-in | conversion-success | conversion-conflict | error
  const [me, setMe] = useState(null)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [devPin, setDevPin] = useState(null)
  const [error, setError] = useState(null)
  const [conversionResult, setConversionResult] = useState(null)

  const checkMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await res.json()
      if (data?.data?.authenticated && data.data.role === 'passport_member') {
        setMe(data.data)
        setView('signed-in')
      } else {
        setView('signed-out')
      }
    } catch {
      setView('error')
    }
  }, [])

  useEffect(() => { checkMe() }, [checkMe])

  async function handleCreateAccount() {
    setError(null)
    if (!email) { setError('Enter your email.'); return }
    const { status, data } = await api('/create', { method: 'POST', body: { email, displayName } })
    if (status === 201 && data.success) {
      triggerHaptic('medium')
      setDevPin(data.devDeliveryPin || null)
      await convertGuestNow()
    } else {
      setError(data?.error === 'email_already_registered' ? 'An account already exists for this email — sign in instead.' : 'Could not create account. Please try again.')
    }
  }

  async function handleRequestPin() {
    setError(null)
    if (!email) { setError('Enter your email.'); return }
    const { data } = await api('/login/request-pin', { method: 'POST', body: { email } })
    setDevPin(data?.devDeliveryPin || null)
    setView('pin')
  }

  async function handleLogin() {
    setError(null)
    if (!pin) { setError('Enter your PIN.'); return }
    const { status, data } = await api('/login', { method: 'POST', body: { email, pin } })
    if (status === 200 && data.success) {
      triggerHaptic('medium')
      await convertGuestNow()
    } else if (status === 423) {
      setError('Too many attempts — this account is temporarily locked.')
    } else {
      setError('Incorrect PIN. Please try again.')
    }
  }

  async function convertGuestNow() {
    try {
      const idempotencyKey = `convert::${email}::${Date.now()}`
      const res = await fetch('/api/smokecraft/player-state/convert-guest', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        setConversionResult(data.conversion)
        setView('conversion-success')
      } else if (res.status === 400 && data?.error === 'no_guest_session') {
        // Nothing to convert (first-time visitor with no prior guest
        // progress) — not an error, just sign them in directly.
        await checkMe()
      } else {
        setConversionResult(data)
        setView('conversion-conflict')
      }
    } catch {
      setView('error')
    }
  }

  async function handleSignOut() {
    await api('/logout', { method: 'POST' })
    triggerHaptic('light')
    setMe(null)
    setEmail(''); setPin(''); setDevPin(null)
    setView('signed-out')
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(20px,5vw,40px) clamp(16px,4vw,24px) 100px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', color: GOLD, fontSize: 'clamp(22px,4vw,30px)', marginBottom: 8 }}>
          SmokeCraft Account
        </h1>
        <p style={{ color: 'rgba(229,226,225,0.6)', fontSize: 13, marginBottom: 24 }}>
          Save your progress and resume it on any device.
        </p>

        {view === 'loading' && (
          <p style={{ color: 'rgba(229,226,225,0.5)' }}>Checking your session…</p>
        )}

        {view === 'signed-in' && me && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <p style={{ color: CREAM, marginBottom: 4 }}>Signed in as</p>
            <p style={{ color: GOLD, fontSize: 18, marginBottom: 20 }}>{me.email}</p>
            <button style={buttonStyle(false)} onClick={handleSignOut}>Sign Out</button>
          </div>
        )}

        {(view === 'signed-out' || view === 'create') && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <p style={{ color: 'rgba(233,193,118,0.85)', fontSize: 13, marginBottom: 14 }}>
              Create an account to keep your SmokeCraft progress safe and pick it up on another device — or sign in if you already have one.
            </p>
            <input style={inputStyle} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email address" />
            {view === 'create' && (
              <input style={inputStyle} type="text" placeholder="Display name (optional)" value={displayName} onChange={e => setDisplayName(e.target.value)} aria-label="Display name" />
            )}
            {error && <p style={{ color: '#e9a75e', fontSize: 13, marginBottom: 10 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {view === 'signed-out' ? (
                <>
                  <button style={buttonStyle(true)} onClick={() => { setView('create'); setError(null) }}>Create Account</button>
                  <button style={buttonStyle(false)} onClick={handleRequestPin}>Sign In</button>
                </>
              ) : (
                <>
                  <button style={buttonStyle(true)} onClick={handleCreateAccount}>Create Account & Save Progress</button>
                  <button style={buttonStyle(false)} onClick={() => setView('signed-out')}>Back</button>
                </>
              )}
            </div>
          </div>
        )}

        {view === 'pin' && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <p style={{ color: 'rgba(233,193,118,0.85)', fontSize: 13, marginBottom: 14 }}>
              Enter the login PIN sent to {email}.
            </p>
            {devPin && (
              <p style={{ color: '#e9a75e', fontSize: 12, marginBottom: 10 }}>
                Development mode — no email provider is connected. Your PIN: <strong>{devPin}</strong>
              </p>
            )}
            <input style={inputStyle} type="text" inputMode="numeric" placeholder="6-digit PIN" value={pin} onChange={e => setPin(e.target.value)} aria-label="Login PIN" />
            {error && <p style={{ color: '#e9a75e', fontSize: 13, marginBottom: 10 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={buttonStyle(true)} onClick={handleLogin}>Sign In</button>
              <button style={buttonStyle(false)} onClick={() => setView('signed-out')}>Back</button>
            </div>
          </div>
        )}

        {view === 'conversion-success' && conversionResult && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <p style={{ color: GOLD, fontSize: 16, marginBottom: 10 }}>Progress saved to your account.</p>
            <p style={{ color: 'rgba(229,226,225,0.7)', fontSize: 13, marginBottom: 4 }}>
              {conversionResult.sessions_transferred} session{conversionResult.sessions_transferred === 1 ? '' : 's'} and {conversionResult.awards_transferred} award{conversionResult.awards_transferred === 1 ? '' : 's'} transferred.
            </p>
            <button style={{ ...buttonStyle(true), marginTop: 14 }} onClick={() => navigate('/smokecraft/resume')}>Continue</button>
          </div>
        )}

        {view === 'conversion-conflict' && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <p style={{ color: '#e9a75e', fontSize: 14, marginBottom: 10 }}>
              You're signed in, but your guest progress could not be linked automatically.
            </p>
            <p style={{ color: 'rgba(229,226,225,0.6)', fontSize: 12, marginBottom: 14 }}>
              This can happen if this browser's guest session was already converted to a different account. Your account itself is signed in and safe.
            </p>
            <button style={buttonStyle(true)} onClick={() => navigate('/smokecraft/resume')}>Continue</button>
          </div>
        )}

        {view === 'error' && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <p style={{ color: '#e9a75e', fontSize: 14 }}>Account services are temporarily unavailable. Your progress is still safely cached on this device.</p>
          </div>
        )}
      </div>
    </SmokeCraftScreenShell>
  )
}
