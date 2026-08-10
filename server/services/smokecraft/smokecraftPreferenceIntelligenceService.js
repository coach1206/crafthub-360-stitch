/**
 * SmokeCraft Preference Intelligence Service
 * Builds a customer taste profile from all available SmokeCraft journey signals.
 * Returns honest partial status when data is incomplete.
 * Does not fake confidence.
 */

/**
 * Builds a customer taste profile from available input signals.
 * @param {object} signals - any combination of identity/mentor/scorecard/flavorMemory/order data
 * @returns {object} taste profile with honest tasteProfileStatus and confidenceScore
 */
export function buildTasteProfile(signals = {}) {
  const {
    identity = null,
    mentorId = null,
    mentorStyle = null,
    humidorMatch = null,
    flavorMemory = null,
    firstThirdNotes = [],
    secondThirdNotes = [],
    finalThirdNotes = [],
    scorecard = null,
    orderSelections = [],
    menuInteractions = [],
    explicitLikes = [],
    explicitDislikes = [],
    avoidIngredients = [],
    allergyNotes = [],
  } = signals

  const sourceSignals = []
  let signalCount = 0

  // Collect flavor notes from all journey phases
  const allFlavorNotes = [
    ...firstThirdNotes,
    ...secondThirdNotes,
    ...finalThirdNotes,
  ]
  if (flavorMemory?.flavorNotes?.length) {
    allFlavorNotes.push(...flavorMemory.flavorNotes)
    sourceSignals.push('flavor_memory')
    signalCount++
  }
  if (firstThirdNotes.length) { sourceSignals.push('first_third'); signalCount++ }
  if (secondThirdNotes.length) { sourceSignals.push('second_third'); signalCount++ }
  if (finalThirdNotes.length) { sourceSignals.push('final_third'); signalCount++ }

  // Derive flavor frequency
  const noteFrequency = {}
  for (const note of allFlavorNotes) {
    noteFrequency[note] = (noteFrequency[note] ?? 0) + 1
  }
  const sortedNotes = Object.entries(noteFrequency).sort((a, b) => b[1] - a[1])
  const dominantFlavorNotes = sortedNotes.slice(0, 5).map(([n]) => n)
  const secondaryFlavorNotes = sortedNotes.slice(5, 10).map(([n]) => n)

  // Strength/body from identity or humidorMatch
  let preferredStrength = identity?.preferredStrength ?? humidorMatch?.strength ?? null
  let preferredBody = identity?.preferredBody ?? humidorMatch?.body ?? null
  if (preferredStrength || preferredBody) { sourceSignals.push('identity_humidor'); signalCount++ }

  // Wrapper/origin from identity or humidorMatch
  const recommendedWrapperTypes = [
    ...(identity?.preferredWrapperTypes ?? []),
    ...(humidorMatch?.wrapperTypes ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i)
  const recommendedOrigins = [
    ...(identity?.preferredOrigins ?? []),
    ...(humidorMatch?.origins ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i)

  // Scorecard signals
  let scorecardStrengthSignal = null
  let scorecardBodySignal = null
  if (scorecard) {
    scorecardStrengthSignal = scorecard.strengthRating ?? null
    scorecardBodySignal = scorecard.bodyRating ?? null
    sourceSignals.push('scorecard')
    signalCount++
  }

  // Order history signals
  const drinkAffinity = []
  const foodAffinity = []
  for (const order of orderSelections) {
    if (order.category === 'drink' && order.name) drinkAffinity.push(order.name)
    if (order.category === 'food' && order.name) foodAffinity.push(order.name)
  }
  if (orderSelections.length) { sourceSignals.push('order_history'); signalCount++ }
  if (menuInteractions.length) { sourceSignals.push('menu_interactions'); signalCount++ }

  // Mentor influence
  const mentorInfluence = mentorId
    ? { mentorId, mentorStyle: mentorStyle ?? 'unknown', applied: true }
    : { mentorId: null, mentorStyle: null, applied: false }
  if (mentorId) { sourceSignals.push('mentor'); signalCount++ }

  // Explicit likes/dislikes override everything
  const likedNotes = [...explicitLikes, ...(flavorMemory?.likedNotes ?? [])]
  const avoidFlavorNotes = [...explicitDislikes, ...(flavorMemory?.dislikedNotes ?? [])]
  if (explicitLikes.length || explicitDislikes.length) { sourceSignals.push('explicit_preferences'); signalCount++ }

  // Confidence: 0–1 based on how many signal sources contributed
  const maxSignals = 8
  const rawConfidence = Math.min(signalCount / maxSignals, 1)
  const confidenceScore = parseFloat(rawConfidence.toFixed(2))

  const tasteProfileStatus = confidenceScore >= 0.5 ? 'established' : 'partial'

  return {
    tasteProfileStatus,
    confidenceScore,
    preferredStrength: preferredStrength ?? scorecardStrengthSignal,
    preferredBody: preferredBody ?? scorecardBodySignal,
    dominantFlavorNotes,
    secondaryFlavorNotes,
    avoidFlavorNotes,
    likedFlavorNotes: likedNotes,
    recommendedWrapperTypes,
    recommendedOrigins,
    drinkAffinity,
    foodAffinity,
    mentorInfluence,
    sessionPhaseInfluence: {
      firstThirdSignals: firstThirdNotes.length,
      secondThirdSignals: secondThirdNotes.length,
      finalThirdSignals: finalThirdNotes.length,
      flavorMemorySignals: flavorMemory?.flavorNotes?.length ?? 0,
    },
    avoidIngredients,
    allergyNotes,
    sourceSignals,
    persistenceMode: 'computed',
  }
}

/**
 * Merges new session signals into an existing profile.
 */
export function mergeProfileSignals(existingProfile, newSignals) {
  const merged = {
    ...existingProfile,
    likedFlavorNotes: [
      ...(existingProfile.likedFlavorNotes ?? []),
      ...(newSignals.explicitLikes ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i),
    dislikedFlavorNotes: [
      ...(existingProfile.dislikedFlavorNotes ?? []),
      ...(newSignals.explicitDislikes ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i),
    flavorMemorySignals: [
      ...(existingProfile.flavorMemorySignals ?? []),
      ...(newSignals.flavorMemory ? [newSignals.flavorMemory] : []),
    ],
    scorecardSignals: [
      ...(existingProfile.scorecardSignals ?? []),
      ...(newSignals.scorecard ? [newSignals.scorecard] : []),
    ],
    orderHistorySignals: [
      ...(existingProfile.orderHistorySignals ?? []),
      ...(newSignals.orderSelections ?? []),
    ],
  }
  return merged
}
