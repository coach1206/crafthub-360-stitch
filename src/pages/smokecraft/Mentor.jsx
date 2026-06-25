import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useGuestSession }     from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS }           from '../../constants/session.js'
import { triggerHaptic }       from '../../utils/haptics.js'
import { useMentorVoice }      from '../../hooks/useMentorVoice.js'
import VoiceButton             from '../../components/voice/VoiceButton.jsx'
import {
  SmokeCraftAtmosphericBackground,
} from '../../components/smokecraft/SmokeCraftPremium.jsx'
import SmokeCraftPassportUploadCard from '../../components/smokecraft/SmokeCraftPassportUploadCard.jsx'
import { MENTORS, MAX_MENTOR_SELECTIONS } from '../../modules/smokecraft/smokeCraftMentors.js'

function MentorPortrait({ image, name }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="smokecraft-mentor-card__image" aria-hidden="true">
      {!failed ? (
        <img
          src={image}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
      ) : (
        <span style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%', background: 'rgba(20,14,8,0.92)',
          color: 'rgba(233,193,118,0.4)', gap: 6,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>person</span>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Portrait pending</span>
        </span>
      )}
    </span>
  )
}

// Mentor data and selection limit now live in
// src/modules/smokecraft/smokeCraftMentors.js (Phase 2 module separation).
const MAX_SELECTIONS = MAX_MENTOR_SELECTIONS

