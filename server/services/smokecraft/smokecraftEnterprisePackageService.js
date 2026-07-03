/**
 * SmokeCraft Enterprise Package Service
 * Module Build 8 — enterprise packaging metadata and manifest.
 * Does not claim physically packaged or production-ready.
 */

import { createEnterprisePackageRecord, PACKAGE_STATUSES, PHYSICAL_PACKAGE_STATUSES } from '../../../src/modules/smokecraft/data/smokecraftEnterprisePackageContract.js'

let _packageRecord = null

export function getEnterprisePackageRecord() {
  if (!_packageRecord) {
    _packageRecord = createEnterprisePackageRecord({
      packageId:             'smokecraft-enterprise-preview-001',
      packageStatus:         PACKAGE_STATUSES.PACKAGE_CANDIDATE,
      physicalPackageStatus: PHYSICAL_PACKAGE_STATUSES.NOT_YET_PACKAGED,
    })
  }
  return { ..._packageRecord, updatedAt: new Date().toISOString() }
}

export function getPackageManifest() {
  return {
    moduleId:      'smokecraft',
    moduleName:    'SmokeCraft Experience',
    version:       '0.8.0-preview',
    noveeOsMinVersion: '1.0.0',
    entryPoints: {
      frontend: 'src/modules/smokecraft/',
      backend:  'server/services/smokecraft/',
      routes:   'server/routes/smokecraft*.js',
    },
    requiredRoutes: [
      '/api/modules/smokecraft',
      '/api/modules/smokecraft/orders',
      '/api/modules/smokecraft/pairing',
      '/api/modules/smokecraft/rewards',
      '/api/modules/smokecraft/admin',
      '/api/modules/smokecraft/integrations',
      '/api/modules/smokecraft/enterprise',
    ],
    optionalConnectors: ['pos360', 'eat_system', 'pairing_provider', 'venue_menu_provider'],
    manifestStatus: 'package_manifest_ready',
    physicalArtifactExists: false,
    productionInstallable:  false,
    createdAt: new Date().toISOString(),
  }
}

export function getEnterprisePackageStatus() {
  const record = getEnterprisePackageRecord()
  return {
    ...record,
    manifest:              getPackageManifest(),
    productionReady:       false,
    physicalArtifactExists: false,
  }
}
