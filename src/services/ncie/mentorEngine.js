/**
 * NCIE Mentor Engine
 * Manages mentor selection, session context, and response framing.
 * OpenAI personalizes tone and explanation — internal outlines remain the source of truth.
 * Returns ai_unavailable when OpenAI key is not configured.
 */

import { getMentorsForCraft, getMentorById, getDefaultMentor } from '../../data/ncie/mentorProfiles.js'

const mentorSessionStore = new Map()

export function getAvailableMentors(moduleId) {
  const mentors = getMentorsForCraft(moduleId)
  return {
    ok:           true,
    moduleId,
    mentors:      mentors.map(m => ({
      mentorId:     m.mentorId,
      displayName:  m.displayName,
      archetype:    m.archetype,
      teachingStyle: m.teachingStyle,
      specialties:  m.specialties,
      signaturePhrase: m.signaturePhrase,
    })),
    mentorMode:   'mentor_available',
    aiStatus:     'ai_personalization_preview',
  }
}

export function selectMentor(moduleId, mentorId = null) {
  const mentor = mentorId
    ? getMentorById(moduleId, mentorId)
    : getDefaultMentor(moduleId)

  if (!mentor) {
    return { ok: false, error: 'mentor_not_found', moduleId, mentorId }
  }

  return {
    ok:           true,
    mentor,
    selectionMode: 'mentor_selected',
    aiPersonaHint: mentor.aiPersonaHint,
    aiStatus:     'ai_personalization_preview',
    message:      'Mentor selected. AI personalization is preview-only without a verified OpenAI key.',
  }
}

export function openMentorSession(guestId, moduleId, mentorId = null, topicContext = null) {
  if (!guestId || !moduleId) return { ok: false, error: 'missing_required_fields' }

  const mentorResult = selectMentor(moduleId, mentorId)
  if (!mentorResult.ok) return mentorResult

  const sessionId = `ms_${guestId}_${moduleId}_${Date.now()}`
  const session = {
    sessionId,
    guestId,
    moduleId,
    mentorId:     mentorResult.mentor.mentorId,
    topicContext,
    openedAt:     new Date().toISOString(),
    status:       'session_open',
    messages:     [],
  }
  mentorSessionStore.set(sessionId, session)

  return {
    ok:          true,
    sessionId,
    mentor:      mentorResult.mentor,
    topicContext,
    sessionStatus: 'session_open',
    aiStatus:    'ai_personalization_preview',
    storageMode: 'memory_fallback',
    message:     'Mentor session opened. AI-personalized responses are preview-only without a verified OpenAI key.',
  }
}

export function buildMentorPromptContext(session, userQuestion) {
  const mentor = getMentorById(session.moduleId, session.mentorId)
  if (!mentor) return null

  return {
    systemPersona:  mentor.aiPersonaHint,
    topicContext:   session.topicContext,
    userQuestion,
    instructionNote: 'You are providing educational guidance only. Do not give financial advice, tax advice, medical advice, or legal advice. Do not claim live AI capability. Do not fabricate facts. The internal NCIE knowledge outline is the source of truth.',
    safetyGuard: 'Never share payment data, bank account information, Stripe tokens, tax IDs, or sensitive venue/vendor records.',
  }
}

export function closeMentorSession(sessionId) {
  const session = mentorSessionStore.get(sessionId)
  if (!session) return { ok: false, error: 'session_not_found', sessionId }

  session.status   = 'session_closed'
  session.closedAt = new Date().toISOString()
  mentorSessionStore.set(sessionId, session)

  return {
    ok:          true,
    sessionId,
    sessionStatus: 'session_closed',
    storageMode: 'memory_fallback',
  }
}

export function getMentorSession(sessionId) {
  const session = mentorSessionStore.get(sessionId)
  if (!session) return { ok: false, error: 'session_not_found', sessionId }
  return { ok: true, ...session, storageMode: 'memory_fallback' }
}
