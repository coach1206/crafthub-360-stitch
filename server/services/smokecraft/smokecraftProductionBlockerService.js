/**
 * SmokeCraft Production Blocker Service
 * Module Build 9 — production blocker registry and severity reporting.
 */

import { PRODUCTION_BLOCKERS } from '../../../src/modules/smokecraft/data/smokecraftProductionBlockerContract.js'

export function getProductionBlockers() {
  return PRODUCTION_BLOCKERS
}

export function getBlockersByArea(area) {
  return PRODUCTION_BLOCKERS.filter(b => b.affectedArea === area)
}

export function getBlockersForProduction() {
  return PRODUCTION_BLOCKERS.filter(b => b.blocksProduction)
}

export function getBlockersForMarketplace() {
  return PRODUCTION_BLOCKERS.filter(b => b.blocksMarketplace)
}

export function getBlockersForLicenseEnforcement() {
  return PRODUCTION_BLOCKERS.filter(b => b.blocksLicenseEnforcement)
}

export function getProductionBlockerReport() {
  return {
    totalBlockers:           PRODUCTION_BLOCKERS.length,
    productionBlockers:      PRODUCTION_BLOCKERS.filter(b => b.blocksProduction).length,
    marketplaceBlockers:     PRODUCTION_BLOCKERS.filter(b => b.blocksMarketplace).length,
    licenseBlockers:         PRODUCTION_BLOCKERS.filter(b => b.blocksLicenseEnforcement).length,
    criticalBlockers:        PRODUCTION_BLOCKERS.filter(b => b.severity === 'critical').length,
    approvedForProduction:   false,
    approvedForMarketplace:  false,
    allBlockers:             PRODUCTION_BLOCKERS,
  }
}
