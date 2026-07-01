import { useState } from 'react'
import { verifyStaffHandoffCredentials, verifyFounderCredentials, STAFF_HANDOFF_AUTH_AVAILABLE, STAFF_DEMO_MODE } from '../../data/staffHandoffRegistry.js'

const GOLD = '#E9C176'

/**
 * Premium staff login panel for the SmokeCraft → POS 3 handoff.
 * Staff enters email + PIN; on success calls onUnlock({ role, displayName, email }).
 * On failure shows "Staff credentials not recognized."
 *
 * In production builds there is no backend endpoint for this email+PIN
 * handoff auth yet, so the form is replaced with a disabled, safe message
 * instead of shipping real credentials in the client bundle.
 */
export default function StaffHandoffLoginModal({ onUnlock, onCancel }) {
  // Demo mode — no credentials required, clear label shown.
  if (STAFF_DEMO_MODE) {
    return <StaffHandoffDemoModal onUnlock={onUnlock} onCancel={onCancel} />
  }

  // No auth path available — honest error.
  if (!STAFF_HANDOFF_AUTH_AVAILABLE) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(5,3,2,0.88)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <div style={{
          width: '100%', maxWidth: 360,
          background: 'rgba(14,10,6,0.97)',
          border: `1px solid rgba(233,193,118,0.25)`,
          borderRadius: 16, padding: '2rem 1.75rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          fontFamily: 'Georgia, serif',
        }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(233,193,118,0.55)', marginBottom: 6,
          }}>
            Staff Handoff
          </div>
          <h2 style={{ color: GOLD, fontSize: '1.3rem', fontWeight: 400, margin: '0 0 1rem', letterSpacing: '0.04em' }}>
            Staff Login Unavailable
          </h2>
          <p style={{ color: 'rgba(229,226,225,0.7)', fontSize: 13, lineHeight: 1.6, margin: '0 0 0.5rem' }}>
            Staff authentication requires secure backend configuration.
          </p>
          <p style={{ color: 'rgba(229,226,225,0.45)', fontSize: 11, lineHeight: 1.6, margin: '0 0 1.5rem', fontFamily: '"JetBrains Mono", monospace' }}>
            Set VITE_FOUNDER_ADMIN_EMAIL + VITE_FOUNDER_ADMIN_PIN in your hosting dashboard to enable founder access, or set VITE_STAFF_DEMO_MODE=true for demo access.
          </p>
          <button
            type="button"
            onClick={onCancel}
            style={{
              width: '100%', height: 44, borderRadius: 8,
              background: 'transparent', border: '1px solid rgba(233,193,118,0.18)',
              color: 'rgba(233,193,118,0.55)', fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return <StaffHandoffLoginForm onUnlock={onUnlock} onCancel={onCancel} />
}

function StaffHandoffDemoModal({ onUnlock, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(5,3,2,0.88)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(14,10,6,0.97)',
        border: `1px solid rgba(233,193,118,0.4)`,
        borderRadius: 16, padding: '2rem 1.75rem',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        fontFamily: 'Georgia, serif',
      }}>
        <div style={{
          display: 'inline-block', fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          background: 'rgba(233,193,118,0.15)', border: '1px solid rgba(233,193,118,0.4)',
          color: GOLD, borderRadius: 4, padding: '3px 8px', marginBottom: 14,
        }}>
          Demo Mode — No real auth, no real data
        </div>
        <h2 style={{ color: GOLD, fontSize: '1.3rem', fontWeight: 400, margin: '0 0 1.5rem', letterSpacing: '0.04em' }}>
          Staff Handoff
        </h2>
        <button
          type="button"
          onClick={() => onUnlock({ role: 'staff', displayName: 'Demo Staff', email: 'demo@crafthub360.com' })}
          style={{
            width: '100%', height: 56, borderRadius: 10, border: 'none',
            background: GOLD, color: '#0a0603', fontFamily: 'Georgia, serif',
            fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase',
            fontWeight: 600, cursor: 'pointer', marginBottom: 10,
          }}
        >
          Enter POS 3 &amp; E.A.T. (Demo)
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
      </div>
    </div>
  )
}

function StaffHandoffLoginForm({ onUnlock, onCancel }) {
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

    // Founder credentials supersede all other access — check first.
    const founderResult = verifyFounderCredentials(email, pin)
    if (founderResult.ok) {
      setChecking(false)
      onUnlock(founderResult)
      return
    }
    if (founderResult.error) {
      // Email matched the founder account but the PIN didn't.
      setChecking(false)
      setError(founderResult.error)
      return
    }

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
