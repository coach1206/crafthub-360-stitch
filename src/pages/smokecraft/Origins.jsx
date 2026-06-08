import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'


const SEED_PATHS = [
  { label: 'Smooth Starter', desc: 'Gentle introduction with silky, cream-forward genetics.', accent: 'primary', border: true },
  { label: 'Bold Explorer',  desc: 'Robust, full-bodied heirloom strains for the seasoned palate.', accent: null, border: false },
  { label: 'Sweet Finish',   desc: 'Natural sugars preserved through unique high-altitude aging.', accent: 'secondary', border: true },
  { label: 'Earth and Spice',desc: 'Complex notes of cinnamon, cedar, and mineral soil.', accent: null, border: false },
  { label: 'Luxury Reserve', desc: 'A limited hybrid developed for ultra-premium wrappers.', accent: null, border: false },
  { label: 'Rare Leaf',      desc: 'Small-batch cultivation of nearly extinct tobacco varietals.', accent: 'tertiary', border: true },
  { label: 'Social Smoke',   desc: 'Light, airy aromatics designed for conversation and ease.', accent: null, border: false },
  { label: 'Celebration Smoke', desc: 'Festive, dynamic flavors with a long-lasting, memorable finish.', accent: 'primary', border: true },
]

const SOIL_ROWS = [
  {
    label: 'Dominican smooth soil',
    desc: 'Silky texture yielding elegant, creamy profiles with a nutty undertone.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg50HY93Bp-gbVpTpaJiQgmFOuegI7nbYhr8_vpqXP9l39DKN0go7xXdtmCNF0gDR_DWWRJbznGbLKboViDPpCONAkSi5uXEZg4H7lqCeFkzZmU21PIleJJXw6DCnDxtMbYPyk3qnL7dM9-bfT_fQpk-cs31g-0279IRp2DOjKtv10NvtxmYnA1rmzVAjezF9pRTVNvp6qRymNnVQ9q_3xIuK7uXZ6YT2ZukAwz74VHhTGQiM4f7iiKI-QGoq_p39B2N8wcOSycos',
  },
  {
    label: 'Nicaraguan volcanic soil',
    desc: 'Mineral-rich black earth producing bold, spicy, and peppery notes.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUTFaVR-5jBRur8j7rPk_c3CCo47y_mMu_jFyLGgdua5v23hApyWG8j4GI5rw2GeCKXe93Y9Asm2IdY-BtJj7lAbYxEVw1r4BcadXIlrk1HKQun1KboBq0uasGnnWSvD0wSGrgf29Uak7ntw_w0N6WAYxy7vNB-T-jasmaRGaBYLuthqSLMX1Ni8czSlTrdrZOy0CTNtQ_Yoj4NVg8dO2ig_MgYOlXALSaqQP42KFtDPt4IHJQQxBduDh1vqEl1oybE_Xa5pOdcDQ',
  },
  {
    label: 'Honduran rich earth',
    desc: 'Heavy clay content providing strength and deep wooden characters.',
    img: null,
    icon: 'terrain',
  },
  {
    label: 'Ecuadorian wrapper influence',
    desc: 'Cloud-filtered sunlight creates thin, elastic leaves with floral sweetness.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApvWrW8xRtabgC5osR5xaZ-BKdPr_OiBBivJ1MR9ZrWm5egT9kM1kO0AUYYggsh_cuHq_zCRDR-4ZA3a7wsncVtcVXXGQNWV80y9OaIB2oLQouGiMbvrYo_mUWvgxu-IikmYNsZxFKxhOQ8DO9lhNF4STcmQIWDxo252Zs3a64sJk5yirSkRrZBDuLTAzLLbwgrgHbU_WbvpRfDh6BN_ha4-90tx19AOp-9KDHRAaY011PInhE',
  },
]

