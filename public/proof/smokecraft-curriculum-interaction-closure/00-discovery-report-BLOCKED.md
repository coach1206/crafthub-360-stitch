# Discovery Report — Curriculum Quiz and Required-Interaction Coverage Closure

Starting commit: `7f474d55` (verified clean baseline).

## What this package's mandate assumes

The mandate states verified current coverage is **"18 of 21 required
interactions complete"** and asks this pass to identify and close the
**remaining 3 specific missing interactions**, citing "the canonical
required-interaction manifest" as the authority.

## What was actually found

1. **No structured "required-interaction manifest" exists anywhere in
   this codebase.** Searched `src/constants/smokecraftScreenManifest.js`,
   `src/constants/session.js`, all of `docs/smokecraft/`, all of
   `scripts/`, and all of `src/`/`server/` for any data structure
   flagging sessions as "required interaction: yes/no" or "quiz:
   yes/no" — zero matches beyond one unrelated code comment. There is
   no machine-readable list of "the 21 required interactions" or "the
   3 missing ones" to consult.

2. **The only source discussing this topic at all** is
   `docs/smokecraft/SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md`
   (built and re-confirmed current in the prior Post–Venue Humidor
   Audit pass, commit `773d0bea`). Its own literal conclusion is:

   > "'Quiz or required interaction' per session was verified via
   > keyword scan for only **3 of 21** session slots (Session 15
   > Knowledge Drop, Session 25/26 Rewards, Session 27 Session
   > Complete). The other 18 do not use quiz-related wording in a
   > keyword scan. This does **not** necessarily mean they lack a real
   > interaction... but it also has not been confirmed that a required
   > interaction exists in each. **This is the single most significant
   > open gap in this audit** and should be the starting point for the
   > next educational-content review pass."

   This says **3 of 21 were CONFIRMED present**, and **18 of 21 are
   UNCONFIRMED either way** — not "18 complete, 3 missing." The
   mandate's premise inverts this finding's actual shape.

3. **Separately, that same audit's own per-session table already marks
   a real "Learner interaction present" as P (confirmed present) for
   nearly every one of the 21 sessions** — pickers, sliders, rating
   controls, Save Draft flows, flavor-wheel selections, etc. (e.g.
   Session 2: "temp/humidity/seal/airflow controls, cigar picker";
   Session 8: "rating controls, Save Draft"; Session 19: "required
   multi-category rating"). So real, server-adjacent interactions
   already exist on most sessions — what was never confirmed is
   specifically whether each one is **scored, gates progression, and
   is "required"** in the strict sense this package's mandate uses, as
   opposed to being present-but-optional/exploratory content.

## Why this blocks proceeding safely

This package's own stop conditions (§22) explicitly require stopping,
not improvising, when:

- **"The exact 3 missing interactions cannot be identified"** — true
  here: the canonical audit does not identify which 3 (or whether it
  is even 3) sessions lack a required interaction. It identifies the
  opposite quantity (3 confirmed present) and explicitly leaves the
  remaining 18 as an open, undifferentiated gap.
- **"Canonical curriculum sources conflict"** — true here: the
  mandate's stated "18 of 21 complete" premise conflicts with the
  existing canonical audit's own literal conclusion ("only 3 of 21
  confirmed").
- Mandate §3 itself: **"Do not guess which 3 interactions are missing.
  Stop and report if the canonical audit and repository disagree."**

Guessing 3 sessions to "fix" in order to force a 21/21 validator result
would mean either (a) fabricating scoring/completion logic for
sessions that may already have real, working, required interactions
under different terminology than "quiz," producing duplicate/competing
logic and violating this same package's §2 "no duplicate interaction
satisfies two required contracts falsely," or (b) leaving genuinely
under-verified sessions unexamined while claiming false certainty. Both
outcomes would be a fabricated closure, which this operation's
standing rules and this package's own §22 explicitly forbid.

## What would resolve this safely

A dedicated, narrowly-scoped **discovery-only** pass — not a build
pass — that:

1. Defines, as a single new canonical source of truth (e.g. a real
   `REQUIRED_INTERACTIONS` manifest keyed by session number), exactly
   which of the 21 primary sessions are intended to have a scored,
   progression-gating interaction, per an actual product decision
   (this does not currently exist anywhere and cannot be inferred
   safely from the codebase alone).
2. Re-audits all 18 unconfirmed sessions' real rendered interactions
   (opening every collapsible sub-panel, not just top-level content,
   per that audit's own disclosed scope boundary) against that
   definition.
3. Produces a precise, evidence-based list of exactly which sessions
   (if any) are missing a required interaction relative to that
   definition — which may be 0, 3, or some other number; it should not
   be assumed to be 3 in advance.

Only after that discovery output exists can a build package like this
one safely implement and close a specific, named gap.

## Repository state

No code was changed this pass. Only this discovery report was added
under `public/proof/smokecraft-curriculum-interaction-closure/`.
