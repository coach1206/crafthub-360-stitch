/**
 * Holistic Fix 5B-2B-1 — shared adapter for the server-authoritative
 * SmokeCraft mentor-voice preview flow. Used by Mentor Selection only
 * in this pass. The hook never computes or fabricates audio — it only
 * requests a preview from the server and manages real HTMLAudioElement
 * playback state (play/pause/replay/mute) plus the honest status set
 * this mandate requires (idle/loading/ready/unavailable/provider_error).
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchVoicePreview, fetchVoicePreferences, saveVoicePreferences as apiSavePreferences } from '../services/smokecraft/mentorVoiceApiClient.js'

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

  const requestPreview = useCallback(async (mentorId, speed = 1.0) => {
    lastRequestRef.current = { mentorId, speed }
    setStatus('loading')
    setPreview(null)
    const res = await fetchVoicePreview(mentorId, speed)
    if (!res.ok) {
      setStatus(res.status === 401 || res.status === 403 ? 'session-expired' : 'unavailable')
      return
    }
    const p = res.preview
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

  const retry = useCallback(() => {
    if (lastRequestRef.current) requestPreview(lastRequestRef.current.mentorId, lastRequestRef.current.speed)
  }, [requestPreview])

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

  const savePreferences = useCallback(async (patch) => {
    const res = await apiSavePreferences({
      voiceEnabled: !isMuted,
      playbackSpeed: preferences?.playbackSpeed ?? 1.0,
      captionsEnabled: preferences?.captionsEnabled ?? true,
      lastPreviewedMentorId: lastRequestRef.current?.mentorId ?? null,
      ...patch,
    })
    if (res.ok) setPreferences(res.preferences)
    return res
  }, [isMuted, preferences])

  useEffect(() => () => stopAudio(), [stopAudio])

  return {
    status, preview, isPlaying, isMuted, preferences,
    requestPreview, play, pause, replay, toggleMute, retry, savePreferences,
    transcript: preview?.transcript || null,
  }
}
