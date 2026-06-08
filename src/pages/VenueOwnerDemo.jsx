/**
 * VenueOwnerDemo — Phase 13
 * Clear, premium, non-technical walkthrough for venue owners.
 * Route: /venue-demo  Protected: manager+
 */

import { useNavigate }     from 'react-router-dom'
import PrototypeDisclosure from '../components/demo/PrototypeDisclosure.jsx'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'
const SEP  = `1px solid rgba(201,168,76,0.08)`

function Chapter({ number, title, accent, children }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${accent||GOLD}18`, borderRadius: '12px', padding: '1.75rem', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position:'absolute', top:'1.25rem', right:'1.5rem', fontSize:'2.5rem', color:`${accent||GOLD}08`, fontFamily:'Georgia,serif', fontWeight:400, lineHeight:1, userSelect:'none' }}>{number}</div>
      <div style={{ fontSize:'0.55rem', letterSpacing:'0.25em', color:`${accent||GOLD}44`, textTransform:'uppercase', marginBottom:'0.5rem' }}>Part {number}</div>
      <div style={{ fontSize:'clamp(0.95rem,2vw,1.15rem)', color: accent||GOLD, fontWeight:400, letterSpacing:'0.04em', marginBottom:'1rem' }}>{title}</div>
      {children}
    </div>
  )
}

function P({ children }) {
  return <p style={{ margin:'0 0 0.75rem', fontSize:'0.85rem', color:`${GOLD}cc`, lineHeight:1.75, fontFamily:'Georgia,serif' }}>{children}</p>
}

function Q({ question, answer }) {
  return (
    <div style={{ padding:'0.875rem 0', borderTop:SEP }}>
      <div style={{ fontSize:'0.72rem', color:`${GOLD}66`, letterSpacing:'0.08em', marginBottom:'0.3rem' }}>Q: {question}</div>
      <div style={{ fontSize:'0.82rem', color:`${GOLD}cc`, lineHeight:1.65 }}>{answer}</div>
    </div>
  )
}

export default function VenueOwnerDemo() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight:'100vh', background:DARK, color:GOLD, fontFamily:'Georgia,serif', padding:'clamp(1.5rem,4vw,2.5rem)' }}>
      <div style={{ maxWidth:'720px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:'2rem' }}>
          <button onClick={()=>window.history.length > 1 ? navigate(-1) : navigate('/')} style={{background:'transparent',border:'none',color:`${GOLD}55`,fontSize:'0.72rem',letterSpacing:'0.15em',cursor:'pointer',padding:0,marginBottom:'0.75rem',textTransform:'uppercase'}}>← Back</button>
          <div style={{fontSize:'0.55rem',letterSpacing:'0.3em',color:`${GOLD}44`,textTransform:'uppercase',marginBottom:'0.3rem'}}>NOVEE OS · Venue Owner Walkthrough</div>
          <h1 style={{margin:0,fontSize:'clamp(1.3rem,3vw,1.8rem)',fontWeight:400,letterSpacing:'0.04em'}}>What NOVEE OS Does for Your Venue</h1>
          <div style={{marginTop:'0.875rem'}}>
            <PrototypeDisclosure compact />
          </div>
        </div>

        <Chapter number="1" title="How a Guest Enters the Experience" accent={GOLD}>
          <P>A guest approaches a tablet or kiosk at your venue. It could be at the bar, beside a product display, or at a welcome station.</P>
          <P>The screen is in landscape orientation — the same format as a premium digital display. There is no login, no app to download, and no sign-up required.</P>
          <P>The guest taps the screen to begin. The experience opens immediately.</P>
          <Q question="What if a guest doesn't want to interact?" answer="The screen loops gracefully. No one is required to participate. It functions as an ambient display when idle." />
          <Q question="What hardware does this need?" answer="Any modern iPad or Android tablet with a stand works. NOVEE OS installs as a web app — no app store required." />
        </Chapter>

        <Chapter number="2" title="How SmokeCraft Increases Engagement" accent="#fbbf24">
          <P>SmokeCraft is a premium guided experience that teaches guests about cigars — the origins of the leaf, the blending process, the flavors, and the pairing possibilities.</P>
          <P>A mentor voice guides each session. Guests choose a mentor whose character matches their taste preference. This is not a quiz — it is a curated journey.</P>
          <P>By the end, the guest has a flavor profile and a reason to speak with your staff about what they just experienced. That conversation leads to a sale.</P>
          <Q question="How long does a session take?" answer="A full SmokeCraft session takes 8–12 minutes. Guests can go at their own pace. The system remembers where they left off within a visit." />
          <Q question="What if a guest wants to skip ahead?" answer="The experience is designed to flow naturally. Guests who are already knowledgeable will move quickly. Guests who are curious will slow down and engage." />
        </Chapter>

        <Chapter number="3" title="How Passport Captures the Relationship" accent="#a3e635">
          <P>At the end of a SmokeCraft session, the guest receives a Passport stamp — a record of what they experienced and learned.</P>
          <P>Stamps accumulate across visits. A leaderboard shows the most experienced guests at your venue. Return visits unlock new stamps and higher ranks.</P>
          <P>This is your relationship data layer. Unlike a loyalty card that records transactions, the Passport records experiences — what your guests are interested in, not just what they bought.</P>
          <Q question="Do guests need to create an account?" answer="No. In prototype mode, the Passport is session-local. In the live configuration, guests can opt into a lightweight profile to carry their Passport between visits." />
          <Q question="Who owns the data?" answer="In the commercial configuration, venue data stays with the venue. NOVEE OS provides the platform — not a data harvesting service." />
        </Chapter>

        <Chapter number="4" title="How POS 3 Supports Staff" accent="#60a5fa">
          <P>While guests are completing their SmokeCraft session, your staff can see their progress on the POS 3 feed — a staff-facing panel that shows active orders, table occupancy, and guest session activity.</P>
          <P>When a session completes, a recommendation preview appears — based on the guest's flavor profile, POS 3 suggests a product that matches what they just learned.</P>
          <P>Staff do not need deep product knowledge. The system gives them the right context at the right moment.</P>
          <Q question="Does this replace our POS system?" answer="No. POS 3 is a companion intelligence layer. It reads from your existing POS (in the commercial integration) and adds guest context. It does not process payments or replace your current system." />
        </Chapter>

        <Chapter number="5" title="How E.A.T. Command Supports Management" accent="#c084fc">
          <P>Managers access E.A.T. Command — a dashboard that shows the venue's intelligence in real time.</P>
          <P><strong style={{color:'#c084fc'}}>Environment:</strong> table occupancy, session activity, time-based patterns.</P>
          <P><strong style={{color:'#c084fc'}}>Asset:</strong> which products, blends, and mentors are driving guest engagement.</P>
          <P><strong style={{color:'#c084fc'}}>Transaction:</strong> correlation between SmokeCraft session completions and POS 3 orders.</P>
          <P>This answers the question every venue manager asks: "What is actually working on the floor tonight?"</P>
          <Q question="How much training does this require?" answer="The manager walkthrough takes under 30 minutes. E.A.T. Command is designed to be read at a glance — not configured constantly." />
        </Chapter>

        <Chapter number="6" title="How the Tablet Install Works" accent="#fb923c">
          <P>NOVEE OS installs as a Progressive Web App — your staff adds it to the Home Screen of any iPad or Android tablet in under 2 minutes.</P>
          <P>The app works in landscape orientation, supports kiosk mode (preventing accidental navigation), and includes an offline fallback so guests can continue even if Wi-Fi drops briefly.</P>
          <P>A boot hardening system ensures the screen never gets stuck — if anything delays the load, a Continue button appears automatically.</P>
          <Q question="Do we need to buy new hardware?" answer="No. Any iPad (10th gen or newer recommended) with a landscape stand works. We can advise on kiosk enclosure options for a more permanent installation." />
          <Q question="What happens if the internet goes down?" answer="Guests can continue the SmokeCraft experience. Passport stamps sync when connectivity returns. Staff POS 3 and E.A.T. Command require connectivity." />
        </Chapter>

        <Chapter number="7" title="What is Prototype Mode?" accent={GOLD}>
          <P>The system you are viewing today is running in prototype mode. This means all POS data, orders, and analytics are simulated — they demonstrate what the live system looks like without connecting to your real point-of-sale system.</P>
          <P>The guest experience — SmokeCraft, the mentor voice, the Passport stamp — is fully functional and representative of the live product.</P>
          <P>When you move to a live pilot, we configure your specific POS integration, calibrate the system to your product catalogue, and run a structured test session before going guest-facing.</P>
        </Chapter>

        <Chapter number="8" title="What a Pilot Requires" accent="#4ade80">
          {[
            ['A tablet or display', 'Any modern iPad or Android tablet. Landscape stand or kiosk enclosure.'],
            ['Stable Wi-Fi', 'Standard venue Wi-Fi. Minimum 5 Mbps per device.'],
            ['30 minutes with staff', 'We walk your staff through the POS 3 flow. No long training sessions.'],
            ['A manager walkthrough', 'One session to configure E.A.T. Command to your venue.'],
            ['A compliance review', 'If your venue serves tobacco or alcohol, your team confirms applicable local regulations are met. NOVEE OS provides guidance content only.'],
          ].map(([t,d])=>(
            <div key={t} style={{ display:'flex', gap:'0.875rem', padding:'0.6rem 0', borderBottom:SEP, alignItems:'flex-start' }}>
              <span style={{ color:'#4ade80', fontSize:'0.72rem', flexShrink:0, marginTop:'0.12rem' }}>✓</span>
              <div>
                <div style={{ fontSize:'0.78rem', color:GOLD, marginBottom:'0.2rem' }}>{t}</div>
                <div style={{ fontSize:'0.73rem', color:`${GOLD}77`, lineHeight:1.55 }}>{d}</div>
              </div>
            </div>
          ))}
        </Chapter>

        <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:SEP, display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <button onClick={()=>navigate('/')} style={{background:'transparent',border:`1px solid ${GOLD}22`,color:`${GOLD}66`,padding:'0.75rem 1.5rem',borderRadius:'6px',fontFamily:'Georgia,serif',fontSize:'0.72rem',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',minHeight:'48px'}}>Return Home</button>
          <button onClick={()=>navigate('/pilot-onboarding')} style={{background:GOLD,color:DARK,border:'none',padding:'0.75rem 1.5rem',borderRadius:'6px',fontFamily:'Georgia,serif',fontSize:'0.72rem',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',fontWeight:600,minHeight:'48px'}}>Start Pilot Onboarding →</button>
        </div>
      </div>
    </div>
  )
}
