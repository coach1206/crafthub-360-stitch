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
  // Hotspot positions calibrated to discover-your-profile-111 (1456×816 landscape).
  // Left column: primary CTAs stacked vertically (y 46–78%).
  // Right column: passport card VIEW PASSPORT link + pairing card VIEW PAIRING link.
  // Image bottom nav bar (y 88–100%) is intentionally unmapped — app nav covers it.
  const HOTSPOTS = [
    // Primary gold CTA — "START NEW SMOKECRAFT SESSION >"
    {
      label: 'Start New SmokeCraft Session',
      x: 4, y: 46, width: 24, height: 8,
      to: '/smokecraft/identity',
    },
    // Secondary dark CTA — "CONTINUE PREVIOUS SESSION"
    {
      label: 'Continue Previous Session',
      x: 4, y: 55, width: 22, height: 8,
      onClick: continueSession,
    },
    // Icon button row 1: Enter Event Challenge | View My Passport
    {
      label: 'Enter Event Challenge',
      x: 4, y: 64, width: 14, height: 7,
      to: '/smokecraft/identity',
    },
    {
      label: 'View My Passport',
      x: 19, y: 64, width: 13, height: 7,
      to: '/smokecraft/passport-stamp',
    },
    // Icon button row 2: Browse Humidor | Demo Experience | How It Works
    {
      label: 'Browse Humidor',
      x: 4, y: 72, width: 11, height: 7,
      to: '/smokecraft/humidor-match',
    },
    {
      label: 'Demo Experience',
      x: 16, y: 72, width: 13, height: 7,
      to: '/smokecraft/golden-box',
    },
    {
      label: 'How It Works',
      x: 30, y: 72, width: 11, height: 7,
      to: '/smokecraft/how-it-works',
    },
    // Right panel — 360 Passport card: VIEW PASSPORT >
    {
      label: 'View My Passport',
      x: 69, y: 28, width: 14, height: 6,
      to: '/smokecraft/passport-stamp',
    },
    // Right panel — Recommended Pairing card: VIEW PAIRING >
    {
      label: 'View Pairing',
      x: 69, y: 74, width: 13, height: 6,
      to: '/smokecraft/humidor-match',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft/DISOVER YOUR CIGAR PROFILE.png"
      alt="SmokeCraft — Discover Your Cigar Profile"
      hotspots={HOTSPOTS}
      route="/smokecraft"
      objectPosition="center center"
    />
  )
}
