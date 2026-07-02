import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { registerSmokeEventLogSink } from '../services/smokecraft/smokeSharedStorageService.js'
import { getRankFromXP } from '../constants/session.js'
import { getSessionRewards } from '../constants/smokecraftRewards.js'
import {
  awardPassportStamp,
  recordGoldenBoxProgress,
  unlockPassportCeremony,
} from '../utils/passportProgress.js'
import {
  mergeGuestProfile,
  createResumeToken,
  validateResumeToken,
} from '../utils/passportEntry.js'
import {
  DEFAULT_VENUE_ID,
  DEFAULT_DEVICE_ID,
  DEFAULT_ENTRY_SOURCE,
} from '../data/passportEntryConfig.js'
import {
  loadSession,
  saveSession,
  createNewSession,
} from '../services/sessionStorageService.js'
import { calculateScore, getRankLabel } from '../services/leaderboardService.js'
import { GOLD_BOX_RULE_VERSION } from '../utils/smokecraftGoldBoxRules.js'
import { saveEvent } from '../services/syncQueueService.js'

// SCHEMA_VERSION is now managed in sessionStorageService (v4)

const GuestSessionContext = createContext(null)

export function GuestSessionProvider({ children }) {
  const [session, setSession] = useState(() => loadSession() || createNewSession())

  /** Atomic update: applies updater, saves to localStorage, returns next state. */
  const update = useCallback((updater) => {
    setSession(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      saveSession(next)
      return next
    })
  }, [])

  // SmokeCraft backend success/status events (Phase 10B) — registered once;
  // smokeSharedStorageService fires these only on real ok:true responses,
  // never speculatively, never from a render path.
  useEffect(() => {
    registerSmokeEventLogSink((type, payload) => {
      update(prev => {
        const existingLog = prev.smokeCraft?.eventLog || []
        return {
          ...prev,
          smokeCraft: {
            ...prev.smokeCraft,
            eventLog: [...existingLog, { type, timestamp: Date.now(), payload }].slice(-50),
          },
        }
      })
    })
  }, [update])

  // ── Profile (display) ─────────────────────────────────────────────────────
  const updateProfile = useCallback((fields) => {
    update(prev => ({ ...prev, profile: { ...prev.profile, ...fields } }))
  }, [update])

  // ── SmokeCraft steps ──────────────────────────────────────────────────────
  const completeStep = useCallback((stepId) => {
    update(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId],
      currentSmokecraftStep: stepId,
    }))
  }, [update])

  // ── XP ────────────────────────────────────────────────────────────────────
  const addXP = useCallback((amount) => {
    update(prev => {
      const newXP = prev.xp + amount
      return { ...prev, xp: newXP, rank: getRankFromXP(newXP).name }
    })
  }, [update])

  // ── Badges ────────────────────────────────────────────────────────────────
  const addBadge = useCallback((badge) => {
    update(prev => ({
      ...prev,
      badges: prev.badges.find(b => b.id === badge.id)
        ? prev.badges
        : [...prev.badges, { ...badge, earnedAt: Date.now() }],
    }))
  }, [update])

  // ── SmokeCraft: idempotent session reward award ───────────────────────────
  /**
   * Awards XP + badges for a SmokeCraft session in a single atomic update.
   * Fully idempotent: if the session is already in completedSteps, this is
   * a no-op — XP and badges will not be re-awarded.
   *
   * Usage:  awardSessionRewards('enroll')
   * Replaces manual addXP(n) + addBadge({...}) pairs in session pages.
   */
  const awardSessionRewards = useCallback((sessionId) => {
    const rewards = getSessionRewards(sessionId)
    if (!rewards) return
    update(prev => {
      // Guard: already completed — skip entirely
      if (prev.completedSteps.includes(sessionId)) return prev

      // Step
      const completedSteps = [...prev.completedSteps, sessionId]

      // XP
      const newXP = prev.xp + rewards.xp
      const rank  = getRankFromXP(newXP).name

      // Badges — deduplicate against existing awards
      const existingIds = new Set(prev.badges.map(b => b.id))
      const newBadges = rewards.sessionBadges
        .filter(b => !existingIds.has(b.id))
        .map(b => ({ ...b, earnedAt: Date.now() }))

      return {
        ...prev,
        completedSteps,
        currentSmokecraftStep: sessionId,
        xp: newXP,
        rank,
        badges: [...prev.badges, ...newBadges],
      }
    })
  }, [update])

  // ── Passport stamps ───────────────────────────────────────────────────────
  /** Primary stamp award — validates against catalog, prevents duplicates, sets latestStampId. */
  const awardStamp = useCallback((stampId, source = 'unknown', extra = {}) => {
    update(prev => awardPassportStamp(prev, stampId, source, extra))
  }, [update])

  /** @deprecated Use awardStamp(stampId, source). Kept for backward compat. */
  const addSmokecraftStamp = useCallback((stamp) => {
    update(prev => awardPassportStamp(prev, stamp.id, stamp.source || 'legacy'))
  }, [update])

  // ── Ceremony ──────────────────────────────────────────────────────────────
  const unlockCeremony = useCallback((stampId) => {
    update(prev => unlockPassportCeremony(prev, stampId))
  }, [update])

  // ── Golden Box ────────────────────────────────────────────────────────────
  const updateGoldenBoxProgress = useCallback((payload) => {
    update(prev => recordGoldenBoxProgress(prev, payload))
  }, [update])

  // ── Social / ordering ─────────────────────────────────────────────────────
  const setMentors = useCallback((mentors) => {
    update(prev => ({ ...prev, mentors }))
  }, [update])

  const addFavorite = useCallback((item) => {
    update(prev => ({
      ...prev,
      favorites: prev.favorites.find(f => f.id === item.id)
        ? prev.favorites
        : [...prev.favorites, item],
    }))
  }, [update])

  const addPendingOrder = useCallback((order) => {
    update(prev => ({
      ...prev,
      pendingOrders: [...prev.pendingOrders, { ...order, addedAt: Date.now() }],
    }))
  }, [update])

  // ── Phase 4: Entry identity ───────────────────────────────────────────────

  const startPassportEntry = useCallback((payload = {}) => {
    update(prev => {
      const now = Date.now()
      return {
        ...prev,
        guestId:        prev.guestId        || payload.guestId      || `g_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        venueId:        payload.venueId      || prev.venueId         || DEFAULT_VENUE_ID,
        deviceId:       payload.deviceId     || prev.deviceId        || DEFAULT_DEVICE_ID,
        entrySource:    payload.entrySource  || prev.entrySource     || DEFAULT_ENTRY_SOURCE,
        entryStartedAt: prev.entryStartedAt  || now,
        lastActiveAt:   now,
      }
    })
  }, [update])

  const updateGuestProfile = useCallback((profile) => {
    update(prev => mergeGuestProfile(prev, profile))
  }, [update])

  const completeGuestProfile = useCallback((profile) => {
    update(prev => {
      const merged = mergeGuestProfile(prev, profile)
      const token  = createResumeToken(merged)
      return {
        ...merged,
        profileComplete: true,
        resumeToken:     token,
        leaderboard: {
          ...merged.leaderboard,
          displayName: merged.leaderboard?.displayName || merged.profile?.nickname || null,
        },
      }
    })
  }, [update])

  const refreshLastActive = useCallback(() => {
    update(prev => ({ ...prev, lastActiveAt: Date.now() }))
  }, [update])

  const resumePassportSession = useCallback((token) => {
    const parsed = validateResumeToken(token)
    if (!parsed) return
    update(prev => ({ ...prev, resumeToken: token, lastActiveAt: Date.now() }))
  }, [update])

  const clearPassportIdentity = useCallback(() => {
    update(prev => ({
      ...prev,
      guestId:         null,
      venueId:         DEFAULT_VENUE_ID,
      deviceId:        DEFAULT_DEVICE_ID,
      entrySource:     DEFAULT_ENTRY_SOURCE,
      entryStartedAt:  null,
      lastActiveAt:    null,
      guestProfile:    null,
      profileComplete: false,
      resumeToken:     null,
    }))
  }, [update])

  // ── Preferences & routing (Phase 4 Part 2) ───────────────────────────────
  const setAudioEnabled = useCallback((val) => {
    update(prev => ({
      ...prev,
      audioEnabled: !!val,
      preferences:  { ...prev.preferences, audioEnabled: !!val },
    }))
  }, [update])

  const setHapticsEnabled = useCallback((val) => {
    update(prev => ({
      ...prev,
      hapticsEnabled: !!val,
      preferences:    { ...prev.preferences, hapticsEnabled: !!val },
    }))
  }, [update])

  const trackRoute = useCallback((route) => {
    if (!route || typeof route !== 'string') return
    update(prev => ({
      ...prev,
      lastVisitedRoute: route,
      system: { ...prev.system, lastVisitedRoute: route },
    }))
  }, [update])

  // ── Phase 6: Selection tracking ───────────────────────────────────────────

  /** Records the craft the guest entered (e.g. "SmokeCraft 360"). */
  const setSelectedCraft = useCallback((craft) => {
    update(prev => ({
      ...prev,
      selectedCraft: craft,
      system: { ...prev.system, sourceModule: craft || prev.system?.sourceModule },
    }))
  }, [update])

  /** Records the selected mentor and their origin country. */
  const setSelectedMentor = useCallback((mentorId, country) => {
    update(prev => ({
      ...prev,
      selectedMentor:        mentorId,
      selectedMentorCountry: country || null,
    }))
  }, [update])

  /** Records the cigar format selected before seed, soil, and leaf work. */
  const setSmokeCraftFormat = useCallback((format, awardXp = 0) => {
    update(prev => {
      const previousFormat = prev.smokeCraft?.selectedFormat
      const alreadyAwarded = Boolean(prev.smokeCraft?.formatXpAwarded)
      const xpToAward = alreadyAwarded ? 0 : awardXp
      const newXP = (prev.xp || 0) + xpToAward
      return {
        ...prev,
        xp:   newXP,
        rank: getRankFromXP(newXP).name,
        smokeCraft: {
          ...prev.smokeCraft,
          selectedFormat: {
            ...format,
            savedAt: Date.now(),
          },
          formatHistory: [
            ...(prev.smokeCraft?.formatHistory || []),
            { ...format, savedAt: Date.now() },
          ].slice(-6),
          formatXpAwarded: alreadyAwarded || xpToAward > 0,
          formatXpAwardedFor: alreadyAwarded
            ? prev.smokeCraft?.formatXpAwardedFor
            : format.id,
          pendingPassportStamp: {
            id: 'format-guide-completed',
            name: 'Format Guide Completed',
            source: 'format',
            preparedAt: Date.now(),
          },
        },
        selectedFormat: format.id,
        selectedFormatName: format.name,
        currentSmokecraftStep: 'format',
        lastFormatChanged: previousFormat?.id !== format.id ? Date.now() : prev.lastFormatChanged,
      }
    })
  }, [update])

  /** Records the selected experience level (Novice / Enthusiast / Connoisseur / Aficionado). */
  const setSelectedLevel = useCallback((level) => {
    update(prev => ({ ...prev, selectedLevel: level }))
  }, [update])

  /**
   * Records how the guest is obtaining their cigar (request from humidor vs.
   * already has one).
   *
   * HUMIDOR_REQUEST stages a POS 3 pending handoff and an E.A.T. staff event,
   * and writes both to the central smokeCraft.eventLog. This is local/
   * session-backed only — no real POS ticket is created and no staff member
   * is actually notified by this call; "pending" + "staffActionRequired" are
   * the honest state until a real integration consumes these signals.
   *
   * GUEST_HAS_CIGAR creates no POS/E.A.T. signals — only a confirmed log entry.
   */
  const setRequestPurchaseChoice = useCallback((choice) => {
    update(prev => {
      const now = Date.now()
      const requestPurchaseChoice = {
        requestPurchaseChoice: choice.id,
        label: choice.label,
        actionType: choice.actionType,
        timestamp: now,
      }
      const existingLog = prev.smokeCraft?.eventLog || []

      const next = {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          requestPurchaseChoice,
        },
      }

      if (choice.actionType === 'HUMIDOR_REQUEST') {
        const pos3Handoff = {
          eventType:  'POS_HANDOFF_CREATED',
          actionType: 'HUMIDOR_REQUEST',
          status:     'pending',
          userId:     prev.guestId || prev.profile?.email || null,
          sessionId:  prev.sessionId || null,
          venueId:    prev.venueId || null,
          tableId:    prev.pos3?.tableNumber || null,
          productId:  prev.smokeCraft?.selectedFormat?.id || null,
          quantity:   1,
          timestamp:  now,
        }
        const eatEvent = {
          eventType:           'EAT_EVENT_CREATED',
          actionType:          'CIGAR_REQUESTED',
          status:              'pending',
          venueId:             prev.venueId || null,
          tableId:             prev.pos3?.tableNumber || null,
          userId:              prev.guestId || prev.profile?.email || null,
          sessionId:           prev.sessionId || null,
          managerAlert:        true,
          staffActionRequired: true,
          timestamp:           now,
        }

        next.pos3 = {
          ...prev.pos3,
          pendingHumidorRequest: pos3Handoff,
        }
        next.eatCommand = {
          ...prev.eatCommand,
          pendingStaffEvent: eatEvent,
        }
        next.smokeCraft.eventLog = [...existingLog, pos3Handoff, eatEvent].slice(-50)
      } else {
        next.smokeCraft.eventLog = [
          ...existingLog,
          {
            eventType:  'CIGAR_PROVIDED_BY_GUEST',
            actionType: 'GUEST_HAS_CIGAR',
            status:     'confirmed',
            sessionId:  prev.sessionId || null,
            timestamp:  now,
          },
        ].slice(-50)
      }

      return next
    })
  }, [update])

  /** Records the guest's selected humidor storage condition and what it implies. */
  const setHumidorMatchSelection = useCallback((choice) => {
    update(prev => {
      const now = Date.now()
      const existingLog = prev.smokeCraft?.eventLog || []
      const humidorMatch = { conditionId: choice.id, label: choice.label, desc: choice.desc, timestamp: now }
      const event = {
        eventType:  'HUMIDOR_CONDITION_SELECTED',
        actionType: choice.id,
        label:      choice.label,
        timestamp:  now,
      }
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          humidorMatch,
          eventLog: [...existingLog, event].slice(-50),
        },
      }
    })
  }, [update])

  /**
   * Records the guest's chosen Phase 6 recommendation (Best Match / Step-Up
   * Pick / Venue Featured Pick). Persists exactly the spec'd field set so
   * Phase 11 (Scorecard), Phase 12 (Passport Stamp) and Phase 13 (Passport
   * Connections) can read real cigar attributes instead of the null
   * placeholders those phases previously had to fall back to.
   */
  const setSelectedHumidorRecommendation = useCallback((recommendation) => {
    update(prev => {
      const now = Date.now()
      const existingLog = prev.smokeCraft?.eventLog || []
      const selectedHumidorRecommendation = {
        selectedRecommendationType:  recommendation.recommendationType,
        selectedCigarId:             recommendation.cigarId,
        selectedCigarName:           recommendation.cigarName,
        selectedCigarCountry:        recommendation.cigarCountry,
        selectedCigarType:           recommendation.cigarType,
        selectedWrapper:             recommendation.wrapper,
        selectedStrength:            recommendation.strength,
        selectedBurnTime:            recommendation.burnTime,
        selectedPairingSuggestion:   recommendation.pairingSuggestion,
        selectedMentorNote:          recommendation.mentorNote,
        selectedMatchScore:          recommendation.matchScore,
        selectedAt:                  now,
      }
      const event = {
        eventType:  'HUMIDOR_RECOMMENDATION_SELECTED',
        actionType: recommendation.recommendationType,
        label:      recommendation.cigarName,
        timestamp:  now,
      }
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          selectedHumidorRecommendation,
          eventLog: [...existingLog, event].slice(-50),
        },
      }
    })
  }, [update])

  /**
   * Records that the guest accepted the Golden Box challenge / Gold Box Rules.
   * Preserves the original `smokeCraft.goldenBox.accepted` field (read directly
   * by the Phase 11 scoring/badge evaluators in smokecraftScoring.js) and
   * additively records the Phase 5 spec'd `goldBoxRules` field set alongside it.
   */
  const setGoldenBoxAccepted = useCallback(() => {
    update(prev => {
      const now = Date.now()
      const existingLog = prev.smokeCraft?.eventLog || []
      const event = { eventType: 'GOLDEN_BOX_ACCEPTED', timestamp: now }
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          goldenBox: { ...prev.smokeCraft?.goldenBox, accepted: true, acceptedAt: now },
          goldBoxRules: {
            ...prev.smokeCraft?.goldBoxRules,
            goldBoxAccepted: true,
            goldBoxAcceptedAt: now,
            goldBoxRuleVersion: GOLD_BOX_RULE_VERSION,
          },
          eventLog: [...existingLog, event].slice(-50),
        },
      }
    })
  }, [update])

  /** Records that the guest opened the Gold Box "View Scoring" panel. */
  const setGoldBoxViewedScoring = useCallback(() => {
    update(prev => {
      const now = Date.now()
      const existingLog = prev.smokeCraft?.eventLog || []
      const event = { eventType: 'GOLD_BOX_SCORING_VIEWED', timestamp: now }
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          goldBoxRules: {
            ...prev.smokeCraft?.goldBoxRules,
            goldBoxViewedScoring: true,
          },
          eventLog: [...existingLog, event].slice(-50),
        },
      }
    })
  }, [update])

  /** Records that the guest started their Gold Box session (after accepting rules). */
  const setGoldBoxSessionStarted = useCallback(() => {
    update(prev => {
      const now = Date.now()
      const existingLog = prev.smokeCraft?.eventLog || []
      const event = { eventType: 'GOLD_BOX_SESSION_STARTED', timestamp: now }
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          goldBoxRules: {
            ...prev.smokeCraft?.goldBoxRules,
            goldBoxSessionStartedAt: now,
          },
          eventLog: [...existingLog, event].slice(-50),
        },
      }
    })
  }, [update])

  /**
   * Records which cut/toast/light prep steps the guest actually completed
   * (rather than discarding the checklist state on navigation). Writes a
   * truthful PREP_STEPS_COMPLETED event to smokeCraft.eventLog — status is
   * "complete" only when all 3 steps were checked, otherwise "partial".
   */
  const setCutToastLightProgress = useCallback((payload) => {
    update(prev => {
      const now = Date.now()
      const existingLog = prev.smokeCraft?.eventLog || []
      const cutToastLight = { ...payload, timestamp: now }
      const event = {
        eventType:       'PREP_STEPS_COMPLETED',
        actionType:      'CUT_TOAST_LIGHT',
        stepsCompleted:  payload.stepsCompleted,
        allStepsCompleted: payload.allStepsCompleted,
        completedCount:  payload.completedCount,
        totalSteps:      payload.totalSteps,
        status:          payload.allStepsCompleted ? 'complete' : 'partial',
        timestamp:       now,
      }

      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          cutToastLight,
          eventLog: [...existingLog, event].slice(-50),
        },
      }
    })
  }, [update])

  /**
   * Records the guest's First Third flavor-note and draw-rating selections
   * (rather than discarding them on navigation). Status is "complete" only
   * when at least one note was selected AND a draw rating was given,
   * otherwise "partial" — the truth of what was actually tasted/recorded.
   */
  const setFirstThirdTasting = useCallback((payload) => {
    update(prev => {
      const now = Date.now()
      const existingLog = prev.smokeCraft?.eventLog || []
      const firstThird = { ...payload, timestamp: now }
      const event = {
        eventType:      'TASTING_RECORDED',
        actionType:     'FIRST_THIRD',
        notesSelected:  payload.notesSelected,
        notesCount:     payload.notesCount,
        drawRating:     payload.drawRating,
        hasDrawRating:  payload.hasDrawRating,
        status:         (payload.notesCount > 0 && payload.hasDrawRating) ? 'complete' : 'partial',
        timestamp:      now,
      }

      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          firstThird,
          eventLog: [...existingLog, event].slice(-50),
        },
      }
    })
  }, [update])

  /**
   * Records the guest's Second Third flavor-note and rating selections,
   * mirroring setFirstThirdTasting. Status is "complete" only when at least
   * one note was selected AND a rating was given, otherwise "partial".
   */
  const setSecondThirdTasting = useCallback((payload) => {
    update(prev => {
      const now = Date.now()
      const existingLog = prev.smokeCraft?.eventLog || []
      const secondThird = { ...payload, timestamp: now }
      const event = {
        eventType:      'TASTING_RECORDED',
        actionType:     'SECOND_THIRD',
        notesSelected:  payload.notesSelected,
        notesCount:     payload.notesCount,
        rating:         payload.rating,
        hasRating:      payload.hasRating,
        status:         (payload.notesCount > 0 && payload.hasRating) ? 'complete' : 'partial',
        timestamp:      now,
      }

      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          secondThird,
          eventLog: [...existingLog, event].slice(-50),
        },
      }
    })
  }, [update])

  /**
   * Records the guest's Final Third flavor-note and overall-rating selections,
   * mirroring setFirstThirdTasting. Status is "complete" only when at least
   * one note was selected AND an overall rating was given, otherwise "partial".
   */
  const setFinalThirdTasting = useCallback((payload) => {
    update(prev => {
      const now = Date.now()
      const existingLog = prev.smokeCraft?.eventLog || []
      const finalThird = { ...payload, timestamp: now }
      const event = {
        eventType:      'TASTING_RECORDED',
        actionType:     'FINAL_THIRD',
        notesSelected:  payload.notesSelected,
        notesCount:     payload.notesCount,
        overallRating:  payload.overallRating,
        hasOverallRating: payload.hasOverallRating,
        status:         (payload.notesCount > 0 && payload.hasOverallRating) ? 'complete' : 'partial',
        timestamp:      now,
      }

      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          finalThird,
          eventLog: [...existingLog, event].slice(-50),
        },
      }
    })
  }, [update])

  // ── Phase 6: SmokeCraft Session 1 completion ──────────────────────────────

  /**
   * Atomic action that wires all Phase 6 data on session completion:
   *  - Awards SmokeCraft 360 Initiation Stamp to passport.earnedStamps
   *  - Updates leaderboard score + rank
   *  - Adds to smokeCraft.completedSessions
   *  - Calculates eatCommand.engagementScore
   *  - Populates pos3.suggestedPairings
   *
   * Call this ALONGSIDE the existing addXP / completeStep / awardStamp calls
   * in SessionComplete — it handles the NEW data fields only, so nothing doubles.
   */
  const completeSmokeCraftSession = useCallback((sessionData = {}) => {
    let syncedSessionId = null
    update(prev => {
      const now = Date.now()
      syncedSessionId = prev.sessionId

      // Rich initiation stamp for the new passport model
      const initiationStamp = {
        stampId:       'smokecraft-session-1-initiation',
        title:         'SmokeCraft 360 Initiation Stamp',
        craft:         'SmokeCraft 360',
        sessionNumber: 1,
        eventName:     prev.passport?.eventName || 'The Grand Lounge',
        earnedAt:      now,
        visualTheme:   'gold',
        points:        150,
        sourceModule:  'smokecraft-session-1',
      }

      const prevEarned     = prev.passport?.earnedStamps || []
      const alreadyEarned  = prevEarned.find(s => s.stampId === initiationStamp.stampId)
      const newEarned      = alreadyEarned ? prevEarned : [...prevEarned, initiationStamp]

      const completedSessions  = prev.smokeCraft?.completedSessions || []
      const alreadyLogged      = completedSessions.find(s => s.sessionId === prev.sessionId)

      // Build partial next state for score calculation
      const partialNext = {
        ...prev,
        completedSteps: prev.completedSteps.includes('session-complete')
          ? prev.completedSteps
          : [...prev.completedSteps, 'session-complete'],
        passport: {
          ...prev.passport,
          earnedStamps:  newEarned,
          latestStampId: initiationStamp.stampId,
          passportId:    prev.passport?.passportId || `PP-${now.toString(36).toUpperCase()}`,
        },
      }

      const lbScore = calculateScore(partialNext)
      const lbRank  = getRankLabel(lbScore)

      return {
        ...partialNext,
        leaderboardScore: lbScore,
        leaderboard: {
          ...prev.leaderboard,
          score:       lbScore,
          rank:        lbRank,
          displayName: prev.leaderboard?.displayName || prev.profile?.nickname || null,
        },
        smokeCraft: {
          ...prev.smokeCraft,
          completedSessions: alreadyLogged
            ? completedSessions
            : [...completedSessions, {
                sessionId:   prev.sessionId,
                completedAt: now,
                craft:       prev.selectedCraft || 'SmokeCraft 360',
                mentor:      prev.selectedMentor,
                level:       prev.selectedLevel,
                xpEarned:    prev.xp,
                ...sessionData,
              }],
          currentSession: null,
        },
        eatCommand: {
          ...prev.eatCommand,
          engagementScore: Math.round(
            Math.min(
              (partialNext.completedSteps.length * 15) +
              (newEarned.length * 50) +
              ((prev.xp || 0) * 0.1),
              500
            )
          ),
          sessionValue: (prev.smokeCraft?.pairingSelections?.length || 0) * 8 + 45,
        },
        pos3: {
          ...prev.pos3,
          suggestedPairings: prev.pos3?.suggestedPairings?.length ? prev.pos3.suggestedPairings : [
            { type: 'spirit',   name: 'Single Malt Scotch', reason: 'Full-body complement' },
            { type: 'spirit',   name: 'Añejo Rum',          reason: 'Tropical harmony' },
            { type: 'beverage', name: 'Dark Espresso',       reason: 'Earthy contrast' },
            { type: 'food',     name: 'Dark Chocolate 72%', reason: 'Bitter-sweet pairing' },
          ],
        },
      }
    })
    if (syncedSessionId) {
      saveEvent({
        sourceSystem: 'SMOKECRAFT',
        eventType: 'SmokeCraftCompleted',
        entityId: syncedSessionId,
        payload: { sessionData },
      }).catch(() => {})
    }
  }, [update])

  // ── Phase 6: Activity sync ────────────────────────────────────────────────

  /** Refreshes POS 3 pairings from current session state. */
  const syncPos3Activity = useCallback(() => {
    update(prev => ({
      ...prev,
      pos3: {
        ...prev.pos3,
        suggestedPairings: prev.pos3?.suggestedPairings?.length ? prev.pos3.suggestedPairings : [
          { type: 'spirit',   name: 'Single Malt Scotch', reason: 'Full-body complement' },
          { type: 'spirit',   name: 'Añejo Rum',          reason: 'Tropical harmony' },
          { type: 'beverage', name: 'Dark Espresso',       reason: 'Earthy contrast' },
          { type: 'food',     name: 'Dark Chocolate 72%', reason: 'Bitter-sweet pairing' },
        ],
      },
    }))
  }, [update])

  /** Recalculates E.A.T. engagement score from current session state. */
  const syncEATActivity = useCallback(() => {
    update(prev => {
      const score = Math.round(
        Math.min(
          (prev.completedSteps?.length || 0) * 15 +
          (prev.xp || 0) * 0.1 +
          (prev.profileComplete ? 30 : 0) +
          ((prev.passport?.earnedStamps?.length || prev.smokecraftStamps?.length || 0) * 50),
          500
        )
      )
      return {
        ...prev,
        eatCommand: {
          ...prev.eatCommand,
          engagementScore: score,
          sessionValue:    (prev.smokeCraft?.pairingSelections?.length || 0) * 8 +
                           (prev.completedSteps?.includes('session-complete') ? 45 : 0),
        },
      }
    })
  }, [update])

  // ── Phase 13: 360 Passport Connections / Networking consent ──────────────
  /** Merges user-controlled sharing consent fields. Never auto-grants any field. */
  const setNetworkingConsent = useCallback((fields) => {
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        networkingConsent: { ...prev.smokeCraft?.networkingConsent, ...fields },
      },
    }))
  }, [update])

  /**
   * Records a single honest networking action outcome into
   * smokeCraft.passportConnections — read by smokeWinnerService's
   * "Passport Connector" eligibility check, closing the Phase 12→13
   * gamification loop. Never writes a "shared"/"connected" status unless
   * the corresponding consent was actually granted; no backend call is made
   * or implied (no real SMS/email/connection happens here today).
   */
  const recordPassportConnectionAction = useCallback((actionId, status) => {
    update(prev => {
      const existing = prev.smokeCraft?.passportConnections || []
      const next = existing.filter(c => c.actionId !== actionId)
      next.push({ actionId, status, timestamp: Date.now() })
      const anyShared = next.some(c => c.status === 'shared_locally' || c.status === 'connection_pending')
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          passportConnections: next,
          networkingStatus: anyShared ? 'shared_locally' : (prev.smokeCraft?.networkingStatus || 'not_started'),
        },
      }
    })
  }, [update])

  // ── Session reset ─────────────────────────────────────────────────────────
  const resetGuestSession = useCallback(() => {
    const fresh = createNewSession()
    saveSession(fresh)
    setSession(fresh)
  }, [])

  /** @deprecated Use resetGuestSession. */
  const resetSession = resetGuestSession

  return (
    <GuestSessionContext.Provider value={{
      session,
      update,
      // Profile
      updateProfile,
      // SmokeCraft steps
      completeStep,
      addXP,
      addBadge,
      awardSessionRewards,
      // Stamps
      awardStamp,
      addSmokecraftStamp,
      unlockCeremony,
      updateGoldenBoxProgress,
      // Social
      setMentors,
      addFavorite,
      addPendingOrder,
      // Phase 4: Entry identity
      startPassportEntry,
      updateGuestProfile,
      completeGuestProfile,
      refreshLastActive,
      resumePassportSession,
      clearPassportIdentity,
      // Phase 4 Part 2: Preferences & routing
      setAudioEnabled,
      setHapticsEnabled,
      trackRoute,
      // Phase 6: Selection tracking
      setSelectedCraft,
      setSelectedMentor,
      setSmokeCraftFormat,
      setSelectedLevel,
      setRequestPurchaseChoice,
      setCutToastLightProgress,
      setHumidorMatchSelection,
      setSelectedHumidorRecommendation,
      setGoldenBoxAccepted,
      setGoldBoxViewedScoring,
      setGoldBoxSessionStarted,
      setFirstThirdTasting,
      setSecondThirdTasting,
      setFinalThirdTasting,
      // Phase 6: Session completion
      completeSmokeCraftSession,
      syncPos3Activity,
      syncEATActivity,
      // Phase 13: Networking consent / connections
      setNetworkingConsent,
      recordPassportConnectionAction,
      // Reset
      resetGuestSession,
      resetSession,
    }}>
      {children}
    </GuestSessionContext.Provider>
  )
}

export function useGuestSession() {
  const ctx = useContext(GuestSessionContext)
  if (!ctx) throw new Error('useGuestSession must be used within GuestSessionProvider')
  return ctx
}
