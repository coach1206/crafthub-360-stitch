import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { MENTORS, MAX_MENTOR_SELECTIONS } from '../../modules/smokecraft/smokeCraftMentors.js'
import { useSmokeCraftMentorVoice } from '../../hooks/useSmokeCraftMentorVoice.js'

const GOLD='#E9C176', NAVY='#0b0f18', NAVY_DEEP='#060810', WOOD_DIM='rgba(122,79,49,0.28)', BORDER='rgba(233,193,118,0.22)', GLASS='rgba(8,10,16,0.86)', CREAM='#e5e2e1', DIM='rgba(229,226,225,0.65)'

function VoicePreviewControl({ mentor }) {
  const voice = useSmokeCraftMentorVoice()
  function stop(e){ e.stopPropagation() }
  function handlePreview(e){ stop(e); triggerHaptic('light'); voice.requestPreview(mentor.id, voice.preferences?.playbackSpeed ?? 1.0) }
  return <div onClick={stop} onKeyDown={e=>e.stopPropagation()} style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${BORDER}`}}>
    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
      <button type="button" onClick={handlePreview} aria-label={`Preview ${mentor.name}'s voice`} style={{fontSize:11,fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',color:GOLD,background:'rgba(233,193,118,0.08)',border:`1px solid ${BORDER}`,borderRadius:999,padding:'6px 12px',cursor:'pointer'}}>{voice.status==='loading'?'Loading…':'Preview Voice'}</button>
      {voice.status==='ready'&&<><button type="button" onClick={e=>{stop(e);voice.isPlaying?voice.pause():voice.play()}} style={iconBtnStyle}>{voice.isPlaying?'⏸':'▶'}</button><button type="button" onClick={e=>{stop(e);voice.replay()}} style={iconBtnStyle}>⟲</button></>}
      <button type="button" onClick={e=>{stop(e);voice.toggleMute()}} style={iconBtnStyle}>{voice.isMuted?'🔇':'🔊'}</button>
      {voice.status==='unavailable'&&<span style={{fontSize:10,color:DIM}}>Voice unavailable for this mentor</span>}
      {voice.status==='provider-error'&&<><span style={{fontSize:10,color:DIM}}>Voice preview failed</span><button type="button" onClick={e=>{stop(e);voice.retry()}} style={{...iconBtnStyle,width:'auto',padding:'0 8px',fontSize:10}}>Retry</button></>}
      {voice.status==='session-expired'&&<span style={{fontSize:10,color:DIM}}>Session expired — refresh to preview voice</span>}
    </div>
    {voice.transcript&&voice.preferences?.captionsEnabled!==false&&voice.status!=='idle'&&<p style={{fontSize:10,color:DIM,lineHeight:1.5,marginTop:8,marginBottom:0}} aria-live="polite">{voice.transcript}</p>}
  </div>
}
const iconBtnStyle={width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:GOLD,background:'rgba(233,193,118,0.08)',border:`1px solid ${BORDER}`,cursor:'pointer',fontSize:12,padding:0}

