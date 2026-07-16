/**
 * knowledgeCheckQuestions.js
 *
 * Reusable question model + question sets for the Knowledge Check / Text
 * Quiz supporting module (Package O). Every question is structured data —
 * the KnowledgeCheck component (src/components/smokecraft/KnowledgeCheck.jsx)
 * never hardcodes question content, only rendering/validation logic.
 *
 * ── Question model ──────────────────────────────────────────────────────
 * {
 *   id: string,                 // stable, unique within its set
 *   type: QuestionType,         // see QUESTION_TYPES below
 *   prompt: string,             // the question text
 *   choices?: Choice[],         // multiple-choice / true-false / multi-select / image-id
 *   items?: string[],           // ordering — items in scrambled starting order
 *   correctOrder?: string[],    // ordering — the correct sequence (same strings as items)
 *   pairs?: { left: string, right: string }[], // matching — correct left→right pairs
 *   accepted?: string[],        // fill-blank — accepted answers (case/whitespace-insensitive)
 *   correctAnswer?: string,     // multiple-choice/true-false/image-id — the correct choice id
 *   correctAnswers?: string[],  // multi-select — the correct choice ids
 *   explanation: string,        // shown after answering, right or wrong
 *   reference?: string,         // optional educational reference / "learn more" pointer
 * }
 * type Choice = { id: string, label: string, swatch?: string } // swatch = optional CSS color for image-id honest fallback
 *
 * ── Question sets ───────────────────────────────────────────────────────
 * Keyed by moduleId, matching the educational module a Knowledge Check can
 * be launched after. No question set here is wired into any of those
 * modules' actual screens this package — see Package O evidence.
 */

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  MULTI_SELECT: 'multi-select',
  IMAGE_ID: 'image-id',
  ORDERING: 'ordering',
  MATCHING: 'matching',
  FILL_BLANK: 'fill-blank',
}

