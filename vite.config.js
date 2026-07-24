import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

// Production Build Identity pass — Railway sets RAILWAY_GIT_COMMIT_SHA, not
// the Vercel-specific variable this file previously only checked (a real,
// disclosed root cause found by the prior root-cause audit: the existing
// window.__SMOKECRAFT_BUILD__ mechanism silently fell back to a local `git
// rev-parse` on Railway because it only ever looked for a Vercel env var).
// Both are still checked, in priority order, for portability across hosts.
const commitSha = process.env.RAILWAY_GIT_COMMIT_SHA
  || process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GIT_COMMIT_SHA
  || (() => { try { return execSync('git rev-parse HEAD').toString().trim() } catch { return null } })()

const commitBranch = process.env.RAILWAY_GIT_BRANCH
  || process.env.VERCEL_GIT_COMMIT_REF
  || (() => { try { return execSync('git rev-parse --abbrev-ref HEAD').toString().trim() } catch { return 'local' } })()

const buildTime = process.env.RAILWAY_DEPLOYMENT_CREATED_AT || new Date().toISOString()
const nodeEnv = process.env.NODE_ENV || 'development'

// A production build must be traceable to a real commit — a build with no
// identity at all is exactly the failure mode this pass exists to close.
// Local/dev builds are not held to this (commitSha falls back to a real
// local git hash in practice; only a genuinely git-less environment in
// production mode is refused).
if (nodeEnv === 'production' && !commitSha) {
  throw new Error(
    'Production build refused: no build identity could be determined. ' +
    'Set RAILWAY_GIT_COMMIT_SHA (or VERCEL_GIT_COMMIT_SHA / GIT_COMMIT_SHA), ' +
    'or ensure a real .git directory is available to `git rev-parse HEAD`.'
  )
}

const resolvedCommit = commitSha || 'local'
const shortCommit = resolvedCommit.slice(0, 7)

let appVersion = '0.0.0'
try { appVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url))).version || appVersion } catch { /* keep default */ }

// Asset version — a single value shared by every SmokeCraft image URL this
// build serves (see src/constants/assetVersion.js), so a browser/CDN that
// previously cached an image by filename is forced to re-fetch it after any
// deploy, even though the underlying files are copied byte-for-byte from
// public/ with no content hash of their own.
const assetVersion = shortCommit

export default defineConfig({
  define: {
    __BUILD_COMMIT__:       JSON.stringify(resolvedCommit),
    __BUILD_COMMIT_SHORT__: JSON.stringify(shortCommit),
    __BUILD_BRANCH__:       JSON.stringify(commitBranch),
    __BUILD_TIME__:         JSON.stringify(buildTime),
    __BUILD_ENV__:          JSON.stringify(nodeEnv),
    __APP_VERSION__:        JSON.stringify(appVersion),
    __ASSET_VERSION__:      JSON.stringify(assetVersion),
    __SCHEMA_VERSION__:     JSON.stringify(4), // matches GuestSessionContext __version
  },
  plugins: [react()],
  server: {
    host:         '0.0.0.0',
    port:         5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
    ],
  },
})
