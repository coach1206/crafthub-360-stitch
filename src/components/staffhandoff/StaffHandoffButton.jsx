import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSecurity } from '../../context/SecurityContext.jsx'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import StaffHandoffLoginModal from './StaffHandoffLoginModal.jsx'
import RippleDissolve from './RippleDissolve.jsx'
import { buildHandoffPayload, saveHandoff, saveStaffSession } from '../../services/staffHandoffService.js'

const STAFF_ROLES = new Set(['staff', 'manager', 'admin', 'founder_level_0'])

/**
 * Staff-only trigger placed on customer-facing SmokeCraft handoff points
 * (e.g. SessionComplete). Hidden from public/guest customers by default —
 * a small discreet dot reveals the actual "Accept Staff Handoff" CTA, which
 * always requires the staff email + PIN gate before POS 3 opens.
 *
 * If the device is already an authenticated staff session, the CTA reads
 * "Open in POS 3" and skips straight to the transition (no re-login needed).
 */
export default function StaffHandoffButton({ tableId = null }) {
  const navigate = useNavigate()
  const { role, setRole } = useSecurity()
  const { session } = useGuestSession()

  // 'hidden' -> 'revealed' -> 'login' -> 'transition'
  const [mode, setMode] = useState('hidden')

  const alreadyStaff = STAFF_ROLES.has(role)

  function startHandoff(staffInfo) {
    if (staffInfo) saveStaffSession(staffInfo)
    const payload = buildHandoffPayload(session, { tableId })
    saveHandoff(payload)
    setMode('transition')
  }

  function handleUnlock({ role: staffRole, displayName, email }) {
    setRole(staffRole, { displayName, email })
    startHandoff({ email, role: staffRole, staffName: displayName })
  }

  function handleTransitionComplete() {
    navigate(tableId ? `/pos/table/${tableId}` : '/pos')
  }

  if (mode === 'transition') {
    return <RippleDissolve onComplete={handleTransitionComplete} durationMs={1100} />
  }

  if (mode === 'login') {
    return (
      <StaffHandoffLoginModal
        onUnlock={handleUnlock}
        onCancel={() => setMode('hidden')}
      />
    )
  }

  if (mode === 'hidden' && !alreadyStaff) {
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

  // 'revealed' (guest tapped the dot) or already an authenticated staff session
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
