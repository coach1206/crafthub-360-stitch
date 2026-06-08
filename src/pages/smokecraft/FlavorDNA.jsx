import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'

const CHARACTERS = ['Sweet', 'Spicy', 'Earthy', 'Creamy', 'Woody', 'Peppery']
const AROMATICS = [
  { label: 'Coffee',    icon: 'coffee' },
  { label: 'Chocolate', icon: 'cookie' },
  { label: 'Vanilla',   icon: 'icecream' },
  { label: 'Oak',       icon: 'nature' },
  { label: 'Leather',   icon: 'wallet' },
  { label: 'Fruit',     icon: 'nutrition' },
  { label: 'Spice',     icon: 'flare' },
]
const OCCASIONS = [
  { label: 'Relaxing',    icon: 'self_improvement' },
  { label: 'Celebrating', icon: 'celebration' },
  { label: 'Business',    icon: 'work' },
  { label: 'Date Night',  icon: 'favorite' },
  { label: 'Sports',      icon: 'sports_score' },
  { label: 'VIP',         icon: 'stars' },
]

export default function FlavorDNA() {
  const navigate = useNavigate()
  const { addXP, completeStep, awardStamp } = useGuestSession()

  const [intensity, setIntensity] = useState(null)
  const [characters, setCharacters] = useState(new Set())
  const [aromatics, setAromatics] = useState(new Set())
  const [body, setBody] = useState(2)
  const [bodyLabel, setBodyLabel] = useState('Medium')
  const [experience, setExperience] = useState(null)
  const [occasion, setOccasion] = useState(null)
  const [showModal, setShowModal] = useState(false)

  function toggleSet(setter, key) {
    setter(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  function handleFinalize() {
    awardStamp('taste-profile', 'flavor-dna')
    addXP(XP_AWARDS.FLAVOR_DNA_COMPLETE)
    completeStep('flavor-dna')
    setShowModal(true)
  }

  function handleContinue() {
    setShowModal(false)
    navigate('/smokecraft/pairing')
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  return (
    <div
      className="font-body-md min-h-screen flex flex-col bg-background text-on-surface overflow-x-hidden relative"
      style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-leather.png')" }}
    >
      {/* Ambient Effects */}
      <div className="absolute inset-0 amber-spotlight pointer-events-none z-0" />
      <img
        alt=""
        className="fixed top-0 left-0 w-full h-full object-cover grayscale opacity-10 pointer-events-none z-0"
        style={{ mixBlendMode: 'screen' }}
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBT8AoImWr7lkCUxh9oOvIhM7b9b1fE2tITl6a5C_gfeMTGWefb35buqhuPqsauy_GTNlO4wSr37hsuXVYszrJhVTbZqQ2mJZmqhCpbLbNhe_FXGWeN1lPEg7BLtr6KhMkn-yhinhDFNbZVHcxBGy-rZdYt2urnOdiHftli_wiT2csl_hbghgmProYwvxPXkJzd4QXGnSiw-N4FPcHyOPBwEXc3UlaffLpoLrQNPdVfQ4btSLLyOU35m80_dKCv9SzYk_LKHIOM66U"
      />

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="material-symbols-outlined text-primary cursor-pointer p-2 hover:bg-surface-variant/50 rounded-full transition-colors active:scale-95">arrow_back</button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          {['Explore', 'Inventory'].map(l => (
            <span key={l} className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors cursor-pointer">{l}</span>
          ))}
          <span className="font-label-lg text-label-lg text-primary cursor-pointer">Passport</span>
          <span className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="font-label-lg text-primary">Julian Sterling</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Platinum Member</p>
          </div>
          <button className="px-6 py-2 bg-primary-container text-on-primary-container font-label-lg rounded-full hover:opacity-90 transition-all">
            Grand Lounge
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-32 pb-32 px-gutter max-w-[1440px] mx-auto w-full relative z-10">
        {/* Progress */}
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <div className="flex justify-between items-end mb-4">
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Step 10 of 20</p>
            <p className="text-[16px] text-on-surface-variant italic font-body-md">Sensory Mapping</p>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[58%] progress-glow transition-all duration-700 ease-in-out" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <h2 className="font-headline-xl text-headline-xl text-center mb-16 text-on-surface drop-shadow-lg">Sensory Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

            {/* Q1: Smooth or bold? */}
            <section className="space-y-6">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
                <span className="material-symbols-outlined">air</span>
                Smooth or bold?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[{ v: 'smooth', icon: 'waves', label: 'Smooth' }, { v: 'bold', icon: 'bolt', label: 'Bold' }].map(({ v, icon, label }) => (
                  <button
                    key={v}
                    onClick={() => setIntensity(v)}
                    className={`gold-foil-border smoked-glass p-8 rounded-xl flex flex-col items-center gap-4 transition-all hover:scale-[1.02] ${intensity === v ? '!bg-primary/20 border-primary' : ''}`}
                  >
                    <span className="material-symbols-outlined text-4xl text-primary">{icon}</span>
                    <span className="font-label-lg text-label-lg uppercase tracking-widest">{label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Q2: Character? */}
            <section className="space-y-6">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
                <span className="material-symbols-outlined">psychology</span>
                Character?
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {CHARACTERS.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleSet(setCharacters, c)}
                    className={`gold-foil-border smoked-glass py-4 rounded-lg font-label-sm text-center transition-all hover:bg-surface-variant/50 ${characters.has(c) ? '!bg-primary/20 border-primary text-primary' : ''}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>

            {/* Q3: Aromatic Nuances? (full-width) */}
            <section className="md:col-span-2 space-y-6">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
                <span className="material-symbols-outlined">tune</span>
                Aromatic Nuances?
              </h3>
              <div className="flex flex-wrap gap-4">
                {AROMATICS.map(({ label, icon }) => (
                  <button
                    key={label}
                    onClick={() => toggleSet(setAromatics, label)}
                    className={`gold-foil-border smoked-glass px-8 py-5 rounded-full flex items-center gap-3 transition-all hover:translate-y-[-2px] ${aromatics.has(label) ? '!bg-primary/20 text-primary' : ''}`}
                  >
                    <span className="material-symbols-outlined text-primary">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Q4: Body Preference? */}
            <section className="space-y-6">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
                <span className="material-symbols-outlined">fitness_center</span>
                Body Preference?
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Mild</span>
                  <input
                    type="range" min="1" max="3" value={body}
                    onChange={e => setBody(Number(e.target.value))}
                    className="flex-grow accent-primary h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Full-bodied</span>
                </div>
                <div className="flex justify-around pt-2">
                  {[['Mild', 1], ['Medium', 2], ['Full', 3]].map(([lbl, val]) => (
                    <button
                      key={lbl}
                      onClick={() => { setBody(Number(val)); setBodyLabel(lbl) }}
                      className={`text-xs uppercase tracking-widest pb-1 border-b transition-colors ${bodyLabel === lbl ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:border-primary'}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Q5: Experience Level? */}
            <section className="space-y-6">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
                <span className="material-symbols-outlined">verified</span>
                Experience Level?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['New', 'Casual', 'Experienced', 'Expert'].map(e => (
                  <button
                    key={e}
                    onClick={() => setExperience(e)}
                    className={`gold-foil-border smoked-glass py-4 rounded-lg font-label-sm transition-all ${experience === e ? '!bg-primary/20 text-primary' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </section>

            {/* Q6: Today's Occasion? (full-width) */}
            <section className="md:col-span-2 space-y-6">
              <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
                <span className="material-symbols-outlined">event</span>
                {"Today's Occasion?"}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {OCCASIONS.map(({ label, icon }) => (
                  <button
                    key={label}
                    onClick={() => setOccasion(label)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border border-outline-variant/30 hover:bg-surface-variant/30 ${occasion === label ? 'bg-primary/20 border-primary/60' : ''}`}
                  >
                    <span className="material-symbols-outlined text-3xl">{icon}</span>
                    <span className="font-label-sm text-label-sm">{label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Passport Milestone Alert */}
          <div className="mt-20 p-8 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center gap-8 smoked-glass">
            <div className="relative flex-shrink-0 w-24 h-24">
              <div className="w-24 h-24 rounded-full border-2 border-primary border-dashed" />
              <span
                className="material-symbols-outlined text-5xl text-primary absolute inset-0 flex items-center justify-center"
                style={FILL1}
              >
                approval
              </span>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h4 className="font-headline-md text-headline-md text-primary mb-1">Passport Milestone</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {"You're about to earn the "}
                <strong className="text-primary">'Taste Profile Completion Stamp'</strong>
                {". Complete this profile to unlock personalized humidor curation and exclusive cellar access."}
              </p>
            </div>
            <button
              onClick={handleFinalize}
              className="w-full md:w-auto px-12 py-5 bg-primary text-on-primary font-label-lg rounded-xl hover:shadow-[0_0_30px_rgba(233,193,118,0.4)] transition-all active:scale-95"
            >
              Finalize Profile
            </button>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-gutter">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleContinue} />
          <div className="smoked-glass gold-foil-border p-12 rounded-3xl max-w-lg w-full relative text-center">
            <span className="material-symbols-outlined text-8xl text-primary mb-6 block" style={FILL1}>stars</span>
            <h3 className="font-headline-xl text-headline-xl text-primary mb-4">Stamp Earned</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10">
              Your Sensory Profile is now mapped. Your personalized CraftHub Passport has been updated with the Taste Profile Completion Stamp.
            </p>
            <button onClick={handleContinue} className="w-full py-4 bg-primary text-on-primary font-label-lg rounded-xl">
              Continue Journey
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-24 bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/20 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] md:hidden">
        {[
          { icon: 'explore',      label: 'Explore',   active: false },
          { icon: 'inventory_2',  label: 'Inventory', active: false },
          { icon: 'menu_book',    label: 'Passport',  active: true  },
          { icon: 'auto_awesome', label: 'Assistant', active: false },
        ].map(({ icon, label, active }) => (
          <div
            key={label}
            className={`flex flex-col items-center justify-center transition-colors ${active ? 'text-primary bg-primary-container/20 rounded-full px-6 py-2' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="font-label-sm text-label-sm">{label}</span>
          </div>
        ))}
      </nav>
    </div>
  )
}
