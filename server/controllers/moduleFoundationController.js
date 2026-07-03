import { buildManifestSchemaReport } from '../services/modules/moduleManifestSchema.js'
import {
  buildModuleRegistryReport,
  getModuleById,
  getRegisteredModules,
  registerModuleManifest,
} from '../services/modules/moduleRegistryService.js'
import { buildDependencyReadinessReport } from '../services/modules/moduleDependencyService.js'
import {
  buildActivationReadinessReport,
  activateModulePreview,
  deactivateModulePreview,
} from '../services/modules/moduleActivationService.js'
import {
  buildLifecycleHookReadinessReport,
  runInstallHooksPreview,
  runUninstallHooksPreview,
} from '../services/modules/moduleLifecycleHookService.js'
import { buildVersionReadinessReport } from '../services/modules/moduleVersioningService.js'
import { buildModulePermissionReport } from '../services/modules/modulePermissionService.js'
import { buildModuleRouteRegistryReport } from '../services/modules/moduleRouteRegistryService.js'
import { buildModuleServiceRegistryReport } from '../services/modules/moduleServiceRegistryService.js'
import { buildModuleComponentRegistryReport } from '../services/modules/moduleComponentRegistryService.js'
import { buildModuleHookRegistryReport } from '../services/modules/moduleHookRegistryService.js'
import { buildModuleAuditReport, getModuleAuditEvents } from '../services/modules/moduleAuditService.js'
import { buildMarketplaceDraftReadinessReport, getModuleMarketplaceDrafts } from '../services/modules/moduleMarketplaceDraftService.js'
import { buildModuleLicenseReadinessReport } from '../services/modules/moduleLicenseReadinessService.js'
import { getInitialModuleManifests } from '../services/modules/initialModuleManifests.js'

const ts = () => new Date().toISOString()

function ok(res, data) {
  res.json({ ...data, timestamp: ts() })
}

function err(res, e, service) {
  res.status(500).json({ status: 'error', service, message: e.message, timestamp: ts() })
}

export function handleFoundationReadiness(req, res) {
  try {
    const schema = buildManifestSchemaReport()
    const registry = buildModuleRegistryReport()
    ok(res, {
      engine: 'NOMPF',
      engineName: 'NOVEE OS Module Packaging Foundation',
      platform: 'NOVEE OS platform_software — not a website',
      portal: 'noveeos.com is the public-facing portal layer',
      schema,
      registry,
      isPhase20: false,
      noPhase20: true,
      notYetPackaged: true,
      marketplaceNotLive: true,
      licenseNotEnforced: true,
      preview_only: true,
    })
  } catch (e) { err(res, e, 'foundation-readiness') }
}

export function handleGetRegistry(req, res) {
  try { ok(res, buildModuleRegistryReport()) } catch (e) { err(res, e, 'registry') }
}

export function handleGetModuleById(req, res) {
  try {
    const m = getModuleById(req.params.moduleId)
    if (!m) return res.status(404).json({ status: 'module_not_found', moduleId: req.params.moduleId, timestamp: ts() })
    ok(res, m)
  } catch (e) { err(res, e, 'module-by-id') }
}

export function handleRegisterModulePreview(req, res) {
  try { ok(res, registerModuleManifest(req.body ?? {})) } catch (e) { err(res, e, 'register-preview') }
}

export function handleGetDependencies(req, res) {
  try { ok(res, buildDependencyReadinessReport(req.params.moduleId)) } catch (e) { err(res, e, 'dependencies') }
}

export function handleGetActivation(req, res) {
  try { ok(res, buildActivationReadinessReport(req.params.moduleId)) } catch (e) { err(res, e, 'activation') }
}

export function handleActivatePreview(req, res) {
  try { ok(res, activateModulePreview(req.params.moduleId)) } catch (e) { err(res, e, 'activate-preview') }
}

export function handleDeactivatePreview(req, res) {
  try { ok(res, deactivateModulePreview(req.params.moduleId)) } catch (e) { err(res, e, 'deactivate-preview') }
}

export function handleGetLifecycle(req, res) {
  try { ok(res, buildLifecycleHookReadinessReport(req.params.moduleId)) } catch (e) { err(res, e, 'lifecycle') }
}

export function handleInstallPreview(req, res) {
  try { ok(res, runInstallHooksPreview(req.params.moduleId)) } catch (e) { err(res, e, 'install-preview') }
}

export function handleUninstallPreview(req, res) {
  try { ok(res, runUninstallHooksPreview(req.params.moduleId)) } catch (e) { err(res, e, 'uninstall-preview') }
}

export function handleGetVersioning(req, res) {
  try { ok(res, buildVersionReadinessReport(req.params.moduleId)) } catch (e) { err(res, e, 'versioning') }
}

export function handleGetPermissions(req, res) {
  try { ok(res, buildModulePermissionReport(req.params.moduleId)) } catch (e) { err(res, e, 'permissions') }
}

export function handleGetRoutes(req, res) {
  try { ok(res, buildModuleRouteRegistryReport(req.params.moduleId)) } catch (e) { err(res, e, 'routes') }
}

export function handleGetServices(req, res) {
  try { ok(res, buildModuleServiceRegistryReport(req.params.moduleId)) } catch (e) { err(res, e, 'services') }
}

export function handleGetComponents(req, res) {
  try { ok(res, buildModuleComponentRegistryReport(req.params.moduleId)) } catch (e) { err(res, e, 'components') }
}

export function handleGetHooks(req, res) {
  try { ok(res, buildModuleHookRegistryReport(req.params.moduleId)) } catch (e) { err(res, e, 'hooks') }
}

export function handleGetAudit(req, res) {
  try { ok(res, { ...buildModuleAuditReport(), events: getModuleAuditEvents().events }) } catch (e) { err(res, e, 'audit') }
}

export function handleGetMarketplaceDrafts(req, res) {
  try {
    ok(res, { ...buildMarketplaceDraftReadinessReport(), drafts: getModuleMarketplaceDrafts() })
  } catch (e) { err(res, e, 'marketplace-drafts') }
}

export function handleGetLicenseReadiness(req, res) {
  try { ok(res, buildModuleLicenseReadinessReport()) } catch (e) { err(res, e, 'license-readiness') }
}

export function handleGetInitialManifests(req, res) {
  try {
    const manifests = getInitialModuleManifests()
    ok(res, {
      total: manifests.length,
      manifests,
      status: 'not_yet_packaged',
      needs_module_manifest: true,
      preview_only: true,
    })
  } catch (e) { err(res, e, 'initial-manifests') }
}
