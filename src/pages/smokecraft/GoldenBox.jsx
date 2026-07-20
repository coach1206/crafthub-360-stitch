import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1456
const NAT_H = 1080
const GOLD   = '#E9C176'
const NAVY_PANEL  = '#0a0e16'
const BORDER = 'rgba(233,193,118,0.28)'
const CREAM  = '#e5e2e1'
const DIM    = 'rgba(229,226,225,0.6)'

// Approved copy from GOLDEN BOX RULES.png — "RULE ACKNOWLEDGEMENT" panel.
const ACK_TEXT = 'I have read, understood, and agree to follow the Golden Box Rules.'

// A blank production-shell panel matching the composite's own panel styling
// (navy fill, gold border, rounded corners) — used to neutralize baked zones
// that don't correspond to a real feature on this route (Identity fields and
// Venue Settings belong to their own already-built screens; Guest Agreements
// has no staff-facing counterpart in this app). Given a subtle radial glow,
// inset border, and corner accents (matching the approved composite's own
// framing language) so the mask reads as an intentional shell panel rather
// than a crude unfinished rectangle.
function BlankPanel({ style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        background: `radial-gradient(ellipse at 50% 30%, rgba(233,193,118,0.05), transparent 70%), ${NAVY_PANEL}`,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 1px 12px rgba(233,193,118,0.06)`,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {['0%', '100%'].map(left => ['0%', '100%'].map(top => (
        <span key={`${left}-${top}`} style={{
          position: 'absolute',
          left, top, width: 10, height: 10,
          transform: `translate(${left === '0%' ? '2px' : 'calc(-100% - 2px)'}, ${top === '0%' ? '2px' : 'calc(-100% - 2px)'})`,
          borderTop: top === '0%' ? `1px solid ${BORDER}` : 'none',
          borderBottom: top === '100%' ? `1px solid ${BORDER}` : 'none',
          borderLeft: left === '0%' ? `1px solid ${BORDER}` : 'none',
          borderRight: left === '100%' ? `1px solid ${BORDER}` : 'none',
        }} />
      )))}
    </div>
  )
}

export default function GoldenBox() {
  const { session, awardSessionRewards } = useGuestSession()
  const { journey, setGoldenBox } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [acknowledged, setAcknowledged] = useState(() => journey.goldenBox?.acknowledged ?? false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    setGoldenBox({ acknowledged })
  }, [acknowledged]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleContinue() {
    if (!acknowledged) return
    triggerHaptic('medium')
    try { awardSessionRewards('golden-box') } catch (_) {}
    navigate('/smokecraft/mentor-selection')
  }

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.goldenBox}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft Golden Box Rules — The Five Principles"
      bottomOffset={0}
    >
      {/* Baked: BACK button — neutralized, real control */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute', left: '74.0%', top: '1.1%', width: '7.6%', height: '5.1%',
          background: NAVY_PANEL, border: `1.5px solid ${GOLD}`, borderRadius: 999,
          color: GOLD, fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(10px,0.9vw,14px)',
          cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        ← Back
      </button>

      {/* Baked: "YOUR JOURNEY / 0 XP" badge — neutralized, shows real XP */}
      <div
        style={{
          position: 'absolute', left: '82.4%', top: '0.2%', width: '17.2%', height: '9.1%',
          background: NAVY_PANEL, border: `1px solid ${BORDER}`, borderRadius: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 'clamp(9px,0.75vw,11px)', color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Your Journey
        </div>
        <div style={{ fontSize: 'clamp(13px,1.3vw,18px)', color: CREAM, fontWeight: 700 }}>
          {session?.xp ?? 0} XP
        </div>
      </div>

      {/* Baked: "YOUR COMMITMENT" form — neutralized, blank (owned by Identity) */}
      <BlankPanel style={{ left: '10.6%', top: '40.6%', width: '29.9%', height: '34.3%' }} />

      {/* Baked: "VENUE SETTINGS" form — neutralized, blank (owned by Venue Select) */}
      <BlankPanel style={{ left: '40.7%', top: '40.6%', width: '24.4%', height: '34.3%' }} />

      {/* Baked: "RULE ACKNOWLEDGEMENT" checkbox — neutralized, real control */}
      <label
        style={{
          position: 'absolute', left: '65.0%', top: '55.6%', width: '34.9%', height: '9.3%',
          background: NAVY_PANEL, border: `1px solid ${BORDER}`, borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: '1%', padding: '0 1.5%', boxSizing: 'border-box',
          cursor: 'pointer', pointerEvents: 'auto',
        }}
      >
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={e => { triggerHaptic('light'); setAcknowledged(e.target.checked) }}
          style={{ width: 'clamp(16px,1.4vw,20px)', height: 'clamp(16px,1.4vw,20px)', accentColor: GOLD, cursor: 'pointer', flexShrink: 0 }}
        />
        <span style={{ fontSize: 'clamp(10px,0.85vw,13px)', color: acknowledged ? CREAM : DIM, lineHeight: 1.3 }}>
          {ACK_TEXT}
        </span>
      </label>

      {/* Baked: "GUEST AGREEMENTS (STAFF USE)" table — neutralized, blank (no such feature) */}
      <BlankPanel style={{ left: '50.6%', top: '74.1%', width: '49.1%', height: '19.4%' }} />

      {/* Baked: "NEXT: MENTOR SELECTION" button — neutralized, real control */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!acknowledged}
        style={{
          position: 'absolute', left: '71.5%', top: '93.3%', width: '28.3%', height: '5.6%',
          background: acknowledged ? `linear-gradient(180deg, #F3D48E, ${GOLD})` : NAVY_PANEL,
          color: acknowledged ? '#241605' : 'rgba(233,193,118,0.45)', border: `1.5px solid ${acknowledged ? 'transparent' : BORDER}`, borderRadius: 999,
          fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(11px,1vw,15px)',
          letterSpacing: '0.03em', cursor: acknowledged ? 'pointer' : 'not-allowed',
          pointerEvents: 'auto', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        Next: Mentor Selection →
      </button>
    </SmokeCraftImageBoundsOverlay>
  )
}
