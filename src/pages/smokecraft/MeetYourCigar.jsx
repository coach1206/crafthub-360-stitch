import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'

const GOLD='#E9C176', CREAM='#f5efe5', BG='#070b12', PANEL='rgba(10,14,22,.94)', BORDER='rgba(233,193,118,.28)'

const DETAILS={
 'Oliva Serie V':{brand:'Oliva',blend:'Serie V',wrapper:'Habano Maduro',binder:'Nicaraguan',filler:'Nicaraguan ligero-rich blend',factory:'Nicaragua',masterBlender:'House blending team'},
 'Arturo Fuente Opus X':{brand:'Arturo Fuente',blend:'Opus X',wrapper:'Dominican',binder:'Dominican',filler:'Dominican',factory:'Dominican Republic',masterBlender:'Fuente family blending tradition'},
 'Padron 1964 Series':{brand:'Padrón',blend:'1964 Series',wrapper:'Natural Maduro',binder:'Nicaraguan',filler:'Nicaraguan aged tobaccos',factory:'Nicaragua',masterBlender:'Padrón family blending tradition'},
 'Macanudo Café':{brand:'Macanudo',blend:'Café',wrapper:'Connecticut Shade',binder:'Mexican San Andrés',filler:'Dominican / Mexican blend',factory:'Dominican Republic',masterBlender:'Macanudo blending team'},
 'CAO Flathead':{brand:'CAO',blend:'Flathead',wrapper:'Cameroon',binder:'Nicaraguan',filler:'Nicaraguan',factory:'Nicaragua',masterBlender:'CAO blending team'},
 'Romeo y Julieta 1875':{brand:'Romeo y Julieta',blend:'1875',wrapper:'Connecticut',binder:'Dominican',filler:'Dominican blend',factory:'Dominican Republic',masterBlender:'House blending team'},
 'My Father Le Bijou':{brand:'My Father',blend:'Le Bijou 1922',wrapper:'San Andrés',binder:'Nicaraguan',filler:'Nicaraguan',factory:'Nicaragua',masterBlender:'García family blending tradition'},
 'Cohiba Siglo VI':{brand:'Cohiba',blend:'Siglo VI',wrapper:'Ecuador Natural',binder:'Dominican',filler:'Dominican blend',factory:'Dominican Republic',masterBlender:'House blending team'},
}

const lessons={
 brand:['Brand','The brand identifies the cigar family and the maker behind the style. It gives you a starting point, but it does not tell the whole flavor story.'],
 blend:['Blend','The blend is the recipe: wrapper, binder, and filler working together. This is where strength, body, aroma, and balance are designed.'],
 wrapper:['Wrapper','The wrapper is the outer leaf. It contributes aroma, appearance, burn behavior, and a meaningful share of the cigar’s first flavor impression.'],
 binder:['Binder','The binder holds the filler bunch together and helps regulate combustion. It is structural, but it also contributes flavor and burn character.'],
 filler:['Filler','The filler is the engine of the cigar. Different leaves and primings are combined to shape strength, complexity, combustion, and progression.'],
 factory:['Factory','Factory and production environment matter because bunching, rolling, fermentation, aging, and quality control all affect consistency.'],
 masterBlender:['Master Blender','The blender balances all components into one intended experience. Think of this role as the cigar’s musical director.'],
}

