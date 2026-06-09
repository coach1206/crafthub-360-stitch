/**
 * Canonical ranking data — mirrors server/controllers/rankingController.js
 * Keep IDs, names, tier thresholds, and XP values in sync with the backend.
 */

export const RANKING_DATA = {
  venueId:       'grand-lounge',
  venueName:     'Grand Lounge',
  sessionName:   "Tonight's Ranking",
  currentUserId: 'user-john-collins',
  updatedAt:     new Date().toISOString(),

  users: [
    {
      id: 'user-sebastian-harrow',  rank: 1,  name: 'Sebastian Harrow',  initials: 'SH', hue: 45,
      xp: 1740, tier: 'Connoisseur', progressPercent: 88, badgeType: 'gold-crown',
      isCurrentUser: false, recentActions: ['Won top ranking', 'Craft stamp earned'],
    },
    {
      id: 'user-marco-del-valle',   rank: 2,  name: 'Marco Del Valle',   initials: 'MD', hue: 30,
      xp: 1580, tier: 'Aficionado',  progressPercent: 78, badgeType: 'silver-medal',
      isCurrentUser: false, recentActions: ['Event entry', 'Verified connection'],
    },
    {
      id: 'user-vincent-ashworth',  rank: 3,  name: 'Vincent Ashworth',  initials: 'VA', hue: 200,
      xp: 1285, tier: 'Aficionado',  progressPercent: 68, badgeType: 'bronze-medal',
      isCurrentUser: false, recentActions: ['Humidor check-in'],
    },
    {
      id: 'user-rafael-cienfuegos', rank: 4,  name: 'Rafael Cienfuegos', initials: 'RC', hue: 160,
      xp: 1100, tier: 'Aficionado',  progressPercent: 57, badgeType: 'bronze-ring',
      isCurrentUser: false, recentActions: ['Profile check'],
    },
    {
      id: 'user-john-collins',      rank: 5,  name: 'John M Collins',    initials: 'JC', hue: 45,
      xp: 950,  tier: 'Aficionado',  progressPercent: 47, badgeType: 'current-user-gold',
      isCurrentUser: true, recentActions: ['Connection verified', 'Craft stamp earned'],
    },
    {
      id: 'user-adrian-moreau',     rank: 6,  name: 'Adrian Moreau',     initials: 'AM', hue: 290,
      xp: 820,  tier: 'Aficionado',  progressPercent: 41, badgeType: 'aficionado',
      isCurrentUser: false, recentActions: [],
    },
    {
      id: 'user-daniel-torres',     rank: 7,  name: 'Daniel Torres',     initials: 'DT', hue: 100,
      xp: 730,  tier: 'Aficionado',  progressPercent: 36, badgeType: 'aficionado',
      isCurrentUser: false, recentActions: [],
    },
    {
      id: 'user-luca-santoro',      rank: 8,  name: 'Luca Santoro',      initials: 'LS', hue: 210,
      xp: 610,  tier: 'Aficionado',  progressPercent: 30, badgeType: 'aficionado',
      isCurrentUser: false, recentActions: [],
    },
    {
      id: 'user-james-whitaker',    rank: 9,  name: 'James Whitaker',    initials: 'JW', hue: 50,
      xp: 540,  tier: 'Aficionado',  progressPercent: 27, badgeType: 'aficionado',
      isCurrentUser: false, recentActions: [],
    },
    {
      id: 'user-patrick-bishop',    rank: 10, name: 'Patrick Bishop',    initials: 'PB', hue: 180,
      xp: 420,  tier: 'Aficionado',  progressPercent: 21, badgeType: 'aficionado',
      isCurrentUser: false, recentActions: [],
    },
  ],

  tiers: [
    { id: 'tier-aficionado',  name: 'Aficionado',  minXp: 0,    maxXp: 999,  color: '#C9A84C', badge: 'aficionado',  description: 'Entry rank for verified Grand Lounge participants.'             },
    { id: 'tier-connoisseur', name: 'Connoisseur', minXp: 1000, maxXp: 2499, color: '#D4820A', badge: 'connoisseur', description: 'Recognized member with deeper tasting and pairing access.'     },
    { id: 'tier-sommelier',   name: 'Sommelier',   minXp: 2500, maxXp: 4999, color: '#B8860B', badge: 'sommelier',   description: 'Elite member with curated pairing and event privileges.'       },
    { id: 'tier-patron',      name: 'Patron',      minXp: 5000, maxXp: null, color: '#8B0000', badge: 'patron',      description: 'Highest status tier with premium access and private benefits.' },
  ],
}

// ── Recent activity shown in the right column of the Leaderboard ─────────────
export const RECENT_RANKING_ACTIVITY = [
  { id: 'ra01', title: 'Event Entry',         desc: 'Cigar & Cognac Collectors Night',    xp: 50,  icon: 'event',             ago: '34 min ago', badgeId: 'b003' },
  { id: 'ra02', title: 'Connection Verified',  desc: 'Connected with Rafael Cienfuegos',   xp: 75,  icon: 'verified',          ago: '1 hr ago',   badgeId: 'b002' },
  { id: 'ra03', title: 'Profile Check',        desc: 'Adrian Moreau viewed your passport', xp: 25,  icon: 'visibility',        ago: '1 hr ago',   badgeId: null   },
  { id: 'ra04', title: 'Craft Stamp Earned',   desc: 'Collector Night Stamp',              xp: 100, icon: 'workspace_premium', ago: '2 hr ago',   badgeId: 'b004' },
  { id: 'ra05', title: 'VIP Stamp Unlocked',   desc: 'VIP access unlocked — Grand Lounge', xp: 150, icon: 'stars',             ago: '2 hr ago',   badgeId: 'b005' },
]

// ── Badge catalog (frontend copy — backend is source of truth) ────────────────
export const BADGES_DATA = [
  { id: 'b001', name: 'First Smoke',           color: '#C9A84C', description: 'Checked into your first Grand Lounge session.',          category: 'activity'    },
  { id: 'b002', name: 'Connection Made',       color: '#4CAF90', description: 'Verified your first Brotherhood connection.',            category: 'activity'    },
  { id: 'b003', name: 'Event Insider',         color: '#4A90D9', description: 'Attended a Grand Lounge featured event.',                category: 'activity'    },
  { id: 'b004', name: 'Craft Collector',       color: '#D4820A', description: 'Earned your first CraftHub stamp.',                      category: 'achievement' },
  { id: 'b005', name: 'VIP Access',            color: '#9C27B0', description: 'Unlocked VIP access at the Grand Lounge.',               category: 'achievement' },
  { id: 'b006', name: 'Connoisseur Ascent',    color: '#D4820A', description: 'Reached Connoisseur tier (1,000 XP).',                   category: 'tier'        },
  { id: 'b007', name: 'Sommelier Distinction', color: '#B8860B', description: 'Reached Sommelier tier (2,500 XP).',                     category: 'tier'        },
  { id: 'b008', name: 'Grand Patron',          color: '#8B0000', description: 'Achieved Patron status — the pinnacle of the Lounge.',   category: 'tier'        },
  { id: 'b009', name: 'Night Owl',             color: '#607D8B', description: 'Checked in after 10 PM at the Grand Lounge.',            category: 'activity'    },
  { id: 'b010', name: 'Travel Pioneer',        color: '#00BCD4', description: 'Completed your first DayOne360 travel experience.',       category: 'achievement' },
]
