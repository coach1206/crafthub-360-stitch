import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1086
const NAT_H = 1448
const GOLD = '#E9C176'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Transparent-at-rest control over a static baked button whose label never
// changes — the approved artwork already renders it correctly, so idle state
// stays pixel-perfect; a real, visible gold focus/hover ring is the
// interactive affordance instead of an invisible hotspot.
function StaticHotspot({ label, onClick, style }) {
  const [active, setActive] = useState(false)
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={{
        position: 'absolute',
        background: active ? 'rgba(233,193,118,0.10)' : 'transparent',
        border: active ? `1.5px solid ${GOLD}` : '1.5px solid transparent',
        borderRadius: 999,
        boxShadow: active ? '0 0 0 3px rgba(233,193,118,0.18)' : 'none',
        padding: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
    >
      <span style={{
        position: 'absolute', width: 1, height: 1, overflow: 'hidden',
        clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
      }}>{label}</span>
    </button>
  )
}

export default function Enroll() {
  const { session, awardSessionRewards, updateProfile } = useGuestSession()
  const navigate = useNavigate()
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState(session?.profile?.email || '')
  const [touched, setTouched] = useState(false)
  const emailValid = EMAIL_RE.test(email.trim())

  function handleExploreAsGuest() {
    triggerHaptic('medium')
    awardSessionRewards('enroll')
    navigate('/smokecraft/venue-select')
  }

  function handleActivateGuestPass() {
    triggerHaptic('light')
    setShowEmail(true)
  }

  function handleEmailSubmit() {
    if (!emailValid) { setTouched(true); return }
    triggerHaptic('medium')
    updateProfile({ email: email.trim() })
    awardSessionRewards('enroll')
    navigate('/smokecraft/venue-select')
  }

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.enroll}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 — Guest Pass"
      bottomOffset={0}
    >
      {/* Baked: BACK pill, top-left */}
      <StaticHotspot
        label="Back"
        onClick={() => navigate(-1)}
        style={{ left: '1.84%', top: '2.9%', width: '12.2%', height: '3.2%' }}
      />

      {!showEmail && (
        <>
          {/* Baked: ACTIVATE MY GUEST PASS — label unchanged, reveals inline email on click */}
          <StaticHotspot
            label="Activate My Guest Pass"
            onClick={handleActivateGuestPass}
            style={{ left: '4.4%', top: '82.5%', width: '58.7%', height: '3.5%' }}
          />

          {/* Baked: NOT READY TO JOIN? EXPLORE AS GUEST */}
          <StaticHotspot
            label="Explore as Guest"
            onClick={handleExploreAsGuest}
            style={{ left: '64.9%', top: '82.5%', width: '30.7%', height: '5.2%' }}
          />
        </>
      )}

      {/* Smallest supported inline email interface — reuses the existing guest
          profile field (GuestSessionContext.updateProfile), no new auth system.
          Appears in the same footprint as the two baked CTAs, only after the
          guest explicitly activates. */}
      {showEmail && (
        <div
          style={{
            position: 'absolute', left: '4.4%', top: '80.5%', width: '91%', height: '9.5%',
            pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
            justifyContent: 'center',
            // Fully opaque — this must occlude both baked CTA zones underneath
            // entirely (no translucent bleed-through of "ACTIVATE MY GUEST
            // PASS" / "EXPLORE AS GUEST"), matching the page's navy shell.
            background: '#0b0f18', border: '1px solid rgba(233,193,118,0.25)',
            borderRadius: 16, padding: '0 14px', boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSubmit() }}
              placeholder="you@example.com"
              aria-label="Email address"
              style={{
                flex: 1, minWidth: 0, boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${touched && !emailValid ? 'rgba(229,170,100,0.7)' : 'rgba(233,193,118,0.4)'}`,
                borderRadius: 999, padding: '10px 16px', fontSize: 14, color: '#e5e2e1',
                fontFamily: 'Georgia, serif', outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleEmailSubmit}
              aria-label="Confirm email and continue"
              style={{
                flexShrink: 0, width: 44, height: 44, borderRadius: '50%',
                background: `linear-gradient(180deg, #F3D48E, ${GOLD})`, color: '#241605',
                border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 4px 14px rgba(233,193,118,0.4)',
              }}
            >
              →
            </button>
          </div>
          {touched && !emailValid && (
            <div role="alert" style={{ fontSize: 11, color: 'rgba(229,170,100,0.9)', paddingLeft: 16 }}>
              Please enter a valid email address.
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowEmail(false)}
            style={{
              alignSelf: 'flex-start', background: 'transparent', border: 'none',
              color: 'rgba(229,226,225,0.55)', fontSize: 11, fontFamily: 'Georgia, serif',
              cursor: 'pointer', padding: '2px 16px', touchAction: 'manipulation',
            }}
          >
            ← Choose differently
          </button>
        </div>
      )}
    </SmokeCraftImageBoundsOverlay>
  )
}
