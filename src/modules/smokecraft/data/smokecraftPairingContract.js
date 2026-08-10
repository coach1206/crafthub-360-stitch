/**
 * SmokeCraft Pairing Contract
 * Defines the shape of pairing recommendations in the SmokeCraft journey.
 *
 * Honest status: If the real pairing engine is not connected, all recommendations
 * return recommendationStatus: "demo_only" with aiBacked: false.
 */

export const PAIRING_RECOMMENDATION_STATUS = {
  READY: 'ready',
  DEMO_ONLY: 'demo_only',
  UNAVAILABLE: 'unavailable',
  PENDING: 'pending',
}

export const STRENGTH_LEVELS = ['mild', 'mild_medium', 'medium', 'medium_full', 'full']
export const BODY_LEVELS     = ['light', 'light_medium', 'medium', 'medium_full', 'full']
export const WRAPPER_TYPES   = ['colorado', 'natural', 'maduro', 'claro', 'oscuro', 'candela', 'double_claro']

/**
 * Creates an empty pairing recommendation payload with safe fallback defaults.
 */
export function createPairingRecommendation(overrides = {}) {
  return {
    recommendationId: null,
    sessionId: null,
    visitId: null,
    userId: null,
    venueId: null,

    // Cigar profile
    cigarProfile: {
      name: null,
      origin: null,
      wrapperType: null,
      strengthLevel: null,
      bodyLevel: null,
      flavorNotes: [],
    },

    // Pairing suggestions
    drinkPairing: [],
    foodPairing: [],
    venueMenuPairing: [],
    mentorRecommendation: null,

    // Context
    customerPreferenceHistory: [],
    sessionPhaseContext: null,
    visitContext: null,
    scorecardContext: null,

    // Honest status
    recommendationStatus: PAIRING_RECOMMENDATION_STATUS.DEMO_ONLY,
    source: 'local_fallback',
    aiBacked: false,
    posBacked: false,
    venueMenuBacked: false,
    preview_only: true,

    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Returns a safe fallback pairing response when the pairing engine is not connected.
 */
export function buildPairingFallbackResponse(context = {}) {
  return {
    ...createPairingRecommendation(context),
    recommendationStatus: PAIRING_RECOMMENDATION_STATUS.DEMO_ONLY,
    source: 'local_fallback',
    aiBacked: false,
    posBacked: false,
    venueMenuBacked: false,
    message: 'Pairing recommendations are demo_only in this environment. Connect a live pairing engine for real recommendations.',
  }
}

export const PAIRING_CONTRACT_VERSION = '0.1.0'
