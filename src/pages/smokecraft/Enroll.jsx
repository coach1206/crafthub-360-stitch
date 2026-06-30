import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import {
  ACCEPT_ATTRIBUTE,
  REJECTED_IMAGE_MESSAGE,
  isAllowedSmokeCraftImage,
} from '../../utils/smokecraftImageValidation.js'

export default function Enroll() {
  const navigate = useNavigate()
  const { updateProfile, completeGuestProfile, completeStep, addXP, setSelectedCraft } = useGuestSession()
  const fileInputRef = useRef(null)
  const [avatarSrc, setAvatarSrc] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', nickname: '',
    ageConfirmed: false, city: '', state: '', zip: '', countryRegion: '',
    experienceLevel: '', strengthPreference: '', occasion: '', socialPreference: '', budgetRange: '',
    flavorPreferences: [],
  })

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function toggleFlavor(flavor) {
    triggerHaptic('light')
    setForm(prev => ({
      ...prev,
      flavorPreferences: prev.flavorPreferences.includes(flavor)
        ? prev.flavorPreferences.filter(f => f !== flavor)
        : [...prev.flavorPreferences, flavor],
    }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!isAllowedSmokeCraftImage(file)) {
      setPhotoError(REJECTED_IMAGE_MESSAGE)
      triggerHaptic('warning')
      e.target.value = ''
      return
    }

    setPhotoError('')
    triggerHaptic('success')
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleContinue() {
    if (!form.ageConfirmed) return
    triggerHaptic('success')
    const [firstName, ...rest] = (form.fullName || '').trim().split(' ')
    const profilePayload = {
      firstName:    firstName || '',
      lastName:     rest.join(' '),
      nickname:     form.nickname,
      email:        form.email,
      phone:        form.phone,
      city:         form.city,
      state:        form.state,
      zip:          form.zip,
      countryRegion: form.countryRegion,
      ageConfirmed: form.ageConfirmed,
      photo:        avatarSrc,
      experienceLevel:    form.experienceLevel,
      strengthPreference: form.strengthPreference,
      occasion:           form.occasion,
      socialPreference:   form.socialPreference,
      budgetRange:         form.budgetRange,
      flavorPreferences:   form.flavorPreferences,
    }
    completeGuestProfile(profilePayload)
    setSelectedCraft('SmokeCraft 360')
    completeStep('enroll')
    addXP(XP_AWARDS.PROFILE_COMPLETE)
    navigate('/smokecraft/format')
  }

  function handleDraft() {
    triggerHaptic('medium')
    const [firstName, ...rest] = (form.fullName || '').trim().split(' ')
    updateProfile({ firstName: firstName || '', lastName: rest.join(' '), nickname: form.nickname, email: form.email, countryRegion: form.countryRegion })
  }

  return (
    <div
      className="smokecraft-intake min-h-screen text-on-surface font-body-md overflow-x-hidden"
      style={{
        minHeight: 'max(884px, 100dvh)',
        position: 'relative',
        backgroundColor: '#050302',
        backgroundImage: 'linear-gradient(90deg, rgba(4,2,1,0.5), rgba(4,2,1,0.08) 26%, rgba(4,2,1,0.08) 74%, rgba(4,2,1,0.5)), linear-gradient(180deg, rgba(5,3,1,0.1), rgba(5,3,1,0.58)), url(/smokecraft.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 28%',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="smokecraft-intake-left-scene" aria-hidden="true" />
      <div className="smokecraft-intake-right-scene" aria-hidden="true" />

      {/* Thin CraftHub bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-12" style={{
        background: 'rgba(10,7,5,0.5)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(255,232,186,0.14)',
      }}>
        <button
          className="material-symbols-outlined text-primary/80 transition-colors p-1.5 rounded-full active:scale-95 duration-200"
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          style={{ fontSize: 20 }}
        >arrow_back</button>
        <span className="font-label-sm tracking-[0.2em] uppercase" style={{ color: 'rgba(233,193,118,0.7)', fontSize: 11 }}>CraftHub 360</span>
        <span className="font-label-sm hidden md:block" style={{ color: 'rgba(248,236,214,0.6)', fontSize: 11 }}>Step 3 of 4</span>
      </header>

      <main className="relative z-10 pt-16 pb-32 px-6 max-w-[1040px] mx-auto">
        {/* Header */}
        <section className="mb-7 text-center">
          <div className="smokecraft-intake-crest" aria-hidden="true">SC</div>
          <div className="smokecraft-intake-kicker" />
          <h2 className="mb-3" style={{ fontFamily: '"Playfair Display",serif', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(44px,6.4vw,68px)', color: '#ffd889', textShadow: '0 0 30px rgba(233,193,118,0.55), 0 10px 30px rgba(0,0,0,0.85)' }}>SmokeCraft Intake</h2>
          <p className="font-body-md max-w-lg mx-auto" style={{ color: 'rgba(255,247,229,0.86)', textShadow: '0 2px 16px rgba(0,0,0,0.8)', fontSize: 14.5, lineHeight: 1.6 }}>
            Tell us a bit about yourself so we can craft a lounge experience worthy of your taste. Your privacy is our priority—only your nickname enters the humidor leaderboard.
          </p>
        </section>

        {/* Entry gate reference */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.28)', marginBottom: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
          <img
            src="/assets/smokecraft-reference/approved/smokecraft-entry-gate.png"
            alt="SmokeCraft entry gate"
            style={{ display: 'block', width: '100%', minHeight: 260, maxHeight: 400, objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>

        {/* Form card */}
        <div className="smokecraft-intake-card p-9 rounded-2xl shadow-2xl space-y-5" style={{
          background: 'linear-gradient(155deg, rgba(58,40,24,0.82) 0%, rgba(28,18,11,0.9) 46%, rgba(12,7,4,0.95) 100%)',
          backdropFilter: 'blur(22px) saturate(1.25)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.25)',
          border: '1px solid rgba(233,193,118,0.42)',
          boxShadow: '0 32px 90px rgba(0,0,0,0.78), inset 0 1px 0 rgba(255,232,186,0.12), inset 0 0 70px rgba(233,193,118,0.08)',
        }}>
          {/* Photo upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/60" style={{
                borderColor: 'rgba(233,193,118,0.75)',
                background: 'radial-gradient(circle at 35% 25%, rgba(233,193,118,0.2), rgba(20,14,10,0.88))',
                boxShadow: '0 0 36px rgba(233,193,118,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-primary" style={{ opacity: 0.8, fontSize: 56 }}>add_a_photo</span>
                }
              </div>
              <label
                className="absolute -bottom-1 -right-1 bg-primary text-on-primary w-11 h-11 rounded-full flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-transform"
                style={{ boxShadow: '0 4px 18px rgba(233,193,118,0.5)' }}
                htmlFor="photo-upload"
              >
                <span className="material-symbols-outlined text-xl">add</span>
                <input
                  accept={ACCEPT_ATTRIBUTE}
                  className="hidden"
                  id="photo-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <p className="font-label-sm text-primary mt-4 tracking-widest uppercase" style={{ textShadow: '0 2px 14px rgba(0,0,0,0.35)', fontSize: 11 }}>Member Portrait (Optional)</p>
            {photoError && (
              <p className="font-label-sm mt-2 text-center" style={{ color: 'rgba(247,239,226,0.85)', fontSize: 11.5 }} role="status">{photoError}</p>
            )}
          </div>

          {/* Form */}
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-x-9 gap-y-3.5" onSubmit={(e) => e.preventDefault()}>
            {/* Private Identity */}
            <div className="sm:col-span-2 flex items-center gap-3 pb-2" style={{ borderBottom: '1px solid rgba(255,232,186,0.2)' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <h3 className="font-label-lg text-primary uppercase tracking-widest">Private Identity</h3>
            </div>

            <div className="gold-underline py-1.5">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Full Legal Name</label>
              <input
                className="w-full bg-transparent border-none text-body-lg text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 h-11 px-0 focus:outline-none"
                placeholder="e.g. Alistair Sterling"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="gold-underline py-1.5">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Phone Number</label>
              <input
                className="w-full bg-transparent border-none text-body-lg text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 h-11 px-0 focus:outline-none"
                placeholder="+1 (555) 000-0000"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="gold-underline py-1.5 sm:col-span-2">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Email Address</label>
              <input
                className="w-full bg-transparent border-none text-body-lg text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 h-11 px-0 focus:outline-none"
                placeholder="sterling@private.com"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Lounge Persona */}
            <div className="sm:col-span-2 flex items-center gap-3 pb-2 mt-2" style={{ borderBottom: '1px solid rgba(255,232,186,0.2)' }}>
              <span className="material-symbols-outlined text-primary">public</span>
              <h3 className="font-label-lg text-primary uppercase tracking-widest">Lounge Persona</h3>
            </div>

            <div className="gold-underline py-1.5">
              <label className="block font-label-sm text-secondary mb-1 uppercase">Nickname / Leaderboard</label>
              <input
                className="w-full bg-transparent border-none text-body-lg text-secondary placeholder:text-secondary/20 focus:ring-0 h-11 px-0 focus:outline-none"
                placeholder="The Curator"
                type="text"
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
              />
            </div>

            <div className="gold-underline py-1.5">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Age Confirmation</label>
              <div className="flex items-center h-11">
                <input
                  className="w-6 h-6 rounded border-outline bg-surface-container text-primary focus:ring-primary focus:ring-offset-surface"
                  id="age-check"
                  type="checkbox"
                  name="ageConfirmed"
                  checked={form.ageConfirmed}
                  onChange={handleChange}
                />
                <label className="ml-3 font-body-md text-on-surface" htmlFor="age-check">
                  I am of legal smoking age
                </label>
              </div>
            </div>

            {/* Region */}
            <div className="gold-underline py-1.5 sm:col-span-2">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Country / Region</label>
              <select
                className="w-full bg-transparent border-none text-body-lg text-on-surface focus:ring-0 h-11 px-0 focus:outline-none"
                name="countryRegion"
                value={form.countryRegion}
                onChange={handleChange}
              >
                <option value="">Select your country or region</option>
                <option value="United States">United States</option>
                <option value="Dominican Republic">Dominican Republic</option>
                <option value="Nicaragua">Nicaragua</option>
                <option value="Honduras">Honduras</option>
                <option value="Mexico">Mexico</option>
                <option value="Cuba">Cuba</option>
                <option value="Brazil">Brazil</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Smoke Preference DNA */}
            <div className="sm:col-span-2 flex items-center gap-3 pb-2 mt-2" style={{ borderBottom: '1px solid rgba(255,232,186,0.2)' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
              <h3 className="font-label-lg text-primary uppercase tracking-widest">Smoke Preference DNA</h3>
            </div>

            <div className="gold-underline py-1.5">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Experience Level</label>
              <select className="w-full bg-transparent border-none text-body-lg text-on-surface focus:ring-0 h-11 px-0 focus:outline-none" name="experienceLevel" value={form.experienceLevel} onChange={handleChange}>
                <option value="">Select experience level</option>
                <option value="Novice">Novice</option>
                <option value="Enthusiast">Enthusiast</option>
                <option value="Connoisseur">Connoisseur</option>
                <option value="Aficionado">Aficionado</option>
              </select>
            </div>

            <div className="gold-underline py-1.5">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Strength Preference</label>
              <select className="w-full bg-transparent border-none text-body-lg text-on-surface focus:ring-0 h-11 px-0 focus:outline-none" name="strengthPreference" value={form.strengthPreference} onChange={handleChange}>
                <option value="">Select strength preference</option>
                <option value="Mild">Mild</option>
                <option value="Mild-Medium">Mild-Medium</option>
                <option value="Medium">Medium</option>
                <option value="Medium-Full">Medium-Full</option>
                <option value="Full">Full</option>
              </select>
            </div>

            <div className="gold-underline py-1.5">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Occasion</label>
              <select className="w-full bg-transparent border-none text-body-lg text-on-surface focus:ring-0 h-11 px-0 focus:outline-none" name="occasion" value={form.occasion} onChange={handleChange}>
                <option value="">Select occasion</option>
                <option value="Solo Relaxation">Solo Relaxation</option>
                <option value="Celebration">Celebration</option>
                <option value="Social Gathering">Social Gathering</option>
                <option value="Business">Business</option>
                <option value="Pairing Dinner">Pairing Dinner</option>
                <option value="Outdoor / Golf">Outdoor / Golf</option>
              </select>
            </div>

            <div className="gold-underline py-1.5">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Social Preference</label>
              <select className="w-full bg-transparent border-none text-body-lg text-on-surface focus:ring-0 h-11 px-0 focus:outline-none" name="socialPreference" value={form.socialPreference} onChange={handleChange}>
                <option value="">Select social preference</option>
                <option value="Solo">Solo</option>
                <option value="Small Group">Small Group</option>
                <option value="Large Group / Event">Large Group / Event</option>
              </select>
            </div>

            <div className="gold-underline py-1.5 sm:col-span-2">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Budget Range</label>
              <select className="w-full bg-transparent border-none text-body-lg text-on-surface focus:ring-0 h-11 px-0 focus:outline-none" name="budgetRange" value={form.budgetRange} onChange={handleChange}>
                <option value="">Select budget range</option>
                <option value="Under $10">Under $10</option>
                <option value="$10–20">$10–20</option>
                <option value="$20–35">$20–35</option>
                <option value="$35+">$35+</option>
              </select>
            </div>

            <div className="sm:col-span-2 py-2">
              <label className="block font-label-sm text-on-surface-variant mb-3 uppercase">Flavor Preferences</label>
              <div className="flex flex-wrap gap-3">
                {['Earthy', 'Spicy', 'Sweet', 'Woody', 'Nutty', 'Creamy', 'Fruity', 'Cocoa & Coffee'].map(flavor => {
                  const on = form.flavorPreferences.includes(flavor)
                  return (
                    <button
                      type="button"
                      key={flavor}
                      onClick={() => toggleFlavor(flavor)}
                      className="px-4 py-2 rounded-full font-label-sm uppercase tracking-wider transition-all active:scale-95"
                      style={{
                        border: `1px solid ${on ? 'rgba(233,193,118,0.85)' : 'rgba(255,232,186,0.25)'}`,
                        background: on ? 'rgba(233,193,118,0.18)' : 'rgba(0,0,0,0.3)',
                        color: on ? '#ffd889' : 'rgba(255,247,229,0.7)',
                      }}
                    >
                      {flavor}
                    </button>
                  )
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center" style={{ width: 'min(620px, 92vw)', marginInline: 'auto' }}>
          <button
            onClick={handleDraft}
            className="flex-1 px-5 py-4 rounded-lg border border-primary text-primary font-label-sm tracking-widest hover:bg-primary/10 transition-all active:scale-95 duration-200"
            style={{ fontSize: 12 }}
          >
            SAVE AS DRAFT
          </button>
          <button
            onClick={handleContinue}
            disabled={!form.ageConfirmed}
            title={!form.ageConfirmed ? 'Age confirmation is required to continue' : undefined}
            className="flex-[1.4] px-5 py-4 rounded-lg bg-primary text-on-primary font-label-sm tracking-widest shadow-[0_0_20px_rgba(233,193,118,0.3)] hover:brightness-110 transition-all active:scale-95 duration-200 flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none"
            style={{ fontSize: 12 }}
          >
            CONTINUE TO PASSPORT
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
        </div>
        {!form.ageConfirmed && (
          <p className="text-center mt-4 font-label-sm" style={{ color: 'rgba(255,247,229,0.6)' }}>
            Age confirmation is required before continuing to your Passport.
          </p>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl h-11 px-6 flex justify-around items-center" style={{
        background: 'linear-gradient(180deg, rgba(18,13,10,0.42), rgba(6,4,3,0.82))',
        backdropFilter: 'blur(18px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
        borderTop: '1px solid rgba(255,232,186,0.12)',
        boxShadow: '0 -8px 26px rgba(0,0,0,0.24)',
      }}>
        {[
          { icon: 'explore',         label: 'Explore',   active: false, to: '/smokecraft' },
          { icon: 'liquor',          label: 'Inventory', active: false, to: '/smokecraft/available' },
          { icon: 'import_contacts', label: 'Passport',  active: true,  to: '/passport' },
          { icon: 'support_agent',   label: 'Assistant', active: false, to: '/smokecraft/assistant' },
        ].map(({ icon, label, active, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 duration-150 border-0 bg-transparent ${active ? 'text-primary font-bold scale-105' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15, ...(active ? { fontVariationSettings: "'FILL' 1" } : {}) }}>{icon}</span>
            <span style={{ fontSize: 7.5, marginTop: 1 }}>{label}</span>
          </button>
        ))}
      </nav>

      <div aria-hidden="true" style={{ position: 'fixed', bottom: 4, right: 8, zIndex: 999, fontSize: 8, letterSpacing: '0.08em', color: 'rgba(233,193,118,0.4)', pointerEvents: 'none' }}>
        SMOKECRAFT INTAKE CLEAN V2
      </div>

      <style>{`
        .smokecraft-intake-crest {
          width: 72px;
          height: 72px;
          margin: 0 auto 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Playfair Display", serif;
          font-weight: 700;
          font-size: 26px;
          color: #ffd889;
          background: radial-gradient(circle at 35% 30%, rgba(233,193,118,0.26), rgba(10,7,5,0.9));
          border: 1px solid rgba(233,193,118,0.6);
          box-shadow: 0 0 26px rgba(233,193,118,0.3);
        }
        .smokecraft-intake-kicker {
          width: 200px;
          height: 1px;
          margin: 0 auto 16px;
          background: linear-gradient(90deg, transparent, rgba(233,193,118,0.6), transparent);
        }
        .smokecraft-intake-left-scene,
        .smokecraft-intake-right-scene {
          position: fixed;
          top: 0;
          height: min(50vh, 460px);
          width: min(23vw, 320px);
          z-index: 0;
          pointer-events: none;
          opacity: 1;
          background-repeat: no-repeat;
          background-size: 100% auto;
          filter: saturate(1.22) contrast(1.18) brightness(1.08);
          mask-image: linear-gradient(180deg, #000 0%, #000 60%, transparent 100%), linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 70%, transparent 100%);
          mask-composite: intersect;
          -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 60%, transparent 100%), linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 70%, transparent 100%);
          -webkit-mask-composite: source-in;
        }
        .smokecraft-intake-left-scene {
          left: 0;
          background-image: url('/assets/smokecraft/cropped/intake-ashtray-bg.jpg');
          background-position: top left;
        }
        .smokecraft-intake-right-scene {
          right: 0;
          background-image: url('/assets/smokecraft/cropped/intake-whiskey-bg.jpg');
          background-position: top right;
        }
        .smokecraft-intake-card {
          position: relative;
          overflow: hidden;
          width: min(840px, 92vw);
          margin-inline: auto;
        }
        .smokecraft-intake-card > * {
          position: relative;
          z-index: 1;
        }
        .smokecraft-intake input,
        .smokecraft-intake select {
          min-height: 44px;
          padding: 0 12px !important;
          border-radius: 4px;
          background: rgba(0,0,0,0.5) !important;
          color: rgba(255,247,229,0.94) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          text-shadow: 0 1px 10px rgba(0,0,0,0.24);
        }
        .smokecraft-intake select option {
          color: #f8eee1;
          background: #100906;
        }
        .smokecraft-intake label {
          color: rgba(255,247,229,0.78) !important;
        }
        .smokecraft-intake .gold-underline {
          border-bottom-color: rgba(255,205,118,0.44);
        }
        .smokecraft-intake .gold-underline:focus-within {
          border-bottom-color: rgba(255,218,139,0.88);
          box-shadow: 0 10px 24px -18px rgba(255,218,139,0.7);
        }
        @media (max-width: 720px) {
          .smokecraft-intake-left-scene,
          .smokecraft-intake-right-scene {
            opacity: 0.28;
            width: 26vw;
          }
          .smokecraft-intake main {
            padding-left: 18px !important;
            padding-right: 18px !important;
            padding-bottom: 110px !important;
          }
          .smokecraft-intake-card {
            padding: 24px 18px !important;
          }
        }
      `}</style>
    </div>
  )
}
