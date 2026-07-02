/**
 * NCIE Analytics Adapter
 * Emits analytics_preview events for NCIE screen interactions.
 * Returns not_persisted when DATABASE_URL is missing.
 * Does not claim analytics are persisted without database proof.
 */

import { buildAnalyticsEvent, ANALYTICS_EVENT_TYPES } from '../../data/ncie/analyticsEvents.js'

const SESSION_EVENT_BUFFER = []

function hasDatabase() {
  return !!(typeof process !== 'undefined' && process.env?.DATABASE_URL)
}

function emit(eventType, payload) {
  const event = buildAnalyticsEvent(eventType, payload)
  if (!event.ok) return { ...event, analyticsMode: 'analytics_preview' }

  SESSION_EVENT_BUFFER.push(event)

  return {
    ok:               true,
    eventType,
    analyticsMode:    'analytics_preview',
    persistenceStatus: hasDatabase() ? 'database_url_present_persistence_unverified' : 'not_persisted',
    storageMode:      'memory_fallback',
    message:          'Analytics event captured in preview mode. Not persisted without verified database write proof.',
  }
}

export function trackLessonOpened({ guestId, moduleId, topicId, sessionId, mentorId, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.LESSON_STARTED, { guestId, moduleId, topicId, sessionId, mentorId, venueId })
}

export function trackLessonCompleted({ guestId, moduleId, topicId, xpAwarded = 25, sessionId, mentorId, durationSeconds, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.LESSON_COMPLETED, { guestId, moduleId, topicId, xpAwarded, sessionId, mentorId, durationSeconds, venueId })
}

export function trackQuizStarted({ guestId, moduleId, topicId, sessionId, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.LESSON_STARTED, { guestId, moduleId, topicId, sessionId, venueId })
}

export function trackQuizCompleted({ guestId, moduleId, topicId, xpAwarded = 15, sessionId, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.LESSON_COMPLETED, { guestId, moduleId, topicId, xpAwarded, sessionId, venueId })
}

export function trackMentorQuestionAsked({ guestId, moduleId, mentorId, sessionId, topicContext, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.MENTOR_SESSION_OPENED, { guestId, moduleId, mentorId, sessionId, topicContext, venueId })
}

export function trackRecommendationShown({ guestId, moduleId, recommendationType, targetModuleId, sessionId, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.RECOMMENDATION_VIEWED, { guestId, moduleId, recommendationType, targetModuleId, sessionId, venueId })
}

export function trackRecommendationAccepted({ guestId, moduleId, productId, sessionId, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.PRODUCT_SELECTED, { guestId, moduleId, productId, sessionId, venueId })
}

export function trackDecisionBuilt({ guestId, moduleId, sessionId, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.DECISION_REQUESTED, { guestId, moduleId, sessionId, venueId })
}

export function trackPassportProgressViewed({ guestId, moduleId, sessionId, visitNumber, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.PASSPORT_STAMP_EARNED, { guestId, moduleId, stampId: 'passport_progress_view', sessionId, visitNumber, venueId })
}

export function trackMasteryProgressViewed({ guestId, moduleId, sessionId, venueId } = {}) {
  return emit(ANALYTICS_EVENT_TYPES.XP_EARNED, { guestId, moduleId, xpAmount: 0, reason: 'mastery_progress_view', sessionId, venueId })
}

export function trackCommerceReadinessBlocked({ guestId, moduleId, blockReason, sessionId, venueId } = {}) {
  const event = {
    ok:               true,
    eventType:        'commerce_readiness_blocked',
    payload:          { guestId, moduleId, blockReason, sessionId, venueId },
    timestamp:        new Date().toISOString(),
    analyticsMode:    'analytics_preview',
    persistenceStatus: 'not_persisted',
    message:          'Commerce readiness blocked event captured. No purchase was initiated.',
  }
  SESSION_EVENT_BUFFER.push(event)
  return event
}

export function getSessionEventBuffer() {
  return {
    ok:               true,
    events:           SESSION_EVENT_BUFFER,
    count:            SESSION_EVENT_BUFFER.length,
    analyticsMode:    'analytics_preview',
    persistenceStatus: hasDatabase() ? 'database_url_present' : 'not_persisted',
    message:          'Session event buffer returned from memory. Not persisted without verified database.',
  }
}

export function getAnalyticsAdapterStatus() {
  return {
    ok:               true,
    analyticsMode:    'analytics_preview',
    databaseStatus:   hasDatabase() ? 'database_url_present' : 'database_url_required',
    persistenceStatus: 'not_persisted',
    eventCount:       SESSION_EVENT_BUFFER.length,
    message:          'Analytics adapter is in preview mode. Events are captured in memory only.',
  }
}
