import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { useNavigate } from 'react-router-dom'

export default function Enroll() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()

  function handleContinue() {
    triggerHaptic('medium')
    awardSessionRewards('enroll')
    navigate('/smokecraft/identity')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-entry-gate.png"
        alt="SmokeCraft Enroll — Begin Your Guided Experience"
      />
      <SmokeCraftNavBar
        primary="Begin Your Journey →"
        onPrimary={handleContinue}
      />
    </>
  )
}
