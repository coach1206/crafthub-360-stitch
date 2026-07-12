import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

export default function HowItWorks() {
  const navigate = useNavigate()

  function handleGetStarted() {
    triggerHaptic('medium')
    navigate('/smokecraft/enroll')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-how-it-works.png"
        alt="How SmokeCraft Works"
      />
      <SmokeCraftNavBar
        primary="Get Started →"
        onPrimary={handleGetStarted}
      />
    </>
  )
}
