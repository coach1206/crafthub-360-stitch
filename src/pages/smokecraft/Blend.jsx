import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'
import {
  SmokeCraftAtmosphericBackground,
  SmokeCraftBottomNav,
} from '../../components/smokecraft/SmokeCraftPremium.jsx'

const WRAPPERS = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMxHg5VUIQz2opEFUOvAZaHkGnvXKQ9yDFdsq3RUowHT7ozQeGhkOj4CtmRKiM64Y--LZWrD2SfEqNVNEH5IZUbCwfEJYQpQwwcdMQAeOyCUeYQg-zVwzE-DvSbMRj8Cw_DUs1wIH-vZ_9HgSCJd4UG2wAR0buIJt-vZYQA8hg9avSf8LT23EFKEFs-MFFo7yLtpvTd-wvvXzkeo0sNBrWfsPNQiHid4U8fxXVVtkjV2jsMDW_0AsjU-Q3UH0N9nSdOOHzqSQuD9U',
    name: 'Habano Maduro Heritage',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxTg65Wt9uZIkpBqyy4dP-yfpAOzZbz2z5ZkV13oVaJ2SAkBidZBFP7grSXlnvgp0rzviZQ5z2QkEdoI5kL1JIAKOIeQwpBh6JQcEGoYgi9hWq5KktjPbu0JFnOgOPJQVxxQ5dzEyYiC6zZsnAzdfCzfC2_n70T7Il7VU5QitXotLyl-tyuOyPD8qOjumx5OXXmnAYMXRe-yumHpuykGEynj_dpEkroC7aiLKuXGRVBObPXsvZ5CI4Og0tcI5Qts4m648an1iWXHk',
    name: 'Ecuador Connecticut',
  },
]

const BINDERS = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-wFKd36V8Kte15q8k8B-07-DyWINrytg3jtB6nOkc55ovBl4NALS6YptCCnVeaf3H0BiZaFZyCPhdpRz6cJuFHWafpHgA0bqZij04ksDjTgbbT5XRZzsSojqvCQVT5O8jsyto4qMMBNy06XdXMxckzv0jbOT8tWEt9Nt1Z6g8UILoCRPg0EX6hSOgzhvRWrHCdvSBENZGQ1W5nkASD5aX019MPiabFOQUvieuxQyNse6-qHGoiBrr39deuAFKC3uxypdFhGZN_8U',
    name: "Estelí Criollo '98",
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZfnH-MsSB9L3fIvUmuB2jydCCAwvaAMEPJRNZecV6PKAJjHl8HulsTrHI7spXAr_AUXO1qSOOPo_DW4VdixxR-ayV4PnjVm2xiPhwWoFuWAF5PXCEsSlxekHHk-9vi2U4TZZT_qBdTVZ_-asuKsewgotaUAHMpqQqbSTlWGbxa8cyI7OPGMqVK5UT3jPVfaKM9X6uqMaQVfu-wFOCMZ_jY166IMOq2LWncgNMBJG-6FojwRTZejpcpIJ7mK8e1pi_2SjsjN9CTYo',
    name: 'Corojo Binder',
  },
]

