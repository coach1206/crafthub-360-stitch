/**
 * E.A.T. Media Library Service — CRUD over localStorage for media assets,
 * named source configs, and asset→target assignments. Local-first, no cloud.
 *
 * Keys:
 *  - eat:mediaAssets       assets [{ id, name, type, category, sourceType, status, previewUrl, createdAt, updatedAt }]
 *  - eat:mediaSources      named source configs [{ id, name, sourceType, createdAt }]
 *  - eat:mediaAssignments  [{ id, assetId, targetSystem, targetType, targetId, createdAt }]
 */

import { SEED_MEDIA_ASSETS } from '../../data/eat/seedMediaAssets.js'
import { opsGet, opsSet } from '../shared/opsStorage.js'

const K = {
  assets: 'eat:mediaAssets',
  sources: 'eat:mediaSources',
  assignments: 'eat:mediaAssignments',
}

function uid(p = 'med') { return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }

function ensureSeeded() {
  if (opsGet(K.assets, null) == null) {
    const now = Date.now()
    opsSet(K.assets, SEED_MEDIA_ASSETS.map((a) => ({ ...a, createdAt: now, updatedAt: now })))
  }
  if (opsGet(K.sources, null) == null) {
    opsSet(K.sources, [
      { id: 'src_seed', name: 'Bundled Seed Assets', sourceType: 'seed', createdAt: Date.now() },
      { id: 'src_upload', name: 'Session Uploads (local preview)', sourceType: 'upload', createdAt: Date.now() },
    ])
  }
  if (opsGet(K.assignments, null) == null) opsSet(K.assignments, [])
}

// Assets
export function getAssets() { ensureSeeded(); return opsGet(K.assets, []) }
export function getAsset(id) { return getAssets().find((a) => a.id === id) || null }

export function createAsset(data) {
  const assets = getAssets()
  const now = Date.now()
  const asset = {
    id: uid(),
    name: data.name || 'Untitled Asset',
    type: data.type || 'image',
    category: data.category || 'other',
    sourceType: data.sourceType || 'upload',
    status: data.status || 'active',
    previewUrl: data.previewUrl || '',
    createdAt: now,
    updatedAt: now,
  }
  assets.push(asset)
  opsSet(K.assets, assets)
  return asset
}

export function updateAsset(id, patch) {
  const assets = getAssets()
  const idx = assets.findIndex((a) => a.id === id)
  if (idx === -1) return null
  assets[idx] = { ...assets[idx], ...patch, updatedAt: Date.now() }
  opsSet(K.assets, assets)
  return assets[idx]
}

export function deleteAsset(id) {
  opsSet(K.assets, getAssets().filter((a) => a.id !== id))
}

// Sources
export function getSources() { ensureSeeded(); return opsGet(K.sources, []) }

// Assignments
export function getAssignments() { ensureSeeded(); return opsGet(K.assignments, []) }

export function createAssignment({ assetId, targetSystem, targetType, targetId }) {
  const assignments = getAssignments()
  const a = { id: uid('asn'), assetId, targetSystem, targetType, targetId, createdAt: Date.now() }
  assignments.push(a)
  opsSet(K.assignments, assignments)
  return a
}

export function deleteAssignment(id) {
  opsSet(K.assignments, getAssignments().filter((a) => a.id !== id))
}
