// Holistic Fix 2E-6 — real, per-session educational enrichment content,
// PREPARED BUT NOT YET WIRED INTO ANY SCREEN.
//
// This content was written specifically for each lesson (not generic pasted
// wording) to close the "Golden Box relevance" and "Why It Matters"
// coverage gaps found by the Holistic Fix 2E-5 real-content audit. An
// initial attempt to inject it centrally via SmokeCraftScreenRenderer was
// built, screenshot-tested live, and found to cause a real visual
// regression: several session components (e.g. Terroir.jsx, HumidorMatch.jsx)
// already render their own phase/session indicator at the exact same
// top-of-viewport position (in a different format, sometimes baked into an
// approved background image), so the centralized banner overlapped and
// duplicated existing content instead of filling a real gap. That renderer
// change was reverted (see git history) rather than ship a confirmed
// regression. This content is kept here, unreferenced, as verified-accurate
// real copy ready for a future PER-FILE integration pass that checks each
// of the 18 affected screens individually via a real screenshot before
// merging — the centralized-injection approach is not safe for this
// heterogeneous a set of pre-existing layouts. See
// SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md and the Holistic Fix 2E-6
// report for the full disclosure.
export const SMOKECRAFT_EDUCATIONAL_ENRICHMENT = {
  2: {
    whyItMatters: 'How you dial in a humidor\'s temperature, humidity, and airflow determines whether a cigar arrives at your table properly conditioned — under-humidified tobacco burns hot and harsh; over-humidified tobacco burns slow and uneven.',
    goldenBox: 'The cigar and conditioning choices you make here become the raw material every later Golden Box judging criterion (construction, burn, draw) is scored against.',
  },
  3: {
    whyItMatters: 'A cigar\'s wrapper, binder, filler, and factory of origin are the blend\'s fingerprint — they set the baseline flavor, strength, and construction expectations before you ever light it.',
    goldenBox: 'Golden Box judges score blend composition directly against these same attributes (wrapper leaf, binder, filler mix) — knowing them here is what lets you explain your blend\'s intent later.',
  },
  4: {
    whyItMatters: 'Terroir — the soil, climate, and growing conditions a leaf was grown in — is why two cigars using the same tobacco type can still taste completely different.',
    goldenBox: 'Golden Box presentations that cite real terroir reasoning (why a Nicaraguan vs. Dominican leaf changes the profile) score higher on blend-narrative categories than presentations that only describe flavor without explaining its origin.',
  },
  5: {
    whyItMatters: 'Ring gauge and vitola (shape/size) change burn time, draw resistance, and how quickly flavors intensify through the smoke — a thicker ring gauge burns cooler and slower than a thin one.',
    goldenBox: 'Golden Box construction scoring includes vitola-appropriateness — a blend built for a Robusto that gets rolled into a Churchill will burn and taste differently than intended.',
  },
  6: {
    whyItMatters: 'The cut style (straight, V-cut, or punch) changes how much of the cap is opened and therefore how concentrated or diffuse the draw feels on the tongue.',
    goldenBox: 'Recommending the right cut for your own blend\'s wrapper and cap construction is part of a complete Golden Box presentation — a wrapper that cracks under a straight cut needs a different recommendation.',
  },
  7: {
    whyItMatters: 'An uneven light causes tunneling, canoeing, and an inconsistent burn line for the entire smoking session — the lighting technique is a real, physical cause of downstream construction complaints, not superstition.',
    goldenBox: 'A Golden Box entry can have perfect construction and still burn poorly if lit incorrectly during judging — this technique protects your own blend\'s presentation.',
  },
  8: {
    whyItMatters: 'The first third establishes your baseline aroma, draw, body, flavor, and burn readings — every later comparison (second third, final third) is measured against what you record here.',
    goldenBox: 'Golden Box judging scorecards use exactly this same first-third/second-third/final-third structure — practicing structured tasting notes here is direct rehearsal for judging your own or others\' entries.',
  },
  10: {
    whyItMatters: 'Flavor memory — associating specific tasting notes (pepper, cedar, cocoa, leather) with intensity and body — is what lets you describe a blend precisely instead of just saying "good" or "harsh."',
    goldenBox: 'Precise flavor-wheel vocabulary is exactly what a Golden Box blend narrative needs to justify why specific leaves were chosen for a specific flavor target.',
  },
  11: {
    whyItMatters: 'Pairing decisions (spirit, coffee, or food alongside a cigar) work by either complementing or contrasting the cigar\'s existing flavor and strength — matching a delicate cigar with an overpowering spirit erases the cigar\'s nuance.',
    goldenBox: 'A Golden Box presentation that includes a well-reasoned pairing recommendation demonstrates a deeper understanding of the blend\'s flavor profile, which is part of how presentation is judged.',
  },
  12: {
    whyItMatters: 'The second third is where a cigar\'s flavor typically evolves and intensifies — tracking that evolution (not just a single impression) is what separates a real tasting record from a guess.',
    goldenBox: 'Golden Box scorecards explicitly reward noting flavor evolution across thirds — this is the same skill, practiced live.',
  },
  14: {
    whyItMatters: 'A mentor\'s real-time commentary connects the technical facts you\'ve just learned (terroir, construction, flavor) to lived tasting experience — the kind of context a textbook fact alone doesn\'t provide.',
    goldenBox: 'Mentor guidance often flags exactly the kind of blend-composition reasoning Golden Box judges look for in a strong entry narrative.',
  },
  15: {
    whyItMatters: 'These knowledge-drop topics (tobacco types, fermentation, aging, factory story) are the deeper "why" behind flavor and construction facts introduced earlier in the session.',
    goldenBox: 'Fermentation and aging knowledge in particular directly explains why two blends using the same leaf types can still taste completely different — a common Golden Box judging discussion point.',
  },
  16: {
    whyItMatters: 'The final third is where strength, aftertaste, and overall balance are judged — a cigar that started strong but falls apart in construction or flavor by the final third scores lower than one that stays consistent.',
    goldenBox: 'Golden Box judging explicitly weighs whether a blend holds together through the final third — this is the same evaluation, practiced live.',
  },
  19: {
    whyItMatters: 'The scorecard\'s six categories (Appearance, Construction, Draw, Burn, Flavor, Pairing Match) are the same structured framework used to evaluate any cigar objectively rather than just impressionistically.',
    goldenBox: 'This is, verbatim, the Golden Box judging rubric — completing this scorecard is direct practice for how your own entry will be evaluated.',
  },
  21: {
    whyItMatters: 'Summarizing your own flavor, strength, and construction observations across an entire session turns scattered tasting notes into one coherent profile.',
    goldenBox: 'A coherent flavor/strength/construction summary is exactly the shape of a strong Golden Box blend narrative — this session is practice writing one.',
  },
  22: {
    whyItMatters: 'Personalized pairing recommendations apply everything learned about flavor, strength, and origin to a concrete real-world choice (what to drink or eat alongside this specific cigar).',
    goldenBox: 'Explaining *why* a pairing works (not just naming one) is the same reasoning skill Golden Box judges reward in a blend\'s presentation narrative.',
  },
  23: {
    whyItMatters: 'The Passport Stamp marks a real milestone — completing the tasting and evaluation portion of the journey — before moving into reflection and connections.',
    goldenBox: 'Completing this stamp unlocks the Connections/Golden Box-adjacent supporting content for this visit.',
  },
  24: {
    whyItMatters: 'Reviewing your completed scorecard as a whole — not category by category — is how you form an overall verdict on a cigar, which is the actual judging task.',
    goldenBox: 'A completed, coherent scorecard review is the direct output format a Golden Box judge produces for every entry they evaluate.',
  },
  27: {
    whyItMatters: 'Recommending a next journey based on what was learned and tasted this session reinforces the material and points toward what to explore next.',
    goldenBox: 'Recommended next steps often point toward Golden Box participation directly — this is the natural on-ramp from curriculum to competition.',
  },
}

export function getEducationalEnrichment(sessionNumber) {
  return SMOKECRAFT_EDUCATIONAL_ENRICHMENT[sessionNumber] || null
}
