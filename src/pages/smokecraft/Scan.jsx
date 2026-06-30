import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

export default function Scan() {
  const navigate = useNavigate()

  function handleContinue() {
    triggerHaptic('medium')
    navigate('/smokecraft/enroll')
  }

  return (
    <div onClick={handleContinue} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-scan.png"
        alt="SmokeCraft Scan"
      />
    </div>
  )
}
