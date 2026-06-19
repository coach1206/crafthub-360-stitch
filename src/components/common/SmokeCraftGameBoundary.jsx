import React from 'react'
import { useNavigate } from 'react-router-dom'

class SmokeCraftBoundaryInner extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

export default function SmokeCraftGameBoundary({ children }) {
  const navigate = useNavigate()

  const fallback = (
    <main className="min-h-screen bg-black text-[#f7d46a]">
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-black uppercase tracking-[0.16em] text-[#fff4c7]">
          SmokeCraft is loading safely.
        </h1>
        <p className="mt-5 max-w-xl text-[#d9b94d]/80">
          The experience hit a safe stop instead of going black.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.assign('/smokecraft/start')}
            className="rounded-full bg-[#f7d46a] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-black"
          >
            Restart SmokeCraft
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

  return <SmokeCraftBoundaryInner fallback={fallback}>{children}</SmokeCraftBoundaryInner>
}
