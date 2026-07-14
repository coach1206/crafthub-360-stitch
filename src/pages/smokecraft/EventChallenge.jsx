import { useNavigate } from 'react-router-dom'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

export default function EventChallenge() {
  const navigate = useNavigate()
  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.eventChallenge}
        alt="SmokeCraft Event Challenge — Live Competition"
      />
      <SmokeCraftNavBar
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
