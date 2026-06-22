import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'

// APPROVED SMOKECRAFT VISUAL RULE: no stock-photo fallback URLs. If a real image is missing, render the appropriate pending placeholder only.
function AvailableImage({ src, alt, className, style, person = false }) {
  const [failed, setFailed] = useState(!src)
  if (!failed && src) {
    return (
      <img className={className} style={style} alt={alt} src={src} onError={() => setFailed(true)} />
    )
  }
  return (
    <div className={className} style={{
      ...style,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,6,3,0.85)', border: '1px solid rgba(233,193,118,0.24)',
      color: 'rgba(233,193,118,0.5)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
    }}>
      {person ? 'Portrait pending' : 'Image pending'}
    </div>
  )
}

const CIGARS = [
  {
    id: 'opus-x',
    badge: 'Best Match',
    badgeColor: 'bg-primary text-on-primary',
    name: 'Arturo Fuente OpusX',
    price: '$42.00',
    priceColor: 'text-secondary',
    origin: 'Dominican Republic • Sun-Grown Rosado',
    strength: 4,
    points: '420 Available',
    notes: ['Cedar', 'Baking Spices', 'Leather'],
    quote: '"Why it matches: The spicy cedar profile perfectly cuts through the honeyed sweetness of your preferred Dalwhinnie 15."',
    img: null,
  },
  {
    id: 'padron-1926',
    badge: 'Premium Upgrade',
    badgeColor: 'bg-secondary text-on-secondary',
    name: "Padrón 1926 Serie No. 1",
    price: '$58.00',
    priceColor: 'text-secondary',
    origin: 'Nicaragua • 5-Year Aged Maduro',
    strength: 5,
    points: '580 Available',
    notes: ['Dark Cocoa', 'Espresso', 'Black Pepper'],
    quote: '"Why it matches: This bold selection elevates your evening with its legendary complexity and uncompromising body."',
    img: null,
  },
  {
    id: 'ashton-vsg',
    badge: 'Smooth Alternative',
    badgeColor: 'bg-tertiary text-on-tertiary',
    name: 'Ashton VSG Sorcerer',
    price: '$26.50',
    priceColor: 'text-secondary',
    origin: 'Ecuador • Sumatra Wrapper',
    strength: 3,
    points: '260 Available',
    notes: ['Cream', 'Caramel', 'Earth'],
    quote: '"Why it matches: A lighter, creamier choice that emphasizes the vanilla undertones of your selected drink profile."',
    img: null,
  },
  {
    id: 'oliva-v',
    badge: 'Budget Match',
    badgeColor: 'bg-outline text-on-surface',
    name: 'Oliva Serie V',
    price: '$14.50',
    priceColor: 'text-secondary',
    origin: 'Nicaragua • Habano Sun Grown',
    strength: 4,
    points: '140 Available',
    notes: ['Nutty', 'Coffee', 'Spice'],
    quote: '"Why it matches: Incredible value for a complex smoke that mirrors the profile of much more expensive boutique blends."',
    img: null,
  },
]

