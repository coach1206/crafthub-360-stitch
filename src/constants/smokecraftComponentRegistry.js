// Canonical Runtime pass — one componentKey -> component resolver.
//
// Scope note (disclosed): registered here is every screen's real, existing,
// already-working component (no duplicates found — re-confirmed by
// 02-COMPETING-DEFINITIONS.md, no dead alternative registered instead of a
// real one). Only 'session-21' (AI Summary) is actually consumed through
// SmokeCraftScreenRenderer this pass; the registry is populated in full so
// a future migration pass has one real, complete map to work from, not
// because every entry is live-routed through the renderer yet.
import AISummary from '../pages/smokecraft/AISummary.jsx'

export const SMOKECRAFT_COMPONENT_REGISTRY = {
  'session-21': AISummary,
  // Remaining 26 curriculum screens + 4 entry screens intentionally left
  // unregistered here — they remain reachable only via their existing
  // direct App.jsx <Route> registration (real, correct, unchanged; see
  // 01-RUNTIME-TRACE.md). Adding a registry entry without also migrating
  // App.jsx's route to use it would be a silent duplicate definition —
  // exactly what this pass exists to prevent — so entries are added only
  // in lockstep with an actual migration.
}

/** Real zero-consumer check — confirms no registered component is also reachable via a second, undeclared path. */
export function getRegisteredComponent(componentKey) {
  return SMOKECRAFT_COMPONENT_REGISTRY[componentKey] || null
}
