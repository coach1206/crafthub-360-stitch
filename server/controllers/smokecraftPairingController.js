/**
 * SmokeCraft Pairing Controller
 * Handles all pairing intelligence API requests.
 */

import { getPairingProfileStoreReport, createProfile, getProfile, getProfileByUser, updateProfile } from '../services/smokecraft/smokecraftPairingProfileStore.js'
import { buildTasteProfile, mergeProfileSignals } from '../services/smokecraft/smokecraftPreferenceIntelligenceService.js'
import { scoreCigarToDrink, scoreCigarToFood, scoreCigarToMenuItem } from '../services/smokecraft/smokecraftPairingScoringService.js'
import { getMenuRecommendations, buildOrderPairingPayload } from '../services/smokecraft/smokecraftMenuRecommendationService.js'
import { getMentorRecommendationReport, applyMentorInfluence } from '../services/smokecraft/smokecraftMentorRecommendationService.js'
import { captureFlavorMemory, getFlavorMemoriesForUser, getFlavorMemoryServiceReport } from '../services/smokecraft/smokecraftFlavorMemoryService.js'
import { getPairingProviderStatus, generateLocalRecommendation, generateProviderRecommendation } from '../services/smokecraft/smokecraftPairingProviderService.js'
import { createPairingAuditEntry, getAuditTrailForRecommendation, PAIRING_AUDIT_EVENTS } from '../services/smokecraft/smokecraftPairingAuditService.js'
import { syncSmokeCraftOrderToEAT } from '../services/smokecraft/smokecraftEatSyncBridgeService.js'

export async function getPairingStatus(req, res) {
  try {
    const storeReport = getPairingProfileStoreReport()
    const providerStatus = getPairingProviderStatus()
    const flavorMemoryReport = getFlavorMemoryServiceReport()

    res.json({
      module: 'smokecraft-pairing-intelligence',
      build: 'module_build_4',
      providerStatus,
      storeReport,
      flavorMemoryReport,
      localIntelligenceActive: true,
      productionReady: storeReport.productionReady && providerStatus.providerConnected,
    })
  } catch (err) {
    res.status(500).json({ error: 'pairing_status_error', message: err.message })
  }
}

export async function getProviderStatus(req, res) {
  try {
    res.json(getPairingProviderStatus())
  } catch (err) {
    res.status(500).json({ error: 'provider_status_error', message: err.message })
  }
}

export async function getPairingProfile(req, res) {
  try {
    const { userId } = req.params
    const profile = await getProfileByUser(userId)
    if (!profile) return res.status(404).json({ error: 'not_found', message: 'No pairing profile found for this user.' })
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: 'get_profile_error', message: err.message })
  }
}

export async function updatePairingProfile(req, res) {
  try {
    const { userId, venueId, sessionId, visitId, ...signals } = req.body ?? {}
    if (!userId) return res.status(400).json({ error: 'missing_userId' })

    const tasteProfile = buildTasteProfile(signals)
    const existing = await getProfileByUser(userId)

    let profile
    if (existing) {
      const merged = mergeProfileSignals(existing, signals)
      profile = await updateProfile(existing.profileId, { ...merged, ...tasteProfile, venueId, sessionId, visitId })
    } else {
      profile = await createProfile({ userId, venueId, sessionId, visitId, ...tasteProfile, ...signals })
    }

    createPairingAuditEntry({
      userId,
      venueId,
      eventType: PAIRING_AUDIT_EVENTS.PROFILE_UPDATED,
      inputSummary: { signalKeys: Object.keys(signals) },
      recommendationStatus: 'profile_updated',
      providerConnected: false,
      aiBacked: false,
      confidenceScore: tasteProfile.confidenceScore,
    })

    await syncSmokeCraftOrderToEAT({ userId, eventType: 'pairing.profileUpdated' }, PAIRING_AUDIT_EVENTS.PROFILE_UPDATED)

    res.json({ profile, tasteProfile })
  } catch (err) {
    res.status(500).json({ error: 'update_profile_error', message: err.message })
  }
}

