# 04 — Golden Box Full Lifecycle

The fresh-player script drove the same guest identity that just finished
all 27 curriculum sessions through a complete, real Golden Box competition
lifecycle, using the real API at every step — build → submit → judge →
finalize → award.

## Steps (all real API calls, no manual DB writes to player/entry/scorecard state)

1. **Competition fixture** — one competition row created via direct SQL
   (`INSERT INTO golden_box_competitions ...`), the exact same
   admin-fixture technique already used by every prior Golden Box test
   package (`hf5c1b`, `hf5c2a`, `hf5c2b1`, `hf5c2b2`). This is competition
   *configuration*, not player progression — no player, entry, score, or
   award row was ever written directly.
2. **Build** — `POST /api/smokecraft/golden-box/competitions/:id/entries`
   creates a real entry for the fresh player; `PATCH
   /api/smokecraft/golden-box/entries/:id/draft` builds a complete cigar
   (wrapper/binder/filler/vitola) through the real draft API.
3. **Submit** — `POST /api/smokecraft/golden-box/entries/:id/submit`
   submits the completed entry.
4. **Judge** — a real, distinct judge account (`manager@novee.dev`, a
   fixture account already used by every prior judging package — a player
   cannot judge their own entry; `judge_self_assignment_prohibited` is a
   real server rule, re-confirmed in this run's earlier package regression)
   is assigned by a real admin account, reads the real server-owned
   judging rubric (`GET /api/smokecraft/golden-box/judging/rubric`), and
   submits a real scorecard (`POST
   /api/smokecraft/golden-box/entries/:id/scorecard`) scoring every
   criterion the rubric actually returned.
5. **Finalize** — the admin calls `POST
   /api/smokecraft/golden-box/competitions/:id/results/finalize`, which
   the server accepted only because judging was actually complete.
6. **Award** — the admin calls `POST
   /api/smokecraft/golden-box/competitions/:id/awards/issue`; with a
   single entrant, the server returned exactly one award record, of type
   `first_place`, tied to the fresh player's own entry id — a real,
   server-computed placement, not a fabricated one.

## Result

All 14 Golden Box assertions in this run passed, including the two honest
negative-shape checks that this document calls out explicitly because they
initially failed during script development and were fixed by reading the
real API responses rather than assuming a shape:

- The rubric endpoint returns `criteria[].criterionKey`, not
  `categories[]` — the script was corrected to use the real field name.
- `golden_box_competitions.id` is a plain integer/serial, not a UUID — the
  script's format assertion was corrected to accept the real id shape
  instead of asserting a UUID regex that would have masked a real (if
  narrow) format-assumption bug.

Final Golden Box outcome for this run: `awardType: "first_place"`,
`entryId` and `competitionId` recorded in
`fresh-player-run-output.json`.
