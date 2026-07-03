/**
 * SmokeCraft Release Candidate Service
 * Module Build 9 — RC status, approval gates, and build sequence status.
 * approvedForProduction and approvedForMarketplace remain false.
 */

import { createReleaseCandidateRecord } from '../../../src/modules/smokecraft/data/smokecraftReleaseCandidateContract.js'
import { PRODUCTION_BLOCKERS } from '../../../src/modules/smokecraft/data/smokecraftProductionBlockerContract.js'

export function getReleaseCandidateStatus() {
  const blockers = PRODUCTION_BLOCKERS.map(b => b.blockerId)
  return createReleaseCandidateRecord({
    knownBlockers:             blockers,
    approvedForInternalDemo:   true,
    approvedForProduction:     false,
    approvedForMarketplace:    false,
  })
}

export function getRcApprovalGates() {
  return {
    internalDemo: {
      approved:   true,
      conditions: ['All 9 module builds complete', 'All verify scripts pass', 'Build clean', 'Honest status confirmed'],
    },
    production: {
      approved:   false,
      blockedBy: [
        'DATABASE_URL persistence not verified',
        'POS360 not connected',
        'E.A.T. not connected',
        'Billing not connected',
        'Tenant isolation not database-backed',
        'Reward redemption not active',
      ],
    },
    marketplace: {
      approved:   false,
      blockedBy: [
        'Physical package not created',
        'License enforcement not active',
        'Billing not connected',
        'Production persistence not verified',
        'Final governance review required',
        'Legal/compliance review not completed',
      ],
    },
  }
}

export function getBuildSequenceSummary() {
  return {
    totalBuilds:    9,
    completedBuilds: 9,
    branch:         'claude/beautiful-thompson-r3mm5m',
    currentStatus:  'internal_rc_complete',
    productionReady: false,
  }
}
