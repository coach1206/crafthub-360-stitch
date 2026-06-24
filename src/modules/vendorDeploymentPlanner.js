// Vendor deployment planner — Phase 5.
//
// Generates a deployment PLAN for a vendor + profile combination. This is
// planning output only — no module is actually deployed, no device is
// contacted, no licensing is charged. The plan tells a human (or a future
// Novi OS) what modules would be included, what's missing, and a readiness
// score derived from real checks, never an invented number.

import { getVendor } from './vendorModuleAccess.js'
import { getDeploymentProfile } from './deploymentProfiles.js'
import { validateModuleReadiness } from './deploymentReadinessValidator.js'
import { checkModuleAccess } from './moduleSecurityGuard.js'
import { ROLES } from './roleAccessRules.js'

/**
 * Builds a deployment plan. Returns:
 * { vendorId, profileId, modulesIncluded, warnings, requirements, readinessScore }
 *
 * readinessScore is the fraction (0-1) of included modules that are both
 * deployment-ready AND assigned/enabled/licensed for this vendor — it is
 * computed from real checks, not asserted.
 */
export function generateDeploymentPlan({ vendorId, profileId, role = ROLES.VENDOR_ADMIN } = {}) {
  const vendor = getVendor(vendorId)
  const profile = getDeploymentProfile(profileId)
  const warnings = []

  if (!vendor) warnings.push(`Vendor "${vendorId}" is not registered.`)
  if (!profile) warnings.push(`Deployment profile "${profileId}" does not exist.`)

  if (!vendor || !profile) {
    return {
      vendorId,
      profileId,
      modulesIncluded: [],
      warnings,
      requirements: [],
      readinessScore: 0,
    }
  }

  const moduleResults = profile.modules.map(moduleId => {
    const readiness = validateModuleReadiness(moduleId)
    const access = checkModuleAccess({ vendorId, moduleId, role })

    if (!readiness.ready) {
      warnings.push(`Module "${moduleId}" is not deployment ready: ${readiness.issues.join('; ') || 'unspecified issue'}.`)
    }
    if (!access.allowed) {
      warnings.push(`Module "${moduleId}" is not currently accessible for vendor "${vendorId}": ${access.reason}.`)
    }

    return { moduleId, readiness, access }
  })

  const readyAndAccessibleCount = moduleResults.filter(result => result.readiness.ready && result.access.allowed).length
  const readinessScore = profile.modules.length > 0 ? readyAndAccessibleCount / profile.modules.length : 0

  if (vendor.environment && !profile.requiredEnvironments.includes(vendor.environment)) {
    warnings.push(`Vendor environment "${vendor.environment}" is not one of the profile's required environments (${profile.requiredEnvironments.join(', ')}).`)
  }

  return {
    vendorId,
    profileId,
    modulesIncluded: profile.modules,
    warnings,
    requirements: {
      requiredPermissions: profile.requiredPermissions,
      requiredEnvironments: profile.requiredEnvironments,
      featureFlags: profile.featureFlags,
      healthRequirements: profile.healthRequirements,
    },
    readinessScore,
  }
}

export default {
  generateDeploymentPlan,
}
