# SmokeCraft 360 — Full Root-Cause Audit

Repo/branch: `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
Audit starting commit: `b2df4f2219a4f32306413ebb5f28a6b79150acd5`

## Documents

- [00-SYSTEM-MAP.md](00-SYSTEM-MAP.md) — the full live SmokeCraft path, link by link
- [01-DEPLOYMENT-AUDIT.md](01-DEPLOYMENT-AUDIT.md) — what could and could not be verified about the Railway deployment
- [02-APPROVED-ASSET-INVENTORY.md](02-APPROVED-ASSET-INVENTORY.md) — 365 files on disk, 75 registered, full registered-subset trace
- [03-ROUTE-ASSET-TRUTH-TABLE.md](03-ROUTE-ASSET-TRUTH-TABLE.md) — all 5 entry screens + 27 sessions, route/asset/guard, programmatically generated
- [04-COMPONENT-RENDERING-AUDIT.md](04-COMPONENT-RENDERING-AUDIT.md) — object-fit, pointer-events, z-index, error boundaries, demo-mode
- [05-ENTRY-SEQUENCE-AUDIT.md](05-ENTRY-SEQUENCE-AUDIT.md) — every user-type entry flow, trigger→resolver→destination
- [06-SESSION-SEQUENCE-AUDIT.md](06-SESSION-SEQUENCE-AUDIT.md) — 27-session/6-phase re-verification, stale-array re-confirmation
- [07-JOURNEY-STATE-AUTHORITY-AUDIT.md](07-JOURNEY-STATE-AUTHORITY-AUDIT.md) — every state store, its authority, and hydration order
- [08-HYDRATION-AND-TIMING-AUDIT.md](08-HYDRATION-AND-TIMING-AUDIT.md) — race/timing analysis, service-worker finding
- [09-FALLBACK-DEMO-AUDIT.md](09-FALLBACK-DEMO-AUDIT.md) — full grep for stale/demo strings, production-reachability of each
- [10-TEST-VALIDITY-AUDIT.md](10-TEST-VALIDITY-AUDIT.md) — why every prior test could pass while live symptoms were reported
- [11-PRODUCTION-BUNDLE-AUDIT.md](11-PRODUCTION-BUNDLE-AUDIT.md) — fresh build, asset manifest, two disclosed architectural gaps
- [12-ROOT-CAUSE-FINDINGS.md](12-ROOT-CAUSE-FINDINGS.md) — primary/secondary root causes, classified
- [13-PERMANENT-REMEDIATION-PLAN.md](13-PERMANENT-REMEDIATION-PLAN.md) — 5 ordered packages, not yet implemented

## One-page summary

**What is broken:** as far as this audit can determine from source, nothing new. Every previously-reported live symptom (wrong Enrollment/Venue visuals, wrong session order, stale learner/cigar/mentor/percent data) traces to defects that were already found and fixed in prior passes, and this pass's fresh re-verification (new build, new route sweep, new grep, new live-browser profile tests including a deliberately corrupt-legacy-state profile) found the fixes still correctly in place.

**Why it is broken (live, if it still is):** this session has never had Railway/production network access, credentials, or dashboard access — in this pass or any prior pass of this operation. There is no way, from inside this session, to confirm which commit is actually deployed, whether the last deploy succeeded, or whether a caching layer is serving stale assets. Two concrete, newly-disclosed architectural gaps make a "fix deployed but user still sees old result" scenario plausible even with a clean deploy: `public/`-sourced images have no cache-busting hash (unlike the JS/CSS bundle, which does), and the frontend bundle carries no self-describing commit marker of its own.

**Why prior passes missed it:** they did not miss the local defects — every one of them found and fixed a real, genuine local defect, correctly. What none of them (or this one) could do is prove the fix reached production, because the tooling for that (Playwright, curl, `git`) has never had a network path to `crafthub360.up.railway.app` in this environment.

**What must be fixed:** see `13-PERMANENT-REMEDIATION-PLAN.md`. In priority order: (1) obtain real deployment evidence, (2) cache-bust static images, (3) embed a frontend build marker, (4) verify server-side Start New Journey scoping for Golden Box/Packaging Studio, (5) re-run live verification once access exists.

**What must not be changed:** the locked 27-session/6-phase architecture (re-confirmed correct and untouched), the already-fixed Clean Start/Start New Journey/Entry-Prerequisite/Approved-Visual systems (all re-confirmed correct and untouched), and no new artwork was created.

**What must happen next:** do not resume page-level patching. Obtain real Railway deployment access or evidence before authorizing further code changes — every remediation package's priority depends on knowing whether the live symptom is a deployment gap or a genuine remaining defect, which this audit cannot distinguish without it.
