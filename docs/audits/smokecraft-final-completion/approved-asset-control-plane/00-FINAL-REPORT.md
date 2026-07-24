# 00 — Final Report: Approved Asset Control Plane

**Branch:** `recovery/smokecraft-codex-final`
**Starting commit:** `77c486829fb422421f859aa4362fa591c9d99f4d`

This pass **supersedes and corrects** the immediately-prior pass
(`77c4868 — Fix mixed-build hygiene, storyboard How It Works route, and Rewards
Center layout`) on How It Works and Rewards Center.

---

## 1. The correction being applied

The prior pass rebuilt `/smokecraft/how-it-works` and re-laid-out
`RewardsCenter.jsx` using its own React/CSS composition. The repo owner
rejected that approach outright:

> Claude should not redesign anything and should not build replacement screens
> in its own style. The fix is: use only the already approved images in GitHub,
> map each approved image to the correct route/session, place live React
> controls over the approved image, wire the controls to real state and
> navigation, remove every old, generic, fallback, and Claude-created screen
> from production, never substitute a dark generic dashboard when an approved
> image exists.

Every change below follows from that rule. No artwork was created, redrawn,
regenerated, reinterpreted or cropped.

---

## 2. The How-It-Works tension was real — and it was resolvable

The prior pass concluded that no usable approved How-It-Works image existed,
because the only user-facing candidate
(`public/assets/smokecraft/session-visuals/HOW IT WORKS.png`) has fabricated
learner values baked into its pixels:

- `Level 2 Aficionado`, `1,350 XP to Level 3`
- PROGRESS OVERVIEW: `6 of 16` sessions, `12` badges, `4,250` XP, `24 of 1,248`

It treated this as an unresolvable conflict between "use only approved images"
and "never show fake data", and hand-built a screen instead.

