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

  // Hotspot zones are calibrated to the VISIBLE image area.
  // objectPosition="center bottom" anchors the image bottom edge to the
  // container bottom, so the lower portion of the image (where CTAs live)
  // is always fully visible. Enable debug mode to verify alignment:
  //   sessionStorage.setItem('smokecraft_hotspot_debug', '1')
  const HOTSPOTS = [
    // Primary journey CTA — large tap zone at lower image area
    {
      label: 'Start New SmokeCraft Session',
      x: 5, y: 66, width: 90, height: 21,
      to: '/smokecraft/identity',
    },
    // Secondary CTA — clearly above primary, no vertical overlap
    {
      label: 'Continue Previous Session',
      x: 5, y: 50, width: 90, height: 14,
      onClick: continueSession,
    },
    // Third-row icon buttons
    {
      label: 'Browse Humidor',
      x: 5, y: 34, width: 42, height: 13,
      to: '/smokecraft/humidor-match',
    },
    {
      label: 'View My Passport',
      x: 53, y: 34, width: 42, height: 13,
      to: '/smokecraft/passport-stamp',
    },
    // Top-row icon buttons
    {
      label: 'How It Works',
      x: 5, y: 20, width: 42, height: 12,
      to: '/smokecraft/how-it-works',
    },
    {
      label: 'Demo Experience',
      x: 53, y: 20, width: 42, height: 12,
      to: '/smokecraft/golden-box',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-landing.png"
      alt="SmokeCraft"
      hotspots={HOTSPOTS}
      route="/smokecraft"
      objectPosition="center bottom"
    />
  )
}
