import { getCapability, synthesize, isElevenLabsConfigured } from '../services/voiceService.js'

/** GET /api/voice/capability — public */
export async function capability(_req, res) {
  return res.json({ success: true, data: getCapability() })
}

/**
 * POST /api/voice/speak
 * Body: { text: string, mentorId?: string }
 *
 * Prototype mode (no ElevenLabs key): always returns { fallback: true }.
 * Production mode (ElevenLabs configured): requires an authenticated session
 * to prevent unauthenticated quota consumption; unauthenticated callers still
 * receive { fallback: true } so the frontend can switch to Web Speech API.
 */
export async function speak(req, res) {
  const { text, mentorId } = req.body || {}

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ success: false, message: 'text is required' })
  }
  if (text.length > 800) {
    return res.status(400).json({ success: false, message: 'text too long (max 800 characters)' })
  }

  // No ElevenLabs key → prototype mode, always safe to return fallback
  if (!isElevenLabsConfigured()) {
    return res.json({ success: true, data: { fallback: true } })
  }

  // ElevenLabs IS configured — require an authenticated session to guard quota
  if (!req.user) {
    return res.json({ success: true, data: { fallback: true } })
  }

  try {
    const audioBuffer = await synthesize(text.trim(), mentorId || 'default')
    if (!audioBuffer) {
      return res.json({ success: true, data: { fallback: true } })
    }
    return res.json({
      success: true,
      data: {
        audio:       audioBuffer.toString('base64'),
        contentType: 'audio/mpeg',
        fallback:    false,
      },
    })
  } catch (err) {
    console.error('[VoiceController] ElevenLabs error:', err.message)
    return res.json({ success: true, data: { fallback: true } })
  }
}
