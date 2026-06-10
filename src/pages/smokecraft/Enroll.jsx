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
    ageConfirmed: false, city: '', state: '', zip: '',
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
      ageConfirmed: form.ageConfirmed,
      photo:        avatarSrc,
    }
    completeGuestProfile(profilePayload)
    setSelectedCraft('SmokeCraft 360')
    completeStep('enroll')
    addXP(XP_AWARDS.PROFILE_COMPLETE)
    navigate('/smokecraft/golden-box')
  }

  function handleDraft() {
    const [firstName, ...rest] = (form.fullName || '').trim().split(' ')
    updateProfile({ firstName: firstName || '', lastName: rest.join(' '), nickname: form.nickname, email: form.email })
  }

  return (
    <div
      className="smokecraft-intake min-h-screen text-on-surface font-body-md overflow-x-hidden"
      style={{
        minHeight: 'max(884px, 100dvh)',
        position: 'relative',
        backgroundColor: '#201a15',
        backgroundImage: 'radial-gradient(ellipse at 50% -10%, rgba(255,233,188,0.42) 0%, rgba(226,174,82,0.18) 28%, transparent 58%), radial-gradient(ellipse at 16% 20%, rgba(255,255,255,0.22) 0%, transparent 34%), radial-gradient(ellipse at 86% 42%, rgba(212,175,55,0.22) 0%, transparent 38%), linear-gradient(135deg, rgba(62,42,24,0.68), rgba(15,12,10,0.84)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuAJ09Qb4oPgovTsugDxP08oGJBDqZvjMBJXAFOH6Qn7ia0xZ8dAkzZSVGkEehm1V_CjE9AkK7Z4_jPCoDAVBGXl9ZcJ_0DRPd3QblAFfEcxeTYxT7DJdrgLcYwAcZtrm8xqaxPJy-ilaG9g3Qe1837GyxeQqWxYsLgWzhkjXZmlERbtG2c2zpBszfUOEnQDwG-5xSnh6hei70Z-NmWLnabLXItL8ypoj-_d3PeyfyMHxNkQtrLlaCSTq5HKLKoWQv8PvhGDOgP4HXQ)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="smokecraft-intake-frost" />
      <div className="smokecraft-intake-amber" />

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
          <button className="text-primary font-label-lg px-6 py-2 rounded-lg transition-colors active:scale-95 duration-200" style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,232,186,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
            Grand Lounge
          </button>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-40 px-8 max-w-[900px] mx-auto">
        {/* Header */}
        <section className="mb-12 text-center">
          <h2 className="font-headline-xl text-headline-xl text-primary mb-4" style={{ textShadow: '0 8px 34px rgba(0,0,0,0.45)' }}>SmokeCraft Intake</h2>
          <p className="font-body-lg max-w-xl mx-auto" style={{ color: 'rgba(248,236,214,0.86)', textShadow: '0 2px 18px rgba(0,0,0,0.42)' }}>
            Complete your identity to join the guild. Your privacy is our priority—only your nickname enters the humidor leaderboard.
          </p>
        </section>

        {/* Form card */}
        <div className="smokecraft-intake-card p-10 rounded-2xl shadow-2xl space-y-12" style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.18), rgba(74,50,31,0.28) 42%, rgba(23,17,13,0.5))',
          backdropFilter: 'blur(34px) saturate(1.32)',
          WebkitBackdropFilter: 'blur(34px) saturate(1.32)',
          border: '1px solid rgba(255,236,196,0.28)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.48), 0 0 46px rgba(233,193,118,0.2), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -1px 0 rgba(212,175,55,0.12)',
        }}>
          {/* Photo upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/60" style={{
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
              <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Confidential Email</label>
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
              <label className="block font-label-sm text-secondary mb-1 uppercase">Leaderboard Nickname</label>
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

            {/* Location */}
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="gold-underline py-2 md:col-span-2">
                <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">City</label>
                <input
                  className="w-full bg-transparent border-none text-body-lg text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 h-12 px-0 focus:outline-none"
                  placeholder="New York"
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                />
              </div>
              <div className="gold-underline py-2">
                <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">State</label>
                <input
                  className="w-full bg-transparent border-none text-body-lg text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 h-12 px-0 focus:outline-none"
                  placeholder="NY"
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                />
              </div>
              <div className="gold-underline py-2">
                <label className="block font-label-sm text-on-surface-variant mb-1 uppercase">Zip</label>
                <input
                  className="w-full bg-transparent border-none text-body-lg text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 h-12 px-0 focus:outline-none"
                  placeholder="10001"
                  type="text"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                />
              </div>
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
          { icon: 'explore',         label: 'Explore',   active: false },
          { icon: 'liquor',          label: 'Inventory', active: false },
          { icon: 'import_contacts', label: 'Passport',  active: true  },
          { icon: 'support_agent',   label: 'Assistant', active: false },
        ].map(({ icon, label, active }) => (
          <div key={label} className={`flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 duration-150 ${active ? 'text-primary font-bold scale-110' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="font-label-sm text-label-sm">{label}</span>
          </div>
        ))}
      </nav>
      <style>{`
        .smokecraft-intake::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 50% 36%, rgba(255,255,255,0.14), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,0.06), transparent 36%, rgba(0,0,0,0.12));
          z-index: 0;
        }
        .smokecraft-intake-frost {
          position: fixed;
          inset: -12%;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse at 28% 34%, rgba(255,255,255,0.18), transparent 30%),
            radial-gradient(ellipse at 60% 16%, rgba(255,245,222,0.16), transparent 36%),
            radial-gradient(ellipse at 76% 66%, rgba(255,255,255,0.08), transparent 30%);
          filter: blur(24px);
          opacity: 0.9;
        }
        .smokecraft-intake-amber {
          position: fixed;
          left: 50%;
          top: 44%;
          width: min(760px, 92vw);
          height: min(560px, 70vh);
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(ellipse at center, rgba(233,193,118,0.24), rgba(233,193,118,0.08) 34%, transparent 68%);
          filter: blur(18px);
        }
        .smokecraft-intake-card {
          position: relative;
          overflow: hidden;
        }
        .smokecraft-intake-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(120deg, rgba(255,255,255,0.16), transparent 32%),
            radial-gradient(ellipse at 70% 0%, rgba(233,193,118,0.18), transparent 44%);
          opacity: 0.85;
        }
        .smokecraft-intake-card > * {
          position: relative;
          z-index: 1;
        }
        .smokecraft-intake input {
          text-shadow: 0 1px 10px rgba(0,0,0,0.24);
        }
        .smokecraft-intake .gold-underline {
          border-bottom-color: rgba(255,232,186,0.24);
        }
        .smokecraft-intake .gold-underline:focus-within {
          border-bottom-color: rgba(255,218,139,0.88);
          box-shadow: 0 10px 24px -18px rgba(255,218,139,0.7);
        }
        @media (max-width: 720px) {
          .smokecraft-intake main {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
          .smokecraft-intake-card {
            padding: 28px 22px !important;
          }
        }
      `}</style>
    </div>
  )
}
