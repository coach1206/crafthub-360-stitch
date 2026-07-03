/**
 * SmokeCraft Enterprise Package Contract
 * Module Build 8 — enterprise packaging metadata shapes and allowed statuses.
 */

export const PACKAGE_STATUSES = {
  DRAFT:                        'draft',
  REGISTERED_PREVIEW:           'registered_preview',
  PACKAGE_CANDIDATE:            'package_candidate',
  GOVERNANCE_REVIEW:            'governance_review',
  BLOCKED:                      'blocked',
  APPROVED_FOR_PACKAGING_PREVIEW: 'approved_for_packaging_preview',
}

export const PHYSICAL_PACKAGE_STATUSES = {
  NOT_YET_PACKAGED:       'not_yet_packaged',
  PACKAGE_MANIFEST_READY: 'package_manifest_ready',
  PACKAGING_PREVIEW_ONLY: 'packaging_preview_only',
}

export const INSTALL_STATUSES = {
  NOT_INSTALLABLE:       'not_installable',
  INSTALL_PREVIEW_ONLY:  'install_preview_only',
  INSTALL_CANDIDATE:     'install_candidate',
}

export const UPGRADE_STATUSES = {
  NO_UPGRADE_PENDING:    'no_upgrade_pending',
  UPGRADE_PLAN_PREVIEW:  'upgrade_plan_preview',
  UPGRADE_BLOCKED:       'upgrade_blocked',
}

export function createEnterprisePackageRecord(overrides = {}) {
  return {
    packageId:               null,
    moduleId:                'smokecraft',
    moduleName:              'SmokeCraft Experience',
    version:                 '0.8.0-preview',
    packageStatus:           PACKAGE_STATUSES.PACKAGE_CANDIDATE,
    physicalPackageStatus:   PHYSICAL_PACKAGE_STATUSES.NOT_YET_PACKAGED,
    marketplaceStatus:       'not_live_marketplace',
    licenseStatus:           'license_not_enforced',
    installStatus:           INSTALL_STATUSES.NOT_INSTALLABLE,
    upgradeStatus:           UPGRADE_STATUSES.NO_UPGRADE_PENDING,
    rollbackStatus:          'rollback_plan_preview',
    whiteLabelReady:         false,
    tenantReady:             false,
    featureFlagReady:        true,
    governanceReviewStatus:  'pending_review',
    productionReadinessStatus: 'not_production_ready',
    createdAt:               new Date().toISOString(),
    updatedAt:               new Date().toISOString(),
    ...overrides,
  }
}
