export const RANKING_DATA = {
  venueId:     'grand-lounge',
  venueName:   'Grand Lounge',
  sessionName: "Tonight's Ranking",
  currentUserId: 'john-collins',
  updatedAt:   new Date().toISOString(),

  users: [
    {
      id: 'sebastian-harrow', rank: 1, name: 'Sebastian Harrow',
      initials: 'SH', xp: 1740, tier: 'Connoisseur',
      progressPercent: 88, badgeType: 'gold-crown', hue: 160,
      recentActions: ['Event Check-In +50 XP', 'Craft Stamp +100 XP', 'Connection +75 XP'],
    },
    {
      id: 'marco-del-valle', rank: 2, name: 'Marco Del Valle',
      initials: 'MD', xp: 1580, tier: 'Aficionado',
      progressPercent: 78, badgeType: 'silver-medal', hue: 210,
      recentActions: ['Session Check-In +25 XP', 'Craft Stamp +100 XP'],
    },
    {
      id: 'vincent-ashworth', rank: 3, name: 'Vincent Ashworth',
      initials: 'VA', xp: 1285, tier: 'Aficionado',
      progressPercent: 68, badgeType: 'bronze-medal', hue: 280,
      recentActions: ['Event Entry +50 XP', 'Profile Check +25 XP'],
    },
    {
      id: 'rafael-cienfuegos', rank: 4, name: 'Rafael Cienfuegos',
      initials: 'RC', xp: 1100, tier: 'Aficionado',
      progressPercent: 57, badgeType: 'bronze-ring', hue: 340,
      recentActions: ['Connection +75 XP'],
    },
    {
      id: 'john-collins', rank: 5, name: 'John M Collins',
      initials: 'JC', xp: 950, tier: 'Aficionado',
      progressPercent: 47, badgeType: 'current-user-gold', hue: 45,
      isCurrentUser: true,
      recentActions: ['Event Entry +50 XP', 'Connection +75 XP', 'VIP Stamp +150 XP'],
    },
    {
      id: 'adrian-moreau', rank: 6, name: 'Adrian Moreau',
      initials: 'AM', xp: 820, tier: 'Aficionado',
      progressPercent: 41, badgeType: 'aficionado', hue: 190,
      recentActions: ['Session Check-In +25 XP'],
    },
    {
      id: 'daniel-torres', rank: 7, name: 'Daniel Torres',
      initials: 'DT', xp: 730, tier: 'Aficionado',
      progressPercent: 36, badgeType: 'aficionado', hue: 20,
      recentActions: ['Profile Check +25 XP'],
    },
    {
      id: 'luca-santoro', rank: 8, name: 'Luca Santoro',
      initials: 'LS', xp: 610, tier: 'Aficionado',
      progressPercent: 30, badgeType: 'aficionado', hue: 260,
      recentActions: ['Connection +75 XP'],
    },
    {
      id: 'james-whitaker', rank: 9, name: 'James Whitaker',
      initials: 'JW', xp: 540, tier: 'Aficionado',
      progressPercent: 27, badgeType: 'aficionado', hue: 300,
      recentActions: ['Session Check-In +25 XP'],
    },
    {
      id: 'patrick-bishop', rank: 10, name: 'Patrick Bishop',
      initials: 'PB', xp: 420, tier: 'Aficionado',
      progressPercent: 21, badgeType: 'aficionado', hue: 130,
      recentActions: ['Profile Check +25 XP'],
    },
  ],

  tiers: [
    { id: 'aficionado',  name: 'Aficionado',  minXp: 0,    maxXp: 999,  color: '#C9A84C', description: 'Entry into the cigar society. Begin your journey and earn your first stamps.' },
    { id: 'connoisseur', name: 'Connoisseur', minXp: 1000, maxXp: 2499, color: '#D4820A', description: 'A seasoned member. Your palate is recognized and your rank commands respect.' },
    { id: 'sommelier',   name: 'Sommelier',   minXp: 2500, maxXp: 4999, color: '#B8860B', description: 'Elite status. You are a master of the craft, guiding others in the Grand Lounge.' },
    { id: 'patron',      name: 'Patron',      minXp: 5000, maxXp: null, color: '#8B0000', description: 'The pinnacle. Patrons shape the culture and legacy of the Brotherhood.' },
  ],
}

