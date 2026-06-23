# SmokeCraft 360 — Manual QA Test Script

A real-user walkthrough for testing the guided SmokeCraft 360 experience end
to end. Run this on an actual phone/tablet touchscreen, not just a desktop
browser resized small — several checks below depend on real touch behavior.

Use a fresh guest session for the full run (clear site data / use a private
window) so "missing field" fallbacks can be observed honestly before any
data exists.

Mark each line ☐ Pass / ☐ Fail / ☐ N/A. Note the device, browser, and OS
version at the top of your results.

**Tester:** _______________  **Date:** _______________
**Device / Browser:** _______________

---

## 0. Entry — CraftHub → SmokeCraft 360

- [ ] From CraftHub (or the home/explore screen), the SmokeCraft 360 entry
      point is visible and clearly labeled.
- [ ] Tapping it loads `/smokecraft` (Phase 0 — Entry Gate) without a blank
      screen, console error, or stuck spinner.
- [ ] The Entry Gate screen explains what SmokeCraft 360 is before asking
      for any input.
- [ ] "Start" / "Begin" (or equivalent) routes to Enroll (`/smokecraft/enroll`).
- [ ] Backing out of the Entry Gate returns to CraftHub/home, not a dead end.

## 1. Profile Capture (Enroll)

- [ ] Enroll screen loads at `/smokecraft/enroll`.
- [ ] Required profile fields (name, etc.) show clear validation if left
      blank — no silent failure when tapping Continue.
- [ ] Optional photo upload: confirm a clearly invalid file is rejected with
      a real error message (not a silent crash).
- [ ] Submitting valid profile data advances to Format (`/smokecraft/format`).
- [ ] Back button returns to the Entry Gate without losing entered data
      unexpectedly (note actual behavior either way).

## 2. Cigar Shape / Size / Burn Education (Format)

- [ ] Format screen loads with selectable cigar formats/shapes.
- [ ] Selecting a format shows clear visual confirmation (not just a color
      change too subtle to notice on a small screen).
- [ ] Educational content (insight panels/info) opens and closes cleanly —
      no panel gets stuck open or layered behind another.
- [ ] Continuing without selecting a format is blocked or clearly explained.
- [ ] Confirming a format awards XP feedback and advances to Seed & Soil.
- [ ] Back returns to Enroll correctly.

## 3. Seed & Soil

- [ ] Region/origin selection is tappable and shows a clear selected state.
- [ ] Soil/flavor preference selectors respond to a single tap (no double-tap
      needed, no missed taps on small targets).
- [ ] Any warning/conflict prompt (e.g. pairing vs. food conflict) displays
      legible text and both resolution choices work.
- [ ] Continue advances to Mentor Selection; Back returns to Format.

## 4. Mentor Selection

- [ ] Mentor cards display photo/avatar, name, and country (or an honest
      "Image pending" placeholder — never a broken image icon).
- [ ] Tapping a mentor card selects it with a clear visual state change.
- [ ] Selecting the maximum allowed number of mentors is enforced (cannot
      over-select).
- [ ] "Save Draft" returns to Seed & Soil without forcing a mentor pick.
- [ ] Confirming mentor selection advances to Gold Box Rules.
- [ ] Selected mentor name appears correctly later (cross-check during
      Passport Stamp and Connections review in section 12–13 below).

## 5. Gold Box Rules

- [ ] Rulebook content is fully readable on a small screen (no clipped or
      overlapping text).
- [ ] "View Scoring" expands/collapses without breaking layout.
- [ ] "Accept Rules" must be tapped before "Start Session" becomes usable —
      confirm Start is blocked/disabled until rules are accepted.
- [ ] Starting the session advances to Humidor Match.
- [ ] Back returns to Mentor Selection.

## 6. Humidor Match / Recommendation

- [ ] A cigar recommendation is shown based on prior selections (format,
      seed/soil, mentor) — not a generic placeholder unrelated to choices.
- [ ] Recommendation details (country, wrapper, strength) are legible and
      not truncated.
- [ ] Continuing advances to Request Purchase; Back returns to Gold Box.

## 6b. Request Purchase (pre-smoking gate)

- [ ] Request Purchase screen loads, and clearly does **not** claim a real
      order/payment was placed (check copy carefully — this must stay
      honest demo language).
- [ ] Continuing advances to Cut, Toast & Light; Back returns to Humidor
      Match.

## 7. Cut, Toast & Light

- [ ] All checklist items (cut method, draw check, burn check, ash check)
      are tappable with clear selected states.
- [ ] Step counter (e.g. "X of 3 steps") updates live as items are checked.
- [ ] Mentor tip box shows real tip text tied to the selected mentor, or an
      honest "no mentor selected" message — never blank/broken.
- [ ] Continue is reachable once steps are completed; Back returns to
      Request Purchase.

## 8. First Third — Tasting

- [ ] Flavor note chips toggle on/off with a single tap; multiple notes can
      be selected simultaneously.
- [ ] Draw Rating (1–5) and the four Profile Rating scales (Strength, Body,
      Smoke Output, Burn Quality) all respond correctly to taps — confirm
      the live "Notes Selected" / "Draw Rating" summary panel updates in
      real time as you tap.
- [ ] Pairing Reaction options are single-select, not stackable.
- [ ] Continue advances to Second Third; Back returns to Cut, Toast & Light.

## 9. Second Third — Tasting

- [ ] Flavor notes, Flavor Development, Strength Change, Body Change,
      Burn Consistency rating, Ash Quality rating, and Pairing Reaction all
      respond correctly to taps.
