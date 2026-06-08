/**
 * InvestorDemo — Phase 13
 * Founder-level investor pitch overview. No fake revenue claims.
 * Route: /investor-demo  Protected: founder_level_0
 */

import { useNavigate }        from 'react-router-dom'
import PrototypeDisclosure    from '../components/demo/PrototypeDisclosure.jsx'
import PilotReadinessDashboard from '../components/demo/PilotReadinessDashboard.jsx'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'
const SEP  = `1px solid rgba(201,168,76,0.08)`

function Block({ title, children, accent }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${accent||GOLD}18`, borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.58rem', letterSpacing: '0.25em', color: `${accent||GOLD}44`, textTransform: 'uppercase', marginBottom: '0.875rem' }}>{title}</div>
      {children}
    </div>
  )
}

function Bullet({ children, color }) {
  return (
    <div style={{ display:'flex', gap:'0.75rem', padding:'0.5rem 0', borderBottom:SEP }}>
      <span style={{ color: color || GOLD, flexShrink: 0, marginTop: '0.1rem', fontSize: '0.72rem' }}>◆</span>
      <span style={{ fontSize: '0.82rem', color: `${GOLD}cc`, lineHeight: 1.65, fontFamily: 'Georgia, serif' }}>{children}</span>
    </div>
  )
}

export default function InvestorDemo() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight:'100vh', background:DARK, color:GOLD, fontFamily:'Georgia,serif', padding:'clamp(1.5rem,4vw,2.5rem)' }}>
      <div style={{ maxWidth:'780px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:'2rem' }}>
          <button onClick={()=>window.history.length > 1 ? navigate(-1) : navigate('/')} style={{background:'transparent',border:'none',color:`${GOLD}55`,fontSize:'0.72rem',letterSpacing:'0.15em',cursor:'pointer',padding:0,marginBottom:'0.75rem',textTransform:'uppercase'}}>← Back</button>
          <div style={{fontSize:'0.55rem',letterSpacing:'0.3em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'0.3rem'}}>NOVEE OS · Founder / Investor Package</div>
          <h1 style={{margin:0,fontSize:'clamp(1.4rem,3vw,1.9rem)',fontWeight:400,letterSpacing:'0.04em'}}>Investor Overview</h1>
          <div style={{marginTop:'0.875rem'}}>
            <PrototypeDisclosure compact />
          </div>
        </div>

        <Block title="The Problem" accent="#f87171">
          <Bullet color="#f87171">Premium hospitality venues — cigar lounges, craft beverage bars, private clubs — invest heavily in product and ambiance, but capture almost no actionable guest data.</Bullet>
          <Bullet color="#f87171">Staff cannot personalise recommendations at scale without product expertise that takes years to develop.</Bullet>
          <Bullet color="#f87171">Guests leave with an experience, but no ongoing relationship with the venue. There is no mechanism to bring them back beyond generic promotions.</Bullet>
          <Bullet color="#f87171">POS systems record transactions. Nothing records the experience that preceded the transaction.</Bullet>
        </Block>

        <Block title="The Solution" accent="#4ade80">
          <Bullet color="#4ade80">NOVEE OS is a guest intelligence platform that sits between the guest experience and the venue's operational layer.</Bullet>
          <Bullet color="#4ade80">Guests engage with a premium, guided craft experience on a tablet or kiosk. The system captures their preferences, flavor profile, and session behavior.</Bullet>
          <Bullet color="#4ade80">That data flows to staff (POS 3) and management (E.A.T. Command) in real time — closing the loop between engagement and transaction.</Bullet>
          <Bullet color="#4ade80">The 360 Passport gives guests a portable record of their journey — creating return behavior without discounts or generic loyalty schemes.</Bullet>
        </Block>

        <Block title="Why Now" accent="#fbbf24">
          <Bullet color="#fbbf24">Premium hospitality is growing. Experiential spending is outpacing product spending across demographics.</Bullet>
          <Bullet color="#fbbf24">Tablets and kiosks are now standard in hospitality — the hardware barrier is gone.</Bullet>
          <Bullet color="#fbbf24">AI voice and flavor intelligence tools are now production-ready and affordable at scale.</Bullet>
          <Bullet color="#fbbf24">The post-COVID venue recovery has created a strong demand for differentiation — venues need a reason for guests to choose them over competitors.</Bullet>
        </Block>

        <Block title="The Product" accent={GOLD}>
          {[
            ['SmokeCraft 360',           'Flagship craft module — cigar education, mentor voice, flavor profiling, Passport stamp'],
            ['360 Passport Connection',  'Guest relationship layer — stamps, streaks, leaderboard, session history'],
            ['POS 3',                    'Staff intelligence — active orders, table status, recommendation previews'],
            ['E.A.T. Command',           'Manager layer — Environment, Asset, Transaction feeds'],
            ['Mentor Voice',             'ElevenLabs AI voice + Web Speech fallback — premium, accessible, offline-capable'],
            ['Kiosk / Tablet Deployment','PWA, route lock, boot hardening, offline mode — works on any modern tablet'],
            ['Venue Testing System',     'Structured pilot testing, observer notes, readiness score before live deployment'],
          ].map(([name, desc])=>(
            <div key={name} style={{ display:'flex', gap:'0.75rem', padding:'0.6rem 0', borderBottom:SEP, alignItems:'flex-start' }}>
              <span style={{ color:GOLD, fontSize:'0.72rem', flexShrink:0, minWidth:'180px', fontFamily:'monospace' }}>{name}</span>
              <span style={{ fontSize:'0.78rem', color:`${GOLD}88`, lineHeight:1.55 }}>{desc}</span>
            </div>
          ))}
        </Block>

        <Block title="Market Entry" accent="#60a5fa">
          <Bullet color="#60a5fa">Initial focus: premium cigar lounges and tobacco specialty venues in the US.</Bullet>
          <Bullet color="#60a5fa">Expansion path: craft beverage bars (PourCraft, BeerCraft, WineCraft modules in development).</Bullet>
          <Bullet color="#60a5fa">Adjacent markets: private clubs, hotel bars, wine tasting rooms, whisky/spirits experiences.</Bullet>
          <Bullet color="#60a5fa">Geographic entry: high-density premium hospitality markets (NYC, Miami, Chicago, LA).</Bullet>
        </Block>

        <Block title="Revenue Model (Placeholder)" accent="#c084fc">
          <div style={{padding:'0.75rem',background:'rgba(192,132,252,0.06)',borderRadius:'7px',marginBottom:'0.75rem',border:'1px solid rgba(192,132,252,0.12)'}}>
            <div style={{fontSize:'0.68rem',color:'rgba(192,132,252,0.6)',letterSpacing:'0.12em',marginBottom:'0.3rem',textTransform:'uppercase'}}>Note</div>
            <div style={{fontSize:'0.75rem',color:'rgba(192,132,252,0.8)',lineHeight:1.6}}>Pricing is placeholder. Live commercial terms are set by the NOVEE OS team. No revenue commitments are made in this prototype.</div>
          </div>
          {[
            ['Venue Subscription',       'Monthly SaaS fee per venue, tiered by module count and device quantity'],
            ['Pilot Tier Onboarding',     'One-time setup and training fee (pilot pricing TBD)'],
            ['Data Intelligence Add-On',  'Aggregated (anonymised) trend data for brand and distributor partners'],
            ['Hardware Partnerships',     'Potential revenue share with kiosk hardware vendors (in discussion)'],
          ].map(([t,d])=>(
            <div key={t} style={{ padding:'0.6rem 0', borderBottom:SEP }}>
              <div style={{fontSize:'0.75rem',color:'#c084fc',marginBottom:'0.2rem'}}>{t}</div>
              <div style={{fontSize:'0.72rem',color:`${GOLD}77`,lineHeight:1.55}}>{d}</div>
            </div>
          ))}
        </Block>

        <Block title="Pilot Readiness" accent="#a3e635">
          <PilotReadinessDashboard compact />
        </Block>

        <Block title="Moat / Defensibility" accent={GOLD}>
          <Bullet>The Passport data layer compounds with every visit — each returning guest deepens the venue's relationship intelligence.</Bullet>
          <Bullet>The craft module library (SmokeCraft, PourCraft, BeerCraft, WineCraft) creates a switching cost for venues that have built guest history on the platform.</Bullet>
          <Bullet>The combination of guest engagement + staff intelligence + management analytics in a single integrated platform is not replicated by loyalty apps, POS systems, or digital menus independently.</Bullet>
          <Bullet>Brand and distributor data partnerships are a future moat — no competitor currently aggregates this behavioral layer from premium hospitality venues.</Bullet>
        </Block>

        <Block title="The Ask (Placeholder)" accent="#fbbf24">
          <div style={{padding:'0.875rem',background:'rgba(251,191,36,0.06)',borderRadius:'7px',border:'1px solid rgba(251,191,36,0.15)'}}>
            <div style={{fontSize:'0.75rem',color:'#fbbf24',lineHeight:1.7}}>
              Specific investment ask and terms are set by the founding team and are not published in this prototype system.<br/>
              <br/>
              To discuss investment, partnership, or pilot opportunities, contact the NOVEE OS team directly.
            </div>
          </div>
        </Block>

        <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:SEP, display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <button onClick={()=>navigate('/')} style={{ background:'transparent', border:`1px solid ${GOLD}22`, color:`${GOLD}66`, padding:'0.75rem 1.5rem', borderRadius:'6px', fontFamily:'Georgia,serif', fontSize:'0.72rem', letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer', minHeight:'48px' }}>Return Home</button>
          <button onClick={()=>navigate('/founder-demo')} style={{ background:'transparent', border:`1px solid ${GOLD}22`, color:`${GOLD}66`, padding:'0.75rem 1.5rem', borderRadius:'6px', fontFamily:'Georgia,serif', fontSize:'0.72rem', letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer', minHeight:'48px' }}>Founder Demo Panel</button>
        </div>
      </div>
    </div>
  )
}
