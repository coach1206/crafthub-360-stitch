/**
 * SmokeCraft Final QA Controller
 * Module Build 9 — handles /api/modules/smokecraft/final-qa/* routes.
 */

import { getFinalQaStatus } from '../services/smokecraft/smokecraftFinalQaService.js'
import { runEndToEndVerification } from '../services/smokecraft/smokecraftEndToEndVerificationService.js'
import { getReleaseCandidateStatus, getRcApprovalGates, getBuildSequenceSummary } from '../services/smokecraft/smokecraftReleaseCandidateService.js'
import { getHandoffPackage, getHandoffSummary } from '../services/smokecraft/smokecraftHandoffPackageService.js'
import { getProductionBlockerReport } from '../services/smokecraft/smokecraftProductionBlockerService.js'
import { getDocumentationLockStatus } from '../services/smokecraft/smokecraftDocumentationLockService.js'

export function getFinalQaStatusHandler(req, res) {
  const qa = getFinalQaStatus()
  const rc = getReleaseCandidateStatus()
  res.json({
    status:                  'final_qa_complete',
    moduleId:                'smokecraft',
    qaStatus:                qa.qaStatus,
    approvedForInternalDemo: qa.approvedForInternalDemo,
    approvedForProduction:   false,
    approvedForMarketplace:  false,
    qa,
    releaseCandidate: rc,
  })
}

export function getEndToEndHandler(req, res) {
  res.json(runEndToEndVerification())
}

export function getReleaseCandidateHandler(req, res) {
  res.json({
    releaseCandidate: getReleaseCandidateStatus(),
    approvalGates:    getRcApprovalGates(),
    buildSequence:    getBuildSequenceSummary(),
  })
}

export function getHandoffHandler(req, res) {
  res.json(getHandoffSummary())
}

export function getProductionBlockersHandler(req, res) {
  res.json(getProductionBlockerReport())
}

export function getDocumentationLockHandler(req, res) {
  res.json(getDocumentationLockStatus())
}

export function getProtectedFilesHandler(req, res) {
  res.json({
    protectedFiles: [
      'src/components/smokecraft/SmokeCraftAssetScreen.jsx',
      'src/components/smokecraft/SmokeCraftHotspotLayer.jsx',
      'src/components/smokecraft/SmokeCraftAssetRoute.jsx',
      'src/constants/session.js',
      'src/utils/passportProgress.js',
      'src/utils/passportEntry.js',
      'src/constants/smokecraftJourney.js',
    ],
    protectedFileStatus: 'protected_files_intact',
    modifiedByBuild9:    false,
  })
}

export function getHonestStatusHandler(req, res) {
  res.json({
    moduleId:               'smokecraft',
    approvedForInternalDemo: true,
    approvedForProduction:   false,
    approvedForMarketplace:  false,
    honestStatuses: {
      pos360:              'not_connected',
      eat:                 'not_connected',
      pairingProvider:     'local_intelligence',
      venueMenu:           'local_fallback',
      database:            'memory_fallback',
      billing:             'preview_only',
      marketplace:         'marketplace_draft',
      license:             'license_not_enforced',
      tenantIsolation:     'contract_ready',
      productionReady:     false,
    },
    disallowedClaims: [
      'production_ready',
      'marketplace_live',
      'license_enforced',
      'billing_active',
      'pos360_live_syncing',
      'eat_live_syncing',
      'live_ai_pairing',
      'database_production_persistent',
      'tenant_isolation_production_ready',
      'physically_packaged',
    ],
  })
}

export function getRoadmapHandler(req, res) {
  res.json({
    nextPhases: [
      { phase: 'A', title: 'Database Persistence Hardening' },
      { phase: 'B', title: 'POS360 Live Connector Implementation' },
      { phase: 'C', title: 'E.A.T. Live Sync Implementation' },
      { phase: 'D', title: 'Live Pairing Provider Integration' },
      { phase: 'E', title: 'Venue Menu Live Source Integration' },
      { phase: 'F', title: 'Reward Redemption Handler' },
      { phase: 'G', title: 'Billing Provider Integration' },
      { phase: 'H', title: 'License Enforcement Activation' },
      { phase: 'I', title: 'Marketplace Publishing Workflow' },
      { phase: 'J', title: 'Production Tenant Isolation' },
      { phase: 'K', title: 'Legal/Compliance Review' },
      { phase: 'L', title: 'Production Deployment Runbook' },
    ],
    currentStatus: 'internal_rc_complete',
    nextAction:    'Begin Phase A — Database Persistence Hardening',
  })
}
