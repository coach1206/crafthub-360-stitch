export default function ReceivingPersistenceNotice({ databaseAvailable = false }) {
  return (
    <div className={`rounded border p-2 text-xs ${databaseAvailable ? 'border-green-200 bg-green-50 text-green-800' : 'border-orange-200 bg-orange-50 text-orange-800'}`}>
      {databaseAvailable ? (
        <p><strong>receiving_persisted</strong> — Confirmed receiving adjusts inventory via the database.</p>
      ) : (
        <>
          <p><strong>receiving_preview_only</strong></p>
          <p className="mt-0.5">inventory_not_persisted · adjusted_in_memory_only · database_required</p>
        </>
      )}
    </div>
  )
}
