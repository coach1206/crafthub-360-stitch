import { useState } from 'react'
import { verifyStaffHandoffCredentials } from '../../data/staffHandoffRegistry.js'

const GOLD = '#E9C176'

/**
 * Premium staff login panel for the SmokeCraft → POS 3 handoff.
 * Staff enters email + PIN; on success calls onUnlock({ role, displayName, email }).
 * On failure shows "Staff credentials not recognized."
 */
export default function StaffHandoffLoginModal({ onUnlock, onCancel }) {
  const [email, setEmail] = useState('')
  const [pin,   setPin]   = useState('')
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4 to 6 digits.')
      return
    }

    setChecking(true)
    const result = verifyStaffHandoffCredentials(email, pin)
    setChecking(false)

    if (!result.ok) {
      setError('Staff credentials not recognized.')
      return
    }

    onUnlock(result)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(5,3,2,0.88)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%', maxWidth: 360,
          background: 'rgba(14,10,6,0.97)',
          border: `1px solid rgba(233,193,118,0.25)`,
          borderRadius: 16, padding: '2rem 1.75rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(233,193,118,0.55)', marginBottom: 6,
        }}>
          Staff Handoff
        </div>
        <h2 style={{ color: GOLD, fontSize: '1.3rem', fontWeight: 400, margin: '0 0 1.5rem', letterSpacing: '0.04em' }}>
          Unlock POS 3 Access
        </h2>

        <label style={{ display: 'block', fontSize: 11, color: 'rgba(233,193,118,0.5)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Staff Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="off"
          required
          style={{
            width: '100%', height: 44, padding: '0 12px', marginBottom: 14,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(233,193,118,0.2)',
            borderRadius: 8, color: '#E5E2E1', fontSize: 14, boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'block', fontSize: 11, color: 'rgba(233,193,118,0.5)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Staff PIN
        </label>
        <input
          type="password"
          inputMode="numeric"
          pattern="\d{4,6}"
          maxLength={6}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          autoComplete="off"
          required
          style={{
            width: '100%', height: 44, padding: '0 12px', marginBottom: 18,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(233,193,118,0.2)',
            borderRadius: 8, color: '#E5E2E1', fontSize: 14, letterSpacing: '0.3em', boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{
            color: '#E07A6B', fontSize: 12, marginBottom: 14,
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={checking}
          style={{
            width: '100%', height: 50, borderRadius: 10, border: 'none',
            background: GOLD, color: '#0a0603', fontFamily: 'Georgia, serif',
            fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
            fontWeight: 600, cursor: checking ? 'default' : 'pointer',
            opacity: checking ? 0.7 : 1, marginBottom: 10,
          }}
        >
          Unlock Staff Handoff
        </button>

        <button
          type="button"
          onClick={onCancel}
          style={{
            width: '100%', height: 38, borderRadius: 8,
            background: 'transparent', border: '1px solid rgba(233,193,118,0.18)',
            color: 'rgba(233,193,118,0.55)', fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </form>
    </div>
  )
}
