import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STAGE_MS = 2200
const SAFETY_MS = 7000

export default function PublicBoot() {
  const navigate = useNavigate()
  const [stage, setStage] = useState(0)

  const stages = useMemo(
    () => [
      {
        eyebrow: 'PROFOUND INNOVATION',
        title: 'Profound Innovation',
        subtitle: 'Initializing public venue experience',
      },
      {
        eyebrow: 'CRAFTHUB 360',
        title: 'CraftHub 360',
        subtitle: 'Loading guest craft table system',
      },
    ],
    []
  )

  const enterCraftHub = () => {
    navigate('/crafthub', { replace: true })
  }

  useEffect(() => {
    const stageTimer = window.setTimeout(() => {
      if (stage === 0) {
        setStage(1)
      } else {
        enterCraftHub()
      }
    }, STAGE_MS)

    return () => window.clearTimeout(stageTimer)
  }, [stage])

  useEffect(() => {
    const safetyTimer = window.setTimeout(() => {
      enterCraftHub()
    }, SAFETY_MS)

    return () => window.clearTimeout(safetyTimer)
  }, [])

  const current = stages[stage] || stages[1]

  return (
    <main
      onClick={enterCraftHub}
      className="min-h-screen cursor-pointer overflow-hidden bg-black text-[#f7d46a]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(247,212,106,0.22),transparent_34%),linear-gradient(135deg,#050505,#120d03_45%,#000)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(90deg,transparent,rgba(247,212,106,0.08),transparent)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full border border-[#f7d46a]/40 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.38em] text-[#f7d46a]/80">
          {current.eyebrow}
        </div>

        <h1 className="max-w-4xl text-5xl font-black uppercase tracking-[0.16em] text-[#fff4c7] md:text-7xl">
          {current.title}
        </h1>

        <p className="mt-6 max-w-2xl text-sm uppercase tracking-[0.28em] text-[#d9b94d]/80 md:text-base">
          {current.subtitle}
        </p>

        <div className="mt-10 h-1 w-64 overflow-hidden rounded-full bg-[#2c2208]">
          <div
            className="h-full bg-[#f7d46a] transition-all duration-700"
            style={{ width: stage === 0 ? '50%' : '100%' }}
          />
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            enterCraftHub()
          }}
          className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#f7d46a]/60 bg-black/70 px-8 py-3 text-xs font-bold uppercase tracking-[0.24em] text-[#f7d46a] shadow-[0_0_30px_rgba(247,212,106,0.18)] backdrop-blur"
        >
          Enter CraftHub
        </button>
      </section>
    </main>
  )
}