function MentorCard({ mentor, active, maxed, onToggle }) {
  const [hover,setHover]=useState(false)
  function handleKeyDown(e){ if(maxed)return; if(e.key==='Enter'||e.key===' '){e.preventDefault();onToggle()} }
  return <div role="button" tabIndex={maxed?-1:0} aria-label={`${mentor.name} — ${mentor.country} — ${mentor.role} — ${mentor.bio}${active?' (selected)':''}`} aria-pressed={active} aria-disabled={maxed} onClick={maxed?undefined:onToggle} onKeyDown={handleKeyDown} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocus={()=>setHover(true)} onBlur={()=>setHover(false)} style={{position:'relative',textAlign:'left',background:GLASS,border:`1.5px solid ${active?GOLD:(hover?'rgba(233,193,118,0.5)':BORDER)}`,borderRadius:14,padding:0,overflow:'hidden',cursor:maxed?'not-allowed':'pointer',opacity:maxed?.5:1,touchAction:'manipulation',WebkitTapHighlightColor:'transparent',boxShadow:active?'0 0 0 3px rgba(233,193,118,0.18)':'none',transition:'border-color .15s ease, box-shadow .15s ease, opacity .15s ease'}}>
    <div style={{position:'relative',aspectRatio:'4 / 5',background:'#000'}}>
      <img src={mentor.image} alt={`${mentor.name}, ${mentor.country} mentor`} draggable={false} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
      <div style={{position:'absolute',inset:'auto 10px 10px',background:'linear-gradient(180deg, rgba(17,11,5,.88), rgba(5,4,3,.96))',border:'2px solid #D9A94F',borderRadius:10,padding:'10px 12px',textAlign:'center',boxShadow:'0 8px 24px rgba(0,0,0,.48)'}}>
        <div style={{fontSize:'clamp(18px,2vw,26px)',fontWeight:800,lineHeight:1.05,color:'#FFF4D6',textShadow:'0 1px 2px #000'}}>{mentor.country}</div>
        <div style={{fontSize:'clamp(12px,1.1vw,15px)',fontWeight:800,marginTop:5,color:'#E9C176',letterSpacing:'.02em'}}>{mentor.role}</div>
      </div>
      <div style={{position:'absolute',right:8,top:8,width:30,height:30,borderRadius:'50%',background:active?GOLD:'rgba(6,8,16,.82)',color:active?'#0a0603':GOLD,border:`1px solid ${GOLD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700}} aria-hidden="true">{active?'✓':'+'}</div>
    </div>
    <div style={{padding:'12px 14px 14px'}}>
      <div style={{fontSize:17,fontWeight:800,color:CREAM,marginBottom:4}}>{mentor.flag} {mentor.name}</div>
      <div style={{fontSize:12,color:DIM,lineHeight:1.5,marginBottom:8,minHeight:36}}>{mentor.bio}</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{mentor.tags.map(tag=><span key={tag} style={{fontSize:10,fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',color:'rgba(233,193,118,.9)',border:`1px solid ${BORDER}`,borderRadius:999,padding:'3px 8px'}}>{tag}</span>)}</div>
      <VoicePreviewControl mentor={mentor}/>
    </div>
  </div>
}

export default function Mentor(){
  const {awardSessionRewards,setSelectedMentor}=useGuestSession(); const {journey,setMentor}=useSmokeCraftJourney(); const navigate=useNavigate()
  const [selected,setSelected]=useState(()=>{const saved=journey.mentor;if(!saved)return[];if(Array.isArray(saved))return saved.map(m=>m.id);return[saved.id]})
  useEffect(()=>{const mentors=MENTORS.filter(m=>selected.includes(m.id));setMentor(mentors.length?mentors:null)},[selected])
  useEffect(()=>{const first=Array.isArray(journey.mentor)?journey.mentor[0]:null;if(first)setSelectedMentor(first.id,first.country)},[journey.mentor])
  function toggle(id){triggerHaptic('light');setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length<MAX_MENTOR_SELECTIONS?[...prev,id]:prev)}
  function handleContinue(){if(selected.length===0)return;triggerHaptic('medium');awardSessionRewards('mentor');navigate('/smokecraft/humidor-match')}
  return <div style={{position:'fixed',inset:0,overflow:'hidden',display:'flex',flexDirection:'column',background:`radial-gradient(ellipse at 20% -10%, rgba(233,193,118,.10), transparent 55%),radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,fontFamily:'Georgia, serif'}}>
    <header style={{padding:'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',flexShrink:0}}><div style={{fontSize:11,fontWeight:700,color:'rgba(233,193,118,.6)',letterSpacing:'.24em',textTransform:'uppercase',marginBottom:6}}>SmokeCraft Journey</div><h1 style={{margin:0,fontSize:'clamp(22px,3.4vw,34px)',fontWeight:700,color:CREAM}}>Mentor Selection</h1><p style={{margin:'6px 0 0',fontSize:13,color:DIM,maxWidth:700}}>Select up to {MAX_MENTOR_SELECTIONS} mentors from the world's great cigar and tobacco-growing traditions.</p><div style={{fontSize:12,color:selected.length>0?GOLD:DIM,marginTop:8}}>{selected.length} of {MAX_MENTOR_SELECTIONS} selected</div></header>
    <main style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'16px clamp(16px,4vw,40px) clamp(150px,20vh,190px)'}}><div style={{maxWidth:1180,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:16}}>{MENTORS.map(mentor=>{const active=selected.includes(mentor.id);const maxed=selected.length>=MAX_MENTOR_SELECTIONS&&!active;return <MentorCard key={mentor.id} mentor={mentor} active={active} maxed={maxed} onToggle={()=>toggle(mentor.id)}/>})}</div></main>
    <SmokeCraftNavBar primary="Continue to Session 1 →" onPrimary={handleContinue} primaryDisabled={selected.length===0} secondary="← Back" onSecondary={()=>navigate('/smokecraft/golden-box')}/>
  </div>
}
