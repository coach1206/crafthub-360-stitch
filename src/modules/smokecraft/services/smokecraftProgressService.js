/**
 * SmokeCraft Progress Service (module layer)
 * Thin contract layer over the existing progress context/utils.
 * Sources from the canonical 24-session smokecraftJourneyContract.
 */

import { JOURNEY_STEPS, JOURNEY_RULES, getNextRoute, getPrevRoute } from '../data/smokecraftJourneyContract.js'

/**
 * Returns whether a given step ID is unlocked based on completed steps.
 * Respects passport stamp and connections lock rules.
 */
export function isStepUnlocked(stepId, completedSteps = []) {
  const step = JOURNEY_STEPS.find(s => s.id === stepId)
  if (!step) return false

  // entry is always unlocked
  if (stepId === 'entry') return true

  const stepIdx = JOURNEY_STEPS.indexOf(step)
  if (stepIdx === 0) return true

  // All prior steps must be complete
  const priorSteps = JOURNEY_STEPS.slice(0, stepIdx)
  return priorSteps.every(s => completedSteps.includes(s.id))
}

/**
 * Returns whether passport-stamp can be earned.
 * Requires scorecard completion. Early unlock is not allowed.
 */
export function canEarnPassportStamp(completedSteps = []) {
  if (!JOURNEY_RULES.passportStampEarlyUnlockAllowed) {
    return completedSteps.includes('scorecard')
  }
  return true
}

/**
 * Returns whether connections are unlocked.
 * Requires passport-stamp. Early unlock is not allowed.
 */
export function canUnlockConnections(completedSteps = []) {
  if (!JOURNEY_RULES.connectionsEarlyUnlockAllowed) {
    return completedSteps.includes('passport-stamp')
  }
  return true
}

/**
 * Returns a progress summary for the current user session.
 */
export function buildProgressSummary(completedSteps = []) {
  const currentStep = JOURNEY_STEPS.find(s => !completedSteps.includes(s.id)) ?? null
  return {
    totalSteps: JOURNEY_STEPS.length,  // 24
    completedCount: completedSteps.length,
    completedSteps,
    currentStep,
    nextRoute: currentStep ? getNextRoute(currentStep.id) : null,
    prevRoute: currentStep ? getPrevRoute(currentStep.id) : null,
    passportStampEarned: completedSteps.includes('passport-stamp'),
    connectionsUnlocked: completedSteps.includes('connections'),
    sessionComplete: completedSteps.includes('session-complete'),
    flavorMemoryCompleted: completedSteps.includes('flavor-memory'),
    journeyRules: JOURNEY_RULES,
  }
}

export { getNextRoute, getPrevRoute }
