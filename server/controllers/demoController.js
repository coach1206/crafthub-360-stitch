/**
 * Demo Controller — Phase 13
 */

import * as svc          from '../services/demoSessionService.js'
import { resetDemoData } from '../services/demoResetService.js'

export async function getStatus(req, res) {
  try {
    const active = await svc.getActiveDemo()
    return res.json({ success: true, data: { demoActive: !!active, activeDemo: active || null } })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function startDemo(req, res) {
  try {
    const { demoType, audienceType, venueName, presenterName } = req.body
    const demo = await svc.startDemo({ demoType, audienceType, venueName, presenterName, createdBy: req.user?.id || 'system' })
    return res.json({ success: true, data: demo })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function endDemo(req, res) {
  try {
    const { demoId } = req.body
    if (!demoId) return res.status(400).json({ success: false, message: 'demoId required' })
    const demo = await svc.endDemo(demoId)
    if (!demo) return res.status(404).json({ success: false, message: 'Demo not found' })
    return res.json({ success: true, data: demo })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function recordEvent(req, res) {
  try {
    const { demoId, eventType, screenName, moduleName, payload } = req.body
    if (!demoId) return res.status(400).json({ success: false, message: 'demoId required' })
    const ev = await svc.recordEvent({ demoId_: demoId, eventType, screenName, moduleName, payload })
    return res.json({ success: true, data: ev })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function getDemoSummary(req, res) {
  try {
    const { demoId } = req.query
    if (!demoId) return res.status(400).json({ success: false, message: 'demoId query param required' })
    const summary = await svc.buildDemoSummary(demoId)
    if (!summary) return res.status(404).json({ success: false, message: 'Demo not found' })
    return res.json({ success: true, data: summary })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function resetDemo(req, res) {
  try {
    const { demoId, includeVenueTest } = req.body
    const demoResult = await svc.resetDemoSessions(demoId || null)
    let venueResult  = null
    if (includeVenueTest) {
      venueResult = await resetDemoData({ clearNotes: true, clearSessions: true })
    }
    return res.json({ success: true, data: { demo: demoResult, venueTest: venueResult } })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}
