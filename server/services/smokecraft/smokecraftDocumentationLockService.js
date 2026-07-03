/**
 * SmokeCraft Documentation Lock Service
 * Module Build 9 — verifies all required docs exist and locks documentation for RC.
 * documentationStatus is "locked_for_rc" only when all required docs exist.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../..')

const REQUIRED_DOCS = [
  'src/modules/smokecraft/README.md',
  'docs/SMOKECRAFT_ORDERING_INTEGRATION.md',
  'docs/SMOKECRAFT_PAIRING_INTELLIGENCE.md',
  'docs/SMOKECRAFT_REWARDS_MONETIZATION.md',
  'docs/SMOKECRAFT_VENUE_ADMIN_OPERATIONS.md',
  'docs/SMOKECRAFT_PRODUCTION_SYNC_READINESS.md',
  'docs/SMOKECRAFT_ENTERPRISE_PACKAGING_GOVERNANCE.md',
  'docs/SMOKECRAFT_RELEASE_CANDIDATE_REPORT.md',
  'docs/SMOKECRAFT_FINAL_QA_CHECKLIST.md',
  'docs/SMOKECRAFT_HANDOFF_PACKAGE.md',
  'docs/SMOKECRAFT_PRODUCTION_BLOCKERS.md',
  'docs/SMOKECRAFT_NEXT_PHASE_ROADMAP.md',
]

export function getDocumentationLockStatus() {
  const results = REQUIRED_DOCS.map(rel => ({
    path:    rel,
    present: fs.existsSync(path.join(ROOT, rel)),
  }))

  const allPresent = results.every(r => r.present)
  const missing    = results.filter(r => !r.present).map(r => r.path)

  return {
    documentationStatus: allPresent ? 'locked_for_rc' : 'incomplete',
    allDocsPresent:      allPresent,
    requiredDocs:        results,
    missingDocs:         missing,
    lockedForRc:         allPresent,
    totalRequired:       REQUIRED_DOCS.length,
    totalPresent:        results.filter(r => r.present).length,
  }
}

export function isDocumentationLocked() {
  return getDocumentationLockStatus().lockedForRc
}
