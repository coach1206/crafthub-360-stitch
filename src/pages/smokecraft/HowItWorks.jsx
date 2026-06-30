import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../../utils/haptics.js'

const STEPS = [
  {
    num: '01',
    title: 'Enroll & Discover',
    desc: 'Answer a few guided questions about your palate. We build your personal cigar profile from your preferences.',
    image: '/assets/smokecraft/cropped/passport-cover.jpg',
    icon: 'assignment',
  },
  {
    num: '02',
    title: 'Learn the Craft',
    desc: 'Explore origins, tobacco leaves, vitola shapes, and the art of blending through interactive modules.',
    image: '/assets/smokecraft/cropped/cut-toast-light-bg.jpg',
    icon: 'school',
  },
  {
    num: '03',
    title: 'Earn Passport Stamps',
    desc: 'Complete each chapter to stamp your 360 Passport. Stamps unlock exclusive pairings and member benefits.',
    image: '/assets/smokecraft/cropped/passport-stamp-bg.jpg',
    icon: 'workspace_premium',
  },
  {
    num: '04',
    title: 'Join the Challenge',
    desc: 'Step into the live event or leaf challenge whenever one is active at your venue and earn passport credit.',
    image: '/assets/smokecraft/cropped/golden-box-hero.jpg',
    icon: 'emoji_events',
  },
  {
    num: '05',
    title: 'Unlock Your Pairing',
    desc: 'Your profile generates a personalized cigar and spirit pairing, curated to your flavour DNA.',
    image: '/assets/smokecraft/cropped/management-sync-bg.jpg',
    icon: 'local_bar',
  },
]

export default function HowItWorks() {
  const navigate = useNavigate()

  function handleStart() {
    triggerHaptic('medium')
    navigate('/smokecraft/enroll')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#050302', color: '#F4ECDA', fontFamily: '"Hanken Grotesk",sans-serif', overflowX: 'hidden', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/assets/smokecraft/cropped/management-sync-bg.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          filter: 'brightness(0.4) saturate(1.15) contrast(1.08)',
          transform: 'scale(1.04)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(5,3,2,0.86) 0%, rgba(5,3,2,0.6) 38%, rgba(5,3,2,0.95) 100%)',
        }} />
      </div>

      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 72, display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', background: 'rgba(10,7,5,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.18)' }}>
        <button
          className="sc-tactile"
          onClick={() => navigate('/smokecraft')}
          aria-label="Back"
          style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)', color: '#E6C76A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#E6C76A' }}>How It Works</span>
      </header>

      <main style={{ position: 'relative', zIndex: 10, maxWidth: 720, margin: '0 auto', padding: '112px 24px 140px' }}>
        <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(32px,5vw,48px)', fontWeight: 700, color: '#F4ECDA', marginBottom: 14, textAlign: 'center' }}>
          Your SmokeCraft <em style={{ color: '#E6C76A', fontStyle: 'italic' }}>journey.</em>
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(244,236,218,0.65)', textAlign: 'center', marginBottom: 40 }}>
          From discovery to your personalized pairing — here's what to expect.
        </p>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.28)', marginBottom: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
          <img src="/assets/smokecraft-reference/approved/smokecraft-how-it-works.png" alt="How SmokeCraft Works" style={{ display: 'block', width: '100%', minHeight: 260, maxHeight: 420, objectFit: 'cover', objectPosition: 'center top' }} />
        </div>

        {STEPS.map(step => (
          <article
            key={step.num}
            style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: 18, alignItems: 'center', marginBottom: 16, padding: '14px 18px', borderRadius: 16, border: '1px solid rgba(233,193,118,0.32)', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(13,9,5,0.7))' }}
          >
            <div style={{ position: 'relative', width: 104, height: 104, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(233,193,118,0.6)', flexShrink: 0 }}>
              <img src={step.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.95) brightness(0.78)' }} />
              <span className="material-symbols-outlined" style={{ position: 'absolute', right: 6, bottom: 6, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e9c176,#b98527)', color: '#1A1207', fontSize: 16 }}>{step.icon}</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, color: '#f7d88a' }}>{Number(step.num)}</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#e9c176', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Step {step.num}</span>
              </div>
              <h4 style={{ fontFamily: '"Playfair Display",serif', fontSize: 21, color: '#F4ECDA', marginBottom: 4 }}>{step.title}</h4>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(244,236,218,0.65)' }}>{step.desc}</p>
            </div>
          </article>
        ))}

        <button
          className="sc-tactile"
          onClick={handleStart}
          style={{ width: '100%', height: 60, marginTop: 18, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #E9C176, #B8952A)', color: '#1A1207', fontFamily: '"JetBrains Mono",monospace', fontSize: 13, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 8px 28px rgba(212,175,55,0.35)' }}
        >
          Start SmokeCraft
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </main>
    </div>
  )
}
