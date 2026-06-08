/**
 * NOVEE OS — Backend Voice Service
 *
 * Proxies text-to-speech requests to ElevenLabs when configured.
 * Falls back gracefully — callers receive { fallback: true } and
 * the frontend uses Web Speech API instead.
 *
 * API keys NEVER leave this file. No key is returned to the client.
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
const ELEVENLABS_BASE    = 'https://api.elevenlabs.io/v1'

// Per-mentor ElevenLabs voice IDs (all free-tier voices)
const VOICE_MAP = {
  dominican: 'onwK4e9ZLuTAKqWW03F9', // Daniel  — deep, measured
  nicaragua: 'VR6AewLTigWG4xSOukaG', // Arnold  — crisp, bold
  honduras:  '21m00Tcm4TlvDq8ikWAM', // Rachel  — calm, warm female
  mexico:    'pNInz6obpgDQGcFmaJgB', // Adam    — deep, authoritative
  brazil:    'XrExE9yKIg1WjnnlVkGX', // Matilda — warm female
  ecuador:   'pMsXgVXv3BLzUgSXRplE', // Serena  — calm female
  colombia:  'XB0fDUnXU5powFXDhCwa', // Charlotte— calm female
  default:   'onwK4e9ZLuTAKqWW03F9', // Daniel
}

export function isElevenLabsConfigured() {
  return ELEVENLABS_API_KEY.length > 10
}

export function getCapability() {
  return {
    provider:   isElevenLabsConfigured() ? 'elevenlabs' : 'webspeech',
    elevenlabs: isElevenLabsConfigured(),
    available:  true,
  }
}

/**
 * Calls ElevenLabs and returns a raw audio Buffer (audio/mpeg).
 * Returns null if ElevenLabs is not configured.
 * Throws on network / API errors — callers should catch and fall back.
 */
export async function synthesize(text, mentorId = 'default') {
  if (!isElevenLabsConfigured()) return null

  const voiceId = VOICE_MAP[mentorId] || VOICE_MAP.default
  const url     = `${ELEVENLABS_BASE}/text-to-speech/${voiceId}`

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'xi-api-key':   ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept:         'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.52, similarity_boost: 0.75, style: 0.0 },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => response.status)
    throw new Error(`ElevenLabs ${response.status}: ${detail}`)
  }

  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer)
}