export default function Origins() {
  const navigate = useNavigate()
  const { completeStep, addXP, awardStamp, session } = useGuestSession()
  const [stampVisible, setStampVisible] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [selectedSeed, setSelectedSeed] = useState(null)
  const stampTimers = useRef([])

  useEffect(() => {
    const alreadyStamped = session.smokecraftStamps?.some(s => s.id === 'seed-soil')
    if (!alreadyStamped) {
      const t1 = setTimeout(() => {
        setStampVisible(true)
        awardStamp('seed-soil', 'origins')
      }, 2500)
      const t2 = setTimeout(() => setStampVisible(false), 8500)
      stampTimers.current = [t1, t2]
    }
    return () => stampTimers.current.forEach(clearTimeout)
  }, [])

  function handleNext() {
    completeStep('origins')
    addXP(XP_AWARDS.ORIGINS_COMPLETE)
    navigate('/smokecraft/leaves')
  }

  return (
    <div className="font-body-md text-on-surface bg-background" style={{ minHeight: 'max(884px, 100dvh)' }}>
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-surface-variant/50 transition-colors duration-300 rounded-full active:scale-95"
            onClick={() => navigate(-1)}
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-label-lg text-label-lg text-on-surface-variant">Step 5 of 20</span>
          <button className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-label-lg text-label-lg hover:bg-primary transition-colors active:scale-95">
            Grand Lounge
          </button>
        </div>
      </header>

      {/* Side nav drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
      <nav
        className="fixed left-0 top-0 h-full w-80 z-[70] flex flex-col py-8 bg-surface-container-high shadow-2xl shadow-black transition-transform duration-300"
        style={{ transform: navOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <div className="px-6 mb-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary">
            <img
              alt="Julian Sterling"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuApZFwdAjVlSjGaW3dPRafxKbesR2BfvYyyEq21fqV8oQowVpYZgmvWXTK2d2ihq39_HDK0Ne2tO9X3-ilLl0QaTmkZEHMqgSI1N44V3Sdnkvsg5vOxsjTnQq5k-HHFfH52JoX4B8wIAt7uymD0z1gJirZPqsO6TiSRBnPQFJFR5bBIurVRit5MGLXa7-jVpR2VuxmhkMgp6XeVxauEZpX9FBKLewuUsjl8f7zb1zk8Uog_6_A3hJuRanH2uVOb93zjFuhd8c5MH6I"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-headline-md text-primary">Julian Sterling</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Platinum Member</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {[
            { icon: 'wine_bar',      label: 'Cellar',      active: false },
            { icon: 'smoking_rooms', label: 'Humidor',     active: false },
            { icon: 'chair',         label: 'Lounge',      active: true  },
            { icon: 'menu_book',     label: 'My Passport', active: false },
            { icon: 'contact_support',label:'Support',     active: false },
          ].map(({ icon, label, active }) => (
            <a
              key={label}
              href="#"
              className={`flex items-center gap-4 px-4 py-3 mx-2 rounded-lg transition-all ${active ? 'bg-secondary-container text-on-secondary-container translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-highest/50'}`}
            >
              <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
              <span className="font-label-lg">{label}</span>
            </a>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-outline-variant/20">
          <p className="text-primary font-label-lg">2,450 Credits</p>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-20 pb-32 min-h-screen relative overflow-hidden">
        {/* Background atmosphere */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img
            className="w-full h-full object-cover grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4XuG6QKkVNzr-9aeajIcp0PKMEh2jzM0pZa9DNSs97MCQY6ixQkI3NWV0GCGPnIGei-U81g8xkT9iTwuciUtcTNOLPDAL3pCkQ_HUeY6M2sV5p5DVOLzuN7FMp4CdmT8PO2JDHVFIm1Yk_EwHqf-TgJqQOhxGgS7K5gk0CfuCDqCdGi4-h88fq-1ARfDFg8LXZ5i2f6nqe7HtmBqz-gUkA2E1NzN_RLCGuzwQW5i0p5YCqiMQk3a_HvRcvkMEa1VBjK5-1Q"
            alt=""
          />
        </div>

        <div className="container mx-auto px-8 relative z-10 py-12 max-w-[1440px]">
          <header className="mb-12 text-center">
            <h2 className="font-headline-xl text-headline-xl gold-text-gradient mb-4">Seed &amp; Soil Exploration</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              The journey of a masterpiece begins deep within the earth. Explore the synergy between genetic heritage
              and the minerals that breathe life into every leaf.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Seed Paths */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">filter_vintage</span>
                <h3 className="font-headline-lg text-headline-lg text-primary-fixed-dim">Seed Paths</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {SEED_PATHS.map(({ label, desc, accent, border }) => {
                  const isActive = selectedSeed === label
                  const borderColor = border
                    ? accent === 'primary' ? 'border-l-primary' : accent === 'secondary' ? 'border-l-secondary' : 'border-l-tertiary'
                    : ''
                  return (
                    <div
                      key={label}
                      onClick={() => setSelectedSeed(isActive ? null : label)}
                      className={`smoked-glass p-6 rounded-xl cursor-pointer group transition-all ${border ? `border-l-4 ${borderColor}` : ''} ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.02]'}`}
                    >
                      <h4 className={`font-label-lg mb-2 ${accent === 'primary' ? 'text-primary' : accent === 'secondary' ? 'text-secondary' : accent === 'tertiary' ? 'text-tertiary' : 'text-on-surface'}`}>
                        {label}
                      </h4>
                      <p className="text-sm text-on-surface-variant">{desc}</p>
                      <div className={`mt-4 h-1 bg-primary transition-all duration-500 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Soil Paths */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">landscape</span>
                <h3 className="font-headline-lg text-headline-lg text-primary-fixed-dim">Soil Paths</h3>
              </div>
              <div className="space-y-4">
                {SOIL_ROWS.map(({ label, desc, img, icon }) => (
                  <div key={label} className="leather-texture p-1 rounded-xl gold-foil-border overflow-hidden group cursor-pointer">
                    <div className="smoked-glass p-5 rounded-lg flex items-center gap-6 transition-transform group-hover:translate-x-2">
                      <div className="w-16 h-16 rounded-full bg-surface-container-highest flex-shrink-0 overflow-hidden border border-outline/30 flex items-center justify-center">
                        {img
                          ? <img className="w-full h-full object-cover" src={img} alt={label} />
                          : <span className="material-symbols-outlined text-3xl">{icon}</span>
                        }
                      </div>
                      <div className="flex-1">
                        <h4 className="font-label-lg text-primary">{label}</h4>
                        <p className="text-sm text-on-surface-variant">{desc}</p>
                      </div>
                      <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4 mt-2">
                  {[
                    { label: 'Mexican San Andrés', sub: 'Dark depth' },
                    { label: 'Brazilian Mata Fina', sub: 'Natural sweetness' },
                  ].map(({ label, sub }) => (
                    <div key={label} className="smoked-glass p-4 rounded-lg text-center border border-outline-variant/20 hover:bg-primary/10 transition-colors cursor-pointer">
                      <h5 className="font-label-sm text-on-surface">{label}</h5>
                      <p className="text-xs text-on-surface-variant">{sub}</p>
                    </div>
                  ))}
                </div>

                <div className="smoked-glass p-4 rounded-lg text-center border border-dashed border-primary/40 hover:border-primary transition-colors cursor-pointer">
                  <h5 className="font-label-sm text-primary">Colombian experimental profile</h5>
                  <p className="text-xs text-on-surface-variant">Untamed highland minerals</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Stamp alert overlay */}
        <div
          className="fixed bottom-32 right-8 z-40 max-w-sm pointer-events-none transition-all duration-700"
          style={{ opacity: stampVisible ? 1 : 0, transform: stampVisible ? 'translateY(0)' : 'translateY(40px)' }}
        >
          <div className="leather-texture p-1 rounded-2xl shadow-2xl overflow-hidden gold-foil-border">
            <div className="smoked-glass p-6 rounded-xl flex items-center gap-6">
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center stamp-reveal">
                  <span className="material-symbols-outlined text-on-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
              <div>
                <h4 className="font-headline-md text-primary leading-tight">Seed and Soil Completion Stamp</h4>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">Added to your Member Passport</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-24 bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/20 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] rounded-t-xl md:hidden">
        {[
          { icon: 'explore',     label: 'Explore',   active: false },
          { icon: 'inventory_2', label: 'Inventory', active: false },
          { icon: 'menu_book',   label: 'Passport',  active: true  },
          { icon: 'auto_awesome',label: 'Assistant', active: false },
        ].map(({ icon, label, active }) => (
          <div key={label} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${active ? 'text-primary bg-primary-container/20 rounded-full px-6 py-2 scale-90' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="font-label-sm text-label-sm mt-1">{label}</span>
          </div>
        ))}
      </footer>

      {/* FAB */}
      <button
        onClick={handleNext}
        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined">local_library</span>
        <span className="font-label-lg">Next: Curation</span>
      </button>
    </div>
  )
}
