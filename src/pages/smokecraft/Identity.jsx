import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

export default function Identity() {
  const { awardSessionRewards } = useGuestSession()
  const { currentAllowed } = useSmokeCraftProgress()
  const navigate = useNavigate()

  const startNewSession = useCallback(() => {
    try { awardSessionRewards('enroll') } catch (_) {}
    navigate('/smokecraft/golden-box')
  }, [awardSessionRewards, navigate])

  const continueSession = useCallback(() => {
    const route = currentAllowed?.route
    if (route && route !== '/smokecraft' && route !== '/smokecraft/identity') {
      navigate(route)
    } else {
      try { awardSessionRewards('enroll') } catch (_) {}
      navigate('/smokecraft/golden-box')
    }
  }, [currentAllowed, awardSessionRewards, navigate])

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/IDENTY.png"
        alt="SmokeCraft Identity — Let's Get To Know You"
      />
      <SmokeCraftNavBar
        primary="Start New SmokeCraft Session →"
        onPrimary={startNewSession}
        secondary="Continue Previous Session"
        onSecondary={continueSession}
      />
    </>
  )
}
