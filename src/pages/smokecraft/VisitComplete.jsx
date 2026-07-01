/**
 * VisitComplete
 *
 * Shown at the end of each visit. Tells the guest which visit they just
 * completed and that the next visit unlocks on their next venue trip.
 * Route: /smokecraft/visit-complete
 *
 * Derives the "just completed" visit from the SmokeCraftProgressContext.
 * Dark/gold/premium aesthetic — kiosk-first.
 */
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'

export default function VisitComplete() {
  const navigate = useNavigate()
  const { completedVisits, totalVisits, isDemoMode, modeLabel } = useSmokeCraftProgress()

  // The visit that was just completed is the highest number in completedVisits
  const justCompleted = completedVisits.length > 0 ? Math.max(...completedVisits) : 1
  const nextVisit = justCompleted + 1
  const isJourneyComplete = justCompleted >= totalVisits

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
      {/* Trophy / star icon */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.22), rgba(201,168,76,0.06))',
          border: '1.5px solid rgba(201,168,76,0.4)',
          boxShadow: '0 0 40px rgba(201,168,76,0.12)',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 44, color: 'rgba(233,193,118,0.9)' }}
        >
          {isJourneyComplete ? 'workspace_premium' : 'emoji_events'}
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
        Visit {justCompleted} of {totalVisits} — Complete
      </p>

      {/* Main headline */}
      <h1
        style={{
          fontSize: 'clamp(24px, 4.5vw, 42px)',
          color: '#f0e6cc',
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: '1rem',
          maxWidth: 500,
        }}
      >
        {isJourneyComplete
          ? 'SmokeCraft Journey Complete'
          : `Visit ${justCompleted} Complete`}
      </h1>

      {/* Message */}
      <p
        style={{
          fontSize: 'clamp(14px, 2vw, 17px)',
          color: 'rgba(240,230,204,0.65)',
          lineHeight: 1.65,
          marginBottom: '2.5rem',
          maxWidth: 460,
        }}
      >
        {isJourneyComplete
          ? 'You have completed all 8 visits of your SmokeCraft journey. Congratulations — your SmokeCraft Passport is ready.'
          : `Return on your next venue visit to unlock Visit ${nextVisit} of ${totalVisits}.`}
      </p>

      {/* Divider */}
      <div
        style={{
          width: 48,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)',
          marginBottom: '2.5rem',
        }}
      />

      {/* CTA */}
      <button
        onClick={() => navigate('/smokecraft')}
        style={{
          height: 60,
          paddingInline: 40,
          borderRadius: '14px',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #e9c176, #c5a059)',
          color: '#131314',
          fontFamily: 'Georgia, serif',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          boxShadow: '0 4px 24px rgba(201,168,76,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        Return to SmokeCraft Hub
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
      </button>

      {/* Mode notice */}
      {(isDemoMode || true) && (
        <p
          style={{
            marginTop: '2rem',
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isDemoMode ? 'rgba(233,193,118,0.5)' : 'rgba(201,168,76,0.25)',
          }}
        >
          {modeLabel}
        </p>
      )}
    </div>
  )
}