export default function MeetYourCigar(){
 const navigate=useNavigate(); const {session,awardSessionRewards}=useGuestSession(); const {isDemoMode}=useSmokeCraftProgress(); const {journey,setMeetYourCigar}=useSmokeCraftJourney()
 const cigar=journey.selectedCigar; const info=DETAILS[cigar?.name]||{}
 const keys=Object.keys(lessons); const [active,setActive]=useState('brand'); const [viewed,setViewed]=useState(()=>new Set(journey.meetYourCigar?.viewedSections||[])); const [choice,setChoice]=useState(null); const [feedback,setFeedback]=useState(null)
 useEffect(()=>{if(!isDemoMode&&(!session.completedSteps.includes('humidor-match')||!cigar?.name))navigate('/smokecraft/humidor-match',{replace:true})},[isDemoMode,session.completedSteps,cigar?.name,navigate])
 useEffect(()=>{setViewed(v=>new Set(v).add(active))},[active])
 useEffect(()=>{if(viewed.size)setMeetYourCigar({...(journey.meetYourCigar||{}),viewedSections:[...viewed]})},[viewed.size])
 const lesson=lessons[active], value=info[active]||cigar?.[active]||'Not listed for this training profile'
 const required=['brand','blend','wrapper'].every(k=>viewed.has(k)); const ready=required&&choice
 function continueNext(){
  if(!required){setFeedback('Mentor hint: review Brand, Blend, and Wrapper first. Those three give you the minimum vocabulary for understanding the cigar.');return}
  if(!choice){setFeedback('Mentor hint: choose which detail most influences your first impression before moving on.');return}
  setMeetYourCigar({viewedSections:[...viewed],completedAt:journey.meetYourCigar?.completedAt||Date.now()}); awardSessionRewards('meet-your-cigar'); navigate('/smokecraft/terroir')
 }
 if(!cigar?.name&&!isDemoMode)return null
 return <div style={{minHeight:'100vh',background:'radial-gradient(circle at 75% 15%,rgba(122,79,49,.22),transparent 38%),'+BG,color:CREAM,fontFamily:'Georgia,serif',padding:'28px 28px 120px'}}>
  <div style={{maxWidth:1180,margin:'0 auto'}}>
   <div style={{letterSpacing:'.22em',textTransform:'uppercase',fontSize:12,color:GOLD}}>SmokeCraft 360 • Guided Lesson</div>
   <h1 style={{fontSize:'clamp(34px,5vw,58px)',margin:'8px 0 6px'}}>Meet Your Cigar</h1>
   <p style={{fontSize:18,lineHeight:1.6,maxWidth:900,color:'#ded6ca'}}>Before you smoke it, learn how to read it. Your mentor will walk you through the parts that shape construction, flavor, strength, and consistency.</p>

   <section style={{display:'grid',gridTemplateColumns:'minmax(0,1.15fr) minmax(320px,.85fr)',gap:20,marginTop:24}}>
    <div style={{background:PANEL,border:`1px solid ${BORDER}`,borderRadius:18,padding:22}}>
     <div style={{fontSize:14,color:GOLD,letterSpacing:'.16em',textTransform:'uppercase'}}>This Session’s Cigar</div>
     <h2 style={{fontSize:34,margin:'8px 0'}}>{cigar?.name||'Training cigar'}</h2>
     <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:18}}>{[cigar?.origin,cigar?.wrapper,cigar?.strength].filter(Boolean).map(x=><span key={x} style={{padding:'7px 11px',border:`1px solid ${BORDER}`,borderRadius:999,color:GOLD}}>{x}</span>)}</div>
     <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:10}}>{keys.map(k=><button key={k} onClick={()=>{setActive(k);setFeedback(null)}} style={{minHeight:54,borderRadius:12,border:`1px solid ${active===k?GOLD:BORDER}`,background:active===k?'rgba(233,193,118,.14)':'#0b111b',color:active===k?GOLD:CREAM,fontWeight:700,cursor:'pointer'}}>{viewed.has(k)?'✓ ':''}{lessons[k][0]}</button>)}</div>
    </div>
    <aside style={{background:'linear-gradient(160deg,rgba(57,38,25,.96),rgba(8,12,18,.98))',border:`1px solid ${BORDER}`,borderRadius:18,padding:22}}>
     <div style={{fontSize:13,color:GOLD,letterSpacing:'.14em',textTransform:'uppercase'}}>Mentor Guidance</div>
     <h3 style={{fontSize:25,margin:'10px 0 8px'}}>Read the cigar before you judge it.</h3>
     <p style={{lineHeight:1.65,color:'#e7dfd4'}}>“I’m going to help you separate the name on the band from the tobacco and construction underneath it. Tap each section. I’ll tell you what it means, why it matters, and what to notice.”</p>
     <div style={{marginTop:16,padding:14,borderRadius:12,background:'rgba(233,193,118,.08)',border:`1px solid ${BORDER}`}}><strong style={{color:GOLD}}>Goal:</strong> Review at least Brand, Blend, and Wrapper, then make one judgment about what shapes your first impression.</div>
    </aside>
   </section>

   <section style={{marginTop:20,background:PANEL,border:`1px solid ${BORDER}`,borderRadius:18,padding:24}}>
    <div style={{fontSize:13,color:GOLD,letterSpacing:'.14em',textTransform:'uppercase'}}>{lesson[0]}</div>
    <div style={{fontSize:30,fontWeight:700,margin:'10px 0'}}>{value}</div>
    <p style={{fontSize:18,lineHeight:1.65,maxWidth:920,color:'#e6ded2'}}>{lesson[1]}</p>
    <div style={{marginTop:14,padding:14,borderLeft:`4px solid ${GOLD}`,background:'rgba(233,193,118,.07)'}}><strong>Mentor note:</strong> Do not memorize labels. Ask what this component changes in flavor, combustion, construction, or consistency.</div>
   </section>

   <section style={{marginTop:20,background:PANEL,border:`1px solid ${BORDER}`,borderRadius:18,padding:24}}>
    <h3 style={{fontSize:24,margin:'0 0 8px'}}>Quick Check</h3><p style={{marginTop:0,color:'#ddd3c7'}}>Which detail most strongly shapes your first sensory impression before the cigar develops through the session?</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{['wrapper','blend','brand'].map(k=><button key={k} onClick={()=>{setChoice(k);setFeedback(k==='wrapper'?'Correct. The wrapper heavily influences aroma, appearance, and the opening impression.':'Good thinking. That matters, but the wrapper is usually the strongest immediate sensory cue.')}} style={{padding:'12px 18px',borderRadius:999,border:`1px solid ${choice===k?GOLD:BORDER}`,background:choice===k?'rgba(233,193,118,.16)':'#0b111b',color:CREAM,textTransform:'capitalize'}}>{k}</button>)}</div>
    {feedback&&<div role="alert" style={{marginTop:14,padding:14,borderRadius:12,background:'rgba(233,193,118,.08)',border:`1px solid ${BORDER}`,lineHeight:1.5}}>{feedback}</div>}
   </section>
  </div>
  <div style={{position:'fixed',left:0,right:0,bottom:0,padding:16,background:'rgba(4,7,11,.94)',borderTop:`1px solid ${BORDER}`,display:'flex',justifyContent:'center',gap:12,zIndex:9}}><button onClick={()=>navigate('/smokecraft/humidor-match')} style={{minWidth:150,padding:'14px 22px',borderRadius:999,border:`1px solid ${GOLD}`,background:'transparent',color:GOLD}}>← Back</button><button onClick={continueNext} style={{minWidth:310,padding:'14px 22px',borderRadius:999,border:`1px solid ${GOLD}`,background:ready?GOLD:'rgba(233,193,118,.35)',color:ready?'#120d08':CREAM,fontWeight:800}}>Continue to Terroir →</button></div>
 </div>
}
