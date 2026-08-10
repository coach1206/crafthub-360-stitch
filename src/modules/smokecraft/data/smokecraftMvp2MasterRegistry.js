/**
 * SmokeCraft MVP2 Master Registry
 * Single source of truth for all SmokeCraft MVP2 routes, session guards,
 * assets, data contracts, and feature flags in one queryable record.
 *
 * RULES: Read-only. Never modify session numbers, paths, or asset paths
 * without updating the corresponding source file. Do not add routes here
 * before wiring them in App.jsx. Do not mark a route 'complete' without
 * an e2e test asserting the asset loads.
 */

export const MVP2_VERSION = '1.0.0'
export const MVP2_BUILD   = 'investor-readiness'
export const MVP2_E2E_EVIDENCE = 'e2e-smokecraft-investor-readiness.mjs — 300/300 PASS'

// ── Journey steps (S1–S24) ───────────────────────────────────────────────────
// session: null = no SmokeCraftSessionGuard (public access)
// session: N   = SmokeCraftSessionGuard sessionNumber={N}
export const JOURNEY_STEPS = [
  { session: null, stepId: 'landing',           path: '/smokecraft',                   label: 'SmokeCraft Landing',        status: 'complete', assetApproved: true },
  { session: 2,    stepId: 'enroll',            path: '/smokecraft/enroll',            label: 'Enroll',                    status: 'complete', assetApproved: true },
  { session: 3,    stepId: 'golden-box',        path: '/smokecraft/golden-box',        label: 'Golden Box Rules',          status: 'complete', assetApproved: true },
  { session: 4,    stepId: 'mentor-selection',  path: '/smokecraft/mentor-selection',  label: 'Mentor Selection',          status: 'complete', assetApproved: true },
  { session: 5,    stepId: 'format',            path: '/smokecraft/format',            label: 'Format Selection',          status: 'complete', assetApproved: true },
  { session: 6,    stepId: 'wrapper-strength',  path: '/smokecraft/wrapper-strength',  label: 'Wrapper & Strength',        status: 'complete', assetApproved: true },
  { session: 7,    stepId: 'seed-soil',         path: '/smokecraft/seed-soil',         label: 'Seed & Soil Pairing',       status: 'complete', assetApproved: true },
  { session: 8,    stepId: 'pairing-lab',       path: '/smokecraft/pairing-lab',       label: 'Pairing Lab',               status: 'complete', assetApproved: true },
  { session: 9,    stepId: 'humidor-match',     path: '/smokecraft/humidor-match',     label: 'Humidor Match',             status: 'complete', assetApproved: true },
  { session: 10,   stepId: 'request-purchase',  path: '/smokecraft/request-purchase',  label: 'Request Purchase',          status: 'complete', assetApproved: true },
  { session: 11,   stepId: 'cut-toast-light',   path: '/smokecraft/cut-toast-light',   label: 'Cut / Toast / Light',       status: 'complete', assetApproved: true },
  { session: 12,   stepId: 'first-third',       path: '/smokecraft/first-third',       label: 'First Third',               status: 'complete', assetApproved: true },
  { session: 13,   stepId: 'second-third',      path: '/smokecraft/second-third',      label: 'Second Third',              status: 'complete', assetApproved: true },
  { session: 14,   stepId: 'flavor-memory',     path: '/smokecraft/flavor-memory',     label: 'Flavor Memory',             status: 'complete', assetApproved: true },
  { session: 15,   stepId: 'final-third',       path: '/smokecraft/final-third',       label: 'Final Third',               status: 'complete', assetApproved: true },
  { session: 16,   stepId: 'scorecard',         path: '/smokecraft/scorecard',         label: 'Scorecard',                 status: 'complete', assetApproved: true },
  { session: 17,   stepId: 'smokecraft-challenge', path: '/smokecraft/smokecraft-challenge', label: 'SmokeCraft Challenge', status: 'complete', assetApproved: true },
  { session: 18,   stepId: 'second-humidor-match', path: '/smokecraft/second-humidor-match', label: 'Second Humidor Match', status: 'complete', assetApproved: true },
  { session: 19,   stepId: 'mini-tasting',      path: '/smokecraft/mini-tasting',      label: 'Mini Tasting Round',        status: 'complete', assetApproved: true },
  { session: 20,   stepId: 'final-review',      path: '/smokecraft/final-review',      label: 'Final Review',              status: 'complete', assetApproved: true },
  { session: 21,   stepId: 'passport-stamp',    path: '/smokecraft/passport-stamp',    label: 'Passport Stamp',            status: 'complete', assetApproved: true },
  { session: 22,   stepId: 'connections',       path: '/smokecraft/connections',       label: 'Connections',               status: 'complete', assetApproved: true },
  { session: 23,   stepId: 'management-sync',   path: '/smokecraft/management-sync',   label: 'Management Sync',           status: 'complete', assetApproved: true },
  { session: 24,   stepId: 'session-complete',  path: '/smokecraft/session-complete',  label: 'Session Complete',          status: 'complete', assetApproved: true },
]

