/**
 * Venue Test Controller — Phase 12
 * Handles all /api/venue-test endpoints.
 */

import * as svc        from '../services/venueTestService.js'
import * as resetSvc   from '../services/demoResetService.js'
import * as exportSvc  from '../services/venueTestExportService.js'
import { isDbAvailable } from '../db/connection.js'

// ── Status ────────────────────────────────────────────────────────────────────

/** GET /api/venue-test/status — manager+ */
export async function getStatus(req, res) {
  try {
    const active = await svc.getActiveTest()
    return res.json({
      success: true,
      data: {
        testActive:    !!active,
        activeTest:    active || null,
        prototypeMode: !isDbAvailable(),
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Start / End Test ──────────────────────────────────────────────────────────

/** POST /api/venue-test/start — manager+ */
export async function startTest(req, res) {
  try {
    const { venueName, testType } = req.body
    if (!venueName) return res.status(400).json({ success: false, message: 'venueName is required' })
    const test = await svc.startTest({ venueName, testType, createdBy: req.user?.id || 'system' })
    return res.json({ success: true, data: test })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** POST /api/venue-test/end — manager+ */
export async function endTest(req, res) {
  try {
    const { venueTestId } = req.body
    if (!venueTestId) return res.status(400).json({ success: false, message: 'venueTestId is required' })
    const test = await svc.endTest(venueTestId)
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' })
    return res.json({ success: true, data: test })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────────

/** POST /api/venue-test/session/start — manager+ */
export async function startSession(req, res) {
  try {
    const { venueTestId, participantLabel, participantType, guestSessionId } = req.body
    if (!venueTestId) return res.status(400).json({ success: false, message: 'venueTestId is required' })
    const session = await svc.startSession({ venueTestId, participantLabel, participantType, guestSessionId })
    return res.json({ success: true, data: session })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** POST /api/venue-test/session/end — manager+ */
export async function endSession(req, res) {
  try {
    const { sessionId, completionStatus, notes } = req.body
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId is required' })
    const session = await svc.endSession(sessionId, { completionStatus, notes })
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' })
    return res.json({ success: true, data: session })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Observer Notes ────────────────────────────────────────────────────────────

/** POST /api/venue-test/observer-note — manager+ */
export async function addObserverNote(req, res) {
  try {
    const { venueTestId, guestSessionId, screenName, eventType, note, severity } = req.body
    if (!venueTestId || !note) {
      return res.status(400).json({ success: false, message: 'venueTestId and note are required' })
    }
    const record = await svc.addObserverNote({
      venueTestId, guestSessionId, screenName, eventType, note, severity,
      createdBy: req.user?.id || 'observer',
    })
    return res.json({ success: true, data: record })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Issues ────────────────────────────────────────────────────────────────────

/** POST /api/venue-test/issue — manager+ */
export async function logIssue(req, res) {
  try {
    const { venueTestId, guestSessionId, issueType, screenName, description, severity } = req.body
    if (!venueTestId || !description) {
      return res.status(400).json({ success: false, message: 'venueTestId and description are required' })
    }
    const record = await svc.logIssue({
      venueTestId, guestSessionId, issueType, screenName, description, severity,
      createdBy: req.user?.id || 'observer',
    })
    return res.json({ success: true, data: record })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** GET /api/venue-test/issues?venueTestId=... — manager+ */
export async function getIssues(req, res) {
  try {
    const { venueTestId } = req.query
    if (!venueTestId) return res.status(400).json({ success: false, message: 'venueTestId query param required' })
    const issues = await svc.listIssues(venueTestId)
    return res.json({ success: true, data: issues })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

/** GET /api/venue-test/summary?venueTestId=... — manager+ */
export async function getSummary(req, res) {
  try {
    const { venueTestId } = req.query
    if (!venueTestId) return res.status(400).json({ success: false, message: 'venueTestId query param required' })
    const summary = await svc.buildSummary(venueTestId)
    if (!summary) return res.status(404).json({ success: false, message: 'Test not found' })
    return res.json({ success: true, data: summary })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Demo Reset ────────────────────────────────────────────────────────────────

/** POST /api/venue-test/reset-demo-data — admin+ */
export async function resetDemoData(req, res) {
  try {
    const { venueTestId, clearNotes, clearIssues, clearSessions, clearLeaderboard, clearPassport, clearGuestSessions } = req.body
    const result = await resetSvc.resetDemoData({
      venueTestId,
      clearNotes:         clearNotes         ?? true,
      clearIssues:        clearIssues        ?? false,
      clearSessions:      clearSessions      ?? false,
      clearLeaderboard:   clearLeaderboard   ?? true,
      clearPassport:      clearPassport      ?? true,
      clearGuestSessions: clearGuestSessions ?? true,
    })
    return res.json({ success: true, data: result })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

/** GET /api/venue-test/export/json?venueTestId=... — manager+ */
export async function exportJson(req, res) {
  try {
    const { venueTestId } = req.query
    if (!venueTestId) return res.status(400).json({ success: false, message: 'venueTestId required' })
    const data = await exportSvc.exportJson(venueTestId)
    return res.json({ success: true, data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** GET /api/venue-test/export/csv?venueTestId=...&type=sessions|notes|issues|summary|full — manager+ */
export async function exportCsv(req, res) {
  try {
    const { venueTestId, type = 'summary' } = req.query
    if (!venueTestId) return res.status(400).json({ success: false, message: 'venueTestId required' })

    let csv
    if (type === 'sessions')      csv = await exportSvc.exportSessionsCsv(venueTestId)
    else if (type === 'notes')    csv = await exportSvc.exportNotesCsv(venueTestId)
    else if (type === 'issues')   csv = await exportSvc.exportIssuesCsv(venueTestId)
    else if (type === 'full') {
      const all = await exportSvc.exportFullCsv(venueTestId)
      return res.json({ success: true, data: all })
    }
    else                           csv = await exportSvc.exportSummaryCsv(venueTestId)

    return res.json({ success: true, data: { csv, type, venueTestId } })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
