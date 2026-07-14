import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../context/DemoModeContext.jsx'
import NoveeImageBoundsOverlay from '../components/novee/NoveeImageBoundsOverlay.jsx'
import { NOVEE_ASSETS } from '../constants/noveeAssets.js'

const NAT_W = 1829
const NAT_H = 860

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
}

function Hotspot({ label, onClick, style }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        position: 'absolute',
        background: 'transparent',
        border: '2px solid transparent',
        borderRadius: 6,
        padding: 0,
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',
        ...style,
      }}
    >
      <span style={srOnly}>{label}</span>
    </button>
  )
}

export default function Boot() {
  const navigate = useNavigate()
  const { enterDemoMode } = useDemoMode()

  function go(to) {
    sessionStorage.setItem('novee_booted', '1')
    navigate(to)
  }

  function handleDemoMode() {
    sessionStorage.setItem('novee_booted', '1')
    enterDemoMode()
    navigate('/home', { replace: true })
  }

  return (
    <NoveeImageBoundsOverlay
      src={NOVEE_ASSETS.loungeInterface}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="NOVEE OS — Private Experience Layer"
    >
      {/* Printed card: ENTER NOVEE OS */}
      <Hotspot
        label="Enter NOVEE OS"
        onClick={() => go('/home')}
        style={{ left: '18.9%', top: '26.5%', width: '48.2%', height: '10.8%' }}
      />

      {/* Printed card: ENTER CRAFTHUB 360 */}
      <Hotspot
        label="Enter CraftHub 360"
        onClick={() => go('/crafthub')}
        style={{ left: '18.9%', top: '39.5%', width: '48.2%', height: '11.0%' }}
      />

      {/* Printed card: ENTER SMOKECRAFT 360 */}
      <Hotspot
        label="Enter SmokeCraft 360"
        onClick={() => go('/smokecraft')}
        style={{ left: '18.9%', top: '52.6%', width: '48.2%', height: '11.0%' }}
      />

      {/* Printed: DEMO MODE button */}
      <Hotspot
        label="Demo Mode"
        onClick={handleDemoMode}
        style={{ left: '36.7%', top: '65.1%', width: '11.6%', height: '5.5%' }}
      />
    </NoveeImageBoundsOverlay>
  )
}