- [ ] Mentor tip box shows content (or honest fallback) consistent with the
      mentor chosen in Phase 4.
- [ ] Continue advances to Final Third; Back returns to First Third.

## 10. Final Third — Tasting

- [ ] Flavor notes, final strength/body, heat/harshness, burn finish, final
      pairing reaction, overall rating, and "Would Smoke Again" all capture
      input correctly.
- [ ] "Would Smoke Again" Yes/No is unambiguous and only one can be active.
- [ ] Continue advances to Scorecard; Back returns to Second Third.

## 11. Scorecard / Ranking / Badges

- [ ] Score total displays and is plausible given the inputs from Phases
      7–10 (spot-check: more completed steps/ratings should yield a higher
      score than a mostly-skipped run).
- [ ] Ranking level and any badge(s) earned display with real labels — no
      placeholder text like "Badge Name Here."
- [ ] "View Event Challenge" (if present) opens without breaking the page.
- [ ] Continue advances to Passport Stamp; Back returns to Final Third.

## 12. 360 Passport Stamp

- [ ] Passport Stamp page loads and displays the certified stamp animation/
      seal without errors.
- [ ] "Stamp Details" section shows: venue, event, date, cigar, cigar
      country, mentor(s), score, badge/ranking, pairing completed,
      networking status, and privacy/share status — each either populated
      correctly from this session or showing "Not recorded yet" /
      "Backend pending" (never blank, never a JS error in console).
- [ ] "Guided Session Detail" section shows: cut method, toast/light
      completion, draw/burn/ash checks, first/second/final third notes,
      strength progression, body progression, pairing reaction, final
      rating, would-smoke-again — verify these actually match what was
      entered in Phases 7–10, not generic/static text.
- [ ] Passport booklet stamp cards render on left/right pages (or an
      "Empty Slot" message if none earned — never a broken layout).
- [ ] "Open My Passport" and "Continue to Connections" both navigate
      correctly.
- [ ] Back returns to Scorecard.

## 13. 360 Passport Connections

- [ ] "Your SmokeCraft 360 Journey" summary section displays: cigar
      identity, mentor, country/origin, tasting profile (first/second/final
      third notes + pairing reaction), strength/body profile, final rating,
      would-smoke-again, score/ranking/badges, and Passport Stamp summary
      (venue/event/date/networking status) — cross-check every value
      against what was actually entered in Phases 4 and 7–11.
- [ ] Any field with no source data shows "Not recorded yet" cleanly — not
      a blank space, not "undefined," not a crash.
- [ ] "Future Connections" section is present and clearly states the member/
      cigar/mentor connection network does not exist yet — no claim that a
      real connection was made.
- [ ] Privacy/consent panel expands and each consent toggle responds to tap.
- [ ] Each networking action card shows the correct status (Not started /
      Consent required / Ready to share / Shared locally) and tapping a
      "Consent required" card opens the consent panel rather than silently
      doing nothing.
- [ ] Tapping a "Ready to share" action marks it "Shared locally (demo)" and
      does not duplicate-award XP on a second tap.
- [ ] Continue advances to Management Sync; Back returns to Passport Stamp.

---

## Cross-Cutting Checks (verify across the whole run, not just one phase)

### Missing-field fallbacks
- [ ] Run the full chain once **skipping every optional field** (notes,
      ratings, pairing reactions left blank where allowed). Confirm Phase
      11–13 never show blank space, "undefined," "null," or a crash —
      every empty field shows "Not recorded yet" or an equivalently honest
      label.

### Mobile / touchscreen usability
- [ ] All tap targets (chips, rating circles, toggle switches, buttons) are
      comfortably tappable with a thumb — no targets so small or close
      together that the wrong one gets hit.
- [ ] No page requires horizontal scrolling on a standard phone width.
- [ ] No double-tap-to-register issue anywhere (single tap should always
      register immediately).
- [ ] Haptic feedback fires on key interactions (selection, continue) on a
      real device that supports it.
- [ ] Sticky headers/footers (top bar, bottom nav, continue/back buttons)
      remain usable when the on-screen keyboard is open during text input.

### No dead buttons or dead cards
- [ ] Every button and card across all 14 phases was tapped at least once
      during this run and produced a visible, correct effect.
- [ ] No `href="#"` links found (grep confirms none exist in code, but
      manually confirm no link visually behaves like a dead "#" link).
- [ ] No button silently does nothing when tapped — every tap either
      navigates, toggles state, opens a panel, or shows a clear message.

### Premium / guided feel
- [ ] Transitions between phases feel intentional (not jarring blank flashes).
- [ ] Step progress indicator ("Step X of 17") is present, accurate, and
      increments correctly forward and backward through the chain.
- [ ] Visual tone (typography, color, imagery) stays consistent and feels
      cohesive from Phase 0 through Phase 13 — no phase feels like a
      placeholder or unfinished compared to the others.
- [ ] Mentor tips, when present, feel personal to the chosen mentor rather
      than generic boilerplate repeated everywhere.
- [ ] By the time the tester reaches the Passport Stamp, the session feels
      like a complete, earned outcome — not an abrupt stop.

---

## Result Summary

- Total checks: _______
- Passed: _______
- Failed: _______
- N/A: _______

**Critical issues found (block release):**
-

**Non-critical issues found (file for follow-up):**
-

**Overall verdict:** ☐ Ready  ☐ Not ready — see issues above
