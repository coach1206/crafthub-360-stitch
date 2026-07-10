import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

export default function Identity() {
  const navigate = useNavigate()
  const { currentAllowed } = useSmokeCraftProgress()

  const startNewSession = useCallback(() => {
    triggerHaptic('light')
    navigate('/smokecraft/golden-box')
  }, [navigate])

  const continueSession = useCallback(() => {
    triggerHaptic('light')
    const dest = currentAllowed?.route || '/smokecraft/golden-box'
    navigate(dest)
  }, [navigate, currentAllowed])

  const startDemo = useCallback(() => {
    triggerHaptic('light')
    try {
      sessionStorage.setItem('novee_demo_mode', '1')
    } catch (_) { /* storage unavailable */ }
    navigate('/smokecraft/golden-box')
  }, [navigate])

  const HOTSPOTS = [
    {
      label: 'Start New SmokeCraft Session',
      x: 5, y: 68, width: 90, height: 22,
      onClick: startNewSession,
    },
    {
      label: 'Continue Previous Session',
      x: 5, y: 52, width: 90, height: 14,
      onClick: continueSession,
    },
    {
      label: 'Demo Experience',
      x: 5, y: 38, width: 90, height: 12,
      onClick: startDemo,
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-profile-capture.png"
      alt="SmokeCraft Identity"
      hotspots={HOTSPOTS}
      route="/smokecraft/identity"
    />
  )
}
