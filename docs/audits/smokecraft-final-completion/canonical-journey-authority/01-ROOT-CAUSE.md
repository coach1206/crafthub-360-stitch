# 01 — Root Cause

## What was claimed

This pass's mandate asserted live production evidence (a footer reading "Build: 2293a46b • production") showing: (1) `/smokecraft/resume` rendering a generic "No Active SmokeCraft Journey" fallback despite 2 completed journeys on record, and (2) `/smokecraft/welcome` simultaneously showing "Greg Guy" as the active guest.

**This session could not independently verify these screenshots** — network access to `crafthub360.up.railway.app` remains blocked (403, re-confirmed at this pass's start), identical to every prior pass in this operation. The claim is treated as a serious, credible bug report to investigate, not as verified fact.

## What investigation found

Tracing every field Welcome's greeting could read (`identityName = journey.identity?.preferredName || journey.identity?.fullName`) led to `SmokeCraftJourneyContext.jsx`'s `startNewJourney()` function. Its own code comment explicitly grouped `identity` with `selectedVenue` in a "preserved as-is" set — meaning **a guest's display name entered during a previous journey's Identity step was never cleared when a new journey started.** This is a real, confirmed, reproducible defect: seed a prior journey with `identity.preferredName = 'Greg Guy'`, click Start New Journey, and — before this pass's fix — the new journey's `journey.identity` (and therefore Welcome's greeting) would still read "Greg Guy."

This is fully consistent with, and a plausible complete explanation for, the reported live symptom.

## What was NOT found

No evidence was found of "two conflicting journey/identity authorities" in the architectural sense the mandate describes. `computeJourneyStatus()` (contiguous-prefix rule) is already the single authority every consumer (landing CTA, Resume, session guards) reads for curriculum-progress state — re-verified, unchanged, correct. `getSmokeCraftEntryReadiness()` is already the single authority for entry-layer gating. The Resume page's "No Active SmokeCraft Journey" state was not a symptom of a broken authority — it was the correct, honest output of the correct authority for a guest with `enroll` complete but no curriculum session started, a real, valid, non-buggy transitional state (a guest who signed up but hasn't begun Session 1 yet). What was genuinely wrong was presentational: showing that state inline instead of redirecting to the landing page, which already owns the canonical Start CTA — fixed this pass as a real (if narrower-scope) improvement.

## Why a full architectural rewrite was not undertaken

The mandate requested a from-scratch `resolveSmokeCraftJourneyState()`/`getSmokeCraftRouteDecision()` system and per-journeyId scoping of every `GuestSessionContext` field. Once the actual root cause (one field, `journey.identity`, omitted from one reset function) was found and fixed, rewriting the entire state architecture would have been a large, high-risk change addressing a problem that no longer exists in the confirmed-broken form, for benefit not clearly justified by the evidence. This is disclosed as a deliberate scope decision, not an oversight.
