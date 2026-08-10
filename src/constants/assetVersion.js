// Canonical asset URL versioning helper — Production Build Identity pass.
//
// Every SmokeCraft approved image is copied byte-for-byte from public/ with
// no content hash of its own (unlike the JS/CSS bundle, which Vite already
// content-hashes). This means a browser or CDN that previously cached an
// image by its bare filename has no signal that a corrected file replaced
// it after a redeploy. Appending the current build's asset version as a
// query string forces a fresh fetch on every new build, without renaming
// any file on disk or touching approved filenames/case/punctuation.
import { BUILD_INFO } from '../generated/buildInfo.js'

export const ASSET_VERSION = BUILD_INFO.assetVersion

/** Append the current build's asset version to a static asset path. Idempotent — safe to call on an already-versioned path. */
export function versionedAssetUrl(path) {
  if (!path) return path
  if (path.includes('?v=')) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}v=${ASSET_VERSION}`
}
