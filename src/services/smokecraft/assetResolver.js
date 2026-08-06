/**
 * SmokeCraft production asset resolver (Production Closure, Part 3).
 *
 * Resolves an asset ID — never an arbitrary URL — to a real, safe image
 * source. Every SmokeCraft component that renders an approved image
 * should go through this, not a raw `craftImages`/`SC_ASSETS` lookup or
 * a hand-typed URL.
 *
 * Resolution order:
 *   1. Approved, synchronized R2 object — only when R2 delivery is
 *      configured (`VITE_SMOKECRAFT_R2_PUBLIC_BASE_URL` set) AND the
 *      registry marks this asset synchronized (checked via the
 *      build-time-embedded registry snapshot, __SMOKECRAFT_ASSET_REGISTRY__
 *      — see vite.config.js). No live registry file ships in the
 *      production bundle (public/proof/** is stripped), so this is the
 *      one supported way R2-vs-GitHub is decided at runtime.
 *   2. The exact matching GitHub-built asset — SC_ASSETS (SmokeCraft
 *      screens) or craftImages (cross-module fallbacks/portraits), both
 *      real, bundled, always-available sources.
 *   3. A branded missing-media state — never substitutes a different
 *      cigar/venue/logo/session image, never guesses.
 *
 * This module intentionally does NOT accept a raw URL parameter at all —
 * only a known asset ID — so "reject arbitrary external URLs" is
 * structural, not a runtime check that can be bypassed.
 */
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { craftImages } from '../../lib/craftImages.js'

// Registry snapshot embedded at build time (see vite.config.js `define`).
// Falls back to an empty object in any context where it wasn't injected
// (e.g. a unit test importing this module directly) — the resolver
// degrades to tier 2 (GitHub fallback) in that case, never throws.
const REGISTRY = (typeof __SMOKECRAFT_ASSET_REGISTRY__ !== 'undefined') ? __SMOKECRAFT_ASSET_REGISTRY__ : {}

const R2_PUBLIC_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SMOKECRAFT_R2_PUBLIC_BASE_URL) || ''

export const RESOLUTION_FAILURE = {
  ASSET_UNKNOWN: 'ASSET_UNKNOWN',
  ASSET_RETIRED: 'ASSET_RETIRED',
  ASSET_UNAPPROVED: 'ASSET_UNAPPROVED',
}

/**
 * @param {string} assetId — an SC_ASSETS key (e.g. 'landing') or a
 *   craftImages dotted path (e.g. 'portraits.member1').
 * @returns {{ ok: true, url: string, sourceType: 'r2'|'github-fallback', assetId: string, fallback: boolean }
 *          | { ok: false, code: string, assetId: string }}
 */
export function resolveSmokeCraftAsset(assetId) {
  if (!assetId || typeof assetId !== 'string') {
    return { ok: false, code: RESOLUTION_FAILURE.ASSET_UNKNOWN, assetId: String(assetId) }
  }

  const registryEntry = REGISTRY[assetId]
  if (registryEntry) {
    if (registryEntry.retired) return { ok: false, code: RESOLUTION_FAILURE.ASSET_RETIRED, assetId }
    if (!registryEntry.approved) return { ok: false, code: RESOLUTION_FAILURE.ASSET_UNAPPROVED, assetId }
    if (registryEntry.synchronizationStatus === 'synchronized' && registryEntry.r2ObjectKey && R2_PUBLIC_BASE_URL) {
      return {
        ok: true,
        url: `${R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${registryEntry.r2ObjectKey}`,
        sourceType: 'r2',
        assetId,
        version: registryEntry.version,
        checksum: registryEntry.checksum,
        cropMode: registryEntry.cropMode,
        focalPoint: registryEntry.focalPoint,
        altText: registryEntry.altText,
        fallback: false,
      }
    }
  }

  // Tier 2 — GitHub-built fallback. SC_ASSETS keys first (SmokeCraft's own
  // screens), then dotted craftImages paths (e.g. 'portraits.member1').
  let githubUrl = SC_ASSETS[assetId]
  if (!githubUrl && assetId.includes('.')) {
    const parts = assetId.split('.')
    let node = craftImages
    for (const p of parts) node = node?.[p]
    if (typeof node === 'string') githubUrl = node
  }

  if (typeof githubUrl === 'string' && githubUrl) {
    return { ok: true, url: githubUrl, sourceType: 'github-fallback', assetId, fallback: true }
  }

  return { ok: false, code: RESOLUTION_FAILURE.ASSET_UNKNOWN, assetId }
}

/** Convenience: resolved URL only, or null — for call sites that just need `src`. */
export function resolveSmokeCraftAssetUrl(assetId) {
  const r = resolveSmokeCraftAsset(assetId)
  return r.ok ? r.url : null
}
