/**
 * Holistic Fix 5B-2B-1 / 5B-2B-2 — shared adapter for the server-
 * authoritative SmokeCraft mentor-voice flow. The ONE voice hook used
 * by both Mentor Selection's Preview Voice (requestPreview) and the
 * shared DynamicMentorPanel's guidance narration (requestNarration) —
 * no second, competing voice implementation. The hook never computes
 * or fabricates audio, and never sends narration text itself — it only
 * requests audio from the server (which derives narration text from
 * the same authoritative guidance function the visible text already
 * comes from) and manages real HTMLAudioElement playback state
 * (play/pause/replay/mute/speed) plus the honest status set this
 * mandate requires (idle/loading/ready/unavailable/provider-error).
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchVoicePreview, fetchGuidanceNarration, fetchVoicePreferences, saveVoicePreferences as apiSavePreferences } from '../services/smokecraft/mentorVoiceApiClient.js'

export function useSmokeCraftMentorVoice() {
  const [status, setStatus] = useState('idle')
  const [preview, setPreview] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [preferences, setPreferences] = useState(null)
  const audioRef = useRef(null)
  const lastRequestRef = useRef(null)

  useEffect(() => {
    fetchVoicePreferences().then(res => {
      if (res.ok) {
        setPreferences(res.preferences)
        setIsMuted(!res.preferences.voiceEnabled)
      }
    })
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.pause() } catch { /* ignore */ }
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const playAudio = useCallback((audioBase64, contentType) => {
    stopAudio()
    if (isMuted) return
    try {
      const binary = atob(audioBase64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: contentType || 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } catch { setIsPlaying(false) }
  }, [isMuted, stopAudio])

  const applyResult = useCallback((res) => {
    if (!res.ok) {
      setStatus(res.status === 401 || res.status === 403 ? 'session-expired' : 'unavailable')
      return
    }
    const p = res.preview || res.narration
    setPreview(p)
    if (p.status === 'ready') {
      setStatus('ready')
      if (p.audio) playAudio(p.audio, p.contentType)
    } else if (p.status === 'unavailable') {
      setStatus('unavailable')
    } else {
      setStatus('provider-error')
    }
  }, [playAudio])

  const requestPreview = useCallback(async (mentorId, speed = 1.0) => {
    lastRequestRef.current = { kind: 'preview', mentorId, speed }
    setStatus('loading')
    setPreview(null)
    applyResult(await fetchVoicePreview(mentorId, speed))
  }, [applyResult])

  /**
   * Narrates the exact server-returned guidance text for the given
   * mentor/screen/pairing context (never client-supplied text) at a
   * bounded speed.
   */
  const requestNarration = useCallback(async (mentorId, screenContext, pairingContext, speed = 1.0) => {
    lastRequestRef.current = { kind: 'narration', mentorId, screenContext, pairingContext, speed }
    setStatus('loading')
    setPreview(null)
    applyResult(await fetchGuidanceNarration(mentorId, screenContext, pairingContext, speed))
  }, [applyResult])

  const retry = useCallback(() => {
    const last = lastRequestRef.current
    if (!last) return
    if (last.kind === 'narration') requestNarration(last.mentorId, last.screenContext, last.pairingContext, last.speed)
    else if (last.kind === 'preview') requestPreview(last.mentorId, last.speed)
  }, [requestNarration, requestPreview])

  const play = useCallback(() => {
    if (preview?.audio && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    } else if (preview?.audio) {
      playAudio(preview.audio, preview.contentType)
    }
  }, [preview, playAudio])

  const pause = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.pause() } catch { /* ignore */ }
      setIsPlaying(false)
    }
  }, [])

  const replay = useCallback(() => {
    if (preview?.audio) playAudio(preview.audio, preview.contentType)
  }, [preview, playAudio])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      if (next) stopAudio()
      apiSavePreferences({
        voiceEnabled: !next,
        playbackSpeed: preferences?.playbackSpeed ?? 1.0,
        captionsEnabled: preferences?.captionsEnabled ?? true,
        lastPreviewedMentorId: lastRequestRef.current?.mentorId ?? null,
      }).then(res => { if (res.ok) setPreferences(res.preferences) })
      return next
    })
  }, [stopAudio, preferences])

  const toggleCaptions = useCallback(() => {
    savePreferencesInternal({ captionsEnabled: !(preferences?.captionsEnabled ?? true) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences])

  const setPlaybackSpeed = useCallback((speed) => {
    savePreferencesInternal({ playbackSpeed: speed })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences])

  async function savePreferencesInternal(patch) {
    const res = await apiSavePreferences({
      voiceEnabled: !isMuted,
      playbackSpeed: preferences?.playbackSpeed ?? 1.0,
      captionsEnabled: preferences?.captionsEnabled ?? true,
      lastPreviewedMentorId: lastRequestRef.current?.mentorId ?? null,
      ...patch,
    })
    if (res.ok) setPreferences(res.preferences)
    return res
  }

  const savePreferences = useCallback((patch) => savePreferencesInternal(patch), [isMuted, preferences])

  useEffect(() => () => stopAudio(), [stopAudio])

  return {
    status, preview, isPlaying, isMuted, preferences,
    requestPreview, requestNarration, play, pause, replay, toggleMute, toggleCaptions, setPlaybackSpeed, retry, savePreferences,
    transcript: preview?.transcript || null,
  }
}
