import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'

const PAIRINGS = [
  {
    id: 'bourbon',
    name: 'Old Rip Van Winkle',
    subtitle: 'The Classic Spirit',
    score: 98,
    scoreW: '98%',
    desc: 'Sweet caramel and vanilla undertones that soften the spicy finish of the OpusX.',
    cta: 'Select Pour',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJZsse0-OBgJv-XDIDBT6z6JK8iL9blzeC9kleK1PDkKrj0FsBukHh9bttmrZSUbJTEq5nRcpGZ410InFTORhNwgbrVX3N9_MH0Bo',
  },
  {
    id: 'rum',
    name: 'Zacapa Centenario',
    subtitle: 'The Tropical Depth',
    score: 94,
    scoreW: '94%',
    desc: 'Molasses and dried fruit notes that complement the earthy core of the Dominican tobacco.',
    cta: 'Select Pour',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ82XKQyntwTgn3xxDjYrawzeTtaASYwT_mcTIkMxzqs-6J3Yr-oTLECNP_mzZqFX4uiBg5B-ERa8lDXQy8ny1te9sIfRsA0ww6Ncn0vk4uK05iZgQ5uwKriVqA6ZyXNNadhHdOSMIFP81qtdrhm_NNZOj7KrRSR0tHJ-Cs-nG_Ra9vQout-3ik-TFNOnqj6rXMeuiO9lCUk2-4Vc1r0tO3UQr9meCFsldeQqNnSxutvMgBSsIMYii2N7hjYmhy0sdQY9DvL2sP00',
  },
  {
    id: 'coffee',
    name: 'Blue Mountain',
    subtitle: 'The Morning Ritual',
    score: 91,
    scoreW: '91%',
    desc: 'A clean, bright acidity that cleanses the palate between each long, flavorful draw.',
    cta: 'Select Brew',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1whB9ENQS5yVK7-ZSqInf3ufx2FPgTfXCAe0K8akvyRBTB8moMmSAgsHEzZ4MYuCnY9j0tQgp47LYcOwkut7yCtM8yNlqQzVSDPo6ZhSwqZTybS3LM2MThzggnviBsIffUKi6bI0EIBwm5NfbYc65os7cs9PsiRlSBgG7mGWiMC7afsuN_5riLlpYp9P4_wxIhBHuluPPJwTxtNoqBaJ6IlJFFJUp61Pc',
  },
  {
    id: 'chocolate',
    name: 'Cacao Noir 85%',
    subtitle: 'The Dark Indulgence',
    score: 96,
    scoreW: '96%',
    desc: 'Bitter cocoa solids that mirror the charred cedar notes of the cigar\'s final third.',
    cta: 'Select Plate',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkj1vyr57VqCSvkAIytKCP-dMimzcM6Bkfpo2BogqBmXvJno7XWBIkFHJP0uTjIRf43VMB4VT0fAzPe56ohr59HTYYKsym0J2JV6xGqZPzbw5OHeK9oQVklLm-rTkus0D_QeG5AsW_i3r95SxCCtkda_GbYOLo3MnRfTZ3tRjOehK1rR6yLCjtmEhkAfL3RPm8SEoj5khmFowDyNMdG5WO2fYsQ3Jh34sFkF3uM5Rql5d_S8_0z_f_osUhL3uDZji89YvLMFPAia4',
  },
]

const PROG_BARS = 12

