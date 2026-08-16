import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD='#E9C176', CREAM='#f5efe5', BG='#070b12', PANEL='rgba(10,14,22,.95)', BORDER='rgba(233,193,118,.28)'
const SECTIONS={
 country:{title:'Country',img:SC_ASSETS.terroir,body:'Country gives you the broad tobacco tradition and climate family. Nicaragua often leans bold and mineral, the Dominican Republic can range from elegant to rich, Honduras is known for earthy depth, Ecuador for wrapper cultivation, Cameroon for distinctive wrapper character, and Cuba for its historic regional identity.',hint:'Country is the broad map. Region is the closer zoom.'},
 region:{title:'Region',img:SC_ASSETS.terroir,body:'Region matters because two farms in the same country can have different elevation, rainfall, wind, sun exposure, and soil. Those differences change leaf thickness, oils, aroma, and strength.',hint:'Think of region like a neighborhood inside a city: same country, different local conditions.'},
 soil:{title:'Soil',img:SC_ASSETS.terroirSoil,body:'Soil controls drainage, mineral availability, root behavior, and plant stress. Volcanic, clay-rich, sandy, and loamy soils can push tobacco toward different body, texture, and mineral character.',hint:'Roots read the soil before you ever taste the leaf.'},
 climate:{title:'Climate',img:SC_ASSETS.terroir,body:'Temperature, humidity, rain, cloud cover, and wind influence leaf size, thickness, oils, disease pressure, and maturation. Climate helps explain why the same seed can behave differently in another place.',hint:'Same seed does not mean same cigar when the climate changes.'},
 growing:{title:'Growing Conditions',img:SC_ASSETS.terroir,body:'Shade-grown versus sun-grown cultivation, spacing, priming, harvest timing, curing, and fermentation decisions all shape the final leaf. Terroir includes nature, but craft decisions amplify or soften what nature provides.',hint:'The farmer and the environment work together.'},
 why:{title:'Why It Matters',img:SC_ASSETS.terroir,body:'Terroir gives you a language for predicting and describing flavor. Instead of saying “I like this cigar,” you can begin identifying the origin, conditions, and leaf choices that created the experience.',hint:'The goal is not memorization. The goal is pattern recognition.'}
}
const FACTORS=['country','region','soil','climate','growing']

