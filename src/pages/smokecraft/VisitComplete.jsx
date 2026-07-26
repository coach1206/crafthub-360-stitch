import { useNavigate } from 'react-router-dom'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import SmokeCraftHandoffTrigger from '../../components/smokecraft/SmokeCraftHandoffTrigger.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

export default function VisitComplete() {
  const navigate = useNavigate()
  const { completedVisits, totalVisits, isDemoMode, isLocalPreviewMode, modeLabel } = useSmokeCraftProgress()

  const justCompleted = completedVisits.length > 0 ? Math.max(...completedVisits) : 1
  const nextVisit = justCompleted + 1
  const isJourneyComplete = justCompleted >= totalVisits

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <section
      aria-label={isJourneyComplete ? 'SmokeCraft Journey Complete' : `Visit ${justCompleted} Complete`}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100dvw',
        height: '100dvh',
        overflow: 'hidden',
        backgroundImage: 'url(/smokecraft-visit-complete.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050505',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Overlay layer */}
      <div
        style={{
          flex: 1,
          zIndex: 5,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 40px)',
          gap: '0.75rem',
          padding: '0 20px max(env(safe-area-inset-bottom, 20px), 40px)',
        }}
      >
        {/* Visit complete label */}
        <p
          style={{
            fontSize: '14px',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.85)',
            fontFamily: 'Georgia, serif',
            fontWeight: 600,
            textShadow: '0 1px 6px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
          }}
        >
          Visit {justCompleted} of {totalVisits} — Complete
        </p>

        {!isJourneyComplete && (
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(240,230,204,0.7)',
              fontFamily: 'Georgia, serif',
              maxWidth: 380,
              textAlign: 'center',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              letterSpacing: '0.02em',
              pointerEvents: 'none',
            }}
          >
            Return on your next venue visit to unlock Visit {nextVisit} of {totalVisits}.
          </p>
        )}

        {/* CTA button */}
        <button
          onClick={() => navigate('/smokecraft')}
          style={{
            height: 56,
            paddingInline: 40,
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #e9c176, #c5a059)',
            color: '#131314',
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 24px rgba(201,168,76,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            pointerEvents: 'auto',
            transition: 'opacity 0.2s',
            marginTop: '0.5rem',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Return to SmokeCraft Hub
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
        </button>

        {(isDemoMode || isLocalPreviewMode) && (
          <p
            style={{
              fontSize: '9px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: isDemoMode ? 'rgba(233,193,118,0.5)' : 'rgba(201,168,76,0.25)',
              fontFamily: 'Georgia, serif',
              pointerEvents: 'none',
            }}
          >
            {modeLabel}
          </p>
        )}
      </div>
      <SmokeCraftHandoffTrigger allowEAT allowPOS360 />
    </section>
    </SmokeCraftScreenShell>
  )
}
