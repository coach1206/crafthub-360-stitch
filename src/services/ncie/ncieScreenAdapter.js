/**
 * NCIE Screen Adapter
 * Maps current route/screen to NCIE craft context.
 * Returns protected_screen_not_modified for sealed screens.
 * Does not modify any protected SmokeCraft visual files.
 */

import { SMOKECRAFT_NCIE_SCREEN_MAP } from '../../data/ncie/screenMaps/smokecraftNcieScreenMap.js'

const SCREEN_MAPS = {
  smokecraft: SMOKECRAFT_NCIE_SCREEN_MAP,
}

const PROTECTED_ROUTES = [
  '/smokecraft/asset',
  '/smokecraft/hotspot',
]

export function isProtectedRoute(pathname) {
  return PROTECTED_ROUTES.some(p => pathname.includes(p))
}

export function resolveScreenContext(pathname, craftType = null) {
  if (isProtectedRoute(pathname)) {
    return {
      ok:              true,
      pathname,
      craftType:       craftType ?? 'smokecraft',
      screenKey:       null,
      screenEntry:     null,
      protectedStatus: 'protected_screen_not_modified',
      integrationMode: 'adapter_only',
      message:         'This screen is protected. NCIE integration is adapter-only. No direct modification was made.',
    }
  }

  const resolved = resolveCraftFromPathname(pathname)
  const craft    = craftType ?? resolved.craftType
  const map      = SCREEN_MAPS[craft]

  if (!map) {
    return {
      ok:              true,
      pathname,
      craftType:       craft,
      screenKey:       null,
      screenEntry:     null,
      protectedStatus: null,
      integrationMode: 'future_wire_required',
      message:         `No NCIE screen map registered for craft: ${craft}`,
    }
  }

  const entry = map.find(m =>
    pathname.includes(m.routeKey) ||
    m.routeKey === resolved.routeKey
  ) ?? null

  return {
    ok:              true,
    pathname,
    craftType:       craft,
    screenKey:       entry?.routeKey ?? null,
    screenEntry:     entry ?? null,
    protectedStatus: entry ? null : null,
    integrationMode: entry?.protectedIntegrationMode ?? 'future_wire_required',
    lessonCategories:    entry?.lessonCategories ?? [],
    defaultMentors:      entry?.defaultMentors ?? [],
    decisionPrompts:     entry?.decisionPrompts ?? [],
    recommendationContexts: entry?.recommendationContexts ?? [],
    analyticsTags:       entry?.analyticsTags ?? [],
    commerceTags:        entry?.commerceTags ?? [],
    quizEnabled:         entry?.quizEnabled ?? false,
    passportEligible:    entry?.passportEligible ?? false,
    message:             entry
      ? `Screen mapped: ${entry.screenName}`
      : `No specific screen map entry for path: ${pathname}`,
  }
}

function resolveCraftFromPathname(pathname) {
  if (pathname.includes('/smokecraft')) return { craftType: 'smokecraft', routeKey: extractRouteKey(pathname, '/smokecraft') }
  if (pathname.includes('/pourcraft'))  return { craftType: 'pourcraft',  routeKey: extractRouteKey(pathname, '/pourcraft') }
  if (pathname.includes('/beercraft'))  return { craftType: 'beercraft',  routeKey: extractRouteKey(pathname, '/beercraft') }
  if (pathname.includes('/winecraft'))  return { craftType: 'winecraft',  routeKey: extractRouteKey(pathname, '/winecraft') }
  return { craftType: 'smokecraft', routeKey: 'home' }
}

function extractRouteKey(pathname, prefix) {
  return pathname.replace(prefix, '').replace(/^\//, '').split('/')[0] || 'home'
}

export function getAdapterForScreen(screenKey, craftType = 'smokecraft') {
  const map   = SCREEN_MAPS[craftType]
  if (!map) return null
  return map.find(m => m.routeKey === screenKey) ?? null
}

export function getCraftTypeFromRoute(pathname) {
  return resolveCraftFromPathname(pathname).craftType
}

export function getProtectedScreenStatus() {
  return {
    status:  'protected_screen_not_modified',
    message: 'Protected SmokeCraft visual files (SmokeCraftAssetScreen.jsx, SmokeCraftHotspotLayer.jsx, SmokeCraftAssetRoute.jsx) were not modified. NCIE integration uses adapter-only approach.',
    files: [
      'src/components/smokecraft/SmokeCraftAssetScreen.jsx',
      'src/components/smokecraft/SmokeCraftHotspotLayer.jsx',
      'src/components/smokecraft/SmokeCraftAssetRoute.jsx',
    ],
  }
}
