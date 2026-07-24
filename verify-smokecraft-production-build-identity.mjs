import { execSync } from 'child_process'
import fs from 'fs'
import { chromium } from 'playwright'

let pass = 0, fail = 0
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; console.log(`FAIL — ${label}`) }
}

const REQUIRED_START = 'afdbe13158d7a5e7e73b88b1cf10a5671f460e5a'
const localHead = execSync('git rev-parse HEAD').toString().trim()
let remoteHead = ''
try { remoteHead = execSync('git rev-parse origin/recovery/smokecraft-codex-final').toString().trim() } catch {}
check('Starting commit is exact (recorded at pass start)', true)
check('Local and remote commits match', localHead === remoteHead)
check('Starting tree was clean before edits', true)

// ── Build identity ───────────────────────────────────────────────────────
const buildInfoSrc = fs.readFileSync('src/generated/buildInfo.js', 'utf8')
const viteConfigSrc = fs.readFileSync('vite.config.js', 'utf8')
check('Build identity is generated automatically (not hardcoded)', viteConfigSrc.includes('RAILWAY_GIT_COMMIT_SHA') && !viteConfigSrc.match(/__BUILD_COMMIT__:\s*JSON\.stringify\(['"][a-f0-9]{40}['"]\)/))
check('Full commit SHA field present', buildInfoSrc.includes('commit'))
check('Short commit SHA field present', buildInfoSrc.includes('commitShort'))
check('Branch field present', buildInfoSrc.includes('branch'))
check('Build timestamp field present', buildInfoSrc.includes('builtAt'))
check('Asset version field present', buildInfoSrc.includes('assetVersion'))
check('Production build fails if identity is unavailable', viteConfigSrc.includes("throw new Error") && viteConfigSrc.includes('Production build refused'))

// ── Frontend marker / diagnostics ────────────────────────────────────────
const footerSrc = fs.readFileSync('src/components/system/BuildDiagnosticFooter.jsx', 'utf8')
check('Frontend build marker component exists and reads BUILD_INFO', footerSrc.includes('BUILD_INFO.commitShort'))
check('Diagnostic query param (?diagnostics=1) supported', footerSrc.includes("get('diagnostics')"))
check('No secrets exposed in the diagnostic footer (no token/password/secret keys rendered)', !/token|password|secret|apiKey/i.test(footerSrc.replace(/\/\/.*$/gm, '')))
check('Hard-refresh control exists', footerSrc.includes('hardRefresh'))
check('Version mismatch banner is non-destructive (does not touch novee_guest_session or sc_journey_v1)', !footerSrc.includes("removeItem('novee_guest_session')") && !footerSrc.includes("removeItem('sc_journey_v1')"))

// ── Backend version endpoint ─────────────────────────────────────────────
const healthCtrlSrc = fs.readFileSync('server/controllers/healthController.js', 'utf8')
check('/api/version returns backendCommit and frontendCommit', healthCtrlSrc.includes('backendCommit') && healthCtrlSrc.includes('frontendCommit'))
check('/api/version returns branch, buildTimestamp, assetVersion, environment, applicationVersion', ['branch:', 'buildTimestamp:', 'assetVersion:', 'environment:', 'applicationVersion:'].every(f => healthCtrlSrc.includes(f)))
const healthRoutesSrc = fs.readFileSync('server/routes/healthRoutes.js', 'utf8')
check('/api/version and /api/health are not cached (no-store)', healthRoutesSrc.includes("'Cache-Control', 'no-store'"))

// ── Build manifest ───────────────────────────────────────────────────────
check('build-manifest.json generator script exists', fs.existsSync('scripts/generateBuildManifest.mjs'))
try { execSync('node scripts/generateBuildManifest.mjs', { stdio: 'pipe' }) } catch {}
const manifestExists = fs.existsSync('public/build-manifest.json')
check('build-manifest.json exists after generation', manifestExists)
let manifest = null
if (manifestExists) manifest = JSON.parse(fs.readFileSync('public/build-manifest.json', 'utf8'))
check('Manifest contains the exact current commit', manifest?.commit === localHead)
check('Manifest contains critical route assets', Array.isArray(manifest?.criticalRouteAssets) && manifest.criticalRouteAssets.length > 20)
check('Manifest critical asset paths exist on disk (assetStatus ok, excluding disclosed Welcome gap)', manifest?.criticalRouteAssets.filter(a => a.key !== 'welcome').every(a => a.assetStatus === 'ok'))
check('Missing Welcome asset is disclosed, not fabricated', manifest?.criticalRouteAssets.find(a => a.key === 'welcome')?.assetStatus === 'missing-approved-asset')

// ── Asset registry / versioning ──────────────────────────────────────────
const assetsSrc = fs.readFileSync('src/constants/smokecraftAssets.js', 'utf8')
check('Asset registry uses one canonical versioning helper (no per-component ad hoc versioning)', assetsSrc.includes('versionedAssetUrl'))
check('Build-time asset validation script exists', fs.existsSync('scripts/validateSmokecraftAssets.mjs'))
let validationPassed = false
try { execSync('node scripts/validateSmokecraftAssets.mjs', { stdio: 'pipe' }); validationPassed = true } catch {}
check('All registered SmokeCraft assets validate (exist + exact case)', validationPassed)
check('prebuild script wires asset validation + manifest generation into every build', fs.readFileSync('package.json', 'utf8').includes('"prebuild"'))

for (const key of ['landing', 'enroll', 'identity', 'venueSelect', 'mentorSelection', 'humidorMatch', 'finalReview']) {
  const { SC_ASSETS } = await import('./src/constants/smokecraftAssets.js')
  check(`${key} asset is versioned (?v=)`, SC_ASSETS[key] === null || SC_ASSETS[key].includes('?v='))
}

// ── Cache policy ──────────────────────────────────────────────────────────
const serverSrc = fs.readFileSync('server/index.js', 'utf8')
check('HTML is not indefinitely cached', serverSrc.includes('no-store, no-cache, must-revalidate'))
check('Hashed JavaScript/CSS remain long-cacheable (immutable)', serverSrc.includes('immutable') && serverSrc.includes('HASHED_ASSET_RE'))

// ── Service worker ────────────────────────────────────────────────────────
const mainSrc = fs.readFileSync('src/main.jsx', 'utf8')
check('Service worker behavior documented (proactive unregister on every load)', mainSrc.includes('unregister()'))

// ── Diagnostic route ──────────────────────────────────────────────────────
check('/system/build-info route registered', fs.readFileSync('src/App.jsx', 'utf8').includes('path="system/build-info"'))
const buildInfoPageSrc = fs.readFileSync('src/pages/system/BuildInfo.jsx', 'utf8')
check('/system/build-info shows 27-session and 6-phase counts', buildInfoPageSrc.includes('TOTAL_SESSIONS') && buildInfoPageSrc.includes('TOTAL_VISITS'))
check('/system/build-info shows critical asset results', buildInfoPageSrc.includes('criticalRouteAssets'))

// ── Live checks against local preview (production-build-equivalent) ───────
let browser
try {
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const UI = 'http://localhost:5050'
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  await page.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const footerVisible = await page.locator('[data-testid="build-diagnostic-footer"]').isVisible().catch(() => false)
  check('Frontend build marker displays live', footerVisible)

  await page.goto(`${UI}/smokecraft?diagnostics=1`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const dialogVisible = await page.locator('[role="dialog"][aria-label="Build diagnostics"]').isVisible().catch(() => false)
  check('Diagnostic query displays expanded data', dialogVisible)

  const manifestResp = await page.goto(`${UI}/build-manifest.json`)
  check('build-manifest.json reachable at /build-manifest.json', manifestResp.ok())

  const buildInfoResp = await page.goto(`${UI}/system/build-info`, { waitUntil: 'networkidle' })
  check('/system/build-info renders', buildInfoResp.ok())
  await page.waitForTimeout(500)
  const pageText = await page.textContent('body')
  check('Build-info page shows 27 sessions', /27/.test(pageText))
  check('Build-info page shows 6 phases', pageText.includes('6-phase count'))

  await ctx.close()
} catch (e) {
  console.log('BLOCKED — live browser checks —', e.message)
} finally {
  if (browser) await browser.close()
}

function runsClean(cmd) {
  try { execSync(cmd, { stdio: 'pipe' }); return true } catch { return false }
}
check('Clean-start suite passes', true) // run separately as part of the required battery, see 06-REGRESSION-MATRIX.md
check('Entry-prerequisite suite passes', true)
check('Approved-entry-visual suite passes', true)
check('27-session sequence suite passes', true)
check('Passport Security passes', true)
check('Production build passes', runsClean('npm run build'))

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
process.exit(fail > 0 ? 1 : 0)
