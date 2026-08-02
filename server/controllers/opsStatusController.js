/**
 * Owner-Facing Operational Status View — Production Package 5
 *
 * GET /api/admin/ops-status — admin/founder only (see opsStatusRoutes.js).
 * Reports Green/Yellow/Red/Blue status (always with text, never color-only)
 * for application, database, object storage, Stripe/webhooks, background
 * jobs, media processing, inventory, Venue Humidor, Passport, Golden Box,
 * latest deployment, latest backup, latest restore test, and open
 * incidents (support cases with severity sev1/sev2 that are still open).
 *
 * Status values are derived from REAL local signals (DB reachability,
 * backup_run_log rows, support_cases rows) — never hardcoded to "green".
 * Where an external provider (Stripe dashboard, uptime monitor) cannot be
 * checked from this sandbox, status is explicitly "blue: not exercised"
 * rather than fabricated as green.
 */

import { isDbAvailable, query } from '../db/connection.js'

const STATUS = { GREEN: 'green', YELLOW: 'yellow', RED: 'red', BLUE: 'blue' }

function label(status, text) {
  return { status, label: `${status.toUpperCase()} — ${text}` }
}

async function safeQuery(sql, params = []) {
  try {
    const result = await query(sql, params)
    return { ok: true, rows: result.rows }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export async function getOpsStatus(_req, res) {
  const dbUp = isDbAvailable()
  const application = dbUp
    ? label(STATUS.GREEN, 'process running, DB reachable')
    : label(STATUS.RED, 'process running, DB unreachable — prototype fallback')

  const database = dbUp
    ? label(STATUS.GREEN, 'PostgreSQL connected')
    : label(STATUS.RED, 'no live PostgreSQL connection')

  // Object storage — code adapter exists (Package 4 R2/S3 adapter); no live
  // bucket credentials in this sandbox, so we report BLUE honestly.
  const objectStorage = label(STATUS.BLUE, 'adapter present, not exercised against a live bucket in this environment')

  // Stripe/webhooks — no live Stripe account/webhook delivery in sandbox.
  const stripeWebhooks = label(STATUS.BLUE, 'gateway code present (Package 2), no live Stripe account in this environment')

  let backgroundJobs = label(STATUS.BLUE, 'no job-run history available')
  let latestBackup = label(STATUS.BLUE, 'no backup run recorded yet')
  let latestRestoreTest = label(STATUS.BLUE, 'no restore test recorded yet')
  let inventory = label(STATUS.BLUE, 'unknown — DB unreachable')
  let venueHumidor = label(STATUS.BLUE, 'unknown — DB unreachable')
  let passport = label(STATUS.BLUE, 'unknown — DB unreachable')
  let goldenBox = label(STATUS.BLUE, 'unknown — DB unreachable')
  let openIncidents = []

  if (dbUp) {
    const backup = await safeQuery(
      `SELECT status, artifact_path, migration_version, finished_at
       FROM backup_run_log WHERE run_type = 'backup' ORDER BY finished_at DESC LIMIT 1`
    )
    if (backup.ok && backup.rows.length) {
      const b = backup.rows[0]
      latestBackup = b.status === 'success'
        ? label(STATUS.GREEN, `success at ${b.finished_at.toISOString?.() || b.finished_at}`)
        : label(STATUS.RED, `last backup FAILED at ${b.finished_at.toISOString?.() || b.finished_at}`)
    }

    const restore = await safeQuery(
      `SELECT status, finished_at FROM backup_run_log WHERE run_type = 'restore_test' ORDER BY finished_at DESC LIMIT 1`
    )
    if (restore.ok && restore.rows.length) {
      const r = restore.rows[0]
      latestRestoreTest = r.status === 'success'
        ? label(STATUS.GREEN, `verified at ${r.finished_at.toISOString?.() || r.finished_at}`)
        : label(STATUS.RED, `last restore verification FAILED at ${r.finished_at.toISOString?.() || r.finished_at}`)
    }

    const inv = await safeQuery(`SELECT count(*)::int AS n FROM inventory_events`)
    inventory = inv.ok ? label(STATUS.GREEN, `${inv.rows[0].n} ledger events, table reachable`) : label(STATUS.RED, inv.error)

    const vh = await safeQuery(`SELECT count(*)::int AS n FROM venue_cigar_payment_intents`)
    venueHumidor = vh.ok ? label(STATUS.GREEN, `Venue Humidor payment tables reachable (${vh.rows[0].n} intents)`) : label(STATUS.YELLOW, vh.error)

    const pp = await safeQuery(`SELECT count(*)::int AS n FROM passport_records`)
    passport = pp.ok ? label(STATUS.GREEN, `passport_records reachable (${pp.rows[0].n} rows)`) : label(STATUS.YELLOW, pp.error)

    const gb = await safeQuery(`SELECT count(*)::int AS n FROM golden_box_entries`)
    goldenBox = gb.ok ? label(STATUS.GREEN, `golden_box_entries reachable (${gb.rows[0].n} rows)`) : label(STATUS.YELLOW, gb.error)

    const jobs = await safeQuery(
      `SELECT status, finished_at FROM backup_run_log ORDER BY finished_at DESC LIMIT 1`
    )
    backgroundJobs = jobs.ok && jobs.rows.length
      ? label(STATUS.GREEN, 'scheduled job history table reachable')
      : label(STATUS.BLUE, 'no job-run history available')

    const incidents = await safeQuery(
      `SELECT id, case_number, severity, status, category, created_at
       FROM support_cases WHERE status NOT IN ('resolved','closed') AND severity IN ('sev1','sev2')
       ORDER BY created_at DESC LIMIT 25`
    )
    openIncidents = incidents.ok ? incidents.rows : []
  }

  const mediaProcessing = label(STATUS.BLUE, 'Sharp pipeline present (Package 4); no live processing queue depth in this environment')
  const latestDeployment = label(STATUS.BLUE, 'see /api/version for build-manifest identity')

  res.json({
    success: true,
    generatedAt: new Date().toISOString(),
    components: {
      application, database, objectStorage, stripeWebhooks, backgroundJobs,
      mediaProcessing, inventory, venueHumidor, passport, goldenBox,
      latestDeployment, latestBackup, latestRestoreTest,
    },
    openIncidents,
    legend: 'GREEN=healthy, YELLOW=degraded, RED=failing, BLUE=not exercised/no signal available — never color-only, always paired with text',
  })
}

export default { getOpsStatus }
