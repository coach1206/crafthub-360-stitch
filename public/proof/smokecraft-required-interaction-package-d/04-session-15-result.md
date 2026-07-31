# 04 — Session 15 (Knowledge Drop) Result

- **Required checkpoints**: `tobacco`, `fermentation`, `aging`, `factory` — all 4 real topics.
- **What changed**: the pre-existing per-topic quiz (real question + 3 real options + a correct-answer index) was previously **optional** and **graded entirely client-side** (`topic.quiz.answer`, visible in the shipped bundle, never verified server-side). It is now the **required** interaction, with the server holding its own independent copy of the answer key (`KNOWLEDGE_DROP_ANSWERS` in `selectionClassificationService.js`) — the client's local `quiz.answer` field remains only for the immediate in-page practice hint, never trusted for completion.
- **Required final synthesis**: after answering all 4 quizzes, the player must select which topic they found most useful (a real reflective pick, validated as one of the 4 topic ids — not graded, since "most useful" is inherently subjective).
- **Server evaluation**: unlike Sessions 3/4, this session's checkpoints ARE objectively graded — all 4 answers must exactly match `KNOWLEDGE_DROP_ANSWERS` for `evaluate()` to return `true`. A well-formed submission with even one wrong answer is accepted as a real attempt but marked incorrect and never completes the session — verified live (API + browser, using an intentionally wrong first answer).
- **Completion gate**: same additive `completeSession()` gate.
- **Downstream prerequisites**: unaffected — `final-third` (Session 16)'s own prerequisite chain and Golden Box/pairing/tasting dependencies were not touched by this pass; regression suites for those areas re-run clean.

Verified live: incorrect-answer honest feedback, out-of-range answer-index rejection, unknown-topic rejection, missing-synthesis rejection, a "4 answers with 1 wrong" submission correctly failing to complete, a fully-correct submission completing, duplicate-submission safety, and genuine reload preserving in-progress quiz draft state.