export default function Available() {
  const navigate = useNavigate()
  const { addXP, completeStep, addFavorite } = useGuestSession()
  const [selectedCigar, setSelectedCigar] = useState(null)
  const xpAwarded = useRef(false)

  function handleSelect(cigar) {
    setSelectedCigar(cigar.id)
    addFavorite({ id: cigar.id, name: cigar.name, price: cigar.price, type: 'cigar' })
    if (!xpAwarded.current) {
      xpAwarded.current = true
      addXP(XP_AWARDS.CIGAR_SELECTED)
      completeStep('available')
    }
  }

  return (
    <div className="font-body-md text-body-md select-none bg-background text-on-surface min-h-screen">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 -z-10 bg-background overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/assets/smokecraft/cropped/request-purchase-bg.jpg')" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(0deg, rgba(19,19,20,0.95) 0%, rgba(19,19,20,0.6) 50%, rgba(19,19,20,0.95) 100%)' }}
        />
      </div>

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="material-symbols-outlined text-primary p-2 hover:bg-surface-variant/50 transition-colors duration-300 rounded-full active:scale-95">arrow_back</button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-label-lg text-label-lg text-primary">Grand Lounge</span>
          <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center overflow-hidden">
            <AvailableImage
              alt="Member"
              className="w-full h-full object-cover"
              src={null}
              person
            />
          </div>
        </div>
      </header>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="fixed left-0 top-0 h-full w-80 z-[60] flex-col py-8 bg-surface-container-high hidden lg:flex transition-all duration-500">
        <div className="px-8 mb-10 mt-16">
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Julian Sterling</h2>
          <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest">Platinum Member</p>
          <div className="mt-4 px-4 py-2 bg-secondary-container/20 rounded-lg border border-secondary-container/30">
            <span className="text-primary font-bold">2,450 Credits</span>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { icon: 'wine_bar', label: 'Cellar' },
            { icon: 'smoking_rooms', label: 'Humidor' },
            { icon: 'chair', label: 'Lounge', active: true },
            { icon: 'menu_book', label: 'My Passport' },
            { icon: 'contact_support', label: 'Support' },
          ].map(({ icon, label, active }) => (
            <div
              key={label}
              aria-disabled={!active}
              title={active ? undefined : 'Coming soon'}
              className={`flex items-center gap-4 px-8 py-3 transition-all ${active ? 'bg-secondary-container text-on-secondary-container rounded-r-full mr-4' : 'text-on-surface-variant/50'}`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-label-lg text-label-lg">{label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="pt-24 pb-32 md:pb-24 lg:ml-80 min-h-screen px-4 md:px-gutter max-w-[1440px] mx-auto">
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-primary mb-2 opacity-80">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span className="font-label-sm text-label-sm uppercase tracking-[0.2em]">Step 10: Curated Selection</span>
          </div>
          <h2 className="font-headline-xl text-headline-xl text-on-surface mb-4">Your Recommendations</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Based on your preference for earth tones, medium-full body, and Highland scotch pairings, our Master Sommelier has selected these five extraordinary vitolas.
          </p>
        </header>

        {/* Recommendation Feed */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {CIGARS.map(cigar => (
            <article
              key={cigar.id}
              className={`smoked-glass rounded-xl overflow-hidden flex flex-col md:flex-row group transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${selectedCigar === cigar.id ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="md:w-2/5 relative overflow-hidden">
                <AvailableImage
                  alt={cigar.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={cigar.img}
                />
                <div className={`absolute top-4 left-4 ${cigar.badgeColor} font-label-lg px-4 py-1 rounded-full shadow-lg text-sm`}>
                  {cigar.badge}
                </div>
              </div>
              <div className="md:w-3/5 p-card-padding flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md text-headline-md text-primary">{cigar.name}</h3>
                    <span className={`font-bold ${cigar.priceColor}`}>{cigar.price}</span>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-4 uppercase tracking-widest">{cigar.origin}</p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block mb-1">STRENGTH</span>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className={`h-1 flex-1 ${i < cigar.strength ? 'bg-primary' : 'bg-surface-variant'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block mb-1">POINTS</span>
                      <span className="text-primary font-bold">{cigar.points}</span>
                    </div>
                  </div>
                  <div className="mb-6">
                    <span className="font-label-sm text-label-sm text-outline block mb-2 uppercase">Flavor Notes</span>
                    <div className="flex flex-wrap gap-2">
                      {cigar.notes.map(n => (
                        <span key={n} className="px-3 py-1 bg-surface-container-highest border border-outline-variant/30 rounded-full font-label-sm text-label-sm">{n}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-primary-container/10 border-l-2 border-primary rounded-r-lg mb-6">
                    <p className="italic text-on-surface-variant text-sm">{cigar.quote}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => handleSelect(cigar)}
                    className={`flex-1 gold-foil-border py-3 rounded-lg font-label-lg transition-all duration-300 ${selectedCigar === cigar.id ? 'bg-primary text-on-primary' : 'text-primary hover:bg-primary hover:text-on-primary'}`}
                  >
                    {selectedCigar === cigar.id ? 'Selected ✓' : 'Select Cigar'}
                  </button>
                  <button className="px-4 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors">
                    <span className="material-symbols-outlined">wine_bar</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate('/smokecraft/session-complete')}
            disabled={!selectedCigar}
            className={`flex items-center gap-3 px-12 py-5 rounded-xl font-label-lg uppercase tracking-widest transition-all active:scale-95 ${selectedCigar ? 'bg-primary text-on-primary hover:shadow-[0_0_30px_rgba(233,193,118,0.4)]' : 'bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed'}`}
          >
            {selectedCigar ? 'Continue to Session Summary' : 'Select a cigar above to continue'}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-24 bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/20 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] md:hidden">
        {[
          { icon: 'explore',      label: 'Explore',   active: false },
          { icon: 'inventory_2',  label: 'Inventory', active: false },
          { icon: 'menu_book',    label: 'Passport',  active: true },
          { icon: 'auto_awesome', label: 'Assistant', active: false },
        ].map(({ icon, label, active }) => (
          <div
            key={label}
            aria-disabled={!active}
            title={active ? undefined : 'Coming soon'}
            className={`flex flex-col items-center justify-center transition-colors ${active ? 'text-primary bg-primary-container/20 rounded-full px-6 py-2 scale-90 duration-300' : 'text-on-surface-variant/50'}`}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="font-label-sm text-label-sm">{label}</span>
          </div>
        ))}
      </nav>
    </div>
  )
}
