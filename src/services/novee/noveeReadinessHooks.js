/**
 * NOVEE OS Readiness Hooks
 * Aggregates readiness signals across all NOVEE OS services for display in E.A.T. and venue dashboards.
 */

import { getPlatformReadiness, resolveVerticalAuthority } from './noveePlatformAuthority.js'
import { getPaymentAuthorityStatus } from './noveePaymentAuthority.js'

export function getNoveeReadinessHooks(venueId = null, moduleId = null) {
  const platform = getPlatformReadiness()
  const payment  = getPaymentAuthorityStatus()

  const hooks = [
    { type: 'platform_preview',            severity: 'info',    message: 'NOVEE OS is running in platform_preview mode.' },
    { type: 'stripe_connect_preview',      severity: 'warning', message: 'Stripe Connect not verified. Payment operations are preview-only.' },
    { type: 'order_lifecycle_preview',     severity: 'info',    message: 'Order lifecycle engine is in preview mode.' },
    { type: 'kds_routing_pending',         severity: 'info',    message: 'KDS routing has not been verified. Dispatch is preview-only.' },
    { type: 'tax_compliance_preview',      severity: 'info',    message: 'Tax compliance is in preview mode. No live remittance.' },
    { type: 'pos_sync_preview',            severity: 'info',    message: 'POS sync is in preview mode. No live sync claimed.' },
    { type: 'ncie_preview',                severity: 'info',    message: 'NCIE services are preview-only. AI personalization requires OpenAI key.' },
  ]

  const verticalAuthority = moduleId ? resolveVerticalAuthority(moduleId) : null

  return {
    ok:              true,
    venueId,
    moduleId,
    platformStatus:  platform.platformStatus,
    paymentStatus:   payment.stripeConnectStatus,
    orderStatus:     'order_lifecycle_preview',
    kdsStatus:       'kds_routing_pending',
    taxStatus:       'tax_compliance_preview',
    posStatus:       'pos_sync_preview',
    ncieStatus:      'ncie_preview',
    readinessMode:   'novee_readiness_preview',
    hooks,
    verticalAuthority,
    storageMode:     'memory_fallback',
    message:         'NOVEE OS readiness hooks generated. No live service is confirmed without verified integration proof.',
  }
}

export function getVerticalReadinessScore(moduleId) {
  if (!moduleId) return { ok: false, error: 'module_id_required' }
  const authority = resolveVerticalAuthority(moduleId)
  if (!authority.ok) return { ok: false, error: 'vertical_not_registered', moduleId }

  const checks = [
    { name: 'vertical_registered',       pass: authority.launchStatus !== null },
    { name: 'ncie_support_configured',   pass: authority.ncieSupportLevel !== null },
    { name: 'capabilities_defined',      pass: authority.capabilities.length > 0 },
    { name: 'parent_platform_verified',  pass: authority.parentPlatform === 'novee_os' },
    { name: 'authority_mode_set',        pass: authority.authorityMode === 'novee_os_authority' },
  ]

  const passing = checks.filter(c => c.pass).length
  const score   = Math.round((passing / checks.length) * 100)

  return {
    ok:           true,
    moduleId,
    score,
    checks,
    readinessMode: 'vertical_readiness_preview',
    message:       `Vertical readiness score: ${score}/100. No live claim made.`,
  }
}

export function getAllVerticalsReadiness() {
  const { CRAFT_MODULES } = await import('../../data/novee/noveePlatformModules.js').catch(() => ({ CRAFT_MODULES: [] }))
  return {
    ok:           true,
    readinessMode: 'platform_readiness_preview',
    message:       'Use getVerticalReadinessScore(moduleId) per vertical.',
    storageMode:   'memory_fallback',
  }
}
