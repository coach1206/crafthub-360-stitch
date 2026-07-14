import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

export default function HowItWorks() {
  const navigate = useNavigate()

  function handleGetStarted() {
    triggerHaptic('medium')
    navigate('/smokecraft/enroll')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.howItWorks}
        alt="How SmokeCraft Works — Educational Overview"
      />
      <SmokeCraftNavBar
        primary="Get Started →"
        onPrimary={handleGetStarted}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
