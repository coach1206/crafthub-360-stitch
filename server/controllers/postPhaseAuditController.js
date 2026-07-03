import {
  buildPostPhaseAuditReport,
  getSealedCoreStatus,
  getFPLMRLIntegrity,
  getProductionBlockers,
  getStripeReadinessSummary,
  getDatabaseReadinessSummary,
  getSessionSecretReadiness,
  getEnvironmentSetupChecklist,
  getModuleBuildReadiness,
  getModuleBuild1Requirements,
  getNoveeOSPlatformClarification,
} from '../services/postPhase/postPhaseAuditService.js'

const ts = () => new Date().toISOString()

export function handlePostPhaseAuditReview(req, res) {
  try {
    const report = buildPostPhaseAuditReport()
    res.json({ ...report, timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'post-phase-audit', message: err.message, timestamp: ts() })
  }
}

export function handleSealedCoreStatus(req, res) {
  try {
    res.json({ ...getSealedCoreStatus(), service: 'sealed-core-status', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'sealed-core-status', message: err.message, timestamp: ts() })
  }
}

export function handleFPLMRLIntegrity(req, res) {
  try {
    res.json({ ...getFPLMRLIntegrity(), service: 'fplmrl-integrity', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'fplmrl-integrity', message: err.message, timestamp: ts() })
  }
}

export function handleProductionBlockers(req, res) {
  try {
    res.json({ blockers: getProductionBlockers(), service: 'production-blockers', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'production-blockers', message: err.message, timestamp: ts() })
  }
}

export function handleStripeReadiness(req, res) {
  try {
    res.json({ ...getStripeReadinessSummary(), service: 'stripe-readiness', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'stripe-readiness', message: err.message, timestamp: ts() })
  }
}

export function handleDatabaseReadiness(req, res) {
  try {
    res.json({ ...getDatabaseReadinessSummary(), service: 'database-readiness', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'database-readiness', message: err.message, timestamp: ts() })
  }
}

export function handleSessionSecretReadiness(req, res) {
  try {
    res.json({ ...getSessionSecretReadiness(), service: 'session-secret-readiness', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'session-secret-readiness', message: err.message, timestamp: ts() })
  }
}

export function handleEnvChecklist(req, res) {
  try {
    res.json({ checklist: getEnvironmentSetupChecklist(), service: 'env-checklist', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'env-checklist', message: err.message, timestamp: ts() })
  }
}

export function handleModuleBuildReadiness(req, res) {
  try {
    res.json({ ...getModuleBuildReadiness(), service: 'module-build-readiness', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'module-build-readiness', message: err.message, timestamp: ts() })
  }
}

export function handleModuleBuild1Requirements(req, res) {
  try {
    res.json({ ...getModuleBuild1Requirements(), service: 'module-build-1-requirements', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'module-build-1-requirements', message: err.message, timestamp: ts() })
  }
}

export function handlePlatformClarification(req, res) {
  try {
    res.json({ ...getNoveeOSPlatformClarification(), service: 'platform-clarification', timestamp: ts() })
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'platform-clarification', message: err.message, timestamp: ts() })
  }
}
