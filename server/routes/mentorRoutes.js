/**
 * Mentor Routes — /api/mentor/*
 * All routes require Human Mentor authentication (or Founder L0).
 * Mentor accounts are created by Admin only — no self-registration.
 */

import { Router }         from 'express'
import { requireAuth }    from '../middleware/authMiddleware.js'
import { requireMentor }  from '../middleware/roleMiddleware.js'
import * as mentor        from '../controllers/mentorController.js'

const router = Router()

// All mentor routes require authentication + mentor role
router.use(requireAuth, requireMentor)

// ── Profile ───────────────────────────────────────────────────
router.get('/profile', mentor.getMentorProfile)

// ── Assigned sessions ─────────────────────────────────────────
router.get('/sessions',                             mentor.getMentorSessions)
router.get('/sessions/:sessionId',                  mentor.getMentorSession)
router.get('/sessions/:sessionId/progress',         mentor.getLearnerProgress)
router.patch('/sessions/:sessionId/progress',       mentor.updateLearnerProgress)
router.post('/sessions/:sessionId/notes',           mentor.addMentorNote)

// ── Content library ───────────────────────────────────────────
router.get('/content', mentor.getMentorContent)

// ── Pairing recommendations ───────────────────────────────────
router.get('/pairings', mentor.getPairingRecommendations)

export default router
