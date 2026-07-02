/**
 * NOVEE OS Platform Authority
 * NOVEE OS is the parent operating system. It does not claim live operational status
 * without verified integration proof. All readiness values are honest previews.
 */

import { NOVEE_PLATFORM, CRAFT_MODULES } from '../../data/novee/noveePlatformModules.js'
import { VERTICAL_REGISTRY } from '../../data/novee/noveeVerticalRegistry.js'

export function getNoveeOSIdentity() {
  return {
    ...NOVEE_PLATFORM,
    platformAuthority:  'novee_os_parent',
    verticalCount:      CRAFT_MODULES.length,
    activeVerticals:    CRAFT_MODULES.filter(m => m.status === 'active').length,
    registeredVerticals: CRAFT_MODULES.filter(m => m.status === 'craft_vertical_registered').length,
    platformStatus:     'platform_preview',
    message:            'NOVEE OS is the parent operating system. Craft360 verticals are registered but not live without venue verification.',
  }
}

export function getPlatformReadiness() {
  const active = CRAFT_MODULES.filter(m => m.status === 'active')
  const registered = CRAFT_MODULES.filter(m => m.status === 'craft_vertical_registered')
  return {
    platformName:       'NOVEE OS',
    platformRole:       'novee_parent_platform',
    platformStatus:     'platform_preview',
    activeModules:      active.map(m => m.moduleId),
    registeredModules:  registered.map(m => m.moduleId),
    totalModules:       CRAFT_MODULES.length,
    readinessMode:      'platform_preview',
    message:            'Platform readiness is preview-only. No live venue, partner, or payment operation is confirmed without verified proof.',
  }
}

export function resolveVerticalAuthority(moduleId) {
  const module = CRAFT_MODULES.find(m => m.moduleId === moduleId)
  if (!module) {
    return {
      ok:             false,
      moduleId,
      error:          'vertical_not_registered',
      parentPlatform: 'novee_os',
    }
  }
  const registration = VERTICAL_REGISTRY.find(v => v.moduleId === moduleId)
  return {
    ok:                 true,
    moduleId:           module.moduleId,
    displayName:        module.displayName,
    verticalType:       module.verticalType,
    parentPlatform:     'novee_os',
    launchStatus:       module.status,
    ncieSupportLevel:   registration?.ncieSupportLevel ?? 'preview',
    capabilities:       registration?.capabilities ?? [],
    authorityMode:      'novee_os_authority',
    platformStatus:     'platform_preview',
  }
}

export function getModuleManifest(moduleId) {
  const authority = resolveVerticalAuthority(moduleId)
  if (!authority.ok) return authority
  return {
    ...authority,
    manifestVersion: '1.0',
    manifestStatus:  'manifest_preview',
    engines: {
      knowledge:           'ncie_knowledge_engine_preview',
      mentor:              'ncie_mentor_engine_preview',
      decision:            'ncie_decision_engine_preview',
      recommendation:      'ncie_recommendation_engine_preview',
      commerceIntelligence: 'ncie_commerce_intelligence_preview',
      analyticsIntelligence: 'ncie_analytics_intelligence_preview',
      passportMastery:     'ncie_passport_mastery_preview',
    },
    integrations: {
      orderLifecycle:  'order_lifecycle_preview',
      kdsRouting:      'kds_routing_pending',
      taxCompliance:   'tax_compliance_preview',
      posSync:         'pos_sync_preview',
      paymentBridge:   'payment_bridge_preview',
      stripeConnect:   'stripe_connect_preview',
    },
  }
}

export function getPlatformSummary() {
  return {
    platform:         getNoveeOSIdentity(),
    readiness:        getPlatformReadiness(),
    verticalManifests: CRAFT_MODULES.map(m => resolveVerticalAuthority(m.moduleId)),
    summaryMode:      'platform_preview',
    message:          'NOVEE OS platform summary. No live claim is made without verified integration proof.',
  }
}
