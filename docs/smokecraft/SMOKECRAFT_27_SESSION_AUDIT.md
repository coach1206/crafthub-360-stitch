# SmokeCraft 27-Session Audit (Prompt 1 — programmatically generated)

Generated directly from `VISIT_STRUCTURE` (src/constants/session.js), `SMOKECRAFT_SCREEN_MANIFEST` (src/constants/smokecraftScreenManifest.js), and `SC_ASSETS` (src/constants/smokecraftAssets.js) — the three canonical single sources of truth already used by the live route guards, not hand-transcribed. Asset hash (first 12 hex chars of sha256) is computed from the actual file on disk at generation time, commit `d6469504a2a83ab4acfb27e89a25064d505d4d55`.

**Total sessions: 27** (expected 27) — MATCH
**Total phases: 6** (expected 6, per this repo's locked spine — see note below)

> Note on "7 phases": this prompt's mandate says "27 sessions across 7 phases." This repository's single canonical registry (`VISIT_STRUCTURE`, `TOTAL_VISITS`) has always been, and remains, **6 phases** — verified directly from source, not assumed. This is flagged here as a discrepancy between the mandate's stated number and the actual locked architecture, not silently corrected or silently ignored. No session was merged, split, renumbered, or reordered to produce this count.

| Session | Phase | Route | Component key | Registered | Asset key | Asset file | Hash (12) | Prev screen | Next screen |
|---|---|---|---|---|---|---|---|---|---|
| S1 | 1 (Session Preparation) | `/smokecraft/welcome` | `session-1` | yes | session1 | assets/smokecraft/session 1.png | 8394f96f9150 | entry-venue | session-2 |
| S2 | 1 (Session Preparation) | `/smokecraft/humidor-match` | `session-2` | yes | humidorMatch | assets/smokecraft/Humidor Match 1.png | 63c6510b549a | session-1 | session-3 |
| S3 | 1 (Session Preparation) | `/smokecraft/meet-your-cigar` | `session-3` | yes | meetYourCigar | assets/smokecraft/DISOVER YOUR CIGAR PROFILE.png | 6fc13ac032af | session-2 | session-4 |
| S4 | 1 (Session Preparation) | `/smokecraft/terroir` | `session-4` | yes | terroir | assets/smokecraft-reference/approved/smokecraft-terroir.png | e671a9a296f1 | session-3 | session-5 |
| S5 | 1 (Session Preparation) | `/smokecraft/format` | `session-5` | yes | format | assets/smokecraft-reference/approved/smokecraft-vitola.png | a7c1147e1b9b | session-4 | session-6 |
| S6 | 1 (Session Preparation) | `/smokecraft/cut-toast-light` | `session-6` | yes | cutToastLight | assets/smokecraft/CUT  TOAST, & LIGHT.png | 09a4257a15bf | session-5 | session-7 |
| S7 | 1 (Session Preparation) | `/smokecraft/lighting-tutorial` | `session-7` | yes | lightingTutorial | assets/smokecraft/LIGHTING TUTORIAL 1.png | 0b9e31a4821a | session-6 | session-8 |
| S8 | 2 (First Third) | `/smokecraft/first-third` | `session-8` | yes | firstThird | assets/smokecraft/FIRST  THIRD1.png | 18a997c3d1de | session-7 | session-9 |
| S9 | 2 (First Third) | `/smokecraft/first-third` | `session-9` | NO — MISSING | firstThird | assets/smokecraft/FIRST  THIRD1.png | 18a997c3d1de | session-8 | session-10 |
| S10 | 2 (First Third) | `/smokecraft/flavor-memory` | `session-10` | yes | flavorMemory | assets/smokecraft/FLAVOR MEMORY.png | 297eb2b15d96 | session-9 | session-11 |
| S11 | 2 (First Third) | `/smokecraft/pairing-lab` | `session-11` | yes | pairingLab | assets/smokecraft/PAIRING LAB1.png | 274fc143e8d5 | session-10 | session-12 |
| S12 | 3 (Second Third) | `/smokecraft/second-third` | `session-12` | yes | secondThird | assets/smokecraft/SECOND THIRD.png | 0a8ec771f6bf | session-11 | session-13 |
| S13 | 3 (Second Third) | `/smokecraft/second-third` | `session-13` | NO — MISSING | secondThird | assets/smokecraft/SECOND THIRD.png | 0a8ec771f6bf | session-12 | session-14 |
| S14 | 3 (Second Third) | `/smokecraft/mentor-commentary` | `session-14` | yes | mentorCommentary | assets/smokecraft/MENTOR :COMMENTARY.png | 3959f46c029b | session-13 | session-15 |
| S15 | 3 (Second Third) | `/smokecraft/knowledge-drop` | `session-15` | yes | knowledgeDrop | assets/smokecraft/KNOWLEDGE DROP.png | 27b3c600ed0b | session-14 | session-16 |
| S16 | 4 (Final Third) | `/smokecraft/final-third` | `session-16` | yes | finalThird | assets/smokecraft/FINAL THIRD.png | 6ce38723011a | session-15 | session-17 |
| S17 | 4 (Final Third) | `/smokecraft/final-third` | `session-17` | NO — MISSING | finalThird | assets/smokecraft/FINAL THIRD.png | 6ce38723011a | session-16 | session-18 |
| S18 | 4 (Final Third) | `/smokecraft/final-third` | `session-18` | NO — MISSING | finalThird | assets/smokecraft/FINAL THIRD.png | 6ce38723011a | session-17 | session-19 |
| S19 | 5 (Reflection) | `/smokecraft/scorecard` | `session-19` | yes | scorecard | assets/smokecraft/Scorecard.png | a57797379759 | session-18 | session-20 |
| S20 | 5 (Reflection) | `/smokecraft/scorecard` | `session-20` | NO — MISSING | scorecard | assets/smokecraft/Scorecard.png | a57797379759 | session-19 | session-21 |
| S21 | 6 (Results) | `/smokecraft/ai-summary` | `session-21` | yes | aiSummary | assets/smokecraft/AI SUMMARY.png | 1d05f50d0eb7 | session-20 | session-22 |
| S22 | 6 (Results) | `/smokecraft/pairing-recommendations` | `session-22` | yes | pairingRecommendations | assets/smokecraft/personlized pairing 222.png | f060831b151c | session-21 | session-23 |
| S23 | 6 (Results) | `/smokecraft/passport-stamp` | `session-23` | yes | passportStamp | assets/smokecraft/PASSPORT STAMP.png | 4d9fb28ac010 | session-22 | session-24 |
| S24 | 6 (Results) | `/smokecraft/final-review` | `session-24` | yes | finalReview | assets/smokecraft/FINAL REVIEW.png | df16f309ce13 | session-23 | session-25 |
| S25 | 6 (Results) | `/smokecraft/rewards` | `session-25` | yes | rewards | assets/smokecraft/session 25 rewards.png | 683892e9df2c | session-24 | session-26 |
| S26 | 6 (Results) | `/smokecraft/rewards` | `session-26` | NO — MISSING | achievements | assets/smokecraft/ACHIEVMENTS.png | 32e64aadd40d | session-25 | session-27 |
| S27 | 6 (Results) | `/smokecraft/session-complete` | `session-27` | yes | recommendedNextJourney | assets/smokecraft/Recommend next journey.png | 2c5a402c0063 | session-26 | supporting-recommended-next-journey |