export default function Pairing() {
  const navigate = useNavigate()
  const { addXP, completeStep, awardStamp, addPendingOrder, session } = useGuestSession()

  const [selectedPairing, setSelectedPairing] = useState(null)
  const [showStamp, setShowStamp] = useState(false)
  const [sideNavOpen, setSideNavOpen] = useState(false)

  function handleAddToOrder() {
    if (!selectedPairing) return
    addPendingOrder({ id: selectedPairing.id, name: selectedPairing.name, type: 'pairing' })
    if (!session.completedSteps.includes('pairing')) {
      addXP(XP_AWARDS.PAIRING_COMPLETE)
      completeStep('pairing')
      awardStamp('pairing-specialist', 'pairing')
    }
    setShowStamp(true)
    navigate('/smokecraft/available')
  }

  function handleContinue() {
    if (!session.completedSteps.includes('pairing')) {
      addXP(XP_AWARDS.PAIRING_COMPLETE)
      completeStep('pairing')
    }
    navigate('/smokecraft/available')
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden texture-bg min-h-screen">
      {/* Top AppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className="material-symbols-outlined text-primary hover:bg-surface-variant/50 p-2 rounded-full transition-colors active:scale-95"
          >
            arrow_back
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-label-lg text-label-lg text-primary">Grand Lounge</span>
          <div className="w-10 h-10 rounded-full border border-primary/30 overflow-hidden">
            <img
              alt="Member"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuALdfcSd50DfRFBRxkR_xMSIX-skaK-Wc_K-1fY5HOMd9bA7_pkmMPcGbTYk8zV6alnMGch-O3CqgAZTO6FzbOLa5UwjmOEzTY-KpouMz4Qr4KHXKp_-zuNKE0N4YUde2wjKfasPUw4u3ET-beGIYCsH9uLLJ2vVMHe7NLedYJ7EQDKgapByLeVXlAXm_hUaFmL8MaVHhwx6QLVyH6V7kfNgskzHEQGF1qV3xaJ3PcbrMLFrP92KKiqj2xlzR8ne2PUIclHIH40wMo"
            />
          </div>
        </div>
      </header>

      <main className="pt-28 pb-32 px-margin max-w-[1440px] mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1">Cigar Experience Architect</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Step 11 of 20: The Art of Pairing</h2>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: PROG_BARS }, (_, i) => (
              <div key={i} className={`w-12 h-1 ${i < 11 ? 'bg-primary' : 'bg-surface-variant'}`} />
            ))}
          </div>
        </div>

        {/* Selected Cigar Hero */}
        <div className="glass-card rounded-xl overflow-hidden mb-12 flex flex-col md:flex-row shadow-2xl">
          <div className="md:w-1/3 relative h-64 md:h-auto">
            <img
              className="w-full h-full object-cover"
              alt="Arturo Fuente OpusX"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBjb17tZGWhWOsbXW8XcEiR4WIW8SRdSpM3JbzTootwik0rNdnLOw7S9JZ3EXsRrWIwqWrDXTd8Pvkve7yk0Djguo_fc3IWZ5D9c7ECY5EDcu6g5JsWk0HLo-pS1P0Sp_kNEtMoJ7_UWd-u_nKBePg_hyVmOWBd7C9H9b16E7bHFZlxdXVSBDqmCktK_b7wsck7DeYbjNOVSSREGTNzZg89N6q8Zqmzw_ubYO5Nur2k8euqiBLwOh-CQCTEjFfzzYA0LEgqcCTY6g"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/40 uppercase tracking-tighter">Selection</span>
              <h3 className="font-headline-md text-headline-md text-white mt-2">Arturo Fuente OpusX</h3>
            </div>
          </div>
          <div className="md:w-2/3 p-8 flex flex-col justify-center">
            <div className="mb-4 flex flex-wrap gap-2">
              {['Cedar', 'Leather', 'Spice'].map(tag => (
                <span key={tag} className="bg-surface-container-highest text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">{tag}</span>
              ))}
            </div>
            <div className="border-l-4 border-l-primary pl-4 py-2 bg-primary/5 rounded-r-xl mb-6">
              <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1">Sommelier's Note</p>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed italic">
                "A legendary blend that redefines the pinnacle of tobacco craftsmanship. To elevate its complex notes, our Sommeliers have curated these four distinct pairing paths."
              </p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-sm">stars</span>
                <span className="font-label-lg text-label-lg">Full Bodied</span>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span className="font-label-lg text-label-lg">90 min Smoke</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pairing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12">
          {PAIRINGS.map(p => (
            <div
              key={p.id}
              className={`glass-card rounded-xl group overflow-hidden transition-all duration-500 hover:-translate-y-2 shadow-xl cursor-pointer ${selectedPairing?.id === p.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedPairing(p)}
            >
              <div className="h-48 overflow-hidden">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={p.img}
                  alt={p.name}
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-headline-md text-headline-md text-primary">{p.name}</h4>
                  <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded text-[10px] text-primary border border-primary/20 font-bold uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                    E.A.T.
                  </div>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-4 uppercase tracking-wider">{p.subtitle}</p>
                <div className="mb-4 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-primary uppercase">Match Score</span>
                    <span className="text-xs font-bold text-primary">{p.score}%</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: p.scoreW }} />
                  </div>
                </div>
                <p className="text-on-surface/70 text-sm mb-6">{p.desc}</p>
                <button
                  onClick={e => { e.stopPropagation(); setSelectedPairing(p) }}
                  className={`w-full py-3 gold-border font-label-lg hover:bg-primary/10 transition-colors uppercase ${selectedPairing?.id === p.id ? 'bg-primary text-on-primary' : 'text-primary'}`}
                >
                  {p.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap justify-center items-center gap-6 py-8 border-t border-outline-variant/20">
          <button
            onClick={handleAddToOrder}
            className="flex items-center gap-3 bg-primary text-on-primary px-10 h-[72px] rounded-lg font-label-lg uppercase tracking-widest shadow-[0_0_20px_rgba(197,160,89,0.3)] hover:shadow-[0_0_30px_rgba(197,160,89,0.5)] transition-all border border-primary/50"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            Add to Order
          </button>
          <button className="flex items-center gap-3 gold-border text-primary px-10 h-[72px] rounded-lg font-label-lg uppercase tracking-widest hover:bg-primary/10 transition-all">
            <span className="material-symbols-outlined">concierge</span>
            Call Staff
          </button>
          <button className="flex items-center gap-3 text-on-surface-variant px-6 h-[72px] rounded-lg font-label-lg uppercase tracking-widest hover:text-primary transition-all">
            <span className="material-symbols-outlined">bookmark</span>
            Save Pairing
          </button>
          <button
            onClick={handleContinue}
            className="flex items-center gap-3 bg-surface-container-highest text-primary px-12 h-[72px] rounded-lg font-label-lg uppercase tracking-widest hover:bg-surface-variant transition-all ml-auto"
          >
            Continue
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </main>

      {/* Stamp Notification */}
      {showStamp && (
        <div className="fixed bottom-32 left-margin z-[70] stamp-notification">
          <div className="glass-card p-6 rounded-xl border-l-4 border-l-primary flex items-center gap-6 shadow-2xl max-w-md">
            <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-inner border border-primary/20 flex-shrink-0">
              <span className="material-symbols-outlined text-4xl" style={FILL1}>workspace_premium</span>
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-headline-md text-headline-md text-primary">Pairing Specialist</h5>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-2">
                Cigar Pairing Participation Stamp earned! Your passport has been updated.
              </p>
              <a href="#" className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">menu_book</span>
                Review in Passport
              </a>
            </div>
            <button
              onClick={() => setShowStamp(false)}
              className="material-symbols-outlined text-on-surface-variant hover:text-white transition-colors flex-shrink-0"
            >
              close
            </button>
          </div>
        </div>
      )}

      {/* Slide-out Side Nav */}
      {sideNavOpen && (
        <>
          <div className="fixed inset-0 z-[99] bg-black/40" onClick={() => setSideNavOpen(false)} />
          <nav className="fixed left-0 top-0 h-full w-80 z-[100] flex flex-col py-8 bg-surface-container-high rounded-r-xl shadow-2xl shadow-black translate-x-0 transition-transform duration-500">
            <div className="px-8 mb-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                <img
                  alt="Member Portrait"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuArYh7WPqMfse1OlR24lG2MVWKCMQM4K8dJIz2EVqf3OM2F7YhIy_9JFL6uPb13EqaSRzf9bvA5gE5XrX7xUBfOdMgrFRWcjc04ZAoJSQTtmh48ttF11V90a4EqJGLSE-yi04zG7GPM-2XWIsyR8J9rlAWuXstjcpanZ0bX15gFDaXJhkHyYxLboFEmnrkOlVkZsQXpjNmEWMomHVehaJZ_LUDlF752h6MRSHoIh_Fw-HclFczMkoQQOIcMYDPFI9V1N_IXfYaI7aM"
                />
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-primary">Julian Sterling</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Platinum Member</p>
                <p className="font-label-sm text-label-sm text-primary">2,450 Credits</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { icon: 'wine_bar', label: 'Cellar' },
                { icon: 'smoking_rooms', label: 'Humidor' },
                { icon: 'chair', label: 'Lounge', active: true },
                { icon: 'menu_book', label: 'My Passport' },
                { icon: 'contact_support', label: 'Support', mt: true },
              ].map(({ icon, label, active, mt }) => (
                <a
                  key={label}
                  href="#"
                  className={`flex items-center gap-4 px-4 py-3 mx-2 transition-all rounded-lg ${active ? 'bg-secondary-container text-on-secondary-container translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-highest/50'} ${mt ? 'mt-10' : ''}`}
                >
                  <span className="material-symbols-outlined" style={active ? FILL1 : undefined}>{icon}</span>
                  <span className="font-label-lg text-label-lg">{label}</span>
                </a>
              ))}
            </div>
          </nav>
        </>
      )}

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-24 bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/20 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] md:hidden">
        {[
          { icon: 'explore',      label: 'Explore',   active: false },
          { icon: 'inventory_2',  label: 'Inventory', active: false },
          { icon: 'menu_book',    label: 'Passport',  active: true, fill: true },
          { icon: 'auto_awesome', label: 'Assistant', active: false },
        ].map(({ icon, label, active, fill }) => (
          <div
            key={label}
            className={`flex flex-col items-center justify-center transition-colors ${active ? 'text-primary bg-primary-container/20 rounded-full px-6 py-2' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined" style={fill ? FILL1 : undefined}>{icon}</span>
            <span className="font-label-sm text-label-sm">{label}</span>
          </div>
        ))}
      </nav>
    </div>
  )
}
