import React, { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

export default function NCIEKnowledgePanel({ moduleId, domains = [], onTopicSelect }) {
  const [expandedDomain, setExpandedDomain] = useState(null)

  if (!domains.length) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
        <BookOpen className="mx-auto mb-2 text-zinc-600" size={20} />
        <p className="text-zinc-500 text-sm">Knowledge map loading…</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <BookOpen size={16} className="text-amber-400" />
        <span className="text-sm font-medium text-white">Knowledge Library</span>
        <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">preview</span>
      </div>

      <div className="divide-y divide-zinc-800">
        {domains.map(domain => (
          <div key={domain.domainId}>
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors"
              onClick={() => setExpandedDomain(expandedDomain === domain.domainId ? null : domain.domainId)}
            >
              <div>
                <p className="text-sm text-white font-medium">{domain.displayName}</p>
                <p className="text-xs text-zinc-500 capitalize">{domain.level}</p>
              </div>
              {expandedDomain === domain.domainId
                ? <ChevronUp size={14} className="text-zinc-400" />
                : <ChevronDown size={14} className="text-zinc-400" />
              }
            </button>

            {expandedDomain === domain.domainId && (
              <div className="bg-zinc-950/50 px-4 pb-3 space-y-1">
                {(domain.topics ?? []).map(topic => (
                  <button
                    key={topic.topicId}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-sm text-zinc-300 flex items-center justify-between"
                    onClick={() => onTopicSelect?.(topic)}
                  >
                    <span>{topic.displayName}</span>
                    <span className="text-xs text-zinc-600 capitalize">{topic.level}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