const FILLERS = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBktRXv3px18iAdmk-FIbB6ajfhPahwqk9W_JP8Z3CMm5d75I1D5sQYn3y5CtixAGzZo0bWs5yXhZQ8TGcBZxfdlOrRy-X2jzZpEocDLKB-z48LeV4PdnPkWAu1EF0aLxDcp6N-JXmverp_fSYWKdujWH1FrWoLUY1CgVrJguJJeILwvw4JN5SLy70oWxWGRHWFymEXJ3FzmzsY93qIxljsbG1ANTGrbqwoIcmIQ6eUZnCsPhFk08_Z55717Itp90HwmP1ssOO0o',
    name: 'Ometepe',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7N47zDRsd9xrna2FHDxZmmuHa9zMDEUx9pMH9OCchjzHa3TdmwiSK8rUNWCu3tQGc-DAewn13cJY0epAJPIuDmMkZDOxrSVbOlyqVToXKvvjL6eG_DDV4N_NgC9R-umyF3Ju6St0MmAbi63vwiC983oWNNS-xjiFcTNM2U0WpVcTXm-UZIbkyIPsqPC1U2cXP_tBIdctZFXNXkmSZml4JE2zbuDf4hyFSqmaSAAOlPQFZcXaAVWIcu0KFWBuNqFEsHk7jQouxUVY',
    name: 'Jalapa',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBChsiFnTvnyOgSUpMyb4bHIgSDdIDhtpVEibdxcWU0oqYOeuVhtcpaQzJvQfET3Dl4wY9hl8p0fpXwW4XrqkFuv9HW2neJbZUZKfMZGQCfkXjs_fRdITEoj5UvPENLQzNGUUM_RBaDeiJ-jn_US4q1RIfcVoAzzXno57Z3KAEbJOV54Ym7cFmm9S_sigXryY_V0GkHk1A-cDY_EY3FBroW7N8DIF1iWCMn_WfRHq2S5Z-vavYMLfgkOelI1guIV4t6T3wFJJYPkZ8',
    name: 'Condega',
  },
]

