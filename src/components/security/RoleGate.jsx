/**
 * Role Gate — conditionally renders children based on role or permission.
 * Does NOT navigate — simply shows/hides content in-place.
 *
 * Props:
 *   allowedRoles       — string[] — render if role is in this list
 *   requiredPermission — string  — render if role holds this permission
 *   minRole            — string  — render if role meets or exceeds this level
 *   children           — shown when access is granted
 *   fallback           — shown when access is denied (default: null)
 *
 * Founder Level 0 always renders children.
 */

import { useSecurity } from '../../context/SecurityContext.jsx'
import { meetsMinRole } from '../../config/roleMap.js'

export default function RoleGate({
  allowedRoles       = [],
  requiredPermission = null,
  minRole            = null,
  children,
  fallback           = null,
}) {
  const { role, hasPermission, isFounder } = useSecurity()

  if (isFounder()) return children

  let allowed = false

  if (minRole) {
    allowed = meetsMinRole(role, minRole)
  } else if (allowedRoles.length > 0) {
    allowed = allowedRoles.includes(role)
  } else if (requiredPermission) {
    allowed = hasPermission(requiredPermission)
  } else {
    allowed = true
  }

  return allowed ? children : fallback
}
