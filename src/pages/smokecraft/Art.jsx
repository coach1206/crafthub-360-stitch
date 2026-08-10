import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

export default function Art() {
  const navigate = useNavigate()
  const { addXP, addBadge, completeStep } = useGuestSession()
  const [accepted, setAccepted] = useState(false)

  function handleContinue() {
    if (accepted) return
    setAccepted(true)
    addXP(50, 'art-observation')
    addBadge({ id: 'art-appreciation', name: 'Art Appreciation', icon: 'palette' })
    completeStep('art')
    setTimeout(() => navigate('/smokecraft/mentor'), 500)
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div onClick={handleContinue} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
        <SmokeCraftAssetScreen
          src="/assets/smokecraft-reference/approved/smokecraft-art.png"
          alt="The Art of SmokeCraft"
        />
      </div>
    </SmokeCraftScreenShell>
  )
}
