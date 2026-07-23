# 02 — State Reset Manifest

Real key/field names, found by source inspection (not the mandate's generic placeholder names).

## `GuestSessionContext` (`novee_guest_session` localStorage key) — reset by `resetJourneySpecificFields()`

| Field | Action |
|---|---|
| `profile.{firstName,lastName,nickname,email,phone,city,state,zip,photo,ageConfirmed}` | Reset to blank/null |
| `selectedCraft` | Reset to `null` |
| `selectedMentor` / `selectedMentorCountry` | Reset to `null` |
| `selectedLevel` | Reset to `null` |
| `currentSmokecraftStep` | Reset to `null` |
| `latestStampId` | Reset to `null` |
| `goldenBoxProgress` | Reset to `null` |
| `smokeCraft.*` (currentSession, completedSessions, sessionScores, flavorPreferences, strengthTolerance, aromaInterests, vitolaPreferences, pairingSelections, soilSeedSelections, mentorNotes, passportConnections, networkingStatus, networkingConsent) | Reset to `BLANK_SMOKE_CRAFT` defaults |
| `goldenBox.*` (eligible, progress, entries, lastReveal) | Reset to `BLANK_GOLDEN_BOX` defaults |
| `completedSteps` | Filtered to `PRESERVED_COMPLETED_STEP_IDS` (`['enroll']`) |

## `GuestSessionContext` fields explicitly NOT reset (preserved)

| Field | Why |
|---|---|
| `xp`, `rank`, `badges`, `smokecraftStamps` | Cumulative, cross-journey account state — disclosed, pre-existing design decision |
| `passport.*` | Canonical Passport identity and earned stamps — must survive a new journey |
| `guestId`, `venueId`, `deviceId`, `sessionId` | Identity/device anchors, not journey content |
| `skillScore`, `challengeScore`, `loyaltyPoints`, `lifetimeLoyaltyPoints`, `redeemablePoints`, `passportStampCount`, `purchaseCount`, loyalty ledger | Loyalty/scoring ledgers, cumulative account state |
| `preferences.*` | Accessibility/audio/haptics/language settings |

## `SmokeCraftJourneyContext` (`sc_journey_v1` localStorage key) — reset by the pre-existing `startNewJourney()`, unchanged this pass

`activeJourneyId` (minted new), `welcomeExperience`, `welcomeViewedAt`, `learningObjectivesViewed`, `s1CompletedAt`, `currentScreenId`, `mentor`, `meetYourCigar`, `mentorCommentary`, `format`, `seedSoil`, `terroir`, `knowledgeDrop`, `pairing`, `selectedCigar`, `requestPurchase`, `cutToastLight`, `firstThird`, `secondThird`, `flavorMemory`, `finalThird`, `scorecard`, `finalReview`, `passportStamp`, `connections`, `sessionCompletion`, `aiSummary`, `pairingRecommendations`, `goldenBox` — all reset to `null`.

## `SmokeCraftJourneyContext` fields explicitly NOT reset (preserved, unchanged pre-existing decision)

`selectedVenue`, `venueSelectionCompleted`, `lastEntryScreen`, `rewards`, `achievements`, `stateVersion`, `spineVersion`, `previousCompletedJourneys` (append-only archive).

## Not found / not applicable

The mandate's placeholder key names (`smokecraftJourney`, `smokecraftProgress`, `currentSession` as a top-level key, `quizAnswers`, `assessmentResults`, `skillTree`, `collections`, `challengeHub`, `blendFault`, `fillerArrangement`, `packagingStudio`, `packagingDesignId`, `packagingSubmissionId`, `results`, `awards`, `recommendedNextJourney`) do not exist as separate top-level localStorage keys — Skill Tree, Collections, Challenge Hub, Blend Fault, and Filler Arrangement all persist their real, per-guest evidence **server-side**, keyed by the guest-session cookie identity, not by any SmokeCraft "journey ID" — they are cross-journey, per-learner achievement records by design (same architecture Passport reads from), not journey-scoped state. Golden Box entries and Packaging Studio designs are likewise server-persisted, keyed by `entryId`/`designId` and guest identity — a new SmokeCraft journey does not automatically un-link a guest from an in-progress Golden Box entry created under the old journey, because Golden Box competitions are their own independent, non-numbered "supporting module" (confirmed in the Phase Architecture Reconciliation pass) with their own lifecycle, not reset by SmokeCraft's own Start action. This is disclosed, not silently assumed.
