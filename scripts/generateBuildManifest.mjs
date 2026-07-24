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
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { BUILD_INFO } from '../src/generated/buildInfo.js'
import { SC_ASSETS } from '../src/constants/smokecraftAssets.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// buildInfo.js's Node-side fallback deliberately never shells out (it is
// also bundled for the browser) — this Node-only script supplements it with
// the same local `git rev-parse` last resort vite.config.js itself uses, so
// this manifest and the actual browser bundle can never disagree.
if (BUILD_INFO.commit === 'local') {
  try { BUILD_INFO.commit = execSync('git rev-parse HEAD').toString().trim() } catch { /* stay 'local' */ }
  BUILD_INFO.commitShort = BUILD_INFO.commit.slice(0, 7)
  if (BUILD_INFO.assetVersion === 'local') BUILD_INFO.assetVersion = BUILD_INFO.commitShort
}
if (BUILD_INFO.branch === 'local') {
  try { BUILD_INFO.branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() } catch { /* stay 'local' */ }
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