export default function Blend() {
  const navigate = useNavigate()
  const { addXP, completeStep, awardStamp } = useGuestSession()

  const [selectedWrapper, setSelectedWrapper] = useState(0)
  const [selectedBinder, setSelectedBinder] = useState(0)
  const [selectedFillers, setSelectedFillers] = useState(new Set([0, 1, 2]))

  function toggleFiller(i) {
    setSelectedFillers(prev => {
      const next = new Set(prev)
      if (next.has(i)) { next.delete(i) } else if (next.size < 3) { next.add(i) }
      return next
    })
  }

  function handleSubmit() {
    addXP(XP_AWARDS.BLEND_CREATED)
    completeStep('blend')
    awardStamp('master-blend', 'blend')
    navigate('/smokecraft/flavor-dna')
  }

  return (
    <div className="smokecraft-premium-page relative text-on-background font-body-md overflow-x-hidden selection:bg-primary/30">
      <SmokeCraftAtmosphericBackground variant="education" />
      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-[1] opacity-45 pointer-events-none">
        <img
          alt="Background"
          className="w-full h-full object-cover opacity-60"
          src="https://lh3.googleusercontent.com/aida/AP1WRLtj5JwkrPxrixCHOG-zYc0I132qSqfPBoOMSk6vfHero4WAiBipQc-lZT7hXU1GpL6px8LH9kYjGodZhH3N8nj4PPbYOxr9GAZPkrO0051iTZg7S8ugdj8Jjhb1Nk1ypTQVWHqE6FAxbE10qnVi4vZsWlx-ERtDmWU97juw1txqVGwGBCCyPBZ0d56Ipsq-2AoFCMCvEkr3KBKpxovN6AFO6VxoRAIzzw3xk5lxCphgeEU6xTGCqGzLaag"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
      </div>

      {/* Top Navigation Shell */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin py-unit bg-black/45 backdrop-blur-[40px] border-b border-primary/20">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="material-symbols-outlined text-primary p-2 hover:bg-white/10 transition-colors rounded-full active:scale-95">arrow_back</button>
          <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter">CRAFTHUB 360</span>
        </div>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-6">
            <span className="text-primary font-bold text-[10px] tracking-[0.2em] font-label-sm cursor-pointer uppercase">CHALLENGES</span>
            <span className="text-secondary text-[10px] tracking-[0.2em] font-label-sm cursor-pointer uppercase hover:scale-95 transition-transform hover:brightness-125">VAULT</span>
            <span className="text-secondary text-[10px] tracking-[0.2em] font-label-sm cursor-pointer uppercase hover:scale-95 transition-transform hover:brightness-125">CONNOISSEUR</span>
          </nav>
          <div className="h-10 w-10 rounded-full border border-primary/30 flex items-center justify-center overflow-hidden bg-surface-container-high transition-all duration-300 hover:scale-110 cursor-pointer">
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCq4_EpkSpYVcHVlVxnKXJacUbdRmQWEovF-KvyMHM6dJqnGjPivNcRVqPojva00dcFw-6BVVfhI1gFLcaSclOfplLXr3i6MUVX4P-hkoIEfJTKgiHqRbMzmwdN_3t5yChLEGMio7Do167r-rCSqyVByUbYjQFGK9oISPUctIdJqwIGb-QKw2h3XuvSYjbpmyaRpt-JnoQzW41fw_DgeBRzjFoBukHh9bttmrZSUbJTEq5nRcpGZ410InFTORhNwgbrVX3N9_MH0Bo"
            />
          </div>
        </div>
      </header>

      {/* Navigation Drawer */}
      <aside className="fixed left-0 top-0 h-full z-40 pt-20 w-72 bg-black/30 backdrop-blur-[40px] border-r border-primary/15 hidden lg:flex flex-col">
        {/* Brand block */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg gold-foil flex items-center justify-center text-on-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px] font-bold">token</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="text-primary font-bold text-[13px] tracking-[0.12em] uppercase" style={{ whiteSpace: 'nowrap' }}>CraftHub 360</p>
              <p className="text-[9px] tracking-[0.14em] uppercase opacity-50" style={{ color: '#D4AF37', whiteSpace: 'nowrap' }}>Orchestrate · Curate · Elevate</p>
            </div>
          </div>
        </div>

        {/* Module nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {[
            {
              label: 'SmokeCraft', sub: 'Signature Blends', active: true, to: '/smokecraft',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBibwIn3K4im-7feOc6MbE0qrLgoKLyluRCrG3hjStuvfdpV18KH3A62G-Qz_6SVfNrj8RmOIz4hgjZbsiGf5vrfo17Uf0QYtARmYGCz3AONU-8UZEcE8OSFgxjJwc2qzjNic1fMb52TVcCBU_2QQ-yDTSHGdEzFFXRQYmR_R8lGcWMHEeM5hpoR4wpZFsjtro1GAI7dOrXg5xHk9gr32bXN3Vbzy7Ng-LmBNF7rU_vEhH3psYZXs9IvOT6qmbzmAV5Jtgn4Cdo8XQ',
            },
            {
              label: 'BeerCraft', sub: 'Artisan Pairings', active: false, to: '/beercraft',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7VKTY8DSDP4GuM4QjYR6EUZ4LubDo2yCakN2HYV6KyES6tx4THIbwtZKTJGP7jwwJa0Y6Mpwe7t4lB4Z6ZrtkphJapCLIUjlAPK5yHz-y4rHZPgVcmGAqu2dBojUcETurbHllrTS7OdYNtG59QmMelXGI4jLltYxca6qYZFERSoyNOPC51Er70AmYxHA9cNjDpdI-4qDJHTY_Buz0AhxIxquJ5jyxJLlm9k4VqSjh11zr9yTQ5djQ81CEGXwI41JwzsUu5pAUzB4',
            },
            {
              label: 'PourCraft', sub: 'Mixology Curated', active: false, to: '/pourcraft',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjHHIqUqm4IOBASD9e2CFzmQ4Vt8WRSqfeXFt8t_1i2pPsfxMn84WFBCXRIk_Bd1AjSxcXHBCeNc41pSby-goSyKfSuQe5AOAaLaBlpi6JnD_7fhr1sPy6VbWBiTzmjmFzEwjw8z5kQIVkiKACQgwi-HzB-sAbPIleq_5tachES6TA9xVwf7i_1v1HOewxIVMzGkOsmiCHglJ001ONH5Cj1WC3TTNUZGDRHqfeKBppL49vwAMhY09pzWoCB-KDVF6TYDa-xhKCOS8',
            },
            {
              label: 'WineCraft', sub: 'Vintage Selections', active: false, to: '/winecraft',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN-VSDDSik_99uYcdNQK9qplzBEeBHFI5GylQ4yLuTVURyE09ShNJzs5TFDa5QWyyJqQjK9XXkZtTSgGc3zY8-pfx1LHbrOayvxB1x5xOIbt0i472thBGJ6WOX3Jl2NwrYJNbGUYOeMCs-mohmkNWfHVU7VLntJ1SjdlDhqth5FyEiWKPI00krkamgowHVvovuXEXO1EBTHCDeFDRxeFFSoRI5OGRdtY96RyQbRrtNMWUqWI7x4AuazZYNAIqroB1vsEBlsjx7su8',
            },
            {
              label: '360 Passport', sub: 'Global Access', active: false, to: '/passport',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQvi01dyiQOaL3eFq6x6nNewuibQg39rgwH-Wr9YWWkCJPOL1c-bOW_JmToKrMdlQhuQPCPfLNuVZiJZiU7osW7IauYsUlFVhIkW53MmLW0ci9MRPZoTbcEzVdngrAsUHb2ilp8j4izE7XtzxUlgiMcc1l6foE7PkPOCc8b906Fj3sH-KyWg60C6klgSwpWqQSbMIxAMdG1ZWNxuslbsXwT-CpDQ3QwFaKqedknrQW_LxVRGI61hDwy9jOE9SS3ixRuiVUo-dzuts',
            },
            {
              label: 'E.A.T.', sub: 'Culinary Journeys', active: false, to: '/',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkj1vyr57VqCSvkAIytKCP-dMimzcM6Bkfpo2BogqBmXvJno7XWBIkFHJP0uTjIRf43VMB4VT0fAzPe56ohr59HTYYKsym0J2JV6xGqZPzbw5OHeK9oQVklLm-rTkus0D_QeG5AsW_i3r95SxCCtkda_GbYOLo3MnRfTZ3tRjOehK1rR6yLCjtmEhkAfL3RPm8SEoj5khmFowDyNMdG5WO2fYsQ3Jh34sFkF3uM5Rql5d_S8_0z_f_osUhL3uDZji89YvLMFPAia4',
            },
            {
              label: 'POS 3', sub: 'Hospitality Ops', active: false, to: '/pos3',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-wFKd36V8Kte15q8k8B-07-DyWINrytg3jtB6nOkc55ovBl4NALS6YptCCnVeaf3H0BiZaFZyCPhdpRz6cJuFHWafpHgA0bqZij04ksDjTgbbT5XRZzsSojqvCQVT5O8jsyto4qMMBNy06XdXMxckzv0jbOT8tWEt9Nt1Z6g8UILoCRPg0EX6hSOgzhvRWrHCdvSBENZGQ1W5nkASD5aX019MPiabFOQUvieuxQyNse6-qHGoiBrr39deuAFKC3uxypdFhGZN_8U',
            },
          ].map(({ label, sub, active, to, img }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 12,
                border: active ? '1px solid rgba(212,175,55,0.45)' : '1px solid transparent',
                background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Image medallion */}
              <div style={{
                width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                border: active ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: active ? '0 0 12px rgba(212,175,55,0.2)' : 'none',
              }}>
                <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: active ? 'none' : 'brightness(0.5) saturate(0.6)' }} />
              </div>
              {/* Labels */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: active ? 700 : 500, fontSize: 14, color: active ? '#D4AF37' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.22)', marginTop: 2 }}>{sub}</div>
              </div>
              {/* Active indicator */}
              {active && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', flexShrink: 0 }} />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="relative z-10 pt-32 pb-24 px-gutter lg:pl-[340px] max-w-[1440px] mx-auto">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="font-display-lg text-display-lg text-primary mb-4 leading-tight">Master Blend Challenge</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl opacity-80 leading-relaxed">
              Orchestrate your signature vitola. Select from our heritage seed banks to create a profile that balances intensity, body, and aroma.
            </p>
          </div>
          <div className="glass-panel p-card-padding rounded-xl flex items-center gap-6 titanium-border">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-white/5" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[spin_3s_linear_infinite]" />
              <span className="font-headline-lg text-headline-lg text-primary">94</span>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-secondary uppercase">ORCHESTRATION</p>
              <p className="font-body-md text-body-md text-white mt-1">Excellent Balance</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
          {/* Selection Area (Bento Layout) */}
          <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wrapper Selection */}
            <section className="glass-panel p-card-padding rounded-xl titanium-border group hover:border-primary/40 transition-all duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-primary opacity-60 uppercase">PHASE 01</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface mt-1">Wrapper</h3>
                </div>
                <span className="material-symbols-outlined text-primary/50">layers</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {WRAPPERS.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedWrapper(i)}
                    className={`w-[72px] h-[72px] rounded-lg p-[1px] transition-transform hover:scale-105 active:scale-95 ${selectedWrapper === i ? 'gold-foil' : 'titanium-border opacity-40 hover:opacity-100'}`}
                  >
                    <div className="w-full h-full bg-background/80 rounded-[7px] flex items-center justify-center overflow-hidden border border-white/10">
                      <img className="w-full h-full object-cover" src={w.img} alt={w.name} />
                    </div>
                  </button>
                ))}
                <button className="w-[72px] h-[72px] rounded-lg titanium-border p-[1px] opacity-40 hover:opacity-100 transition-all">
                  <div className="w-full h-full bg-background/20 rounded-[7px] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/20">add</span>
                  </div>
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  SELECTED: <span className="text-primary">{WRAPPERS[selectedWrapper].name}</span>
                </p>
              </div>
            </section>

            {/* Binder Selection */}
            <section className="glass-panel p-card-padding rounded-xl titanium-border group hover:border-primary/40 transition-all duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-primary opacity-60 uppercase">PHASE 02</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface mt-1">Binder</h3>
                </div>
                <span className="material-symbols-outlined text-primary/50">texture</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {BINDERS.map((b, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedBinder(i)}
                    className={`w-[72px] h-[72px] rounded-lg p-[1px] transition-transform hover:scale-105 active:scale-95 titanium-border ${selectedBinder === i ? 'ring-2 ring-primary ring-offset-4 ring-offset-background/40' : 'opacity-40 hover:opacity-100'}`}
                  >
                    <div className="w-full h-full bg-background/20 rounded-[7px] flex items-center justify-center overflow-hidden">
                      <img className="w-full h-full object-cover" src={b.img} alt={b.name} />
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  SELECTED: <span className="text-primary">{BINDERS[selectedBinder].name}</span>
                </p>
              </div>
            </section>

            {/* Filler Selection (Double Wide) */}
            <section className="md:col-span-2 glass-panel p-card-padding rounded-xl titanium-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-primary opacity-60 uppercase">PHASE 03</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface mt-1">Filler Master Mix</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-[10px] font-bold text-primary">
                  {selectedFillers.size} SLOTS ACTIVE
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {FILLERS.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => toggleFiller(i)}
                    className={`w-[72px] h-[72px] rounded-lg p-[1px] transition-transform hover:scale-105 ${selectedFillers.has(i) ? 'gold-foil' : 'titanium-border opacity-40 hover:opacity-100'}`}
                  >
                    <div className="w-full h-full bg-background/80 rounded-[7px] flex items-center justify-center overflow-hidden border border-white/10">
                      <img className="w-full h-full object-cover" src={f.img} alt={f.name} />
                    </div>
                  </button>
                ))}
                <button className="w-[72px] h-[72px] rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center group hover:border-primary/40 transition-colors">
                  <span className="material-symbols-outlined text-white/10 group-hover:text-primary transition-colors">add_circle</span>
                </button>
              </div>
            </section>
          </div>

          {/* Mentor & Intensity Sidebar */}
          <div className="xl:col-span-4 space-y-6">
            {/* Master Mentor Feedback */}
            <div className="glass-panel p-card-padding rounded-xl titanium-border relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full border border-primary overflow-hidden">
                  <img
                    alt="Mentor"
                    className="w-full h-full bg-surface-container object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAb_QZr6Rcm5yAhoSToxjFZlKstPP_xnANgwmcyebOi0hM07Oc1SIX0GSF_Syk0jBYjnBOFZH6USUIgzjk5Z2IvBbJ9KPe7FZxm4Nr2zEfiUD3pj5SrHSrKTqrHnHZ7b6_PXBFAEA-POR-ylC-x_OD_RU-x7tqzqgVYZKxSV18uwF4EjoMgLf5YAXyaknUAZVGRjIiijHuUWkG5-_gH_xsHMhYlP-2-aGuwZuieceSWjeP3c4o-xgWwVNQCED0_lt1MLIpgq51Vx_g"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-secondary uppercase">MASTER MENTOR</p>
                  <p className="font-headline-md text-white">Adrian Vazquez</p>
                </div>
              </div>
              <blockquote className="font-body-md text-body-md text-on-surface-variant italic leading-relaxed mb-6">
                "Your current selection shows remarkable maturity. The Ometepe filler provides a spicy backbone that pairs beautifully with the silkiness of the Connecticut wrapper. Consider adding a touch more Jalapa for a smoother finish."
              </blockquote>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-2">Current Insight</p>
                <p className="font-body-md text-on-surface opacity-80">Orchestration score peaked at 94 with the addition of the Habano Maduro.</p>
              </div>
            </div>

            {/* Intensity Gauge */}
            <div className="glass-panel p-card-padding rounded-xl titanium-border">
              <div className="flex justify-between items-center mb-8">
                <p className="text-[10px] font-bold tracking-[0.2em] text-secondary uppercase">INTENSITY PROFILE</p>
                <span className="material-symbols-outlined text-primary">speed</span>
              </div>
              <div className="relative py-12 flex flex-col items-center justify-center">
                <svg className="w-48 h-48 -rotate-90">
                  <circle className="text-white/5 fill-none" cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="2" />
                  <circle
                    className="text-primary fill-none transition-all duration-1000 ease-out"
                    cx="96" cy="96" r="88"
                    stroke="currentColor"
                    strokeDasharray="553"
                    strokeDashoffset="138"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                  <span className="font-headline-xl text-headline-xl text-white">8.5</span>
                  <span className="font-label-sm text-label-sm text-secondary opacity-80">BOLD</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between font-label-sm text-label-sm">
                  <span className="opacity-60">Aroma</span>
                  <span className="text-primary">High</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full">
                  <div className="bg-primary h-1 rounded-full" style={{ width: '85%' }} />
                </div>
                <div className="flex justify-between font-label-sm text-label-sm">
                  <span className="opacity-60">Complexity</span>
                  <span className="text-primary">Exceptional</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full">
                  <div className="bg-primary h-1 rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleSubmit}
              className="w-full group relative py-6 px-8 rounded-xl gold-foil overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(233,193,118,0.4)] active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative flex items-center justify-center gap-3">
                <span className="font-headline-md text-headline-md text-on-primary font-bold tracking-tight">SUBMIT MASTER BLEND</span>
                <span className="material-symbols-outlined text-on-primary">send</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Shell */}
      <footer className="w-full py-4 px-margin flex flex-col md:flex-row justify-between items-center mt-auto bg-surface-container-lowest/80 backdrop-blur-md border-t border-white/5 relative z-20">
        <div className="font-label-sm text-[10px] font-bold text-primary mb-4 md:mb-0 tracking-[0.2em] uppercase">
          © 2024 NOVEE OS • FOUNDER LEVEL 0 SECURED
        </div>
        <div className="flex gap-8">
          <span className="font-label-sm text-[10px] text-on-surface-variant cursor-pointer hover:text-primary transition-colors uppercase tracking-[0.15em]">Privacy</span>
          <span className="font-label-sm text-[10px] text-on-surface-variant cursor-pointer hover:text-primary transition-colors uppercase tracking-[0.15em]">Terms</span>
          <span className="font-label-sm text-[10px] text-on-surface-variant cursor-pointer hover:text-primary transition-colors uppercase tracking-[0.15em]">Support</span>
        </div>
      </footer>
      <SmokeCraftBottomNav active="smokecraft" />
    </div>
  )
}
