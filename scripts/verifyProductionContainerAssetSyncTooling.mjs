/**
 * Production-container asset-sync-tooling gate (R2 sync deployment fix).
 *
 * Real production incident this exists to prevent recurring: Railway ran
 * `npm run smokecraft:assets:sync-r2 -- --dry-run` against a deployed
 * container and got `Cannot find module '/app/scripts/smokecraftAssetsSyncR2.mjs'`
 * — the Dockerfile's runtime stage never copied scripts/ at all. This
 * check runs INSIDE the Docker build itself (Dockerfile: `RUN node
 * scripts/verifyProductionContainerAssetSyncTooling.mjs`, in the same
 * runtime stage the deployed image is built from) and fails the build —
 * not just a warning — if any file the sync command needs is missing
 * from that exact image, so a broken image can never reach Railway
 * silently again.
 */
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) console.log(`  OK    ${name}`)
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── Production container: asset-sync-tooling presence gate\n')

check('scripts/smokecraftAssetsSyncR2.mjs present', existsSync(resolve('scripts/smokecraftAssetsSyncR2.mjs')))
check('scripts/smokecraftAssetRegistry.mjs present', existsSync(resolve('scripts/smokecraftAssetRegistry.mjs')))
check(
  'server/services/venueManagement/objectStorageAdapter.js present (the sync command\'s real R2 adapter import)',
  existsSync(resolve('server/services/venueManagement/objectStorageAdapter.js'))
)
check('src/constants/smokecraftAssets.js present', existsSync(resolve('src/constants/smokecraftAssets.js')))

const registryPath = resolve('public/proof/smokecraft-asset-registry/registry.json')
check('public/proof/smokecraft-asset-registry/registry.json present', existsSync(registryPath))

let registry = []
if (existsSync(registryPath)) {
  try { registry = JSON.parse(readFileSync(registryPath, 'utf8')) } catch (e) {
    check('registry.json parses as valid JSON', false, e.message)
  }
}

const activeApproved = registry.filter(r => r.classification === 'ACTIVE_APPROVED')
check(`registry has ACTIVE_APPROVED entries (found ${activeApproved.length})`, activeApproved.length > 0)

let missingFiles = 0
for (const entry of activeApproved) {
  if (!existsSync(resolve(entry.repositoryPath))) missingFiles++
}
check(
  `every ACTIVE_APPROVED registry entry's source image is present in this image (${activeApproved.length - missingFiles}/${activeApproved.length})`,
  missingFiles === 0,
  missingFiles > 0 ? `${missingFiles} approved source image(s) missing from the runtime image — .dockerignore or a Dockerfile COPY is dropping them` : ''
)

// Confirm the sync command's own package.json script still resolves to
// the file that's actually present, not a stale/renamed path.
try {
  const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
  const scriptCmd = pkg.scripts?.['smokecraft:assets:sync-r2'] || ''
  const referencedPath = scriptCmd.match(/node\s+(\S+\.mjs)/)?.[1]
  check(
    `package.json's "smokecraft:assets:sync-r2" script resolves to a file present in this image`,
    !!referencedPath && existsSync(resolve(referencedPath)),
    `script command: "${scriptCmd}"`
  )
} catch (e) {
  check('package.json readable and parses', false, e.message)
}

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) {
  console.log('\nThis Docker image must NOT be deployed — the sync command would fail at runtime with a missing-module or missing-asset error.')
  process.exit(1)
}
