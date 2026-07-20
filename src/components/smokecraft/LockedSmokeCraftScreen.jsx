import { useNavigate } from 'react-router-dom'
import {
  getVisitBySession,
  getLockedReason,
  TOTAL_VISITS,
} from '../../constants/smokecraftJourney.js'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import SmokeCraftImageBoundsOverlay from './SmokeCraftImageBoundsOverlay.jsx'

const LOCKED_ASSETS = {
  21: '/smokecraft-passport-stamp-locked.png',
  22: '/smokecraft-connections-locked.png',
  23: '/smokecraft-management-sync-locked.png',
}
const DEFAULT_LOCKED_ASSET = '/smokecraft-future-visit-locked.png'

// All 4 locked-state images (default + 21/22/23) share identical dimensions
// and header/footer layout, confirmed via direct pixel inspection: a top
// header strip bakes in a stale "VISIT 5 OF 8 | SESSION 18 OF 24" counter,
// and a footer line bakes in "Finish Session 24 to unlock...". Both are from
// a legacy 8-visit/24-session numbering scheme this app no longer uses (the
// authoritative registry is 6 phases / 27 sessions). Confirmed root cause of
// the originally-reported "Future Visit Locked" defect — text-only greps
// never found it because it is baked into the image pixels, not DOM text.
const NAT_W = 1086
const NAT_H = 1448
const GOLD = '#c9a84c'
const BG = '#050505'

export default function LockedSmokeCraftScreen({ sessionNumber }) {
  const navigate = useNavigate()
  const { isDemoMode, isLocalPreviewMode, modeLabel, currentAllowed } = useSmokeCraftProgress()
  const resumeRoute = currentAllowed?.route || '/smokecraft'

  const visit      = getVisitBySession(sessionNumber)
  const visitNumber = visit?.visit || 1
  const visitTitle  = visit?.title || 'Next Visit'
  const lockedReason = getLockedReason(sessionNumber, [])

  const imgSrc = LOCKED_ASSETS[sessionNumber] || DEFAULT_LOCKED_ASSET

  return (
    <section style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: BG }}>
      <SmokeCraftImageBoundsOverlay
        src={imgSrc}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt={`Locked — Phase ${visitNumber} of ${TOTAL_VISITS}: ${visitTitle}`}
        bottomOffset={0}
      >
        {/* Neutralize baked stale "VISIT X OF 8 | SESSION X OF 24" header counter */}
        <div style={{
          position: 'absolute', left: 0, top: 0, width: '100%', height: '11%',
          background: BG, pointerEvents: 'none', display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderBottom: `1px solid rgba(201,168,76,0.25)`,
        }}>
          <span style={{
            fontFamily: 'Georgia, serif', fontSize: 'clamp(11px,1.3vw,15px)', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: GOLD,
          }}>
            Phase {visitNumber} of {TOTAL_VISITS} — {visitTitle}
          </span>
        </div>

        {/* Neutralize baked stale "Finish Session 24 to unlock..." footer line
            — the real locked-reason text is rendered once, below, in the
            existing bottom overlay (not duplicated here). */}
        <div style={{
          position: 'absolute', left: '8%', top: '80.5%', width: '84%', height: '4.5%',
          background: BG, pointerEvents: 'none',
        }} />
      </SmokeCraftImageBoundsOverlay>

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
        {/* Visit label now shown once, live, in the neutralized header zone
            above (was duplicated here before that zone existed). */}

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
          onClick={() => navigate(resumeRoute)}
          style={{
            height: 52,
            paddingInline: 32,
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #e9c176, #c5a059)',
            color: '#131314',
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.12em',
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
