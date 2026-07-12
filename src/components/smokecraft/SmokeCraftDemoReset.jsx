/**
 * SmokeCraft Demo Reset
 *
 * Founder/investor-only utility. Clears SmokeCraft session progress on THIS
 * DEVICE ONLY (localStorage/sessionStorage) so the 24-step journey can be
 * walked from the beginning without a browser wipe.
 *
 * ACCESS RESTRICTION:
 *   - Allowed if device is already in investor demo mode (sessionStorage
 *     novee_demo_mode=1), meaning a founder/operator already activated it.
 *   - Allowed if the authenticated session has role >= admin (level 3+).
 *   - Blocked for all guest and staff sessions with no demo mode active.
 *
 * WHAT IS CLEARED (device-local only):
 *   - novee_guest_session (localStorage) — SmokeCraft progress, scores, XP
 *   - smokecraft_progress (localStorage) — progress mirror
 *   - novee_demo_mode, novee_booted (sessionStorage) — re-seeded after reset
 *
 * WHAT IS NEVER TOUCHED:
 *   - Any backend database (Postgres)
 *   - Other users' sessions or data
 *   - Auth tokens or user accounts
 *   - Inventory, orders, or payment records
 */
import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../../context/DemoModeContext.jsx'
import { useSecurity } from '../../context/SecurityContext.jsx'
import { meetsMinRole } from '../../config/roleMap.js'
import { clearSession } from '../../services/sessionStorageService.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'
const RED  = '#c0392b'

// All device-local SmokeCraft keys that encode session state.
// MUST be kept in sync with sessionStorageService.js STORAGE_KEY and
// SmokeCraftProgressContext's localStorage mirror key.
const LOCAL_SESSION_KEYS = ['novee_guest_session', 'smokecraft_progress']
const SESSION_STATE_KEYS  = ['smokecraft_session', 'sc_step']

function purgeLocalSessionState() {
  LOCAL_SESSION_KEYS.forEach(k => { try { localStorage.removeItem(k) } catch { /**/ } })
  SESSION_STATE_KEYS.forEach(k => { try { sessionStorage.removeItem(k) } catch { /**/ } })
  try { clearSession() } catch { /**/ }
}

function AccessDenied({ onBack }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: DARK, color: '#f1e6c8', padding: 32, gap: 20, textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: RED, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
        Access Restricted
      </div>
      <div style={{ fontSize: 18, fontFamily: 'Georgia, serif', fontWeight: 700, maxWidth: 320 }}>
        Demo Reset is for authorized operators only.
      </div>
      <div style={{ fontSize: 12, color: 'rgba(241,230,200,0.55)', maxWidth: 300, lineHeight: 1.7 }}>
        This page requires an active investor demo mode session or an admin / founder login.
        Guests cannot access this control.
      </div>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginTop: 8, background: 'transparent', color: GOLD,
          border: `1px solid rgba(233,193,118,0.35)`, borderRadius: 24,
          padding: '12px 28px', fontSize: 12, fontWeight: 700,
          fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 44,
        }}
      >
        ← Go Back
      </button>
    </div>
  )
}

export default function SmokeCraftDemoReset() {
  const navigate  = useNavigate()
  const { isDemoMode, enterDemoMode } = useDemoMode()
  const { role }  = useSecurity()

  // Access is allowed only if the device is already in demo mode OR the
  // authenticated role is admin or higher.
  const isAuthorized = isDemoMode || meetsMinRole(role, 'admin')

  function handleReset() {
    purgeLocalSessionState()
    enterDemoMode()
    navigate('/smokecraft', { replace: true })
  }

  if (!isAuthorized) {
    return <AccessDenied onBack={() => navigate('/')} />
  }

  const btn = {
    background: GOLD, color: DARK, border: 'none', borderRadius: 24,
    padding: '14px 32px', fontSize: 13, fontWeight: 700,
    fontFamily: 'Georgia, serif', letterSpacing: '0.08em', cursor: 'pointer', minHeight: 48,
  }
  const btnOutline = {
    ...btn, background: 'transparent', color: GOLD,
    border: `1px solid rgba(233,193,118,0.4)`,
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: DARK, color: '#f1e6c8', padding: 32, gap: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
        SmokeCraft 360 — Investor Demo Utility
      </div>

      <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#f1e6c8', maxWidth: 340 }}>
        Reset Demo Session
      </div>

      <div style={{ fontSize: 13, color: 'rgba(241,230,200,0.7)', maxWidth: 300, lineHeight: 1.6 }}>
        Clears SmokeCraft session progress on this device and returns to the beginning of the guest journey. Use before each investor walkthrough.
      </div>

      <div style={{
        fontSize: 11, color: 'rgba(233,193,118,0.65)',
        background: 'rgba(233,193,118,0.06)',
        border: '1px solid rgba(233,193,118,0.18)',
        borderRadius: 8, padding: '10px 16px', maxWidth: 320, lineHeight: 1.6,
      }}>
        <strong style={{ display: 'block', marginBottom: 4 }}>What gets cleared:</strong>
        Session progress, scores, and XP on this device only.
        <br />
        <strong style={{ display: 'block', marginTop: 6 }}>What is never touched:</strong>
        Backend database, other users' sessions, auth tokens, orders, or inventory.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" style={btnOutline} onClick={() => navigate(-1)} aria-label="Cancel and go back">
          Cancel
        </button>
        <button type="button" style={btn} onClick={handleReset} aria-label="Reset SmokeCraft demo session and go to landing">
          Reset &amp; Start Demo →
        </button>
      </div>

      <div style={{ fontSize: 10, color: 'rgba(241,230,200,0.3)', maxWidth: 280, lineHeight: 1.5 }}>
        Authorized: {isDemoMode ? 'investor demo mode active' : `role: ${role}`}
      </div>
    </div>
  )
}
