/**
 * NOVEE OS — 360 Platform Registry Controller
 * contains_secrets: false
 */

import * as svc from '../services/noveeOS/noveeOS360PlatformRegistryService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

export const getRegistry            = (req, res) => ok500(res, async () => res.json(await svc.get360PlatformRegistry(tenantId(req), req.query.org_id, req.query.workspace_id)))
export const getPlatformByKey       = (req, res) => ok500(res, async () => res.json(await svc.get360PlatformByKey(tenantId(req), req.params.platformKey)))
export const getPlatformReadiness   = (req, res) => ok500(res, async () => res.json(await svc.get360PlatformReadiness(tenantId(req), req.params.platformKey)))
export const registerPreview        = (req, res) => ok500(res, async () => res.json(await svc.register360PlatformPreview(tenantId(req), req.body)))
export const updatePreview          = (req, res) => ok500(res, async () => res.json(await svc.update360PlatformPreview(tenantId(req), req.params.platformKey, req.body)))
export const getReserved            = (req, res) => ok500(res, async () => res.json(await svc.getReserved360Platforms(tenantId(req))))
export const getActive              = (req, res) => ok500(res, async () => res.json(await svc.getActive360Platforms(tenantId(req))))
export const getProductionReady     = (req, res) => ok500(res, async () => res.json(await svc.getProductionReady360Platforms(tenantId(req))))
export const getPlatformBlockers    = (req, res) => ok500(res, async () => res.json(await svc.get360PlatformBlockers(tenantId(req), req.params.platformKey)))
export const getEcosystemSnapshot   = (req, res) => ok500(res, async () => res.json(await svc.build360EcosystemSnapshot(tenantId(req))))