**That was a false dilemma.** Those numbers sit inside clearly-bounded *value
zones* — precisely the regions React overlays are meant to own, and precisely
how `Format.jsx` already handles baked text it must replace (opaque panel over
the baked pixels; see its `PANEL` const: *"non-opaque background let baked image
content bleed through"*).

The resolution shipped here:

- the approved image renders intact at its true **1448x1086** aspect ratio;
- every baked placeholder is covered by an **opaque** overlay showing the
  user's real saved value;
- `of 16` is replaced by `of 27` from the authoritative `TOTAL_SESSIONS`
  registry, so the screen now *agrees with* the locked 27-session architecture
  instead of contradicting it;
- the community-rank cell (`24 of 1,248`) has **no** honest data source in this
  build, so it is occluded and marked `—  Not ranked yet` rather than showing
  either the baked placeholder or an invented number.

**Remaining honest caveat:** the fabricated numbers still exist *in the approved
file itself*. They are never visible, because every one is occluded. But if that
image is ever rendered without this overlay, the fake stats return. That is a
defect in the approved asset, not something introduced here, and it cannot be
fixed without the owner re-exporting the image with empty value zones (the way
`Reward Center.png` already is). **Recommended owner action:** re-export
`HOW IT WORKS.png` with blank value zones.

The second candidate,
`assets/smokecraft-reference/approved/smokecraft-how-it-works.png`, is genuinely
an internal storyboard (`STORYBOARD S1 -> S4`, S1.1/S2.1/"S1 GOAL" labels) and
is correctly not used. Its dead `SC_ASSETS.howItWorks` key is removed.

---

## 3. Root cause fixed: one resolver, not per-control patches

**`src/constants/smokecraftLandingActions.js`** (new) is now the single
authority for every Landing destination.

`resolveSmokeCraftLandingAction(actionId, journeyState)` supports `START`,
`RESUME`, `START_NEW`, `HOW_IT_WORKS`, `REWARDS`, `RANKINGS`, `PASSPORT`,
`PAIRING`, `CRAFTHUB`. It **decides only** — it never mutates state; when a
clean journey is required it returns `startsNewJourney: true` and the caller
runs the one canonical `useStartNewSmokeCraftJourney()`. Unknown actions
**throw** rather than falling back to a default route, because a silent fallback
is exactly how a control lands a user on the wrong screen with no signal.

`src/pages/SmokeCraft.jsx` now reads journey state **once** per render and
routes every control through `runAction(ACTION)`. It contains **zero** inline
`navigate('/...')` calls (asserted by the suite) and no longer duplicates the
CTA-label logic.

### Two live defects this immediately exposed

Scattered inline route strings had hidden two real bugs of the same class as the
Rewards→humidor-match bounce patched in an earlier pass:

| Control | Pointed at | Guard | Real-world result |
|---|---|---|---|
| PASSPORT | `/smokecraft/passport-stamp` | `sessionNumber={23}` | Guests bounced to `/enroll`; approved Passport visual never shown |
| CRAFTHUB | `/smokecraft/smokecraft-challenge` | `requires="scorecard"` | Tile labelled CRAFTHUB delivered the Challenge screen or a bounce; **no CraftHub visual existed anywhere** |

Both now resolve to landing-accessible approved destinations. Every route in the
destination map is guard-free by construction, so a Landing control can no
longer advertise a destination and deliver an enrollment bounce.

---

## 4. Per-destination results

| Destination | Before | After |
|---|---|---|
| **How It Works** | Claude-composed gradient/glass-card screen; **no image at all** | Approved `HOW IT WORKS.png` shell; baked fake stats occluded by real values |
| **Rewards Center** | Approved image capped at `maxHeight:62vh` + hand-built glass-card stack below (the "giant black content block") | Approved `Reward Center.png` at true aspect ratio; values placed in the image's own blank circles; its own nav bar made live |
| **Passport** | `<Navigate>` alias to unrelated `/passport`; Landing pointed at guarded session-23 screen | New `/smokecraft/passport` renders approved `360 PASSPORT  2.png`; locked state = live prerequisite panel **over** the approved visual, never a replacement screen or lock artwork |
| **CraftHub** | Route did not exist; tile went to guarded Challenge screen | New `/smokecraft/crafthub` renders approved CraftHub 360 visual; craft tiles + action row live; no Identity/Personal-Dashboard routing, no "Greg Guy", journey untouched |
| **Rankings** | — | Route corrected to resolve through the resolver. **See §7 — not converted this pass.** |
| **Pairing** | Landing pointed at guarded session-11 `pairing-lab` | Resolves to unguarded `/smokecraft/pairing`, which already renders the approved pairing image |
| **Humidor Match** | Already correct (`SmokeCraftImageBoundsOverlay` + `SC_ASSETS.humidorMatch`) | **Untouched** — verified correct, deliberately not modified |

---

## 5. Honest data reporting (state separation)

The mandate asked whether `RewardsCenter`'s point fields were "fake distinct
fields from one number". **They were.** `smokecraftLoyaltyEngine.js` increments
`loyaltyPoints`, `lifetimeLoyaltyPoints` **and** `redeemablePoints` by the
*identical* amount on every award, and never decrements any of them. No
redemption path exists in this build.

So the prior pass's four tiles were one number under four headings — including a
"Redeemed" figure computed as `lifetime - available`, which is **identically 0 by
construction** while looking like a derived value.

Now:

- **AVAILABLE POINTS** — the real balance (`session.loyaltyPoints`)
- **POINTS EARNED THIS JOURNEY** — real, summed from `session.loyaltyLedger`
- **LIFETIME POINTS** / **POINTS REDEEMED** — rendered `—`, honestly marked as
  not separately tracked rather than restating the same number

Account XP is **no longer shown** on the reward screen at all (account state vs
reward state). The old `Total XP` field was itself the state-bleed the mandate
forbids; the regression assertion that required it has been inverted to forbid
it.

---

## 6. Test results (all run locally, real browser, nothing fabricated)

### New suite
`verify-smokecraft-approved-landing-control-plane.mjs` — **62 / 62**

Navigation uses **visible controls only** (`getByRole('button', {name})`); it
never types a destination URL or calls a service to reach a landing
destination. For Landing, Rewards, Passport, CraftHub and How It Works it
re-hashes the bytes the browser actually received and asserts equality with the
approved file on disk — **all matched**.

### Regressions

| Suite | Baseline | Result |
|---|---|---|
| `verify-smokecraft-canonical-runtime` | 19 | **19 / 19** |
| `verify-smokecraft-canonical-journey-authority` | 25 | **25 / 25** |
| `verify-smokecraft-zero-legacy-runtime` | 9 | **9 / 9** |
| `verify-smokecraft-zero-old-visuals` | 20 | **20 / 20** |
| `verify-smokecraft-approved-entry-visuals` | 24 | **24 / 24** |
| `verify-smokecraft-tactile-haptic-interactions` | 71 | **71 / 71** |
| `verify-smokecraft-entry-prerequisite-guard` | 43 | **43 / 43** |
| `verify-smokecraft-27-session-sequence` | 39 | **39 / 39** |
| `verify-passport-security-unified-identity` | 59 | **59 / 59** |
| `verify-smokecraft-single-build-live-runtime` | 47 | **47 / 47** (2 assertions retargeted) |
| `verify-smokecraft-live-landing-and-destinations` | 28 | **31 / 31** (4 retargeted, +3 added) |
| `verify-smokecraft-railway-proxy-and-destinations` | 32 | **33 / 33** (2 retargeted, +1 added) |

### Assertions retargeted — and why that is not weakening

Nine assertions in three older suites tested the *prior pass's now-rejected
structure* (`[data-visual-source]` CSS-background div, a `<main>` stack below the
image, a separate React nav bar, prose "27 sessions / 6 phases"). Each was
re-pointed at the equivalent correct property of the approved-image-shell
pattern. Two became **stricter**:

- `(13f)` "no empty/dead buttons" → **"every control exposes an accessible
  name"**. Hotspots over an approved image are intentionally text-free but carry
  `aria-label`; the old check would have punished the correct pattern.
- `Rewards: shows real Total XP field` → **`account XP is not presented as
  reward points`**. The original assertion mandated the state-bleed defect.

The rendered-hash-vs-disk-hash proof in the proxy suite was **preserved
unchanged**, only re-sourced from the `<img>` instead of a CSS background.

### Build / startup / health

- `npm run build` — **exit 0** (verified three times)
- `vite preview :5050` — **HTTP 200** on `/smokecraft`
- Backend (`node server/index.js`, Postgres) — `/api/health` → `{"success":true,"status":"ok","db":"postgres"}`

**Note on rate limiting:** the documented in-memory limiter (20 req/window)
produced plain `429`s partway through the run, as it has on every prior pass.
Restarting the backend fresh cleared it. Expected, not a defect.

---

## 7. Remaining blockers / not done this pass

1. **`Leaderboard.jsx` (Rankings) is still a hand-built CSS layout.** The
   approved `LEADERBOARD 111.png` is used only as a ~14vh decorative header
   band, and the approved file has `JAMES CARTER`, `18,750 XP` and `4,250 XP`
   baked into its participant rows. Converting it to the approved-image shell
   requires occluding the entire 7-row table plus the "YOUR RANK" strip with
   live rows, on top of the component's existing real filter-persistence logic.
   Routing is corrected and no fabricated name reaches the DOM (asserted), but
   **the approved image is not yet the visual foundation of this screen.**
2. **Other non-landing screens still use the decorative-band pattern:**
   `Rewards.jsx` (S25), `PairingRecommendations.jsx` (S22), `Identity.jsx`,
   `ResumeJourney.jsx`. Outside this pass's landing-destination scope, but they
   are the same violation class and should be converted.
3. **`Pairing.jsx` uses `backgroundSize: cover`**, so the approved pairing image
   is cropped rather than shown at true aspect ratio. Route is correct; fit is
   not.
4. **`HOW IT WORKS.png` still contains fabricated stats in its pixels** (§2).
   Fully mitigated at runtime; needs an owner re-export to be fixed at source.
5. **No live Railway verification** — network-blocked in this sandbox. All proof
   is local production build + real browser.

---

## 8. Proof

`public/proof/smokecraft-approved-landing-control-plane/`

- `01-landing.png` … `08-enroll.png` — real screenshots of every destination
- `09-rendered-asset-hashes.json` — rendered sha256 vs disk sha256 for all 8
  approved assets, **0 mismatches**
