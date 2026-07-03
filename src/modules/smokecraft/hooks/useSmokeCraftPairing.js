/**
 * useSmokeCraftPairing
 * Module-layer hook for SmokeCraft pairing recommendations.
 * Always returns honest demo_only status when pairing engine is not connected.
 */

import { useState, useCallback } from 'react'
import { getRecommendations } from '../services/smokecraftPairingService.js'

export function useSmokeCraftPairing() {
  const [recommendations, setRecommendations] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchRecommendations = useCallback(async (cigarProfile, context = {}) => {
    setIsLoading(true)
    try {
      const result = getRecommendations(cigarProfile, context)
      setRecommendations(result)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    recommendations,
    isLoading,
    fetchRecommendations,
    aiBacked: false,
    posBacked: false,
    venueMenuBacked: false,
    status: recommendations?.recommendationStatus ?? 'not_loaded',
  }
}
