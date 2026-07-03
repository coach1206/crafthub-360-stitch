/**
 * SmokeCraftPassportRewardPanel
 * Shows passport stamp eligibility, awarded/blocked status, and all requirements.
 * Never shows early unlock as available.
 */

const BLOCKED_LABELS = {
  scorecard_missing:               'Scorecard not yet submitted',
  flavor_memory_missing:           'Flavor Memory not yet completed',
  visit_not_complete:              'Current visit not yet complete',
  session_not_complete:            'Current session not yet complete',
  management_sync_required:        'Management Sync step required',
  visit_8_locked:                  'Visit 8 is protected',
  connections_locked:              'Connections unlock requires Passport Stamp',
  one_session_shortcut_blocked:    'Cannot complete in a single session',
  early_passport_stamp:            'Passport Stamp cannot unlock early',
  early_connections_unlock:        'Connections cannot unlock early',
  incomplete_required_steps:       'Required journey steps are incomplete',
  already_awarded:                 'Passport Stamp already awarded for this visit',
}

function RequirementRow({ label, met, value }) {
  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-medium ${met ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        {value ?? (met ? 'met' : 'missing')}
      </span>
    </div>
  )
}

export default function SmokeCraftPassportRewardPanel({ eligibility, passportStampRecord }) {
  if (!eligibility && !passportStampRecord) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Passport stamp eligibility not yet evaluated.
      </div>
    )
  }

  const awarded = passportStampRecord?.passportStampAwarded === true
  const eligible = eligibility?.eligible === true
  const blockedReasons = eligibility?.blockedReasons ?? []
  const visitNumber = eligibility?.visitNumber ?? passportStampRecord?.visitId ?? null

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Passport Stamp</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          awarded
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : eligible
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        }`}>
          {awarded ? 'Awarded' : eligible ? 'Eligible' : 'Blocked'}
        </span>
      </div>

      <div className="space-y-1">
        <RequirementRow label="Scorecard" met={eligibility?.scorecardPresent} />
        <RequirementRow label="Flavor Memory" met={eligibility?.flavorMemoryPresent} />
        <RequirementRow label="Session Complete" met={(eligibility?.sessionsCompletedInVisit ?? 0) >= 1} value={`${eligibility?.sessionsCompletedInVisit ?? 0} session(s)`} />
        {visitNumber && (
          <RequirementRow label="Visit" met={visitNumber !== 8} value={`Visit ${visitNumber}${visitNumber === 8 ? ' (protected)' : ''}`} />
        )}
      </div>

      {blockedReasons.length > 0 && (
        <div className="space-y-1">
          {blockedReasons.map(r => (
            <div key={r} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
              {BLOCKED_LABELS[r] ?? r}
            </div>
          ))}
        </div>
      )}

      {awarded && (
        <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded p-2 font-medium">
          Passport Stamp earned. +200 XP awarded.
        </div>
      )}

      {!awarded && !eligible && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          Passport Stamp cannot unlock early. Complete all required journey steps first.
        </div>
      )}
    </div>
  )
}
