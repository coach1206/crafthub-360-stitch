// Phases 7-10 — Mentor guidance surfaced on the cut/toast/light and tasting
// pages. Reads only the real mentor(s) the guest actually selected in Phase 4
// (session.mentors[]); the phase-specific guidance sentence is generic
// procedural framing, not an invented fact about the mentor. Returns null
// when no mentor was selected, so the UI can honestly show "no mentor
// selected" rather than fabricating one.

const PHASE_TIPS = {
  'cut-toast-light': 'suggests going slow with the toast and letting the foot catch evenly before you draw.',
  'first-third':     'recommends letting the early aromas settle for a minute before judging body or strength.',
  'second-third':    'watches for how the flavor shifts mid-cigar — this is usually where complexity shows.',
  'final-third':     'advises staying patient through the final third — heat builds late, so slow your pace.',
}

export function getMentorGuidance(session, phaseKey) {
  const mentors = Array.isArray(session?.mentors) ? session.mentors : []
  const mentor = mentors[0] || null
  if (!mentor?.name) return null
  const tipBase = PHASE_TIPS[phaseKey] || 'is guiding your tasting session.'
  return {
    mentorName: mentor.name,
    mentorCountry: mentor.country || null,
    tip: `${mentor.name} ${tipBase}`,
    bio: mentor.bio || null,
  }
}
