import React from 'react'
import { Award, Star, TrendingUp } from 'lucide-react'

function XPBar({ current, next, level }) {
  const maxXP    = next ? next.minXP : current + 1000
  const progress = Math.min(100, Math.round(((current - (level?.minXP ?? 0)) / (maxXP - (level?.minXP ?? 0))) * 100))

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-500 capitalize">{level?.level?.replace(/_/g, ' ')}</span>
        <span className="text-xs text-zinc-500">{current} XP</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default function NCIEPassportProgress({ profile, moduleId }) {
  if (!profile) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
        <Award className="mx-auto mb-2 text-zinc-600" size={20} />
        <p className="text-zinc-500 text-sm">Passport progress loading…</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Award size={16} className="text-amber-400" />
        <span className="text-sm font-medium text-white">Craft Passport</span>
        <span className="ml-auto text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">preview</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <Star size={20} className="text-white" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white capitalize">
              {profile.craftLevel?.replace(/_/g, ' ') ?? 'Apprentice'}
            </p>
            <p className="text-xs text-zinc-500">
              {profile.moduleId?.charAt(0).toUpperCase() + profile.moduleId?.slice(1)} · {profile.craftXP ?? 0} XP
            </p>
          </div>
        </div>

        <XPBar
          current={profile.craftXP ?? 0}
          level={profile.craftLevelThreshold}
          next={null}
        />

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-amber-400">{profile.masteryPercent ?? 0}%</p>
            <p className="text-xs text-zinc-500">Mastery</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-white">{profile.completedTopics ?? 0}</p>
            <p className="text-xs text-zinc-500">Topics</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-white">{profile.visitCount ?? 0}</p>
            <p className="text-xs text-zinc-500">Visits</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp size={12} className="text-zinc-500" />
          <p className="text-xs text-zinc-500">
            Global level: <span className="text-zinc-300 capitalize">{profile.globalLevel?.replace(/_/g, ' ')}</span>
            {' · '}{profile.globalXP ?? 0} global XP
          </p>
        </div>

        <p className="text-xs text-zinc-600">{profile.passportNote}</p>
      </div>
    </div>
  )
}