export const RECENT_RANKING_ACTIVITY = [
  { id: 'act-1', type: 'event-entry',    icon: 'event',       title: 'Event Entry',             desc: 'Cigar & Cognac Collectors Night', xp: 50,  ago: '34 min ago',  badgeId: 'event-entry'         },
  { id: 'act-2', type: 'connection',     icon: 'handshake',   title: 'Connection Verified',     desc: 'Connected with David Harper',      xp: 75,  ago: '1 hr ago',    badgeId: 'connection-verified'  },
  { id: 'act-3', type: 'profile-check',  icon: 'visibility',  title: 'Profile Check',           desc: 'Alicia Chen viewed your passport', xp: 25,  ago: '1 hr ago',    badgeId: 'profile-check'       },
  { id: 'act-4', type: 'craft-stamp',    icon: 'workspace_premium', title: 'Craft Stamp Earned', desc: 'Collector Night Stamp',           xp: 100, ago: '2 hr ago',    badgeId: 'craft-stamp'         },
  { id: 'act-5', type: 'vip-stamp',      icon: 'stars',       title: 'VIP Stamp Unlocked',      desc: 'VIP access unlocked — Grand Lounge', xp: 150, ago: '2 hr ago', badgeId: 'vip-stamp'           },
]

export const BADGES_DATA = [
  { id: 'gold-crown',         name: 'Grand Champion',       category: 'rank',        color: '#C9A84C', description: 'Achieved #1 ranking in the Grand Lounge.',           unlockRequirement: 'Reach rank #1 on the leaderboard.',                   xpValue: 200 },
  { id: 'silver-medal',       name: 'Silver Contender',     category: 'rank',        color: '#C0C0C0', description: 'Achieved top 3 ranking.',                            unlockRequirement: 'Reach top 3 on the leaderboard.',                     xpValue: 100 },
  { id: 'bronze-medal',       name: 'Bronze Honor',         category: 'rank',        color: '#CD7F32', description: 'Achieved top 5 ranking.',                            unlockRequirement: 'Reach top 5 on the leaderboard.',                     xpValue: 75  },
  { id: 'aficionado',         name: 'Aficionado',           category: 'tier',        color: '#C9A84C', description: 'Inducted into the society as an Aficionado.',        unlockRequirement: 'Earn 0–999 XP.',                                      xpValue: 50  },
  { id: 'connoisseur',        name: 'Connoisseur',          category: 'tier',        color: '#D4820A', description: 'Elevated to Connoisseur status.',                    unlockRequirement: 'Earn 1,000+ XP.',                                     xpValue: 100 },
  { id: 'sommelier',          name: 'Sommelier',            category: 'tier',        color: '#B8860B', description: 'Master-level cigar sommelier.',                      unlockRequirement: 'Earn 2,500+ XP.',                                     xpValue: 200 },
  { id: 'patron',             name: 'Patron',               category: 'tier',        color: '#8B0000', description: 'Pinnacle. Patron of the Brotherhood.',               unlockRequirement: 'Earn 5,000+ XP.',                                     xpValue: 500 },
  { id: 'event-entry',        name: 'Event Entrant',        category: 'activity',    color: '#1A5276', description: 'Attended an official Brotherhood 360 event.',         unlockRequirement: 'Check into any Brotherhood event.',                   xpValue: 50  },
  { id: 'connection-verified',name: 'Connected Member',     category: 'activity',    color: '#196F3D', description: 'Verified a passport connection with another member.', unlockRequirement: 'Complete 1 verified connection.',                     xpValue: 75  },
  { id: 'profile-check',      name: 'Profile Recognized',   category: 'activity',    color: '#6C3483', description: 'Your passport was viewed by another member.',         unlockRequirement: 'Have your profile viewed.',                           xpValue: 25  },
  { id: 'craft-stamp',        name: 'Craft Collector',      category: 'achievement', color: '#784212', description: 'Earned a collectible craft stamp.',                   unlockRequirement: 'Earn any craft stamp at an event.',                   xpValue: 100 },
  { id: 'vip-stamp',          name: 'VIP Access',           category: 'achievement', color: '#1A1A1A', description: 'Unlocked VIP access to the Grand Lounge.',           unlockRequirement: 'Earn VIP stamp at a premium event.',                  xpValue: 150 },
]
