# SmokeCraft — Single Build & Live Runtime pass — FINAL REPORT

**Starting commit:** `cbea8aadd735793ce1fcd45ffbb22442e2034213` (local == remote, clean tree, branch `recovery/smokecraft-codex-final`).

---

## 0. The one thing to read first: what this pass could and could not prove

This pass makes a hard distinction that the rest of the report maintains throughout:

| Category | Meaning |
|---|---|
| **A — Genuinely broken in source, fixed this pass** | Reproduced in a real browser against a real production build, fixed, re-verified. |
| **B — Already correct in source** | The live report was accurate as a user observation, but the current source is clean. Consistent with production serving an older build. |
| **C — Cannot be verified from here** | Requires reaching the live Railway URL. **Outbound access is blocked in this sandbox.** Not a statement about code. |

**Category C is why the final status is FAIL.** The mandate gates PASS on live Railway
screenshots showing one consistent build. That evidence cannot be produced from this
sandbox at any level of engineering quality. Real, recorded proof of the block:

```
$ curl -sS -m 25 https://crafthub360.up.railway.app/api/version
curl: (56) CONNECT tunnel failed, response 403
```

Full record: `public/proof/smokecraft-single-build-live-runtime/RAILWAY-ACCESS-BLOCKED.md`.
**No live Railway screenshot, deployed-commit reading, or live build-ID check was
fabricated or simulated anywhere in this pass.**

---

## 1. Mixed-build root cause — what was actually found

**Reported:** the same Railway domain served `Build: cbea8aad` on `/smokecraft/rewards-center`
but `Build: 3949a28` on `/smokecraft/leaderboard`, `/welcome`, `/humidor-match`.

**Not reproducible in this repo's source.** Verified in a real browser against a real
production build served by the real Express production server (the same one-process
topology Railway runs): all 12 tested routes plus `/system/build-info` report one
identical commit, matching `/api/version`, and it stays identical across navigation and
refresh (`build-id-across-routes.json`, checks 1/2/3/18).

### Why the reported symptom is nonetheless credible, and what it points at

An important negative result narrows this considerably. All SmokeCraft routes are served
by the **same** `index-<hash>.js` main chunk (the 34 lazy chunks in the build are
admin/founder screens, not SmokeCraft routes). So SmokeCraft routes **cannot** legitimately
disagree about the build ID within one page load — a divergence means different route URLs
received *different HTML documents pointing at different main bundles*.

Two mechanisms could do that. They were separated by checking when each relevant fix landed:

1. **Browser/intermediary caching of per-route HTML.** Each route URL is a separate HTML
   document response; if some were cached from an older build, those URLs would serve old
   HTML → old main chunk → old build ID, while a *newly added* route like
   `/smokecraft/rewards-center` (created two passes ago, never previously cached) would be
   fetched fresh. This fits the reported pattern exactly. **However**, `git log -S` shows the
   `no-store` index.html hardening (`10201e32`) and the cache-policy split (`6fa18390`) both
   **predate** `3949a28a`. The server was already emitting correct no-store HTML headers when
   the stale build was deployed, which substantially weakens (though cannot fully exclude, for
   caches populated before those commits) this explanation.

2. **More than one server instance concurrently serving the domain** — an incomplete or
   partially rolled-out Railway deployment, or overlapping replicas, where some requests hit a
   container running the old build and others the new one. Given correct `no-store` headers on
   HTML, this is the mechanism most consistent with per-request build variance on one domain.
   **It is a deployment-platform condition, not a source defect, and it cannot be confirmed or
   refuted from this sandbox (Category C).**

**Honest verdict: not reproducible in source; consistent with production serving a stale
build and/or more than one build concurrently, predating the recent fixes.** The pass did not
stop there — it audited every mechanism the mandate lists and fixed the real latent defects
found (below), each of which independently *could* pin a stale frontend.

---

## 2. Real defects found and fixed (Category A)

### 2.1 `/smokecraft/how-it-works` served internal storyboard artwork — REAL, FIXED
The route rendered `/assets/smokecraft-reference/approved/smokecraft-how-it-works.png`
full-screen. Despite the `approved/` directory, that file is an **internal design-reference
storyboard**: literally titled **"SMOKECRAFT 360 | STORYBOARD S1 → S4"** and covered in
planning labels (`S1.1 VOID BOOT`, `S1.2 CRAFT PORTAL`, `S2.1 NAME ENTRY`, `S3.1`, `S4.1`,
plus "S1 GOAL"/"S2 GOAL" design-intent columns). Real production users saw the team's internal
storyboard. It also depicts only four stages, contradicting the approved 6-phase/27-session
architecture. **The user's live report was accurate, and this was NOT a stale-cache artifact.**

