import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'

export default function Enroll() {
  const navigate = useNavigate()
  const { updateProfile, completeGuestProfile, completeStep, addXP, setSelectedCraft } = useGuestSession()
  const fileInputRef = useRef(null)
  const [avatarSrc, setAvatarSrc] = useState(null)
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', nickname: '',
    ageConfirmed: false, city: '', state: '', zip: '', countryRegion: '',
  })

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleContinue() {
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
    }
    completeGuestProfile(profilePayload)
    setSelectedCraft('SmokeCraft 360')
    completeStep('enroll')
    addXP(XP_AWARDS.PROFILE_COMPLETE)
    navigate('/smokecraft/format')
  }

  function handleDraft() {
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
        backgroundImage: 'radial-gradient(ellipse at 50% 38%, rgba(255,181,73,0.3) 0%, rgba(155,73,11,0.13) 32%, transparent 60%), linear-gradient(90deg, rgba(0,0,0,0.86), rgba(0,0,0,0.28) 48%, rgba(0,0,0,0.86)), linear-gradient(180deg, rgba(4,3,2,0.24), rgba(3,2,1,0.92)), url(/smokecraft-hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="smokecraft-intake-frost" />
      <div className="smokecraft-intake-smoke-left" />
      <div className="smokecraft-intake-smoke-right" />
      <div className="smokecraft-intake-amber" />
      <div className="smokecraft-intake-spotlight" />
      <div className="smokecraft-intake-left-scene" aria-hidden="true" />
      <div className="smokecraft-intake-right-scene" aria-hidden="true" />

      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 shadow-md flex justify-between items-center px-6 h-20" style={{
        background: 'linear-gradient(180deg, rgba(49,38,28,0.74), rgba(25,19,15,0.58))',
        backdropFilter: 'blur(24px) saturate(1.25)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.25)',
        borderBottom: '1px solid rgba(255,232,186,0.22)',
        boxShadow: '0 10px 44px rgba(0,0,0,0.28)',
      }}>
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary transition-colors p-2 rounded-full active:scale-95 duration-200"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >arrow_back</button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary drop-shadow-[0_2px_2px_rgba(233,193,118,0.35)]">CraftHub 360</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-label-lg hidden md:block" style={{ color: 'rgba(248,236,214,0.82)' }}>Step 3 of 4</span>
          <button onClick={() => navigate('/')} className="text-primary font-label-lg px-6 py-2 rounded-lg transition-colors active:scale-95 duration-200" style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,232,186,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
            Grand Lounge
          </button>
        </div>
      </header>

      <main className="relative z-10 pt-28 pb-52 px-8 max-w-[900px] mx-auto">
        {/* Header */}
        <section className="mb-7 text-center">
          <div className="smokecraft-intake-kicker">SmokeCraft Journey</div>
          <h2 className="font-headline-xl text-headline-xl text-primary mb-3" style={{ color: '#ffd889', textShadow: '0 0 28px rgba(233,193,118,0.62), 0 10px 34px rgba(0,0,0,0.82)' }}>SmokeCraft Intake</h2>
          <p className="font-body-lg max-w-xl mx-auto" style={{ color: 'rgba(255,247,229,0.88)', textShadow: '0 2px 18px rgba(0,0,0,0.72)' }}>
            Complete your identity to join the guild. Your privacy is our priority—only your nickname enters the humidor leaderboard.
          </p>
        </section>

        {/* Form card */}
        <div className="smokecraft-intake-card p-8 rounded-2xl shadow-2xl space-y-8" style={{
          background: 'linear-gradient(145deg, rgba(255,246,224,0.28), rgba(153,100,48,0.34) 34%, rgba(14,10,8,0.76) 100%)',
          backdropFilter: 'blur(28px) saturate(1.34)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.34)',
          border: '1px solid rgba(255,226,158,0.82)',
          boxShadow: '0 30px 96px rgba(0,0,0,0.66), 0 0 92px rgba(233,169,68,0.62), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(212,175,55,0.28)',
        }}>
          {/* Photo upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/60" style={{
                borderColor: 'rgba(255,226,166,0.48)',
                background: 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.24), rgba(233,193,118,0.08) 45%, rgba(20,14,10,0.58))',
                boxShadow: '0 0 34px rgba(233,193,118,0.22), inset 0 1px 0 rgba(255,255,255,0.16)',
              }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-primary/40 text-5xl">add_a_photo</span>
                }
              </div>
              <label
                className="absolute -bottom-2 -right-2 bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-transform"
                htmlFor="photo-upload"
              >
                <span className="material-symbols-outlined text-xl">edit</span>
                <input
                  accept="image/*"
                  className="hidden"
                  id="photo-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <p className="font-label-sm text-primary mt-4 tracking-widest uppercase" style={{ textShadow: '0 2px 14px rgba(0,0,0,0.35)' }}>Member Portrait (Optional)</p>
          </div>

          {/* Form */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10" onSubmit={(e) => e.preventDefault()}>
            {/* Private Identity */}
            <div className="md:col-span-2 flex items-center gap-3 pb-2" style={{ borderBottom: '1px solid rgba(255,232,186,0.2)' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <h3 className="font-label-lg text-primary uppercase tracking-widest">Private Identity</h3>
            </div>

            <div className="gold-underline py-2">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Full Legal Name</label>
              <input
                className="w-full bg-transparent border-none text-body-lg text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 h-12 px-0 focus:outline-none"
                placeholder="e.g. Alistair Sterling"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="gold-underline py-2">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Phone Number</label>
              <input
                className="w-full bg-transparent border-none text-body-lg text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 h-12 px-0 focus:outline-none"
                placeholder="+1 (555) 000-0000"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="gold-underline py-2 md:col-span-2">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Email Address</label>
              <input
                className="w-full bg-transparent border-none text-body-lg text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 h-12 px-0 focus:outline-none"
                placeholder="sterling@private.com"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Lounge Persona */}
            <div className="md:col-span-2 flex items-center gap-3 pb-2 mt-4" style={{ borderBottom: '1px solid rgba(255,232,186,0.2)' }}>
              <span className="material-symbols-outlined text-primary">public</span>
              <h3 className="font-label-lg text-primary uppercase tracking-widest">Lounge Persona</h3>
            </div>

            <div className="gold-underline py-2">
              <label className="block font-label-sm text-secondary mb-1 uppercase">Nickname / Leaderboard</label>
              <input
                className="w-full bg-transparent border-none text-body-lg text-secondary placeholder:text-secondary/20 focus:ring-0 h-12 px-0 focus:outline-none"
                placeholder="The Curator"
                type="text"
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
              />
            </div>

            <div className="gold-underline py-2">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Age Confirmation</label>
              <div className="flex items-center h-12">
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
            <div className="gold-underline py-2 md:col-span-2">
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Country / Region</label>
              <select
                className="w-full bg-transparent border-none text-body-lg text-on-surface focus:ring-0 h-12 px-0 focus:outline-none"
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
          </form>
        </div>

        {/* Actions */}
        <div className="mt-16 flex flex-col md:flex-row gap-6 justify-center">
          <button
            onClick={handleDraft}
            className="order-2 md:order-1 px-12 py-5 rounded-lg border border-primary text-primary font-label-lg tracking-widest hover:bg-primary/10 transition-all active:scale-95 duration-200"
          >
            SAVE AS DRAFT
          </button>
          <button
            onClick={handleContinue}
            className="order-1 md:order-2 px-12 py-5 rounded-lg bg-primary text-on-primary font-label-lg tracking-widest shadow-[0_0_20px_rgba(233,193,118,0.3)] hover:brightness-110 transition-all active:scale-95 duration-200 flex items-center justify-center gap-3"
          >
            CONTINUE TO PASSPORT
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl h-24 px-8 pb-4 flex justify-around items-center" style={{
        background: 'linear-gradient(180deg, rgba(44,32,24,0.72), rgba(11,8,6,0.9))',
        backdropFilter: 'blur(26px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(26px) saturate(1.2)',
        borderTop: '1px solid rgba(255,232,186,0.16)',
        boxShadow: '0 -16px 48px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08)',
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
            className={`flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 duration-150 border-0 bg-transparent ${active ? 'text-primary font-bold scale-110' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="font-label-sm text-label-sm">{label}</span>
          </button>
        ))}
      </nav>
      <style>{`
        .smokecraft-intake::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 50% 42%, rgba(255,224,158,0.3), transparent 38%),
            radial-gradient(ellipse at 18% 48%, rgba(255,255,255,0.22), transparent 32%),
            radial-gradient(ellipse at 84% 38%, rgba(255,255,255,0.2), transparent 30%),
            linear-gradient(180deg, rgba(255,255,255,0.08), transparent 36%, rgba(0,0,0,0.24));
          z-index: 0;
        }
        .smokecraft-intake::after {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            linear-gradient(90deg, rgba(0,0,0,0.72), transparent 28%, transparent 70%, rgba(0,0,0,0.76)),
            radial-gradient(ellipse at 50% 112%, rgba(0,0,0,0.84), transparent 48%);
        }
        .smokecraft-intake-kicker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          color: rgba(255,218,139,0.82);
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-shadow: 0 0 18px rgba(233,193,118,0.42);
        }
        .smokecraft-intake-kicker::before,
        .smokecraft-intake-kicker::after {
          content: "";
          width: 54px;
          height: 1px;
          margin: 0 12px;
          background: linear-gradient(90deg, transparent, rgba(233,193,118,0.62), transparent);
        }
        .smokecraft-intake-left-scene,
        .smokecraft-intake-right-scene {
          position: fixed;
          top: 84px;
          bottom: 86px;
          width: min(36vw, 440px);
          z-index: 0;
          pointer-events: none;
          opacity: 0.86;
          background-size: cover;
          background-position: center;
          filter: saturate(1.02) contrast(1.18) brightness(0.72);
          mask-image: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.9) 42%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.9) 42%, transparent 100%);
        }
        .smokecraft-intake-left-scene {
          left: 0;
          background-image:
            radial-gradient(ellipse at 40% 42%, rgba(233,193,118,0.3), transparent 42%),
            url('/smokecraft.jpg');
        }
        .smokecraft-intake-right-scene {
          right: 0;
          transform: scaleX(-1);
          background-image:
            radial-gradient(ellipse at 48% 46%, rgba(233,193,118,0.28), transparent 40%),
            url('/background-lounge-airy.jpg');
        }
        .smokecraft-intake-frost {
          position: fixed;
          inset: -12%;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse at 14% 42%, rgba(255,255,255,0.28), transparent 24%),
            radial-gradient(ellipse at 50% 22%, rgba(255,220,150,0.16), transparent 34%),
            radial-gradient(ellipse at 88% 52%, rgba(255,255,255,0.22), transparent 26%);
          filter: blur(9px);
          opacity: 0.96;
          mix-blend-mode: screen;
        }
        .smokecraft-intake-smoke-left,
        .smokecraft-intake-smoke-right {
          position: fixed;
          top: 8%;
          bottom: -8%;
          width: 48vw;
          pointer-events: none;
          z-index: 0;
          opacity: 1;
          filter: blur(8px);
          background:
            radial-gradient(ellipse at 30% 18%, rgba(255,255,255,0.3), transparent 22%),
            radial-gradient(ellipse at 48% 42%, rgba(255,255,255,0.24), transparent 30%),
            radial-gradient(ellipse at 52% 72%, rgba(255,230,184,0.18), transparent 28%);
          mix-blend-mode: screen;
        }
        .smokecraft-intake-smoke-left {
          left: -12vw;
          transform: rotate(-7deg);
        }
        .smokecraft-intake-smoke-right {
          right: -12vw;
          transform: scaleX(-1) rotate(-7deg);
        }
        .smokecraft-intake-amber {
          position: fixed;
          left: 50%;
          top: 43%;
          width: min(820px, 94vw);
          height: min(520px, 62vh);
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse at center, rgba(255,205,108,0.76), rgba(233,140,37,0.34) 30%, rgba(130,58,10,0.14) 54%, transparent 72%);
          filter: blur(12px);
          mix-blend-mode: screen;
        }
        .smokecraft-intake-spotlight {
          position: fixed;
          left: 50%;
          top: 20%;
          width: min(520px, 80vw);
          height: min(520px, 56vh);
          transform: translateX(-50%);
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle, rgba(255,232,166,0.32), rgba(233,193,118,0.12) 34%, transparent 68%);
          filter: blur(8px);
          mix-blend-mode: screen;
        }
        .smokecraft-intake-card {
          position: relative;
          overflow: hidden;
          width: min(680px, 100%);
          margin-inline: auto;
        }
        .smokecraft-intake-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(120deg, rgba(255,255,255,0.22), transparent 34%),
            radial-gradient(ellipse at 50% -10%, rgba(255,222,151,0.36), transparent 44%),
            radial-gradient(ellipse at 78% 0%, rgba(233,150,52,0.26), transparent 42%);
          opacity: 0.96;
        }
        .smokecraft-intake-card::after {
          content: "";
          position: absolute;
          inset: 1px;
          pointer-events: none;
          border-radius: inherit;
          box-shadow: inset 0 0 42px rgba(255,255,255,0.05), inset 0 0 90px rgba(233,193,118,0.11);
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
            opacity: 0.32;
            width: 58vw;
          }
          .smokecraft-intake-smoke-left,
          .smokecraft-intake-smoke-right {
            width: 70vw;
          }
          .smokecraft-intake main {
            padding-left: 20px !important;
            padding-right: 20px !important;
            padding-bottom: 210px !important;
          }
          .smokecraft-intake-card {
            padding: 28px 22px !important;
          }
          .smokecraft-intake nav {
            height: 88px !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      `}</style>
    </div>
  )
}