export const KNOWLEDGE_CHECK_SETS = {
  terroir: {
    moduleId: 'terroir',
    title: 'Terroir Knowledge Check',
    questions: [
      {
        id: 'terroir-q1',
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        prompt: 'Which factor is NOT typically considered part of a cigar’s terroir?',
        choices: [
          { id: 'soil', label: 'Soil composition' },
          { id: 'climate', label: 'Regional climate' },
          { id: 'humidor-brand', label: 'Humidor brand used at home' },
          { id: 'elevation', label: 'Growing elevation' },
        ],
        correctAnswer: 'humidor-brand',
        explanation: 'Terroir refers to the natural growing environment — soil, climate, and elevation — not equipment used after the leaf is harvested.',
        reference: 'See: Terroir session — Growing Conditions section.',
      },
      {
        id: 'terroir-q2',
        type: QUESTION_TYPES.TRUE_FALSE,
        prompt: 'The same tobacco seed planted in two different regions will taste identical.',
        choices: [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }],
        correctAnswer: 'false',
        explanation: 'Terroir means the growing environment shapes flavor — identical seed, different soil and climate, different result.',
        reference: 'See: Terroir session — Why It Matters section.',
      },
    ],
  },
  'meet-your-cigar': {
    moduleId: 'meet-your-cigar',
    title: 'Meet Your Cigar Knowledge Check',
    questions: [
      {
        id: 'myc-q1',
        type: QUESTION_TYPES.MATCHING,
        prompt: 'Match each cigar component to its role.',
        pairs: [
          { left: 'Wrapper', right: 'Outer leaf, largest flavor influence' },
          { left: 'Binder', right: 'Holds the filler bundle together' },
          { left: 'Filler', right: 'Blended interior tobacco leaves' },
        ],
        explanation: 'Wrapper, binder, and filler each play a distinct structural and flavor role in a cigar’s construction.',
        reference: 'See: Meet Your Cigar session — Wrapper/Binder/Filler sections.',
      },
    ],
  },
  format: {
    moduleId: 'format',
    title: 'Construction Inspection Knowledge Check',
    questions: [
      {
        id: 'construction-q1',
        type: QUESTION_TYPES.MULTI_SELECT,
        prompt: 'Which of these are signs of good cigar construction? (Select all that apply)',
        choices: [
          { id: 'even-color', label: 'Even wrapper color' },
          { id: 'soft-spots', label: 'Soft spots along the length' },
          { id: 'firm-consistent', label: 'Firm, consistent feel when squeezed' },
          { id: 'visible-veins-minimal', label: 'Minimal, tight visible veins' },
        ],
        correctAnswers: ['even-color', 'firm-consistent', 'visible-veins-minimal'],
        explanation: 'Soft spots usually indicate uneven rolling or air pockets — the opposite of good construction.',
        reference: 'See: Construction Inspection session.',
      },
    ],
  },
  'cut-toast-light': {
    moduleId: 'cut-toast-light',
    title: 'Choose Your Cut Knowledge Check',
    questions: [
      {
        id: 'cut-q1',
        type: QUESTION_TYPES.IMAGE_ID,
        prompt: 'Which cut style removes a wedge-shaped notch from the cap?',
        choices: [
          { id: 'straight', label: 'Straight Cut', swatch: '#6b4a2b' },
          { id: 'v-cut', label: 'V-Cut', swatch: '#8a5a2e' },
          { id: 'punch', label: 'Punch Cut', swatch: '#4a3220' },
        ],
        correctAnswer: 'v-cut',
        explanation: 'A V-Cut (wedge/cat’s eye cut) removes a wedge-shaped notch, concentrating the draw.',
        reference: 'See: Choose Your Cut session.',
      },
    ],
  },
  'lighting-tutorial': {
    moduleId: 'lighting-tutorial',
    title: 'Lighting Tutorial Knowledge Check',
    questions: [
      {
        id: 'lighting-q1',
        type: QUESTION_TYPES.ORDERING,
        prompt: 'Put the lighting steps in the correct order.',
        items: ['Rotate over flame to toast foot evenly', 'Draw while lighting to establish an even burn', 'Cut the cap', 'Check the burn line and touch up if needed'],
        correctOrder: ['Cut the cap', 'Rotate over flame to toast foot evenly', 'Draw while lighting to establish an even burn', 'Check the burn line and touch up if needed'],
        explanation: 'Cut first, toast the foot evenly, draw while lighting, then confirm an even burn line.',
        reference: 'See: Lighting Tutorial session.',
      },
    ],
  },
  'first-third': {
    moduleId: 'first-third',
    title: 'Flavor Discovery Knowledge Check',
    questions: [
      {
        id: 'flavor-q1',
        type: QUESTION_TYPES.FILL_BLANK,
        prompt: 'The first third of a smoke is often used to establish the cigar’s baseline ____.',
        accepted: ['flavor profile', 'flavor', 'profile'],
        explanation: 'The first third sets a baseline flavor profile that later thirds are compared against as the smoke evolves.',
        reference: 'See: First Draw / Flavor Discovery session.',
      },
    ],
  },
  'mentor-commentary': {
    moduleId: 'mentor-commentary',
    title: 'Mentor Commentary Knowledge Check',
    questions: [
      {
        id: 'mentor-q1',
        type: QUESTION_TYPES.TRUE_FALSE,
        prompt: 'Mentor commentary is generated by a live AI model reacting to your smoke in real time.',
        choices: [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }],
        correctAnswer: 'false',
        explanation: 'Mentor Commentary is curated, human-authored content tied to your selected mentor — not AI-generated.',
        reference: 'See: Mentor Commentary session.',
      },
    ],
  },
  'knowledge-drop': {
    moduleId: 'knowledge-drop',
    title: 'Knowledge Drop Knowledge Check',
    questions: [
      {
        id: 'kd-q1',
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        prompt: 'Fermentation of tobacco leaves primarily affects which of the following?',
        choices: [
          { id: 'color-flavor', label: 'Color and flavor development' },
          { id: 'box-packaging', label: 'Box packaging design' },
          { id: 'price-only', label: 'Retail price only' },
          { id: 'humidor-size', label: 'Recommended humidor size' },
        ],
        correctAnswer: 'color-flavor',
        explanation: 'Fermentation breaks down sugars and ammonia in the leaf, shaping both color and flavor development.',
        reference: 'See: Knowledge Drop session — Fermentation topic.',
      },
    ],
  },
  'pairing-lab': {
    moduleId: 'pairing-lab',
    title: 'Suggested Pairings Knowledge Check',
    questions: [
      {
        id: 'pairing-q1',
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        prompt: 'A "Contrast" pairing goal is best described as:',
        choices: [
          { id: 'reinforce', label: 'Reinforcing the cigar’s existing flavor notes' },
          { id: 'sharpen', label: 'Providing a sharp counterpoint to sharpen perception' },
          { id: 'soften', label: 'Rounding and mellowing harsh edges' },
          { id: 'nothing', label: 'Having no effect on perceived flavor' },
        ],
        correctAnswer: 'sharpen',
        explanation: 'Contrast pairings intentionally differ from the cigar’s profile to sharpen the perceived contrast between the two.',
        reference: 'See: Suggested Pairings session — Pairing Goal selector.',
      },
    ],
  },
}

/** Returns the question set for a moduleId, or null if none exists yet. */
export function getKnowledgeCheckSet(moduleId) {
  return KNOWLEDGE_CHECK_SETS[moduleId] || null
}
