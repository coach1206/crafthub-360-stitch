import { useCallback } from 'react'
import {
  trackLessonOpened,
  trackLessonCompleted,
  trackQuizStarted,
  trackQuizCompleted,
  trackMentorQuestionAsked,
  trackRecommendationShown,
  trackRecommendationAccepted,
  trackDecisionBuilt,
  trackPassportProgressViewed,
  trackMasteryProgressViewed,
  trackCommerceReadinessBlocked,
  getAnalyticsAdapterStatus,
} from '../../services/ncie/ncieAnalyticsAdapter.js'

export function useNcieAnalytics(moduleId = 'smokecraft', guestId = null) {
  const status = getAnalyticsAdapterStatus()

  const track = useCallback((fn, payload) => fn({ guestId, moduleId, ...payload }), [guestId, moduleId])

  return {
    trackLessonOpened:             useCallback((p) => track(trackLessonOpened, p), [track]),
    trackLessonCompleted:          useCallback((p) => track(trackLessonCompleted, p), [track]),
    trackQuizStarted:              useCallback((p) => track(trackQuizStarted, p), [track]),
    trackQuizCompleted:            useCallback((p) => track(trackQuizCompleted, p), [track]),
    trackMentorQuestionAsked:      useCallback((p) => track(trackMentorQuestionAsked, p), [track]),
    trackRecommendationShown:      useCallback((p) => track(trackRecommendationShown, p), [track]),
    trackRecommendationAccepted:   useCallback((p) => track(trackRecommendationAccepted, p), [track]),
    trackDecisionBuilt:            useCallback((p) => track(trackDecisionBuilt, p), [track]),
    trackPassportProgressViewed:   useCallback((p) => track(trackPassportProgressViewed, p), [track]),
    trackMasteryProgressViewed:    useCallback((p) => track(trackMasteryProgressViewed, p), [track]),
    trackCommerceReadinessBlocked: useCallback((p) => track(trackCommerceReadinessBlocked, p), [track]),
    analyticsStatus:    'analytics_preview',
    persistenceStatus:  status.persistenceStatus,
    databaseStatus:     status.databaseStatus,
    moduleId,
    guestId,
  }
}
