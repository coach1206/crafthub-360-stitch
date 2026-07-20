/**
 * Package 1 — normalized XP foundation (Decision 5). Append-only
 * transactions are the only source of truth; xp_accounts.balance is a
 * maintained cache updated only inside the same transaction as the
 * insert. Existing flat-JSON XP (server/data/persisted/ranking_xp.json)
 * is left untouched — not deleted, not read by this service — per the
 * mandate's "may remain temporarily as compatibility data" instruction.
 */
import { getDb } from '../../db/connection.js'

export class XpError extends Error {
  constructor(code) { super(code); this.code = code }
}

async function getOrCreateAccount(client, { userId, guestReference }) {
  const lookupCol = userId ? 'user_id' : 'guest_reference'
  const lookupVal = userId || guestReference
  const { rows } = await client.query(
    `SELECT * FROM xp_accounts WHERE ${lookupCol} = $1`, [lookupVal]
  )
  if (rows[0]) return rows[0]
  const { rows: created } = await client.query(
    `INSERT INTO xp_accounts (user_id, guest_reference) VALUES ($1, $2) RETURNING *`,
    [userId || null, guestReference || null]
  )
  return created[0]
}

/**
 * Awards (or reverses, via negative amount) XP idempotently.
 * idempotencyKey must be unique per qualifying action — a duplicate call
 * with the same key is a no-op (returns the existing transaction),
 * satisfying "prevent duplicate awards for the same qualifying action."
 */
export async function awardXp({ userId, guestReference, amount, sourceType, sourceId, reason, awardRuleKey, idempotencyKey, venueId, administratorId, reversalOf }) {
  if (!userId && !guestReference) throw new XpError('identity_required')
  if (!idempotencyKey) throw new XpError('idempotency_key_required')
  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: existing } = await client.query(
      `SELECT * FROM xp_transactions WHERE idempotency_key = $1`, [idempotencyKey]
    )
    if (existing[0]) {
      await client.query('ROLLBACK')
      return { transaction: existing[0], deduplicated: true }
    }
    const account = await getOrCreateAccount(client, { userId, guestReference })
    const { rows: txRows } = await client.query(
      `INSERT INTO xp_transactions
         (xp_account_id, amount, source_type, source_id, reason, award_rule_key, idempotency_key, venue_id, administrator_id, reversal_of)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [account.id, amount, sourceType, sourceId || null, reason, awardRuleKey || null, idempotencyKey, venueId || null, administratorId || null, reversalOf || null]
    )
    const newBalance = account.balance + amount
    if (newBalance < 0) { await client.query('ROLLBACK'); throw new XpError('insufficient_balance') }
    await client.query(`UPDATE xp_accounts SET balance = $2, updated_at = now() WHERE id = $1`, [account.id, newBalance])
    await client.query('COMMIT')
    return { transaction: txRows[0], deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function reverseXpTransaction(transactionId, administratorId, reason) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM xp_transactions WHERE id = $1`, [transactionId])
  const original = rows[0]
  if (!original) throw new XpError('transaction_not_found')
  return awardXp({
    userId: null, guestReference: null, // resolved below via account lookup
    amount: -original.amount,
    sourceType: 'reversal',
    sourceId: String(original.id),
    reason: reason || `Reversal of transaction ${original.id}`,
    idempotencyKey: `reversal:${original.id}`,
    administratorId,
    reversalOf: original.id,
    ...(await resolveIdentityForAccount(original.xp_account_id)),
  })
}

async function resolveIdentityForAccount(accountId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT user_id, guest_reference FROM xp_accounts WHERE id = $1`, [accountId])
  return { userId: rows[0]?.user_id, guestReference: rows[0]?.guest_reference }
}

export async function getXpBalance({ userId, guestReference }) {
  const db = getDb()
  const lookupCol = userId ? 'user_id' : 'guest_reference'
  const lookupVal = userId || guestReference
  const { rows } = await db.query(`SELECT balance FROM xp_accounts WHERE ${lookupCol} = $1`, [lookupVal])
  return rows[0]?.balance ?? 0
}

export async function getXpHistory({ userId, guestReference }) {
  const db = getDb()
  const lookupCol = userId ? 'user_id' : 'guest_reference'
  const lookupVal = userId || guestReference
  const { rows } = await db.query(
    `SELECT t.* FROM xp_transactions t
     JOIN xp_accounts a ON a.id = t.xp_account_id
     WHERE a.${lookupCol} = $1 ORDER BY t.created_at DESC`,
    [lookupVal]
  )
  return rows
}
