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
  // Hotspot positions calibrated to PROFILE DISCOVER 11.png (1456×816 landscape).
  // Enable debug to verify zones: sessionStorage.setItem('smokecraft_hotspot_debug','1')
  const HOTSPOTS = [
    // ── Left column — primary CTAs ──────────────────────────────────────────────
    // Gold CTA: "START YOUR SMOKECRAFT SESSION >"
    {
      label: 'Start New SmokeCraft Session',
      x: 4, y: 56, width: 32, height: 8,
      to: '/smokecraft/identity',
    },
    // Icon row: "HOW IT WORKS"
    {
      label: 'How It Works',
      x: 4, y: 66, width: 14, height: 7,
      to: '/smokecraft/how-it-works',
    },
    // Icon row: "ENTER CHALLENGE"
    {
      label: 'Enter Event Challenge',
      x: 19, y: 66, width: 14, height: 7,
      to: '/smokecraft/event-challenge',
    },
    // Dark CTA: "CONTINUE PREVIOUS SESSION"
    {
      label: 'Continue Previous Session',
      x: 4, y: 74, width: 27, height: 7,
      onClick: continueSession,
    },

    // ── Right column — 360 Passport card ────────────────────────────────────────
    // Passport card body (tap anywhere on card)
    {
      label: 'View My Passport',
      x: 49, y: 7, width: 50, height: 43,
      to: '/smokecraft/passport-stamp',
    },
    // "VIEW PASSPORT >" link
    {
      label: 'View Passport',
      x: 56, y: 34, width: 14, height: 6,
      to: '/smokecraft/passport-stamp',
    },

    // ── Right column — Tonight's Featured Pairing card ──────────────────────────
    // Pairing card body
    {
      label: 'Explore Pairing',
      x: 49, y: 52, width: 50, height: 35,
      to: '/smokecraft/humidor-match',
    },
    // "EXPLORE PAIRING >" link
    {
      label: 'Explore Pairing',
      x: 56, y: 75, width: 14, height: 6,
      to: '/smokecraft/humidor-match',
    },

    // ── Image bottom nav bar (y 88–100%) — mirrors app SmokeCraftBottomNav ──────
    {
      label: 'SmokeCraft — Current Journey',
      x: 0, y: 88, width: 26, height: 12,
      to: '/smokecraft',
    },
    {
      label: 'Rewards — Earn. Unlock. Enjoy.',
      x: 26, y: 88, width: 24, height: 12,
      to: '/smokecraft/leaderboard',
    },
    {
      label: 'Passport — Track Your Journey',
      x: 50, y: 88, width: 25, height: 12,
      to: '/passport-connection',
    },
    {
      label: 'CraftHub — Explore. Learn. Connect.',
      x: 75, y: 88, width: 25, height: 12,
      to: '/crafthub',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/PROFILE DISCOVER 11.png"
      alt="SmokeCraft — Discover Your Cigar Profile"
      hotspots={HOTSPOTS}
      route="/smokecraft"
      objectPosition="center center"
    />
  )
}
