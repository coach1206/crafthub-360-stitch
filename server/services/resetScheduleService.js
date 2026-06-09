/**
 * Reset Schedule Service
 * Persists a cron-based "auto-reset" schedule to disk.
 * When enabled, fires the same resetAll logic used by the founder manual action.
 * Audit log entries are tagged source: 'scheduled'.
 */
import cron from 'node-cron'
import { loadJson, saveJson } from '../utils/persist.js'
import { resetXpCore, resetActivityCore, resetMembersCore } from '../controllers/rankingController.js'
import { resetConciergeCore, resetStampsCore } from '../controllers/travelController.js'
import { resetFeedCore } from '../controllers/tickerController.js'
import { resetBadgesCore } from '../controllers/badgeController.js'

const SCHEDULE_FILE = 'reset_schedule.json'

const DEFAULT_SCHEDULE = {
  enabled:           false,
  dayOfWeek:         5,
  hour:              18,
  minute:            0,
  lastScheduledRun:  null,
  updatedAt:         null,
  updatedBy:         null,
}

const SYSTEM_ACTOR = {
  id:          'system',
  role:        'system',
  email:       null,
  displayName: 'Scheduled Auto-Reset',
}

let _activeTask = null

/** Return the current persisted schedule config. */
export function getSchedule() {
  return { ...DEFAULT_SCHEDULE, ...loadJson(SCHEDULE_FILE, {}) }
}

/**
 * Persist a new schedule config and immediately apply it to the cron runner.
 * @param {object} config  — partial schedule fields to merge
 * @param {object} actor   — req.user of the founder who saved the schedule
 */
export function setSchedule(config, actor = {}) {
  const current = getSchedule()
  const updated = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.id || 'unknown',
  }
  saveJson(SCHEDULE_FILE, updated)
  _applySchedule(updated)
  return updated
}

/** Start the scheduler on server boot — reads the persisted config. */
export function initScheduler() {
  const schedule = getSchedule()
  _applySchedule(schedule)
  if (schedule.enabled) {
    console.log(
      `[resetScheduler] Auto-reset active: ` +
      `${_cronExpr(schedule)} (day ${schedule.dayOfWeek} at ${schedule.hour}:${String(schedule.minute).padStart(2,'0')})`
    )
  } else {
    console.log('[resetScheduler] Auto-reset is disabled — no schedule active.')
  }
}

// ── Internal helpers ───────────────────────────────────────────

function _cronExpr(s) {
  return `${s.minute} ${s.hour} * * ${s.dayOfWeek}`
}

function _applySchedule(schedule) {
  if (_activeTask) {
    _activeTask.stop()
    _activeTask = null
  }
  if (!schedule.enabled) return

  const expr = _cronExpr(schedule)
  if (!cron.validate(expr)) {
    console.error(`[resetScheduler] Invalid cron expression: "${expr}" — schedule not applied.`)
    return
  }

  _activeTask = cron.schedule(expr, () => {
    console.log(`[resetScheduler] Firing scheduled Reset All — ${new Date().toISOString()}`)
    _runScheduledReset()
  })
}

function _runScheduledReset() {
  const STORES = [
    { key: 'ranking-xp',       fn: () => resetXpCore(SYSTEM_ACTOR, 'scheduled') },
    { key: 'ranking-activity', fn: () => resetActivityCore(SYSTEM_ACTOR, 'scheduled') },
    { key: 'ranking-members',  fn: () => resetMembersCore(SYSTEM_ACTOR, 'scheduled') },
    { key: 'travel-concierge', fn: () => resetConciergeCore(SYSTEM_ACTOR, 'scheduled') },
    { key: 'travel-stamps',    fn: () => resetStampsCore(SYSTEM_ACTOR, 'scheduled') },
    { key: 'ticker-feed',      fn: () => resetFeedCore(SYSTEM_ACTOR, 'scheduled') },
    { key: 'badges',           fn: () => resetBadgesCore(SYSTEM_ACTOR, 'scheduled') },
  ]

  const results = []
  for (const store of STORES) {
    try {
      store.fn()
      results.push({ store: store.key, success: true })
    } catch (err) {
      results.push({ store: store.key, success: false, error: err.message })
      console.error(`[resetScheduler] Failed to reset ${store.key}:`, err.message)
    }
  }

  const succeeded = results.filter(r => r.success).length
  const failed    = results.length - succeeded
  console.log(`[resetScheduler] Scheduled reset complete — ${succeeded}/${results.length} succeeded${failed ? `, ${failed} failed` : ''}.`)

  const current = getSchedule()
  current.lastScheduledRun = new Date().toISOString()
  saveJson(SCHEDULE_FILE, current)
}
