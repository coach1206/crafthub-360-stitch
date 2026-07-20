import { getDb } from '../../db/connection.js'

/** Append-only Golden Box activity log (trigger-enforced, migration 077). */
export async function logActivity({ entryId, competitionId, actorId, action, metadata }) {
  const db = getDb()
  await db.query(
    `INSERT INTO golden_box_activity_log (entry_id, competition_id, actor_id, action, metadata)
     VALUES ($1,$2,$3,$4,$5)`,
    [entryId || null, competitionId || null, actorId || null, action, metadata ? JSON.stringify(metadata) : null]
  )
}
