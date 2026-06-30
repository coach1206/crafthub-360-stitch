import { useNavigate } from 'react-router-dom'
import {
  SmokeCraftAtmosphericBackground,
  SmokeCraftBottomNav,
  SmokeCraftCtaButton,
  SmokeCraftGlassPanel,
  SmokeCraftPremiumHeader,
} from '../../components/smokecraft/SmokeCraftPremium.jsx'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

export default function ComingSoon({ stepLabel, stepNumber, totalSteps = 20, stitch = false, nextRoute, prevRoute, referenceImage, referenceImageAlt }) {
  const navigate = useNavigate()

  if (referenceImage) {
    return (
      <div
        onClick={() => navigate(nextRoute || prevRoute || '/smokecraft')}
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
      >
        <SmokeCraftAssetScreen src={referenceImage} alt={referenceImageAlt || stepLabel} />
      </div>
    )
  }

  return (
    <div className="smokecraft-premium-page">
      <SmokeCraftAtmosphericBackground variant="education" />
      <SmokeCraftPremiumHeader
        backTo={prevRoute || '/smokecraft'}
        step={stepNumber ? `Step ${stepNumber} of ${totalSteps}` : undefined}
      />

      {/* Main */}
      <main className="relative z-10 pt-28 pb-36 min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <>
            {/* Module badge */}
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 text-primary font-label-lg text-label-lg">
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
            <div className="w-32 h-32 rounded-full smokecraft-glass-panel flex items-center justify-center mb-8 border border-primary/30 shadow-[0_0_52px_rgba(233,193,118,0.16)]">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '56px', fontVariationSettings: "'FILL' 0, 'wght' 200" }}>
                construction
              </span>
            </div>

            <h2 className="smokecraft-premium-title mb-4 leading-tight">
              {stepLabel}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-12 leading-relaxed">
              {stitch
                ? 'This screen has been confirmed in the Stitch export and will be rebuilt in the next approved build batch.'
                : 'This screen does not yet exist in the Stitch export. It will be designed and built when the new screen brief is approved.'}
            </p>
        </>

        {/* Progress ribbon */}
        {stepNumber && (
          <SmokeCraftGlassPanel className="w-full max-w-md mb-12 p-5">
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
          </SmokeCraftGlassPanel>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          {prevRoute && (
            <SmokeCraftCtaButton variant="ghost" icon="" onClick={() => navigate(prevRoute)}>
              ← Back
            </SmokeCraftCtaButton>
          )}
          {nextRoute && (
            <SmokeCraftCtaButton onClick={() => navigate(nextRoute)}>
              Skip to Next
            </SmokeCraftCtaButton>
          )}
          <SmokeCraftCtaButton variant="ghost" icon="smoking_rooms" onClick={() => navigate('/smokecraft')}>
            SmokeCraft Home
          </SmokeCraftCtaButton>
        </div>
      </main>

      <SmokeCraftBottomNav active="smokecraft" />
    </div>
  )
}
