# Package 5 — Proof Screenshot Index

All under `public/proof/smokecraft-package-5/`.

| File | Route | Viewport | State | Interaction | Data source | Expected behavior | Pass/Fail | Image status |
|---|---|---|---|---|---|---|---|---|
| `01-leaf-primings.png` | `/smokecraft/wrapper-strength` | 1440×900 | Ligero selected, detail closed | tap-select | real `golden_box_component_catalog` | selection shows ✓, no default | PASS | text/card-based, no image yet |
| `02-comparison-tool.png` | same | 1440×900 | 2 items checked for compare | checkbox compare | same | comparison table renders, non-absolute disclaimer | PASS | n/a |
| `03-knowledge-check.png` | same | 1440×900 | quiz answered | radio + submit | `smokecraft_quiz_questions` | honest correct/incorrect feedback | PASS | n/a |
| `04-handheld.png` | same | 390×844 | initial load | — | — | no horizontal overflow | PASS | n/a |
| `05-tablet.png` | same | 1366×1024 | initial load | — | — | no horizontal overflow | PASS | n/a |
| `06-filler-arrangement-saved.png` | same | 1440×900 | 4-leaf arrangement placed, reloaded | tap-place, reorder, reload | `smokecraft_filler_arrangements` | arrangement rehydrates from backend | PASS | n/a |
| `07-rolling-step-1-complete.png` | same | 1440×900 | step 1 completed, reloaded | tap "Complete Step" | `smokecraft_rolling_progress` | step 1 shows ✓, step 2 unlocked, resumes after reload | PASS | n/a |
| `08-rolling-complete.png` | same | 1440×900 | all 10 steps completed | 9 additional completions via API | same + `xp_transactions` | "Rolling sequence complete" message, XP awarded once | PASS | n/a |
| `09-quality-control.png` | same | 1440×900 | Draw Test → Accept decided, reloaded | tap Accept | `smokecraft_quality_control_decisions` | decision persists and rehydrates | PASS | n/a |

| `10-handheld-closure.png` | same | 390×844 | filler arrangement + rolling process + QC sections all present | — | — | no overflow, all sections reachable | PASS | n/a |
| `11-tablet-closure.png` | same | 1366×1024 | same | — | — | no overflow, all sections reachable | PASS | n/a |
| `12-desktop-closure.png` | same | 1920×1080 | same | — | — | no overflow | PASS | n/a |

The main closure suite's keyboard-focus check hit the shared per-IP rate
limiter after ~30 prior API calls in that same run and stopped the script
before its viewport loop (disclosed in the completion report as a sandbox
artifact, not a functional defect). Rather than leave the 5-breakpoint
responsive check unverified, it was re-run in isolation
(`verify-golden-box-package-5-responsive.mjs`, minimal prior API calls)
covering keyboard access plus all 5 required breakpoints (390×844,
360×800, 1280×800, 1366×1024, 1920×1080) — **12/12 passed**, confirming
the new filler-arrangement/rolling-process/QC sections are all reachable
and overflow-free at every required size. See
`responsive-results.json`.

All Package 4 proof screenshots (`public/proof/smokecraft-package-4/`)
remain unchanged and valid — not touched this pass.
