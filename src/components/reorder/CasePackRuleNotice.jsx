export default function CasePackRuleNotice({ casePackQuantity = 1, recommendedQuantity = 0 }) {
  if (casePackQuantity <= 1) return null
  const cases = Math.ceil(recommendedQuantity / casePackQuantity)
  const actual = cases * casePackQuantity
  return (
    <div className="rounded border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-700 p-2 text-xs text-blue-800 dark:text-blue-200">
      Case pack: {casePackQuantity} units/case · {cases} case{cases !== 1 ? 's' : ''} = {actual} units
    </div>
  )
}
