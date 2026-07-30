import { useState } from 'react'

// No dedicated staff-venue React context exists in this app (staff
// screens like VenueManagementCommandHub take venueId as a plain
// controlled input) — this hook follows that same convention rather
// than inventing a new context. Persisted to localStorage only for
// staff convenience across admin screens in the same browser; never
// trusted as an authorization boundary (the server independently
// re-validates real venue membership on every request).
const KEY = 'sc_admin_venue_id'

export function useAdminVenueId() {
  const [venueId, setVenueIdState] = useState(() => {
    try { return localStorage.getItem(KEY) || '' } catch { return '' }
  })
  function setVenueId(id) {
    setVenueIdState(id)
    try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
  }
  return [venueId, setVenueId]
}
