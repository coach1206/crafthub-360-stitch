import { Router }     from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { capability, speak } from '../controllers/voiceController.js'

const router = Router()

// Public — just capability metadata, no keys returned
router.get('/capability', capability)

// speak: public for prototype mode (no ElevenLabs → always returns fallback).
// When ElevenLabs IS configured, the controller enforces requireAuth internally
// so unauthenticated users cannot consume API quota.
router.post('/speak', speak)

export default router
