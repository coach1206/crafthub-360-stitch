/**
 * Demo Reset Service — Phase 12
 * Safely resets prototype/demo data for a venue test run.
 *
 * SAFE: Never deletes users, auth credentials, role permissions,
 *       system config, real provider credentials, or audit/security logs.
 */

import { query, isDbAvailable } from '../db/connection.js'
import { proto }                 from './venueTestService.js'

/**
 * Reset demo data for a venue test.
 *
 * @param {object} opts
 * @param {string} opts.venueTestId         - Which test's notes/issues to clear.
 * @param {boolean} [opts.preserveUsers]    - Always true — users are never deleted.
 * @param {boolean} [opts.clearNotes]       - Also wipe observer notes for this test.
 * @param {boolean} [opts.clearIssues]      - Also wipe issues for this test.
 * @param {boolean} [opts.clearSessions]    - Wipe venue_test_sessions for this test.
 * @param {boolean} [opts.clearLeaderboard] - Clear prototype leaderboard entries.
 * @param {boolean} [opts.clearPassport]    - Clear prototype passport stamps.
 * @param {boolean} [opts.clearGuestSessions] - Clear prototype guest sessions.
 */
export async function resetDemoData({
  venueTestId,
  preserveUsers      = true,
  clearNotes         = true,
  clearIssues        = false,
  clearSessions      = false,
  clearLeaderboard   = true,
  clearPassport      = true,
  clearGuestSessions = true,
} = {}) {
  const cleared = []

  if (!isDbAvailable()) {
    // Prototype in-memory reset
    if (clearNotes    && venueTestId) { const before = proto.notes.length;   proto.notes   = proto.notes.filter(n => n.venue_test_id !== venueTestId);   cleared.push(`notes: removed ${before - proto.notes.length}`) }
    if (clearIssues   && venueTestId) { const before = proto.issues.length;  proto.issues  = proto.issues.filter(i => i.venue_test_id !== venueTestId);   cleared.push(`issues: removed ${before - proto.issues.length}`) }
    if (clearSessions && venueTestId) { const before = proto.sessions.length;proto.sessions= proto.sessions.filter(s => s.venue_test_id !== venueTestId); cleared.push(`sessions: removed ${before - proto.sessions.length}`) }
    cleared.push('prototype mode — guest/passport/leaderboard state lives in React context (refreshed on page load)')
    return { success: true, cleared, prototypeMode: true }
  }

  // ── Database resets ────────────────────────────────────────────────────────

  if (clearNotes && venueTestId) {
    const r = await query(`DELETE FROM observer_notes WHERE venue_test_id=$1`, [venueTestId])
    cleared.push(`observer_notes: ${r.rowCount} removed`)
  }

  if (clearIssues && venueTestId) {
    const r = await query(`DELETE FROM venue_test_issues WHERE venue_test_id=$1`, [venueTestId])
    cleared.push(`venue_test_issues: ${r.rowCount} removed`)
  }

  if (clearSessions && venueTestId) {
    const r = await query(`DELETE FROM venue_test_sessions WHERE venue_test_id=$1`, [venueTestId])
    cleared.push(`venue_test_sessions: ${r.rowCount} removed`)
  }

  if (clearGuestSessions) {
    // Only deletes prototype-flagged sessions (prototype_mode = true), or all if table lacks that column
    try {
      const r = await query(`DELETE FROM guest_sessions WHERE prototype_mode = true OR session_type = 'prototype'`)
      cleared.push(`guest_sessions(prototype): ${r.rowCount} removed`)
    } catch {
      cleared.push('guest_sessions: skipped (no prototype_mode column)')
    }
  }

  if (clearLeaderboard) {
    try {
      const r = await query(`DELETE FROM leaderboard WHERE is_demo = true`)
      cleared.push(`leaderboard(demo): ${r.rowCount} removed`)
    } catch {
      cleared.push('leaderboard: skipped (no is_demo column)')
    }
  }

  if (clearPassport) {
    try {
      const r = await query(`DELETE FROM passport_stamps WHERE is_demo = true`)
      cleared.push(`passport_stamps(demo): ${r.rowCount} removed`)
    } catch {
      cleared.push('passport_stamps: skipped (no is_demo column)')
    }
  }

  return { success: true, cleared, prototypeMode: false }
}
