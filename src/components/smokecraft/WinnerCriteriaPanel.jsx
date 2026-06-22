import { CrownIcon } from './PremiumIcons.jsx'
import WinnerCategoryCard from './WinnerCategoryCard.jsx'
import { calculateWinnerEligibility, getTopEligibleCategory, getWinnerProgress } from '../../services/smokecraft/smokeWinnerService.js'

export default function WinnerCriteriaPanel({ session }) {
  const categories = calculateWinnerEligibility(session)
  const top = getTopEligibleCategory(session)
  const progress = getWinnerProgress(session)

  return (
    <section
      className="rounded-2xl border mb-10"
      style={{ padding: '20px 24px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', borderColor: 'rgba(233,193,118,0.35)' }}
      aria-label="Winner Category Eligibility"
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, background: 'rgba(233,193,118,0.15)', color: '#e9c176' }}>
            <CrownIcon size={20} />
          </span>
          <div>
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em]">Winner Category Eligibility</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {progress.earnedCount} earned · {progress.eligibleCount} eligible · {progress.pendingCount} pending · {progress.lockedCount} locked
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary/70 mb-1">Top Standing</p>
          <p className="font-label-md text-label-md font-semibold" style={{ color: top ? '#e9c176' : '#6b6b6b' }}>
            {top ? top.title : 'No category eligible yet'}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {categories.map(c => <WinnerCategoryCard key={c.id} category={c} />)}
      </div>
    </section>
  )
}
