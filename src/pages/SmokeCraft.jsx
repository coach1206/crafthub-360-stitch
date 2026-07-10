import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SmokeCraftAssetRoute from '../components/smokecraft/SmokeCraftAssetRoute.jsx'
import { useSmokeCraftProgress } from '../context/SmokeCraftProgressContext.jsx'
import { triggerHaptic } from '../utils/haptics.js'

/*
 * SmokeCraft landing page — /smokecraft
 *
 * Hotspot positions are image-relative percentages (x/y/width/height as % of image).
 * Enable debug mode to calibrate zones:
 *   sessionStorage.setItem('smokecraft_hotspot_debug', '1')
 */
export default function SmokeCraft() {
  const navigate = useNavigate()
  const { currentAllowed } = useSmokeCraftProgress()

  const continueSession = useCallback(() => {
    triggerHaptic('light')
    const dest = currentAllowed?.route || '/smokecraft/golden-box'
    navigate(dest)
  }, [navigate, currentAllowed])

  const HOTSPOTS = [
    {
      label: 'Start New SmokeCraft Session',
      x: 5, y: 62, width: 90, height: 20,
      to: '/smokecraft/identity',
    },
    {
      label: 'Continue Previous Session',
      x: 5, y: 46, width: 90, height: 14,
      onClick: continueSession,
    },
    {
      label: 'Browse Humidor',
      x: 5, y: 33, width: 42, height: 11,
      to: '/smokecraft/humidor-match',
    },
    {
      label: 'View My Passport',
      x: 53, y: 33, width: 42, height: 11,
      to: '/smokecraft/passport-stamp',
    },
    {
      label: 'How It Works',
      x: 5, y: 22, width: 42, height: 9,
      to: '/smokecraft/how-it-works',
    },
    {
      label: 'Demo Experience',
      x: 53, y: 22, width: 42, height: 9,
      to: '/smokecraft/golden-box',
    },
    {
      label: 'View Pairing',
      x: 5, y: 84, width: 20, height: 12,
      to: '/smokecraft/pairing-lab',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-landing.png"
      alt="SmokeCraft"
      hotspots={HOTSPOTS}
      route="/smokecraft"
    />
  )
}
