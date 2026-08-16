import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'

const GOLD='#E9C176', CREAM='#f5efe5', BG='#070b12', PANEL='rgba(10,14,22,.95)', BORDER='rgba(233,193,118,.28)'
const FORMATS=[
 {id:'corona',label:'Corona',size:'5.5 × 42',burn:'35–45 min',draw:'Focused',note:'Narrower ring gauge keeps wrapper influence forward and creates a more focused draw.'},
 {id:'robusto',label:'Robusto',size:'5 × 50',burn:'45–60 min',draw:'Balanced',note:'A compact benchmark format with enough ring gauge for balance without a very long session.'},
 {id:'toro',label:'Toro',size:'6 × 52',burn:'60–75 min',draw:'Open',note:'Extra length gives the blend more time to evolve while the 52 ring keeps the draw open.'},
 {id:'torpedo',label:'Torpedo',size:'6.5 × 52',burn:'70–85 min',draw:'Distinct',note:'The tapered head changes how smoke is concentrated at the mouth while keeping a longer burn.'},
 {id:'churchill',label:'Churchill',size:'7 × 48',burn:'75–90 min',draw:'Refined',note:'Longer length extends the session and gives the blend more room to develop in stages.'},
 {id:'gordo',label:'Gordo',size:'6 × 60',burn:'90–120 min',draw:'Cool',note:'The wide ring gauge holds more filler, often burning cooler and creating the longest session here.'},
]
const CORRECT=['corona','robusto','toro','torpedo','churchill','gordo']
const START=['gordo','corona','torpedo','robusto','churchill','toro']

