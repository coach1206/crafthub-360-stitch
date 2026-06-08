import {
  getDeviceConfig,
  listDevices,
  registerDevice,
  updateDevice,
  recordHeartbeat,
} from '../services/deviceService.js'

/** GET /api/device/config?deviceId=xxx */
export async function getConfig(req, res) {
  const deviceId = req.query.deviceId || req.headers['x-device-id'] || null
  try {
    const config = await getDeviceConfig(deviceId)
    return res.json({ success: true, data: config || null })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** GET /api/device/list — manager+ */
export async function list(req, res) {
  const { venueId } = req.query
  try {
    const devices = await listDevices(venueId || null)
    return res.json({ success: true, data: devices })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** POST /api/device/register — manager+ */
export async function register(req, res) {
  const { deviceId, venueId, deviceName, deviceType, kioskMode,
          assignedModule, allowedRoutes, appVersion } = req.body || {}
  if (!deviceId) return res.status(400).json({ success: false, message: 'deviceId is required' })
  try {
    const device = await registerDevice({
      deviceId, venueId, deviceName, deviceType, kioskMode,
      assignedModule, allowedRoutes, appVersion,
    })
    return res.json({ success: true, data: device })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** PUT /api/device/:deviceId — manager+ */
export async function update(req, res) {
  const { deviceId } = req.params
  if (!deviceId) return res.status(400).json({ success: false, message: 'deviceId required' })
  try {
    const device = await updateDevice(deviceId, req.body || {})
    return res.json({ success: true, data: device })
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 500
    return res.status(status).json({ success: false, message: err.message })
  }
}

/** POST /api/device/:deviceId/heartbeat — public */
export async function heartbeat(req, res) {
  const { deviceId } = req.params
  const { routePath, ...rest } = req.body || {}
  try {
    const result = await recordHeartbeat(deviceId, routePath || null, rest)
    return res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
