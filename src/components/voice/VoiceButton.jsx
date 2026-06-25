/**
 * VoiceButton — inline mute/unmute control for the Mentor narration.
 *
 * Renders as a small icon button. When speaking, a subtle pulse ring
 * indicates active audio. Tapping mutes/unmutes without blocking anything.
 */

export default function VoiceButton({ isMuted, isSpeaking, onToggle, className = '', voiceProvider }) {
  const providerLabel = voiceProvider === 'elevenlabs'
    ? 'ElevenLabs voice'
    : 'System fallback voice (ElevenLabs unavailable)'
  const title = `${isMuted ? 'Unmute' : 'Mute'} mentor voice — ${providerLabel}`
  return (
    <button
      onClick={onToggle}
      title={title}
      aria-label={title}
      className={`relative flex items-center justify-center transition-all active:scale-90 ${className}`}
      style={{
        width:        40,
        height:       40,
        borderRadius: '50%',
        border:       `1px solid ${isMuted ? 'rgba(255,255,255,0.12)' : 'rgba(233,193,118,0.35)'}`,
        background:   isMuted ? 'rgba(255,255,255,0.04)' : 'rgba(233,193,118,0.08)',
        cursor:       'pointer',
        flexShrink:   0,
      }}
    >
      {/* Pulse ring — visible only while speaking */}
      {isSpeaking && !isMuted && (
        <span
          aria-hidden="true"
          style={{
            position:     'absolute',
            inset:        -4,
            borderRadius: '50%',
            border:       '1.5px solid rgba(233,193,118,0.45)',
            animation:    'voice-pulse 1.4s ease-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 18,
          color:    isMuted ? 'rgba(255,255,255,0.3)' : 'rgba(233,193,118,0.85)',
          userSelect: 'none',
        }}
      >
        {isMuted ? 'volume_off' : isSpeaking ? 'graphic_eq' : 'volume_up'}
      </span>
    </button>
  )
}
