/**
 * SmokeCraft Humidor Environment Routes
 * Mounted at /api/smokecraft/humidor
 *
 * No live IoT integration exists. All modes are clearly labeled.
 * mode=not_configured  — no device has been paired (default)
 * mode=demo            — venue demo data, clearly labeled synthetic
 * mode=manual          — staff-entered readings, labeled with entry time
 * mode=offline         — device was paired but last sync is stale (>30 min)
 */
import { Router } from 'express'

const router = Router()

// In-memory store for manual readings and config
const state = {
  mode: 'not_configured',   // not_configured | demo | manual | offline | live
  deviceName: null,
  deviceId: null,
  provider: null,
  environment: null,        // 'main_floor' | 'walk_in' | 'vip_lounge' | 'custom'
  manualReading: null,      // { temp, humidity, enteredAt, enteredBy }
  lastSyncAt: null,
  chart24h: [],
}

function makeDemoChart() {
  const now = Date.now()
  return Array.from({ length: 24 }, (_, i) => ({
    hour: new Date(now - (23 - i) * 3600000).toISOString(),
    temp: +(68 + Math.sin(i / 4) * 1.5 + (Math.random() - 0.5) * 0.4).toFixed(1),
    humidity: +(70 + Math.cos(i / 5) * 2 + (Math.random() - 0.5) * 0.8).toFixed(1),
  }))
}

function buildResponse() {
  const now = Date.now()
  const lastSync = state.lastSyncAt ? new Date(state.lastSyncAt).getTime() : null
  const isStale = lastSync && (now - lastSync) > 30 * 60 * 1000

  const base = {
    mode: state.mode,
    deviceName: state.deviceName,
    deviceId: state.deviceId,
    provider: state.provider,
    environment: state.environment,
    lastSyncAt: state.lastSyncAt,
    isStale: isStale || false,
    connectionStatus:
      state.mode === 'live'          ? 'live'
      : state.mode === 'offline'     ? 'offline'
      : state.mode === 'demo'        ? 'demo'
      : state.mode === 'manual'      ? 'manual_entry'
      : 'not_configured',
    currentTemp: null,
    currentHumidity: null,
    targetTemp: null,
    targetHumidity: null,
    dataSource: null,
    staleWarning: isStale ? 'Reading is older than 30 minutes — refresh or enter manual reading' : null,
    chart24h: [],
  }

  if (state.mode === 'demo') {
    return {
      ...base,
      deviceName: 'Novee Demo Sensor',
      deviceId: 'DEMO-HMD-001',
      provider: 'NoveeOS Demo',
      environment: state.environment || 'main_floor',
      lastSyncAt: new Date().toISOString(),
      isStale: false,
      currentTemp: 68.5,
      currentHumidity: 70.2,
      targetTemp: 68,
      targetHumidity: 70,
      dataSource: 'DEMO — Not live data. Values are synthetic and for demonstration only.',
      chart24h: makeDemoChart(),
    }
  }

  if (state.mode === 'manual' && state.manualReading) {
    return {
      ...base,
      currentTemp: state.manualReading.temp,
      currentHumidity: state.manualReading.humidity,
      targetTemp: 68,
      targetHumidity: 70,
      dataSource: `MANUAL ENTRY — Entered by staff at ${new Date(state.manualReading.enteredAt).toLocaleTimeString()}`,
      lastSyncAt: state.manualReading.enteredAt,
      isStale: (now - new Date(state.manualReading.enteredAt).getTime()) > 30 * 60 * 1000,
      chart24h: [],
    }
  }

  return base
}

// GET /api/smokecraft/humidor/environment
router.get('/environment', (_req, res) => {
  res.json({ ok: true, ...buildResponse() })
})

// POST /api/smokecraft/humidor/environment/manual — staff manual reading
router.post('/environment/manual', (req, res) => {
  const { temp, humidity, enteredBy = 'staff' } = req.body || {}

  if (temp == null || humidity == null) {
    return res.status(400).json({ ok: false, error: 'temp and humidity are required' })
  }
  const t = parseFloat(temp)
  const h = parseFloat(humidity)
  if (isNaN(t) || t < 55 || t > 85) {
    return res.status(400).json({ ok: false, error: 'temp must be between 55°F and 85°F' })
  }
  if (isNaN(h) || h < 50 || h > 90) {
    return res.status(400).json({ ok: false, error: 'humidity must be between 50% and 90%' })
  }

  state.mode = 'manual'
  state.manualReading = { temp: t, humidity: h, enteredAt: new Date().toISOString(), enteredBy }
  state.lastSyncAt = state.manualReading.enteredAt

  res.json({ ok: true, ...buildResponse() })
})

// POST /api/smokecraft/humidor/environment/mode — switch mode
router.post('/environment/mode', (req, res) => {
  const { mode, deviceName, deviceId, provider, environment } = req.body || {}
  const allowed = ['not_configured', 'demo', 'manual', 'offline', 'live']
  if (!allowed.includes(mode)) {
    return res.status(400).json({ ok: false, error: `mode must be one of: ${allowed.join(', ')}` })
  }
  state.mode = mode
  if (deviceName) state.deviceName = deviceName
  if (deviceId) state.deviceId = deviceId
  if (provider) state.provider = provider
  if (environment) state.environment = environment
  if (mode !== 'manual') state.manualReading = null
  res.json({ ok: true, ...buildResponse() })
})

// POST /api/smokecraft/humidor/environment/selection — guest's environment selection preference
router.post('/environment/selection', (req, res) => {
  const { environment } = req.body || {}
  const ENVS = ['main_floor', 'walk_in', 'vip_lounge', 'private_room', 'custom']
  if (!ENVS.includes(environment)) {
    return res.status(400).json({ ok: false, error: `environment must be one of: ${ENVS.join(', ')}` })
  }
  state.environment = environment
  res.json({ ok: true, environment: state.environment })
})

export default router
