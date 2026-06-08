/**
 * Permission Gate — renders children only if the current role holds
 * the specified permission key. Simpler than RoleGate for single-key checks.
 *
 * Props:
 *   permission — string — e.g. 'access_eat_command'
 *   children   — shown when permission is granted
 *   fallback   — shown when permission is denied (default: null)
 *
 * Founder Level 0 always renders children.
 */

import { useSecurity } from '../../context/SecurityContext.jsx'

export default function PermissionGate({ permission, children, fallback = null }) {
  const { hasPermission, isFounder } = useSecurity()
  return (isFounder() || hasPermission(permission)) ? children : fallback
}
