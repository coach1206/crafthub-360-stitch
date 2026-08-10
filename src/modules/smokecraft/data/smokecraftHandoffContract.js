/**
 * SmokeCraft Handoff Contract
 * Module Build 9 — handoff package shape and build sequence index.
 */

export const BUILD_SEQUENCE = [
  { build: 1, title: 'NOVEE OS Module Packaging Foundation',            commit: 'd3140e7c', status: 'complete' },
  { build: 2, title: 'SmokeCraft Experience Module Registration',       commit: 'a2f0c37e', status: 'complete' },
  { build: 3, title: 'SmokeCraft Ordering, Venue Menu, POS360, E.A.T.', commit: 'd6fa7f75', status: 'complete' },
  { build: 4, title: 'SmokeCraft Pairing Intelligence',                 commit: '9df2857b', status: 'complete' },
  { build: 5, title: 'SmokeCraft Passport, Loyalty, Rewards, Monetization', commit: '15ef0dec', status: 'complete' },
  { build: 6, title: 'SmokeCraft Venue Admin, Staff Operations, Analytics', commit: '094696dd', status: 'complete' },
  { build: 7, title: 'SmokeCraft Live Integrations, Connectors, Sync Readiness', commit: '86574f32', status: 'complete' },
  { build: 8, title: 'SmokeCraft Enterprise Packaging, Licensing, Marketplace Draft', commit: 'ef8927f4', status: 'complete' },
  { build: 9, title: 'SmokeCraft Final QA, Release Candidate, Handoff',  commit: null,       status: 'complete' },
]

export const VERIFY_SCRIPT_MAP = [
  { script: 'verify:module-foundation',                    description: 'NOVEE OS Module Packaging Foundation (Build 1)' },
  { script: 'verify:smokecraft-experience-module',         description: 'SmokeCraft Experience Module registration (Build 2)' },
  { script: 'verify:smokecraft-ordering-integration',      description: 'Ordering, Venue Menu, POS360, E.A.T. (Build 3)' },
  { script: 'verify:smokecraft-pairing-intelligence',      description: 'Pairing Intelligence (Build 4)' },
  { script: 'verify:smokecraft-rewards-monetization',      description: 'Passport, Loyalty, Rewards, Monetization (Build 5)' },
  { script: 'verify:smokecraft-venue-admin-operations',    description: 'Venue Admin, Staff Operations, Analytics (Build 6)' },
  { script: 'verify:smokecraft-production-sync-readiness', description: 'Live Integrations, Connectors, Sync Readiness (Build 7)' },
  { script: 'verify:smokecraft-enterprise-packaging',      description: 'Enterprise Packaging, Licensing, Marketplace Draft (Build 8)' },
  { script: 'verify:smokecraft-final-qa-release-candidate', description: 'Final QA, Release Candidate, Handoff (Build 9)' },
]

export const API_ROUTE_MAP = [
  '/api/modules/smokecraft',
  '/api/modules/smokecraft/orders',
  '/api/modules/smokecraft/pairing',
  '/api/modules/smokecraft/rewards',
  '/api/modules/smokecraft/admin',
  '/api/modules/smokecraft/integrations',
  '/api/modules/smokecraft/enterprise',
  '/api/modules/smokecraft/final-qa',
]

export function createHandoffRecord(overrides = {}) {
  return {
    handoffId:           'smokecraft-handoff-rc-9',
    moduleId:            'smokecraft',
    moduleName:          'SmokeCraft Experience',
    version:             '0.9.0-rc-preview',
    handoffStatus:       'handoff_ready',
    buildSequence:       BUILD_SEQUENCE,
    verifyScriptMap:     VERIFY_SCRIPT_MAP,
    apiRouteMap:         API_ROUTE_MAP,
    productionBlockers:  [],
    createdAt:           new Date().toISOString(),
    ...overrides,
  }
}
