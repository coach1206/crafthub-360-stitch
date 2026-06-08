/**
 * NOVEE OS — Frontend Voice Service
 *
 * Prototype mode:  Web Speech API (no config needed, always works).
 * ElevenLabs mode: Calls /api/voice/speak (backend holds the key).
 *
 * Mute state is persisted to localStorage so it survives page refreshes.
 * Nothing here ever exposes an API key.
 */

const MUTE_KEY = 'novee_voice_muted'

// ── Mute state (module-level, initialised from localStorage) ──────────────
let _muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === 'true' } catch { return false }
})()

function _persistMute(val) {
  try { localStorage.setItem(MUTE_KEY, String(val)) } catch { /* ignore */ }
}

// ── Capability cache (one fetch per page-load) ────────────────────────────
let _capabilityCache = null
let _capabilityFlight = null

export async function fetchCapability() {
  if (_capabilityCache) return _capabilityCache
  if (_capabilityFlight) return _capabilityFlight
  _capabilityFlight = fetch('/api/voice/capability')
    .then(r => r.json())
    .then(d => {
      _capabilityCache = d?.data ?? { provider: 'webspeech', elevenlabs: false, available: true }
      return _capabilityCache
    })
    .catch(() => {
      _capabilityCache = { provider: 'webspeech', elevenlabs: false, available: true }
      return _capabilityCache
    })
  return _capabilityFlight
}

// ── Web Speech API helpers ────────────────────────────────────────────────
export function isWebSpeechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Speaks text via the browser's built-in speechSynthesis.
 * Fails silently if unavailable or muted.
 */
export function speakMentorLine(text, { rate = 0.88, pitch = 1.0 } = {}) {
  if (_muted || !text || typeof text !== 'string') return
  stopMentorVoice()
  if (!isWebSpeechAvailable()) return
  try {
    const utterance      = new SpeechSynthesisUtterance(text)
    utterance.rate       = rate
    utterance.pitch      = pitch
    utterance.volume     = 1
    window.speechSynthesis.speak(utterance)
  } catch { /* silent */ }
}

/** Stops any currently playing mentor voice (Web Speech or Audio element). */
export function stopMentorVoice() {
  if (isWebSpeechAvailable()) {
    try { window.speechSynthesis.cancel() } catch { /* ignore */ }
  }
}

/** Returns current mute state. */
export function isMuted() { return _muted }

/** Sets mute state programmatically (also persists). */
export function setMuted(value) {
  _muted = !!value
  _persistMute(_muted)
  if (_muted) stopMentorVoice()
}

/** Toggles mute. Returns the new value. */
export function toggleMute() {
  setMuted(!_muted)
  return _muted
}
