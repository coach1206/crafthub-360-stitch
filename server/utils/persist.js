/**
 * Lightweight file-based JSON persistence.
 * Stores data in server/data/persisted/ so server restarts reload saved state.
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const PERSIST_DIR = path.resolve(__dirname, '../data/persisted')

// Ensure directory exists at import time
if (!fs.existsSync(PERSIST_DIR)) {
  fs.mkdirSync(PERSIST_DIR, { recursive: true })
}

/**
 * Load JSON from a persisted file.
 * Returns `defaultValue` if the file doesn't exist or is corrupt.
 */
export function loadJson(filename, defaultValue) {
  const filePath = path.join(PERSIST_DIR, filename)
  try {
    if (!fs.existsSync(filePath)) return defaultValue
    const raw = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

/**
 * Save data as JSON to a persisted file (synchronous, fire-and-forget safe).
 */
export function saveJson(filename, data) {
  const filePath = path.join(PERSIST_DIR, filename)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
  } catch (err) {
    console.error(`[persist] Failed to save ${filename}:`, err.message)
  }
}

/**
 * Serialize a Map<string, Set<string>> → plain object { key: string[] }
 */
export function serializeMapOfSets(map) {
  const obj = {}
  for (const [k, v] of map) {
    obj[k] = [...v]
  }
  return obj
}

/**
 * Deserialize { key: string[] } → Map<string, Set<string>>
 */
export function deserializeMapOfSets(obj) {
  const map = new Map()
  for (const [k, v] of Object.entries(obj || {})) {
    map.set(k, new Set(Array.isArray(v) ? v : []))
  }
  return map
}

/**
 * Serialize a Map<string, any[]> → plain object { key: any[] }
 */
export function serializeMapOfArrays(map) {
  const obj = {}
  for (const [k, v] of map) {
    obj[k] = v
  }
  return obj
}

/**
 * Deserialize { key: any[] } → Map<string, any[]>
 */
export function deserializeMapOfArrays(obj) {
  const map = new Map()
  for (const [k, v] of Object.entries(obj || {})) {
    map.set(k, Array.isArray(v) ? v : [])
  }
  return map
}
