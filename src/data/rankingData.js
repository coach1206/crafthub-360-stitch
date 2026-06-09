/**
 * Canonical ranking data — mirrors server/controllers/rankingController.js and
 * server/data/recentActivity.js. Keep IDs, names, tier thresholds in sync.
 */

export const RANKING_DATA = {
  venueId:       'grand-lounge',
  venueName:     'Grand Lounge',
  sessionName:   "Tonight's Ranking",
  currentUserId: 'user-john-collins',
  updatedAt:     new Date().toISOString(),

  users: [
    { id: 'user-sebastian-harrow',  rank: 1,  name: 'Sebastian Harrow',  initials: 'SH', hue: 45,  xp: 1740, tier: 'Connoisseur', progressPercent: 88, badgeType: 'gold-crown',        isCurrentUser: false, recentActions: ['Won top ranking', 'Craft stamp earned']    },
    { id: 'user-marco-del-valle',   rank: 2,  name: 'Marco Del Valle',   initials: 'MD', hue: 30,  xp: 1580, tier: 'Connoisseur', progressPercent: 78, badgeType: 'silver-medal',       isCurrentUser: false, recentActions: ['Event entry', 'Verified connection']        },
    { id: 'user-vincent-ashworth',  rank: 3,  name: 'Vincent Ashworth',  initials: 'VA', hue: 200, xp: 1285, tier: 'Connoisseur', progressPercent: 68, badgeType: 'bronze-medal',       isCurrentUser: false, recentActions: ['Humidor check-in']                         },
    { id: 'user-rafael-cienfuegos', rank: 4,  name: 'Rafael Cienfuegos', initials: 'RC', hue: 160, xp: 1100, tier: 'Connoisseur', progressPercent: 57, badgeType: 'bronze-ring',        isCurrentUser: false, recentActions: ['Profile check']                            },
    { id: 'user-john-collins',      rank: 5,  name: 'John M Collins',    initials: 'JC', hue: 45,  xp: 950,  tier: 'Aficionado',  progressPercent: 47, badgeType: 'current-user-gold',  isCurrentUser: true,  recentActions: ['Connection verified', 'Craft stamp earned']  },
    { id: 'user-adrian-moreau',     rank: 6,  name: 'Adrian Moreau',     initials: 'AM', hue: 290, xp: 820,  tier: 'Aficionado',  progressPercent: 41, badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
    { id: 'user-daniel-torres',     rank: 7,  name: 'Daniel Torres',     initials: 'DT', hue: 100, xp: 730,  tier: 'Aficionado',  progressPercent: 36, badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
    { id: 'user-luca-santoro',      rank: 8,  name: 'Luca Santoro',      initials: 'LS', hue: 210, xp: 610,  tier: 'Aficionado',  progressPercent: 30, badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
    { id: 'user-james-whitaker',    rank: 9,  name: 'James Whitaker',    initials: 'JW', hue: 50,  xp: 540,  tier: 'Aficionado',  progressPercent: 27, badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
    { id: 'user-patrick-bishop',    rank: 10, name: 'Patrick Bishop',    initials: 'PB', hue: 180, xp: 420,  tier: 'Aficionado',  progressPercent: 21, badgeType: 'aficionado',         isCurrentUser: false, recentActions: []                                           },
  ],

  tiers: [
    { id: 'tier-aficionado',  name: 'Aficionado',  minXp: 0,    maxXp: 999,  color: '#C9A84C', badge: 'aficionado',  description: 'Entry rank for verified Grand Lounge participants.'              },
    { id: 'tier-connoisseur', name: 'Connoisseur', minXp: 1000, maxXp: 2499, color: '#D4820A', badge: 'connoisseur', description: 'Recognized member with deeper tasting and pairing access.'      },
    { id: 'tier-sommelier',   name: 'Sommelier',   minXp: 2500, maxXp: 4999, color: '#B8860B', badge: 'sommelier',   description: 'Elite member with curated pairing and event privileges.'         },
    { id: 'tier-patron',      name: 'Patron',      minXp: 5000, maxXp: null, color: '#8B0000', badge: 'patron',      description: 'Highest status tier with premium access and private benefits.'   },
  ],
}

// ── Recent activity — matches server/data/recentActivity.js schema ────────────
export const RECENT_RANKING_ACTIVITY = [
  { id: 'activity-event-entry',        type: 'event-entry',        title: 'Event Entry',         description: 'Cigar & Cognac Collectors Night',    xp: 50,  timestamp: '34 min ago', badgeId: 'b003',          sourceId: 'event-cigar-cognac',        icon: 'event'             },
  { id: 'activity-connection-verified',type: 'connection-verified', title: 'Connection Verified',  description: 'Connected with Rafael Cienfuegos',   xp: 75,  timestamp: '1 hr ago',   badgeId: 'b002',          sourceId: 'member-rafael-cienfuegos',  icon: 'verified'          },
  { id: 'activity-profile-check',      type: 'profile-check',      title: 'Profile Check',        description: 'Adrian Moreau viewed your passport', xp: 25,  timestamp: '1 hr ago',   badgeId: null,            sourceId: 'member-adrian-moreau',      icon: 'visibility'        },
  { id: 'activity-craft-stamp',        type: 'craft-stamp',        title: 'Craft Stamp Earned',   description: 'Collector Night Stamp',              xp: 100, timestamp: '2 hr ago',   badgeId: 'b004',          sourceId: 'stamp-collector-night',     icon: 'workspace_premium' },
  { id: 'activity-vip-stamp',          type: 'vip-stamp',          title: 'VIP Stamp Unlocked',   description: 'VIP access unlocked — Grand Lounge', xp: 150, timestamp: '2 hr ago',   badgeId: 'b005',          sourceId: 'stamp-vip-grand-lounge',    icon: 'stars'             },
]

// ── Badge catalog (frontend copy) ─────────────────────────────────────────────
export const BADGES_DATA = [
  { id: 'b-gold-crown',    name: 'Gold Crown',            color: '#C9A84C', category: 'Ranking',     description: 'Awarded to the top ranked member of the night.',          visualType: 'metallic-gold'    },
  { id: 'b-silver-medal',  name: 'Silver Medal',          color: '#C0C0C0', category: 'Ranking',     description: 'Awarded to the second ranked member.',                    visualType: 'metallic-silver'  },
  { id: 'b-bronze-medal',  name: 'Bronze Medal',          color: '#CD7F32', category: 'Ranking',     description: 'Awarded to the third ranked member.',                     visualType: 'metallic-bronze'  },
  { id: 'b003',            name: 'Event Entry',           color: '#4A90D9', category: 'Event',       description: 'Earned by checking into a verified Grand Lounge event.',  visualType: 'navy-gold'        },
  { id: 'b002',            name: 'Connection Verified',   color: '#4CAF90', category: 'Connection',  description: 'Earned when a Passport connection is verified.',          visualType: 'green-gold'       },
  { id: 'b-profile-check', name: 'Profile Check',         color: '#607D8B', category: 'Profile',     description: 'Earned when another member views your Passport.',         visualType: 'slate-gold'       },
  { id: 'b004',            name: 'Craft Stamp Earned',    color: '#D4820A', category: 'Craft',       description: 'Earned after completing a SmokeCraft tasting or pairing.', visualType: 'bronze-gold'     },
  { id: 'b005',            name: 'VIP Stamp Unlocked',    color: '#9C27B0', category: 'VIP',         description: 'Earned by unlocking VIP-level access at the venue.',      visualType: 'burgundy-gold'    },
  { id: 'b006',            name: 'Connoisseur Ascent',    color: '#D4820A', category: 'Tier',        description: 'Reached Connoisseur tier (1,000 XP).',                    visualType: 'amber-gold'       },
  { id: 'b007',            name: 'Sommelier Distinction', color: '#B8860B', category: 'Tier',        description: 'Reached Sommelier tier (2,500 XP).',                      visualType: 'dark-gold'        },
  { id: 'b008',            name: 'Grand Patron',          color: '#8B0000', category: 'Tier',        description: 'Achieved Patron status — the pinnacle of the Lounge.',    visualType: 'crimson-gold'     },
  { id: 'b009',            name: 'Night Owl',             color: '#607D8B', category: 'Activity',    description: 'Checked in after 10 PM at the Grand Lounge.',             visualType: 'slate-gold'       },
  { id: 'b010',            name: 'Travel Pioneer',        color: '#00BCD4', category: 'Achievement',  description: 'Completed your first DayOne360 travel experience.',        visualType: 'teal-gold'       },
]
