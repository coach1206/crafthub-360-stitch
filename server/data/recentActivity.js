/**
 * Canonical recent-activity seed data.
 * Used to pre-populate the in-memory activity log in rankingController.
 * Field schema matches what the frontend Leaderboard.jsx expects.
 */
export const recentActivity = [
  {
    id:          'activity-event-entry',
    type:        'event-entry',
    title:       'Event Entry',
    description: 'Cigar & Cognac Collectors Night',
    xp:          50,
    timestamp:   '34 min ago',
    badgeId:     'b003',
    sourceId:    'event-cigar-cognac',
    icon:        'event',
  },
  {
    id:          'activity-connection-verified',
    type:        'connection-verified',
    title:       'Connection Verified',
    description: 'Connected with Rafael Cienfuegos',
    xp:          75,
    timestamp:   '1 hr ago',
    badgeId:     'b002',
    sourceId:    'member-rafael-cienfuegos',
    icon:        'verified',
  },
  {
    id:          'activity-profile-check',
    type:        'profile-check',
    title:       'Profile Check',
    description: 'Adrian Moreau viewed your passport',
    xp:          25,
    timestamp:   '1 hr ago',
    badgeId:     null,
    sourceId:    'member-adrian-moreau',
    icon:        'visibility',
  },
  {
    id:          'activity-craft-stamp',
    type:        'craft-stamp',
    title:       'Craft Stamp Earned',
    description: 'Collector Night Stamp',
    xp:          100,
    timestamp:   '2 hr ago',
    badgeId:     'b004',
    sourceId:    'stamp-collector-night',
    icon:        'workspace_premium',
  },
  {
    id:          'activity-vip-stamp',
    type:        'vip-stamp',
    title:       'VIP Stamp Unlocked',
    description: 'VIP access unlocked — Grand Lounge',
    xp:          150,
    timestamp:   '2 hr ago',
    badgeId:     'b005',
    sourceId:    'stamp-vip-grand-lounge',
    icon:        'stars',
  },
]
