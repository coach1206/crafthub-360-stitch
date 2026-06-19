import { useNavigate } from 'react-router-dom'

export default function SmokeCraftEntry() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-black text-[#f7d46a]">
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="rounded-full border border-[#f7d46a]/40 px-5 py-2 text-xs font-bold uppercase tracking-[0.32em]">
          CraftHub 360
        </div>

        <h1 className="mt-8 text-5xl font-black uppercase tracking-[0.16em] text-[#fff4c7] md:text-7xl">
          SmokeCraft 360
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-[#d9b94d]/80">
          Cigar pairing, mentor-guided tasting, flavor notes, and score flow.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/smokecraft/start')}
            className="rounded-full bg-[#f7d46a] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-black"
          >
            Start Experience
          </button>

          <button
            type="button"
            onClick={() => navigate('/crafthub')}
            className="rounded-full border border-[#f7d46a]/60 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#f7d46a]"
          >
            Back to CraftHub
          </button>
        </div>
      </section>
    </main>
  )
}
