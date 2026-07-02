/**
 * NCIE Analytics Intelligence Engine
 * Tracks and surfaces learning and engagement analytics for Craft360 verticals.
 * Returns analytics_preview when no verified database connection exists.
 */

import { buildAnalyticsEvent, ANALYTICS_EVENT_TYPES } from '../../data/ncie/analyticsEvents.js'

const analyticsEventStore = []

export function trackEvent(eventType, payload = {}) {
  const event = buildAnalyticsEvent(eventType, payload)
  if (!event.ok) return event

  analyticsEventStore.push(event)

  return {
    ok:              true,
    eventType,
    tracked:         true,
    analyticsMode:   'analytics_preview',
    persistenceStatus: 'not_persisted',
    storageMode:     'memory_fallback',
    message:         'Analytics event tracked in memory. No live database persistence without verified DATABASE_URL.',
  }
}

export function getGuestAnalytics(guestId, moduleId = null) {
  if (!guestId) return { ok: false, error: 'guest_id_required' }

  const events = analyticsEventStore.filter(e =>
    e.payload?.guestId === guestId &&
    (!moduleId || e.payload?.moduleId === moduleId)
  )

  const completedLessons = events
    .filter(e => e.eventType === ANALYTICS_EVENT_TYPES.LESSON_COMPLETED)
    .map(e => e.payload?.topicId)
    .filter(Boolean)

  const totalXP = events
    .filter(e => e.eventType === ANALYTICS_EVENT_TYPES.XP_EARNED)
    .reduce((sum, e) => sum + (e.payload?.xpAmount ?? 0), 0)

  const mentorSessions = events.filter(e => e.eventType === ANALYTICS_EVENT_TYPES.MENTOR_SESSION_OPENED).length
  const stamps         = events.filter(e => e.eventType === ANALYTICS_EVENT_TYPES.PASSPORT_STAMP_EARNED).length

  return {
    ok:               true,
    guestId,
    moduleId,
    completedLessons,
    totalXP,
    mentorSessions,
    stamps,
    eventCount:       events.length,
    analyticsMode:    'analytics_preview',
    persistenceStatus: 'not_persisted',
    storageMode:      'memory_fallback',
    message:          'Analytics returned from in-memory store. Not persisted without verified database.',
  }
}

export function getVerticalAnalytics(moduleId) {
  if (!moduleId) return { ok: false, error: 'module_id_required' }

  const events = analyticsEventStore.filter(e => e.payload?.moduleId === moduleId)
  const uniqueGuests = new Set(events.map(e => e.payload?.guestId).filter(Boolean))

  return {
    ok:              true,
    moduleId,
    totalEvents:     events.length,
    uniqueGuests:    uniqueGuests.size,
    analyticsMode:   'analytics_preview',
    dataStatus:      'analytics_preview',
    storageMode:     'memory_fallback',
    message:         'Vertical analytics are preview-only. No live analytics database was queried.',
  }
}

export function getAnalyticsReadiness(venueId = null) {
  const hasDb = !!(typeof process !== 'undefined' && process.env?.DATABASE_URL)
  return {
    ok:              true,
    venueId,
    analyticsMode:   hasDb ? 'analytics_preview' : 'analytics_preview',
    databaseStatus:  hasDb ? 'database_url_present' : 'database_url_required',
    persistenceMode: hasDb ? 'persistence_available' : 'not_persisted',
    blockers: [
      { type: 'analytics_preview', severity: 'info', message: 'All analytics are preview-only without a verified analytics integration.' },
    ],
    message: 'Analytics readiness checked. Live analytics require a verified database connection.',
  }
}

export function getEngagementSummary(moduleId, period = 'today') {
  return {
    ok:              true,
    moduleId,
    period,
    analyticsMode:   'analytics_preview',
    lessonStarts:    0,
    lessonCompletions: 0,
    mentorSessions:  0,
    xpAwarded:       0,
    activeGuests:    0,
    dataStatus:      'analytics_preview',
    message:         'Engagement summary is preview-only. No live data queried.',
  }
}
