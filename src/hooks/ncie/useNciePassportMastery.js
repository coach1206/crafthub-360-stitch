import { useState, useCallback } from 'react'
import { getPassportMasteryProfile, awardXP, getMasteryReadiness } from '../../services/ncie/passportMasteryEngine.js'

export function useNciePassportMastery(moduleId = 'smokecraft') {
  const [profile, setProfile]   = useState(null)
  const [isOpen, setIsOpen]     = useState(false)

  const readiness = getMasteryReadiness(moduleId)

  const loadProfile = useCallback((guestId, options = {}) => {
    const result = getPassportMasteryProfile(guestId, moduleId, options)
    if (result.ok) setProfile(result)
    return result
  }, [moduleId])

  const addXP = useCallback((guestId, awardType, options = {}) => {
    const result = awardXP(guestId, moduleId, awardType, options)
    if (result.ok && profile) {
      setProfile(prev => prev ? { ...prev, craftXP: result.craftXP, globalXP: result.globalXP, craftLevel: result.craftLevel } : prev)
    }
    return result
  }, [moduleId, profile])

  return {
    profile,
    isOpen,
    loadProfile,
    addXP,
    openDrawer:      () => setIsOpen(true),
    closeDrawer:     () => setIsOpen(false),
    readiness,
    passportStatus:  'passport_preview',
    masteryStatus:   'mastery_preview',
    passportNote:    'SmokeCraft Passport stamp locks are enforced by session.js. This hook provides XP and mastery data only.',
    moduleId,
  }
}
