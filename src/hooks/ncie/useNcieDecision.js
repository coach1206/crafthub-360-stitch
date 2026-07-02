import { useState, useCallback } from 'react'
import { runDecision, getDecisionReadiness } from '../../services/ncie/decisionEngine.js'
import { buildSmokeCraftContext } from '../../services/ncie/ncieScreenContextBuilder.js'

export function useNcieDecision(moduleId = 'smokecraft') {
  const [decision, setDecision]   = useState(null)
  const [isOpen, setIsOpen]       = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const readiness = getDecisionReadiness(moduleId)

  const buildDecision = useCallback((guestContext = {}, rawProfile = {}) => {
    setIsLoading(true)
    try {
      const safeCtx = buildSmokeCraftContext(rawProfile, {}, { craftType: moduleId })
      const result  = runDecision(moduleId, { ...safeCtx.context, ...guestContext })
      setDecision(result)
      setIsOpen(true)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [moduleId])

  const clearDecision = useCallback(() => { setDecision(null); setIsOpen(false) }, [])

  return {
    decision,
    isOpen,
    isLoading,
    buildDecision,
    clearDecision,
    openDrawer:     () => setIsOpen(true),
    closeDrawer:    () => setIsOpen(false),
    readiness,
    decisionStatus: decision ? 'decision_available' : 'decision_preview',
    moduleId,
  }
}