export default function Format(){
 const navigate=useNavigate(); const {awardSessionRewards,setSmokeCraftFormat}=useGuestSession(); const {journey,setFormat}=useSmokeCraftJourney()
 const [selected,setSelected]=useState(journey.format?.id||null); const [order,setOrder]=useState(START); const [feedback,setFeedback]=useState(null); const [passed,setPassed]=useState(false)
 const selectedFmt=FORMATS.find(x=>x.id===selected)
 useEffect(()=>{if(selectedFmt){setFormat({id:selectedFmt.id,label:selectedFmt.label,desc:selectedFmt.size,burnTime:selectedFmt.burn});setSmokeCraftFormat({id:selectedFmt.id,name:selectedFmt.label,desc:selectedFmt.size})}},[selected])
 function move(i,d){const j=i+d;if(j<0||j>=order.length)return;setFeedback(null);setPassed(false);setOrder(prev=>{const n=[...prev];[n[i],n[j]]=[n[j],n[i]];return n})}
 function check(){const ok=order.every((x,i)=>x===CORRECT[i]);setPassed(ok);if(ok){setFeedback('Correct. You used burn-time clues to move from the shorter Corona session through Robusto, Toro, Torpedo, Churchill, and finally the wide-ring Gordo.')}else{const first=order.findIndex((x,i)=>x!==CORRECT[i]);const expected=FORMATS.find(x=>x.id===CORRECT[first]);setFeedback(`Not yet. Mentor hint: position ${first+1} should be ${expected.label}. Compare the published burn-time ranges, then adjust the order again.`)}}
 function next(){if(!selected){setFeedback('Choose one format you would personally smoke before continuing. Your mentor needs that preference for the next step.');return}if(!passed){setFeedback('Complete the burn-time sequence correctly first. I will keep the lesson here until the ordering makes sense.');return}awardSessionRewards('format');navigate('/smokecraft/request-purchase')}
 return <div style={{minHeight:'100vh',background:'radial-gradient(circle at 82% 12%,rgba(83,55,34,.25),transparent 34%),'+BG,color:CREAM,fontFamily:'Georgia,serif',padding:'28px 28px 120px'}}>
  <div style={{maxWidth:1180,margin:'0 auto'}}>
   <div style={{fontSize:12,letterSpacing:'.22em',textTransform:'uppercase',color:GOLD}}>SmokeCraft 360 • Guided Lesson</div>
   <h1 style={{fontSize:'clamp(34px,5vw,58px)',margin:'8px 0 6px'}}>Choose Your Format</h1>
   <p style={{fontSize:18,lineHeight:1.65,maxWidth:920,color:'#ded6ca'}}>Format is more than size. Length changes how long the cigar develops; ring gauge changes how much filler is burning at once; shape changes draw and smoke concentration.</p>

   <section style={{display:'grid',gridTemplateColumns:'minmax(0,1.15fr) minmax(320px,.85fr)',gap:20,marginTop:24}}>
    <div style={{background:PANEL,border:`1px solid ${BORDER}`,borderRadius:18,padding:22}}>
     <div style={{fontSize:13,color:GOLD,letterSpacing:'.14em',textTransform:'uppercase'}}>Step 1 • Learn the Formats</div>
     <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12,marginTop:14}}>{FORMATS.map(f=><button key={f.id} onClick={()=>{setSelected(f.id);setFeedback(null)}} style={{textAlign:'left',padding:16,minHeight:165,borderRadius:14,border:`1px solid ${selected===f.id?GOLD:BORDER}`,background:selected===f.id?'rgba(233,193,118,.14)':'#0b111b',color:CREAM}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong style={{fontSize:20,color:GOLD}}>{f.label}</strong><span style={{color:'#d7cab7'}}>{f.size}</span></div><div style={{marginTop:12,lineHeight:1.6}}><div><strong>Burn:</strong> {f.burn}</div><div><strong>Draw:</strong> {f.draw}</div></div><p style={{fontSize:14,lineHeight:1.5,color:'#d7d0c5'}}>{f.note}</p></button>)}</div>
    </div>
    <aside style={{background:'linear-gradient(160deg,rgba(57,38,25,.96),rgba(8,12,18,.98))',border:`1px solid ${BORDER}`,borderRadius:18,padding:22}}>
     <div style={{fontSize:13,color:GOLD,letterSpacing:'.14em',textTransform:'uppercase'}}>Mentor Guidance</div>
     <h3 style={{fontSize:25,margin:'10px 0'}}>Use size to predict the smoking experience.</h3>
     <p style={{lineHeight:1.65,color:'#e7dfd4'}}>“Do not choose by appearance alone. Compare length, ring gauge, burn time, and draw. A narrow Corona can put the wrapper front and center. A Gordo carries more filler and usually gives you a cooler, longer session.”</p>
     <div style={{marginTop:16,padding:14,borderRadius:12,background:'rgba(233,193,118,.08)',border:`1px solid ${BORDER}`}}><strong style={{color:GOLD}}>Your selection:</strong> {selectedFmt?`${selectedFmt.label} — ${selectedFmt.burn}`:'Choose a format above.'}</div>
    </aside>
   </section>

   <section style={{marginTop:20,background:PANEL,border:`1px solid ${BORDER}`,borderRadius:18,padding:24}}>
    <div style={{fontSize:13,color:GOLD,letterSpacing:'.14em',textTransform:'uppercase'}}>Step 2 • Prove You Understand It</div>
    <h2 style={{fontSize:27,margin:'8px 0'}}>Order the formats from shortest to longest burn time</h2>
    <p style={{fontSize:16,lineHeight:1.55,color:'#ded6ca'}}>Use the arrows. You can see every burn-time range above, so the lesson gives you the information needed to solve it instead of making you guess.</p>
    <ol style={{listStyle:'none',padding:0,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>{order.map((id,i)=>{const f=FORMATS.find(x=>x.id===id);return <li key={id} style={{padding:14,border:`1px solid ${BORDER}`,borderRadius:12,background:'#0b111b',textAlign:'center'}}><div style={{fontSize:12,color:'#a99e90'}}>#{i+1}</div><div style={{fontSize:18,color:GOLD,fontWeight:700,marginTop:4}}>{f.label}</div><div style={{fontSize:13,marginTop:4}}>{f.burn}</div><div style={{display:'flex',justifyContent:'center',gap:8,marginTop:12}}><button disabled={i===0} onClick={()=>move(i,-1)} style={{minWidth:44,minHeight:44,borderRadius:8,border:`1px solid ${BORDER}`,background:'#121925',color:GOLD,opacity:i===0?.35:1}}>↑</button><button disabled={i===order.length-1} onClick={()=>move(i,1)} style={{minWidth:44,minHeight:44,borderRadius:8,border:`1px solid ${BORDER}`,background:'#121925',color:GOLD,opacity:i===order.length-1?.35:1}}>↓</button></div></li>})}</ol>
    <button onClick={check} style={{marginTop:16,padding:'13px 22px',borderRadius:999,border:`1px solid ${GOLD}`,background:GOLD,color:'#120d08',fontWeight:800}}>Check My Order</button>
    {feedback&&<div role="alert" style={{marginTop:14,padding:14,borderRadius:12,background:passed?'rgba(20,90,50,.3)':'rgba(120,20,20,.28)',border:`1px solid ${passed?'rgba(150,255,180,.35)':'rgba(255,150,150,.35)'}`,lineHeight:1.55}}>{feedback}</div>}
   </section>
  </div>
  <div style={{position:'fixed',left:0,right:0,bottom:0,padding:16,background:'rgba(4,7,11,.94)',borderTop:`1px solid ${BORDER}`,display:'flex',justifyContent:'center',gap:12,zIndex:9}}><button onClick={()=>navigate('/smokecraft/terroir')} style={{minWidth:150,padding:'14px 22px',borderRadius:999,border:`1px solid ${GOLD}`,background:'transparent',color:GOLD}}>← Back</button><button onClick={next} style={{minWidth:340,padding:'14px 22px',borderRadius:999,border:`1px solid ${GOLD}`,background:selected&&passed?GOLD:'rgba(233,193,118,.35)',color:selected&&passed?'#120d08':CREAM,fontWeight:800}}>Continue to Request / Purchase →</button></div>
 </div>
}
