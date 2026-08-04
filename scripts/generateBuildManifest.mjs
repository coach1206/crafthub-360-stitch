#!/usr/bin/env node
// Generates public/build-manifest.json — Production Build Identity pass.
// Run as a prebuild step so every deploy publishes a non-sensitive artifact
// proving exactly which commit, branch, and asset set it is serving. Vite
// copies public/ verbatim into dist/, so this file ships with the app and
// is reachable at /build-manifest.json in production with zero server
// routing changes needed.
import fs from 'fs'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { BUILD_INFO } from '../src/generated/buildInfo.js'
import { SC_ASSETS } from '../src/constants/smokecraftAssets.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// buildInfo.js's Node-side fallback is env-var-only and never shells out to
// git — production Docker build stages have no .git directory (excluded
// from the build context via .dockerignore) and no git binary installed,
// so a git fallback here would always fail loudly for no benefit. When
// BUILD_INFO already resolved to 'local' (no RAILWAY_GIT_COMMIT_SHA /
// VERCEL_GIT_COMMIT_SHA / GIT_COMMIT_SHA present), this manifest honestly
// reflects that same 'local' identity rather than fabricating one.
if (BUILD_INFO.commit === 'local' && BUILD_INFO.assetVersion === 'local') {
  BUILD_INFO.assetVersion = BUILD_INFO.commitShort
}

const CRITICAL_KEYS = [
  'landing', 'enroll', 'identity', 'venueSelect', 'mentorSelection',
  'humidorMatch', 'meetYourCigar', 'terroir', 'format', 'cutToastLight',
  'lightingTutorial', 'firstThird', 'flavorMemory', 'pairingLab',
  'secondThird', 'mentorCommentary', 'knowledgeDrop', 'finalThird',
  'scorecard', 'aiSummary', 'pairingRecommendations', 'passportStamp',
  'finalReview', 'rewards', 'achievements', 'recommendedNextJourney',
  'goldenBox',
]

function hashFile(fsPath) {
  try {
    const buf = fs.readFileSync(fsPath)
    return crypto.createHash('sha256').update(buf).digest('hex')
  } catch {
    return null
  }
}

const criticalRouteAssets = CRITICAL_KEYS.map((key) => {
  const value = SC_ASSETS[key]
  if (!value) return { key, assetStatus: 'missing-approved-asset' }
  const decoded = decodeURIComponent(value.split('?')[0])
  const fsPath = path.join(root, 'public', decoded)
  const exists = fs.existsSync(fsPath)
  return {
    key,
    path: value,
    assetStatus: exists ? 'ok' : 'missing-on-disk',
    contentHash: exists ? hashFile(fsPath) : null,
  }
})

// Welcome (Session 1) is disclosed here, not fabricated — confirmed by the
// prior root-cause audit to have no approved asset anywhere in the repo.
criticalRouteAssets.push({ key: 'welcome', assetStatus: 'missing-approved-asset' })

const manifest = {
  commit:              BUILD_INFO.commit,
  commitShort:         BUILD_INFO.commitShort,
  branch:              BUILD_INFO.branch,
  buildTimestamp:      BUILD_INFO.builtAt,
  environment:         BUILD_INFO.environment,
  applicationVersion:  BUILD_INFO.appVersion,
  assetVersion:        BUILD_INFO.assetVersion,
  schemaVersion:       BUILD_INFO.schemaVersion,
  totalSessions:       27,
  totalPhases:         6,
  criticalRouteAssets,
}

fs.writeFileSync(path.join(root, 'public', 'build-manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`build-manifest.json generated — commit ${BUILD_INFO.commitShort}, ${criticalRouteAssets.filter(a => a.assetStatus === 'ok').length}/${criticalRouteAssets.length} critical assets ok.`)
