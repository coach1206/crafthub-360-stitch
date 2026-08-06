#!/usr/bin/env node
/**
 * Production build lock (SC-D068 permanent fix).
 *
 * A plain `vite build` invocation in this repo's environment was found to
 * silently resolve to a non-production mode in some shells (verified: the
 * dev-only DevRoleSwitcher toolbar — guarded by `import.meta.env.DEV` —
 * shipped live in the resulting dist/, 5.4MB main chunk instead of the
 * correct 3.1MB). This script is now the ONLY supported way to build for
 * production (npm run build / npm run build:production both point here)
 * so the correct mode can never depend on someone remembering to type
 * `--mode production` by hand.
 *
 * It:
 *   1. Forces NODE_ENV=production and runs `vite build --mode production`
 *      programmatically (cross-platform — no shell-specific `VAR=val cmd`
 *      syntax, no cross-env dependency needed).
 *   2. Runs scripts/stripProductionExcludedAssets.mjs (unchanged behavior).
 *   3. Runs scripts/verifyProductionBundleIsClean.mjs — a hard, build-
 *      blocking gate that scans the built dist/ for dev-only markers and
 *      FAILS THE BUILD (non-zero exit) if any are found, so a bad build
 *      can never reach a deploy artifact silently again.
 */
import { spawnSync } from 'child_process'

function run(cmd, args, extraEnv = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`)
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    console.error(`\n✖ Step failed: ${cmd} ${args.join(' ')} (exit ${result.status})`)
    process.exit(result.status ?? 1)
  }
}

run('npx', ['vite', 'build', '--mode', 'production'], { NODE_ENV: 'production' })
run('node', ['scripts/stripProductionExcludedAssets.mjs'])
run('node', ['scripts/verifyProductionBundleIsClean.mjs'])

console.log('\n✅ Production build complete and verified clean (no dev-only bundle markers).')
