// Canonical frontend build identity module — Production Build Identity pass.
//
// Values are injected at build time by vite.config.js's `define` block,
// which performs literal textual substitution of each `__BUILD_*__`
// identifier wherever it appears (including inside `typeof`). `typeof` on
// an identifier is safe even when nothing declares it, so this same file
// works two ways without any duplicated logic:
//   - Under Vite (browser bundle): identifiers are replaced with real
//     string/number literals before this file is even parsed as written.
//   - Under plain Node (e.g. scripts/validateSmokecraftAssets.mjs, a
//     prebuild step that imports this module before Vite ever runs): the
//     identifiers are genuinely undefined, so every `typeof` check below
//     resolves to 'undefined' and falls through to the env-var fallback —
//     the same RAILWAY_GIT_COMMIT_SHA priority vite.config.js itself uses.
const env = typeof process !== 'undefined' ? process.env || {} : {}

// Env-var-only fallback for the Node build-script path (this module is also
// bundled for the browser, so it deliberately never touches child_process —
// the local `git rev-parse` last resort lives only in the Node-only build
// scripts that call BUILD_INFO_FROM_ENV_ONLY, e.g.
// scripts/generateBuildManifest.mjs, which supplements this with git output
// itself when no env var is set, mirroring vite.config.js's own chain).
const commit        = typeof __BUILD_COMMIT__       !== 'undefined' ? __BUILD_COMMIT__       : (env.RAILWAY_GIT_COMMIT_SHA || env.VERCEL_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || 'local')
const commitShort    = typeof __BUILD_COMMIT_SHORT__ !== 'undefined' ? __BUILD_COMMIT_SHORT__ : String(commit).slice(0, 7)
const branch         = typeof __BUILD_BRANCH__       !== 'undefined' ? __BUILD_BRANCH__       : (env.RAILWAY_GIT_BRANCH || 'local')
const builtAt        = typeof __BUILD_TIME__         !== 'undefined' ? __BUILD_TIME__         : new Date().toISOString()
const environment    = typeof __BUILD_ENV__          !== 'undefined' ? __BUILD_ENV__          : (env.NODE_ENV || 'development')
const appVersion     = typeof __APP_VERSION__        !== 'undefined' ? __APP_VERSION__        : '0.0.0'
const assetVersion   = typeof __ASSET_VERSION__      !== 'undefined' ? __ASSET_VERSION__      : commitShort
const schemaVersion  = typeof __SCHEMA_VERSION__     !== 'undefined' ? __SCHEMA_VERSION__     : 4

export const BUILD_INFO = { commit, commitShort, branch, builtAt, environment, appVersion, assetVersion, schemaVersion }
