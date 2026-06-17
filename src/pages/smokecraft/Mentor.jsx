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

// APPROVED SMOKECRAFT MENTOR VISUAL RULE:
// Mentor cards must use realistic portraits only.
// Do not replace with cartoon avatars, placeholder faces, emoji art, or flat vector people.

const MENTORS = [
  {
    id: 'dominican',
    country: 'Dominican Republic',
    flag: '🇩🇴',
    flagLabel: 'Dominican Republic flag',
    name: 'Don Alejandro',
    bio: 'Master of volcanic soil nutrients and the delicate art of Olor wrapper fermentation.',
    tags: ['Complexity', 'Floral Notes'],
    image: '/mentors/don-alejandro.jpg',
    greeting: 'I am Don Alejandro. Volcanic soil and the patience of centuries — I will teach you to read the earth within a single Olor wrapper.',
  },
  {
    id: 'nicaragua',
    country: 'Nicaragua',
    flag: '🇳🇮',
    flagLabel: 'Nicaragua flag',
    name: 'Javier Estelí',
    bio: "Specialist in sun-grown Criollo '98 and the robust spice profiles of Jalapa Valley.",
    tags: ['Bold', 'Earth / Spice'],
    image: '/mentors/javier-esteli.jpg',
    greeting: 'Javier Estelí. My valley demands boldness. The spice you taste in Jalapa tobacco is the result of relentless sun and uncompromising craft.',
  },
  {
    id: 'honduras',
    country: 'Honduras',
    flag: '🇭🇳',
    flagLabel: 'Honduras flag',
    name: 'Doña Jamastran',
    bio: 'Legacy grower of authentic Corojo seed and the intense, full-bodied traditions of Danlí.',
    tags: ['Authentic', 'Rich Cedar'],
    image: '/mentors/dona-jamastran.jpg',
    greeting: "I am Doña Jamastran. Five generations of Corojo in the highlands of Danlí. My family's legacy is in every leaf — I will pass it on to you.",
  },
  {
    id: 'mexico',
    country: 'Mexico',
    flag: '🇲🇽',
    flagLabel: 'Mexico flag',
    name: 'Mateo San Andrés',
    bio: "Guardian of the Negro San Andrés leaf, the world's most sought-after Maduro wrapper.",
    tags: ['Dark Cocoa', 'Maduro Expert'],
    image: '/mentors/mateo-san-andres.jpg',
    greeting: "Mateo San Andrés. The Negro Maduro wrapper holds the darkest secrets in tobacco. Complex, honest, and alive. Your education starts now.",
  },
  {
    id: 'cuba',
    country: 'Cuba',
    flag: '🇨🇺',
    flagLabel: 'Cuba flag',
    name: 'Maestro Rafael',
    bio: 'Keeper of classic Cuban-seed tradition, elegant draw discipline, and old-world rolling standards.',
    tags: ['Tradition', 'Balance'],
    image: '/mentors/maestro-rafael.jpg',
    greeting: 'Maestro Rafael. Tradition is not nostalgia. It is a standard. I will teach you how balance becomes elegance.',
  },
  {
    id: 'peru',
    country: 'Peru',
    flag: '🇵🇪',
    flagLabel: 'Peru flag',
    name: 'Carlos Mendoza',
    bio: 'Andean curator of altitude-grown aromatics, mineral sweetness, and rare leaf experimentation.',
    tags: ['Altitude', 'Aromatics'],
    image: '/mentors/carlos-mendoza.jpg',
    greeting: 'Carlos Mendoza. In the high valleys, tobacco learns restraint and brightness. Let us find the lift inside the leaf.',
  },
  {
    id: 'florida',
    country: 'USA (Florida)',
    flag: '🇺🇸',
    flagLabel: 'United States flag',
    name: 'Thomas A. Blackwell',
    bio: 'Modern lounge strategist blending hospitality, humidor discipline, and contemporary cigar service.',
    tags: ['Lounge Craft', 'Service'],
    image: '/mentors/thomas-blackwell.jpg',
    greeting: 'Thomas Blackwell. A great cigar experience is engineered before the first light. I will guide the ritual around the smoke.',
  },
  {
    id: 'brazil',
    country: 'Brazil',
    flag: '🇧🇷',
    flagLabel: 'Brazil flag',
    name: 'Dr. Paulo Oliveira',
    bio: 'Mata Fina researcher focused on natural sweetness, earthy depth, and scientific tasting language.',
    tags: ['Mata Fina', 'Research'],
    image: '/mentors/paulo-oliveira.jpg',
    greeting: "Dr. Paulo Oliveira. Brazil's leaf is generous but exacting. I will teach you to measure sweetness without losing soul.",
  },
]

const MAX_SELECTIONS = 2

export default function Mentor() {
  const navigate = useNavigate()
  const { setMentors, setSelectedMentor, completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState([])
  const voice = useMentorVoice()

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
    navigate('/smokecraft/format')
  }

  function handleSaveDraft() {
    voice.stop()
    triggerHaptic('light')
    navigate('/smokecraft/golden-box')
  }

  return (
    <div className="smokecraft-premium-page smokecraft-mentor-page">
      <SmokeCraftAtmosphericBackground variant="lounge" />

      <header className="smokecraft-mentor-header">
        <div className="smokecraft-mentor-header__brand">
          <button
            className="smokecraft-mentor-icon-btn material-symbols-outlined"
            onClick={() => navigate('/smokecraft/enroll')}
            aria-label="Open SmokeCraft intake"
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
          />
          <button className="smokecraft-mentor-lounge-btn" onClick={() => { voice.stop(); navigate('/grand-lounge-ranking') }}>
            Grand Lounge
          </button>
          <button className="smokecraft-mentor-avatar" onClick={() => navigate('/passport')} aria-label="Open member passport">
            <img src="/passport.jpg" alt="" />
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

          <div className="smokecraft-mentor-stamp" aria-label="Mentor Participation Stamp Preview Mode">
            <div className="smokecraft-mentor-stamp__ring">
              <span className="material-symbols-outlined">verified</span>
              <strong>Mentor Participation</strong>
              <small>Stamp</small>
            </div>
            <p>Preview Mode</p>
          </div>
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
                <span className="smokecraft-mentor-card__flag" aria-label={mentor.flagLabel} title={mentor.country}>
                  <span aria-hidden="true">{mentor.flag}</span>
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
    </div>
  )
}
