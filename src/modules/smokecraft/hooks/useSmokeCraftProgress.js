/**
 * useSmokeCraftProgress
 * Module-layer hook wrapping the existing SmokeCraftProgressContext.
 * Exposes journey state with module-contract-aware helpers.
 */

import { useContext } from 'react'
import { SmokeCraftProgressContext } from '../../../context/SmokeCraftProgressContext.jsx'
import { canEarnPassportStamp, canUnlockConnections, buildProgressSummary } from '../services/smokecraftProgressService.js'

export function useSmokeCraftProgress() {
  const ctx = useContext(SmokeCraftProgressContext)

  if (!ctx) {
    return {
      completedSteps: [],
      progressSummary: buildProgressSummary([]),
      canEarnPassportStamp: false,
      canUnlockConnections: false,
      contextAvailable: false,
    }
  }

  const completedSteps = ctx.completedSteps ?? []

  return {
    ...ctx,
    progressSummary: buildProgressSummary(completedSteps),
    canEarnPassportStamp: canEarnPassportStamp(completedSteps),
    canUnlockConnections: canUnlockConnections(completedSteps),
    contextAvailable: true,
  }
}
