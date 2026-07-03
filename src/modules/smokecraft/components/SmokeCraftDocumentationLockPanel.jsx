/**
 * SmokeCraftDocumentationLockPanel
 * Shows required docs, presence status, and documentation lock for RC.
 */

function DocRow({ doc }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <span className="font-mono text-gray-600 dark:text-gray-400 text-xs truncate flex-1 min-w-0">{doc.path}</span>
      <span className={doc.present ? 'text-green-600 dark:text-green-400 flex-shrink-0' : 'text-red-500 dark:text-red-400 flex-shrink-0'}>
        {doc.present ? 'present' : 'missing'}
      </span>
    </div>
  )
}

export default function SmokeCraftDocumentationLockPanel({ docLock }) {
  if (!docLock) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Documentation lock status not available.
      </div>
    )
  }

  const docs = docLock.requiredDocs ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Documentation Lock</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          docLock.lockedForRc
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        }`}>
          {docLock.documentationStatus}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{docLock.totalPresent} / {docLock.totalRequired} docs present</span>
        {docLock.lockedForRc && <span className="text-green-600 dark:text-green-400">Locked for RC</span>}
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        {docs.map((doc, i) => <DocRow key={i} doc={doc} />)}
      </div>

      {docLock.missingDocs?.length > 0 && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
          Missing {docLock.missingDocs.length} required doc(s). Documentation is not locked for RC until all docs are present.
        </div>
      )}

      {docLock.lockedForRc && (
        <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded p-2">
          All required documentation is present. Documentation is locked for internal RC review.
        </div>
      )}
    </div>
  )
}
