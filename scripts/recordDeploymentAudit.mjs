#!/usr/bin/env node
/**
 * Production Package 4 — deployment audit record.
 * Appends one JSON line per deployment/rollback action to
 * public/proof/smokecraft-production-infrastructure-deployment/deployment-audit-log.jsonl
 * so every release has a traceable record (target, sha, actor, timestamp, action).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUDIT_PATH = path.resolve(__dirname, '../public/proof/smokecraft-production-infrastructure-deployment/deployment-audit-log.jsonl')

const [target, sha, flag] = process.argv.slice(2)
if (!target || !sha) {
  console.error('Usage: recordDeploymentAudit.mjs <staging|production> <sha> [--rollback]')
  process.exit(1)
}

let actor = 'unknown'
try { actor = execSync('git config user.email').toString().trim() || 'unknown' } catch { /* noop */ }

const entry = {
  timestamp: new Date().toISOString(),
  action: flag === '--rollback' ? 'rollback' : 'deploy',
  target,
  sha,
  actor,
}

fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true })
fs.appendFileSync(AUDIT_PATH, JSON.stringify(entry) + '\n')
console.log('Audit record written:', JSON.stringify(entry))
