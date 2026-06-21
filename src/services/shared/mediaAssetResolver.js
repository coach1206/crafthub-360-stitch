/**
 * Media Asset Resolver — given a target (system/type/id), return the most
 * recent assignment's asset previewUrl, else a sensible fallback path.
 */

import { getAssignments, getAsset } from '../eat/eatMediaLibraryService.js'

const FALLBACK = '/assets/smokecraft/cigars/toro.jpg'

export function resolveAssetUrl({ targetSystem, targetType, targetId }, fallback = FALLBACK) {
  try {
    const matches = getAssignments()
      .filter((a) =>
        (!targetSystem || a.targetSystem === targetSystem) &&
        (!targetType || a.targetType === targetType) &&
        (!targetId || a.targetId === targetId))
      .sort((a, b) => b.createdAt - a.createdAt)
    for (const m of matches) {
      const asset = getAsset(m.assetId)
      if (asset?.previewUrl) return asset.previewUrl
    }
  } catch {}
  return fallback
}
