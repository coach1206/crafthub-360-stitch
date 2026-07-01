/**
 * SmokeCraftProgressHeader
 *
 * Fixed-position overlay that displays the current visit/session progress.
 * Sits on top of SmokeCraftAssetScreen's full-screen image without disrupting
 * the visual-first design. Dark/gold aesthetic matches the kiosk-first look.
 *
 * Props:
 *   sessionNumber  — optional 1–24 override; defaults to context's currentSession
 */
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'

export default function SmokeCraftProgressHeader({ sessionNumber }) {
  const {
    currentVisit,
    currentSession,
    currentVisitTitle,
    totalVisits,
    totalSessions,
    isDemoMode,
    isLocalPreviewMode,
    modeLabel,
  } = useSmokeCraftProgress()

  const displaySession = sessionNumber || currentSession
  const displayVisit   = currentVisit

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        paddingInline: '1rem',
        height: '44px',
        background: 'linear-gradient(180deg, rgba(10,6,3,0.92) 0%, rgba(10,6,3,0.0) 100%)',
        pointerEvents: 'none',
      }}
    >
      {/* Left: Visit / Session counters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', pointerEvents: 'none' }}>
        <span
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.85)',
            fontWeight: 600,
          }}
        >
          Visit {displayVisit}/{totalVisits}
        </span>
        <span style={{ color: 'rgba(201,168,76,0.3)', fontSize: '10px' }}>·</span>
        <span
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.6)',
            fontWeight: 500,
          }}
        >
          Session {displaySession}/{totalSessions}
        </span>
      </div>

      {/* Center: Visit title (truncated) */}
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '9px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.45)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '200px',
          pointerEvents: 'none',
        }}
      >
        {currentVisitTitle}
      </div>

      {/* Right: Mode label */}
      {(isDemoMode || isLocalPreviewMode) && (
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '8px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isDemoMode ? 'rgba(233,193,118,0.6)' : 'rgba(201,168,76,0.35)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {isDemoMode ? 'Demo Preview' : 'Local Preview'}
        </div>
      )}
    </div>
  )
}
