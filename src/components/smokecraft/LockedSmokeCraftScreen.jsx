import { useNavigate } from 'react-router-dom'
import {
  getVisitBySession,
  getLockedReason,
  getCurrentAllowedSession,
  TOTAL_VISITS,
} from '../../constants/smokecraftJourney.js'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'

const LOCKED_ASSETS = {
  21: '/smokecraft-passport-stamp-locked.png',
  22: '/smokecraft-connections-locked.png',
  23: '/smokecraft-management-sync-locked.png',
}
const DEFAULT_LOCKED_ASSET = '/smokecraft-future-visit-locked.png'

export default function LockedSmokeCraftScreen({ sessionNumber }) {
  const navigate = useNavigate()
  const { isDemoMode, isLocalPreviewMode, modeLabel } = useSmokeCraftProgress()

  const visit      = getVisitBySession(sessionNumber)
  const visitNumber = visit?.visit || 1
  const visitTitle  = visit?.title || 'Next Visit'
  const lockedReason = getLockedReason(sessionNumber, [])

  const imgSrc = LOCKED_ASSETS[sessionNumber] || DEFAULT_LOCKED_ASSET

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Full-screen asset image */}
      <img
        src={imgSrc}
        alt={`Locked — Visit ${visitNumber} of ${TOTAL_VISITS}: ${visitTitle}`}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          objectPosition: 'center center',
          pointerEvents: 'none',
        }}
      />

      {/* Hotspot / overlay layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: '8vh',
          gap: '0.75rem',
        }}
      >
        {/* Visit label */}
        <p
          style={{
            fontSize: '10px',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.85)',
            fontFamily: 'Georgia, serif',
            fontWeight: 600,
            textShadow: '0 1px 6px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
          }}
        >
          Visit {visitNumber} of {TOTAL_VISITS} — {visitTitle}
        </p>

        {lockedReason && (
          <p
            style={{
              fontSize: '11px',
              letterSpacing: '0.04em',
              color: 'rgba(201,168,76,0.55)',
              fontFamily: 'Georgia, serif',
              maxWidth: 400,
              textAlign: 'center',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              pointerEvents: 'none',
            }}
          >
            {lockedReason}
          </p>
        )}

        {/* Back button — pointer-events: auto so it's clickable */}
        <button
          onClick={() => navigate('/smokecraft')}
          style={{
            height: 52,
            paddingInline: 32,
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #e9c176, #c5a059)',
            color: '#131314',
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            pointerEvents: 'auto',
            transition: 'opacity 0.2s',
            marginTop: '0.5rem',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Back to Current Session
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
        </button>

        {(isDemoMode || isLocalPreviewMode) && (
          <p
            style={{
              fontSize: '9px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: isDemoMode ? 'rgba(233,193,118,0.5)' : 'rgba(201,168,76,0.3)',
              fontFamily: 'Georgia, serif',
              pointerEvents: 'none',
            }}
          >
            {modeLabel}
          </p>
        )}
      </div>
    </section>
  )
}