**Asset decision (deliberate, documented):** the mandate says to use an existing approved
user-facing How-It-Works visual from `public/assets/smokecraft/` if one exists. One does:
`public/assets/smokecraft/session-visuals/HOW IT WORKS.png`. It was inspected and
**deliberately rejected** — it bakes fabricated learner data into its pixels ("Level 2
Aficionado", "1,350 XP to Level 3", "6 of 16" sessions, "4,250 XP", "24 of 1,248"). Shipping it
would have traded an internal-artwork defect for exactly the fake/stale-learner-data defect
this whole operation exists to eliminate, and "6 of 16" contradicts the 27-session
architecture.

**Fix:** `src/pages/smokecraft/HowItWorks.jsx` rebuilt as a real user screen from UI patterns
already in this codebase (the glass-card / gold-rule / `SmokeCraftNavBar` vocabulary shared
with RewardsCenter and Leaderboard). **No new artwork was created.** The phase list and all
counts are derived from the authoritative `VISIT_STRUCTURE` registry, never hardcoded, so the
screen cannot drift from the real architecture — it renders "27 sessions across 6 phases" and
the six real phase names with their real session counts (7+4+4+3+2+7 = 27). No internal labels.

**"Get Started" routing:** previously hardcoded to `/smokecraft/enroll`. It now delegates to the
**existing** three-state landing CTA decision, so it routes to Enrollment, Resume, or
completed-journey review exactly as the Landing screen's primary button does. To do this without
creating a second resolver, the four helpers (`guestStepDone`, `hasRealJourneyProgress`,
`getJourneyCompletionState`, `getEntryRoute`) were moved **verbatim** out of
`src/pages/SmokeCraft.jsx` into `src/constants/smokecraftLandingCta.js`, which both screens now
import. Zero behavior change to Landing — confirmed by the landing/destination regression suites
at baseline.

### 2.2 `/smokecraft/rewards-center` layout was genuinely broken — REAL, FIXED
The user's report ("layered incorrectly over the approved image, duplicate title, large black
overlay, content covering approved reward cards, inaccessible top nav, missing bottom nav") was
**reproduced locally in a real browser**. Three concrete CSS defects in `RewardsCenter.jsx`:

1. The approved visual was cropped into a fixed band (`height: clamp(150px,26vh,260px)`,
   `backgroundSize: cover`, `backgroundPosition: center 35%`) while `<main>` was absolutely
   positioned starting at `clamp(140px,24vh,240px)` with a **higher z-index** — main began
   ~10–20px *above* the band's bottom edge and painted over it. Live content literally covered
   the approved artwork.
2. `cover` + `center 35%` sliced the approved reward cards through their middles and pushed the
   image's own top navigation off screen — the approved layout read as broken and inaccessible.
3. The `rgba(6,8,16,0.92)` gradient stop plus the fixed-height band produced a large black
   region below the image before content began.

**Fix:** one normal-flow scrolling document. The visual keeps its real 1672×941 aspect ratio with
`backgroundSize: contain`, so it is never cropped and no approved card is ever sliced; content
flows **below** it rather than over it, making overlap structurally impossible; the duplicate live
"Reward Center" title is dropped (the approved image already titles the screen) in favour of a
screen-reader-only `<h1>`; and the standard `SmokeCraftNavBar` provides the bottom navigation the
screen previously lacked entirely. Real points and the honest no-venue-rewards empty state are
unchanged. Verified by screenshot **and** by DOM/computed-style inspection (`main.top >=
image.bottom`, no horizontal overflow) — checks 13/13b/13c/13d/13e/13f.

### 2.3 `/smokecraft` emitted a cacheable 301 Moved Permanently — REAL, FIXED
`public/smokecraft/` (images) is copied into `dist`, so a request for the SPA route
`/smokecraft` matched a real **directory** and `express.static` answered
**301 Moved Permanently → /smokecraft/**. A 301 is the most persistently cached response a
browser stores, and it was being emitted for the module's primary entry route — a genuine
cache-hygiene defect in exactly the area under investigation. Fixed with
`express.static(CLIENT_DIST, { index: false, redirect: false })`, so `/smokecraft` falls through
to the no-store SPA fallback. Verified: was `301`, now `200` with `no-store` (checks H2/H3).

### 2.4 Dead service-worker registrar — REAL, REMOVED
`src/serviceWorkerRegistration.js` contained a working
`navigator.serviceWorker.register('/sw.js')` implementation that **nothing imported**. Dead code,
but a live landmine: any future import would have re-registered a worker whose static-asset
strategy is stale-while-revalidate — i.e. it would serve a previous build's hashed JS chunk ahead
of the network, the precise mixed-build mechanism under investigation. **Deleted.**

`public/sw.js` is deliberately **kept**: its current content is a self-destructing kill switch
(install and activate delete every cache; activate unregisters the worker). Deleting the file
would make `/sw.js` 404, leaving any browser that still holds an old registration stuck with its
old worker instead of killing it.

### 2.5 Cache Storage was never cleared — REAL, FIXED
`src/main.jsx` already unregistered service workers on every load, but **unregistering does not
delete the Cache Storage buckets a worker created**. The retired worker used cache `novee-os-v2`
with stale-while-revalidate; any browser that ever registered it can still hold that bucket
holding an old build's chunks. `main.jsx` now also deletes Cache Storage buckets whose names
start with `novee-os` / `smokecraft` / `workbox` / `crafthub`. It touches **only** Cache Storage
by name prefix — localStorage and IndexedDB (`novee_guest_session`, `sc_journey_v1`, Passport
identity, archived journeys) are untouched, so recovery can never cost a user their journey.

### 2.6 Build-mismatch guard was passive — REAL, UPGRADED
`BuildDiagnosticFooter.jsx` detected a frontend/`/api/version` mismatch but only showed a banner
and waited for a click — the stale bundle kept running. Since the reported symptom is precisely
"a tab is running a build the server no longer serves", the guard now performs **one automatic
recovery attempt** per detected backend build: unregister service workers, delete app-owned
caches only, then reload once. Loop prevention is a `sessionStorage` marker **keyed to the
backend commit being recovered for**, so a genuine later deploy can still trigger one fresh
attempt, but an unresolvable mismatch (e.g. the server itself serving inconsistent builds — which
no client fix can repair) never reloads twice. The banner remains as the manual fallback.

### 2.7 `SmokeCraftNavBar` rendered a dead primary button — REAL, FIXED
Latent pre-existing bug surfaced by 2.2: the primary button was rendered unconditionally, so a
caller legitimately needing only a Back control got an empty clickable gold pill wired to an
undefined `onPrimary`. Now guarded by `{primary && onPrimary && ...}` (check 13f).

---

## 3. Reported-broken but ALREADY CORRECT in source (Category B)

Each re-verified fresh this pass in a real browser, no seeding, against a real production build.
The prior two passes' findings are **confirmed**, not taken on trust.

- **Welcome — "Greg Guy" / "beginner" / stale prior-journey data: ABSENT.** With a fresh context
  and no prerequisites, `/smokecraft/welcome` renders **no stale content at all** — it redirects
  to `/smokecraft/enroll`, the earliest incomplete entry screen, exactly as specified. Driven
  through the real entry flow with real clicks (Guest Pass → email → venue → identity), Welcome
  then shows **the identity just entered by that user** ("Tester") and "Knowledge level: Not
  shared" — no stale identity, no fabricated default. Checks 8/9/9b/16a/16b/16c.
- **Humidor Match — "FUTURE VISIT LOCKED" / old padlock image: ABSENT.** For a fresh user the
  route gates via a **live redirect** to `/smokecraft/enroll`, not a baked lock screen. No
  `FUTURE VISIT LOCKED` or `MANAGEMENT SYNC LOCKED` text renders, and no old lock PNG is
  referenced. Checks 10/10b/10c.
- **Leaderboard — "James Carter" / "18,750 XP" / stale "4435 XP": ABSENT.** The route renders the
  approved Leaderboard with an honest current-user-only row and an explicit "A shared venue
  leaderboard requires a backend or shared event store. Only your own session is shown until that
  exists." No fabricated competitors. Checks 11/12/12b/12c.
- **Journey progression.** The full path was walked with real visible-control clicks only:
  Landing → Start → Enrollment → Guest Pass + email → Venue → Identity → Welcome → Session 1 →
  Session 2, plus Resume returning correctly for a visitor with real prior progress. No redirect
  to an old lock screen at any step. Checks 14–17.

**Explanation for the divergence:** these three screens are clean in source and were verified so
by real browser interaction. Build `3949a28a` predates both `7e6d361c` (Rewards Center route fix
and Passport lock-image removal) and `cbea8aad`. Live symptoms matching the *pre-fix* state are
therefore consistent with production serving that older build — i.e. Category C, a deployment
condition, not a remaining code defect.

Note the contrast that makes this credible rather than convenient: How It Works and the Rewards
layout were reported broken and **were** genuinely broken in current source, and were fixed. The
same investigation found these three genuinely clean. The evidence was followed in both
directions.

---

## 4. Verification results

**New suite `verify-smokecraft-single-build-live-runtime.mjs` — 47/47.** Runs against the local
production build served by the real Express production server on :3001 (same topology as Railway
— one process serving `dist/` and `/api`), which is what makes checks 2 and 3 meaningful. Covers
all 18 mandated assertions plus four cache-header checks. Full output:
`public/proof/smokecraft-single-build-live-runtime/test-results.txt`.

**Regression battery — all at or above baseline:**

| Suite | Result | Baseline |
|---|---|---|
| `verify-smokecraft-railway-proxy-and-destinations` | **32/32** | 32/32 |
| `verify-smokecraft-live-landing-and-destinations` | **28/28** | 28/28 |
| `verify-smokecraft-canonical-runtime` | **19/19** | 19/19 |
| `verify-smokecraft-canonical-journey-authority` | **25/25** | 25/25 |
| `verify-smokecraft-zero-legacy-runtime` | **9/9** | 9/9 |
| `verify-smokecraft-zero-old-visuals` | **20/20** (GATE: PASS) | 20/20 |
| `verify-smokecraft-entry-prerequisite-guard` | **43/43** | 43/43 |
| `verify-smokecraft-27-session-sequence` | **39/39** | 39/39 |
| `verify-smokecraft-approved-entry-visuals` | **24/24** | 24/24 |
| `verify-passport-security-unified-identity` | **59/59** | 59/59 |

`npm run build` exit 0. Production-mode startup clean. `/api/health` 200. `/api/version` reports
one commit for backend and frontend.

**Honest environment note:** one run of `verify-smokecraft-27-session-sequence` reported 36/36
because a live browser sweep was **BLOCKED** by a stale `vite preview` process timing out on
:5050 — the known recurring environment issue documented in prior passes, not a code regression.
After restarting preview it returned the documented 39/39 baseline. Both the anomaly and the
resolution are recorded in `regressions.txt` rather than quietly overwritten.

`verify-smokecraft-live-start-navigation.mjs` still does not exist as its own file (consolidated
by an earlier pass). **Its run is not fabricated.** The new suite carries the equivalent Start/
Resume/navigation coverage in checks 14–18.

**No `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` was observed at any point** — the prior pass's Railway
`trust proxy` fix shows no sign of regression.

---

## 5. Evidence

`public/proof/smokecraft-single-build-live-runtime/`:
- `screenshots/` — 14 real screenshots (Landing, How It Works, Enrollment, Identity, Welcome
  fresh-redirect, Welcome with journey, Humidor Match, Rewards, Leaderboard, Passport, Session 1,
  Session 2, Resume, Build Info), all from the local production build.
- `build-id-across-routes.json` — per-route build ID, service-worker controller/registration
  count, and `caches.keys()` for every route.
- `service-worker-and-cache-audit.md` — the full audit behind section 2.
- `cache-headers.txt` — real response headers for HTML routes, `/api/version`, `/sw.js`, and a
  hashed immutable asset.
- `test-results.txt`, `regressions.txt`, `build-startup-health.txt`.
- `RAILWAY-ACCESS-BLOCKED.md` — the real, unedited blocked-access output.

---

## 6. Recommended next step (requires someone with Railway access)

Everything below is Category C and cannot be done from this sandbox:
1. Redeploy the branch and confirm the Railway build log shows the current commit.
2. Confirm the service runs **one** instance/replica of the new build, and that no older
   deployment is still receiving traffic — this is the leading remaining hypothesis for
   per-request build variance on one domain given correct `no-store` HTML headers.
3. Load each route and confirm one identical `Build:` badge. If a stale tab persists, the new
   automatic one-shot recovery guard (2.6) will now self-heal it on the next load.

---

## FINAL STATUS

**FAIL — MIXED BUILDS, OLD ROUTES, STALE DATA, OR JOURNEY BLOCKERS REMAIN LIVE**

To be precise about what this status does and does not assert:

- It is driven by **Category C**: the mandate gates PASS on live Railway screenshots proving one
  consistent build, and outbound access to the production URL is blocked in this sandbox
  (`curl: (56) CONNECT tunnel failed, response 403`). That bar cannot be met from here at any
  level of engineering quality.
- It does **not** assert that known code defects remain. Every defect found in source this pass
  (2.1–2.7) was fixed and re-verified, and the three screens reported broken but found clean
  (section 3) were re-verified clean by real browser interaction. Local verification is 47/47 on
  the new suite with the entire regression battery at baseline.
- Whether the live site is *currently* fixed depends on a deployment that this sandbox cannot
  perform or observe.
