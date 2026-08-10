import { useNavigate } from 'react-router-dom'
import {
  getVisitBySession,
  getLockedReason,
  TOTAL_VISITS,
} from '../../constants/smokecraftJourney.js'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'

const GOLD = '#c9a84c'
const GOLD_BRIGHT = '#e9c176'
const CREAM = '#e5e2e1'
const BG = '#050810'
const GLASS = 'rgba(8,10,16,0.86)'
const BORDER = 'rgba(201,168,76,0.25)'

/**
 * LockedSmokeCraftScreen — LIVE state panel for a not-yet-unlocked numbered
 * session (Passport Stamp, Connections, Management Sync, and every other
 * future spine session).
 *
 * Root-cause fix (Live Landing & Destinations pass): this screen previously
 * rendered a static, baked lock IMAGE (/smokecraft-future-visit-locked.png,
 * /smokecraft-passport-stamp-locked.png, etc.) with black-box overlays glued
 * on top to hide stale baked "VISIT 5 OF 8 / SESSION 18 OF 24" text. That old
 * artwork is exactly the reported "FUTURE VISIT LOCKED / MANAGEMENT SYNC
 * LOCKED" defect. Per the mandate, a future screen may be locked only through
 * a LIVE state panel — real prerequisite, real current progress, and the
 * correct return route — never a static old lock image. All references to the
 * old lock PNGs are removed here; the panel is composed live from the
 * authoritative 6-phase / 27-session progress data.
 */
export default function LockedSmokeCraftScreen({ sessionNumber }) {
  const navigate = useNavigate()
  const {
    isDemoMode, isLocalPreviewMode, modeLabel, currentAllowed,
  } = useSmokeCraftProgress()
  const resumeRoute = currentAllowed?.route || '/smokecraft'

  const visit = getVisitBySession(sessionNumber)
  const visitNumber = visit?.visit || 1
  const visitTitle = visit?.title || 'Next Visit'
  const lockedReason = getLockedReason(sessionNumber, [])

  const currentLabel = currentAllowed?.label
  const currentSession = currentAllowed?.session

  return (
    <section style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 120%, rgba(122,79,49,0.22), transparent 60%),
        linear-gradient(180deg, #0b0f18 0%, ${BG} 100%)
      `,
      fontFamily: 'Georgia, serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(20px,5vw,48px)',
    }}>
      <div style={{
        maxWidth: 480, width: '100%', background: GLASS,
        border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: 'clamp(24px,4vw,40px)', textAlign: 'center',
        boxShadow: '0 16px 60px rgba(0,0,0,0.55)',
      }}>
        {/* Phase marker (live, from the authoritative registry) */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: GOLD_BRIGHT, letterSpacing: '0.2em',
          textTransform: 'uppercase', marginBottom: 14,
        }}>
          Phase {visitNumber} of {TOTAL_VISITS} — {visitTitle}
        </div>

        {/* Lock crest — CSS/emoji, no baked artwork */}
        <div aria-hidden="true" style={{
          width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${GOLD}`, background: 'rgba(201,168,76,0.10)',
          fontSize: 28,
        }}>🔒</div>

        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(20px,3vw,28px)', color: CREAM }}>
          Not Unlocked Yet
        </h1>

        {/* Real prerequisite */}
        {lockedReason && (
          <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.6, color: 'rgba(229,226,225,0.7)' }}>
            {lockedReason}
          </p>
        )}

        {/* Live current-progress panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
          borderRadius: 10, padding: '14px 16px', margin: '0 0 20px', textAlign: 'left',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            Your Current Progress
          </div>
          <div style={{ fontSize: 13, color: CREAM }}>
            {currentLabel
              ? <>Next up: <span style={{ color: GOLD_BRIGHT }}>{currentLabel}</span>{currentSession ? ` (Session ${currentSession})` : ''}</>
              : 'Continue your SmokeCraft journey from where you left off.'}
          </div>
        </div>

        <button
          onClick={() => navigate(resumeRoute)}
          style={{
            height: 52, paddingInline: 32, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #e9c176, #c5a059)', color: '#131314',
            fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
            outline: 'none', width: '100%', maxWidth: 320,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Back to Current Session
        </button>

        {(isDemoMode || isLocalPreviewMode) && (
          <p style={{
            marginTop: 14, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: isDemoMode ? 'rgba(233,193,118,0.5)' : 'rgba(201,168,76,0.3)',
          }}>
            {modeLabel}
          </p>
        )}
      </div>
    </section>
  )
}
