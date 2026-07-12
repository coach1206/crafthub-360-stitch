import { useNavigate } from 'react-router-dom'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

export default function Leaderboard() {
  const navigate = useNavigate()
  return (
    <>
      <SmokeCraftAssetScreen src="/assets/smokecraft-reference/approved/smokecraft-leaderboard.png" alt="Leaderboard" />
      <SmokeCraftNavBar
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
