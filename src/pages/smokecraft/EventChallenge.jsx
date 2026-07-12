import { useNavigate } from 'react-router-dom'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

export default function EventChallenge() {
  const navigate = useNavigate()
  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-event-challenge.png"
        alt="Event Challenge"
      />
      <SmokeCraftNavBar
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
