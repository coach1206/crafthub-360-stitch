import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'

const GOLD = 'linear-gradient(135deg,#8b6914,#e9c176,#f5d98a,#c5a059,#8b6914)'

const STAGES = [
  {
    id:    'seed',
    num:   '01',
    title: 'Seed Selection',
    icon:  'eco',
    color: '#4CAF50',
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuA96E-i-V5iTX1UcpiMqbc_VWvmkAzNT6IXZTWyHrnST3_e-F48lk4dZcQt6tnY3-FS8SRN9eitwotUIR2p0CbKKivcTEKxmGgznzCNEX3KLcYGf38oD4XGmclAy2Q4jDvglWAW0T574-61oF2onZkUfmc4FquVGHheV_lYKdEPyv8LeMGLGcNlQmQZiN-rDd2yoYLL1XGs80WOuOsHnwif63374-0j713oPLTw3MQ2Ff7QNQzXtmmTZ3UtN0wJI9yGD0ubbxwDk4g',
    detail: 'Tobacco begins with genetics. Master blenders select seeds based on flavor potential, leaf size, oil content, and regional heritage. Habano, Criollo, Corojo — each seed carries centuries of flavor memory.',
    facts:  ['Seeds are smaller than a grain of sand', '6–10 weeks in nursery before transplanting', 'Genetic purity determines wrapper quality'],
  },
  {
    id:    'soil',
    num:   '02',
    title: 'Soil Character',
    icon:  'landscape',
    color: '#8B6914',
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuCDinqiRd53IenZj6Dg4uDGjKf7GNFR89-xAI4t2-68wH-BtJVVKUsZMoTibHD5nB2uI61lEqWTKBzcx6fUO83UUDbqCLxufZvXkYwXkxnOvzLpFpOCdbPr3M95R49mvK2G6Wm2V-erAzikJa6EXqtaeZ4RT1Tjq9ANJsNobQ4TZRDYIwxX1xdFGkGHk0QSyvjOIAzrMG8ia4rPhXcUczk9X_nbwCvyVETSYlkbNZdC-KqHYQhoIteDqdb9tGkwvNhs1IeNtBh2Q4Y',
    detail: 'Soil is terroir. Volcanic mineral soils of Nicaragua create pepper and spice. Sandy Ecuadorian cloud soil creates silk. Dominican red clay imparts floral sweetness. The earth speaks through every draw.',
    facts:  ['pH 5.5–6.5 is ideal for tobacco', 'Mineral content shapes combustion quality', 'Cuban red-earth (vuelta abajo) is world-famous'],
  },
  {
    id:    'climate',
    num:   '03',
    title: 'Climate & Sun',
    icon:  'wb_sunny',
    color: '#E9C176',
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuC-wFKd36V8Kte15q8k8B-07-DyWINrytg3jtB6nOkc55ovBl4NALS6YptCCnVeaf3H0BiZaFZyCPhdpRz6cJuFHWafpHgA0bqZij04ksDjTgbbT5XRZzsSojqvCQVT5O8jsyto4qMMBNy06XdXMxckzv0jbOT8tWEt9Nt1Z6g8UILoCRPg0EX6hSOgzhvRWrHCdvSBENZGQ1W5nkASD5aX019MPiabFOQUvieuxQyNse6-qHGoiBrr39deuAFKC3uxypdFhGZN_8U',
    detail: 'Sun intensity governs nicotine concentration and wrapper texture. Shade-grown under cheesecloth creates thin, silky wrappers. Sun-grown wrappers develop intensity and oil. Temperature swings add complexity.',
    facts:  ['Shade cloth reduces UV by 30–50%', 'Altitude slows growth, concentrates flavor', 'Consistent humidity prevents leaf cracking'],
  },
  {
    id:    'harvest',
    num:   '04',
    title: 'Harvesting',
    icon:  'agriculture',
    color: '#A0522D',
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuAW0kKp2a_4GazxkwcITfOrEAllIhzdB5Y94YI3GOF4UY_h5x3WXU2pbG40AbZ6ihlpZtaj4UtlO3jZZa3RG7zxsThDh7FmhduBj24ZARTD5K1R7U8MLRDXOnONMqyfI2KIeMMdHkMpT8935igPG_sxJb8OJRHjuKGDLwPzGN19Kt8ZfwQ69SFlzvaxfS-a9dbIpMP6nYSLM-rsa-YkNC1nuvScNfx71c8wnLnyTkUBvOK-hxauZz5t5no9zgFaKX07ODHEsIS-as4',
    detail: 'Leaves are harvested in passes (primings) from the bottom of the plant upward over weeks. Bottom leaves (volado) provide combustion. Middle (seco) gives body. Top (ligero) delivers strength and complexity.',
    facts:  ['3–6 primings per plant over 4–6 weeks', 'Ligero leaves are thickest and slowest to burn', 'Each position on the stalk has a different role'],
  },
  {
    id:    'curing',
    num:   '05',
    title: 'Curing',
    icon:  'local_fire_department',
    color: '#CD5C5C',
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuDzBPCTkkOTqC2zVjLURPTau1pgZIFLC5Co6Y0y-jLHTi3MPuPrcBjDTt0wv45iGgQO1r45o_qnlU6lhp7knFWyi9IbZdaNHSCEUCE9M7cTmVXenKhOnVtMBo4CcP12_nkaUl8Xi3d_E0-CLrlrb8x7OTohO40ZTh80kNnvB_k0ZLieO6i5oQbfWkXaferMudU-whcjP3lV-bd6ZwWDcz3bVcC5SmoiTg9Lh863jYjA4vSWFOdvZXkuJ9qi7DkgSLYyk8W-V9T1V4c',
    detail: 'Freshly harvested leaves cure for 4–8 weeks in barns. Air-curing removes moisture slowly. Flue-curing uses controlled heat. Fire-curing adds smoky character. This phase locks in the leaf\'s color and early flavor.',
    facts:  ['Barn temperature must stay 65–85°F', 'Chlorophyll breaks down, revealing brown pigments', 'Green "grassy" notes disappear during curing'],
  },
  {
    id:    'fermentation',
    num:   '06',
    title: 'Fermentation',
    icon:  'science',
    color: '#6B4A2A',
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuCBjb17tZGWhWOsbXW8XcEiR4WIW8SRdSpM3JbzTootwik0rNdnLOw7S9JZ3EXsRrWIwqWrDXTd8Pvkve7yk0Djguo_fc3IWZ5D9c7ECY5EDcu6g5JsWk0HLo-pS1P0Sp_kNEtMoJ7_UWd-u_nKBePg_hyVmOWBd7C9H9b16E7bHFZlxdXVSBDqmCktK_b7wsck7DeYbjNOVSSREGTNzZg89N6q8Zqmzw_ubYO5Nur2k8euqiBLwOh-CQCTEjFfzzYA0LEgqcCTY6g',
    detail: 'Stacked in pilones (piles), leaves generate heat. Natural enzymes and bacteria transform harsh compounds into complex flavor molecules — like aging wine or whiskey. Multiple fermentation rounds build depth.',
    facts:  ['Pilón temperatures reach 120–140°F at core', 'Ammonia (harshness) is expelled as gas', 'Premium cigars ferment for 2–5 years or more'],
  },
  {
    id:    'aging',
    num:   '07',
    title: 'Aging',
    icon:  'hourglass_slow',
    color: '#D4AF37',
    img:   'https://lh3.googleusercontent.com/aida-public/AB6AXuAPtp4Y9j-CA6V2A2YUzioHki9r4HgYAXpga25qi9M1COUPn-mESIwesmKG0oI1E6h2va2KujziGRyVXJcsACvoLXVtwp-FjXh_vZcGVZaIQs_fyC5Jz9dVH9liVvvuWVAKMoycLpyvukC9824JvSdMKn6zZRZBUs7asdrOGdsLoVEguXkh9FjXAyhwuX3EAC311hlF-IFrr7DDbm8mXSqzWdf456BB2x8YTJH5-TiHWqLKN1JQAV65ylwgaoAIF8IfBY049s',
    detail: 'After rolling, finished cigars rest in cedar-lined aging rooms. Oils migrate between wrapper, binder, and filler. Flavors marry and mellow. A 3-year aged cigar is profoundly smoother than the same cigar at 6 months.',
    facts:  ['Cedar absorbs excess moisture evenly', 'Most premium cigars age 3 months–2 years', 'Box-pressed shapes develop during aging'],
  },
]

