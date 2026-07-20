import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../context/DemoModeContext.jsx'
import StaffHandoffButton from '../components/staffhandoff/StaffHandoffButton.jsx'
import SmokeCraftImageBoundsOverlay from '../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'

// Approved MVP2 CraftHub visual — see docs/CRAFTHUB_MVP2_APPROVED_ASSET_IMPLEMENTATION.md
const CRAFTHUB_IMAGE = '/assets/CRAFTHUB%20360.%20VENUE%20TABLE%20EXPERIENCE.png'
const NAT_W = 1672
const NAT_H = 941
const GOLD = '#d4af37'

// Transparent-at-rest control over a static baked button/card whose label
// never changes — the approved artwork already renders it correctly, so we
// preserve that pixel-perfect look at idle and add a real, visible
// interactive affordance (gold focus/hover ring) rather than an invisible
// hotspot with no discoverable state. Matches the pattern already
// established and verified on the SmokeCraft Launch screen
// (src/pages/SmokeCraft.jsx).
function Hotspot({ label, onClick, style, shape = 'rect' }) {
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
        background: active ? 'rgba(212,175,55,0.10)' : 'transparent',
        border: active ? `1.5px solid ${GOLD}` : '1.5px solid transparent',
        borderRadius: shape === 'pill' ? 999 : 12,
        boxShadow: active ? '0 0 0 3px rgba(212,175,55,0.20)' : 'none',
        padding: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        outline: 'none',
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

export default function CraftHub() {
  const navigate = useNavigate()
  const { enterDemoMode } = useDemoMode()
  const [staffHandoffOpen, setStaffHandoffOpen] = useState(false)

  function handleDemoMode() {
    enterDemoMode()
    navigate('/smokecraft')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={CRAFTHUB_IMAGE}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="CraftHub 360 — Venue Table Experience"
        bottomOffset={0}
      >
        {/* Header: Back to NOVEE OS */}
        <Hotspot label="Back to NOVEE OS" onClick={() => navigate('/')} shape="pill"
          style={{ left: '4.0%', top: '1.7%', width: '13.6%', height: '6.8%' }} />
        {/* Header: Home */}
        <Hotspot label="Home" onClick={() => navigate('/home')} shape="pill"
          style={{ left: '19.7%', top: '1.7%', width: '6.7%', height: '6.8%' }} />
        {/* Header: DayOne360 Travel */}
        <Hotspot label="DayOne360 Travel" onClick={() => window.open('https://dayone360.com', '_blank', 'noopener,noreferrer')} shape="pill"
          style={{ left: '61.9%', top: '1.7%', width: '10.4%', height: '6.8%' }} />
        {/* Header: Demo Mode */}
        <Hotspot label="Demo Mode" onClick={handleDemoMode} shape="pill"
          style={{ left: '72.8%', top: '1.7%', width: '10.7%', height: '6.8%' }} />
        {/* Header: 360 Passport Connections */}
        <Hotspot label="360 Passport Connections" onClick={() => navigate('/passport/connections')} shape="pill"
          style={{ left: '84.0%', top: '1.7%', width: '13.8%', height: '6.8%' }} />

        {/* Module card: SmokeCraft 360 (active) */}
        <Hotspot label="Enter SmokeCraft 360" onClick={() => navigate('/smokecraft')}
          style={{ left: '7.5%', top: '33.0%', width: '16.2%', height: '37.5%' }} />
        {/* Module card: PourCraft 360 (coming soon) */}
        <Hotspot label="PourCraft 360 — Coming Soon" onClick={() => navigate('/pourcraft')}
          style={{ left: '24.3%', top: '33.0%', width: '16.1%', height: '37.5%' }} />
        {/* Module card: WineCraft 360 (coming soon) */}
        <Hotspot label="WineCraft 360 — Coming Soon" onClick={() => navigate('/winecraft')}
          style={{ left: '41.1%', top: '33.0%', width: '16.2%', height: '37.5%' }} />
        {/* Module card: BeerCraft 360 (coming soon) */}
        <Hotspot label="BeerCraft 360 — Coming Soon" onClick={() => navigate('/beercraft')}
          style={{ left: '58.6%', top: '33.0%', width: '16.2%', height: '37.5%' }} />
        {/* Module card: 360 Passport Connections (active) */}
        <Hotspot label="360 Passport Connections" onClick={() => navigate('/passport/connections')}
          style={{ left: '76.1%', top: '33.0%', width: '15.6%', height: '37.5%' }} />

        {/* Bottom nav: Enter CraftHub */}
        <Hotspot label="Enter CraftHub" onClick={() => navigate('/crafthub')} shape="pill"
          style={{ left: '8.8%', top: '72.0%', width: '21.6%', height: '7.8%' }} />
        {/* Bottom nav: Staff Handoff */}
        <Hotspot label="Staff Handoff" onClick={() => setStaffHandoffOpen(true)} shape="pill"
          style={{ left: '30.3%', top: '72.0%', width: '19.7%', height: '7.8%' }} />
        {/* Bottom nav: 360 Passport Connections */}
        <Hotspot label="360 Passport Connections (bottom nav)" onClick={() => navigate('/passport/connections')} shape="pill"
          style={{ left: '49.9%', top: '72.0%', width: '19.0%', height: '7.8%' }} />
        {/* Bottom nav: DayOne360 Travel */}
        <Hotspot label="DayOne360 Travel (bottom nav)" onClick={() => window.open('https://dayone360.com', '_blank', 'noopener,noreferrer')} shape="pill"
          style={{ left: '69.0%', top: '72.0%', width: '21.8%', height: '7.8%' }} />

        {/* Banner: Staff Handoff */}
        <Hotspot label="Staff Handoff details" onClick={() => setStaffHandoffOpen(true)}
          style={{ left: '3.2%', top: '81.5%', width: '46.0%', height: '16.7%' }} />
        {/* Banner: DayOne360 Travel */}
        <Hotspot label="DayOne360 Travel details" onClick={() => window.open('https://dayone360.com', '_blank', 'noopener,noreferrer')}
          style={{ left: '50.5%', top: '81.5%', width: '46.3%', height: '16.7%' }} />
      </SmokeCraftImageBoundsOverlay>

      {staffHandoffOpen && (
        <StaffHandoffButton
          startOpen
          allowedDestinations={['pos', 'eat']}
          onClose={() => setStaffHandoffOpen(false)}
        />
      )}
    </>
  )
}
