/**
 * NCIE Analytics Events
 * Event schema definitions for tracking guest learning and engagement across Craft360 verticals.
 * All analytics is preview-only without a verified database connection.
 */

export const ANALYTICS_EVENT_TYPES = {
  LESSON_STARTED:        'lesson_started',
  LESSON_COMPLETED:      'lesson_completed',
  MENTOR_SESSION_OPENED: 'mentor_session_opened',
  MENTOR_RESPONSE_RATED: 'mentor_response_rated',
  DECISION_REQUESTED:    'decision_requested',
  RECOMMENDATION_VIEWED: 'recommendation_viewed',
  PRODUCT_SELECTED:      'product_selected',
  PASSPORT_STAMP_EARNED: 'passport_stamp_earned',
  XP_EARNED:             'xp_earned',
  LEVEL_UP:              'level_up',
  CERTIFICATION_EARNED:  'certification_earned',
  VERTICAL_ENTERED:      'vertical_entered',
  PAIRING_EXPLORED:      'pairing_explored',
  CROSS_CRAFT_TRIGGERED: 'cross_craft_triggered',
}

export const ANALYTICS_EVENT_SCHEMA = {
  lesson_started: {
    required: ['guestId', 'moduleId', 'topicId'],
    optional: ['sessionId', 'mentorId', 'venueId'],
  },
  lesson_completed: {
    required: ['guestId', 'moduleId', 'topicId', 'xpAwarded'],
    optional: ['sessionId', 'mentorId', 'durationSeconds', 'venueId'],
  },
  mentor_session_opened: {
    required: ['guestId', 'moduleId', 'mentorId'],
    optional: ['sessionId', 'topicContext', 'venueId'],
  },
  mentor_response_rated: {
    required: ['guestId', 'moduleId', 'mentorId', 'rating'],
    optional: ['sessionId', 'feedback', 'venueId'],
  },
  decision_requested: {
    required: ['guestId', 'moduleId'],
    optional: ['guestContext', 'sessionId', 'venueId'],
  },
  recommendation_viewed: {
    required: ['guestId', 'moduleId', 'recommendationType'],
    optional: ['targetModuleId', 'sessionId', 'venueId'],
  },
  product_selected: {
    required: ['guestId', 'moduleId', 'productId'],
    optional: ['sessionId', 'venueId', 'partnerId'],
  },
  passport_stamp_earned: {
    required: ['guestId', 'moduleId', 'stampId'],
    optional: ['sessionId', 'venueId', 'visitNumber'],
  },
  xp_earned: {
    required: ['guestId', 'moduleId', 'xpAmount', 'reason'],
    optional: ['sessionId', 'topicId', 'venueId'],
  },
  level_up: {
    required: ['guestId', 'moduleId', 'fromLevel', 'toLevel'],
    optional: ['sessionId', 'totalXP', 'venueId'],
  },
  certification_earned: {
    required: ['guestId', 'moduleId', 'certificationLevel'],
    optional: ['sessionId', 'venueId', 'totalXP', 'visitCount'],
  },
  vertical_entered: {
    required: ['guestId', 'moduleId'],
    optional: ['sessionId', 'venueId', 'entrySource'],
  },
  pairing_explored: {
    required: ['guestId', 'moduleId', 'pairingType'],
    optional: ['sessionId', 'venueId', 'targetModuleId'],
  },
  cross_craft_triggered: {
    required: ['guestId', 'sourceModuleId', 'targetModuleId'],
    optional: ['sessionId', 'ruleId', 'venueId'],
  },
}

export function buildAnalyticsEvent(eventType, payload = {}) {
  const schema = ANALYTICS_EVENT_SCHEMA[eventType]
  if (!schema) {
    return { ok: false, error: 'unknown_event_type', eventType }
  }

  const missingRequired = schema.required.filter(k => !payload[k])
  if (missingRequired.length > 0) {
    return { ok: false, error: 'missing_required_fields', missingRequired }
  }

  return {
    ok:             true,
    eventType,
    payload,
    timestamp:      new Date().toISOString(),
    analyticsMode:  'analytics_preview',
    persistenceStatus: 'not_persisted',
    message:        'Analytics event built. No live persistence without verified database.',
  }
}

export function getEventSchema(eventType) {
  return ANALYTICS_EVENT_SCHEMA[eventType] ?? null
}