// ── Secondary / utility routes (not session-gated) ───────────────────────────
export const UTILITY_ROUTES = [
  { path: '/smokecraft/how-it-works',        label: 'How It Works',         status: 'complete' },
  { path: '/smokecraft/leaderboard',         label: 'Leaderboard',          status: 'complete' },
  { path: '/smokecraft/identity',            label: 'Identity',             status: 'complete' },
  { path: '/smokecraft/pairing-lab',         label: 'Pairing Lab',          status: 'complete' },
]

// ── Feature flags (source: smokecraftFeatureFlagContract.js) ─────────────────
export const FLAG_SUMMARY = {
  'smokecraft.ordering.enabled':                  true,
  'smokecraft.staffQueue.enabled':                true,
  'smokecraft.pairing.localIntelligence.enabled': true,
  'smokecraft.pairing.provider.enabled':          false,   // requires API key
  'smokecraft.rewards.enabled':                   true,
  'smokecraft.passport.enabled':                  true,
  'smokecraft.venueAdmin.enabled':                true,
  'smokecraft.whiteLabel.enabled':                false,   // requires license
  'smokecraft.marketplaceListing.enabled':        false,   // blocked until live
  'smokecraft.licenseEnforcement.enabled':        false,   // inactive this build
  'smokecraft.billing.enabled':                   false,   // preview_only
  'smokecraft.productionSync.enabled':            false,   // live connectors not verified
}

// ── What is live vs preview ───────────────────────────────────────────────────
export const INTEGRATION_STATUS = {
  guestJourneyFlow:       'live',
  sessionProgression:     'live',
  scorecardScoring:       'live',
  leaderboard:            'live_demo_data',
  passportStamps:         'live',
  pairingIntelligence:    'local_fallback',  // provider disabled
  purchaseIntent:         'preview',          // staff-attested, no payment
  paymentCapture:         'not_built',
  posSync:                'preview',
  databasePersistence:    'memory_fallback',  // postgres not deployed
  multiDeviceSync:        'not_built',
  billing:                'not_built',
}

// ── Approved asset dirs ───────────────────────────────────────────────────────
export const APPROVED_ASSET_DIRS = [
  '/assets/smokecraft-reference/approved/',   // primary approved images
  '/assets/smokecraft/',                       // secondary (mixed status — see mvp2-visual-image-registry.md)
]

export const ASSET_NAMING_RULE = 'kebab-case, lowercase, no spaces. Approved images must live in approved/ subfolder. Do not rename approved/ files.'

// ── Data contracts ────────────────────────────────────────────────────────────
export const DATA_CONTRACT_FILES = [
  'smokecraftFeatureFlagContract.js',
  'smokecraftJourneyContract.js',
  'smokecraftPairingContract.js',
  'smokecraftRewardContract.js',
  'smokecraftPermissionContract.js',
  'smokecraftPersistenceContract.js',
  'smokecraftRouteContract.js',
  'smokecraftReleaseCandidateContract.js',
  'smokecraftFinalQaContract.js',
  'smokecraftProductionBlockerContract.js',
]

export function getMvp2Summary() {
  return {
    version:              MVP2_VERSION,
    build:                MVP2_BUILD,
    totalJourneySteps:    JOURNEY_STEPS.length,
    allStepsComplete:     JOURNEY_STEPS.every(s => s.status === 'complete'),
    allAssetsApproved:    JOURNEY_STEPS.every(s => s.assetApproved),
    e2eEvidence:          MVP2_E2E_EVIDENCE,
    integrationStatus:    INTEGRATION_STATUS,
    featureFlagSummary:   FLAG_SUMMARY,
  }
}
