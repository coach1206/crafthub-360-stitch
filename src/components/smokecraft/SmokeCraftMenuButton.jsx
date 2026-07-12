/**
 * SmokeCraftMenuButton — floating overlay "View Menu" button for SmokeCraft screens.
 *
 * Renders as a fixed-position button that does NOT overlap or interfere with
 * the sealed SmokeCraft asset visuals. Positioned at the bottom-right.
 *
 * When tapped:
 * 1. Saves the current route as the resume target
 * 2. Navigates to /smokecraft/menu
 *
 * Usage: import and render inside any sealed SmokeCraft screen.
 * Never modifies SmokeCraftAssetScreen, SmokeCraftHotspotLayer, SmokeCraftAssetRoute.
 */
import { useNavigate, useLocation } from 'react-router-dom'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

export default function SmokeCraftMenuButton({ label = 'View Menu', cartCountOverride }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setResumeRoute, cartItemCount } = useSmokeCraftOrder()

  const count = cartCountOverride ?? cartItemCount

  function handleTap() {
    triggerHaptic('light')
    setResumeRoute(location.pathname)
    navigate('/smokecraft/menu')
  }

  return (
    <button onClick={handleTap} style={styles.btn} aria-label={label}>
      <span style={styles.icon}>🛒</span>
      <span style={styles.text}>{label}</span>
      {count > 0 && <span style={styles.badge}>{count}</span>}
    </button>
  )
}

const styles = {
  btn: {
    position: 'fixed',
    bottom: 160,
    right: 20,
    zIndex: 200,
    background: '#8b6914',
    border: 'none',
    color: '#f0e6d3',
    padding: '12px 18px',
    borderRadius: 28,
    cursor: 'pointer',
    fontFamily: '"Georgia", serif',
    fontWeight: 700,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 16px rgba(139,105,20,0.5)',
    touchAction: 'manipulation',
  },
  icon: { fontSize: 18 },
  text: { letterSpacing: 0.5 },
  badge: {
    background: '#8b1a1a',
    color: '#f0e6d3',
    borderRadius: '50%',
    minWidth: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    padding: '0 4px',
  },
}
