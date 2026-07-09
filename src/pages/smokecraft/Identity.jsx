import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function Identity() {
  const { awardSessionRewards } = useGuestSession()
  const { currentAllowed, isDemoMode } = useSmokeCraftProgress()
  const navigate = useNavigate()

  // Award 'enroll' (session 2) and navigate — fire-and-forget, non-blocking
  const startNewSession = useCallback(() => {
    triggerHaptic('medium')
    try { awardSessionRewards('enroll') } catch (_) {}
    navigate('/smokecraft/golden-box')
  }, [awardSessionRewards, navigate])

  // Navigate to furthest unlocked session, or golden-box if none
  const continueSession = useCallback(() => {
    triggerHaptic('light')
    const route = currentAllowed?.route
    if (route && route !== '/smokecraft' && route !== '/smokecraft/identity') {
      navigate(route)
    } else {
      // No prior progress — treat as new session
      try { awardSessionRewards('enroll') } catch (_) {}
      navigate('/smokecraft/golden-box')
    }
  }, [currentAllowed, awardSessionRewards, navigate])

  const HOTSPOTS = [
    /*
     * PRIMARY: "Start New SmokeCraft Session"
     * Covers the main large CTA button in the lower portion of the profile-capture image.
     * Label drives pill text → "Start New Session →"
     */
    {
      label: 'Start New SmokeCraft Session',
      x: 5, y: 68, width: 90, height: 22,
      onClick: startNewSession,
      // onClick handles navigation; no 'to' needed (avoids double navigate)
    },
    /*
     * SECONDARY: "Continue Previous Session"
     * Positioned just above or below the primary CTA depending on image layout.
     */
    {
      label: 'Continue Previous Session',
      x: 5, y: 52, width: 90, height: 14,
      onClick: continueSession,
    },
    /*
     * DEMO: "Demo Experience" — enter journey in demo/preview mode
     */
    {
      label: 'Demo Experience',
      x: 5, y: 38, width: 90, height: 12,
      onClick: () => {
        triggerHaptic('light')
        try {
          sessionStorage.setItem('novee_demo_mode', '1')
          awardSessionRewards('enroll')
        } catch (_) {}
        navigate('/smokecraft/golden-box')
      },
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-profile-capture.png"
      alt="Profile Capture"
      hotspots={HOTSPOTS}
      route="/smokecraft/identity"
    />
  )
}
