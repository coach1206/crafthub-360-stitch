import { useState, useCallback } from 'react'
import { getRecommendations, getCrossCraftRecommendations } from '../../services/ncie/recommendationEngine.js'

export function useNcieRecommendations(moduleId = 'smokecraft') {
  const [recommendations, setRecommendations] = useState(null)
  const [crossCraft, setCrossCraft]           = useState(null)
  const [isOpen, setIsOpen]                   = useState(false)

  const fetchRecommendations = useCallback((context = {}) => {
    const result = getRecommendations(moduleId, context)
    setRecommendations(result)
    return result
  }, [moduleId])

  const fetchCrossCraft = useCallback((targetModuleId = null, context = {}) => {
    const result = getCrossCraftRecommendations(moduleId, targetModuleId, context)
    setCrossCraft(result)
    return result
  }, [moduleId])

  return {
    recommendations,
    crossCraft,
    isOpen,
    fetchRecommendations,
    fetchCrossCraft,
    openDrawer:              () => setIsOpen(true),
    closeDrawer:             () => setIsOpen(false),
    inventoryStatus:         'inventory_unavailable',
    recommendationStatus:    recommendations ? 'recommendation_available' : 'recommendation_preview',
    crossCraftStatus:        'cross_craft_preview',
    moduleId,
  }
}
