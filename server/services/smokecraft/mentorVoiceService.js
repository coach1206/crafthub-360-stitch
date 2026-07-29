/**
 * Holistic Fix 5B-2B-1 — server-authoritative SmokeCraft mentor-voice
 * foundation.
 *
 * Every rule below exists because of a real class of defect found in
 * this operation's prior passes (SC-D033/036/041/052 — missing guest
 * identity; the recurring "never fabricate" discipline from
 * mentorGuidanceService.js):
 *
 *   - The ElevenLabs API key never leaves this file. No route,
 *     controller, or response payload ever includes it.
 *   - Preview text is never arbitrary client input — every mentor has
 *     exactly one server-owned approved preview sentence (a short,
 *     already-approved excerpt of their real roster greeting). The
 *     client can only select WHICH mentor and (bounded) speed/style —
 *     never WHAT is said.
 *   - Voice IDs are never invented. MENTOR_VOICE_PROFILES only assigns
 *     a voiceId to a mentor when a real, already-configured ElevenLabs
 *     voice ID exists (reused from the pre-existing NOVEE OS
 *     server/services/voiceService.js VOICE_MAP, itself already-real
 *     production voice IDs — not new fabricated data). Every other
 *     mentor is explicitly marked inactive/unavailable.
 *   - A provider error, timeout, or missing API key always returns an
 *     honest `unavailable`/`provider_error` status — never a fabricated
 *     successful audio response.
 */
import { getDb } from '../../db/connection.js'
import crypto from 'crypto'
import { MENTORS, getMentorById } from '../../../src/modules/smokecraft/smokeCraftMentors.js'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'
const PROVIDER_TIMEOUT_MS = 12000
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes, bounded lifetime

export function isElevenLabsConfigured() {
  return ELEVENLABS_API_KEY.length > 10
}

export class MentorVoiceError extends Error {
  constructor(code) { super(code); this.code = code }
}

// Real, already-configured ElevenLabs voice IDs, reused verbatim from
// the pre-existing NOVEE OS voice service (server/services/voiceService.js
// VOICE_MAP) — not invented for this pass. Mentors not listed here have
// no real configured voice and are marked inactive below.
const REAL_CONFIGURED_VOICE_IDS = {
  dominican: 'onwK4e9ZLuTAKqWW03F9', // Daniel — deep, measured
  nicaragua: 'VR6AewLTigWG4xSOukaG', // Arnold — crisp, bold
  honduras: '21m00Tcm4TlvDq8ikWAM',  // Rachel — calm, warm female
  mexico: 'pNInz6obpgDQGcFmaJgB',    // Adam — deep, authoritative
  brazil: 'XrExE9yKIg1WjnnlVkGX',    // Matilda — warm female
}

const ALLOWED_SPEEDS = [0.75, 0.9, 1.0, 1.1, 1.25]
const DEFAULT_SPEED = 1.0

function approvedPreviewText(mentor) {
  // Server-owned, short (<220 char) excerpt of the mentor's own real,
  // already-approved roster greeting — never client-supplied text.
  const g = mentor.greeting || mentor.bio || mentor.name
  return g.length > 220 ? `${g.slice(0, 217)}...` : g
}

export function listVoiceProfiles() {
  return MENTORS.map(m => {
    const voiceId = REAL_CONFIGURED_VOICE_IDS[m.id] || null
    return {
      mentorId: m.id,
      displayName: m.name,
      active: Boolean(voiceId),
      defaultSpeed: DEFAULT_SPEED,
      allowedSpeeds: ALLOWED_SPEEDS,
      stability: 0.52,
      style: 0.0,
      language: 'en',
      fallbackBehavior: 'webspeech',
      previewText: approvedPreviewText(m),
    }
  })
}

export function getVoiceProfile(mentorId) {
  const mentor = getMentorById(mentorId)
  if (!mentor) return null
  const voiceId = REAL_CONFIGURED_VOICE_IDS[mentorId] || null
  return {
    mentorId: mentor.id,
    displayName: mentor.name,
    active: Boolean(voiceId),
    voiceId,
    defaultSpeed: DEFAULT_SPEED,
    allowedSpeeds: ALLOWED_SPEEDS,
    stability: 0.52,
    style: 0.0,
    language: 'en',
    fallbackBehavior: 'webspeech',
    previewText: approvedPreviewText(mentor),
  }
}

function normalizeSpeed(speed) {
  const n = Number(speed)
  return ALLOWED_SPEEDS.includes(n) ? n : DEFAULT_SPEED
}

function textHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 32)
}

// In-flight request dedupe — protects against a duplicate ElevenLabs
// provider charge from a rapid double-click on Preview Voice before the
// first request has finished. Keyed by mentorId:speed (the request is
// always for the same server-owned text at a given mentor+speed, so
// this key fully identifies "the same synthesis").
const _inFlight = new Map()

async function fetchFromCache(db, mentorId, speed, hash) {
  const row = await db.query(
    `SELECT * FROM smokecraft_voice_preview_cache WHERE mentor_id = $1 AND speed = $2 AND text_hash = $3 AND expires_at > now()`,
    [mentorId, speed, hash]
  )
  return row.rows[0] || null
}

