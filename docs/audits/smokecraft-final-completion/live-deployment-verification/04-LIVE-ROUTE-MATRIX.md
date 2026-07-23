# 04 — Live Route Matrix

## Result: BLOCKED — no route in this matrix could be tested against the real production origin

Every route listed in the mandate (Launch, Enrollment, Resume, Identity, Mentor Selection, representative early/middle/late sessions, Filler Arrangement, Blend Fault Identification, Skill Tree, Collections, Challenge Hub, Passport Profile/Stamps/Activity, Golden Box entry/Build Studio/Packaging Studio, packaging preview/versions/sharing, Presentation, Defense, Results, Awards, Recommended Next Journey) requires reaching `https://crafthub360.up.railway.app` (or a confirmed alternate production URL), which is not reachable from this session (403 policy denial on the CONNECT tunnel — see `01-ENVIRONMENT-DISCOVERY.md`).

No substitute (localhost, the sandbox preview server, or generated screenshots) is used here, per this phase's explicit instruction not to substitute localhost screenshots for live route verification.

## What was already verified, and where (not a substitute, cited for context only)

- The equivalent 49-route smoke test against the **local** production-mode build (Vite dev server, port 5000) passed 97/98 in the immediately preceding Phase Architecture Reconciliation pass (`verify-smokecraft-route-smoke-test.mjs`). This confirms the routes are correct and functional in the codebase at commit `f00e6475`/`0985bd90` — it does not confirm they are reachable at the real production URL.

## Conclusion

**No live route verification could be performed.** This entire section is blocked pending real network access or user-supplied evidence.

## 2026-07-23 update

Re-attempted in the Phase 10 Closeout pass (deploy-and-verify the Start/Resume fix) — still blocked, same network policy denial. `/smokecraft`, `/smokecraft/resume`, `/smokecraft/enroll`, and `/smokecraft/identity` could not be checked live.

## 2026-07-23 update (Phase 10 Live Closeout, second attempt)

Re-attempted against `7f259e7a...`. Still blocked, same policy denial. No route in this matrix has ever been reached live in any pass of this operation.
