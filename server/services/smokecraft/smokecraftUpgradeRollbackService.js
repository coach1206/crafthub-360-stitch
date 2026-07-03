/**
 * SmokeCraft Upgrade / Rollback Service
 * Module Build 8 — upgrade and rollback preview plans only.
 * Does not execute migrations. Does not alter database.
 */

export function getUpgradePlan(targetVersion = null) {
  return {
    currentVersion:     '0.8.0-preview',
    targetVersion:      targetVersion ?? '0.9.0-preview',
    upgradePlanStatus:  'upgrade_plan_preview',
    rollbackPlanStatus: 'rollback_plan_preview',
    migrationRequired:  false,
    migrationStatus:    'not_executed',
    breakingChanges:    [],
    rollbackAvailable:  true,
    rollbackSteps: [
      'Revert to prior commit on claude/beautiful-thompson-r3mm5m',
      'Restore memory store state from snapshot if available',
      'Verify all prior verify scripts pass',
      'Confirm no production data was altered',
    ],
    dataBackupRequired: true,
    tenantImpact:       'none_in_this_build',
    featureFlagImpact:  'flags_preserved',
    dependencyImpact:   'none',
    migrationExecuted:  false,
    productionReady:    false,
    planOnly:           true,
    warnings: [
      'This is a preview plan only — no migration has been executed.',
      'No database has been altered.',
      'Rollback steps are plans, not executed rollbacks.',
    ],
  }
}

export function getRollbackPlan() {
  return {
    rollbackPlanStatus:  'rollback_plan_preview',
    rollbackAvailable:   true,
    rollbackExecuted:    false,
    dataRestored:        false,
    planOnly:            true,
    steps: [
      'Identify target rollback commit',
      'Verify no production data loss',
      'Revert branch to target commit',
      'Run all verify scripts against reverted build',
      'Confirm app boots and all routes respond',
    ],
  }
}

export function getUpgradeRollbackStatus() {
  return {
    ...getUpgradePlan(),
    rollback: getRollbackPlan(),
  }
}