export default function Terroir(){
 const navigate=useNavigate(); const {session,awardSessionRewards}=useGuestSession(); const {isDemoMode}=useSmokeCraftProgress(); const {journey,setTerroir}=useSmokeCraftJourney()
 const [active,setActive]=useState('country'); const [viewed,setViewed]=useState(()=>new Set(journey.terroir?.viewedSections||[])); const [answer,setAnswer]=useState(null); const [feedback,setFeedback]=useState(null)
 useEffect(()=>{if(!isDemoMode&&!session.completedSteps.includes('meet-your-cigar'))navigate('/smokecraft/meet-your-cigar',{replace:true})},[isDemoMode,session.completedSteps,navigate])
 useEffect(()=>{setViewed(v=>new Set(v).add(active))},[active])
 useEffect(()=>{if(viewed.size)setTerroir({viewedSections:[...viewed]})},[viewed.size])
 const section=SECTIONS[active]; const required=FACTORS.every(x=>viewed.has(x)); const ready=required&&answer==='climate'
 function check(val){setAnswer(val);setFeedback(val==='climate'?'Correct. Climate directly changes how the plant grows and how the leaf develops, even when seed genetics stay the same.':'Not quite. Mentor hint: choose the factor that can make the same seed grow differently because temperature, humidity, rain, and sunlight changed.')}
 function next(){if(!required){setFeedback('Mentor hint: review Country, Region, Soil, Climate, and Growing Conditions before continuing. I will not let you move forward without the foundation.');return}if(answer!=='climate'){setFeedback('Complete the quick check correctly to unlock the next lesson. Focus on what can change the same seed from one place to another.');return}setTerroir({viewedSections:[...viewed],completedAt:journey.terroir?.completedAt||Date.now()});awardSessionRewards('terroir');navigate('/smokecraft/format')}
 return <div style={{minHeight:'100vh',background:'radial-gradient(circle at 20% 10%,rgba(83,55,34,.25),transparent 36%),'+BG,color:CREAM,fontFamily:'Georgia,serif',padding:'28px 28px 120px'}}>
  <div style={{maxWidth:1180,margin:'0 auto'}}>
   <div style={{fontSize:12,letterSpacing:'.22em',textTransform:'uppercase',color:GOLD}}>SmokeCraft 360 • Guided Lesson</div>
   <h1 style={{fontSize:'clamp(34px,5vw,58px)',margin:'8px 0 6px'}}>Understand Terroir</h1>
   <p style={{fontSize:18,lineHeight:1.65,maxWidth:900,color:'#ded6ca'}}>Terroir explains why tobacco from different places behaves and tastes differently. Your mentor will help you connect country, region, soil, climate, and growing decisions to the cigar in your hand.</p>

   <section style={{display:'grid',gridTemplateColumns:'minmax(0,1.15fr) minmax(320px,.85fr)',gap:20,marginTop:24}}>
    <div style={{background:PANEL,border:`1px solid ${BORDER}`,borderRadius:18,padding:22}}>
     <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{Object.keys(SECTIONS).map(k=><button key={k} onClick={()=>{setActive(k);setFeedback(null)}} style={{minHeight:50,padding:'10px 15px',borderRadius:999,border:`1px solid ${active===k?GOLD:BORDER}`,background:active===k?'rgba(233,193,118,.14)':'#0b111b',color:active===k?GOLD:CREAM,fontWeight:700}}>{viewed.has(k)?'✓ ':''}{SECTIONS[k].title}</button>)}</div>
     <div style={{marginTop:18,borderRadius:16,overflow:'hidden',border:`1px solid ${BORDER}`,background:'#05080d'}}><img src={section.img} alt={`${section.title} tobacco education`} style={{width:'100%',height:'clamp(230px,31vw,390px)',objectFit:'cover',display:'block',filter:'brightness(.72)'}}/></div>
    </div>
    <aside style={{background:'linear-gradient(160deg,rgba(57,38,25,.96),rgba(8,12,18,.98))',border:`1px solid ${BORDER}`,borderRadius:18,padding:22}}>
     <div style={{fontSize:13,color:GOLD,letterSpacing:'.14em',textTransform:'uppercase'}}>Mentor Guidance</div>
     <h3 style={{fontSize:25,margin:'10px 0'}}>Learn to trace flavor back to place.</h3>
     <p style={{lineHeight:1.65,color:'#e7dfd4'}}>“Do not rush through these tabs. I want you to understand what each factor changes. Once you can connect environment to leaf behavior, you can make smarter choices when building your own cigar.”</p>
     <div style={{marginTop:16,padding:14,borderRadius:12,background:'rgba(233,193,118,.08)',border:`1px solid ${BORDER}`}}><strong style={{color:GOLD}}>Progress:</strong> {FACTORS.filter(x=>viewed.has(x)).length} of {FACTORS.length} core factors reviewed.</div>
    </aside>
   </section>

   <section style={{marginTop:20,background:PANEL,border:`1px solid ${BORDER}`,borderRadius:18,padding:24}}>
    <div style={{fontSize:13,color:GOLD,letterSpacing:'.14em',textTransform:'uppercase'}}>{section.title}</div>
    <p style={{fontSize:19,lineHeight:1.7,maxWidth:940,color:'#e9e1d6'}}>{section.body}</p>
    <div style={{padding:14,borderLeft:`4px solid ${GOLD}`,background:'rgba(233,193,118,.07)'}}><strong>Mentor note:</strong> {section.hint}</div>
   </section>

   <section style={{marginTop:20,background:PANEL,border:`1px solid ${BORDER}`,borderRadius:18,padding:24}}>
    <h3 style={{fontSize:24,margin:'0 0 8px'}}>Quick Check</h3>
    <p style={{fontSize:16,lineHeight:1.55,color:'#ded6ca'}}>Two farmers plant the same tobacco seed in different places. Which factor most directly explains why the leaf can develop differently?</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{['brand','climate','band design','box color'].map(x=><button key={x} onClick={()=>check(x)} style={{padding:'12px 18px',borderRadius:999,border:`1px solid ${answer===x?GOLD:BORDER}`,background:answer===x?'rgba(233,193,118,.16)':'#0b111b',color:CREAM,textTransform:'capitalize'}}>{x}</button>)}</div>
    {feedback&&<div role="alert" style={{marginTop:14,padding:14,borderRadius:12,background:ready?'rgba(20,90,50,.3)':'rgba(120,20,20,.28)',border:`1px solid ${ready?'rgba(150,255,180,.35)':'rgba(255,150,150,.35)'}`,lineHeight:1.55}}>{feedback}</div>}
   </section>
  </div>
  <div style={{position:'fixed',left:0,right:0,bottom:0,padding:16,background:'rgba(4,7,11,.94)',borderTop:`1px solid ${BORDER}`,display:'flex',justifyContent:'center',gap:12,zIndex:9}}><button onClick={()=>navigate('/smokecraft/meet-your-cigar')} style={{minWidth:150,padding:'14px 22px',borderRadius:999,border:`1px solid ${GOLD}`,background:'transparent',color:GOLD}}>← Back</button><button onClick={next} style={{minWidth:310,padding:'14px 22px',borderRadius:999,border:`1px solid ${GOLD}`,background:ready?GOLD:'rgba(233,193,118,.35)',color:ready?'#120d08':CREAM,fontWeight:800}}>Continue to Format →</button></div>
 </div>
}
