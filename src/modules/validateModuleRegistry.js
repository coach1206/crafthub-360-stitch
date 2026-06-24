// Module registry validator — Phase 3.
//
// Pure validation logic, safe to run in Node or the browser (no DOM/storage
// access). Checks the structural contract and the standalone-module rules
// carried over from Phase 1/2: POS 3 and E.A.T. Command Hub must never
// have a hard dependency on SmokeCraft (or anything else) — they may only
// OPTIONALLY integrate with it.

import { getMissingRequiredFields } from './moduleIntegrationContract.js'

const STANDALONE_MODULE_IDS = ['pos3', 'eat-command-hub']

/**
 * Validates a single module record. Returns an array of issue strings
 * (empty array = valid). Never throws — callers decide how to report.
 */
export function validateModule(moduleId, moduleRecord) {
  const issues = []

  if (!moduleRecord) {
    issues.push(`Module "${moduleId}" is not registered.`)
    return issues
  }

  const missingFields = getMissingRequiredFields(moduleRecord)
  if (missingFields.length > 0) {
    issues.push(`Module "${moduleId}" is missing required field(s): ${missingFields.join(', ')}.`)
  }

  if (STANDALONE_MODULE_IDS.includes(moduleId)) {
    const dependencies = moduleRecord.dependencies ?? []
    if (dependencies.includes('smokecraft')) {
      issues.push(`Module "${moduleId}" must not have a hard dependency on "smokecraft" (standalone-module rule).`)
    }
    if (dependencies.length > 0) {
      issues.push(`Module "${moduleId}" must have no hard dependencies; found: ${dependencies.join(', ')}.`)
    }
  }

  if (moduleId === 'smokecraft') {
    const dependencies = moduleRecord.dependencies ?? []
    if (dependencies.length > 0) {
      issues.push(`Module "smokecraft" must have no hard dependencies; found: ${dependencies.join(', ')}.`)
    }
  }

  return issues
}

/**
 * Validates an entire registry object ({ id: moduleRecord }). Returns
 * { valid: boolean, results: { [id]: string[] } } — results lists per-module
 * issues (empty array = that module passed).
 */
export function validateModuleRegistry(registry) {
  const results = {}
  let valid = true

  for (const [moduleId, moduleRecord] of Object.entries(registry)) {
    const issues = validateModule(moduleId, moduleRecord)
    results[moduleId] = issues
    if (issues.length > 0) valid = false
  }

  for (const requiredId of STANDALONE_MODULE_IDS) {
    if (!(requiredId in registry)) {
      results[requiredId] = [`Module "${requiredId}" is not registered.`]
      valid = false
    }
  }

  return { valid, results }
}

export default validateModuleRegistry
