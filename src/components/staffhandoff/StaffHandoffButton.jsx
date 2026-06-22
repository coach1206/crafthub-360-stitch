import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSecurity } from '../../context/SecurityContext.jsx'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import StaffHandoffLoginModal from './StaffHandoffLoginModal.jsx'
import RippleDissolve from './RippleDissolve.jsx'
import { buildHandoffPayload, saveHandoff, saveStaffSession } from '../../services/staffHandoffService.js'

const STAFF_ROLES = new Set(['staff', 'manager', 'admin', 'founder_level_0'])

/**
 * Staff-only trigger placed on customer-facing handoff points (e.g.
 * SmokeCraft SessionComplete, the CraftHub "Staff Handoff" tile). Hidden
 * from public/guest customers by default — a small discreet dot reveals
 * the actual "Accept Staff Handoff" CTA, which always requires the staff
 * email + PIN gate before any back-of-house system opens.
 *
 * If the device is already an authenticated staff session, the CTA reads
 * "Open in POS 3" / "Open in E.A.T." and skips straight to the transition
 * (no re-login needed). Both destinations land on the current/active route
 * trees (/pos3, /eat) — not the legacy /pos or /eat-legacy pages.
 *
 * allowedDestinations: which systems staff may hand off into.
 *   - ['pos']            (default) — original SmokeCraft behavior, no
 *                          destination picker, goes straight to POS 3.
 *   - ['pos', 'eat']      — shows a destination picker after unlock
 *                          (used by the CraftHub Staff Handoff tile).
 *
 * startOpen + onClose: lets a caller (e.g. CraftHub) drive this component
 * as a controlled modal instead of rendering its own floating dot.
 */
export default function StaffHandoffButton({ tableId = null, allowedDestinations = ['pos'], startOpen = false, onClose }) {
  const navigate = useNavigate()
  const { role, setRole } = useSecurity()
  const { session } = useGuestSession()

  const alreadyStaff = STAFF_ROLES.has(role)
  const multiDestination = allowedDestinations.length > 1

  // 'hidden' -> 'revealed' -> 'login' -> 'choose' (multi-destination only) -> 'transition'
  const [mode, setMode] = useState(() => {
    if (!startOpen) return 'hidden'
    if (!alreadyStaff) return 'login'
    return multiDestination ? 'choose' : 'revealed'
  })
  const [destination, setDestination] = useState(allowedDestinations[0])

  function close() {
    setMode('hidden')
    onClose?.()
  }

  function commitHandoff(dest) {
    setDestination(dest)
    const payload = buildHandoffPayload(session, { tableId, destination: dest })
    saveHandoff(payload)
    setMode('transition')
  }

  function startHandoff(staffInfo) {
    if (staffInfo) saveStaffSession(staffInfo)
    if (multiDestination) {
      setMode('choose')
      return
    }
    commitHandoff(allowedDestinations[0])
  }

  function handleUnlock({ role: staffRole, displayName, email }) {
    setRole(staffRole, { displayName, email })
    startHandoff({ email, role: staffRole, staffName: displayName })
  }

  function handleTransitionComplete() {
    if (destination === 'eat') { navigate('/eat'); return }
    navigate(tableId ? '/pos3/tables' : '/pos3')
  }

  if (mode === 'transition') {
    return <RippleDissolve onComplete={handleTransitionComplete} durationMs={1100} />
  }

  if (mode === 'login') {
    return (
      <StaffHandoffLoginModal
        onUnlock={handleUnlock}
        onCancel={startOpen ? close : () => setMode('hidden')}
      />
    )
  }

  if (mode === 'choose') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(5,3,2,0.88)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <div style={{
          width: '100%', maxWidth: 360,
          background: 'rgba(14,10,6,0.97)',
          border: '1px solid rgba(233,193,118,0.25)',
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
          <h2 style={{ color: '#E9C176', fontSize: '1.3rem', fontWeight: 400, margin: '0 0 1.5rem', letterSpacing: '0.04em' }}>
            Choose a destination
          </h2>

          {allowedDestinations.includes('pos') && (
            <button
              onClick={() => commitHandoff('pos')}
              style={{
                width: '100%', height: 50, borderRadius: 10, border: 'none',
                background: '#E9C176', color: '#0a0603', fontFamily: 'Georgia, serif',
                fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
                fontWeight: 600, cursor: 'pointer', marginBottom: 10,
              }}
            >
              POS 3
            </button>
          )}

          {allowedDestinations.includes('eat') && (
            <button
              onClick={() => commitHandoff('eat')}
              style={{
                width: '100%', height: 50, borderRadius: 10,
                border: '1px solid rgba(233,193,118,0.4)', background: 'rgba(233,193,118,0.1)',
                color: '#E9C176', fontFamily: 'Georgia, serif',
                fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
                fontWeight: 600, cursor: 'pointer', marginBottom: 10,
              }}
            >
              E.A.T. System
            </button>
          )}

          <button
            type="button"
            onClick={startOpen ? close : () => setMode('hidden')}
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

  if (mode === 'hidden') {
    if (startOpen) return null
    if (!alreadyStaff) {
      return (
        <button
          onClick={() => setMode('revealed')}
          aria-label="Staff handoff"
          style={{
            position: 'fixed', bottom: 14, right: 14, zIndex: 60,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(10,6,3,0.5)', border: '1px solid rgba(233,193,118,0.18)',
            color: 'rgba(233,193,118,0.35)', fontSize: 10,
            fontFamily: '"JetBrains Mono", monospace', cursor: 'pointer',
          }}
        >
          ●
        </button>
      )
    }
  }

  // 'revealed' (guest tapped the dot) or already an authenticated staff
  // session with a single allowed destination.
  return (
    <button
      onClick={() => (alreadyStaff ? startHandoff(null) : setMode('login'))}
      style={{
        position: 'fixed', bottom: 14, right: 14, zIndex: 60,
        display: 'flex', alignItems: 'center', gap: 8,
        height: 44, padding: '0 18px', borderRadius: 22,
        background: 'rgba(233,193,118,0.12)', border: '1px solid rgba(233,193,118,0.4)',
        color: '#E9C176', fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      {alreadyStaff ? 'Open in POS 3' : 'Accept Staff Handoff'}
    </button>
  )
}
