/**
 * LockedSmokeCraftScreen
 *
 * Full-screen lock screen shown by SmokeCraftSessionGuard when the requested
 * session hasn't been unlocked yet. Dark/gold/premium aesthetic — no generic
 * dashboard styling.
 *
 * Props:
 *   sessionNumber  — 1–24 locked session number
 */
import { useNavigate } from 'react-router-dom'
import {
  getSessionByNumber,
  getVisitBySession,
  getLockedReason,
  getCurrentAllowedSession,
  TOTAL_VISITS,
} from '../../constants/smokecraftJourney.js'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'

export default function LockedSmokeCraftScreen({ sessionNumber }) {
  const navigate = useNavigate()
  const { isDemoMode, isLocalPreviewMode, modeLabel, isSessionUnlocked: checkUnlocked } = useSmokeCraftProgress()

  const session = getSessionByNumber(sessionNumber)
  const visit   = getVisitBySession(sessionNumber)
  const visitNumber = visit?.visit || 1
  const visitTitle  = visit?.title || 'Next Visit'

  // Derive the "current allowed" to navigate back to
  // We use getCurrentAllowedSession directly with no-progress signal so we
  // always send them somewhere useful, even if context isn't available.
  const allowedRoute = (() => {
    try {
      const allowed = getCurrentAllowedSession([])
      return allowed?.route || '/smokecraft'
    } catch (_) {
      return '/smokecraft'
    }
  })()

  const lockedReason = getLockedReason(sessionNumber, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#0a0603 0%,#0f0a06 60%,#0a0603 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        padding: '2rem 1.5rem',
        textAlign: 'center',
      }}
    >
      {/* Lock icon */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.04))',
          border: '1px solid rgba(201,168,76,0.28)',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 40, color: 'rgba(201,168,76,0.75)' }}
        >
          lock
        </span>
      </div>

      {/* Visit label */}
      <p
        style={{
          fontSize: '10px',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.7)',
          fontWeight: 600,
          marginBottom: '0.75rem',
        }}
      >
        Visit {visitNumber} of {TOTAL_VISITS}
      </p>

      {/* Title */}
      <h1
        style={{
          fontSize: 'clamp(22px, 4vw, 36px)',
          color: '#f0e6cc',
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: '1rem',
          maxWidth: 440,
        }}
      >
        Locked Until a Future Visit
      </h1>

      {/* Main message */}
      <p
        style={{
          fontSize: 'clamp(14px, 2vw, 17px)',
          color: 'rgba(240,230,204,0.65)',
          lineHeight: 1.6,
          marginBottom: '0.75rem',
          maxWidth: 460,
        }}
      >
        This SmokeCraft session is part of{' '}
        <span style={{ color: 'rgba(201,168,76,0.85)' }}>Visit {visitNumber} of {TOTAL_VISITS}</span>.
        Return on your next venue visit to unlock{' '}
        <span style={{ color: 'rgba(201,168,76,0.85)' }}>{visitTitle}</span>.
      </p>

      {/* Detailed reason */}
      {lockedReason && (
        <p
          style={{
            fontSize: '12px',
            letterSpacing: '0.04em',
            color: 'rgba(201,168,76,0.45)',
            marginBottom: '2.5rem',
            maxWidth: 400,
          }}
        >
          {lockedReason}
        </p>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate('/smokecraft')}
        style={{
          height: 56,
          paddingInline: 36,
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #e9c176, #c5a059)',
          color: '#131314',
          fontFamily: 'Georgia, serif',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          boxShadow: '0 4px 20px rgba(201,168,76,0.28)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        Back to Current Session
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
      </button>

      {/* Mode notice */}
      {(isDemoMode || isLocalPreviewMode) && (
        <p
          style={{
            marginTop: '2rem',
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isDemoMode ? 'rgba(233,193,118,0.5)' : 'rgba(201,168,76,0.3)',
          }}
        >
          {modeLabel}
        </p>
      )}
    </div>
  )
}
