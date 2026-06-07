import { useNavigate } from 'react-router-dom'

export default function ComingSoon({ stepLabel, stepNumber, totalSteps = 20, stitch = false, nextRoute, prevRoute }) {
  const navigate = useNavigate()

  return (
    <div className="bg-background text-on-surface font-body-md" style={{ minHeight: 'max(884px, 100dvh)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary hover:bg-surface-variant/50 p-2 rounded-full transition-colors"
            onClick={() => navigate(prevRoute || '/smokecraft')}
          >arrow_back</button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">CraftHub 360</h1>
        </div>
        {stepNumber && (
          <span className="font-label-lg text-label-lg text-on-surface-variant tracking-widest">
            Step {stepNumber} of {totalSteps}
          </span>
        )}
      </header>

      {/* Main */}
      <main className="pt-20 pb-32 min-h-screen flex flex-col items-center justify-center px-8 text-center">
        {/* Module badge */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-lg text-label-lg">
            <span className="material-symbols-outlined text-[18px]">smoking_rooms</span>
            SMOKECRAFT 360
          </span>
        </div>

        {/* Stitch status badge */}
        <div className="mb-6">
          {stitch ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30 border border-green-500/30 text-green-400 font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              STITCH SOURCE CONFIRMED — AWAITING BUILD
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">pending</span>
              NEW SCREEN — NO STITCH SOURCE
            </span>
          )}
        </div>

        {/* Icon */}
        <div className="w-32 h-32 rounded-full glass-panel flex items-center justify-center mb-8 border border-primary/20 shadow-[0_0_40px_rgba(233,193,118,0.1)]">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '56px', fontVariationSettings: "'FILL' 0, 'wght' 200" }}>
            construction
          </span>
        </div>

        <h2 className="font-display-lg text-display-lg text-on-surface mb-4 leading-tight">
          {stepLabel}
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-12">
          {stitch
            ? 'This screen has been confirmed in the Stitch export and will be rebuilt in the next approved build batch.'
            : 'This screen does not yet exist in the Stitch export. It will be designed and built when the new screen brief is approved.'}
        </p>

        {/* Progress ribbon */}
        {stepNumber && (
          <div className="w-full max-w-md mb-12">
            <div className="flex justify-between mb-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Journey Progress</span>
              <span className="font-label-sm text-label-sm text-primary">{Math.round((stepNumber / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          {prevRoute && (
            <button
              onClick={() => navigate(prevRoute)}
              className="px-8 py-4 rounded-lg border border-outline text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-all active:scale-95"
            >
              ← Back
            </button>
          )}
          {nextRoute && (
            <button
              onClick={() => navigate(nextRoute)}
              className="px-8 py-4 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-lg hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
            >
              Skip to Next
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          )}
          <button
            onClick={() => navigate('/smokecraft')}
            className="px-8 py-4 rounded-lg glass-panel border border-outline-variant text-on-surface-variant font-label-lg text-label-lg hover:text-primary hover:border-primary/30 transition-all active:scale-95"
          >
            SmokeCraft Home
          </button>
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-24 bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/20 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] md:hidden">
        <button onClick={() => navigate('/')} className="flex flex-col items-center text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">explore</span>
          <span className="font-label-sm text-label-sm">Explore</span>
        </button>
        <button className="flex flex-col items-center text-primary bg-primary-container/20 rounded-full px-6 py-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smoking_rooms</span>
          <span className="font-label-sm text-label-sm">SmokeCraft</span>
        </button>
        <button onClick={() => navigate('/passport')} className="flex flex-col items-center text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="font-label-sm text-label-sm">Passport</span>
        </button>
        <button className="flex flex-col items-center text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">auto_awesome</span>
          <span className="font-label-sm text-label-sm">Assistant</span>
        </button>
      </nav>
    </div>
  )
}