export async function generateRecommendation(req, res) {
  try {
    const { userId, venueId, sessionId, cigarProfile, mentorId, sessionPhase, signals = {} } = req.body ?? {}

    const existingProfile = userId ? await getProfileByUser(userId) : null
    const tasteProfile = existingProfile ? buildTasteProfile({ ...existingProfile, ...signals }) : null

    const providerStatus = getPairingProviderStatus()
    let recommendation

    if (providerStatus.providerConnected) {
      recommendation = await generateProviderRecommendation({ cigarProfile, tasteProfile, sessionPhase, mentorId, userId })
    } else {
      recommendation = generateLocalRecommendation({ cigarProfile, tasteProfile, sessionPhase, mentorId, userId })
    }

    // Apply mentor influence if provided
    if (mentorId && tasteProfile) {
      recommendation = { ...recommendation, ...applyMentorInfluence(recommendation, mentorId, tasteProfile) }
    }

    // Cigar scoring if provided
    if (cigarProfile) {
      recommendation.cigarScores = {
        drinkScores: (cigarProfile.drinkOptions ?? []).map(d => scoreCigarToDrink(cigarProfile, d, tasteProfile)),
        foodScores: (cigarProfile.foodOptions ?? []).map(f => scoreCigarToFood(cigarProfile, f, tasteProfile)),
      }
    }

    const audit = createPairingAuditEntry({
      recommendationId: recommendation.recommendationId ?? null,
      userId, venueId,
      eventType: providerStatus.providerConnected
        ? PAIRING_AUDIT_EVENTS.RECOMMENDATION_GENERATED
        : PAIRING_AUDIT_EVENTS.LOCAL_FALLBACK_USED,
      inputSummary: { hasProfile: !!existingProfile, hasCigar: !!cigarProfile, sessionPhase },
      recommendationStatus: recommendation.recommendationStatus,
      providerConnected: providerStatus.providerConnected,
      aiBacked: providerStatus.aiBacked,
      confidenceScore: recommendation.confidenceScore,
    })

    await syncSmokeCraftOrderToEAT(
      { userId, eventType: 'pairing.recommendationGenerated' },
      PAIRING_AUDIT_EVENTS.RECOMMENDATION_GENERATED
    )

    res.json({ recommendation, auditId: audit.auditId })
  } catch (err) {
    res.status(500).json({ error: 'recommendation_error', message: err.message })
  }
}

export async function generateMenuRecommendations(req, res) {
  try {
    const { userId, venueId, cigarProfile, sessionId } = req.body ?? {}

    const existingProfile = userId ? await getProfileByUser(userId) : null
    const tasteProfile = existingProfile ? buildTasteProfile(existingProfile) : null

    const result = await getMenuRecommendations({ venueId, cigarProfile, tasteProfile })

    // Build order-ready pairing payload
    const orderPairingPayload = buildOrderPairingPayload(result.recommendations)

    const audit = createPairingAuditEntry({
      userId, venueId,
      eventType: PAIRING_AUDIT_EVENTS.MENU_RECOMMENDATION_GENERATED,
      inputSummary: { hasCigar: !!cigarProfile, hasProfile: !!tasteProfile, menuSource: result.menuSource },
      recommendationStatus: 'menu_recommendation',
      providerConnected: false,
      aiBacked: false,
      menuSource: result.menuSource,
      confidenceScore: tasteProfile?.confidenceScore ?? null,
    })

    await syncSmokeCraftOrderToEAT(
      { userId, eventType: 'pairing.menuRecommendationGenerated', menuSource: result.menuSource },
      PAIRING_AUDIT_EVENTS.MENU_RECOMMENDATION_GENERATED
    )

    res.json({ ...result, orderPairingPayload, auditId: audit.auditId })
  } catch (err) {
    res.status(500).json({ error: 'menu_recommendation_error', message: err.message })
  }
}

export async function captureFlavorMemoryHandler(req, res) {
  try {
    const { userId, sessionId, visitId, ...memoryData } = req.body ?? {}
    if (!sessionId) return res.status(400).json({ error: 'missing_sessionId' })

    const record = await captureFlavorMemory({ userId, sessionId, visitId, ...memoryData })

    createPairingAuditEntry({
      userId, venueId: req.body.venueId ?? null,
      eventType: PAIRING_AUDIT_EVENTS.FLAVOR_MEMORY_CAPTURED,
      inputSummary: { sessionId, visitId, noteCount: (memoryData.flavorNotes ?? []).length },
      recommendationStatus: 'flavor_memory_captured',
      providerConnected: false,
      aiBacked: false,
      confidenceScore: null,
    })

    await syncSmokeCraftOrderToEAT(
      { userId, sessionId, eventType: 'pairing.flavorMemoryCaptured' },
      PAIRING_AUDIT_EVENTS.FLAVOR_MEMORY_CAPTURED
    )

    res.json({ flavorMemory: record, feedsPreferenceIntelligence: true })
  } catch (err) {
    res.status(500).json({ error: 'flavor_memory_error', message: err.message })
  }
}

export async function getRecommendationById(req, res) {
  try {
    const { recommendationId } = req.params
    const auditTrail = getAuditTrailForRecommendation(recommendationId)
    res.json({ recommendationId, auditTrail, found: auditTrail.length > 0 })
  } catch (err) {
    res.status(500).json({ error: 'get_recommendation_error', message: err.message })
  }
}

export async function getPairingAudit(req, res) {
  try {
    const { recommendationId } = req.params
    const trail = getAuditTrailForRecommendation(recommendationId)
    res.json({ recommendationId, auditTrail: trail, entryCount: trail.length })
  } catch (err) {
    res.status(500).json({ error: 'pairing_audit_error', message: err.message })
  }
}
