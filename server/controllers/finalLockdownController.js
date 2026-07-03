import { runFinalLockdownAudit, buildFinalLockdownReport } from '../services/finalLockdown/finalLockdownAuditService.js'
import { buildProtectedFileIntegrityReport } from '../services/finalLockdown/protectedFileIntegrityService.js'
import { buildProductionReadinessReport, buildLaunchChecklist } from '../services/finalLockdown/productionReadinessReportService.js'
import { buildDegradedModeHonestyReport } from '../services/finalLockdown/degradedModeHonestyService.js'
import { buildSecuritySafetyReport } from '../services/finalLockdown/securitySafetyAuditService.js'
import { buildModuleReadinessMap, buildPostPhaseModuleBuildPlan } from '../services/moduleReadiness/moduleReadinessMapService.js'
import { buildMarketplaceReadinessReport } from '../services/moduleReadiness/marketplacePackagingReadinessService.js'
import { buildWhiteLabelReadinessReport } from '../services/moduleReadiness/whiteLabelLicensingReadinessService.js'
import { getFinalVerificationRegistry, buildVerificationChecklist } from '../services/finalLockdown/finalVerificationRegistryService.js'

export async function getFinalLockdownAudit(req, res) {
  try {
    const report = runFinalLockdownAudit()
    res.json(report)
  } catch (err) {
    res.status(500).json({ error: 'final_lockdown_audit_error', message: err.message })
  }
}

export async function getProtectedFiles(req, res) {
  try {
    res.json(buildProtectedFileIntegrityReport())
  } catch (err) {
    res.status(500).json({ error: 'protected_file_integrity_error', message: err.message })
  }
}

export async function getProductionReadiness(req, res) {
  try {
    res.json(buildProductionReadinessReport())
  } catch (err) {
    res.status(500).json({ error: 'production_readiness_error', message: err.message })
  }
}

export async function getDegradedModeHonesty(req, res) {
  try {
    res.json(buildDegradedModeHonestyReport())
  } catch (err) {
    res.status(500).json({ error: 'degraded_mode_honesty_error', message: err.message })
  }
}

export async function getSecuritySafety(req, res) {
  try {
    res.json(buildSecuritySafetyReport())
  } catch (err) {
    res.status(500).json({ error: 'security_safety_error', message: err.message })
  }
}

export async function getModuleReadiness(req, res) {
  try {
    res.json(buildModuleReadinessMap())
  } catch (err) {
    res.status(500).json({ error: 'module_readiness_error', message: err.message })
  }
}

export async function getMarketplaceReadiness(req, res) {
  try {
    res.json(buildMarketplaceReadinessReport())
  } catch (err) {
    res.status(500).json({ error: 'marketplace_readiness_error', message: err.message })
  }
}

export async function getWhiteLabelReadiness(req, res) {
  try {
    res.json(buildWhiteLabelReadinessReport())
  } catch (err) {
    res.status(500).json({ error: 'white_label_readiness_error', message: err.message })
  }
}

export async function getVerificationRegistry(req, res) {
  try {
    res.json({ registry: getFinalVerificationRegistry(), checklist: buildVerificationChecklist() })
  } catch (err) {
    res.status(500).json({ error: 'verification_registry_error', message: err.message })
  }
}

export async function getLaunchChecklist(req, res) {
  try {
    res.json(buildLaunchChecklist())
  } catch (err) {
    res.status(500).json({ error: 'launch_checklist_error', message: err.message })
  }
}

export async function getPostPhaseModulePlan(req, res) {
  try {
    res.json(buildPostPhaseModuleBuildPlan())
  } catch (err) {
    res.status(500).json({ error: 'post_phase_module_plan_error', message: err.message })
  }
}