async function saveToCache(db, { mentorId, speed, hash, transcript, audioBase64, contentType, voiceId, requestId }) {
  await db.query(
    `INSERT INTO smokecraft_voice_preview_cache (mentor_id, speed, text_hash, transcript, audio_base64, content_type, voice_id, request_id, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now() + interval '30 minutes')
     ON CONFLICT (mentor_id, speed, text_hash) DO UPDATE SET
       transcript = EXCLUDED.transcript, audio_base64 = EXCLUDED.audio_base64,
       content_type = EXCLUDED.content_type, voice_id = EXCLUDED.voice_id,
       request_id = EXCLUDED.request_id, expires_at = now() + interval '30 minutes'`,
    [mentorId, speed, hash, transcript, audioBase64, contentType, voiceId, requestId]
  )
}

async function callElevenLabs(voiceId, text, requestId) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
  try {
    const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.52, similarity_boost: 0.75, style: 0.0 },
      }),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => String(response.status))
      throw new MentorVoiceError('provider_error')
    }
    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer)
  } catch (err) {
    if (err.name === 'AbortError') throw new MentorVoiceError('provider_timeout')
    if (err instanceof MentorVoiceError) throw err
    throw new MentorVoiceError('provider_error')
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Generates (or reuses a cached) preview for a mentor's voice.
 * Never fabricates a successful audio response — every non-`ready`
 * outcome is an honest, explicit status.
 */
export async function generatePreview({ mentorId, speed }) {
  const requestId = crypto.randomUUID()
  const profile = getVoiceProfile(mentorId)
  if (!profile) throw new MentorVoiceError('mentor_not_found')

  const normalizedSpeed = normalizeSpeed(speed)
  const transcript = profile.previewText

  if (!profile.active) {
    return {
      status: 'unavailable', reason: 'no_voice_configured',
      mentorId, transcript, requestId, provider: 'none', fromCache: false,
    }
  }
  if (!isElevenLabsConfigured()) {
    return {
      status: 'unavailable', reason: 'provider_not_configured',
      mentorId, transcript, requestId, provider: 'none', fromCache: false,
    }
  }

  const db = getDb()
  const hash = textHash(`${transcript}::${normalizedSpeed}`)

  const cached = await fetchFromCache(db, mentorId, normalizedSpeed, hash)
  if (cached) {
    return {
      status: 'ready', mentorId, transcript,
      audio: cached.audio_base64, contentType: cached.content_type,
      requestId, provider: 'elevenlabs', fromCache: true,
      speed: normalizedSpeed,
    }
  }

  const inFlightKey = `${mentorId}:${normalizedSpeed}`
  if (_inFlight.has(inFlightKey)) {
    const result = await _inFlight.get(inFlightKey)
    return { ...result, requestId, fromCache: true }
  }

  const work = (async () => {
    try {
      const audioBuffer = await callElevenLabs(profile.voiceId, transcript, requestId)
      const audioBase64 = audioBuffer.toString('base64')
      await saveToCache(db, {
        mentorId, speed: normalizedSpeed, hash, transcript,
        audioBase64, contentType: 'audio/mpeg', voiceId: profile.voiceId, requestId,
      })
      return {
        status: 'ready', mentorId, transcript,
        audio: audioBase64, contentType: 'audio/mpeg',
        provider: 'elevenlabs', speed: normalizedSpeed,
      }
    } catch (err) {
      return {
        status: 'provider_error',
        reason: err.code || 'provider_error',
        mentorId, transcript, provider: 'elevenlabs', speed: normalizedSpeed,
      }
    }
  })()
  _inFlight.set(inFlightKey, work)
  try {
    const result = await work
    return { ...result, requestId, fromCache: false }
  } finally {
    _inFlight.delete(inFlightKey)
  }
}

export async function getVoicePreferences(guestReference) {
  const db = getDb()
  const row = await db.query(`SELECT * FROM smokecraft_voice_preferences WHERE guest_reference = $1`, [guestReference])
  if (row.rows.length === 0) {
    return { voiceEnabled: true, playbackSpeed: DEFAULT_SPEED, captionsEnabled: true, lastPreviewedMentorId: null }
  }
  const r = row.rows[0]
  return {
    voiceEnabled: r.voice_enabled,
    playbackSpeed: Number(r.playback_speed),
    captionsEnabled: r.captions_enabled,
    lastPreviewedMentorId: r.last_previewed_mentor_id,
  }
}

export async function saveVoicePreferences(guestReference, { voiceEnabled, playbackSpeed, captionsEnabled, lastPreviewedMentorId }) {
  if (typeof voiceEnabled !== 'boolean') throw new MentorVoiceError('invalid_voice_enabled')
  if (typeof captionsEnabled !== 'boolean') throw new MentorVoiceError('invalid_captions_enabled')
  const speed = normalizeSpeed(playbackSpeed)
  if (lastPreviewedMentorId !== null && lastPreviewedMentorId !== undefined && !getMentorById(lastPreviewedMentorId)) {
    throw new MentorVoiceError('invalid_mentor')
  }
  const db = getDb()
  await db.query(
    `INSERT INTO smokecraft_voice_preferences (guest_reference, voice_enabled, playback_speed, captions_enabled, last_previewed_mentor_id)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (guest_reference) DO UPDATE SET
       voice_enabled = EXCLUDED.voice_enabled, playback_speed = EXCLUDED.playback_speed,
       captions_enabled = EXCLUDED.captions_enabled,
       last_previewed_mentor_id = COALESCE(EXCLUDED.last_previewed_mentor_id, smokecraft_voice_preferences.last_previewed_mentor_id),
       updated_at = now()`,
    [guestReference, voiceEnabled, speed, captionsEnabled, lastPreviewedMentorId || null]
  )
  return getVoicePreferences(guestReference)
}
