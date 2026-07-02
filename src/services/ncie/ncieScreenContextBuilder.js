/**
 * NCIE Screen Context Builder
 * Builds safe user context for NCIE decisions, mentor sessions, and recommendations.
 * NEVER includes Stripe tokens, raw payment IDs, bank info, tax IDs, or private credentials.
 * Purchase history is included only as a safe summary (category counts, not transaction IDs or amounts).
 */

const BLOCKED_CONTEXT_FIELDS = [
  'stripeToken', 'stripe_token', 'accessToken', 'access_token',
  'refreshToken', 'refresh_token', 'bankAccount', 'bank_account',
  'routingNumber', 'routing_number', 'accountNumber', 'account_number',
  'taxId', 'tax_id', 'ein', 'ssn', 'cardNumber', 'card_number',
  'cvv', 'webhookSecret', 'webhook_secret', 'secretKey', 'secret_key',
  'apiKey', 'api_key', 'password', 'privateKey', 'private_key',
  'stripeConnectId', 'stripe_connect_id', 'paymentMethodId', 'payment_method_id',
  'orderId', 'order_id', 'receiptEmail', 'receipt_email',
]

export function buildScreenContext(rawContext = {}, options = {}) {
  const safe = {}
  const redacted = []

  for (const [key, value] of Object.entries(rawContext)) {
    if (BLOCKED_CONTEXT_FIELDS.includes(key)) {
      redacted.push(key)
      continue
    }
    if (key === 'purchaseHistory') {
      safe.purchaseHistory = sanitizePurchaseHistory(value)
      continue
    }
    safe[key] = value
  }

  return {
    ok:              true,
    context: {
      craftType:          safe.craftType         ?? options.craftType         ?? 'smokecraft',
      currentScreen:      safe.currentScreen     ?? options.currentScreen     ?? null,
      currentVisit:       safe.currentVisit      ?? options.currentVisit      ?? 1,
      currentSession:     safe.currentSession    ?? options.currentSession    ?? 1,
      experienceLevel:    safe.experienceLevel   ?? options.experienceLevel   ?? 'beginner',
      completedLessons:   safe.completedLessons  ?? [],
      quizScores:         safe.quizScores        ?? {},
      favoriteFlavors:    safe.favoriteFlavors   ?? [],
      favoriteAromas:     safe.favoriteAromas    ?? [],
      favoriteRegions:    safe.favoriteRegions   ?? [],
      favoriteProducts:   safe.favoriteProducts  ?? [],
      favoritePairings:   safe.favoritePairings  ?? [],
      selectedMentor:     safe.selectedMentor    ?? null,
      purchaseHistory:    safe.purchaseHistory   ?? { categorySummary: {}, sessionCount: 0 },
      savedNotes:         safe.savedNotes        ?? [],
      bookmarks:          safe.bookmarks         ?? [],
      masteryLevel:       safe.masteryLevel      ?? 'apprentice',
      strengthPreference: safe.strengthPreference ?? null,
      pairingPreference:  safe.pairingPreference  ?? null,
      knowledgeInterest:  safe.knowledgeInterest  ?? [],
    },
    safetyNote:      'Private credentials, payment tokens, tax IDs, and bank data excluded from NCIE context.',
    redactedFields:  redacted,
    contextMode:     'safe_context_built',
  }
}

function sanitizePurchaseHistory(history) {
  if (!history) return { categorySummary: {}, sessionCount: 0 }
  return {
    categorySummary: history.categorySummary ?? {},
    sessionCount:    history.sessionCount    ?? 0,
    note:            'Purchase history is a safe summary only. Raw order IDs, amounts, and payment data are excluded.',
  }
}

export function buildSmokeCraftContext(guestProfile = {}, sessionState = {}, options = {}) {
  return buildScreenContext({
    craftType:        'smokecraft',
    currentScreen:    sessionState.currentScreen    ?? options.currentScreen,
    currentVisit:     guestProfile.visitCount       ?? sessionState.visitCount      ?? 1,
    currentSession:   guestProfile.sessionCount     ?? sessionState.sessionCount    ?? 1,
    experienceLevel:  guestProfile.experienceLevel  ?? 'beginner',
    completedLessons: guestProfile.completedLessons ?? [],
    quizScores:       guestProfile.quizScores       ?? {},
    favoriteFlavors:  guestProfile.favoriteFlavors  ?? [],
    favoriteAromas:   guestProfile.favoriteAromas   ?? [],
    favoriteRegions:  guestProfile.favoriteRegions  ?? [],
    favoriteProducts: guestProfile.favoriteProducts ?? [],
    favoritePairings: guestProfile.favoritePairings ?? [],
    selectedMentor:   guestProfile.selectedMentor   ?? sessionState.selectedMentor ?? null,
    purchaseHistory:  { categorySummary: guestProfile.categorySummary ?? {}, sessionCount: guestProfile.sessionCount ?? 0 },
    savedNotes:       guestProfile.savedNotes       ?? [],
    bookmarks:        guestProfile.bookmarks        ?? [],
    masteryLevel:     guestProfile.masteryLevel     ?? 'apprentice',
    strengthPreference: guestProfile.strengthPreference ?? null,
    pairingPreference:  guestProfile.pairingPreference  ?? null,
    knowledgeInterest:  guestProfile.knowledgeInterest  ?? [],
  }, options)
}

export function validateContextSafety(context) {
  const violations = []
  for (const field of BLOCKED_CONTEXT_FIELDS) {
    if (context?.[field] !== undefined) violations.push(field)
    if (context?.context?.[field] !== undefined) violations.push(field)
  }
  return {
    ok:         violations.length === 0,
    violations,
    safetyMode: violations.length === 0 ? 'context_safe' : 'context_violation_detected',
  }
}
