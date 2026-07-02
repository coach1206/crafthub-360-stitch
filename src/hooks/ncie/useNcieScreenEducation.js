import { useState, useCallback } from 'react'
import { resolveScreenContext } from '../../services/ncie/ncieScreenAdapter.js'
import { getLearnMoreTrigger, getTileMetadata } from '../../services/ncie/ncieTileAdapter.js'
import { getCraftKnowledgeMap, getTopicContent } from '../../services/ncie/knowledgeEngine.js'

export function useNcieScreenEducation(pathname, craftType = 'smokecraft') {
  const [activeTile, setActiveTile]     = useState(null)
  const [activeTopic, setActiveTopic]   = useState(null)
  const [isLoading, setIsLoading]       = useState(false)

  const screenContext = resolveScreenContext(pathname, craftType)
  const knowledgeMap  = getCraftKnowledgeMap(craftType)

  const openLearnMore = useCallback((tileId) => {
    setIsLoading(true)
    try {
      const trigger = getLearnMoreTrigger(tileId, craftType)
      setActiveTile(trigger)
    } finally {
      setIsLoading(false)
    }
  }, [craftType])

  const openTopic = useCallback((topicId) => {
    const content = getTopicContent(craftType, topicId)
    setActiveTopic(content)
  }, [craftType])

  const closeLearnMore = useCallback(() => setActiveTile(null), [])
  const closeTopic     = useCallback(() => setActiveTopic(null), [])

  return {
    screenContext,
    knowledgeMap: knowledgeMap.ok ? knowledgeMap : null,
    activeTile,
    activeTopic,
    isLoading,
    openLearnMore,
    openTopic,
    closeLearnMore,
    closeTopic,
    isProtected:     screenContext.protectedStatus === 'protected_screen_not_modified',
    educationStatus: 'ncie_ready',
    lessonStatus:    'verified_outline_available',
    screenWiringStatus: 'screen_wiring_ready',
  }
}
