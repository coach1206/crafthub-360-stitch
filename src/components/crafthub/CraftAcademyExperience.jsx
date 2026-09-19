import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GOLD = '#d4af37'
const BG = '#090b10'
const PANEL = '#121722'

const makeKey = prefix => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`

export default function CraftAcademyExperience({ academyKey, title, subtitle }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [active, setActive] = useState(0)
  const [answers, setAnswers] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    const res = await fetch(`/api/crafthub/game/${academyKey}/state`, { credentials: 'include' })
    const json = await res.json()
    if (!res.ok || !json.ok) throw new Error(json.error || 'Unable to load academy state')
    setData(json)
  }

  useEffect(() => { load().catch(e => setMessage(e.message)) }, [academyKey])

  const completed = useMemo(() => new Set((data?.completions || []).map(x => x.lesson_key)), [data])
  const passed = useMemo(() => new Set((data?.attempts || []).filter(x => x.passed).map(x => x.lesson_key)), [data])
  const lesson = data?.academy?.lessons?.[active]

  const submitQuiz = async () => {
    if (!lesson || busy) return
    setBusy(true); setMessage('Working…')
    try {
      const answerArray = lesson.quiz.map((_q, i) => Number(answers[`${lesson.key}:${i}`] ?? -1))
      const res = await fetch(`/api/crafthub/game/${academyKey}/lessons/${lesson.key}/quiz`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': makeKey('quiz') },
        body: JSON.stringify({ answers: answerArray }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Quiz submission failed')
      setMessage(json.attempt?.passed ? 'Quiz passed. Lesson completion is unlocked.' : 'Quiz not passed yet.')
      await load()
    } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }

  const completeLesson = async () => {
    if (!lesson || busy) return
    setBusy(true); setMessage('Working…')
    try {
      const res = await fetch(`/api/crafthub/game/${academyKey}/lessons/${lesson.key}/complete`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': makeKey('complete') },
        body: '{}',
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Lesson completion failed')
      setMessage('Lesson complete. XP, badge, and NOVEE OS activity were recorded.')
      await load()
    } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }

  if (!data) return <main style={{ minHeight: '100vh', background: BG, color: 'white', padding: 32 }}>{message || 'Loading academy…'}</main>

  return (
    <main style={{ minHeight: '100vh', background: BG, color: 'white', padding: '24px clamp(16px,4vw,56px)', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ color:GOLD, fontSize:13, letterSpacing:2 }}>CRAFTHUB 360</div>
          <h1 style={{ margin:'6px 0 4px', fontSize:'clamp(30px,5vw,52px)' }}>{title}</h1>
          <p style={{ margin:0, color:'#b9c0cc', fontSize:17 }}>{subtitle}</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => navigate('/crafthub')} style={buttonStyle}>Back to CraftHub</button>
          <button onClick={() => navigate('/')} style={buttonStyle}>Exit to NOVEE OS</button>
        </div>
      </div>

      <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
        <Stat label="XP" value={data.state?.xp_total ?? 0} />
        <Stat label="Rank" value={data.state?.rank_label || 'Novice'} />
        <Stat label="Lessons" value={`${completed.size}/${data.academy.lessons.length}`} />
        <Stat label="Awards" value={data.awards?.length || 0} />
      </section>

      <section style={{ display:'grid', gridTemplateColumns:'minmax(220px,320px) 1fr', gap:18, alignItems:'start' }}>
        <nav style={{ background:PANEL, border:'1px solid #242b38', borderRadius:16, padding:12 }}>
          {data.academy.lessons.map((l,i) => (
            <button key={l.key} onClick={() => { setActive(i); setMessage('') }} style={{ ...lessonButton, borderColor: active===i ? GOLD : '#2a3140' }}>
              <span>{i+1}. {l.title}</span>
              <span style={{ color: completed.has(l.key) ? '#8ee6aa' : passed.has(l.key) ? GOLD : '#7d8796' }}>{completed.has(l.key) ? 'Complete' : passed.has(l.key) ? 'Quiz passed' : 'Open'}</span>
            </button>
          ))}
        </nav>

        <article style={{ background:PANEL, border:'1px solid #242b38', borderRadius:16, padding:'clamp(18px,4vw,34px)' }}>
          <h2 style={{ marginTop:0, fontSize:30 }}>{lesson.title}</h2>
          <ul style={{ color:'#d7dbe3', lineHeight:1.7 }}>{lesson.body.map(x => <li key={x}>{x}</li>)}</ul>

          <div style={{ marginTop:28, borderTop:'1px solid #2b3240', paddingTop:22 }}>
            <h3>Knowledge Check</h3>
            {lesson.quiz.map((q, qi) => (
              <div key={q.q} style={{ marginBottom:20 }}>
                <p style={{ fontWeight:700 }}>{q.q}</p>
                {q.options.map((opt, oi) => (
                  <label key={opt} style={{ display:'block', padding:'8px 0', cursor:'pointer' }}>
                    <input type="radio" name={`${lesson.key}-${qi}`} checked={Number(answers[`${lesson.key}:${qi}`])===oi} onChange={() => setAnswers(a => ({...a,[`${lesson.key}:${qi}`]:oi}))} />{' '}
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button disabled={busy || passed.has(lesson.key)} onClick={submitQuiz} style={primaryButton}>
                {passed.has(lesson.key) ? 'Quiz Passed' : 'Submit Quiz'}
              </button>
              <button disabled={busy || !passed.has(lesson.key) || completed.has(lesson.key)} onClick={completeLesson} style={primaryButton}>
                {completed.has(lesson.key) ? 'Lesson Complete' : 'Complete Lesson'}
              </button>
            </div>
            {message && <p role="status" style={{ color: message.includes('failed') || message.includes('not passed') ? '#ffb4a9' : '#c8d1df', marginTop:18 }}>{message}</p>}
          </div>
        </article>
      </section>
    </main>
  )
}

function Stat({label,value}) {
  return <div style={{ background:PANEL, border:'1px solid #242b38', borderRadius:14, padding:16 }}><div style={{ color:'#8b95a5', fontSize:12, textTransform:'uppercase', letterSpacing:1.4 }}>{label}</div><div style={{ color:GOLD, fontSize:24, marginTop:5 }}>{value}</div></div>
}

const buttonStyle={background:'transparent',color:'white',border:'1px solid #485166',borderRadius:999,padding:'10px 15px',cursor:'pointer'}
const primaryButton={background:GOLD,color:'#0a0b0e',border:0,borderRadius:10,padding:'12px 18px',fontWeight:800,cursor:'pointer'}
const lessonButton={width:'100%',background:'#0d121b',color:'white',border:'1px solid #2a3140',borderRadius:11,padding:'13px 12px',marginBottom:8,textAlign:'left',cursor:'pointer',display:'flex',flexDirection:'column',gap:5}
