import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

// Production Build Identity pass — Railway sets RAILWAY_GIT_COMMIT_SHA, not
// the Vercel-specific variable this file previously only checked (a real,
// disclosed root cause found by the prior root-cause audit: the existing
// window.__SMOKECRAFT_BUILD__ mechanism silently fell back to a local `git
// rev-parse` on Railway because it only ever looked for a Vercel env var).
// Both are still checked, in priority order, for portability across hosts.
//
// This never shells out to git: production Docker build stages have no
// .git directory (excluded from the build context) and no git binary
// installed, so a `git rev-parse` fallback here would always fail loudly
// ("/bin/sh: git: not found") for no benefit. When no host/CI-provided
// commit env var is available, build identity safely falls back to
// 'local' — a disclosed degradation, logged as a warning, never a reason
// to fail the build outright.
const commitSha = process.env.RAILWAY_GIT_COMMIT_SHA
  || process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GIT_COMMIT_SHA
  || null

const commitBranch = process.env.RAILWAY_GIT_BRANCH
  || process.env.VERCEL_GIT_COMMIT_REF
  || 'local'

const buildTime = process.env.RAILWAY_DEPLOYMENT_CREATED_AT || new Date().toISOString()
const nodeEnv = process.env.NODE_ENV || 'development'

if (nodeEnv === 'production' && !commitSha) {
  console.warn(
    '[build] no build identity commit SHA found (RAILWAY_GIT_COMMIT_SHA / ' +
    'VERCEL_GIT_COMMIT_SHA / GIT_COMMIT_SHA unset) — proceeding with "local". ' +
    'Set one of those env vars in the deploy platform to embed a real commit.'
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
  // Holistic Fix 4: `vite preview` does NOT inherit `server.proxy` (it's a
  // separate config key) — needed so browser-test scripts that run
  // `vite preview` against a separately-running backend (rather than the
  // unified `npm start` topology where server/index.js serves both dist
  // and the API on one port) can still reach the new
  // /api/smokecraft/player-state/* endpoints. Real production always uses
  // the unified single-port topology (npm start); this only affects the
  // preview-mode test harness.
  preview: {
    host:  '0.0.0.0',
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
