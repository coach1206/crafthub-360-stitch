import { useNavigate } from 'react-router-dom'

export default function ModulePlaceholder({
  title = 'NOVEE OS Module',
  purpose = 'This module is connected to NOVEE OS and ready for the next build phase.',
  phases = ['Define operating workflow', 'Connect protected route data', 'Add production controls'],
}) {
  const navigate = useNavigate()

  return (
    <div className="leather-texture min-h-screen px-gutter py-10 text-on-surface">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center">
        <div className="glass-morphism rounded-lg p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Module Ready for Buildout</p>
          <h1 className="mt-3 font-headline-xl text-4xl text-on-surface md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-on-surface-variant">{purpose}</p>

          <div className="mt-8 rounded-lg border border-primary/20 bg-black/25 p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-[#ead6a6]">Next build phase</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {phases.map((phase) => (
                <div key={phase} className="min-h-[76px] rounded-md border border-primary/15 bg-primary/10 p-4 text-sm leading-6 text-on-surface-variant">
                  {phase}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate(-1)}
              className="min-h-[52px] rounded-md border border-primary/40 bg-black/25 px-5 text-sm font-black uppercase tracking-[0.16em] text-primary"
            >
              Back to NOVEE OS
            </button>
            <button
              onClick={() => navigate('/home')}
              className="gold-foil min-h-[52px] rounded-md px-5 text-sm font-black uppercase tracking-[0.16em] text-[#201405]"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
