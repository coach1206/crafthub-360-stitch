/**
 * Package 1 — central, server-side recipe-privacy/visibility policy
 * (Step 5, Decision 4). Nothing relies on frontend hiding. Default:
 * private to entrant, assigned judges, and administrators until judging
 * closes; public only after competition completion if explicitly opened.
 */
import { getDb } from '../../db/connection.js'

export class VisibilityError extends Error {
  constructor(code) { super(code); this.code = code }
}

/**
 * Resolves the caller's viewer role for a specific entry — never trusts
 * a client-asserted role.
 */
export async function resolveViewerRole(entry, competition, identity) {
  const db = getDb()
  if (identity.platformAdmin) return 'platform_administrator'
  // Guard against null === null: two different guests both have
  // user_id === null, which must never be treated as a match.
  const ownsAsUser = !!identity.userId && identity.userId === entry.user_id
  const ownsAsGuest = !!identity.guestReference && identity.guestReference === entry.guest_reference
  if (ownsAsUser || ownsAsGuest) return 'entrant'

  if (identity.userId) {
    const { rows: judgeRows } = await db.query(
      `SELECT 1 FROM golden_box_judge_assignments ja
       JOIN golden_box_judges j ON j.id = ja.judge_id
       WHERE ja.entry_id = $1 AND j.user_id = $2`,
      [entry.entry_id, identity.userId]
    )
    if (judgeRows.length > 0) return 'assigned_judge'

    if (competition.scope === 'venue' && competition.scope_venue_id) {
      const { rows: membershipRows } = await db.query(
        `SELECT membership_type FROM venue_memberships
         WHERE user_id = $1 AND venue_id = $2 AND status = 'active'`,
        [identity.userId, competition.scope_venue_id]
      )
      const membership = membershipRows[0]
      if (membership && ['manager', 'admin', 'owner'].includes(membership.membership_type)) {
        return 'venue_administrator'
      }
    }
  }
  return 'public'
}

/**
 * Default visibility matrix — used when no explicit
 * golden_box_visibility_rules row overrides it. Judging-closed states:
 * results_pending, completed, archived.
 */
function defaultVisibility(role, competitionStatus) {
  const judgingClosed = ['results_pending', 'completed', 'archived'].includes(competitionStatus)
  const alwaysCanViewRecipe = new Set(['entrant', 'assigned_judge', 'competition_administrator', 'platform_administrator'])
  const canViewAfterClose = new Set(['mentor', 'venue_administrator', 'authorized_viewer'])

  const canViewRecipe = alwaysCanViewRecipe.has(role) || (judgingClosed && canViewAfterClose.has(role))
  const canViewScores = alwaysCanViewRecipe.has(role) || (judgingClosed && (canViewAfterClose.has(role) || role === 'public'))
  const canViewPersonalInfo = !['public', 'authorized_viewer'].includes(role) || (judgingClosed && role !== 'public')

  return { canViewRecipe, canViewScores, canViewPersonalInfo }
}

export async function getVisibility(entry, competition, identity) {
  const db = getDb()
  const role = await resolveViewerRole(entry, competition, identity)
  const { rows } = await db.query(
    `SELECT * FROM golden_box_visibility_rules WHERE entry_id = $1 AND viewer_role = $2`,
    [entry.entry_id, role]
  )
  if (rows[0]) {
    return {
      role,
      canViewRecipe: rows[0].can_view_recipe,
      canViewScores: rows[0].can_view_scores,
      canViewPersonalInfo: rows[0].can_view_personal_info,
    }
  }
  return { role, ...defaultVisibility(role, competition.status) }
}

export async function requireRecipeAccess(entry, competition, identity) {
  const visibility = await getVisibility(entry, competition, identity)
  if (!visibility.canViewRecipe) throw new VisibilityError('recipe_private')
  return visibility
}