export default function Cultivation() {
  const navigate  = useNavigate()
  const { addXP, completeStep, awardStamp, session } = useGuestSession()

  const [active,    setActive]    = useState(null)
  const [saved,     setSaved]     = useState(false)
  const [stampShown, setStampShown] = useState(false)

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  function handleSave() {
    if (saved) return
    setSaved(true)
    if (!session?.completedSteps?.includes('cultivation')) {
      addXP(50)
      completeStep('cultivation')
      awardStamp('cultivator', 'cultivation')
    }
    setStampShown(true)
    setTimeout(() => setStampShown(false), 4000)
  }

  function handleContinue() {
    if (!session?.completedSteps?.includes('cultivation')) {
      addXP(50)
      completeStep('cultivation')
    }
    navigate('/smokecraft/blend')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#070502', color: '#E5E2E1', fontFamily: '"Hanken Grotesk",sans-serif', overflowX: 'hidden', position: 'relative' }}>

      {/* Cinematic tobacco farm background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDinqiRd53IenZj6Dg4uDGjKf7GNFR89-xAI4t2-68wH-BtJVVKUsZMoTibHD5nB2uI61lEqWTKBzcx6fUO83UUDbqCLxufZvXkYwXkxnOvzLpFpOCdbPr3M95R49mvK2G6Wm2V-erAzikJa6EXqtaeZ4RT1Tjq9ANJsNobQ4TZRDYIwxX1xdFGkGHk0QSyvjOIAzrMG8ia4rPhXcUczk9X_nbwCvyVETSYlkbNZdC-KqHYQhoIteDqdb9tGkwvNhs1IeNtBh2Q4Y"
          alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(7,5,2,0.92) 0%, rgba(7,5,2,0.80) 40%, rgba(7,5,2,0.95) 100%)' }} />
      </div>

      {/* Texture overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, backgroundImage: "url('https://www.transparenttextures.com/patterns/black-linen.png')", opacity: 0.12, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse 55% 50% at 50% 30%, rgba(212,175,55,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(7,5,2,0.82)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4AF37', display: 'flex', alignItems: 'center', padding: 8, borderRadius: '50%' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#D4AF37' }}>CraftHub 360</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Cigar Experience Architect</span>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Step 12 of 20</span>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 120, maxWidth: 1100, margin: '0 auto', padding: '96px 28px 120px' }}>

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ height: 3, background: 'rgba(212,175,55,0.15)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', background: GOLD, borderRadius: 4, transition: 'width 0.8s ease' }} />
          </div>
        </div>

        {/* Title block */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.06)', marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#D4AF37', fontVariationSettings: "'FILL' 1" }}>eco</span>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.2em', textTransform: 'uppercase' }}>From Seed to Smoke</span>
          </div>
          <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: '#EDE8DF', marginBottom: 12, lineHeight: 1.15 }}>
            The Cultivation Journey
          </h2>
          <p style={{ fontSize: 15, color: '#7A6A50', maxWidth: 560, margin: '0 auto', lineHeight: 1.75 }}>
            Every great cigar carries the story of its land. Seed genetics, soil minerals, sun intensity, and the patient hands of master growers — cultivation shapes everything you taste.
          </p>
        </div>

        {/* ── Stage Cards Grid ───────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 48 }}>
          {STAGES.map((stage, idx) => {
            const isOpen = active === stage.id
            return (
              <div
                key={stage.id}
                onClick={() => setActive(isOpen ? null : stage.id)}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${isOpen ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.15)'}`,
                  background: isOpen ? 'rgba(18,12,5,0.95)' : 'rgba(14,10,4,0.80)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isOpen ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isOpen ? '0 8px 40px rgba(212,175,55,0.15)' : '0 2px 12px rgba(0,0,0,0.4)',
                }}
              >
                {/* Card image */}
                <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                  <img src={stage.img} alt={stage.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', transform: isOpen ? 'scale(1.05)' : 'scale(1)' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(7,5,2,0.2) 0%, rgba(7,5,2,0.75) 100%)` }} />

                  {/* Stage number badge */}
                  <div style={{ position: 'absolute', top: 12, left: 12, width: 32, height: 32, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 900, color: '#0A0705', letterSpacing: '0' }}>{stage.num}</span>
                  </div>

                  {/* Expand indicator */}
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#D4AF37', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                  </div>

                  {/* Title on image */}
                  <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: stage.color, fontVariationSettings: "'FILL' 1" }}>{stage.icon}</span>
                    <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#EDE8DF' }}>{stage.title}</span>
                  </div>
                </div>

                {/* Expandable detail */}
                {isOpen && (
                  <div style={{ padding: '18px 18px 20px' }}>
                    <p style={{ fontSize: 13, color: '#C8BAA2', lineHeight: 1.75, marginBottom: 14 }}>{stage.detail}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {stage.facts.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4AF37', flexShrink: 0, marginTop: 7 }} />
                          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A6A50', letterSpacing: '0.04em', lineHeight: 1.6 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Journey Summary Card ──────────────────────────── */}
        <div style={{ borderRadius: 16, border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(14,10,4,0.9)', overflow: 'hidden', marginBottom: 40, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0 }}>
          <div style={{ padding: '28px 32px', flex: 1, minWidth: 280 }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>The Takeaway</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: '#EDE8DF', marginBottom: 10 }}>Cultivation Is Flavor</h3>
            <p style={{ fontSize: 13, color: '#7A6A50', lineHeight: 1.75, maxWidth: 440 }}>
              A cigar from volcanic Nicaraguan soil will always taste different from one grown in Ecuador's Andean clouds — even with identical seeds. Understanding cultivation lets you read a cigar's origin in every draw.
            </p>
          </div>
          <div style={{ padding: '28px 32px', flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Stages',  value: '7' },
                { label: 'Countries', value: '12+' },
                { label: 'Avg. Grow Time', value: '90 days' },
                { label: 'Avg. Ferment', value: '3 years' },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#D4AF37' }}>{value}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#6A5A40', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA Row ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', alignItems: 'center' }}>

          <button
            onClick={handleContinue}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 36px', height: 68, borderRadius: 12, border: 'none', background: GOLD, color: '#0A0705', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 0 24px rgba(212,175,55,0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(212,175,55,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(212,175,55,0.3)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
            Continue Journey
          </button>

          <button
            onClick={handleSave}
            disabled={saved}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 28px', height: 68, borderRadius: 12, border: '1px solid rgba(212,175,55,0.4)', background: saved ? 'rgba(212,175,55,0.12)' : 'rgba(14,10,4,0.8)', color: '#D4AF37', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: saved ? 'default' : 'pointer', transition: 'all 0.2s', opacity: saved ? 0.7 : 1, whiteSpace: 'nowrap' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>approval</span>
            {saved ? 'Saved to Passport' : 'Save to Passport'}
          </button>

          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 22px', height: 68, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(14,10,4,0.6)', color: '#6A5A40', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Back
          </button>
        </div>
      </main>

      {/* ── Stamp Toast ───────────────────────────────────── */}
      {stampShown && (
        <div style={{ position: 'fixed', bottom: 28, right: 24, zIndex: 200, maxWidth: 340, borderRadius: 14, border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(10,7,4,0.96)', backdropFilter: 'blur(20px)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 48px rgba(0,0,0,0.6)', borderLeft: '3px solid #D4AF37' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#D4AF37', fontVariationSettings: "'FILL' 1" }}>approval</span>
          </div>
          <div>
            <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, color: '#D4AF37', fontWeight: 700 }}>Cultivator Stamp Earned</div>
            <div style={{ fontSize: 12, color: '#7A6A50', marginTop: 2 }}>Added to your SmokeCraft Passport.</div>
          </div>
          <button onClick={() => setStampShown(false)} style={{ background: 'none', border: 'none', color: '#6A5A40', cursor: 'pointer', marginLeft: 'auto', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
      )}

      {/* ── Bottom Nav (mobile) ──────────────────────────── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, height: 76, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 16px', background: 'rgba(7,5,2,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        {[
          { icon: 'explore',      label: 'Explore',  to: '/' },
          { icon: 'inventory_2',  label: 'Leaves',   to: '/smokecraft/leaves' },
          { icon: 'menu_book',    label: 'Passport', to: '/passport', active: true },
          { icon: 'auto_awesome', label: 'Assistant', to: '/' },
        ].map(({ icon, label, to, active }) => (
          <button key={label} onClick={() => navigate(to)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: active ? '#D4AF37' : '#4A3A20', padding: '8px 12px', borderRadius: 10, transition: 'color 0.2s' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
