import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'

/**
 * WrapperStrength — pass-through redirect.
 *
 * This screen was removed from the main SmokeCraft journey (format now goes
 * directly to seed-soil, awarding this step). If a user arrives here via a
 * saved URL, award the step and redirect to seed-soil to keep the flow intact.
 */
export default function WrapperStrength() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()

  useEffect(() => {
    try { awardSessionRewards('wrapper-strength') } catch (_) {}
    navigate('/smokecraft/seed-soil', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
