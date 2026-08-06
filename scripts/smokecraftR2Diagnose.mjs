#!/usr/bin/env node
/**
 * npm run smokecraft:r2:diagnose
 *
 * Runs ONLY the safe R2 preflight (config check + tiny diagnostic
 * object write/HEAD/read/delete/confirm-delete) and prints a redacted
 * report — no bulk operation, no credential values, no signed requests.
 * Use this before any bulk sync (`smokecraft:assets:sync-r2 --
 * --upload-missing`), which now runs this same preflight automatically
 * and aborts on failure — this command exists so the preflight can be
 * run and read on its own, without also attempting 81 uploads.
 */
import 'dotenv/config'
import { getSafeConfigReport, runR2Preflight } from '../server/services/venueManagement/r2Diagnostics.js'

console.log('── SmokeCraft R2 diagnose ──\n')

const config = getSafeConfigReport()
console.log('Safe configuration report (no credential values):')
console.log(JSON.stringify(config, null, 2))

console.log('\nRunning preflight (write -> HEAD -> read -> delete -> confirm-delete of one tiny diagnostic object)...\n')
const result = await runR2Preflight()

if (result.ok) {
  console.log('✅ Preflight PASSED — R2 is reachable, authenticated, and read/write/delete-capable at this configuration.')
  process.exit(0)
} else {
  console.log(`✖ Preflight FAILED at stage "${result.stage}"${result.operation ? ` (operation: ${result.operation})` : ''}`)
  console.log(`  Code: ${result.code}`)
  if (result.requestArgs) console.log(`  Request args (safe): ${JSON.stringify(result.requestArgs, null, 2)}`)
  console.log(`  Detail: ${JSON.stringify(result.detail, null, 2)}`)
  process.exit(1)
}
