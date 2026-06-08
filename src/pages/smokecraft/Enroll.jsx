import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'

export default function Enroll() {
  const navigate = useNavigate()
  const { updateProfile, completeGuestProfile, completeStep, addXP } = useGuestSession()
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
      className="min-h-screen text-on-surface font-body-md overflow-x-hidden"
      style={{
        minHeight: 'max(884px, 100dvh)',
        backgroundColor: '#0e0e0f',
        backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(233,193,118,0.15), transparent), linear-gradient(rgba(14,14,15,0.9), rgba(14,14,15,0.9)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuAJ09Qb4oPgovTsugDxP08oGJBDqZvjMBJXAFOH6Qn7ia0xZ8dAkzZSVGkEehm1V_CjE9AkK7Z4_jPCoDAVBGXl9ZcJ_0DRPd3QblAFfEcxeTYxT7DJdrgLcYwAcZtrm8xqaxPJy-ilaG9g3Qe1837GyxeQqWxYsLgWzhkjXZmlERbtG2c2zpBszfUOEnQDwG-5xSnh6hei70Z-NmWLnabLXItL8ypoj-_d3PeyfyMHxNkQtrLlaCSTq5HKLKoWQv8PvhGDOgP4HXQ)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 shadow-md border-b border-outline-variant bg-surface/90 backdrop-blur-xl flex justify-between items-center px-6 h-20">
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-200"
            onClick={() => navigate('/smokecraft')}
          >menu</button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary drop-shadow-[0_2px_2px_rgba(233,193,118,0.5)]">CraftHub 360</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-label-lg text-on-surface-variant hidden md:block">Step 3 of 4</span>
          <button className="bg-surface-container-high text-primary font-label-lg px-6 py-2 rounded-lg hover:bg-surface-container-highest transition-colors active:scale-95 duration-200">
            Grand Lounge
          </button>
        </div>
      </header>

      <main className="pt-32 pb-40 px-8 max-w-[900px] mx-auto">
        {/* Header */}
        <section className="mb-12 text-center">
          <h2 className="font-headline-xl text-headline-xl text-primary mb-4">SmokeCraft Intake</h2>
          <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto">
            Complete your identity to join the guild. Your privacy is our priority—only your nickname enters the humidor leaderboard.
          </p>
        </section>

        {/* Form card */}
        <div className="leather-card p-10 rounded-xl shadow-2xl space-y-12">
          {/* Photo upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center bg-surface-container overflow-hidden transition-all group-hover:border-primary/60">
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
            <p className="font-label-sm text-primary mt-4 tracking-widest uppercase">Member Portrait (Optional)</p>
          </div>

          {/* Form */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10" onSubmit={(e) => e.preventDefault()}>
            {/* Private Identity */}
            <div className="md:col-span-2 flex items-center gap-3 border-b border-outline-variant pb-2">
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
            <div className="md:col-span-2 flex items-center gap-3 border-b border-outline-variant pb-2 mt-4">
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
      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.5)] h-24 px-8 pb-4 flex justify-around items-center">
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
    </div>
  )
}
