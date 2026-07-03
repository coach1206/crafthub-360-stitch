const MODULE_BUILD_SEQUENCE = [
  { step: 1, name: 'Post-Phase Final Audit Review' },
  { step: 2, name: 'Module Build 1 — NOVEE OS Module Packaging Foundation' },
  { step: 3, name: 'Module Build 2 — SmokeCraft Experience Module' },
  { step: 4, name: 'Module Build 3 — POS360 Module' },
  { step: 5, name: 'Module Build 4 — E.A.T. Command Hub Module' },
  { step: 6, name: 'Module Build 5 — Inventory Availability Module / ISPAE' },
  { step: 7, name: 'Module Build 6 — Reorder Connector Add-On Module / DMRC' },
  { step: 8, name: 'Module Build 7 — Live Operations Command Center Module / LOCC' },
  { step: 9, name: 'Module Build 8 — External Operations Connector Gateway Module / EOCG' },
  { step: 10, name: 'Module Build 9 — White-Label Marketplace Licensing Module' },
]

export default function PostPhaseModulePlanPanel({ sequence = MODULE_BUILD_SEQUENCE }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Post-Phase Module Build Series</p>
      <p className="text-[10px] text-orange-400 italic">These are post-phase module builds — not Phase 20.</p>
      <div className="text-[10px] space-y-0.5 text-gray-500">
        {sequence.map(s => (
          <p key={s.step} className="flex gap-1.5">
            <span className="text-gray-400 w-4 shrink-0">{s.step}.</span>
            <span>{s.name}</span>
          </p>
        ))}
      </div>
    </div>
  )
}
