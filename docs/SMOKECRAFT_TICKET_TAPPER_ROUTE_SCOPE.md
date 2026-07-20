# SmokeCraft Ticket Tapper — Route Scope

| Route | Mode | Notes |
|---|---|---|
| SmokeCraft Venue Commerce (`venue-commerce`, `order`, `ticket-tapper/staff-specials`) | Full (existing, unchanged) | Real venue ID now sourced from `journey.selectedVenue`, previously hardcoded |
| `/smokecraft/venue-select` | Compact (new) | Shown after venue selection; honest "select a venue" state before |
| `/smokecraft/session-complete` | Compact (new) | Shown in reserved normal-flow space after all completion/reward sections |
| All other 30 full-bleed journey routes (Golden Box, Mentor Selection, Seed & Soil, Humidor Match, Meet Your Cigar, Terroir, Format, Request/Purchase, Cut/Toast/Light, Lighting Tutorial, First/Second/Final Third, Flavor Memory, Pairing Lab, Mentor Commentary, Knowledge Drop, Scorecard, AI Summary, Pairing Recommendations, Passport Stamp, Final Review, Rewards, Achievements, Connections, Management Sync) | Hidden | No Ticket Tapper code present — these screens use `SmokeCraftImageBoundsOverlay` full-bleed approved-image compositions with no reserved normal-flow space; adding a strip here would require new layout work and risks the already visually-approved compositions (Pairing Lab, Request/Purchase specifically) |

Management Sync is explicitly excluded per instruction, separate from the
general full-bleed-route exclusion above.
