/**
 * useMentorVoice — React hook for mentor narration.
 *
 * Strategy:
 *   1. Fetch /api/voice/capability once per page-load (cached at module level).
 *   2. If ElevenLabs is available AND user is authenticated → call /api/voice/speak,
 *      play the returned base64 audio blob.
 *   3. Otherwise → Web Speech API (prototype mode, always works).
 *   4. Voice NEVER blocks navigation — all audio plays fire-and-forget.
 *   5. Mute is persisted to localStorage across sessions.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  fetchCapability,
  speakMentorLine,
  stopMentorVoice,
  isMuted   as getIsMuted,
  setMuted  as svcSetMuted,
} from '../services/voiceService.js'

export function useMentorVoice() {
  const { isAuthenticated } = useAuth()
  const [isSpeaking, setIsSpeaking]   = useState(false)
  const [isMuted,    setIsMutedState] = useState(getIsMuted)
  const [capability, setCapability]   = useState(null)
  const audioRef    = useRef(null)
  const timerRef    = useRef(null)

  // Fetch capability once on mount
  useEffect(() => {
    fetchCapability().then(setCapability)
  }, [])

  const stop = useCallback(() => {
    stopMentorVoice()
    if (audioRef.current) {
      try { audioRef.current.pause() } catch { /* ignore */ }
      audioRef.current = null
    }
    clearTimeout(timerRef.current)
    setIsSpeaking(false)
  }, [])

  const toggleMute = useCallback(() => {
    const next = !isMuted
    setIsMutedState(next)
    svcSetMuted(next)
    if (next) stop()
  }, [isMuted, stop])

  const speak = useCallback(async (text, mentorId) => {
    if (!text) return
    // If muted, honour silently — session is never blocked
    if (isMuted) return
    stop()

    if (import.meta.env.DEV) {
      console.debug('[MentorVoice] request', {
        mentorId,
        capabilityProvider: capability?.provider || 'unknown',
        elevenlabsConfiguredOnServer: Boolean(capability?.elevenlabs),
        isAuthenticated,
      })
    }

    // Path A: ElevenLabs via backend (authenticated users only)
    if (capability?.elevenlabs && isAuthenticated) {
      setIsSpeaking(true)
      try {
        const res  = await fetch('/api/voice/speak', {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify({ text, mentorId }),
        })
        const json = await res.json()
        const data = json?.data

        if (data && !data.fallback && data.audio) {
          if (import.meta.env.DEV) console.debug('[MentorVoice] provider used: elevenlabs', { mentorId })
          // Decode base64 → Blob → Audio element
          const binary = atob(data.audio)
          const bytes  = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          const blob   = new Blob([bytes], { type: data.contentType || 'audio/mpeg' })
          const url    = URL.createObjectURL(blob)
          const audio  = new Audio(url)
          audioRef.current = audio
          audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url) }
          audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); _webSpeechFallback(text, mentorId) }
          audio.play().catch(() => { setIsSpeaking(false); _webSpeechFallback(text, mentorId) })
          return
        }
        // ElevenLabs returned fallback:true → drop through to Web Speech
      } catch {
        // Network error → drop through to Web Speech
      }
    }

    // Path B: Web Speech API (prototype / unauthenticated / ElevenLabs not configured)
    if (import.meta.env.DEV) console.debug('[MentorVoice] provider used: system-fallback', { mentorId })
    setIsSpeaking(true)
    speakMentorLine(text)

    // Web Speech doesn't fire reliable onend cross-browser — estimate from word count
    const ms = Math.min(Math.max(text.split(/\s+/).length * 620, 1800), 14000)
    timerRef.current = setTimeout(() => setIsSpeaking(false), ms)
  }, [isMuted, capability, isAuthenticated, stop])

  // Cleanup on unmount
  useEffect(() => () => { stop() }, [stop])

  return {
    speak,
    stop,
    isSpeaking,
    isMuted,
    toggleMute,
    isAvailable: true,
    voiceProvider: capability?.elevenlabs ? 'elevenlabs' : 'system-fallback',
  }
}

function _webSpeechFallback(text, mentorId) {
  if (import.meta.env.DEV) console.debug('[MentorVoice] provider used: system-fallback (elevenlabs call failed)', { mentorId })
  speakMentorLine(text)
}
