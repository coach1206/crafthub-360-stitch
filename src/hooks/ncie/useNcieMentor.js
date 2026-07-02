import { useState, useCallback } from 'react'
import { getAvailableMentors, selectMentor, openMentorSession, closeMentorSession } from '../../services/ncie/mentorEngine.js'
import { getAIStatus } from '../../services/ncie/openAiEducationClient.js'

export function useNcieMentor(moduleId = 'smokecraft') {
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [activeSession, setActiveSession]   = useState(null)
  const [isOpen, setIsOpen]                 = useState(false)

  const aiStatus     = getAIStatus()
  const mentorsResult = getAvailableMentors(moduleId)

  const chooseMentor = useCallback((mentorId) => {
    const result = selectMentor(moduleId, mentorId)
    if (result.ok) setSelectedMentor(result.mentor)
    return result
  }, [moduleId])

  const startSession = useCallback((guestId, mentorId = null, topicContext = null) => {
    const result = openMentorSession(guestId, moduleId, mentorId ?? selectedMentor?.mentorId, topicContext)
    if (result.ok) { setActiveSession(result); setIsOpen(true) }
    return result
  }, [moduleId, selectedMentor])

  const endSession = useCallback(() => {
    if (activeSession?.sessionId) closeMentorSession(activeSession.sessionId)
    setActiveSession(null)
    setIsOpen(false)
  }, [activeSession])

  return {
    mentors:        mentorsResult.mentors ?? [],
    selectedMentor,
    activeSession,
    isOpen,
    chooseMentor,
    startSession,
    endSession,
    openDrawer:     () => setIsOpen(true),
    closeDrawer:    () => setIsOpen(false),
    aiStatus:       aiStatus.aiStatus,
    aiAvailable:    aiStatus.aiAvailable,
    mentorStatus:   'mentor_preview',
    moduleId,
  }
}
