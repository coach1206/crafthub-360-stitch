# SmokeCraft 360 — Orphan / Secondary Route Audit

Evidence-based investigation of every route reachable outside the 27-session canonical spine and its recovered opening chain (Golden Box Rules → Mentor Selection → Seed & Soil). Each item below is traced via `git log`/`git show` and live `grep` of current routing code — not asserted from memory.

## Second Humidor Match / SmokeCraft Challenge / Mini Tasting Round

**What they are**: three small stub screens (~37–84 lines each, one background image + a single real Continue button) forming a self-contained side chain:
`SmokeCraftChallenge.jsx → SecondHumidorMatch.jsx → MiniTastingRound.jsx → /smokecraft/visit-complete`.

**When created**: commit `145011e8`, "Convert SmokeCraft to an 8-visit/24-session gated journey" — the pre-27-session era. In that architecture they were numbered S17/S18/S19.

**Whether intended to be canonical**: yes, under the *old*, superseded 24-session numbering. The current, live, locked 27-session `VISIT_STRUCTURE` (`src/constants/session.js`) does not include them in the numbered spine — they were re-registered afterward as `SUPPORTING_MODULES` (`requires: 'scorecard'`), i.e. deliberately demoted to optional side content, not deleted.

**Whether another screen replaced them**: yes. The current S16–S20 spine content (Flavor Finish/Strength Progression/Overall Experience Notes via `FinalThird.jsx`, Rate Every Category/Personal Notes via `Scorecard.jsx`) supersedes what S16–S19 covered under the old numbering.

**Whether they contain unique gameplay/content**: no. Each is a single background image plus one full-width Continue button and an `awardSessionRewards()` call — no selection, no form, no unique mechanic distinguishable from any other stub screen of the same era.

**Reachability today**: confirmed live and reachable, but *only* from `EventChallenge.jsx` and `SmokeCraftCraftHub.jsx` — both themselves outside the 27-session spine (unguarded/supplemental hub screens) — never from any Continue button inside the canonical spine. A player completing the real 27-session journey (proven by the fresh-player suite, 62/62, and the real-click walkthrough) never passes through this chain.

**Should they be in the 27-session journey**: no — the locked `VISIT_STRUCTURE`/`TOTAL_SESSIONS=27` is the confirmed-correct current design (re-verified, not reopened, by this pass); inserting them would require renumbering the entire spine, which the earlier Authoritative Route Graph pass explicitly assessed and rejected as disproportionate for far smaller defects than this.

**Should they be retired**: recommended, not executed this pass. They are reachable, real, harmless bonus/legacy content with an intact self-contained chain and no dangling links — removing them is a deliberate content decision (not a defect fix) and out of scope for a "repair the canonical journey" mandate. Flagged here so the owner can make that call explicitly rather than discovering it unexplained.

**Final status: LEGACY_UNUSED.** Not canonical, not merged (nothing in them warrants merging — no unique content), not retired (still linked, still functional, not deleted this pass).

## `mini-tasting-module` vs `mini-tasting`

Two distinct components for a similar concept, already flagged in `docs/SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md` §Conflicts (prior pass) — `MiniTasting.jsx` (`/smokecraft/mini-tasting-module`, standalone Package Q module, unguarded) vs `MiniTastingRound.jsx` (`/smokecraft/mini-tasting`, the spine-adjacent stub above). Not merged — re-confirmed out of scope, same rationale as above (a content-consolidation decision, not a canonical-journey defect).

## Wrapper / Strength Education (`/smokecraft/wrapper-strength`)

Renders null — pure redirect stub. `SC_ASSETS.wrapperStrength` intentionally absent (S6/Format's real content already covers construction/wrapper inspection). **Final status: LEGACY_UNUSED** — a placeholder route kept for URL-compatibility, no content to recover.

## Connections (`/smokecraft/connections`)

Real, live, reachable from Passport Stamp (`requires: 'passport-stamp'`). Uses a private `localStorage` key instead of the canonical journey context (flagged in the original Master Audit, not re-litigated here — a persistence-hygiene issue, not a routing/sequence defect). **Final status: CANONICAL** (supporting module, correctly gated, correctly reachable) with a known, previously-disclosed persistence-hygiene defect out of this pass's scope.

## Everything else outside the spine

`Origins`, `Leaves`, `LeafChallenge*`, `Cultivation`, `Blend`, `FlavorDNA`, `Pairing`, `PairingMastery`, `Vitola`, `HowItWorks`, admin/QA/diagnostic pages, commerce/checkout/cart pages: all confirmed via the static-gameplay detector (85/85 pass, zero image-drives-completion defects) and via `git grep` to be either informational, staff/admin-protected, or genuinely unreachable from the canonical spine. **Final status: LEGACY_UNUSED / out of canonical scope** for all of them — none block or alter the 27-session journey.
