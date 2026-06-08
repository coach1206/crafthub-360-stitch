/**
 * Voice Service — safe architecture stub for mentor audio.
 * Uses Web Speech API where available.
 * Phase 5 can swap the implementation for ElevenLabs or another TTS provider.
 * No API keys are stored or referenced here.
 */

let muted = false

/**
 * Speaks a mentor line using Web Speech API if available and not muted.
 * Fails silently if the API is unsupported.
 */
export function speakMentorLine(text, { rate = 0.88, pitch = 1.0 } = {}) {
  if (muted || !text || typeof text !== 'string') return
  stopMentorVoice()
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const utterance      = new SpeechSynthesisUtterance(text)
    utterance.rate       = rate
    utterance.pitch      = pitch
    utterance.volume     = 1
    window.speechSynthesis.speak(utterance)
  } catch {
    // silent fallback
  }
}

/** Stops any currently playing mentor voice. */
export function stopMentorVoice() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel() } catch { /* ignore */ }
  }
}

/** Toggles mute state. Returns the new muted value. */
export function toggleMute() {
  muted = !muted
  if (muted) stopMentorVoice()
  return muted
}

/** Returns current mute state without changing it. */
export function isMuted() {
  return muted
}

/** Programmatically sets mute state. */
export function setMuted(value) {
  muted = !!value
  if (muted) stopMentorVoice()
}