export default function Mentor() {
  const navigate = useNavigate()
  const { session, update, setMentors, setSelectedMentor, completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState([])
  const voice = useMentorVoice()

  function handleMentorMediaStateChange(mediaState) {
    if (import.meta.env.DEV) console.debug('[SmokeCraft] passport media upload state', { sourceType: 'passport-media-upload', ...mediaState })
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        passportMediaUpload: {
          ...prev.smokeCraft?.passportMediaUpload,
          uploadStatus: mediaState.uploadStatus,
          uploadPreviewUrl: mediaState.uploadPreviewUrl || prev.smokeCraft?.passportMediaUpload?.uploadPreviewUrl || null,
          uploadLink: mediaState.uploadLink || prev.smokeCraft?.passportMediaUpload?.uploadLink || null,
          uploadDeliveryMethod: mediaState.uploadDeliveryMethod || prev.smokeCraft?.passportMediaUpload?.uploadDeliveryMethod || null,
          updatedAt: Date.now(),
        },
      },
    }))
  }

  useEffect(() => {
    const t = setTimeout(() => {
      voice.speak(
        "Welcome to Mentor Selection. Choose two masters whose wisdom will shape your SmokeCraft tasting map.",
        'default'
      )
    }, 900)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggle(id) {
    triggerHaptic('medium')
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(m => m !== id)
      if (prev.length >= MAX_SELECTIONS) return prev
      const mentor = MENTORS.find(m => m.id === id)
      if (import.meta.env.DEV) console.debug('[SmokeCraft] mentor selected', { mentorId: id, mentorName: mentor?.name, voiceProvider: voice.voiceProvider })
      if (mentor?.greeting) voice.speak(mentor.greeting, id)
      return [...prev, id]
    })
  }

  function handleProceed() {
    if (selected.length !== MAX_SELECTIONS) return
    voice.stop()
    triggerHaptic('medium')
    setMentors(selected)
    const primaryId = selected[0]
    const found = MENTORS.find(m => m.id === primaryId)
    if (primaryId) setSelectedMentor(primaryId, found?.country || null)
    completeStep('mentor')
    addXP(XP_AWARDS.MENTOR_SELECTED)
    navigate('/smokecraft/golden-box')
  }

  function handleSaveDraft() {
    voice.stop()
    triggerHaptic('light')
    navigate('/smokecraft/seed-soil')
  }

  return (
    <div className="smokecraft-premium-page smokecraft-mentor-page">
      <SmokeCraftAtmosphericBackground variant="lounge" />

      <header className="smokecraft-mentor-header">
        <div className="smokecraft-mentor-header__brand">
          <button
            className="smokecraft-mentor-icon-btn material-symbols-outlined"
            onClick={() => navigate('/smokecraft/seed-soil')}
            aria-label="Back to Seed &amp; Soil"
          >
            menu
          </button>
          <span className="smokecraft-mentor-brand">CraftHub 360</span>
        </div>

        <div className="smokecraft-mentor-header__actions">
          <span className="smokecraft-mentor-step">Step 4 of 20</span>
          <VoiceButton
            isMuted={voice.isMuted}
            isSpeaking={voice.isSpeaking}
            onToggle={voice.toggleMute}
            voiceProvider={voice.voiceProvider}
          />
          <button className="smokecraft-mentor-lounge-btn" onClick={() => { voice.stop(); navigate('/grand-lounge-ranking') }}>
            Grand Lounge
          </button>
          <button className="smokecraft-mentor-avatar" onClick={() => navigate('/passport')} aria-label="Open member passport">
            <img src="/assets/smokecraft/cropped/passport-cover.jpg" alt="" />
          </button>
        </div>
      </header>

      <nav className="smokecraft-mentor-rail" aria-label="SmokeCraft navigation">
        {[
          { icon: 'wine_bar', label: 'Cellar', to: '/crafthub' },
          { icon: 'smoking_rooms', label: 'Humidor', to: '/smokecraft', active: true },
          { icon: 'chair', label: 'Lounge', to: '/' },
          { icon: 'menu_book', label: 'Passport', to: '/passport' },
        ].map(item => (
          <button
            key={item.label}
            className={item.active ? 'is-active' : ''}
            onClick={() => navigate(item.to)}
          >
            <span className="material-symbols-outlined" style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="smokecraft-mentor-rail__badge">
          <span className="material-symbols-outlined">workspace_premium</span>
          <strong>Private</strong>
          <small>Society</small>
        </div>
      </nav>

      <main className="smokecraft-mentor-main">
        <section className="smokecraft-mentor-hero">
          <div className="smokecraft-mentor-hero__copy">
            <span className="smokecraft-mentor-eyebrow">SmokeCraft Journey</span>
            <h1>Mentor Selection</h1>
            <h2>Your Journey. Their Wisdom. Your Masterpiece.</h2>
            <p>
              Select two master mentors from the world's great tobacco traditions. Each mentor brings a legacy,
              growing philosophy, and sensory perspective that will shape your SmokeCraft tasting map.
            </p>
          </div>

          <SmokeCraftPassportUploadCard
            identity={{
              sessionId: session?.sessionId,
              userId: session?.userId,
              guestId: session?.guestId,
              smokeCraftPassportId: session?.smokeCraft?.passportId,
            }}
            onMediaStateChange={handleMentorMediaStateChange}
          />
        </section>

        <section className="smokecraft-mentor-instructions">
          <div>
            <span className="material-symbols-outlined">psychology</span>
            <div>
              <h3>Choose Two Mentors</h3>
              <p>Each selection layers regional legacy, growing philosophy, and sensory perspective into your private masterclass.</p>
            </div>
          </div>
          <div className="smokecraft-mentor-stats">
            <article>
              <strong>2</strong>
              <span>Mentors Required</span>
            </article>
            <article>
              <strong>4+</strong>
              <span>Regions Represented</span>
            </article>
            <article>
              <strong>Elite</strong>
              <span>Master Blenders</span>
            </article>
          </div>
        </section>

        <section className="smokecraft-mentor-grid" aria-label="Mentor profiles">
          {MENTORS.map(mentor => {
            const isSelected = selected.includes(mentor.id)
            return (
              <button
                key={mentor.id}
                type="button"
                className={`smokecraft-mentor-card${isSelected ? ' is-selected' : ''}`}
                onClick={() => toggle(mentor.id)}
                aria-pressed={isSelected}
              >
                <span className="smokecraft-mentor-card__check" aria-hidden="true">
                  <span className="material-symbols-outlined">{isSelected ? 'check' : 'add'}</span>
                </span>
                <MentorPortrait image={mentor.image} name={mentor.name} />
                <span className="smokecraft-mentor-card__shade" aria-hidden="true" />
                <span
                  className="smokecraft-mentor-card__flag"
                  role="img"
                  aria-label={`${mentor.country} flag`}
                >
                  {mentor.flag}
                </span>
                <span className="smokecraft-mentor-card__body">
                  <span className="smokecraft-mentor-card__country">{mentor.country}</span>
                  <strong>{mentor.name}</strong>
                  <span className="smokecraft-mentor-card__bio">{mentor.bio}</span>
                  <span className="smokecraft-mentor-card__tags">
                    {mentor.tags.map(tag => <span key={tag}>{tag}</span>)}
                  </span>
                </span>
              </button>
            )
          })}
        </section>
      </main>

      <footer className="smokecraft-mentor-actionbar">
        <div className="smokecraft-mentor-actionbar__status">
          <span>Selections Made</span>
          <strong>{selected.length}<small>/ {MAX_SELECTIONS} Mentors</small></strong>
        </div>
        <div className="smokecraft-mentor-actionbar__selected">
          {selected.length === 0 && <span>Choose two mentors to continue</span>}
          {selected.map(id => {
            const mentor = MENTORS.find(m => m.id === id)
            return mentor ? <span key={id}>{mentor.name}</span> : null
          })}
        </div>
        <div className="smokecraft-mentor-actionbar__buttons">
          <button className="smokecraft-mentor-draft-btn" onClick={handleSaveDraft}>
            Save Draft
          </button>
          <button
            className="smokecraft-mentor-proceed-btn"
            onClick={handleProceed}
            disabled={selected.length !== MAX_SELECTIONS}
          >
            Proceed to Tasting Map
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
      <div data-marker="MENTOR CLEAN PORTRAITS V2" style={{ display: 'none' }} aria-hidden="true" />
    </div>
  )
}
