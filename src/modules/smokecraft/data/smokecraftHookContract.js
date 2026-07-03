/**
 * SmokeCraft Hook Contract
 * Registers hook points for SmokeCraft journey events.
 * These hooks enable future E.A.T., POS360, Passport, analytics, and audit integrations.
 */

export const SMOKECRAFT_HOOKS = [
  { hookId: 'smokeCraft.session.started',         system: 'audit',      description: 'Fired when a SmokeCraft session begins' },
  { hookId: 'smokeCraft.identity.completed',      system: 'eat',        description: 'Fired when customer profile identity is captured' },
  { hookId: 'smokeCraft.mentor.selected',         system: 'analytics',  description: 'Fired when a mentor is selected' },
  { hookId: 'smokeCraft.humidor.matched',         system: 'eat',        description: 'Fired when humidor match is completed' },
  { hookId: 'smokeCraft.purchase.requested',      system: 'pos360',     description: 'Fired when customer requests purchase' },
  { hookId: 'smokeCraft.pairing.recommended',     system: 'eat',        description: 'Fired when pairing recommendations are generated' },
  { hookId: 'smokeCraft.firstThird.completed',    system: 'analytics',  description: 'Fired when first third tasting is completed' },
  { hookId: 'smokeCraft.secondThird.completed',   system: 'analytics',  description: 'Fired when second third tasting is completed' },
  { hookId: 'smokeCraft.flavorMemory.completed',  system: 'analytics',  description: 'Fired when flavor memory session is completed' },
  { hookId: 'smokeCraft.finalThird.completed',    system: 'analytics',  description: 'Fired when final third tasting is completed' },
  { hookId: 'smokeCraft.scorecard.completed',     system: 'audit',      description: 'Fired when scorecard is submitted' },
  { hookId: 'smokeCraft.passportStamp.earned',    system: 'passport',   description: 'Fired when passport stamp is earned' },
  { hookId: 'smokeCraft.connections.unlocked',    system: 'passport',   description: 'Fired when connections are unlocked' },
  { hookId: 'smokeCraft.managementSync.requested',system: 'eat',        description: 'Fired when management sync is triggered' },
  { hookId: 'smokeCraft.session.completed',       system: 'audit',      description: 'Fired when session is fully complete' },
  { hookId: 'smokeCraft.order.requested',         system: 'pos360',     description: 'Fired when customer places an order request' },
  { hookId: 'smokeCraft.order.sentToStaff',       system: 'staff',      description: 'Fired when order is routed to staff queue' },
  { hookId: 'smokeCraft.order.sentToPOS',         system: 'pos360',     description: 'Fired when order is confirmed sent to POS360' },
]

export function getHookById(hookId) {
  return SMOKECRAFT_HOOKS.find(h => h.hookId === hookId) ?? null
}

export function getHooksBySystem(system) {
  return SMOKECRAFT_HOOKS.filter(h => h.system === system)
}

export function buildSmokeCraftHookRegistryReport() {
  return {
    moduleId: 'smokecraft-experience',
    totalHooks: SMOKECRAFT_HOOKS.length,
    hooks: SMOKECRAFT_HOOKS,
    registrationStatus: 'registered_preview',
    hookExecutionStatus: 'preview_only',
    note: 'Hook points are defined. Live hook execution requires Module Build 3+.',
    preview_only: true,
  }
}

export const HOOK_CONTRACT_VERSION = '0.1.0'
