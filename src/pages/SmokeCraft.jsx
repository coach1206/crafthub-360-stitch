import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { getNextSmokecraftRoute, getLastSmokecraftRoute } from '../constants/session.js'

export default function SmokeCraft() {
  const navigate = useNavigate()
  const { session } = useGuestSession()

  useEffect(() => {
    const handler = () => {
      const parallax = document.querySelector('.parallax-bg')
      if (parallax) parallax.style.transform = `translateY(${window.pageYOffset * 0.4}px)`
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function handleStart() {
    navigate(getNextSmokecraftRoute(session.completedSteps))
  }

  function handleResume() {
    if (session.currentSmokecraftStep) {
      navigate(getLastSmokecraftRoute(session.currentSmokecraftStep))
    } else {
      navigate('/smokecraft/enroll')
    }
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-primary/30" style={{ minHeight: 'max(884px, 100dvh)' }}>
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary hover:bg-surface-variant/50 p-2 rounded-full transition-colors duration-300"
            onClick={() => navigate('/')}
          >menu</button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden md:block font-label-lg text-label-lg text-on-surface-variant">Grand Lounge</span>
          <div className="w-10 h-10 rounded-full border border-primary/30 overflow-hidden">
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzfuv2N7QgwLwkNuXvHfKNP93SVWToyEEJeln6LSaXq53InX7Wm46jAcpTSxzQSgyU-n2JsFmawpiAVF8J0H9mIoomaqIoz8SCsm1Kg-NeaFPHbuyEymDdQPuL17jjPts0ym9k7W4DO7HYjONHWwe_ghnDDz-FobZNcCN808hfiWk8bje7gYFJSTnb5E9DOWz-DSiPBtOHTM7F_0o7OZNsaClBcqE0eU06p-VuPG8Asi5qpY4vsu0G4T8EzppqAwa2y5r4gNyPag0"
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative min-h-screen pt-20 pb-32">
        {/* Hero background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center parallax-bg brightness-[0.4]"
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCQvi01dyiQOaL3eFq6x6nNewuibQg39rgwH-Wr9YWWkCJPOL1c-bOW_JmToKrMdlQhuQPCPfLNuVZiJZiU7osW7IauYsUlFVhIkW53MmLW0ci9MRPZoTbcEzVdngrAsUHb2ilp8j4izE7XtzxUlgiMcc1l6foE7PkPOCc8b906Fj3sH-KyWg60C6klgSwpWqQSbMIxAMdG1ZWNxuslbsXwT-CpDQ3QwFaKqedknrQW_LxVRGI61hDwy9jOE9SS3ixRuiVUo-dzuts')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-12 md:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Brand Narrative */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-lg text-label-lg">
                  <span className="material-symbols-outlined text-[18px]">smoking_rooms</span>
                  SMOKECRAFT 360
                </span>
                <h2 className="font-display-lg text-display-lg text-on-surface leading-tight">
                  Discover your <br />
                  <span className="text-primary italic font-serif">cigar profile.</span>
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                  Pair the perfect smoke. Earn participation stamps in your digital passport.
                  Immerse yourself in the world of premium tobacco craftsmanship.
                </p>
              </div>

              {/* Primary actions */}
              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={handleStart}
                  className="h-16 px-8 bg-gradient-to-br from-primary to-primary-container text-on-primary font-label-lg text-label-lg rounded-lg shadow-xl shadow-primary/20 flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                  START SMOKECRAFT
                  <span className="material-symbols-outlined">play_arrow</span>
                </button>
                <button
                  onClick={handleResume}
                  className="h-16 px-8 gold-foil-border text-primary font-label-lg text-label-lg rounded-lg flex items-center gap-3 backdrop-blur-md hover:bg-surface-variant/20 transition-all duration-300"
                >
                  RESUME SESSION
                  <span className="material-symbols-outlined">restore</span>
                </button>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-outline-variant/30">
                {[
                  { icon: 'stars',       label: 'Rewards',  to: '/smokecraft/leaderboard' },
                  { icon: 'leaderboard', label: 'Rankings', to: '/smokecraft/leaderboard' },
                  { icon: 'menu_book',   label: 'Passport', to: '/passport' },
                  { icon: 'arrow_back',  label: 'CraftHub', to: '/' },
                ].map(({ icon, label, to }) => (
                  <button
                    key={label}
                    onClick={() => navigate(to)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-surface-container-high transition-colors group"
                  >
                    <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">{icon}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Bento cards */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-6">
              {/* Passport preview */}
              <div className="relative overflow-hidden p-6 rounded-xl bg-surface-container-high/60 backdrop-blur-xl border border-outline-variant/20 shadow-2xl group cursor-pointer transition-all duration-500 hover:border-primary/40">
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-colors" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-16 h-20 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline-md text-headline-md text-primary">360 Passport</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                      Connect your palate journey. {session.smokecraftStamps.length} stamps earned this season.
                    </p>
                    <div className="mt-6 flex gap-2">
                      {['01','02','03','04'].map((n, i) => (
                        <div key={n} className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] ${i < session.smokecraftStamps.length ? 'border-primary/30 text-primary' : 'border-outline-variant text-outline opacity-40'}`}>{n}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pairing recommendation */}
              <div className="relative overflow-hidden p-6 rounded-xl bg-surface-container-high/60 backdrop-blur-xl border border-outline-variant/20 shadow-2xl group cursor-pointer transition-all duration-500 hover:border-primary/40">
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-label-lg text-label-lg text-primary uppercase tracking-widest">Recommended Pairing</span>
                    <span className="material-symbols-outlined text-on-surface-variant">star_half</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-outline-variant/30">
                      <img
                        alt="Cigar & Bourbon"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6x8rr1W01nKJEp9VAXSLzXMhAPRM2KJoomxxbMnSRkpCfhTXTwunea-4_H_kJccMU_6GV4UYC1ca9Xce8A74TzgZ2ygqntBN2Jry62f84DocQC0tAAOb_qvbn9PV23ObA7Aa74Ro1dbMnSiTSoFUkdCbGHND0obaRjEJF9NpjY4NQTKNB7qbYnAJjPNQuhwBae0ihwcyQkOPdlHR40CKFZhw-m1XQF6CE5VynIvjW-p81iXrCP8xjLwnTtGY7mWVa6R8YePKXErw"
                      />
                    </div>
                    <div>
                      <h4 className="font-headline-md text-headline-md text-on-surface">Padrón 1964</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">Paired with 18yr Single Malt</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-24 bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/20 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] md:hidden">
        <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">explore</span>
          <span className="font-label-sm text-label-sm">Explore</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary bg-primary-container/20 rounded-full px-6 py-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smoking_rooms</span>
          <span className="font-label-sm text-label-sm">SmokeCraft</span>
        </button>
        <button onClick={() => navigate('/passport')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="font-label-sm text-label-sm">Passport</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">auto_awesome</span>
          <span className="font-label-sm text-label-sm">Assistant</span>
        </button>
      </nav>
    </div>
  )
}
