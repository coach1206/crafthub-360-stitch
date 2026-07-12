/**
 * SmokeCraft Demo Reset
 *
 * Founder/investor utility: clears all SmokeCraft session state and
 * re-enters demo mode so the full 24-step journey can be walked again
 * from the beginning without a browser wipe.
 *
 * Usage: navigate to /smokecraft/demo-reset (founder/demo-mode only).
 * Not linked from guest-facing pages.
 */
import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../../context/DemoModeContext.jsx'
import { clearSession } from '../../services/sessionStorageService.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const SMOKECRAFT_SESSION_KEYS = [
  'novee_guest_session',
  'smokecraft_progress',
  'smokecraft_session',
  'sc_step',
]

function purgeSmokeCraftState() {
  SMOKECRAFT_SESSION_KEYS.forEach(k => {
    try { localStorage.removeItem(k) } catch { /* ignore */ }
    try { sessionStorage.removeItem(k) } catch { /* ignore */ }
  })
  try { clearSession() } catch { /* ignore */ }
}

export default function SmokeCraftDemoReset() {
  const navigate = useNavigate()
  const { isDemoMode, enterDemoMode } = useDemoMode()

  function handleReset() {
    purgeSmokeCraftState()
    enterDemoMode()
    navigate('/smokecraft', { replace: true })
  }

  function handleCancel() {
    navigate(-1)
  }

  const btn = {
    background: GOLD,
    color: DARK,
    border: 'none',
    borderRadius: 24,
    padding: '14px 32px',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'Georgia, serif',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    minHeight: 48,
  }

  const btnOutline = {
    ...btn,
    background: 'transparent',
    color: GOLD,
    border: `1px solid rgba(233,193,118,0.4)`,
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: DARK,
      color: '#f1e6c8',
      padding: 32,
      gap: 24,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
        SmokeCraft 360 — Investor Demo
      </div>

      <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#f1e6c8', maxWidth: 340 }}>
        Reset Demo Session
      </div>

      <div style={{ fontSize: 13, color: 'rgba(241,230,200,0.7)', maxWidth: 300, lineHeight: 1.6 }}>
        Clears all SmokeCraft session progress and returns you to the beginning of the guest journey. Use this before each investor walkthrough.
      </div>

      {!isDemoMode && (
        <div style={{ fontSize: 11, color: 'rgba(233,193,118,0.6)', background: 'rgba(233,193,118,0.08)', border: '1px solid rgba(233,193,118,0.2)', borderRadius: 8, padding: '8px 16px' }}>
          Demo mode will be activated automatically.
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" style={btnOutline} onClick={handleCancel}>
          Cancel
        </button>
        <button type="button" style={btn} onClick={handleReset} aria-label="Reset SmokeCraft demo session">
          Reset &amp; Start Demo →
        </button>
      </div>

      <div style={{ fontSize: 10, color: 'rgba(241,230,200,0.35)', maxWidth: 280, lineHeight: 1.5 }}>
        Only clears SmokeCraft session data. No backend data, user accounts, or inventory is affected.
      </div>
    </div>
  )
}
