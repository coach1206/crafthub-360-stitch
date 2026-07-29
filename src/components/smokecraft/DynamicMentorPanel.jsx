import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useSmokeCraftMentorGuidance } from '../../hooks/useSmokeCraftMentorGuidance.js'
import { useSmokeCraftMentorVoice } from '../../hooks/useSmokeCraftMentorVoice.js'
import MediaSlot from './goldenBox/MediaSlot.jsx'

const GOLD = '#E9C176'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

const ALLOWED_SPEEDS = [0.75, 0.9, 1.0, 1.1, 1.25]

// Shared dynamic mentor panel for the new Skill Tree / Collections / Challenge
// Hub screens — reads the real selected mentor from SmokeCraftJourneyContext
// (the same source EntryWorkspace/MentorGuidancePanel already trust), never
// a fixed/baked mentor. Shows an honest "no mentor selected" state instead
// of defaulting to any specific mentor.
//
// Holistic Fix 5B-2A: `context` is the new, preferred way to get real,
// server-computed, context-aware guidance via the shared
// useSmokeCraftMentorGuidance adapter — pass a screen identifier
// (e.g. "skill-tree") instead of a hardcoded `guidance` string. The
// `guidance` string prop remains supported and always takes precedence
// when both are supplied.
//
// Holistic Fix 5B-2A-1: `pairingContext` (optional) is the learner's
// current live cigar+beverage selection on a pairing screen — when
// present, guidance is scored by the same pairing engine the screen
// itself uses, so it can never contradict the real pairing result.
//
// Holistic Fix 5B-2B-2: adds an opt-in "Narrate" control that speaks
// the EXACT text already rendered below (never a second, independently
// generated line) through the same secure mentorVoiceService built in
// 5B-2B-1. Narration never autoplays — the learner always presses Play.
export default function DynamicMentorPanel({ guidance, context, pairingContext }) {
  const { journey } = useSmokeCraftJourney()
  const mentor = Array.isArray(journey?.mentor) ? journey.mentor[0] : null
  const dynamic = useSmokeCraftMentorGuidance(guidance ? null : context, guidance ? null : pairingContext)
  const voice = useSmokeCraftMentorVoice()

  // "no activity result yet" — a pairing screen that hasn't selected a
  // beverage yet has genuinely nothing pairing-specific to show; honest
  // about that rather than requesting/guessing a premature guidance call.
  const noPairingActivityYet = !guidance && pairingContext !== undefined && !pairingContext?.pairingType

  const displayText = guidance
    ? guidance
    : noPairingActivityYet ? `Select a beverage to see ${mentor ? mentor.name.split(' ')[0] + "'s" : ''} pairing guidance.`
    : dynamic.status === 'loading' ? 'Loading guidance…'
    : dynamic.status === 'ready' ? dynamic.guidance?.message
    : dynamic.status === 'offline' ? "You're offline — guidance can't be loaded right now."
    : dynamic.status === 'unavailable' ? 'Guidance is temporarily unavailable.'
    : mentor ? `${mentor.name.split(' ')[0]} hasn't left specific guidance for this screen yet.`
    : null

  // Narration is only offered once there is real, server-computed
  // guidance text on screen to narrate — never for a static `guidance`
  // string prop (out of this pass's scope: static-guidance callers),
  // never for a loading/unavailable/no-activity-yet placeholder line.
  const canNarrate = !guidance && !noPairingActivityYet && dynamic.status === 'ready' && Boolean(dynamic.guidance?.message)
  const speed = voice.preferences?.playbackSpeed ?? 1.0
  const captionsEnabled = voice.preferences?.captionsEnabled ?? true

  function handleNarrate(e) {
    e.stopPropagation()
    voice.requestNarration(mentor.id, context || null, pairingContext, speed)
  }

  return (
    <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(233,193,118,0.55)', marginBottom: 8 }}>Selected Mentor</div>
      {!mentor ? (
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(229,226,225,0.55)' }}>
          No mentor selected yet — choose one from Mentor Selection to receive guidance here.
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <MediaSlot directSrc={mentor.image} alt={mentor.name} style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: GOLD, fontSize: 14 }}>{mentor.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.6)', marginBottom: 4 }}>
              {mentor.flag ? `${mentor.flag} ` : ''}{mentor.country || 'Master Mentor'}
            </div>
            {mentor.bio && <p style={{ margin: '0 0 6px', fontSize: 11.5, color: CREAM, lineHeight: 1.5 }}>{mentor.bio}</p>}
            <p data-testid="mentor-guidance-text" style={{ margin: 0, fontSize: 11.5, color: 'rgba(229,226,225,0.7)', fontStyle: 'italic' }}>
              {displayText}
            </p>
            {context && dynamic.status === 'unavailable' && (
              <button type="button" onClick={dynamic.retry} style={{ marginTop: 6, background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 10, color: GOLD, fontSize: 10, padding: '2px 8px', cursor: 'pointer' }}>Retry</button>
            )}

            {canNarrate && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {voice.status !== 'ready' && (
                    <button type="button" onClick={handleNarrate} aria-label={`Narrate ${mentor.name}'s guidance`} style={narrateBtnStyle}>
                      {voice.status === 'loading' ? 'Loading…' : 'Narrate'}
                    </button>
                  )}

                  {voice.status === 'ready' && (
                    <>
                      <button
                        type="button"
                        aria-label={voice.isPlaying ? `Pause ${mentor.name}'s narration` : `Play ${mentor.name}'s narration`}
                        onClick={e => { e.stopPropagation(); voice.isPlaying ? voice.pause() : voice.play() }}
                        style={iconBtnStyle}
                      >
                        {voice.isPlaying ? '⏸' : '▶'}
                      </button>
                      <button
                        type="button"
                        aria-label={`Replay ${mentor.name}'s narration`}
                        onClick={e => { e.stopPropagation(); voice.replay() }}
                        style={iconBtnStyle}
                      >
                        ⟲
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    aria-label={voice.isMuted ? 'Unmute mentor voice' : 'Mute mentor voice'}
                    onClick={e => { e.stopPropagation(); voice.toggleMute() }}
                    style={iconBtnStyle}
                  >
                    {voice.isMuted ? '🔇' : '🔊'}
                  </button>

                  <button
                    type="button"
                    aria-pressed={captionsEnabled}
                    aria-label={captionsEnabled ? 'Turn captions off' : 'Turn captions on'}
                    onClick={e => { e.stopPropagation(); voice.toggleCaptions() }}
                    style={{ ...iconBtnStyle, width: 'auto', padding: '0 8px', fontSize: 10, borderRadius: 999 }}
                  >
                    CC {captionsEnabled ? 'On' : 'Off'}
                  </button>

                  <label style={{ fontSize: 10, color: 'rgba(229,226,225,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Speed
                    <select
                      aria-label="Narration playback speed"
                      value={speed}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); voice.setPlaybackSpeed(Number(e.target.value)) }}
                      style={{ background: 'rgba(233,193,118,0.08)', color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 10, padding: '2px 4px' }}
                    >
                      {ALLOWED_SPEEDS.map(s => <option key={s} value={s}>{s}x</option>)}
                    </select>
                  </label>

                  {voice.status === 'unavailable' && (
                    <span style={{ fontSize: 10, color: 'rgba(229,226,225,0.55)' }}>
                      Voice narration unavailable for {mentor.name.split(' ')[0]}
                    </span>
                  )}
                  {voice.status === 'provider-error' && (
                    <>
                      <span style={{ fontSize: 10, color: 'rgba(229,226,225,0.55)' }}>Narration failed</span>
                      <button type="button" onClick={e => { e.stopPropagation(); voice.retry() }} style={{ ...iconBtnStyle, width: 'auto', padding: '0 8px', fontSize: 10 }}>Retry</button>
                    </>
                  )}
                  {voice.status === 'session-expired' && (
                    <span style={{ fontSize: 10, color: 'rgba(229,226,225,0.55)' }}>Session expired — refresh to narrate</span>
                  )}
                </div>

                {captionsEnabled && voice.transcript && voice.status !== 'idle' && (
                  <p data-testid="mentor-narration-caption" style={{ fontSize: 10, color: 'rgba(229,226,225,0.55)', lineHeight: 1.5, marginTop: 8, marginBottom: 0 }} aria-live="polite">
                    {voice.transcript}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const narrateBtnStyle = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
  color: GOLD, background: 'rgba(233,193,118,0.08)', border: `1px solid ${BORDER}`,
  borderRadius: 999, padding: '5px 10px', cursor: 'pointer',
}

const iconBtnStyle = {
  width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: GOLD, background: 'rgba(233,193,118,0.08)', border: `1px solid ${BORDER}`, cursor: 'pointer', fontSize: 11, padding: 0,
}
